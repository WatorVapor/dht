'use strict';
const redis = require('redis');
const redisOption = {
  path:'/dev/shm/dht.ermu.api.redis.sock'
};
const crypto = require('crypto');
const RIPEMD160 = require('ripemd160');
const base32 = require("base32.js");
const bs32Option = { type: "crockford", lc: true };
const https = require('https');
process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = 0;
const serverListenChannale = 'dht.ermu.api.server.listen';
const iConstMaxResultsOnce = 20;

const BufferList = require('bl/BufferList');
const ipfsClient = require('ipfs-http-client');
const ipfsOption = {
  cidVersion:1
};


class DHTRedis {
  constructor(serverChannel) {
    console.log('DHTRedis::constructor');
    this.connectIpfsNode_();

    if(serverChannel) {
      this.serverChannel_ = serverChannel;
    }
    this.apiChannel_ = this.calcCallBackHash_(this);
    this.subscriber_ = redis.createClient(redisOption);
    this.subscriber_.subscribe(this.apiChannel_);    
    const self = this;
     this.subscriber_.on('message',(channel,message) => {
      self.onMsg_(message);
    });
    this.publisher_ = redis.createClient(redisOption);   
    this.cb_ = {};
  }
  peerInfo(cb) {
    console.log('DHTRedis::peerInfo');
    const msg = {peerInfo:'get'};
    const cbTag = this.writeData_(msg);
    this.cb_[cbTag] = cb;
  }
  append(key,data,rank,cb) {
    //console.log('DHTRedis::append key=<',key,'>');
    //console.log('DHTRedis::append data=<',data,'>');
    const msg = {
      store:'append',
      key:key,
      rank:rank,
      data:data
    };
    const cbTag = this.writeData_(msg);
    this.cb_[cbTag] = cb;
  }
  fetch4KeyWord(keyWord,cb) {
    console.log('DHTRedis::fetch4KeyWord keyWord=<',keyWord,'>');
    const msg = {
      fetch:'keyWord',
      keyWord:keyWord
    };
    const cbTag = this.writeData_(msg);
    this.cb_[cbTag] = cb;    
  }
  fetch4KeyWordCache(keyWord,begin,end,cb) {
    console.log('DHTRedis::fetch4KeyWordCache keyWord=<',keyWord,'>');
    const msg = {
      fetch:'keyWordCache',
      keyWord:keyWord,
      begin:begin,
      end:end
    };
    const cbTag = this.writeData_(msg);
    this.cb_[cbTag] = cb;    
  }
  
  addIPFS(content,cb) {
    //console.log('DHTRedis::addIPFS content=<',content,'>');
    const msg = {
      store:'ipfs',
      ipfs:content
    };
    const cbTag = this.writeData_(msg);
    this.cb_[cbTag] = cb;    
  }


  async connectIpfsNode_() {
    this.ipfs_ = ipfsClient({ host: 'localhost', port: '5001', protocol: 'http' });
    const identity = await this.ipfs_.id();
    console.log('DHTRedis::connectIpfsNode_: identity.id=<',identity.id,'>');
  }

  
  onError_(err) {
    console.log('DHTRedis::onError_ err=<',err,'>');
  }
  onMsg_(msg) {
    //console.log('DHTRedis::onMsg_ msg=<',msg.toString('utf-8'),'>');
    try {
      const jMsg = JSON.parse(msg.toString());
      //console.log('DHTRedis::onMsg_ jMsg=<',jMsg,'>');
      if(jMsg) {
        if(jMsg.peerInfo) {
          this.onPeerInfo_(jMsg);
        } else if(jMsg.fetchResp) {
          this.onFetchResp_(jMsg);
        } else if(jMsg.store) {
          this.onStoreResp_(jMsg);
        } else {
          console.log('DHTRedis::onMsg_ jMsg=<',jMsg,'>');
        }
      } else {
        console.log('DHTRedis::onMsg_ jMsg=<',jMsg,'>');
      }
    } catch(e) {
      console.log('DaemonRedis::onMsg_::::e=<',e,'>');
    }
  }
  writeData_(msg) {
    const cbtag = this.calcCallBackHash_(msg);
    msg.cb = cbtag;
    msg.channel = this.apiChannel_;
    const msgBuff = Buffer.from(JSON.stringify(msg),'utf-8');
    try {
      if(this.serverChannel_) {
        this.publisher_.publish(this.serverChannel_,msgBuff);
      } else {
        this.publisher_.publish(serverListenChannale,msgBuff);        
      }
    } catch (e) {
      console.log('writeData_::fetch e=<',e,'>');
    }
    return cbtag;
  }
  calcCallBackHash_(msg) {
    let now = new Date();
    const cbHash = crypto.randomBytes(256).toString('hex') + JSON.stringify(msg) + now.toGMTString() + now.getMilliseconds() ;
    const cbRipemd = new RIPEMD160().update(cbHash).digest('hex');
    const cbBuffer = Buffer.from(cbRipemd,'hex');
    return base32.encode(cbBuffer,bs32Option);
  }
  getAddress(resourceKey) {
    const resourceRipemd = new RIPEMD160().update(resourceKey).digest('hex');
    const resourceBuffer = Buffer.from(resourceRipemd,'hex');
    return base32.encode(resourceBuffer,bs32Option);
    return 
  }
  
  onPeerInfo_(jMsg) {
    if( typeof this.cb_[jMsg.cb] === 'function') {
      this.cb_[jMsg.cb](jMsg.peerInfo);
    } else {
      console.log('DHTRedis::onPeerInfo_ jMsg=<',jMsg,'>');
      console.log('DHTRedis::onPeerInfo_ this.cb_=<',this.cb_,'>');
    }
  }
  onStoreResp_(jMsg) {
    //console.log('DHTRedis::onStoreResp_ jMsg=<',jMsg,'>');
    if( typeof this.cb_[jMsg.cb] === 'function') {
      this.cb_[jMsg.cb](jMsg.result);
    } else {
      console.log('DHTRedis::onStoreResp_ jMsg=<',jMsg,'>');
      console.log('DHTRedis::onStoreResp_ this.cb_=<',this.cb_,'>');
    }
  }

  async onFetchResp_(jMsg) {
    console.log('DHTRedis::onFetchResp_ jMsg=<',jMsg,'>');
    if(jMsg.fetchResp && jMsg.cb) {
      if(typeof this.cb_[jMsg.cb] === 'function') {
        const respObj = Object.assign({},jMsg.fetchResp);
        respObj.address = jMsg.address;
        this.cb_[jMsg.cb](respObj);
      }
      if(jMsg.fetchResp.results) {
        //console.log('DHTRedis::onFetchResp_ jMsg.fetchResp.results=<',jMsg.fetchResp.results,'>');
        const summaryResult = {};
        for(const cid of jMsg.fetchResp.results) {
          //console.log('DHTRedis::onFetchResp_ cid=<',cid,'>');
          const summary = await this.fetchIpfsContents_(cid,jMsg.address);
          //console.log('DHTRedis::onFetchResp_ summary=<',summary,'>');
          summaryResult[cid] = summary;
        }
        //console.log('DHTRedis::onFetchResp_ ipfsResult=<',ipfsResult,'>');
        this.cb_[jMsg.cb]({summaryResult:summaryResult});
      }
    }
    
    /*
    const peers = jMsg.fetchResp.peers;
    if(peers) {
      const address = jMsg.address;
      for(const keyAddress in peers) {
        //console.log('DHTRedis::onFetchResp_:: keyAddress=<',keyAddress,'>');
        const uriStats = peers[keyAddress] + '/' + address + '?stats=1';
        //console.log('DHTRedis::onFetchResp_:: uriStats=<',uriStats,'>');
        const self = this;
        this.requestURI_(uriStats,(data) => {
          try {
            const jDataStats = JSON.parse(data);
            //console.log('DHTRedis::onFetchResp_:: jDataStats=<',jDataStats,'>');
            const uri = peers[keyAddress] + '/' + address;
            self.onFetchResourceStats_(jDataStats,peers[keyAddress],uri,jMsg.cb,keyAddress);
          }catch(e) {
            console.log('DHTRedis::onFetchResp_:: e=<',e,'>');
          }
        });
      }
    }
    */
  }
  async fetchIpfsContents_(cid,addressKeyWord) {
    const self = this;
    for await (const file of this.ipfs_.get(cid)) {
      //console.log('DHTRedis::fetchIpfsContents_ file=<',file,'>');
      const content = new BufferList()
      for await (const chunk of file.content) {
        content.append(chunk);
      }
      //console.log('DHTRedis::fetchIpfsContents_ content.toString()=<',content.toString(),'>');
      const jContens = JSON.parse(content.toString());
      //console.log('DHTRedis::fetchIpfsContents_ jContens=<',jContens,'>');
      for(const word in jContens) {
        //console.log('DHTRedis::fetchIpfsContents_ word=<',word,'>');
        const address = self.getAddress(word);
        //console.log('DHTRedis::fetchIpfsContents_ address=<',address,'>');
        if(address === addressKeyWord) {
          return jContens[word];
        }
      }
    }
    return {};
  }
  /*
  onFetchResourceStats_(jDataStats,rootURL,url,cb,keyAddress) {
    //console.log('DHTRedis::onFetchResourceStats_:: jDataStats=<',jDataStats,'>');
    //console.log('DHTRedis::onFetchResourceStats_:: url=<',url,'>');
    //console.log('DHTRedis::onFetchResourceStats_:: cb=<',cb,'>');
    //console.log('DHTRedis::onFetchResourceStats_:: keyAddress=<',keyAddress,'>');
    const maxResouces = jDataStats.stats.maxResouces;
    const self = this;
    for(let start = 0;start < maxResouces;start += iConstMaxResultsOnce) {
      const resourceCache = url + `?start=${start}&count=${iConstMaxResultsOnce}`;
      //console.log('DHTRedis::onFetchResourceStats_:: resourceCache=<',resourceCache,'>');
      this.requestURI_(resourceCache,(data)=>{
        const jDataResource = JSON.parse(data);
        //console.log('DHTRedis::onFetchResourceStats_:: jDataResource=<',jDataResource,'>');
        self.onFetchResource_(jDataResource,rootURL,cb,keyAddress);
      })
    }
  }
  
  
  
  onFetchResource_(jData,urlRoot,cb,keyAddress) {
    console.log('DHTRedis::onFetchResource_:: jData=<',jData,'>');
    console.log('DHTRedis::onFetchResource_:: urlRoot=<',urlRoot,'>');
    //console.log('DHTRedis::onFetchResource_:: cb=<',cb,'>');
    const self = this;
    for(const address of jData) {
      //console.log('DHTRedis::onFetchResource_:: address=<',address,'>');
      const uri = urlRoot + '/' + address;
      console.log('DHTRedis::onFetchResource_:: uri=<',uri,'>');
      this.requestURI_(uri,(data)=> {
        //console.log('DHTRedis::onFetchResource_:: data=<',data,'>');
        self.onFetchResourceData_(data,address,keyAddress,cb);
      });
    }
  }
  onFetchResourceData_(data,address,keyAddress,cb) {
    //console.log('DHTRedis::onFetchResourceData_:: data=<',data,'>');
    //console.log('DHTRedis::onFetchResourceData_:: cb=<',cb,'>');
    if( typeof this.cb_[cb] === 'function') {
      const resource = {
        data:data,
        keyAddress:keyAddress,
        address:address
      }
      this.cb_[cb](resource);
    } else {
      console.log('DHTRedis::onFetchResourceData_ cb=<',cb,'>');
      console.log('DHTRedis::onFetchResourceData_ this.cb_=<',this.cb_,'>');
    }
  }
  
  requestURI_(uri,cb) {
    const request = https.get(uri, (res) => {
      let data = '';
      res.on('data', (d) => {
        //console.log('DHTRedis::requestURI_:: d=<',d,'>');
        data += d.toString('utf-8');
      });
      res.on('end', () => {
        //console.log('DHTRedis::requestURI_:: data=<',data,'>');
        cb(data);
      });
    });
    request.on('error', (e) => {
      console.log('DHTRedis::requestURI_:: e=<',e,'>');
    })    
  }
  */
}

module.exports = DHTRedis;

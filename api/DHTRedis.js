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

class DHTRedis {
  constructor(serverChannel) {
    console.log('DHTRedis::constructor');
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
  append(key,data,cb) {
    //console.log('DHTRedis::append key=<',key,'>');
    //console.log('DHTRedis::append data=<',data,'>');
    const msg = {
      store:'append',
      key:key,
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

  onFetchResp_(jMsg) {
    console.log('DHTRedis::onFetchResp_ jMsg=<',jMsg,'>');
    if(jMsg.stats && jMsg.stats.maxPeers) {
      console.log('DHTRedis::onFetchResp_ jMsg.stats.maxPeers=<',jMsg.stats.maxPeers,'>');
    }
    
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
  }
  
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
}

module.exports = DHTRedis;

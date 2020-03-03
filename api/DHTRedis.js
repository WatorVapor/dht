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

const DHTLevelDB = require('./DHTLevelDB.js');


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
    this.dhtLevel_ = new DHTLevelDB();
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
        for(const cid of jMsg.fetchResp.results) {
          //console.log('DHTRedis::onFetchResp_ cid=<',cid,'>');
          const summary = await this.fetchContents_(cid,jMsg.address);
          //console.log('DHTRedis::onFetchResp_ summary=<',summary,'>');
          const summaryResult = {};
          summaryResult[cid] = summary;
          this.cb_[jMsg.cb]({summaryResult:summaryResult});
        }
      }
    }
 }
  async fetchContents_(cid,addressKeyWord) {
    console.log('DHTRedis::fetchContents_ cid=<',cid,'>');
    const self = this;
    const promise = new Promise((resolve) => {
      self.dhtLevel_.get(cid,(info)=>{
        console.log('DHTRedis::fetchContents_ info=<',info,'>');
        resolve(info);
      });      
    });
    return promise;
  }
}

module.exports = DHTRedis;

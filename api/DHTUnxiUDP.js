'use strict';
const net = require('net');
const RIPEMD160 = require('ripemd160');
const base32 = require("base32.js");
const API_DOMAIN_PATH = '/tmp/dht_ermu_api_unix_dgram';
const StreamJson = require('./StreamJson.js');
const bs32Option = { type: "crockford", lc: true };
const https = require('https');
process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = 0;

class DHTUnxiUDP {
  constructor() {
    console.log('DHTUnxiUDP::constructor');
    this.client_ = net.createConnection(API_DOMAIN_PATH);
    this.client_.setNoDelay();
    const self = this;
    this.client_.on('error', (err) => {
      self.onError_(err);
    });
    this.client_.on('data', (data) => {
      self.onMsg_(data);
    });
    this.client_.on('drain', (data) => {
      self.sending_ = false;
    });
    this.cb_ = {};
    this.sending_ = false;
    this.sjson_ = new StreamJson();
  }
  peerInfo(cb) {
    console.log('DHTUnxiUDP::peerInfo');
    const msg = {peerInfo:'get'};
    const cbTag = this.writeData_(msg);
    this.cb_[cbTag] = cb;
  }
  append(key,data,cb) {
    console.log('DHTUnxiUDP::append key=<',key,'>');
    console.log('DHTUnxiUDP::append data=<',data,'>');
    const msg = {
      store:'append',
      key:key,
      data:data
    };
    const cbTag = this.writeData_(msg);
    this.cb_[cbTag] = cb;
  }
  fetch4KeyWord(keyWord,cb) {
    console.log('DHTUnixSocket::fetch4KeyWord keyWord=<',keyWord,'>');
    const msg = {
      fetch:'keyWord',
      keyWord:keyWord
    };
    const cbTag = this.writeData_(msg);
    this.cb_[cbTag] = cb;    
  }
  
  onError_(err) {
    console.log('DHTUnxiUDP::onError_ err=<',err,'>');
  }
  onMsg_(msg) {
    //console.log('DHTUnxiUDP::onMsg_ msg=<',msg.toString('utf-8'),'>');
    const jMsgArray = this.sjson_.parse(msg.toString());
    //console.log('DHTUnxiUDP::onMsg_ jMsgArray=<',jMsgArray,'>');
    for(const jMsg of jMsgArray ) {
      //console.log('DHTUnxiUDP::onMsg_ jMsg=<',jMsg,'>');
      if(jMsg) {
        if(jMsg.peerInfo) {
          this.onPeerInfo_(jMsg);
        } else if(jMsg.fetchResp) {
          this.onFetchResp_(jMsg);
        } else {
          console.log('DHTUnixSocket::onMsg_ jMsg=<',jMsg,'>');          
        }
      } else {
        console.log('DHTUnixSocket::onMsg_ jMsg=<',jMsg,'>');
      }
    }
  }
  writeData_(msg) {
    if(this.sending_) {
    }
    this.sending_ = true;
    const cbtag = this.calcCallBackHash_(msg);
    msg.cb = cbtag;
    const msgBuff = Buffer.from(JSON.stringify(msg),'utf-8');
    try {
      this.client_.write(msgBuff);
    } catch (e) {
      console.log('writeData_::fetch e=<',e,'>');
    }
    return cbtag;
  }
  calcCallBackHash_(msg) {
    let now = new Date();
    const cbHash = JSON.stringify(msg) + now.toGMTString() + now.getMilliseconds();
    const cbRipemd = new RIPEMD160().update(cbHash).digest('hex');
    const cbBuffer = Buffer.from(cbRipemd,'hex');
    return base32.encode(cbBuffer,bs32Option);
  }
  
  onPeerInfo_(jMsg) {
    if( typeof this.cb_[jMsg.cb] === 'function') {
      this.cb_[jMsg.cb](jMsg.peerInfo);
    } else {
      console.log('DHTUnixSocket::onPeerInfo_ jMsg=<',jMsg,'>');
      console.log('DHTUnixSocket::onPeerInfo_ this.cb_=<',this.cb_,'>');
    }
  }

  onFetchResp_(jMsg) {
    //console.log('DHTUnixSocket::onFetchResp_ jMsg=<',jMsg,'>');
    const address = jMsg.address;
    for(const keyAddress in jMsg.fetchResp) {
      //console.log('DHTUnixSocket::onFetchResp_:: keyAddress=<',keyAddress,'>');
      const uri = jMsg.fetchResp[keyAddress] + '/' + address;
      //console.log('DHTUnixSocket::onFetchResp_:: uri=<',uri,'>');
      const self = this;
      this.requestURI_(uri,(data) => {
        try {
          const jData = JSON.parse(data);
          //console.log('DHTUnixSocket::onFetchResp_:: jData=<',jData,'>');
          self.onFetchResource_(jData,jMsg.fetchResp[keyAddress],jMsg.cb,keyAddress);
        }catch(e) {
          console.log('DHTUnixSocket::onFetchResp_:: e=<',e,'>');
        }
      });
    }
  }
  onFetchResource_(jData,url,cb,keyAddress) {
    //console.log('DHTUnixSocket::onFetchResource_:: jData=<',jData,'>');
    //console.log('DHTUnixSocket::onFetchResource_:: url=<',url,'>');
    //console.log('DHTUnixSocket::onFetchResource_:: cb=<',cb,'>');
    const self = this;
    for(const address of jData) {
      //console.log('DHTUnixSocket::onFetchResource_:: address=<',address,'>');
      const uri = url + '/' + address;
      //console.log('DHTUnixSocket::onFetchResource_:: uri=<',uri,'>');
      this.requestURI_(uri,(data)=> {
        //console.log('DHTUnixSocket::onFetchResource_:: data=<',data,'>');
        self.onFetchResourceData_(data,address,keyAddress,cb);
      });
    }
  }
  onFetchResourceData_(data,address,keyAddress,cb) {
    //console.log('DHTUnixSocket::onFetchResourceData_:: data=<',data,'>');
    //console.log('DHTUnixSocket::onFetchResourceData_:: cb=<',cb,'>');
    if( typeof this.cb_[cb] === 'function') {
      const resource = {
        data:data,
        keyAddress:keyAddress,
        address:address
      }
      this.cb_[cb](resource);
    } else {
      console.log('DHTUnixSocket::onFetchResp_ cb=<',cb,'>');
      console.log('DHTUnixSocket::onFetchResp_ this.cb_=<',this.cb_,'>');
    }
  }
  
  requestURI_(uri,cb) {
    const request = https.get(uri, (res) => {
      let data = '';
      res.on('data', (d) => {
        //console.log('DHTUnixSocket::requestURI_:: d=<',d,'>');
        data += d.toString('utf-8');
      });
      res.on('end', () => {
        //console.log('DHTUnixSocket::requestURI_:: data=<',data,'>');
        cb(data);
      });
    });
    request.on('error', (e) => {
      console.log('DHTUnixSocket::requestURI_:: e=<',e,'>');
    })    
  }
}

module.exports = DHTUnixSocket

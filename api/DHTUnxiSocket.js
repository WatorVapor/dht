'use strict';
const net = require('net');
const RIPEMD160 = require('ripemd160');
const base32 = require("base32.js");
const API_DOMAIN_PATH = '/tmp/dht_ermu_api_unix_dgram';
const StreamJson = require('./StreamJson.js');
const bs32Option = { type: "crockford", lc: true };

class DHTUnixSocket {
  constructor() {
    console.log('DHTUnixSocket::constructor');
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
    console.log('DHTUnixSocket::peerInfo');
    const msg = {peerInfo:'get'};
    const cbTag = this.writeData_(msg);
    this.cb_[cbTag] = cb;
  }
  append(key,data,cb) {
    console.log('DHTUnixSocket::append key=<',key,'>');
    console.log('DHTUnixSocket::append data=<',data,'>');
    const msg = {
      store:'append',
      key:key,
      data:data
    };
    const cbTag = this.writeData_(msg);
    this.cb_[cbTag] = cb;
  }
  fetch4KeyWord(keyWord) {
    console.log('DHTUnixSocket::fetch4KeyWord keyWord=<',keyWord,'>');
    const msg = {
      fetch:'keyWord',
      keyWord:keyWord
    };
    const cbTag = this.writeData_(msg);
    this.cb_[cbTag] = cb;    
  }
  
  onError_(err) {
    console.log('DHTUnixSocket::onError_ err=<',err,'>');
  }
  onMsg_(msg) {
    //console.log('DHTUnixSocket::onMsg_ msg=<',msg.toString('utf-8'),'>');
    //const jMsg = JSON.parse(msg.toString());
    const jMsgArray = this.sjson_.parse(msg.toString());
    //console.log('DHTUnixSocket::onMsg_ jMsgArray=<',jMsgArray,'>');
    for(const jMsg of jMsgArray ) {
      console.log('DHTUnixSocket::onMsg_ jMsg_=<',jMsg,'>');
      if(jMsg && jMsg.cb) {
        if( typeof this.cb_[jMsg.cb] === 'function') {
          this.cb_[jMsg.cb](jMsg);
        } else {
          console.log('DHTUnixSocket::onMsg_ jMsg=<',jMsg,'>');
          console.log('DHTUnixSocket::onMsg_ this.cb_=<',this.cb_,'>');
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
}

module.exports = DHTUnixSocket;

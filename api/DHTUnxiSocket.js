'use strict';
const net = require('net');
const API_DOMAIN_PATH = '/tmp/dht_ermu_api_unix_dgram';
const StreamJson = require('./StreamJson.js');

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
    this.writeData_(msg);
    this.cb_['peerInfo'] = cb;
  }
  append(key,data,cb) {
    console.log('DHTUnixSocket::append key=<',key,'>');
    console.log('DHTUnixSocket::append data=<',data,'>');
    const msg = {
      store:'append',
      key:key,
      data:data
    };
    this.writeData_(msg);
    this.cb_['store'] = cb;
  }
  fetch4KeyWord(keyWord) {
    console.log('DHTUnixSocket::fetch4KeyWord keyWord=<',keyWord,'>');
    const msg = {
      fetch:'keyWord',
      keyWord:keyWord
    };
    this.writeData_(msg);
    this.cb_['fetch'] = cb;
  }
  
  onError_(err) {
    console.log('DHTUnixSocket::onError_ err=<',err,'>');
  }
  onMsg_(msg) {
    //console.log('DHTUnixSocket::onMsg_ msg=<',msg.toString('utf-8'),'>');
    //const jMsg = JSON.parse(msg.toString());
    const jMsgs = this.sjson_.parse(msg.toString());
    //console.log('DHTUnixSocket::onMsg_ jMsg=<',jMsg,'>');
    for(const jMsg of jMsgs ) {
      if(jMsg && jMsg.peerInfo) {
        if( typeof this.cb_['peerInfo'] === 'function') {
          this.cb_['peerInfo'](jMsg.peerInfo);
        }
      }
    }
  }
  writeData_(msg) {
    if(this.sending_) {
    }
    this.sending_ = true;
    const msgBuff = Buffer.from(JSON.stringify(msg),'utf-8');
    try {
      this.client_.write(msgBuff);
    } catch (e) {
      console.log('writeData_::fetch e=<',e,'>');
    }
  }
}

module.exports = DHTUnixSocket;

'use strict';
/*
const UnixDomainUdp = require('unix-dgram');
const API_DOMAIN_PATH = '/tmp/dht_ermu_api_unix_dgram';

class DHTApi {
  constructor() {
    console.log('DHTApi::constructor>');
    this.client_ = UnixDomainUdp.createSocket('unix_dgram');
    const self = this;
    this.client_.on('error', (err) => {
      self.onError_(err);
    });
  }
  peerInfo() {
    console.log('DHTApi::peerInfo>');
    const msg = {peerInfo:'get'};
    const msgBuff = Buffer.from(JSON.stringify(msg),'utf-8');
    try {
      this.client_.send(msgBuff,0,msgBuff.length,API_DOMAIN_PATH);
    } catch (e) {
      
    }
  }
  append(key,data) {
    console.log('DHTApi::append key=<',key,'>');
    console.log('DHT::append data=<',data,'>');
  }
  fetch4KeyWord(keyWord) {
    console.log('DHTApi::fetch4KeyWord keyWord=<',keyWord,'>');
  }
  
  onError_(err) {
    console.log('DHTApi::onError_ err=<',err,'>');
  }
  
}
*/
const net = require('net');
const API_DOMAIN_PATH = '/tmp/dht_ermu_api_unix_dgram';

class DHTApi {
  constructor() {
    console.log('DHTApi::constructor>');
    this.client_ = net.createConnection(API_DOMAIN_PATH);
    const self = this;
    this.client_.on('error', (err) => {
      self.onError_(err);
    });
    this.client_.on('data', (data) => {
      self.onMsg_(data);
    });
    this.cb_ = {};
  }
  peerInfo(cb) {
    console.log('DHTApi::peerInfo>');
    const msg = {peerInfo:'get'};
    const msgBuff = Buffer.from(JSON.stringify(msg),'utf-8');
    try {
      this.client_.write(msgBuff);
    } catch (e) {
      console.log('DHTApi::peerInfo e=<',e,'>');
    }
    this.cb_['peerInfo'] = cb;
  }
  append(key,data) {
    console.log('DHTApi::append key=<',key,'>');
    console.log('DHT::append data=<',data,'>');
  }
  fetch4KeyWord(keyWord) {
    console.log('DHTApi::fetch4KeyWord keyWord=<',keyWord,'>');
  }
  
  onError_(err) {
    console.log('DHTApi::onError_ err=<',err,'>');
  }
  onMsg_(msg) {
    //console.log('DHTApi::onMsg_ msg=<',msg.toString('utf-8'),'>');
    const jMsg = JSON.parse(msg.toString());
    //console.log('onData::jMsg=<',jMsg,'>');
    if(jMsg && jMsg.peerInfo) {
      if( typeof this.cb_['peerInfo'] === 'function') {
        this.cb_['peerInfo'](jMsg.peerInfo);
      }
    }
  }
  
}

module.exports = DHTApi;

'use strict';
const net = require('net');
const API_DOMAIN_PATH = '/tmp/dht_ermu_api_unix_dgram';

class DHTUnixSocket {
  constructor() {
    console.log('DHTUnixSocket::constructor>');
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
    console.log('DHTUnixSocket::peerInfo>');
    const msg = {peerInfo:'get'};
    const msgBuff = Buffer.from(JSON.stringify(msg),'utf-8');
    try {
      this.client_.write(msgBuff);
    } catch (e) {
      console.log('DHTUnixSocket::peerInfo e=<',e,'>');
    }
    this.cb_['peerInfo'] = cb;
  }
  append(key,data) {
    console.log('DHTUnixSocket::append key=<',key,'>');
    console.log('DHTUnixSocket::append data=<',data,'>');
  }
  fetch4KeyWord(keyWord) {
    console.log('DHTUnixSocket::fetch4KeyWord keyWord=<',keyWord,'>');
  }
  
  onError_(err) {
    console.log('DHTUnixSocket::onError_ err=<',err,'>');
  }
  onMsg_(msg) {
    //console.log('DHTUnixSocket::onMsg_ msg=<',msg.toString('utf-8'),'>');
    const jMsg = JSON.parse(msg.toString());
    //console.log('DHTUnixSocket::onMsg_ jMsg=<',jMsg,'>');
    if(jMsg && jMsg.peerInfo) {
      if( typeof this.cb_['peerInfo'] === 'function') {
        this.cb_['peerInfo'](jMsg.peerInfo);
      }
    }
  }
}

module.exports = DHTUnixSocket;

'use strict';
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
    const msgStr = JSON.stringify(msg);
    this.client_.send(msgStr,msgStr.length,API_DOMAIN_PATH);
  }
  append(key,data) {
    console.log('DHTApi::append key=<',key,'>');
    console.log('DHT::append data=<',data,'>');
  }
  fetch4KeyWord(keyWord) {
    console.log('DHTApi::fetch4KeyWord keyWord=<',keyWord,'>');
  }
  
  onError_(err) {
    console.log('DHTApi::append err=<',err,'>');
  }
  
}
module.exports = DHTApi;

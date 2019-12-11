'use strict';
const os = require('os');
const dgram = require("dgram");
const PeerCrypto = require('./peer.crypto.js');
const PeerNetWork = require('./peer.network.js');
const ResourceNetWork = require('./resource.network.js');
const ResourceStorage = require('./resource.storage.js');


class DHT {
  constructor(config) {
    this.crypto_ = new PeerCrypto(config);
    this.peer_ = new PeerNetWork(config);
    this.resource_ = new ResourceNetWork(config);
    this.storage_ = new ResourceStorage(config);
    this.info_ = {
      id:this.crypto_.idBS32,
      peer:{
        host:this.peer_.host(),
        port:this.peer_.port()
      },
      resource: {
        host:this.resource_.host(),
        port:this.resource_.port()
      }
    };
    //this.peer_.onPeerJoint = this.onPeerJoint_.bind(this);
  }
  peerInfo() {
    return this.info_;
  }
  append(key,data) {
    //console.log('DHT::append key=<',key,'>');
    //console.log('DHT::append data=<',data,'>');
    const dataStorage = this.storage_.append(key,data);
    //console.log('DHT::append dataStorage=<',dataStorage,'>');
    this.peer_.publish(dataStorage);
  }
  fetch4KeyWord(keyWord) {
    console.log('DHT::fetch4KeyWord keyWord=<',keyWord,'>');
    const responseToken = this.peer_.fetch4KeyWord(keyWord);
    console.log('DHT::fetch4KeyWord responseToken=<',responseToken,'>');
    return  responseToken;
  }
  
  
  // inside method.
  onPeerJoint_(peer) {
    console.log('DHT::onPeerJoint_ peer=<',peer,'>');
  }
}
module.exports = DHT;

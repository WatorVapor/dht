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
    this.info_ = {
      id:this.crypto_.idB58,
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
    console.log('DHT::append key=<',key,'>');
    console.log('DHT::append data=<',data,'>');
    const place = this.peer_.findPlace(key);
    console.log('DHT::append place=<',place,'>');
    place.append(data);
  }
  
  
  // inside method.
  onPeerJoint_(peer) {
    console.log('DHT::onPeerJoint_ peer=<',peer,'>');
  }
}
module.exports = DHT;

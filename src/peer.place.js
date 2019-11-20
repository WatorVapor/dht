'use strict';
//const ResourceNetWork = require('./resource.network.js');
//const ResourceStorage = require('./resource.storage.js');
const bs58 = require('bs58');

class PeerPlace {
  constructor(key,peers,crypto) {
    //console.log('PeerPlace::constructor key=<',key,'>');
    //console.log('PeerPlace::constructor peers=<',peers,'>');
    //console.log('PeerPlace::constructor crypto=<',crypto,'>');
    //this.key_ = key;
    //this.peers_ = peers;
    //this.crypto_ = crypto;
    this.address_ = crypto.calcResourceAddress(key);
    //console.log('PeerPlace::constructor this.address_=<',this.address_,'>');
    let maxDistance = 0.0;
    let nearPeer = '';
    let minDistance = 1.0;
    let fastPeer = '';
   for(const peer in peers) {
      //console.log('PeerPlace::constructor peer=<',peer,'>');
      const distance = this.calcDistance_(this.address_,peer);
      if(distance >= maxDistance) {
        nearPeer = peer;
        maxDistance = distance;
      }
      if(distance <= minDistance) {
        fastPeer = peer;
        minDistance = distance;
      }
    }
    this.near_ = nearPeer;
    this.fast_ = fastPeer;
  }
  append(data) {
    console.log('PeerPlace::append data=<',data,'>');
  }
  
  /*
  calcDistance_(address,peer) {
    //console.log('PeerPlace::calcDistance_ address=<',address,'>');
    //console.log('PeerPlace::calcDistance_ peer=<',peer,'>');
    const addressBuf = bs58.decode(address);
    const peerBuf = bs58.decode(peer);
    //console.log('PeerPlace::calcDistance_ addressBuf=<',addressBuf,'>');
    //console.log('PeerPlace::calcDistance_ peerBuf=<',peerBuf,'>');
    let distance = 0;
    for (let i = 0; i < addressBuf.length,i < peerBuf.length; i++) {
      const distanceElem = addressBuf[i] ^ peerBuf[i];
      //console.log('PeerPlace::calcDistance_ distanceElem=<',distanceElem,'>');
      distance += distanceElem;
    }
    console.log('PeerPlace::calcDistance_ distance=<',distance,'>');
    return 1.0 / parseFloat(distance);
  }
  */
  calcDistance_(address,peer) {
    //console.log('PeerPlace::calcDistance_ address=<',address,'>');
    //console.log('PeerPlace::calcDistance_ peer=<',peer,'>');
    const addressBuf = bs58.decode(address);
    const peerBuf = bs58.decode(peer);
    //console.log('PeerPlace::calcDistance_ addressBuf=<',addressBuf,'>');
    //console.log('PeerPlace::calcDistance_ peerBuf=<',peerBuf,'>');
    const distanceBuf = Buffer.alloc(peerBuf.length);
    for (let i = 0; i < addressBuf.length,i < peerBuf.length,i < distanceBuf.length; i++) {
      const distanceElem = addressBuf[i] ^ peerBuf[i];
      //console.log('PeerPlace::calcDistance_ distanceElem=<',distanceElem,'>');
      distanceBuf[i] = distanceElem;
    }
    console.log('PeerPlace::calcDistance_ distanceBuf=<',distanceBuf,'>');
    return distanceBuf.toString('hex');
  }


}

module.exports = PeerPlace;

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
    this.peers_ = [];
    //console.log('PeerPlace::constructor this.address_=<',this.address_,'>');
    let maxDistance = Buffer.alloc(this.address_.length);
    maxDistance.fill(0x0);
    //let maxDistance = '';
    let nearPeer = '';
    let minDistance = Buffer.alloc(this.address_.length);;
    minDistance.fill(0xff);
    //let minDistance = 'zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz';
    let fastPeer = ''
    const distanceZero = this.calcDistance_(this.address_,this.address_);
    console.log('PeerPlace::constructor distanceZero=<',distanceZero,'>');
    for(const peer in peers) {
      this.peers_.push(peer);
      //console.log('PeerPlace::constructor peer=<',peer,'>');
      const distance = this.calcDistance_(this.address_,peer);
      console.log('PeerPlace::constructor distance=<',distance,'>');
      //if(this.btBuff_(distance,maxDistance)) {
      if(distance > maxDistance) {
        nearPeer = peer;
        maxDistance = distance;
      }
      //if(this.ltBuff_(distance,minDistance)) {
      if(distance < minDistance) {
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
    //console.log('PeerPlace::calcDistance_ addressBuf=<',addressBuf.toString('hex'),'>');
    //console.log('PeerPlace::calcDistance_ peerBuf=<',peerBuf.toString('hex'),'>');
    const distanceBuf = Buffer.alloc(peerBuf.length);
    for (let i = 0; i < addressBuf.length,i < peerBuf.length,i < distanceBuf.length; i++) {
      const distanceElem = addressBuf[i] ^ peerBuf[i];
      //console.log('PeerPlace::calcDistance_ distanceElem=<',distanceElem,'>');
      distanceBuf[i] = distanceElem;
    }
    //console.log('PeerPlace::calcDistance_ distanceBuf=<',distanceBuf,'>');
    //return bs58.encode(distanceBuf);
    return distanceBuf.toString('hex');
  }
  
  btBuff_(a,b) {
    for (let i = 0; i < a.length,i < a.length,i < b.length; i++) {
      if(a[i] < b[i]) {
        return false;
      }
    }
    return true;
  }
  ltBuff_(a,b) {
    for (let i = 0; i < a.length,i < a.length,i < b.length; i++) {
      if(a[i] > b[i]) {
        return false;
      }
    }
    return true;
  }
  
}

module.exports = PeerPlace;

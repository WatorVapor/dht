'use strict';
const os = require('os');
const dgram = require("dgram");
const PeerCrypto = require('./peer.crypto.js');
const PeerNetWork = require('./peer.network.js');
const ResourceNetWork = require('./resource.network.js');
//const ResourceStorage = require('./resource.storage.js');
const ResourceOnIpfs = require('./resource.ipfs.js');


class DHT {
  constructor(config) {
    this.crypto_ = new PeerCrypto(config);
    this.peer_ = new PeerNetWork(config);
    this.resource_ = new ResourceNetWork(config);
    //this.storage_ = new ResourceStorage(config);
    this.storage_ = new ResourceOnIpfs(config);
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
  async append(key,ipfsAddress,rank,cbTag) {
    //console.log('DHT::append key=<',key,'>');
    console.log('DHT::append ipfsAddress=<',ipfsAddress,'>');
    //console.log('DHT::append rank=<',rank,'>');
    const keyAddress = await this.storage_.getAddress(key);
    //console.log('DHT::append dataStorage=<',dataStorage,'>');
    const dataStorage = {
      address:keyAddress,
      ipfs:ipfsAddress.cid,
      rank:rank,
      cb:cbTag
    }
    this.peer_.publish(dataStorage);
    return dataStorage;
  }
  
  async addIPFS(data,cb) {
    console.log('DHT::addIPFS cb=<',cb,'>');
    const dataStorage = await this.storage_.add(data);
    console.log('DHT::addIPFS dataStorage=<',dataStorage,'>');
    return dataStorage;
  }
  
  fetch4KeyWord(keyWord,cbTag,reply) {
    console.log('DHT::fetch4KeyWord keyWord=<',keyWord,'>');
    this.peer_.fetch4KeyWord(keyWord,cbTag,(responseToken)=>{
      console.log('DHT::fetch4KeyWord responseToken=<',responseToken,'>');
      reply(responseToken);      
    });
  }
  
  
  // inside method.
  onPeerJoint_(peer) {
    console.log('DHT::onPeerJoint_ peer=<',peer,'>');
  }
}
module.exports = DHT;

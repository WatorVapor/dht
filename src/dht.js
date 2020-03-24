'use strict';
const os = require('os');
const dgram = require("dgram");
const PeerCrypto = require('./peer.crypto.js');
const PeerNetWork = require('./peer.network.js');
const ResourceNetWork = require('./resource.network.js');
const ResourceStorage = require('./resource.dht.level.js');


class DHT {
  constructor(config) {
    this.crypto_ = new PeerCrypto(config);
    this.peer_ = new PeerNetWork(config);
    this.resource_ = new ResourceNetWork(config);
    this.storage_ = new ResourceStorage(config);
    this.info_ = {
      id:this.crypto_.id,
      peer:{
        host:this.peer_.host(),
        port:this.peer_.port()
      },
      resource: {
        host:this.resource_.host(),
        port:this.resource_.port()
      }
    };
    this.replyInvoke_ = {};
    this.peer_.onPeerJoint = this.onPeerJoint_.bind(this);
    this.peer_.onFetchResponse = this.onFetchResponse_.bind(this);
  }
  peerInfo() {
    return this.info_;
  }
  async append(key,addResource,rank,cbTag) {
    //console.log('DHT::append key=<',key,'>');
    console.log('DHT::append addResource=<',addResource,'>');
    //console.log('DHT::append rank=<',rank,'>');
    const keyAddress = await this.storage_.getAddress(key);
    //console.log('DHT::append dataStorage=<',dataStorage,'>');
    const dataStorage = {
      address:keyAddress,
      store:addResource,
      rank:rank,
      cb:cbTag
    }
    this.peer_.publish(dataStorage);
    return dataStorage;
  }
  
  async fetch4KeyWord(keyWord,cbTag,reply) {
    console.log('DHT::fetch4KeyWord keyWord=<',keyWord,'>');
    const keyAddress = await this.storage_.getAddress(keyWord);
    console.log('DHT::fetch4KeyWord keyAddress=<',keyAddress,'>');
    const fetchMessge = {
      address:keyAddress,
      fetch:true,
      cb:cbTag
    };
    const self = this;
    this.peer_.fetch4KeyWord(fetchMessge,(responseToken)=>{
      console.log('DHT::fetch4KeyWord responseToken=<',responseToken,'>');
      reply(responseToken);
    });
    this.replyInvoke_[cbTag] = reply;
  }

  
  // inside method.
  onPeerJoint_(peer) {
    console.log('DHT::onPeerJoint_ peer=<',peer,'>');
  }

  onFetchResponse_(remoteResource) {
    //console.log('DHT::onFetchResponse_ remoteResource=<',remoteResource,'>');
    //console.log('DHT::onFetchResponse_ this.replyInvoke_=<',this.replyInvoke_,'>');
    if(this.replyInvoke_) {
      const reply = this.replyInvoke_[remoteResource.cb];
      //console.log('DHT::onFetchResponse_ reply=<',reply,'>');
      if(typeof  reply === 'function') {
        const fetchResp = {
          fetchResp:remoteResource,
          address:remoteResource.address,
          local:true,
          cb:remoteResource.cb
        };
        reply(fetchResp);
      }
    }
  }
}
module.exports = DHT;

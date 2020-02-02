'use strict';
const fs = require('fs');
const path = require('path');
const jsrsasign = require('jsrsasign');
const RIPEMD160 = require('ripemd160');
const base32 = require("base32.js");
const bs32Option = { type: "crockford", lc: true };
const PeerMachine = require('./peer.machine.js');
const iConstPeersAtOneTime = 200;

class PeerStorage {
  constructor(config) {
    console.log('PeerStorage::constructor: config.reps=<',config.reps,'>');
    this._pathPeer = config.reps.dht + '/peerspace';
    if (!fs.existsSync(this._pathPeer)) {
      fs.mkdirSync(this._pathPeer,{ recursive: true });
    }    console.log('PeerStorage::constructor: config=<',config,'>');
    this.machine_ = new PeerMachine(config);
  }
  append(request) {
    console.log('PeerStorage::append: request=<',request,'>');
    const keyAddress = request.address;
    //console.log('PeerStorage::append: keyAddress=<',keyAddress,'>');
    const keyPath = this.getPath4KeyAddress_(keyAddress);
    //console.log('PeerStorage::append: keyPath=<',keyPath,'>');
    if (!fs.existsSync(keyPath)) {
      fs.mkdirSync(keyPath,{ recursive: true });
    }
    const rankPath = keyPath + '/' + request.rank;
    if (!fs.existsSync(rankPath)) {
      fs.mkdirSync(rankPath,{ recursive: true });
    }
    const contentPlacePath = rankPath + '/' + request.ipfs;
    //console.log('PeerStorage::append: contentPlacePath=<',contentPlacePath,'>');
    if (!fs.existsSync(contentPlacePath)) {
      fs.writeFileSync(contentPlacePath,'');
      const statsRankPath = rankPath + '/stats.json';
      let stats = {};
      try {
        stats = require(statsRankPath);
      } catch (e) {
        
      }
      console.log('PeerStorage::append: stats=<',stats,'>');
      if(stats.count) {
        stats.count++;
      } else {
        stats.count = 1;
      }
      fs.writeFileSync(statsRankPath,JSON.stringify(stats,undefined,'  '));
    } else {
      
    }
  }
  fetch(request,cb) {
    console.log('PeerStorage::fetch: request=<',request,'>');
    const keyAddress = request.address;
    //console.log('PeerStorage::fetch: keyAddress=<',keyAddress,'>');    
    const keyPath = this.getPath4KeyAddress_(keyAddress);
    //console.log('PeerStorage::fetch: keyPath=<',keyPath,'>');
    const responseStats = this.fetchKeyStats_(keyPath);
    responseStats.finnish = false;
    //console.log('PeerStorage::fetch: responseStats=<',responseStats,'>');
    if(typeof cb === 'function') {
      cb(responseStats);
    }
    const maxPeers = responseStats.stats.maxPeers;
    //console.log('PeerStorage::fetch: maxPeers=<',maxPeers,'>');
    for(let start = 0;start < maxPeers;start += iConstPeersAtOneTime) {
      let end = start + iConstPeersAtOneTime;
      let finnish = false;
      if(end > maxPeers) {
        end = maxPeers;
        finnish = true;
      }
      const response = this.fetchDirAndContents_(keyPath,start,end);
      //console.log('PeerStorage::fetch: response=<',response,'>');
      response.finnish = finnish;
      if(typeof cb === 'function') {
        cb(response);
      }
    }
  }
  
  getAddress_(resourceKey) {
    const resourceRipemd = new RIPEMD160().update(resourceKey).digest('hex');
    const resourceBuffer = Buffer.from(resourceRipemd,'hex');
    return base32.encode(resourceBuffer,bs32Option);
    return 
  }
  getPath4KeyAddress_(address) {
    let pathAddress = this._pathPeer;
    pathAddress += '/' + address.substring(0,3);
    pathAddress += '/' + address.substring(3,6);
    pathAddress += '/' + address;
    return pathAddress;
  }
  fetchKeyStats_(dirPath) {
    const statsResult = {stats:{}};
    if (fs.existsSync(dirPath)) {
      const files = fs.readdirSync(dirPath);
      console.log('ResourceStorage::fetchKeyStats_: files=<',files,'>');
      statsResult.stats.maxPeers = files.length;
    }
    //console.log('ResourceStorage::fetchKeyStats_: statsResult=<',statsResult,'>');
    return statsResult;    
  }

  fetchDirAndContents_(dirPath,start,count) {
    const content = {peers:{}};
    //console.log('ResourceStorage::fetchDirAndContents_: dirPath=<',dirPath,'>');
    if (fs.existsSync(dirPath)) {
      const files = fs.readdirSync(dirPath);
      console.log('ResourceStorage::fetchDirAndContents_: files=<',files,'>');
      console.log('ResourceStorage::fetchDirAndContents_: start=<',start,'>');
      console.log('ResourceStorage::fetchDirAndContents_: count=<',count,'>');
      const rangeS = start;
      let rangeE = rangeS+count;
      if(rangeE > files.length) {
        rangeE = files.length
      }
      //console.log('ResourceStorage::fetchDirAndContents_: rangeS=<',rangeS,'>');
      //console.log('ResourceStorage::fetchDirAndContents_: rangeE=<',rangeE,'>');
      const fileRange = files.slice(rangeS,rangeE);
      for(const file of fileRange) {
        //console.log('ResourceStorage::fetchDirAndContents_: file=<',file,'>');
        const pathContents = dirPath + '/' + file;
        //console.log('ResourceStorage::fetchDirAndContents_: pathContents=<',pathContents,'>');
        const uri = fs.readFileSync(pathContents);
        content.peers[file] = uri.toString('utf-8');
      }
    }
    //console.log('ResourceStorage::fetchDirAndContents_: content=<',content,'>');
    return content;
  }


}
module.exports = PeerStorage;


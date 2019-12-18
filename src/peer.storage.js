'use strict';
const fs = require('fs');
const path = require('path');
const jsrsasign = require('jsrsasign');
const RIPEMD160 = require('ripemd160');
const base32 = require("base32.js");
const bs32Option = { type: "crockford", lc: true };
const PeerMachine = require('./peer.machine.js');

class PeerStorage {
  constructor(config) {
    console.log('PeerStorage::constructor: config.reps=<',config.reps,'>');
    this._pathPeer = config.reps.dht + '/peerspace';
    if (!fs.existsSync(this._pathPeer)) {
      fs.mkdirSync(this._pathPeer,{ recursive: true });
    }    console.log('PeerStorage::constructor: config=<',config,'>');
    this.machine_ = new PeerMachine(config);
  }
  append(resource) {
    console.log('PeerStorage::save: resource=<',resource,'>');
    const keyAddress = resource.address;
    //console.log('PeerStorage::append: keyAddress=<',keyAddress,'>');
    const keyPath = this.getPath4KeyAddress_(keyAddress);
    console.log('PeerStorage::append: keyPath=<',keyPath,'>');
    if (!fs.existsSync(keyPath)) {
      fs.mkdirSync(keyPath,{ recursive: true });
    }
    const contentAddress = this.getAddress_(resource.uri);
    const contentPlacePath = keyPath + '/' + contentAddress;
    console.log('PeerStorage::append: contentPlacePath=<',contentPlacePath,'>');
    fs.writeFileSync(contentPlacePath,resource.uri);
  }
  fetch(keyAddress) {
    console.log('PeerStorage::fetch: keyAddress=<',keyAddress,'>');    
    const keyPath = this.getPath4KeyAddress_(keyAddress);
    console.log('PeerStorage::fetch: keyPath=<',keyPath,'>');
    const resource = this.fetchDirAndContents_(keyPath,0,200);
    return resource;
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

  fetchDirAndContents_(dirPath,start,count) {
    //console.log('ResourceStorage::fetchDirAndContents_: dirPath=<',dirPath,'>');
    const files = fs.readdirSync(dirPath);
    //console.log('ResourceStorage::fetchDirAndContents_: files=<',files,'>');
    const rangeS = start;
    let rangeE = rangeS+count;
    if(rangeE > files.length) {
      rangeE = files.length
    }
    //console.log('ResourceStorage::fetchDirAndContents_: rangeS=<',rangeS,'>');
    //console.log('ResourceStorage::fetchDirAndContents_: rangeE=<',rangeE,'>');
    const fileRange = files.slice(rangeS,rangeE);
    const content = {};
    for(const file of fileRange) {
      console.log('ResourceStorage::fetchDirAndContents_: file=<',file,'>');
      const pathContents = dirPath + '/' + file;
      console.log('ResourceStorage::fetchDirAndContents_: pathContents=<',pathContents,'>');
      const uri = fs.readFileSync(pathContents);
      content[file] = uri.toString('utf-8');
    }
    return content;
  }


}
module.exports = PeerStorage;


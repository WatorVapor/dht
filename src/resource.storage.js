'use strict';
const fs = require('fs');
const path = require('path');
const jsrsasign = require('jsrsasign');
const RIPEMD160 = require('ripemd160');
const base32 = require("base32.js");
const PeerMachine = require('./peer.machine.js');


const bs32Option = { type: "crockford", lc: true };

class ResourceStorage {
  constructor(config) {
    console.log('ResourceStorage::constructor: config.reps=<',config.reps,'>');
    this._pathKey = config.reps.data + '/keyspace';
    if (!fs.existsSync(this._pathKey)) {
      fs.mkdirSync(this._pathKey,{ recursive: true });
    }
    this._pathContent = config.reps.data + '/dataspace';
    if (!fs.existsSync(this._pathContent)) {
      fs.mkdirSync(this._pathContent,{ recursive: true });
    }    console.log('ResourceStorage::constructor: config=<',config,'>');
    this.machine_ = new PeerMachine(config);
    const host = this.machine_.readMachienIp();
    const port = config.listen.data.port;
    this._uri = `https://[${host}]:${port}`;
  }
  
  append(key,content) {
    const keyAddress = this.getAddress_(key);
    //console.log('ResourceStorage::append: keyAddress=<',keyAddress,'>');
    const keyPath = this.getPath4KeyAddress_(keyAddress);
    console.log('ResourceStorage::append: keyPath=<',keyPath,'>');
    if (!fs.existsSync(keyPath)) {
      fs.mkdirSync(keyPath,{ recursive: true });
    }
    const contentAddress = this.getAddress_(content);
    const contentPlacePath = keyPath + '/' + contentAddress;
    console.log('ResourceStorage::append: contentPlacePath=<',contentPlacePath,'>');
    fs.writeFileSync(contentPlacePath,'');
    
    const contentPathFlat = this.getPath4ContentAddress_(contentAddress);
    const contentPathFlatDir = path.dirname(contentPathFlat);
    console.log('ResourceStorage::append: contentPathFlatDir=<',contentPathFlatDir,'>');
    if (!fs.existsSync(contentPathFlatDir)) {
      fs.mkdirSync(contentPathFlatDir,{ recursive: true });
    }
    fs.writeFileSync(contentPathFlat,content);
    
    return {address:keyAddress,uri:this._uri};
  }
  
  fetch(keyAddress,start,count) {
    //console.log('ResourceStorage::fetch: keyAddress=<',keyAddress,'>');
    const keyPath = this.getPath4KeyAddress_(keyAddress);
    //console.log('ResourceStorage::fetch: keyPath=<',keyPath,'>');
    if(fs.existsSync(keyPath)) {
      //console.log('ResourceStorage::fetch: keyPath=<',keyPath,'>');
      const stat = fs.lstatSync(keyPath);
      //console.log('ResourceStorage::fetch: stat=<',stat,'>');
      if(stat.isDirectory()) {
        return this.fetchDir_(keyPath,start,count);
      }
      if(stat.isFile()) {
        return this.fetchFile_(keyPath);
      }
    } else {
      const contentPath = this.getPath4ContentAddress_(keyAddress);
      if(fs.existsSync(contentPath)) {
        //console.log('ResourceStorage::fetch: contentPath=<',contentPath,'>');
        const stat = fs.lstatSync(contentPath);
        //console.log('ResourceStorage::fetch: stat=<',stat,'>');
        if(stat.isFile()) {
          return this.fetchFile_(contentPath);
        }
      }
    }
    return null;
 }
 
 fetchFlat(keyAddress,start,count) {
    const keyPath = this.getPath4KeyAddress_(keyAddress);
    console.log('ResourceStorage::fetchFlat: keyPath=<',keyPath,'>');
    if(fs.existsSync(keyPath)) {
      console.log('ResourceStorage::fetchFlat: keyPath=<',keyPath,'>');
      const stat = fs.lstatSync(keyPath);
      //console.log('ResourceStorage::fetchFlat: stat=<',stat,'>');
      if(stat.isDirectory()) {
        return this.fetchDir_(keyPath,start,count);
      }
      if(stat.isFile()) {
        return this.fetchFile_(keyPath);
      }
    } else {
      const contentPath = this.getPath4ContentAddress_(keyAddress);
      if(fs.existsSync(contentPath)) {
        //console.log('ResourceStorage::fetchFlat: contentPath=<',contentPath,'>');
        const stat = fs.lstatSync(contentPath);
        //console.log('ResourceStorage::fetchFlat: stat=<',stat,'>');
        if(stat.isFile()) {
          return this.fetchFile_(contentPath);
        }
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
    let pathAddress = this._pathKey;
    pathAddress += '/' + address.substring(0,3);
    pathAddress += '/' + address.substring(3,6);
    pathAddress += '/' + address;
    return pathAddress;
  }
  getPath4ContentAddress_(address) {
    let pathAddress = this._pathContent;
    pathAddress += '/' + address.substring(0,3);
    pathAddress += '/' + address.substring(3,6);
    pathAddress += '/' + address;
    return pathAddress;
  }  
  getURI4Address_(address) {
    let uriAddress = this._uri;
    uriAddress += '/' + address;
    return uriAddress;
  }
  
  fetchDir_(dirPath,start,count) {
    //console.log('ResourceStorage::fetchDir_: dirPath=<',dirPath,'>');
    const files = fs.readdirSync(dirPath);
    //console.log('ResourceStorage::fetchDir_: files=<',files,'>');
    const rangeS = start;
    let rangeE = rangeS+count;
    if(rangeE > files.length) {
      rangeE = files.length
    }
    //console.log('ResourceStorage::fetchDir_: rangeS=<',rangeS,'>');
    //console.log('ResourceStorage::fetchDir_: rangeE=<',rangeE,'>');
    return files.slice(rangeS,rangeE);
  }
  
  fetchFile_(filePath) {
    //console.log('ResourceStorage::fetchFile_: filePath=<',filePath,'>');
    return fs.readFileSync(filePath).toString('utf-8');
  }

}
module.exports = ResourceStorage;


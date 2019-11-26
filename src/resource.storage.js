'use strict';
const fs = require('fs');
const path = require('path');
const jsrsasign = require('jsrsasign');
const bs58 = require('bs58');
const RIPEMD160 = require('ripemd160');

class ResourceStorage {
  constructor(config) {
    console.log('ResourceStorage::constructor: config.reps=<',config.reps,'>');
    this._path = config.reps.data + '/ldfs';
    if (!fs.existsSync(this._path)) {
      fs.mkdirSync(this._path,{ recursive: true });
    }
    this._uri = 'ermu://[host]:[port]';
  }
  append(key,content) {
    let keyAddress = this.getContentAddress_(key);
    console.log('ResourceStorage::append: keyAddress=<',keyAddress,'>');
    let keyPath = this.getPath4Address_(keyAddress);
    console.log('ResourceStorage::append: keyPath=<',keyPath,'>');
    if (!fs.existsSync(keyPath)) {
      fs.mkdirSync(keyPath,{ recursive: true });
    }
    const contentAddress = this.getContentAddress_(content);
    const contentPath = keyPath + '/' + contentAddress;
    console.log('ResourceStorage::append: contentPath=<',contentPath,'>');
    fs.writeFileSync(contentPath,content);
    return {address:keyAddress,uri:this.getURI4Address_(keyAddress)};
  }
  fetch(keyAddress,start,count) {
    //console.log('ResourceStorage::fetch: keyAddress=<',keyAddress,'>');
    let keyPath = this.getPath4Address_(keyAddress);
    //console.log('ResourceStorage::fetch: keyPath=<',keyPath,'>');
    if(fs.existsSync(keyPath)) {
      //console.log('ResourceStorage::fetch: keyPath=<',keyPath,'>');
      const source = fs.readdirSync(keyPath, { withFileTypes: true });
      //console.log('ResourceStorage::fetch: source=<',source,'>');
      const stat = fs.lstatSync(keyPath);
      //console.log('ResourceStorage::fetch: stat=<',stat,'>');
      if(stat.isDirectory()) {
        return this.fetchDir_(keyPath,start,count);
      }
      if(stat.isFile()) {
        return this.fetchFile_(keyPath);
      }
    }
    return null;
 }

  getContentAddress_(resourceKey) {
    const resourceRipemd = new RIPEMD160().update(resourceKey).digest('hex');
    const resourceBuffer = Buffer.from(resourceRipemd,'hex');
    return bs58.encode(resourceBuffer);
    return 
  }
  getPath4Address_(address) {
    let pathAddress = this._path;
    pathAddress += '/' + address.substring(0,2);
    pathAddress += '/' + address.substring(2,4);
    pathAddress += '/' + address;
    return pathAddress;
  }
  getURI4Address_(address) {
    let uriAddress = this._uri;
    uriAddress += '/' + address;
    return uriAddress;
  }
  
  fetchDir_(dirPath,start,count) {
    console.log('ResourceStorage::fetchDir_: dirPath=<',dirPath,'>');
    const files = fs.readdirSync(dirPath);
    console.log('ResourceStorage::fetchDir_: files=<',files,'>');
    const rangeS = start -1;
    let rangeE = rangeS+count;
    if(rangeE > files.length) {
      rangeE = files.length
    }
    return files.slice(rangeS,rangeE);
  }
  
  fetchFile_(filePath) {
    console.log('ResourceStorage::fetchFile_: filePath=<',filePath,'>');
  }

}
module.exports = ResourceStorage;


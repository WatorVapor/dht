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
    return {content:keyAddress,url:keyPath};
  }

  getContentAddress_(resourceKey) {
    const resourceRipemd = new RIPEMD160().update(resourceKey).digest('hex');
    const resourceBuffer = Buffer.from(resourceRipemd,'hex');
    return bs58.encode(resourceBuffer);
    return 
  }
  getPath4Address_(keyHex) {
    let pathAddress = this._path;
    pathAddress += '/' + keyHex.substring(0,2);
    pathAddress += '/' + keyHex.substring(2,4);
    pathAddress += '/' + keyHex;
    return pathAddress;
  }
}
module.exports = ResourceStorage;

/*
module.exports = class LevelDFS {
  constructor(path) {
    this._path = path;
    if (!fs.existsSync(path)) {
      fs.mkdirSync(path,{ recursive: true });
    }
    this.itAddressCache_ = []; 
    this.readTopLevelPath_();
  }
  put(key,content,cb) {
    let keyAddress = this.getKeyAddress_(key);
    //console.log('LevelDFS::put: keyAddress=<',keyAddress,'>');
    let keyPath = path.dirname(keyAddress);
    //console.log('LevelDFS::put: keyPath=<',keyPath,'>');
    if (!fs.existsSync(keyPath)) {
      fs.mkdirSync(keyPath,{ recursive: true });
    }
    fs.writeFileSync(keyAddress,content);
    if(typeof cb === 'function') {
      cb();
    }
    return path.basename(keyAddress);
  }
  putSync(key,content) {
    return this.put(key,content);
  }


  
  get(key,cb) {
    let keyAddress = this.getKeyAddress_(key);
    //console.log('LevelDFS::get: keyAddress=<',keyAddress,'>');
    if (fs.existsSync(keyAddress)) {
      let content = fs.readFileSync(keyAddress, 'utf8');
      if(typeof cb === 'function') {
        cb(undefined,content,keyAddress);
      }
    } else {
      let err = {notFound:true};
      if(typeof cb === 'function') {
        cb(err);
      }
    }
  }
  
  getSync(key) {
    let keyAddress = this.getKeyAddress_(key);
    //console.log('LevelDFS::get: keyAddress=<',keyAddress,'>');
    if (fs.existsSync(keyAddress)) {
      let content = fs.readFileSync(keyAddress, 'utf8');
      return content;
    }
    return null;
  }

  getByAddressSync(addr) {
    //console.log('LevelDFS::get: addr=<',addr,'>');
    let keyAddress = this.getPath4Address_(addr);
    if (fs.existsSync(keyAddress)) {
      let content = fs.readFileSync(keyAddress, 'utf8');
      return content;
    }
    return null;
  }
  
  
  getKeyAddress_(key) {
    const hash256 = crypto.createHash('sha256');
    hash256.update(key);
    const keyHash256 = hash256.digest('hex');
    //console.log('LevelDFS::getKeyAddress_: keyHash256=<',keyHash256,'>');
    const sha1 = crypto.createHash('sha1');
    sha1.update(keyHash256);
    const keyHash1 = sha1.digest('hex');    
    //console.log('LevelDFS::getKeyAddress_: keyHash1=<',keyHash1,'>');
    return this.getPath4Address_(keyHash1);
  }
  getPath4Address_(keyHex) {
    let pathAddress = this._path;
    pathAddress += '/' + keyHex.substring(0,3);
    pathAddress += '/' + keyHex.substring(3,6);
    pathAddress += '/' + keyHex.substring(6,9);
    pathAddress += '/' + keyHex.substring(9,12);
    pathAddress += '/' + keyHex;
    return pathAddress;
  }


  topAddress() {
    return this.topAddressRecursion_(this._path);
  }
  
  topBlock() {
    return this.topLevelAddress_[0];
  }
  nextBlock(itBlock){
    //console.log('LevelDFS::nextBlock: itBlock=<',itBlock,'>');
    const bloxkIndex = this.topLevelAddress_.indexOf(itBlock);
    if(bloxkIndex > this.topLevelAddress_.length-1) {
      return 'end';
    }
    if(bloxkIndex < 0) {
      return 'error';
    }
    return this.topLevelAddress_[bloxkIndex + 1];
  }
  getAddressOfBlock(block) {
    this.itAddressCache_ = [];
    const blockPath = this._path + '/' + block;
    //console.log('LevelDFS::getAddressOfBlock: blockPath=<',blockPath,'>');
    this.allAddressRecursion_(blockPath);
    //console.log('LevelDFS::getAddressOfBlock: this.itAddressCache_=<',this.itAddressCache_,'>');
    return this.itAddressCache_;
  }

  



  nextAddress(itAddress){
    if(this.itAddressCache_.length === 0) {
      this.rebuildNextAddressCache_(itAddress);
    }
    const indexAddress1 = this.itAddressCache_.indexOf(itAddress);
    //console.log('LevelDFS::nextAddress: indexAddress1=<',indexAddress1,'>');
    if(indexAddress1 === -1 ) {
      this.rebuildNextAddressCache_(itAddress);
    } else {
      if(indexAddress1 == this.itAddressCache_.length -1 ) {
        this.rebuildNextAddressCache_(itAddress,true);
      } else {
        return this.itAddressCache_[indexAddress1+1];
      }
    }
    if(this.itAddressCache_.length > 0) {
      return this.itAddressCache_[0];
    } else {
      return 'end';
    }
  }


  topAddressRecursion_(searchRoot) {
    const files = fs.readdirSync(searchRoot);
    files.sort();
    //console.log('LevelDFS::topAddressRecursion_: files=<',files,'>');
    if(files.length > 0) {
      const path = searchRoot +'/'+ files[0];
      //console.log('LevelDFS::topAddressRecursion_: path=<',path,'>');
      const stats = fs.lstatSync(path);
      if(stats.isFile()) {
        return files[0];
      }
      if(stats.isDirectory()) {
        return this.topAddressRecursion_(path);
      }
    }    
  }
  
  rebuildNextAddressCache_(itAddress,topEnd) {
    this.itAddressCache_ = [];
    console.log('LevelDFS::rebuildNextAddressCache_: topEnd=<',topEnd,'>');
    console.log('LevelDFS::rebuildNextAddressCache_: this.itAddressCache_=<',this.itAddressCache_,'>');
    let itTopDir = this._path;
    const topIt = itAddress.substring(0,3);
    if(topEnd) {
      console.log('LevelDFS::rebuildNextAddressCache_: this.topLevelAddress_=<',this.topLevelAddress_,'>');
      const nextTopDir = this.nextTopAddress_(topIt);
      if(nextTopDir) {
        itTopDir += '/' + nextTopDir;
      }
    } else {
      itTopDir += '/' + itAddress.substring(0,3);
    }
    console.log('LevelDFS::rebuildNextAddressCache_: itAddress=<',itAddress,'>');
    console.log('LevelDFS::rebuildNextAddressCache_: itTopDir=<',itTopDir,'>');
    console.log('LevelDFS::rebuildNextAddressCache_: this.itAddressCache_=<',this.itAddressCache_,'>');
    this.allAddressRecursion_(itTopDir);
    this.itAddressCache_.sort();
    console.log('LevelDFS::rebuildNextAddressCache_: this.itAddressCache_=<',this.itAddressCache_,'>');
  }
  nextTopAddress_(topIt) {
    const indexItOrig = this.topLevelAddress_.indexOf(topIt);
    console.log('LevelDFS::nextTopAddress_: indexItOrig=<',indexItOrig,'>');
    if(indexItOrig >= 0 && indexItOrig < this.topLevelAddress_.length-1) {
      return this.topLevelAddress_[indexItOrig+1];
    }
    const indexItUp = this.topLevelAddress_.indexOf(topIt.toUpperCase());
    console.log('LevelDFS::nextTopAddress_: indexItUp=<',indexItUp,'>');
    if(indexItUp >= 0 && indexItUp < this.topLevelAddress_.length-1) {
      return this.topLevelAddress_[indexItUp+1];
    }
    const indexItLow = this.topLevelAddress_.indexOf(topIt.toLowerCase());
    console.log('LevelDFS::nextTopAddress_: indexItLow=<',indexItLow,'>');
    if(indexItLow >= 0 && indexItLow < this.topLevelAddress_.length-1) {
      return this.topLevelAddress_[indexItLow+1];
    }
  }
  
  readTopLevelPath_() {
    this.topLevelAddress_ = [];
    const files = fs.readdirSync(this._path);
    files.sort();
    for(const file of files) {
      const path = this._path +'/'+ file;
      const stats = fs.lstatSync(path);
      if(stats.isDirectory()) {
        this.topLevelAddress_.push(file);
      }
    }
    //console.log('LevelDFS::readTopLevelPath_: this.topLevelAddress_=<',this.topLevelAddress_,'>');
  }

  allAddressRecursion_(searchRoot) {
    const files = fs.readdirSync(searchRoot);
    files.sort();
    //console.log('LevelDFS::allAddressRecursion_: files=<',files,'>');
    for(const file of files) {
      const path = searchRoot +'/'+ file;
      //console.log('LevelDFS::topAddressRecursion_: path=<',path,'>');
      const stats = fs.lstatSync(path);
      if(stats.isFile()) {
        this.itAddressCache_.push(file);
      }
      if(stats.isDirectory()) {
        this.allAddressRecursion_(path);
      }
    }    
  }

}
*/

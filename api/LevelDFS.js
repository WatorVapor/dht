const fs = require('fs');
const path = require('path');
const base32 = require("base32.js");
const crypto = require('crypto');
const RIPEMD160 = require('ripemd160');
const bs32Option = { type: "crockford", lc: true };


module.exports = class LevelDFS {
  constructor(path) {
    this._path = path;
    if (!fs.existsSync(path)) {
      fs.mkdirSync(path,{ recursive: true });
    }
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
      cb(keyAddress);
    }
  }
  
  get(key,cb) {
    let keyAddress = this.getKeyAddress_(key);
    //console.log('LevelDFS::get: keyAddress=<',keyAddress,'>');
    if (fs.existsSync(keyAddress)) {
      let content = fs.readFileSync(keyAddress, 'utf8');
      if(typeof cb === 'function') {
        cb(undefined,content);
      }
    } else {
      let err = {notFound:true,address:keyAddress};
      if(typeof cb === 'function') {
        cb(err);
      }
    }
  }
  
  
  getKeyAddress_(key) {
    const hash = crypto.createHash('sha256');
    hash.update(key);
    const keyHash = hash.digest('hex');
    //console.log('LevelDFS::getKeyAddress_: keyHash=<',keyHash,'>');
    const keyRipemd = new RIPEMD160().update(keyHash).digest('hex');
    //console.log('LevelDFS::getKeyAddress_: keyRipemd=<',keyRipemd,'>');
    const keyBuffer = Buffer.from(keyRipemd,'hex');
    const keyB32 = base32.encode(keyBuffer,bs32Option);    
    //console.log('LevelDFS::getKeyAddress_: keyB32=<',keyB32,'>');
    let pathAddress = this._path 
    pathAddress += '/' + keyB32.substring(0,3);
    pathAddress += '/' + keyB32.substring(3,6);
    pathAddress += '/' + keyB32;
    //console.log('LevelDFS::get: pathAddress=<',pathAddress,'>');
    return pathAddress;
  }
}

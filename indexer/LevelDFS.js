const fs = require('fs');
const path = require('path');
const base64url = require('base64-url');
const crypto = require('crypto');
const RIPEMD160 = require('ripemd160');

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
      cb();
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
      let err = {notFound:true};
      if(typeof cb === 'function') {
        cb(err,keyAddress);
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
    const keyB64U = base64url.encode(keyBuffer);    
    //console.log('LevelDFS::getKeyAddress_: keyB64U=<',keyB64U,'>');
    let pathAddress = this._path 
    pathAddress += '/' + keyB64U.substring(0,2);
    pathAddress += '/' + keyB64U.substring(2,4);
    pathAddress += '/' + keyB64U.substring(4,6);
    pathAddress += '/' + keyB64U.substring(6,8);
    pathAddress += '/' + keyB64U.substring(8,10);
    pathAddress += '/' + keyB64U;
    //console.log('LevelDFS::get: pathAddress=<',pathAddress,'>');
    return pathAddress;
  }
}

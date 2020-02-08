'use strict';
const ipfsClient = require('ipfs-http-client');
const RIPEMD160 = require('ripemd160');
const base32 = require("base32.js");
const bs32Option = { type: "crockford", lc: true };

const ipfsOption = {
  cidVersion:1
};
class ResourceOnIpfs {
  constructor() {
    this.connectIpfsNode_();
  }
  /*
  async append(key,content) {
    //console.log('ResourceOnIpfs::append: key=<',key,'>');
    const keyAddress = this.getAddress_(key);
    //console.log('ResourceOnIpfs::append: keyAddress=<',keyAddress,'>');
    for await (const result of this.ipfs_.add(content,ipfsOption)) {
      //console.log('ResourceOnIpfs::append: result.path=<',result.path,'>');
      return {address:keyAddress,ipfs:result.path};
    }
  }
  */
  async add(data) {
    for await (const result of this.ipfs_.add(data,ipfsOption)) {
      //console.log('ResourceOnIpfs::addIPFS: result.path=<',result.path,'>');
      return {cid:result.path};
    }
  }
  
  fetch(keyAddress,start,count) {
  }

  fetchStats(keyAddress) {
  }

  
  async connectIpfsNode_() {
    this.ipfs_ = ipfsClient({ host: 'localhost', port: '5001', protocol: 'http' });
    const identity = await this.ipfs_.id();
    console.log('ResourceOnIpfs::constructor: identity.id=<',identity.id,'>');
  }

  getAddress(resourceKey) {
    const resourceRipemd = new RIPEMD160().update(resourceKey).digest('hex');
    const resourceBuffer = Buffer.from(resourceRipemd,'hex');
    return base32.encode(resourceBuffer,bs32Option);
    return 
  }

}
module.exports = ResourceOnIpfs;


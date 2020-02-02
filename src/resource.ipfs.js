'use strict';
const ipfsClient = require('ipfs-http-client');

class ResourceOnIpfs {
  constructor() {
    console.log('ResourceOnIpfs::constructor:');
    this.connectIpfsNode_();
  }
  async append(key,content) {
    console.log('ResourceOnIpfs::append: key=<',key,'>');
    for await (const result of this.ipfs_.add(content)) {
      console.log('ResourceOnIpfs::append: result=<',result,'>');
    }
  }
  
  fetch(keyAddress,start,count) {
  }

  fetchStats(keyAddress) {
  }
  fetchFlat(keyAddress,start,count) {
  }
  
  async connectIpfsNode_() {
    this.ipfs_ = ipfsClient({ host: 'localhost', port: '5001', protocol: 'http' });
    const identity = await this.ipfs_.id();
    console.log('ResourceOnIpfs::constructor: identity.id=<',identity.id,'>');
  }
}
module.exports = ResourceOnIpfs;


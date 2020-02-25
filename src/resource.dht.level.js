'use strict';
const ipfsClient = require('ipfs-http-client');
const RIPEMD160 = require('ripemd160');
const base32 = require("base32.js");
const bs32Option = { type: "crockford", lc: true };

const ipfsOption = {
  cidVersion:1
};
class ResourceOnDHTLevel {
  constructor() {
  }

  getAddress(resourceKey) {
    const resourceRipemd = new RIPEMD160().update(resourceKey).digest('hex');
    const resourceBuffer = Buffer.from(resourceRipemd,'hex');
    return base32.encode(resourceBuffer,bs32Option);
    return 
  }
}
module.exports = ResourceOnDHTLevel;


'use strict';
const ResourceOnIpfs = require('../src/resource.ipfs.js');
const resource = new ResourceOnIpfs();

setTimeout(()=>{
  saveIpfs();
  },10000);

const saveIpfs = async () => {
  const saved = await resource.append('中国','https://developer.mozilla.org/ja/docs/Web/JavaScript/Reference/Statements/async_function');
  console.log('saveIpfs: saved=<',saved,'>');
}

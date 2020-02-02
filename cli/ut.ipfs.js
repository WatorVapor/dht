'use strict';
const ResourceOnIpfs = require('../src/resource.ipfs.js');
const resource = new ResourceOnIpfs();

setTimeout(()=>{
  resource.append('中国','https://developer.mozilla.org/ja/docs/Web/JavaScript/Reference/Statements/async_function');  
},10000);


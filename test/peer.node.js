'use strict';
const path = require('path');
//console.log(':: process.argv[1]=<',process.argv[1],'>');
const name = path.parse(process.argv[1]).name;
console.log(':: name=<',name,'>');

const config = require('./' + name + '.config.js');
console.log(':: config=<',config,'>');
const DHT = require('../dht.js');
const dht = new DHT(config);
//console.log(':: dht=<',dht,'>');
const peer = dht.peerInfo();
console.log(':: peer=<',peer,'>');

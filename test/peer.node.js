'use strict';
const config = require('./node1.config.js');
console.log(':: config=<',config,'>');
const DHT = require('../dht.js');
const dht = new DHT(config);
//console.log(':: dht=<',dht,'>');
const peer = dht.peerInfo();
console.log(':: peer=<',peer,'>');

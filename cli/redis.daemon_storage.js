'use strict';
const path = require('path');
//console.log(':: __filename=<',__filename,'>');
const dhtPath = '/storage/dhtfs/cluster/' + path.parse(__filename).name + '/peerstore';
const dataPath = '/storage/dhtfs/cluster/' + path.parse(__filename).name + '/datastore';
const cachePath = '/storage/dhtfs/cluster/' + path.parse(__filename).name + '/cache';
const config = {
  listen:{
    ctrl:{
      port:8890
    },
    data:{
      port:8891
    }
  },
  entrance:[
    {
      host:'ermu3.wator.xyz',
      port:8890
    },
    {
      host:'ermu4.wator.xyz',
      port:8890
    }
  ],
  reps: {
    dht:dhtPath,
    data:dataPath,
    cache:cachePath
  },
  storage:true
};
//console.log(':: config=<',config,'>');
const DHT = require('../src/dht.js');
const dht = new DHT(config);
//console.log(':: dht=<',dht,'>');
const peer = dht.peerInfo();
console.log(':: peer=<',peer,'>');

const DaemonRedis = require('../api/DaemonRedis.js');
const daemon = new DaemonRedis(dht);

'use strict';
const path = require('path');
//console.log(':: __filename=<',__filename,'>');
const dhtPath = '/storage/dhtfs/cluster/dht_ermu_' + path.parse(__filename).name + '/peerstore';
const dataPath = '/storage/dhtfs/cluster/dht_ermu_' + path.parse(__filename).name + '/datastore';
const config = {
  listen:{
    ctrl:{
      port:8990
    },
    data:{
      port:8991
    }
  },
  entrance:[
    {
      host:'ermu4.wator.xyz',
      port:8990
    }
  ],
  reps: {
    dht:dhtPath,
    data:dataPath
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
const serverUTListenChannel = 'dht.ermu.api.server.listen.ut';
const daemon = new DaemonRedis(dht,serverUTListenChannel);

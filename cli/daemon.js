'use strict';
const path = require('path');
//console.log(':: __filename=<',__filename,'>');
const dhtPath = '/storage/dhtfs/cluster/' + path.parse(__filename).name + '/peerstore';
const dataPath = '/storage/dhtfs/cluster/' + path.parse(__filename).name + '/datastore';
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
      host:'2400:2412:13e0:9d00:2ce:39ff:fece:132',
      port:8890
    },
    {
      host:'2400:2412:13e0:9d00:8639:beff:fe67:dcc9',
      port:8890
    }
  ],
  reps: {
    dht:dhtPath,
    data:dataPath
  }
};
//console.log(':: config=<',config,'>');
const DHT = require('../src/dht.js');
const dht = new DHT(config);
//console.log(':: dht=<',dht,'>');
const peer = dht.peerInfo();
console.log(':: peer=<',peer,'>');

/*
const UnixDomainUdp = require('unix-dgram');
const API_DOMAIN_PATH = '/tmp/dht_ermu_api_unix_dgram';

const server = UnixDomainUdp.createSocket('unix_dgram',(buf,rinfo) => {
  onApiMessage(buf,rinfo);
});
execSync(`rm -rf ${API_DOMAIN_PATH}`);
server.bind(API_DOMAIN_PATH);

const onApiMessage = (buf,rinfo) => {
  console.log('onApiMessage::buf=<',buf,'>');
  console.log('onApiMessage::rinfo=<',rinfo,'>');
};
*/
const net = require('net');
const API_DOMAIN_PATH = '/tmp/dht_ermu_api_unix_dgram';

const server = net.createServer((socket) => {
  onConnection(socket);
});
const { execSync } = require('child_process');
execSync(`rm -rf ${API_DOMAIN_PATH}`);
server.listen(API_DOMAIN_PATH);

const onConnection = (connection) => {
  //console.log('onConnection::connection=<',connection,'>');
  connection.on('data', (data) => {
    onData(data,connection);
  });
};
const onData = (data,connection) => {
  //console.log('onData::data=<',data.toString(),'>');  
  //console.log('onData::connection=<',connection,'>');
  const jMsg = JSON.parse(data.toString());
  console.log('onData::jMsg=<',jMsg,'>');
  if(jMsg && jMsg.peerInfo) {
    onPeerInfo(connection);
  }
};

const onPeerInfo = (connection)=> {
  //console.log('onPeerInfo::connection=<',connection,'>');
  const peer = dht.peerInfo();
  //console.log(':: peer=<',peer,'>');
  const peerInfo = {peerInfo:peer};
  const msgBuff = Buffer.from(JSON.stringify(peerInfo),'utf-8');
  connection.write(msgBuff);
};
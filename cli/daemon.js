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

const net = require('net');
const API_DOMAIN_PATH = '/tmp/dht_ermu_api_unix_dgram';

const server = net.createServer((socket) => {
  onConnection(socket);
});
const { execSync } = require('child_process');
execSync(`rm -rf ${API_DOMAIN_PATH}`);
server.listen(API_DOMAIN_PATH);

const StreamJson = require('../api/StreamJson.js');
const sjson_ = new StreamJson();

const onConnection = (connection) => {
  //console.log('onConnection::connection=<',connection,'>');
  connection.setNoDelay();
  connection.on('data', (data) => {
    onData(data,connection);
  });
};


const onData = (data,connection) => {
  //console.log('onData::data=<',data.toString(),'>');  
  //console.log('onData::connection=<',connection,'>');
  //const jMsg = JSON.parse(data.toString());
  const jMsgs = sjson_.parse(data.toString());
  //console.log('onData::jMsg=<',jMsg,'>');
  for(const jMsg of jMsgs) {
    if(jMsg) {
      if(jMsg.peerInfo) {
        onPeerInfo(connection);
      } else if(jMsg.store) {
        onStoreData(jMsg,connection);
      } else {
        console.log('onData::jMsg=<',jMsg,'>');
      }
    } else {
      console.log('onData::data=<',data.toString(),'>');
    }
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

const onStoreData = (jMsg,connection)=> {
  //console.log('onStoreData::jMsg=<',jMsg,'>');
  if(jMsg.store === 'append') {
    onAppendData(jMsg.key,jMsg.data,connection);
  } else if(jMsg.store === 'delete') {
    onDeleteData(jMsg.key,connection);
  } else {
    console.log('onStoreData::jMsg=<',jMsg,'>');
  }
};

const onAppendData = (key,data,connection)=> {
  console.log('onAppendData::key=<',key,'>');
  console.log('onAppendData::data=<',data,'>');
  dht.append(key,data);
}

const onDeleteData = (key,connection)=> {
  console.log('onDeleteData::jMsg=<',jMsg,'>');
}



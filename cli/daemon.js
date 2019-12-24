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
  try {
    onConnection(socket);
  } catch(e) {
    console.log('onData::e=<',e,'>');
  }
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
  try {
    const jMsgs = sjson_.parse(data.toString());
    //console.log('onData::jMsgs=<',jMsgs,'>');
    for(const jMsg of jMsgs) {
      if(jMsg) {
        if(jMsg.peerInfo) {
          onPeerInfo(jMsg,connection);
        } else if(jMsg.store) {
          onStoreData(jMsg,connection);
        } else if(jMsg.fetch) {
          onFetchData(jMsg,connection);
        } else {
          console.log('onData::jMsg=<',jMsg,'>');
        }
      } else {
        console.log('onData::data=<',data.toString(),'>');
      }
    }
  } catch(e) {
    console.log('onData::e=<',e,'>');
  }
};

const onPeerInfo = (jMsg,connection)=> {
  //console.log('onPeerInfo::connection=<',connection,'>');
  const peer = dht.peerInfo();
  //console.log(':: peer=<',peer,'>');
  const peerInfoResp = {
    peerInfo:peer,
    cb:jMsg.cb
  };
  const RespBuff = Buffer.from(JSON.stringify(peerInfoResp),'utf-8');
  connection.write(RespBuff);
};

const onStoreData = (jMsg,connection)=> {
  //console.log('onStoreData::jMsg=<',jMsg,'>');
  const storeResp = {
    cb:jMsg.cb,
    store:jMsg.store
  };
  if(jMsg.store === 'append') {
    onAppendData(jMsg.key,jMsg.data,jMsg.cb,connection);
  } else if(jMsg.store === 'delete') {
    onDeleteData(jMsg.key,jMsg.cb,connection);
  } else {
    console.log('onStoreData::jMsg=<',jMsg,'>');
  }
  const respBuff = Buffer.from(JSON.stringify(storeResp),'utf-8');
  connection.write(respBuff);

};

const onAppendData = (key,data,cb,connection)=> {
  console.log('onAppendData::key=<',key,'>');
  console.log('onAppendData::data=<',data,'>');
  dht.append(key,data,cb);
}

const onDeleteData = (key,cb,connection)=> {
  console.log('onDeleteData::jMsg=<',jMsg,'>');
}


const onFetchData = (jMsg,connection)=> {
  //console.log('onFetchData::jMsg=<',jMsg,'>');
  if(jMsg.fetch === 'keyWord') {
    onFetchDataByKeyWord(jMsg.keyWord,jMsg.cb,connection);
  } else if(jMsg.fetch === 'address') {
    onFetchDataByAddress(jMsg.address,jMsg.cb,connection);
  } else {
    console.log('onFetchData::jMsg=<',jMsg,'>');
  }
};

const onFetchDataByKeyWord = (keyWord,cb,connection)=> {
  console.log('onFetchDataByKeyWord::keyWord=<',keyWord,'>');
  dht.fetch4KeyWord(keyWord,cb,(resouce)=> {
    console.log('onFetchDataByKeyWord::resouce=<',resouce,'>');
    const respBuff = Buffer.from(JSON.stringify(resouce),'utf-8');
    connection.write(respBuff);
  });
}

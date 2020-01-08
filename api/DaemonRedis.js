'use strict';
const net = require('net');
const { execSync } = require('child_process');

const API_DOMAIN_PATH = '/dev/shm/dht_ermu_api_unix_dgram.sock';
class DaemonRedis {
  constructor(dht) {
    this.dht_ = dht;
    this.sjson_ = new StreamJson();
    const self = this;
    const server = net.createServer((socket) => {
      try {
        self.onConnection_(socket);
      } catch(e) {
        console.log('DaemonUnixSocket::constructore=<',e,'>');
      }
    });
    execSync(`rm -rf ${API_DOMAIN_PATH}`);
    server.listen(API_DOMAIN_PATH);
  }
  
  onConnection_(connection) {
    //console.log('DaemonUnixSocket::onConnection_:connection=<',connection,'>');
    try {
      connection.setNoDelay();
    } catch(e) {
      console.log('DaemonUnixSocket::onConnection_::::e=<',e,'>');
    }
    const self = this;
    connection.on('data', (data) => {
      self.onData_(data,connection);
    });
  };

  onData_ (data,connection) {
    //console.log('DaemonUnixSocket::onData_::data=<',data.toString(),'>');  
    //console.log('DaemonUnixSocket::onData_::connection=<',connection,'>');
    try {
      const jMsgs = this.sjson_.parse(data.toString());
      //console.log('DaemonUnixSocket::onData_::jMsgs=<',jMsgs,'>');
      for(const jMsg of jMsgs) {
        if(jMsg) {
          if(jMsg.peerInfo) {
            this.onPeerInfo_(jMsg,connection);
          } else if(jMsg.store) {
            this.onStoreData_(jMsg,connection);
          } else if(jMsg.fetch) {
            this.onFetchData_(jMsg,connection);
          } else {
            console.log('DaemonUnixSocket::onData_::jMsg=<',jMsg,'>');
          }
        } else {
          console.log('DaemonUnixSocket::onData_::data=<',data.toString(),'>');
        }
      }
    } catch(e) {
      console.log('DaemonUnixSocket::onData_::e=<',e,'>');
    }
  };


  onPeerInfo_ (jMsg,connection){
    //console.log('DaemonUnixSocket::onPeerInfo_::connection=<',connection,'>');
    const peer = this.dht_.peerInfo();
    //console.log('DaemonUnixSocket::onPeerInfo_:: peer=<',peer,'>');
    const peerInfoResp = {
      peerInfo:peer,
      cb:jMsg.cb
    };
    const RespBuff = Buffer.from(JSON.stringify(peerInfoResp),'utf-8');
    try {
      connection.write(RespBuff);
    } catch(e) {
      console.log('DaemonUnixSocket::onPeerInfo_::::e=<',e,'>');
    }
  };

  onStoreData_(jMsg,connection) {
    //console.log('onStoreData_::jMsg=<',jMsg,'>');
    const storeResp = {
      cb:jMsg.cb,
      store:jMsg.store
    };
    if(jMsg.store === 'append') {
      this.onAppendData_(jMsg.key,jMsg.data,jMsg.cb,connection);
    } else if(jMsg.store === 'delete') {
      this.onDeleteData_(jMsg.key,jMsg.cb,connection);
    } else {
      console.log('onStoreData_::jMsg=<',jMsg,'>');
    }
    const RespBuff = Buffer.from(JSON.stringify(storeResp),'utf-8');
    try {
      connection.write(RespBuff);
    } catch(e) {
      console.log('DaemonUnixSocket::onStoreData_::::e=<',e,'>');
    }
  };

  onAppendData_ (key,data,cb,connection) {
    console.log('DaemonUnixSocket::onAppendData_::key=<',key,'>');
    console.log('DaemonUnixSocket::onAppendData_::data=<',data,'>');
    this.dht_.append(key,data,cb);
  }

  onDeleteData_(key,cb,connection) {
    console.log('DaemonUnixSocket::onDeleteData_::jMsg=<',jMsg,'>');
  }


  onFetchData_(jMsg,connection){
    //console.log('DaemonUnixSocket::onFetchData::jMsg=<',jMsg,'>');
    if(jMsg.fetch === 'keyWord') {
      this.onFetchDataByKeyWord_(jMsg.keyWord,jMsg.cb,connection);
    } else if(jMsg.fetch === 'address') {
      this.onFetchDataByAddress_(jMsg.address,jMsg.cb,connection);
    } else {
      console.log('DaemonUnixSocket::onFetchData::jMsg=<',jMsg,'>');
    }
  };

  onFetchDataByKeyWord_ (keyWord,cb,connection){
    console.log('DaemonUnixSocket::onFetchDataByKeyWord_::keyWord=<',keyWord,'>');
    this.dht_.fetch4KeyWord(keyWord,cb,(resouce)=> {
      console.log('DaemonUnixSocket::onFetchDataByKeyWord_::resouce=<',resouce,'>');
      try {
        const respBuff = Buffer.from(JSON.stringify(resouce),'utf-8');
        connection.write(respBuff);
      } catch(e) {
        console.log('DaemonUnixSocket::onFetchDataByKeyWord_::::e=<',e,'>');
      }
    });
  }

  onFetchDataByAddress_ (address,cb,connection){
    console.log('DaemonUnixSocket::onFetchDataByAddress_::address=<',address,'>');
  }


};

module.exports = DaemonUnixSocket;

'use strict';
const redis = require('redis');
const redisOption = {
  path:'/dev/shm/dht.ermu.api.redis.sock'
};
const serverListenChannel = 'dht.ermu.api.server.listen';
class DaemonRedis {
  constructor(dht,serverChannel) {
    this.dht_ = dht;
    this.subscriber_ = redis.createClient(redisOption);
    if(serverChannel) {
      this.subscriber_.subscribe(serverChannel);
    } else {
      this.subscriber_.subscribe(serverListenChannel);
    }
    const self = this;
    this.subscriber_.on('message',(channel,message) => {
      self.onData_(message);
    });
    this.publisher_ = redis.createClient(redisOption);
  }
  
  onConnection_(connection) {
    //console.log('DaemonRedis::onConnection_:connection=<',connection,'>');
    try {
      connection.setNoDelay();
    } catch(e) {
      console.log('DaemonRedis::onConnection_::::e=<',e,'>');
    }
    const self = this;
    connection.on('data', (data) => {
      self.onData_(data,connection);
    });
  };

  onData_ (data) {
    //console.log('DaemonRedis::onData_::data=<',data.toString(),'>');  
    try {
      const jMsg = JSON.parse(data.toString());
      //console.log('DaemonRedis::onData_::jMsg=<',jMsg,'>');
      if(jMsg) {
        if(jMsg.peerInfo) {
          this.onPeerInfo_(jMsg);
        } else if(jMsg.store) {
          this.onStoreData_(jMsg);
        } else if(jMsg.fetch) {
          this.onFetchData_(jMsg);
        } else {
          console.log('DaemonRedis::onData_::jMsg=<',jMsg,'>');
        }
      }
    } catch(e) {
      console.log('DaemonRedis::onData_::e=<',e,'>');
    }
  };


  onPeerInfo_ (jMsg){
    const peer = this.dht_.peerInfo();
    //console.log('DaemonRedis::onPeerInfo_:: peer=<',peer,'>');
    const peerInfoResp = {
      peerInfo:peer,
      cb:jMsg.cb
    };
    const RespBuff = Buffer.from(JSON.stringify(peerInfoResp),'utf-8');
    try {
      this.publisher_.publish(jMsg.channel,RespBuff);
    } catch(e) {
      console.log('DaemonRedis::onPeerInfo_::::e=<',e,'>');
    }
  };

  async onStoreData_(jMsg) {
    //console.log('onStoreData_::jMsg=<',jMsg,'>');
    const storeResp = {
      cb:jMsg.cb,
      store:jMsg.store
    };
    if(jMsg.store === 'append') {
      const result = await this.onAppendData_(jMsg.key,jMsg.data,jMsg.rank,jMsg.cb);
      storeResp.result = result;
    } else if(jMsg.store === 'delete') {
      this.onDeleteData_(jMsg.key,jMsg.cb);
    } else if(jMsg.store === 'ipfs') {
      const result = await this.onIPFSData_(jMsg.ipfs,jMsg.cb);
      storeResp.result = result;
    } else {
      console.log('onStoreData_::jMsg=<',jMsg,'>');
    }
    const RespBuff = Buffer.from(JSON.stringify(storeResp),'utf-8');
    try {
      this.publisher_.publish(jMsg.channel,RespBuff);
    } catch(e) {
      console.log('DaemonRedis::onStoreData_::::e=<',e,'>');
    }
  };

  async onAppendData_ (key,data,rank,cb) {
    //console.log('DaemonRedis::onAppendData_::key=<',key,'>');
    //console.log('DaemonRedis::onAppendData_::data=<',data,'>');
     const resource = await this.dht_.append(key,data,rank,cb);
    //console.log('DaemonRedis::onAppendData_::resource=<',resource,'>');
    return resource;
  }

  onDeleteData_(key,cb) {
    console.log('DaemonRedis::onDeleteData_::jMsg=<',jMsg,'>');
  }

  async onIPFSData_ (data,cb) {
    //console.log('DaemonRedis::onIPFSData_::key=<',key,'>');
    //console.log('DaemonRedis::onIPFSData_::data=<',data,'>');
     const address = await this.dht_.addIPFS(data,cb);
    //console.log('DaemonRedis::onIPFSData_::address=<',address,'>');
    return address;
  }


  onFetchData_(jMsg){
    //console.log('DaemonRedis::onFetchData::jMsg=<',jMsg,'>');
    if(jMsg.fetch === 'keyWord') {
      this.onFetchDataByKeyWord_(jMsg.keyWord,jMsg.cb,jMsg.channel);
    } else if(jMsg.fetch === 'keyWordCache') {
      this.onFetchDataByKeyWordCache_(jMsg.keyWord,jMsg.begin,jMsg.end,jMsg.cb,jMsg.channel);
    } else if(jMsg.fetch === 'address') {
      this.onFetchDataByAddress_(jMsg.address,jMsg.cb,jMsg.channel);
    } else {
      console.log('DaemonRedis::onFetchData::jMsg=<',jMsg,'>');
    }
  };

  onFetchDataByKeyWord_ (keyWord,cb,channel){
    console.log('DaemonRedis::onFetchDataByKeyWord_::keyWord=<',keyWord,'>');
    this.dht_.fetch4KeyWord(keyWord,cb,(resouce)=> {
      console.log('DaemonRedis::onFetchDataByKeyWord_::resouce=<',resouce,'>');
      try {
        const RespBuff = Buffer.from(JSON.stringify(resouce),'utf-8');
        this.publisher_.publish(channel,RespBuff);
      } catch(e) {
        console.log('DaemonRedis::onFetchDataByKeyWord_::::e=<',e,'>');
      }
    });
  }

  onFetchDataByKeyWordCache_ (keyWord,begin,end,cb,channel){
    console.log('DaemonRedis::onFetchDataByKeyWordCache_::keyWord=<',keyWord,'>');
    console.log('DaemonRedis::onFetchDataByKeyWordCache_::begin=<',begin,'>');
    console.log('DaemonRedis::onFetchDataByKeyWordCache_::end=<',end,'>');
    console.log('DaemonRedis::onFetchDataByKeyWordCache_::cb=<',cb,'>');
    this.dht_.fetch4KeyWord(keyWord,begin,end,cb,(resouce)=> {
      console.log('DaemonRedis::onFetchDataByKeyWordCache_::resouce=<',resouce,'>');
      try {
        const RespBuff = Buffer.from(JSON.stringify(resouce),'utf-8');
        this.publisher_.publish(channel,RespBuff);
      } catch(e) {
        console.log('DaemonRedis::onFetchDataByKeyWordCache_::::e=<',e,'>');
      }
    });
  }


  onFetchDataByAddress_ (address,cb,channel){
    console.log('DaemonRedis::onFetchDataByAddress_::address=<',address,'>');
  }
};

module.exports = DaemonRedis;

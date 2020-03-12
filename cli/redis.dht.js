'use strict';
const DHT = require('../api/DHTRedis.js');
const dht = new DHT();
//console.log(':: dht=<',dht,'>');
dht.peerInfo((peerInfo)=>{
  console.log('dht.peerInfo:: peerInfo=<',peerInfo,'>');
});



const channelWS2DHT = 'enum.www.search.ws2dht';
const channelDHT2WS = 'enum.www.search.dht2ws';

const redis = require("redis");
const redisOption = {
  port:6379,
  host:'127.0.0.1'
};
const subRedis = redis.createClient(redisOption);
const pubRedis  = redis.createClient(redisOption);
subRedis.on('message', (channel, message) => {
  onRedisMsg(channel, message);
});
subRedis.subscribe(channelWS2DHT);

const onRedisMsg = (channel, message) => {
  //console.log('onRedisMsg::channel=<',channel,'>');
  //console.log('onRedisMsg::message=<',message,'>');
  try {
    const jsonMsg = JSON.parse(message);
    if(jsonMsg && jsonMsg.words) {
      console.log('onRedisMsg::jsonMsg=<',jsonMsg,'>');
      dht.fetch4KeyWordCache(jsonMsg.words,jsonMsg.begin,jsonMsg.end,(result)=> {
        try {
          console.log('onRedisMsg::result=<',result,'>');
          const response = {...jsonMsg,...result};
          pubRedis.publish(channelDHT2WS,JSON.stringify(response));
        } catch(e) {
          console.log('onRedisMsg::e=<',e,'>');
        }
      });
    }
  } catch(e) {
    console.log('onRedisMsg::e=<',e,'>');
  }
}



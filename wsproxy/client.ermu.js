const redis = require('redis');
const redisOption = {
  path:'/dev/shm/dht.ermu.api.redis.sock'
};
const channelWS2DHT = 'enum.www.search.ws2dht';
const channelDHT2WS = 'enum.www.search.dht2ws';

const subRedis = redis.createClient(redisOption);
const pubRedis  = redis.createClient(redisOption);
subRedis.on('message', (channel, message) => {
  onRedisMsg(channel, message);
});
subRedis.subscribe(channelWS2DHT);

const onRedisMsg = (channel, message) => {
  console.log('onRedisMsg::channel=<',channel,'>');
  console.log('onRedisMsg::message=<',message,'>');
  try {
    const jsonMsg = JSON.parse(message);
    onReqKeyWord(jsonMsg);
  } catch(e) {
    
  }
}


const KeyWordStore = require('dht.mesh').KW;
const kw = new KeyWordStore();
//console.log('::.:: kw=<',kw,'>');


const gKWordReplyNemo = {};
kw.onData = (data,tag) => {
  //console.log('kw.onData:: data=<',data,'>'); 
  //console.log('kw.onData:: tag=<',tag,'>'); 
  //console.log('kw.onData:: gKWordReplyNemo=<',gKWordReplyNemo,'>');
  const reqMsg = gKWordReplyNemo[tag];
  if(tag && reqMsg) {
    if(data.content) {
      fetchKValue(data.content,Object.assign({},reqMsg));
    }
    reqMsg.kword = data;
    pubRedis.publish(channelDHT2WS,JSON.stringify(reqMsg));
    delete gKWordReplyNemo[tag];
  }
}


const onReqKeyWord = (reqMsg)=> {
  console.log('onReqKeyWord::reqMsg=<',reqMsg,'>');
  if(reqMsg.words) {
    const replyTag = kw.fetch(reqMsg.words,reqMsg.begin) ;
    //console.log('onReqKeyWord::replyTag=<',replyTag,'>');
    gKWordReplyNemo[replyTag] = reqMsg;
  }
}


const fetchKValue = (contents,reqMsg) => {
  for(const address of contents) {
    console.log('fetchKValue:: address=<',address,'>');
    const replyTag = kv.fetch(address);
    //console.log('fetchKValue::replyTag=<',replyTag,'>');
    gKValueReplyNemo[replyTag.tag] = reqMsg;
    //console.log('fetchKValue::gKValueReplyNemo=<',gKValueReplyNemo,'>');
 }
}


const KeyValueStore = require('dht.mesh').KV;
const kv = new KeyValueStore();
//console.log('::.:: kv=<',kv,'>');

const gKValueReplyNemo = {};
kv.onData = (data,tag) => {
  console.log('kv.onData:: data=<',data,'>');
  if(data.content) {
    const jContents = JSON.parse(data.content);
    data.content = jContents;
    //console.log('kv.onData:: tag=<',tag,'>');
    //console.log('kw.onData:: gKValueReplyNemo=<',gKValueReplyNemo,'>'); 
    const reqMsg = gKValueReplyNemo[tag];
    //console.log('kv.onData:: reqMsg=<',reqMsg,'>');
    if(tag && reqMsg) {
      reqMsg.kvalue = data;
      //console.log('kv.onData:: reqMsg=<',reqMsg,'>');
      pubRedis.publish(channelDHT2WS,JSON.stringify(reqMsg));
      delete gKValueReplyNemo[tag];
    }
  }
}


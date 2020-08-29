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


const gKWordReplyMemo = {};
kw.onData = (data,tag) => {
  console.log('kw.onData:: data=<',data,'>'); 
  //console.log('kw.onData:: tag=<',tag,'>'); 
  //console.log('kw.onData:: gKWordReplyMemo=<',gKWordReplyMemo,'>');
  const reqMsg = gKWordReplyMemo[tag];
  if(tag && reqMsg) {
    if(data.content.length > 0) {
      fetchKValue(data.content,Object.assign({},reqMsg));
      delete gKWordReplyMemo[tag];
    }
    reqMsg.kword = data;
    pubRedis.publish(channelDHT2WS,JSON.stringify(reqMsg));
  }
}


const onReqKeyWord = (reqMsg)=> {
  console.log('onReqKeyWord::reqMsg=<',reqMsg,'>');
  if(reqMsg.words) {
    const replyTag = kw.fetch(reqMsg.words,reqMsg.begin) ;
    //console.log('onReqKeyWord::replyTag=<',replyTag,'>');
    gKWordReplyMemo[replyTag] = reqMsg;
  }
}


const fetchKValue = async (contents,reqMsg) => {
  for(const address of contents) {
    //console.log('fetchKValue:: address=<',address,'>');
    const promise = new Promise( (resolve, reject) =>{
      const replyTag = kv.fetch(address);
      //console.log('fetchKValue::replyTag=<',replyTag,'>');
      gKValueReplyMemo[replyTag.tag] = reqMsg;
      gKValueReplyPromise[replyTag.tag] = {resolve:resolve,reject:reject};
      //console.log('fetchKValue::gKValueReplyMemo=<',gKValueReplyMemo,'>');
      setTimeout(()=> {
        const reqPromise = gKValueReplyPromise[replyTag.tag];
        //console.log('kv.onData:: reqPromise=<',reqPromise,'>');
        if(reqPromise) {
          reqPromise.reject({timeout:true});
          delete gKValueReplyPromise[replyTag.tag];
        }
      },5*1000)
    });
    //console.log('fetchKValue::promise=<',promise,'>');
    const result = await promise;
    console.log('fetchKValue::result=<',result,'>');
 }
}



const KeyValueStore = require('dht.mesh').KV;
const kv = new KeyValueStore();
//console.log('::.:: kv=<',kv,'>');

const gKValueReplyMemo = {};
const gKValueReplyPromise = {};
kv.onData = (data,tag) => {
  //console.log('kv.onData:: data=<',data,'>');
  //console.log('kv.onData:: tag=<',tag,'>');
  if(data.content) {
    try {
      if( typeof data.content === 'string') {
        const jContents = JSON.parse(data.content);
        data.content = jContents;
      }
    } catch(err) {
      console.log('kv.onData:: err=<',err,'>');
      console.log('kv.onData:: data.content=<',data.content,'>');
    }
    //console.log('kv.onData:: tag=<',tag,'>');
    //console.log('kw.onData:: gKValueReplyMemo=<',gKValueReplyMemo,'>'); 
    const reqMsg = gKValueReplyMemo[tag];
    //console.log('kv.onData:: reqMsg=<',reqMsg,'>');
    if(tag && reqMsg) {
      reqMsg.kvalue = data;
      //console.log('kv.onData:: reqMsg=<',reqMsg,'>');
      pubRedis.publish(channelDHT2WS,JSON.stringify(reqMsg));
      delete gKValueReplyMemo[tag];
    }
  }
  const reqPromise = gKValueReplyPromise[tag];
  //console.log('kv.onData:: reqPromise=<',reqPromise,'>');
  if(reqPromise) {
    reqPromise.resolve();
    delete gKValueReplyPromise[tag];
  }
}


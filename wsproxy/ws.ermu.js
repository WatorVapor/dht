const WebSocket = require('ws');
const crypto = require('crypto');
const config = {host:'127.0.0.1', port: 20081 }
const wss = new WebSocket.Server(config);
const channelWS2DHT = 'enum.www.search.ws2dht';
const channelDHT2WS = 'enum.www.search.dht2ws';

wss.on('connection', (ws) => {
  onConnected(ws);
});

const onConnected = (ws) => {
  ws.on('message', (message) => {
    onWSMsg(message,ws);
  });
  ws.on('error', (evt) => {
    console.log('error: evt=<', evt,'>');
  });
  ws.isAlive = true;
  ws.on('pong', heartBeatWS);  
}
const gCallBack = {};
const onWSMsg = (message,ws) => {
  console.log('onWSMsg: message=<', message,'>');
  try {
    const jsonMsg = JSON.parse(message);
    if(jsonMsg) {
      const buf = crypto.randomBytes(16);
      jsonMsg.cbtag = buf.toString('hex');
      pubRedis.publish(channelWS2DHT,JSON.stringify(jsonMsg));
      gCallBack[jsonMsg.cbtag] = ws;
    }
  } catch(e) {
    
  }
};

const redis = require('redis');
const redisOption = {
  path:'/dev/shm/dht.ermu.api.redis.sock'
};

const subRedis = redis.createClient(redisOption);
const pubRedis  = redis.createClient(redisOption);
subRedis.on('message', (channel, message) => {
  onRedisMsg(channel, message);
});
subRedis.subscribe(channelDHT2WS);

const onRedisMsg = (channel, message) => {
  try {
    const jsonMsg = JSON.parse(message);
    if(jsonMsg && jsonMsg.cbtag) {
      const client = gCallBack[jsonMsg.cbtag];
      if(client) {
        client.send(JSON.stringify(jsonMsg));
      }
    }
  } catch(e) {
    
  }
}


const noop = () => {};
const heartBeatWS = () => {
  console.log('heartBeatWS::this=<',this,'>');
  this.isAlive = true;
}
const doPingWS = () => {
  wss.clients.forEach((ws) => {
    ws.isAlive = false;
    ws.ping(noop);
  });  
};
const interval = setInterval(doPingWS, 10000);




'use strict';
const os = require('os');
const dgram = require("dgram");

class PeerNetWork {
  constructor(config) {
    this.config = config;
    this.serverData = dgram.createSocket("udp6");
    this.client = dgram.createSocket("udp6");

    let self = this;

    this.serverData.on("listening", () => {
      self.onListenDataServer();
    });
    this.serverData.on("message", (msg, rinfo) => {
      self.onMessageDataServer__(msg, rinfo)
    });
    this.serverData.bind(config.listen.data);
  }
  host() {
    this.readMachienIp__();
    return this.ip__;
  }
  port() {
    return this.config.listen.data;
  }
  
  
  onListenDataServer(evt) {
    const address = this.serverData.address();
    console.log('onListenDataServer address=<', address, '>');
  };


  onMessageDataServer__(msg, rinfo) {
    //console.log('onMessageDataServer__ msg=<', msg.toString('utf-8'), '>');
    //console.log('onMessageDataServer__ rinfo=<', rinfo, '>');
    try {
      const msgJson = JSON.parse(msg.toString('utf-8'));
      //console.log('onMessageDataServer__ msgJson=<',msgJson,'>');
      //console.log('onMessageDataServer__ this.config=<',this.config,'>');
      const good = this.security.verify(msgJson);
      //console.log('onMessageDataServer__ good=<',good,'>');
      if (!good) {
        console.log('onMessageDataServer__ msgJson=<', msgJson, '>');
        return;
      }
      const rPeerId = this.security.calcID(msgJson);
      //console.log('onMessageDataServer__ rPeerId=<',rPeerId,'>');
      if(msgJson.topic && msgJson.data) {
        this.onRemoteDataMsg__(msgJson.topic,msgJson.data);
      }
    } catch(e) {
      console.log('onMessageDataServer__ e=<',e,'>');
    }
  };


  readMachienIp__() {
    this.ip__ = [];
    const interfaces = os.networkInterfaces();
    //console.log('readMachienIp__ interfaces=<',interfaces,'>');
    for (const [dev, infos] of Object.entries(interfaces)) {
      //console.log('onListenDataServer dev=<',dev,'>');
      //console.log('onListenDataServer infos=<',infos,'>');
      for (const info of infos) {
        console.log('onListenDataServer info=<',info,'>');
        if (info.family === 'IPv6') {
          this.ip__.push(info.address);
        }
      }
    }
  }
}

module.exports = PeerNetWork;
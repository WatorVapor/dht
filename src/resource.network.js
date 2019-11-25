'use strict';
const os = require('os');
const PeerMachine = require('./peer.machine.js');
const https = require('https');
const fs = require('fs');


class ResourceNetWork {
  constructor(config) {
    this.config_ = config;
    this.createOrLoadSSLKey_();
    /*
    const options = {
      key: fs.readFileSync('test/fixtures/keys/agent2-key.pem'),
      cert: fs.readFileSync('test/fixtures/keys/agent2-cert.pem')
    };
    */
    this.serverHttps_= dgram.createSocket("udp6");
    this.clientHttps_ = dgram.createSocket("udp6");
    this.machine_ = new PeerMachine(config);

    let self = this;

    this.serverData.on("listening", () => {
      self.onListenDataServer();
    });
    this.serverData.on("message", (msg, rinfo) => {
      self.onMessageDataServer__(msg, rinfo)
    });
    this.serverData.bind(config.listen.data.port);
  }
  host() {
    return this.machine_.readMachienIp();
  }
  port() {
    return this.config.listen.data.port;
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
  createOrLoadSSLKey_() {
    console.log('ResourceNetWork::createOrLoadSSLKey_ this.config_=<', this.config_, '>');
  }
}

module.exports = ResourceNetWork;

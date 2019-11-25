'use strict';
const os = require('os');
const jsrsasign = require('jsrsasign');
const PeerMachine = require('./peer.machine.js');
const https = require('https');
const fs = require('fs');
const execSync = require('child_process').execSync;


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
    //console.log('ResourceNetWork::createOrLoadSSLKey_ this.config_=<', this.config_, '>');
    this.keyPath_ = this.config_.reps.dht + '/ssl/key.pem';
    console.log('ResourceNetWork::createOrLoadSSLKey_ this.keyPath_=<',this.keyPath_,'>');
    this.csrPath_ = this.config_.reps.dht + '/ssl/csr.pem';
    console.log('ResourceNetWork::createOrLoadSSLKey_ this.csrPath_=<',this.csrPath_,'>');
    if(fs.existsSync(this.keyPath_)) {
      this.loadKey__();
    } else {
      this.createKey__();
    }
  }
  loadKey__() {
  }
  createKey__() {
    let cmdDir = 'mkdir -p ';
    cmdDir += this.config_.reps.dht + '/ssl';
    const resultDir =  execSync(cmdDir);
    console.log('PeerCrypto::createKey__ resultDir=<',resultDir.toString('utf-8'),'>');

    let cmdKey = 'openssl ecparam -out ';
    cmdKey += this.keyPath_;
    cmdKey += ' -name prime256v1 -genkey';
    const resultKey =  execSync(cmdKey);
    console.log('PeerCrypto::createKey__ resultKey=<',resultKey.toString('utf-8'),'>');
    let cmdCsr = 'openssl req -new -key ';
    cmdCsr += this.keyPath_;
    cmdCsr += ' -out ';
    cmdCsr += this.csrPath_;
    cmdCsr += ' -subj "/C=WT/ST=Earth/L=Universe Ship 1/O=wator xyz/OU=ermu./CN=***"'
    const resultCsr =  execSync(cmdCsr);
    console.log('PeerCrypto::createKey__ resultCsr=<',resultCsr.toString('utf-8'),'>');

    /*
    const ec = new jsrsasign.KEYUTIL.generateKeypair("EC", "P-256");
    //console.log('PeerCrypto::createKey__ ec=<',ec,'>');
    const jwkPrv1 = jsrsasign.KEYUTIL.getJWKFromKey(ec.prvKeyObj);
    //console.log('PeerCrypto::createKey__ jwkPrv1=<',jwkPrv1,'>');
    fs.writeFileSync(this.keyPath_,JSON.stringify(jwkPrv1,undefined,2));
    */
  }
}

module.exports = ResourceNetWork;

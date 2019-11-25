'use strict';
const os = require('os');
const PeerMachine = require('./peer.machine.js');
const https = require('https');
const fs = require('fs');
const execSync = require('child_process').execSync;
const selfsigned = require('selfsigned');
const createCert = require('create-cert');

class ResourceNetWork {
  constructor(config) {
    this.config_ = config;
    const keyOption = { days: 365, commonName: 'qermu.wator.xyz' };
    const self = this;
    createCert().then(keys => {
      //console.log('ResourceNetWork::createKey__ keys=<',keys,'>');
      self.createHTTPSServer_(keys);
    });
    this.machine_ = new PeerMachine(config);
  }
  host() {
    return this.machine_.readMachienIp();
  }
  port() {
    return this.config_.listen.data.port;
  }

  createHTTPSServer_(keys) {
    const self = this;
    this.serverHttps_= https.createServer(keys,(req, res) => {
      self.onRequest_(req, res);
    })
    this.serverHttps_.listen(this.config_.listen.data.port);
  }
  
  onRequest_(req, res) {
    res.writeHead(200);
    res.end('hello world\n');
  }
}

module.exports = ResourceNetWork;

'use strict';
const os = require('os');
const PeerMachine = require('./peer.machine.js');
const ResourceStorage = require('./resource.storage.js');
const https = require('https');
const fs = require('fs');
const execSync = require('child_process').execSync;
const selfsigned = require('selfsigned');
const createCert = require('create-cert');
const url  = require('url');

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
    this.storage_ = new ResourceStorage(config);
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
    res.writeHead(200,{'Content-Type': 'text/plain'});
    console.log('ResourceNetWork::onRequest_ req.url=<',req.url,'>');
    const url_parts = url.parse(req.url);
    console.log('ResourceNetWork::onRequest_ url_parts.pathname=<',url_parts.pathname,'>');
    const contents = this.storage_.fetch(url_parts.pathname);
    if(contents) {
      res.end(contents);
    } else {
      res.end('{}');
    }
  }
}

module.exports = ResourceNetWork;

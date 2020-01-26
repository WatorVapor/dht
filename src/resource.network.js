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
    res.writeHead(200, {'Content-Type': 'text/html; charset=utf-8'});
    //console.log('ResourceNetWork::onRequest_ req.url=<',req.url,'>');
    const url_parts = url.parse(req.url);
    //console.log('ResourceNetWork::onRequest_ url_parts=<',url_parts,'>');
    //console.log('ResourceNetWork::onRequest_ url_parts.pathname=<',url_parts.pathname,'>');
    const address = url_parts.pathname.replace('/','');
    const query = new url.URLSearchParams(url_parts.query);
    //console.log('ResourceNetWork::onRequest_ query=<',query,'>');
    //console.log('ResourceNetWork::onRequest_ query.get("stats")=<',query.get('stats'),'>');
    if(query.get('stats')) {
      const contents = this.storage_.fetchStats(address);
      //console.log('ResourceNetWork::onRequest_ contents=<',contents,'>');
      res.end(JSON.stringify(contents,undefined,2),'utf-8');
      return;
    }
    let start = 0;
    if(query.get('start')) {
      start = parseInt(query.get('start'));
    }
    let count = 20;
    if(query.get('count')) {
      count = parseInt(query.get('count'));
    }
    const contents = this.storage_.fetch(address,start,count);
    //console.log('ResourceNetWork::onRequest_ contents=<',contents,'>');
    res.end(JSON.stringify(contents,undefined,2),'utf-8');
  }
}

module.exports = ResourceNetWork;

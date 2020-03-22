'use strict';
const os = require('os');
const dgram = require("dgram");
const PeerMachine = require('./peer.machine.js');
const PeerCrypto = require('./peer.crypto.js');
const PeerStorage = require('./peer.storage.js');
const PeerBucket = require('./peer.bucket.js');
const PeerRoute = require('./peer.route.js');

const iConstMaxTTRInMs = 1000 * 5;


class PeerNetWork {
  constructor(config) {
    this.config = config;
    this.peers = {};
    this.storePeers_ = {};
    this.peekPeers_ = {};

    this.crypto_ = new PeerCrypto(config);
    this.machine_ = new PeerMachine(config);
    this.storage_ = new PeerStorage(config);
    this.bucket_ = new PeerBucket(config);
    this.route_ = new PeerRoute(this.crypto_);

    this.serverCtrl = dgram.createSocket("udp6");
    this.client = dgram.createSocket("udp6");
    let self = this;
    this.serverCtrl.on("listening", () => {
      self.onListenCtrlServer();
    });
    this.serverCtrl.on("message", (msg, rinfo) => {
      self.onMessageCtrlServer__(msg, rinfo)
    });
    this.serverCtrl.bind(config.listen.ctrl.port);
  }
  host() {
    return this.machine_.readMachienIp();
  }
  port() {
    return this.config.listen.ctrl.port;
  }

  publish(resource) {
    //console.log('PeerNetWork::publish resource=<',resource,'>');
    const relayPeer = this.route_.calcContent(resource.address);
    //console.log('PeerNetWork::publish relayPeer=<',relayPeer,'>');
    
    //console.log('PeerNetWork::publish this.crypto_.id=<',this.crypto_.id,'>');
    if(relayPeer.min === this.crypto_.id || 
      relayPeer.max === this.crypto_.id
    ) {
      this.storage_.append(resource);
    }
    if(relayPeer.min !== this.crypto_.id) {
      this.relayMsgTo_(relayPeer.min,resource);
    }
    if(relayPeer.max !== this.crypto_.id) {
      this.relayMsgTo_(relayPeer.max,resource);
    }   
  }
  fetch4KeyWord(fetchMessge,reply) {
    //console.log('PeerNetWork::fetch4KeyWord fetchMessge=<',fetchMessge,'>');
    const relayPeer = this.route_.calcContent(fetchMessge.address);
    //console.log('PeerNetWork::publish relayPeer=<',relayPeer,'>');    
    //console.log('PeerNetWork::publish this.crypto_.id=<',this.crypto_.id,'>');

    if(relayPeer.min === this.crypto_.id || 
      relayPeer.max === this.crypto_.id
    ) {
      this.storage_.fetch(fetchMessge,(localResource)=> {
        console.log('PeerNetWork::fetch4KeyWord localResource=<',JSON.stringify(localResource),'>');
        const fetchResp = {
          fetchResp:localResource,
          address:fetchMessge.address,
          local:true,
          cb:fetchMessge.cb
        };
        reply(fetchResp);        
      });
    }    
    if(relayPeer.min !== this.crypto_.id) {
      this.relayMsgTo_(relayPeer.min,fetchMessge);
    }
    if(relayPeer.max !== this.crypto_.id) {
      this.relayMsgTo_(relayPeer.max,fetchMessge);
    }
  }
  

  onMessageCtrlServer__(msg, rinfo) {
    //console.log('onMessageCtrlServer__ msg=<',msg.toString('utf-8'),'>');
    //console.log('onMessageCtrlServer__ rinfo=<',rinfo,'>');
    try {
      const msgJson = JSON.parse(msg.toString('utf-8'));
      //console.log('onMessageCtrlServer__ msgJson=<',msgJson,'>');
      //console.log('onMessageCtrlServer__ this.config=<',this.config,'>');
      const good = this.crypto_.verify(msgJson);
      //console.log('onMessageCtrlServer__ good=<',good,'>');
      if (!good) {
        console.log('onMessageCtrlServer__ msgJson=<', msgJson, '>');
        return;
      }
      const rPeerId = this.crypto_.calcID(msgJson);
      if (msgJson.entrance) {
        this.onNewNodeEntry__(rPeerId, rinfo.address, msgJson.listen, msgJson.storage);
      } else if (msgJson.welcome) {
        this.onWelcomeNode__(msgJson.welcome);
      } else if (msgJson.ping) {
        this.onPeerPing__(rPeerId,msgJson);
      } else if (msgJson.pong) {
        //console.log('onMessageCtrlServer__ msgJson=<',msgJson,'>');
        this.onPeerPong__(rPeerId, msgJson.pong);
      } else if (msgJson.store) {
          //console.log('onMessageCtrlServer__ msgJson=<',msgJson,'>');
          this.onStore4Remote__(rPeerId, msgJson.store,msgJson.rank,msgJson.address, msgJson.cb);
      } else if (msgJson.fetch) {
          //console.log('onMessageCtrlServer__ msgJson=<',msgJson,'>');
          this.onFetch4Remote__(rPeerId, msgJson.fetch,msgJson.address, msgJson.cb);
      } else if (msgJson.fetchResp) {
          //console.log('onMessageCtrlServer__ msgJson=<',msgJson,'>');
          this.onFetchResponse__(rPeerId, msgJson.fetchResp,msgJson.address, msgJson.cb);
      } else {
        console.log('onMessageCtrlServer__ msgJson=<', msgJson, '>');
      }
    } catch (e) {
      console.log('onMessageCtrlServer__ e=<', e, '>');
      console.log('onMessageCtrlServer__ msg.toString("utf-8")=<', msg.toString('utf-8'), '>');
    }
  };

  onNewNodeEntry__(id, rAddress, ports,storage) {
    //console.log('onNewNodeEntry__ id=<',id,'>');
    //console.log('onNewNodeEntry__ rAddress=<',rAddress,'>');
    //console.log('onNewNodeEntry__ ports=<',ports,'>');
    //console.log('onNewNodeEntry__ this.peers=<',this.peers,'>');
    this.peers[id] = {
      host: rAddress,
      ports: ports,
      storage:storage
    };
    if(storage) {
      this.storePeers_[id] = {
        host: rAddress,
        ports: ports        
      }
    } else {
      this.peekPeers_[id] = {
        host: rAddress,
        ports: ports        
      }      
    }
    console.log('onNewNodeEntry__ this.peers=<', this.peers, '>');

    let msg = {
      welcome: this.peers
    };
    let msgSign = this.crypto_.sign(msg);
    const bufMsg = Buffer.from(JSON.stringify(msgSign));
    this.client.send(bufMsg, ports.ctrl.port, rAddress, (err) => {
      //console.log('onNewNodeEntry__ err=<',err,'>');
    });
  }
  onWelcomeNode__(welcome) {
    console.log('onWelcomeNode__ welcome=<',welcome,'>');
    this.peers = Object.assign(this.peers, welcome);
    console.log('onWelcomeNode__ this.peers=<',this.peers,'>');
    try {
    } catch (e) {
      console.log('onWelcomeNode__ e=<', e, '>');
    }
    for(const peerid in this.peers) {
      console.log('onWelcomeNode__ peerid=<',peerid,'>');
      const peerNew = Object.assign({},this.peers[peerid]);
      console.log('onWelcomeNode__ peerNew=<',peerNew,'>');
      if(peerNew.storage) {
        this.storePeers_[peerid] = peerNew;
      } else {
        this.peekPeers_[peerid] = peerNew;
      }
      this.route_.addPeer(peerid,peerNew.storage);
    }
  }

  onPeerPing__(id,msgJson) {
    //console.log('onMessageCtrlServer__ msgJson=<',msgJson,'>');
    const sentTp = new Date(msgJson.sign.ts);
    sentTp.setMilliseconds(msgJson.sign.ms);
    //console.log('onMessageCtrlServer__ sentTp=<',sentTp,'>');
    const recieveTp = new Date();
    const tta = recieveTp - sentTp;
    //console.log('onMessageCtrlServer__ tta=<',tta,'>');
    if (this.peers[id]) {
      //console.log('onPeerPing__ this.peers[id]=<',this.peers[id],'>');
      this.peers[id].tta = tta;

      const peerInfo = this.peers[id];
      const now = new Date();
      let msg = {
        pong: {
          ping: {
            ts: sentTp.toGMTString(),
            ms: sentTp.getMilliseconds()
          },
          pong: {
            ts: now.toGMTString(),
            ms: now.getMilliseconds()
          }
        }
      };
      //console.log('onPeerPing__ peerInfo.ports.ctrl=<',peerInfo.ports.ctrl,'>');
      let msgSign = this.crypto_.sign(msg);
      const bufMsg = Buffer.from(JSON.stringify(msgSign));
      this.client.send(bufMsg, peerInfo.ports.ctrl.port, peerInfo.host, (err) => {
        //console.log('onPeerPing__ err=<',err,'>');
      });
    }
    //console.log('onPeerPing___ this.peers=<',this.peers,'>');    
  }
  onPeerPong__(id, pong) {
    //console.log('onPeerPong__ id=<',id,'>');
    //console.log('onPeerPong__ pong=<',pong,'>');
    const now = new Date();
    const pingTp = new Date(pong.ping.ts);
    pingTp.setMilliseconds(pong.ping.ms);
    //console.log('onPeerPong__ pingTp=<',pingTp,'>');
    const ttr = now - pingTp;
    //console.log('onPeerPong__ ttr=<',ttr,'>');
    if (this.peers[id]) {
      //console.log('onPeerPong__ this.peers[id]=<',this.peers[id],'>');
      this.peers[id].ttr = ttr;
      if(ttr < iConstMaxTTRInMs) {
        this.route_.updatePeer(id,ttr,this.peers[id].storage);
      } else {
        this.route_.removePeer(id);
      }
    }
    //console.log('onPeerPong__ this.peers=<',JSON.stringify(this.peers,undefined,2),'>');
  }



  doClientEntry__(entrance, listen ,storage) {
    console.log('doClientEntry__ entrance=<', entrance, '>');
    for (let address of entrance) {
      console.log('doClientEntry__ address=<', address, '>');
      let msg = {
        entrance: true,
        listen: listen,
        storage:storage
      };
      let msgSign = this.crypto_.sign(msg);
      const bufMsg = Buffer.from(JSON.stringify(msgSign));
      this.client.send(bufMsg, address.port, address.host, (err) => {
        //console.log('doClientEntry__ err=<',err,'>');
      });
    }
  };

  async doClientPing__() {
    //console.log('doClientPing__ this.peers=<',this.peers,'>');
    this.eachRemotePeer__((peer, peerInfo) => {
      //console.log('doClientPing__ peer=<',peer,'>');
      //console.log('doClientPing__ peerInfo=<',peerInfo,'>');
      let msg = {
        ping: true
      };
      let msgSign = this.crypto_.sign(msg);
      const bufMsg = Buffer.from(JSON.stringify(msgSign));
      this.client.send(bufMsg, peerInfo.ports.ctrl.port, peerInfo.host, (err) => {
        //console.log('doClientPing__ err=<',err,'>');
      });
    });
    const self = this;
    setTimeout(()=>{
      self.doClientPing__();
    },1000*10);    
  };

  eachRemotePeer__(fn) {
    for (let peer in this.peers) {
      //console.log('eachRemotePeer__ peer=<',peer,'>');
      let peerInfo = this.peers[peer];
      //console.log('eachRemotePeer__ peerInfo=<',peerInfo,'>');
      if (peer !== this.crypto_.id) {
        fn(peer, peerInfo);
      }
    }
  }

  onListenCtrlServer(evt) {
    const address = this.serverCtrl.address();
    console.log('onListenCtrlServer address=<', address, '>');
    const self = this;
    setTimeout(()=>{
      self.doClientEntry__(self.config.entrance,self.config.listen,self.config.storage);
    },0);
    setTimeout(()=>{
      self.doClientPing__();
    },1000*1);
    this.peers[this.crypto_.id] = {
      host: this.machine_.readMachienIp(),
      ports: this.config.listen,
      storage:this.config.storage
    };
  };
  
  
  relayStoreMessage_(dst,resource) {
    //console.log('relayStoreMessage_ dst=<', dst, '>');
    //console.log('relayStoreMessage_ resource=<', resource, '>');
    const msg = {store:resource}
    this.sendMessage_(dst,msg);
  }
  relayFetchMessage_(dst,resource) {
    //console.log('relayFetchMessage_ dst=<', dst, '>');
    //console.log('relayFetchMessage_ resource=<', resource, '>');
    const msg = {fetch:resource}
    this.sendMessage_(dst,msg);
  }
  
  sendMessage_(dst,msg) {
    const dstPeer = this.peers[dst];
    //console.log('sendMessage_ dstPeer=<', dstPeer, '>');
    const dstHost = dstPeer.host;
    const dstPort = dstPeer.ports.ctrl.port;
    let msgSign = this.crypto_.sign(msg);
    //console.log('sendMessage_ msgSign=<', msgSign, '>');
    const msgBuff = Buffer.from(JSON.stringify(msgSign));
    this.client.send(msgBuff, dstPort, dstHost, (err) => {
      //console.log('sendMessage_ err=<',err,'>');
    });
  }
  onStore4Remote__(fromId, store,rank, address, cb) {
    console.log('PeerNetWork::onStore4Remote__ fromId=<', fromId, '>');
    console.log('PeerNetWork::onStore4Remote__ store=<', store, '>');
    console.log('PeerNetWork::onStore4Remote__ rank=<', rank, '>');
    console.log('PeerNetWork::onStore4Remote__ address=<', address, '>');
    console.log('PeerNetWork::onStore4Remote__ cb=<', cb, '>');

    const relayPeer = this.route_.calcContent(address);
    console.log('PeerNetWork::onStore4Remote__ relayPeer=<',relayPeer,'>');
    
    console.log('PeerNetWork::onStore4Remote__ this.crypto_.id=<',this.crypto_.id,'>');
    
    const resource = {
      address:address,
      store:store,
      rank:rank,
      cb:cb      
    }
    if(relayPeer.min === this.crypto_.id || 
      relayPeer.max === this.crypto_.id
    ) {
      this.storage_.append(resource);
    }
    if(relayPeer.min !== this.crypto_.id && relayPeer.min !== fromId) {
      this.relayMsgTo_(relayPeer.min,resource);
    }
    if(relayPeer.max !== this.crypto_.id && relayPeer.max !== fromId) {
      this.relayMsgTo_(relayPeer.max,resource);
    }   
  }
  onFetch4Remote__(fromId, fetch, address, cb) {
    console.log('PeerNetWork::onFetch4Remote__ fromId=<', fromId, '>');
    console.log('PeerNetWork::onFetch4Remote__ fetch=<', fetch, '>');
    console.log('PeerNetWork::onFetch4Remote__ address=<', address, '>');
    console.log('PeerNetWork::onFetch4Remote__ cb=<', cb, '>');

    const relayPeer = this.route_.calcContent(address);
    console.log('PeerNetWork::onFetch4Remote__ relayPeer=<',relayPeer,'>');
    
    console.log('PeerNetWork::onFetch4Remote__ this.crypto_.id=<',this.crypto_.id,'>');



    const resourceFetch = {
      address:address,
      fetch:fetch,
      cb:cb      
    }
    if(relayPeer.min === this.crypto_.id || 
      relayPeer.max === this.crypto_.id
    ) {
      const self = this;
      this.storage_.fetch(resourceFetch,(localResource)=> {
        console.log('PeerNetWork::onFetch4Remote__:: localResource=<',localResource,'>');
        const fetchRespMsg = {
          fetchResp:localResource
        };
        fetchRespMsg.fetchResp.cb = resourceFetch.cb;
        fetchRespMsg.fetchResp.address = resourceFetch.address;
        self.sendMessage_(fromId,fetchRespMsg);        
      });
    }
    if(relayPeer.min !== this.crypto_.id && relayPeer.min !== fromId) {
      this.relayMsgTo_(relayPeer.min,resourceFetch);
    }
    if(relayPeer.max !== this.crypto_.id && relayPeer.max !== fromId) {
      this.relayMsgTo_(relayPeer.max,resourceFetch);
    }   
  }
  onFetchResponse__(fromId, fetchResp) {
    console.log('PeerNetWork::onFetchResponse__ fromId=<', fromId, '>');
    console.log('PeerNetWork::onFetchResponse__ fetchResp=<', fetchResp, '>');
    this.onFetchResponse(fetchResp);
    /*
    if(typeof this.replays_[fetchResp.cb] === 'function') {
      const respMsg = {
        fetchResp:fetchResp,
        cb:fetchResp.cb,
        remote:true,
        address:fetchResp.address
      };
      delete respMsg.fetchResp.cb;
      delete respMsg.fetchResp.address;
      this.replays_[respMsg.cb](respMsg);
    }
    */
  }

  relayMsgTo_(dst,msg) {
    //console.log('PeerNetWork::relayMsgTo_ dst=<', dst, '>');
    //console.log('PeerNetWork::relayMsgTo_ msg=<', msg, '>');
    this.sendMessage_(dst,msg);
  }
  
  relayRespTo_(dst,msg) {
    //console.log('PeerNetWork::relayRespTo_ dst=<', dst, '>');
    //console.log('PeerNetWork::relayRespTo_ msg=<', msg, '>');
    this.sendMessage_(dst,msg);
  }

}

module.exports = PeerNetWork;

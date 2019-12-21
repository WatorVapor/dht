'use strict';
const os = require('os');
const dgram = require("dgram");
const PeerMachine = require('./peer.machine.js');
const PeerCrypto = require('./peer.crypto.js');
const PeerPlace = require('./peer.place.js');
const PeerStorage = require('./peer.storage.js');

class PeerNetWork {
  constructor(config) {
    this.config = config;
    this.peers = {};
    this.crypto_ = new PeerCrypto(config);
    this.machine_ = new PeerMachine(config);
    this.storage_ = new PeerStorage(config);

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
    
    this.replays_ = {};
  }
  host() {
    return this.machine_.readMachienIp();
  }
  port() {
    return this.config.listen.ctrl.port;
  }

  publish(resource) {
    console.log('PeerNetWork::publish resource=<',resource,'>');
    const place = new PeerPlace(resource.address,this.peers,this.crypto_);
    //console.log('PeerNetWork::publish place=<',place,'>');
    //console.log('PeerNetWork::publish this.crypto_.idBS32=<',this.crypto_.idBS32,'>');
    if(place.isFinal(this.crypto_.idBS32)) {
      this.storage_.append(resource);
    }
    if(place.nearest !== this.crypto_.idBS32) {
      this.relayStoreMessage_(place.nearest,resource);
    }
    if(place.farthest !== this.crypto_.idBS32 && place.nearest !== place.farthest) {
      this.relayStoreMessage_(place.farthest,resource);
    }
  }
  fetch4KeyWord(keyWord,cb,reply) {
    console.log('PeerNetWork::fetch4KeyWord keyWord=<',keyWord,'>');
    const address = this.crypto_.calcResourceAddress(keyWord);
    console.log('PeerNetWork::fetch4KeyWord address=<',address,'>');
    const place = new PeerPlace(address,this.peers,this.crypto_);
    console.log('PeerNetWork::fetch4KeyWord place=<',place,'>');
    console.log('PeerNetWork::fetch4KeyWord this.crypto_.idBS32=<',this.crypto_.idBS32,'>');
    const fetchMessge = {
      address:address,
      cb:cb
    };
    if(place.isFinal(this.crypto_.idBS32)) {
      const localResource = this.storage_.fetch(fetchMessge);
      console.log('PeerNetWork::fetch4KeyWord localResource=<',localResource,'>');
      const fetchResp = {
        fetchResp:localResource,
        local:true,
        cb:cb
      };
      reply(fetchResp);
    }
    this.replays_[cb] = reply;    
    if(place.nearest !== this.crypto_.idBS32) {
      this.relayFetchMessage_(place.nearest,fetchMessge);
    }
    if(place.farthest !== this.crypto_.idBS32 && place.nearest !== place.farthest) {
      this.relayFetchMessage_(place.farthest,fetchMessge);
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
      if (msgJson.ctrl) {
        if (msgJson.ctrl.entry) {
          this.onNewNodeEntry__(rPeerId, rinfo.address, msgJson.listen);
        } else if (msgJson.ctrl.entrance) {
          this.onEntranceNode__(msgJson.ctrl.entrance);
        } else if (msgJson.ctrl.ping) {
          this.onPeerPing__(rPeerId,msgJson);
        } else if (msgJson.ctrl.pong) {
          //console.log('onMessageCtrlServer__ msgJson=<',msgJson,'>');
          this.onPeerPong__(rPeerId, msgJson.ctrl.pong);
        } else {
          console.log('onMessageCtrlServer__ msgJson=<', msgJson, '>');
        }
      } else if (msgJson.store) {
          //console.log('onMessageCtrlServer__ msgJson=<',msgJson,'>');
          this.onStore4Remote__(rPeerId, msgJson.store);
      } else if (msgJson.fetch) {
          //console.log('onMessageCtrlServer__ msgJson=<',msgJson,'>');
          this.onFetch4Remote__(rPeerId, msgJson.fetch);
      } else if (msgJson.fetchResp) {
          //console.log('onMessageCtrlServer__ msgJson=<',msgJson,'>');
          this.onFetchResponse__(rPeerId, msgJson.fetchResp);
      } else {
        console.log('onMessageCtrlServer__ msgJson=<', msgJson, '>');
      }
    } catch (e) {
      console.log('onMessageCtrlServer__ e=<', e, '>');
      console.log('onMessageCtrlServer__ msg.toString("utf-8")=<', msg.toString('utf-8'), '>');
    }
  };

  onNewNodeEntry__(id, rAddress, ports) {
    //console.log('onNewNodeEntry__ id=<',id,'>');
    //console.log('onNewNodeEntry__ rAddress=<',rAddress,'>');
    //console.log('onNewNodeEntry__ ports=<',ports,'>');
    //console.log('onNewNodeEntry__ this.peers=<',this.peers,'>');
    this.peers[id] = {
      host: rAddress,
      ports: ports
    };
    //console.log('onNewNodeEntry__ this.peers=<', this.peers, '>');

    let msg = {
      ctrl: {
        entrance: this.peers
      }
    };
    let msgSign = this.crypto_.sign(msg);
    const bufMsg = Buffer.from(JSON.stringify(msgSign));
    this.client.send(bufMsg, ports.ctrl.port, rAddress, (err) => {
      //console.log('onNewNodeEntry__ err=<',err,'>');
    });
  }
  onEntranceNode__(entrance) {
    //console.log('onEntranceNode__ entrance=<',entrance,'>');
    this.peers = Object.assign(this.peers, entrance);
    console.log('onEntranceNode__ this.peers=<',this.peers,'>');
    try {
    } catch (e) {
      console.log('onEntranceNode__ e=<', e, '>');
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
        ctrl: {
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
    }
    //console.log('onPeerPong__ this.peers=<',JSON.stringify(this.peers,undefined,2),'>');
  }



  doClientEntry__(entrance, listen) {
    console.log('doClientEntry__ entrance=<', entrance, '>');
    for (let address of entrance) {
      console.log('doClientEntry__ address=<', address, '>');
      let msg = {
        ctrl: {
          entry: true
        },
        listen: listen
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
        ctrl: {
          ping: true
        }
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
      if (peer !== this.crypto_.idBS32) {
        fn(peer, peerInfo);
      }
    }
  }

  onListenCtrlServer(evt) {
    const address = this.serverCtrl.address();
    console.log('onListenCtrlServer address=<', address, '>');
    const self = this;
    setTimeout(()=>{
      self.doClientEntry__(self.config.entrance, self.config.listen);
    },0);
    setTimeout(()=>{
      self.doClientPing__();
    },1000*1);
    this.peers[this.crypto_.idBS32] = {
      host: this.machine_.readMachienIp(),
      ports: this.config.listen
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
  onStore4Remote__(fromId, store) {
    //console.log('PeerNetWork::onStore4Remote__ fromId=<', fromId, '>');
    //console.log('PeerNetWork::onStore4Remote__ store=<', store, '>');
    const place = new PeerPlace(store.address,this.peers,this.crypto_);
    //console.log('PeerNetWork::onStore4Remote__ place=<',place,'>');
    //console.log('PeerNetWork::onStore4Remote__:: this.crypto_.idBS32=<',this.crypto_.idBS32,'>');
    if(place.isFinal(this.crypto_.idBS32)) {
      this.storage_.append(store);
    }
    if(place.nearest !== this.crypto_.idBS32 && place.nearest !== fromId) {
      this.relayStoreMessage_(place.nearest,store);
    }
    if(place.farthest !== this.crypto_.idBS32 && place.nearest !== place.farthest && place.farthest !== fromId) {
      this.relayStoreMessage_(place.farthest,store);
    }
  }
  onFetch4Remote__(fromId, fetch) {
    //console.log('PeerNetWork::onFetch4Remote__ fromId=<', fromId, '>');
    //console.log('PeerNetWork::onFetch4Remote__ fetch=<', fetch, '>');
    const place = new PeerPlace(fetch.address,this.peers,this.crypto_);
    //console.log('PeerNetWork::onFetch4Remote__ place=<',place,'>');
    //console.log('PeerNetWork::onFetch4Remote__:: this.crypto_.idBS32=<',this.crypto_.idBS32,'>');
    if(place.isFinal(this.crypto_.idBS32)) {
      const localResource = this.storage_.fetch(fetch);
      console.log('PeerNetWork::onFetch4Remote__:: localResource=<',localResource,'>');
      const fetchRespMsg = {
        fetchResp:localResource
      };
      fetchRespMsg.fetchResp.cb = fetch.cb;
      this.sendMessage_(fromId,fetchRespMsg);
    }
    if(place.nearest !== this.crypto_.idBS32 && place.nearest !== fromId) {
      this.relayFetchMessage_(place.nearest,fetch);
    }
    if(place.farthest !== this.crypto_.idBS32 && place.nearest !== place.farthest && place.farthest !== fromId) {
      this.relayFetchMessage_(place.farthest,fetch);
    }
  }
  onFetchResponse__(fromId, fetchResp) {
    console.log('PeerNetWork::onFetchResponse__ fromId=<', fromId, '>');
    console.log('PeerNetWork::onFetchResponse__ fetchResp=<', fetchResp, '>');
    if(typeof this.replays_[fetchResp.cb] === 'function') {
      this.replays_[fetchResp.cb](fetchResp);
    }
  }

}

module.exports = PeerNetWork;

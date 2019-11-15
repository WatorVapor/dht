'use strict';
const os = require('os');
const dgram = require("dgram");
const PeerMachine = require('./peer.machine.js');
const PeerCrypto = require('./peer.crypto.js');


class PeerNetWork {
  constructor(config) {
    this.config = config;
    this.peers = {};
    this.crypto_ = new PeerCrypto(config);
    this.serverCtrl = dgram.createSocket("udp6");
    this.client = dgram.createSocket("udp6");
    this.machine_ = new PeerMachine(config);

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
          const addressIndex = this.ip__.indexOf(rinfo.address);
          //console.log('onMessageCtrlServer__ addressIndex=<',addressIndex,'>');
          if (addressIndex === -1) {
            this.onNewNodeEntry__(rPeerId, rinfo.address, msgJson.listen);
          } else {
            this.onNewNodeEntry__(rPeerId, rinfo.address, msgJson.listen);
          }
        } else if (msgJson.ctrl.entrance) {
          //console.log('onMessageCtrlServer__ msgJson=<',msgJson,'>');
          this.onEntranceNode__(msgJson.ctrl.entrance);
        } else if (msgJson.ctrl.ping) {
          //console.log('onMessageCtrlServer__ msgJson=<',msgJson,'>');
          const sentTp = new Date(msgJson.sign.ts);
          sentTp.setMilliseconds(msgJson.sign.ms);
          //console.log('onMessageCtrlServer__ sentTp=<',sentTp,'>');
          const recieveTp = new Date();
          const tta = recieveTp - sentTp;
          //console.log('onMessageCtrlServer__ tta=<',tta,'>');
          this.onPeerPing__(rPeerId, sentTp, tta);
        } else if (msgJson.ctrl.pong) {
          //console.log('onMessageCtrlServer__ msgJson=<',msgJson,'>');
          this.onPeerPong__(rPeerId, msgJson.ctrl.pong);
        } else if (msgJson.ctrl.subscribe) {
          //console.log('onMessageCtrlServer__ msgJson=<',msgJson,'>');
          this.onSubscribe__(rPeerId, msgJson.ctrl.subscribe);
        } else {
          console.log('onMessageCtrlServer__ msgJson=<', msgJson, '>');
        }
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
    console.log('onNewNodeEntry__ this.peers=<', this.peers, '>');

    let msg = {
      ctrl: {
        entrance: this.peers
      }
    };
    let msgSign = this.crypto_.sign(msg);
    const bufMsg = Buffer.from(JSON.stringify(msgSign));
    this.client.send(bufMsg, ports.ctrl, rAddress, (err) => {
      //console.log('doClientEntry__ err=<',err,'>');
    });
  }
  onEntranceNode__(entrance) {
    //console.log('onEntranceNode__ entrance=<',entrance,'>');
    this.peers = Object.assign(this.peers, entrance);
    //console.log('onEntranceNode__ this.peers=<',this.peers,'>');
    try {
    } catch (e) {
      console.log('onEntranceNode__ e=<', e, '>');
    }
  }



  onPeerPing__(id, pingTp, tta) {
    //console.log('onPeerPing__ id=<',id,'>');
    //console.log('onPeerPing__ tta=<',tta,'>');
    if (this.peers[id]) {
      //console.log('onPeerPing__ this.peers[id]=<',this.peers[id],'>');
      this.peers[id].tta = tta;

      const peerInfo = this.peers[id];
      const now = new Date();
      let msg = {
        ctrl: {
          pong: {
            ping: {
              ts: pingTp.toGMTString(),
              ms: pingTp.getMilliseconds()
            },
            pong: {
              ts: now.toGMTString(),
              ms: now.getMilliseconds()
            }
          }
        }
      };
      let msgSign = this.crypto_.sign(msg);
      const bufMsg = Buffer.from(JSON.stringify(msgSign));
      this.client.send(bufMsg, peerInfo.ports.ctrl, peerInfo.host, (err) => {
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
    //console.log('onPeerPong__ this.peers=<',this.peers,'>');
  }
  
  onSubscribe__(rPeer,subscribe) {
    //console.log('onSubscribe__ rPeer=<',rPeer,'>');
    //console.log('onSubscribe__ subscribe=<',subscribe,'>');
    if(!this.subscribers[subscribe.address]) {
      this.subscribers[subscribe.address] = {};
      this.subscribers[subscribe.address][rPeer] = {};
    }
    if(!this.subscribers[subscribe.address][rPeer]) {
      this.subscribers[subscribe.address][rPeer] = {};
    }
    this.subscribers[subscribe.address][rPeer][subscribe.topic] = true;
    //console.log('onSubscribe__ this.subscribers=<',this.subscribers,'>');
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

  doClientPing__() {
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
      this.client.send(bufMsg, peerInfo.ports.ctrl, peerInfo.host, (err) => {
        //console.log('doClientPing__ err=<',err,'>');
      });
    });
  };

  eachRemotePeer__(fn) {
    for (let peer in this.peers) {
      //console.log('eachRemotePeer__ peer=<',peer,'>');
      let peerInfo = this.peers[peer];
      //console.log('eachRemotePeer__ peerInfo=<',peerInfo,'>');
      if (peer !== this.crypto_.idB58) {
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
  };

}

module.exports = PeerNetWork;
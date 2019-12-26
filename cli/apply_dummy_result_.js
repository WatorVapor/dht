'use strict';
const path = require('path');
const DHT = require('../api/DHTUnxiSocket.js');
const dht = new DHT();
//console.log(':: dht=<',dht,'>');
dht.peerInfo((peerInfo)=>{
  console.log('dht.peerInfo:: peerInfo=<',peerInfo,'>');
});



const page1 = {
  url:'https://zh.wikipedia.org/wiki/汉语',
  summary :'汉语'
};

const page2 = {
  url:'https://www.6parknews.com/newspark/view.php?app=news&act=view&nid=386668',
  summary :'航母'
};

const page3 = {
  url:'https://zh.wikipedia.org/wiki/航母',
  summary :'航母'
};

const page4 = {
  url:'https://www.6parknews.com/newspark/view.php?app=news&act=view&nid=386668',
  summary :'海试'
};

const appendData = ()=> {
  
  dht.append('汉语',JSON.stringify(page1,undefined,'  '),(info) => {
    console.log('dht.append:: info.store=<',info.store,'>');
  });  
  dht.append('航母',JSON.stringify(page2,undefined,'  '),(info) => {
    console.log('dht.append:: info.store=<',info.store,'>');
  });
  dht.append('航母',JSON.stringify(page3,undefined,'  '),(info) => {
    console.log('dht.append:: info.store=<',info.store,'>');
  });
  dht.append('海试',JSON.stringify(page4,undefined,'  '),(info)=> {
    console.log('dht.append:: info.store=<',info.store,'>');
  });
};

setTimeout(appendData,1000);


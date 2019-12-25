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
  summary :''
};

const page2 = {
  url:'https://www.6parknews.com/newspark/view.php?app=news&act=view&nid=386668',
  summary :''
};

const page3 = {
  url:'https://zh.wikipedia.org/wiki/%E8%88%AA%E7%A9%BA%E6%AF%8D%E8%88%B0',
  summary :''
};

const page4 = {
  url:'https://www.6parknews.com/newspark/view.php?app=news&act=view&nid=386668',
  summary :''
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

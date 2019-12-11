'use strict';
const path = require('path');
const DHT = require('../api/dht.js');
const dht = new DHT();
//console.log(':: dht=<',dht,'>');
dht.peerInfo((peer)=>{
  console.log(':: peer=<',peer,'>');
});

const appendData = ()=> {
  dht.append('汉语','https://zh.wikipedia.org/wiki/汉语');
  dht.append('航母','https://www.6parknews.com/newspark/view.php?app=news&act=view&nid=386668');
  dht.append('航母','https://zh.wikipedia.org/wiki/%E8%88%AA%E7%A9%BA%E6%AF%8D%E8%88%B0');
  dht.append('海试','https://www.6parknews.com/newspark/view.php?app=news&act=view&nid=386668');
};

setTimeout(appendData,1000);

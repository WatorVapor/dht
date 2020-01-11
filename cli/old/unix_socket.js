'use strict';
const path = require('path');
const DHT = require('../api/DHTUnxiSocket.js');
const dht = new DHT();
//console.log(':: dht=<',dht,'>');
dht.peerInfo((peerInfo)=>{
  console.log('dht.peerInfo:: peerInfo=<',peerInfo,'>');
});

const appendData = ()=> {
  dht.append('汉语','https://zh.wikipedia.org/wiki/汉语',(info) => {
    console.log('dht.append:: info.store=<',info.store,'>');
  });  
  dht.append('航母','https://www.6parknews.com/newspark/view.php?app=news&act=view&nid=386668',(info) => {
    console.log('dht.append:: info.store=<',info.store,'>');
  });
  dht.append('航母','https://zh.wikipedia.org/wiki/%E8%88%AA%E7%A9%BA%E6%AF%8D%E8%88%B0',(info) => {
    console.log('dht.append:: info.store=<',info.store,'>');
  });
  dht.append('海试','https://www.6parknews.com/newspark/view.php?app=news&act=view&nid=386668',(info)=> {
    console.log('dht.append:: info.store=<',info.store,'>');
  });
};

//setTimeout(appendData,1000);

const fetchData = ()=> {
  dht.fetch4KeyWord('汉语',(resource) => {
    //console.log('dht.fetch4KeyWord:: resource=<',resource,'>');
    onFetchResult(resource);
  });  
  dht.fetch4KeyWord('航母',(resource) => {
    //console.log('dht.fetch4KeyWord:: resource=<',resource,'>');
    onFetchResult(resource);
  });
  dht.fetch4KeyWord('航母',(resource) => {
    //console.log('dht.fetch4KeyWord:: resource=<',resource,'>');
    onFetchResult(resource);
  });
  dht.fetch4KeyWord('海试',(resource)=> {
    //console.log('dht.fetch4KeyWord:: resource=<',resource,'>');
    onFetchResult(resource);
  });
};


setTimeout(fetchData,1000);

const onFetchResult = (result) => {
  console.log('dht.onFetchResult:: result=<',result,'>');
}

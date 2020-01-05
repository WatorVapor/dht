const redis = require('redis');
const redisOption = {
  host:'node2.ceph.wator.xyz',
  port:16379,
  family:'IPv6',
  password:'QfIvXWQCxnTZlEpT',
};
const redisNewsChannelDiscovery = 'redis.channel.news.discover.multi.lang';
const gSubscriber = redis.createClient(redisOption);


gSubscriber.on('message', (channel, message) => {
  console.log('gSubscriber::message=<',message,'>');
  onDiscoveryNewLink(message);
})
gSubscriber.subscribe(redisNewsChannelDiscovery);


const NewsTextReader = require('./wai/news.text.reader.js');
const constTextDBPath = '/storage/dhtfs/cluster/indexer/news_text_db';


const WaiIndexBot = require('./wai/wai.indexbot.js');

const wai = new WaiIndexBot();

const LevelDFS = require('./LevelDFS.js');
//console.log('::LevelDFS=<',LevelDFS,'>');
const db = new LevelDFS('/storage/dhtfs/cluster/news_pumper/cn/news_discovery_db');
const gNewLinks = [];
const onDiscoveryNewLink = (href) => {
  gNewLinks.push(href);
  if(gNewLinks.length > 20) {
    gNewLinks.shift();
  }
  setTimeout(onLearnNewLink,1);
}

const onLearnNewLink = () => {
  const now = new Date();
  if(gNewLinks.length < 1) {
    console.log('onLearnNewLink:: gNewLinks=<',gNewLinks,'>');
    return;
  } 
  let href = gNewLinks[gNewLinks.length -1];
  //console.log('onLearnNewLink::href=<',href,'>');
  //console.log('onLearnNewLink:: gNewLinks=<',gNewLinks,'>');
  gNewLinks.splice(-1);
  //console.log('onLearnNewLink:: gNewLinks=<',gNewLinks,'>');
  db.get(href, (err, value) => {
    if(err) {
      throw err;
    }
    //console.log('onLearnNewLink::value=<',value,'>');
    let jsValue;
    try {
      jsValue = JSON.parse(value);
      if(jsValue.indexer) {
        setTimeout(onLearnNewLink,1000);
        return;
      }
      jsValue.indexer = true;
      let contents = JSON.stringify(jsValue);
      db.put(href,contents);
    }
    catch(e) {
      console.log('onLearnNewLink::e=<',e,'>');
      let contents = JSON.stringify({href:href,discover:true,indexer:true});
      db.put(href,contents);
    }
    const txtReader = new NewsTextReader(constTextDBPath);
    console.log('onLearnNewLink::jsValue=<',jsValue,'>');
    txtReader.fetch(href,(txt,title,myhref)=>{
      onNewsText(txt,title,myhref,jsValue.lang);
    });
  });
}



const onNewsText = (txt,title,myhref,lang) => {
  //console.log('onNewsText::txt=<',txt,'>');
  //console.log('onNewsText::myhref=<',myhref,'>');
  let wordIndex = wai.article(txt,lang);
  //console.log('onNewsText::wordIndex=<',wordIndex,'>');
  onSaveIndex(myhref,wordIndex,lang,title,txt);  

/*
  let wordTitleIndex = wai.article(title,lang);
  console.log('onNewsText::wordTitleIndex=<',wordTitleIndex,'>');
*/
  setTimeout(onLearnNewLink,0);
}




const onSaveIndex = (myhref,wordIndex,lang,title,txt) => {
  //console.log('onSaveIndex::myhref=<',myhref,'>');
  //console.log('onSaveIndex::wordIndex=<',wordIndex,'>');
  //console.log('onSaveIndex::lang=<',lang,'>');
  //console.log('onSaveIndex::title=<',title,'>');
  //console.log('onSaveIndex::txt=<',txt,'>');
  for(const word in wordIndex) {
    //console.log('onSaveIndex::word=<',word,'>');
    const searchIndex = Object.assign({word:word},wordIndex[word]);
    searchIndex.lang = lang;
    searchIndex.title = title;
    searchIndex.href = myhref;
    //console.log('onSaveIndex::searchIndex=<',searchIndex,'>');
    onSaveIndex2DHT(searchIndex);
  }
}


const DHT = require('../api/DHTUnxiSocket.js');
const dht = new DHT();
//console.log(':: dht=<',dht,'>');
dht.peerInfo((peerInfo)=>{
  console.log('dht.peerInfo:: peerInfo=<',peerInfo,'>');
});

const onSaveIndex2DHT = (searchIndex) => {
  //console.log('onSaveIndex2DHT::searchIndex=<',searchIndex,'>');
  
  /*
  dht.append(searchIndex.word,JSON.stringify(searchIndex,undefined,'  '),(info) => {
    onAppend2DHTResult(info);
  });
  */
}

const onAppend2DHTResult = (info) => {
  console.log('onAppend2DHTResult:: info.store=<',info.store,'>');
};

/**
 test
**/
wai.onReady = () => {
  const href = 'http://baijiahao.baidu.com/s?id=1654747834509146801';
  let contents = JSON.stringify({href:href,discover:true,indexer:false,lang:'cn'});
  db.put(href,contents);
  setTimeout(()=>{
    onDiscoveryNewLink(href);
  },1000);
}


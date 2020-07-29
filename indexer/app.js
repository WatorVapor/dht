const redis = require('redis');
const redisOption = {
  path:'/dev/shm/dht.ermu.api.redis.sock'
};

const redisNewsChannelDiscovery = 'redis.channel.news.discover.multi.lang';
const gSubscriber = redis.createClient(redisOption);


gSubscriber.on('message', (channel, message) => {
  //console.log('gSubscriber::message=<',message,'>');
  onDiscoveryNewLink(message);
})
gSubscriber.subscribe(redisNewsChannelDiscovery);


const NewsTextReader = require('./wai/news.text.reader.js');
const constTextDBPath = '/storage/dhtfs/cluster/indexer/news_text_db';


const WaiIndexBot = require('./wai/wai.indexbot.js');

const wai = new WaiIndexBot();
const WaiIndexLinkCacheMax = 20;

const KVFolder = require('dht.mesh').KVFolder;
//console.log('::KVFolder=<',KVFolder,'>');
const db = new KVFolder('/storage/dhtfs/cluster/news_pumper/cn/news_discovery_db');

const gNewMessageLinks = [];
const onDiscoveryNewLink = (msg) => {
  gNewMessageLinks.push(msg);
  if(gNewMessageLinks.length > WaiIndexLinkCacheMax) {
    gNewMessageLinks.shift();
  }
  setTimeout(onLearnNewLink,1);
}

const onLearnNewLink = () => {
  const now = new Date();
  if(gNewMessageLinks.length < 1) {
    console.log('onLearnNewLink:: gNewMessageLinks=<',gNewMessageLinks,'>');
    return;
  } 
  const msg = gNewMessageLinks[gNewMessageLinks.length -1];
  gNewMessageLinks.splice(-1);
  //console.log('onLearnNewLink:: gNewMessageLinks=<',gNewMessageLinks,'>');
  try {
    //console.log('onLearnNewLink::msg=<',msg,'>');
    const msgJson = JSON.parse(msg);
    //console.log('onLearnNewLink::msgJson=<',msgJson,'>');
    const href = msgJson.href;
    //console.log('onLearnNewLink::href=<',href,'>');
    //console.log('onLearnNewLink:: gNewMessageLinks=<',gNewMessageLinks,'>');
    const value = db.get(href);
    console.log('onLearnNewLink::value=<',value,'>');
    const jsValue = JSON.parse(value);
    if(jsValue.indexer) {
      setTimeout(onLearnNewLink,1000);
      return;
    }
    jsValue.indexer = true;
    let contents = JSON.stringify(jsValue);
    db.put(href,contents);
    const txtReader = new NewsTextReader(constTextDBPath);
    //console.log('onLearnNewLink::jsValue=<',jsValue,'>');
    txtReader.fetch(href,(txt,title,myhref)=>{
      onNewsText(txt,title,myhref,jsValue.lang,jsValue);
    });
  } catch(e) {
    console.log('onLearnNewLink::e=<',e,'>');
  }
}



const onNewsText = async (txt,title,myhref,lang,crawler) => {
  //console.log('onNewsText::txt=<',txt,'>');
  //console.log('onNewsText::title=<',title,'>');
  //console.log('onNewsText::myhref=<',myhref,'>');
  let wordIndex = wai.article(txt,lang);
  //console.log('onNewsText::wordIndex=<',wordIndex,'>');
  await onSaveIndex(myhref,wordIndex,lang,title,txt,crawler);
  setTimeout(onLearnNewLink,0);
}


const DHTUtils = require('dht.mesh').DHTUtils;
console.log('::DHTUtils=<',DHTUtils,'>');
const dhtUtils = new DHTUtils();

const KeyValueStore = require('dht.mesh').KV;
const KeyWordStore = require('dht.mesh').KW;
const kv = new KeyValueStore();
console.log('::.:: kv=<',kv,'>');
const kw = new KeyWordStore();
console.log('::.:: kw=<',kw,'>');


const onSaveIndex = async (myhref,wordIndex,lang,title,txt,crawler) => {
  //console.log('onSaveIndex::myhref=<',myhref,'>');
  //console.log('onSaveIndex::wordIndex=<',wordIndex,'>');
  //console.log('onSaveIndex::lang=<',lang,'>');
  //console.log('onSaveIndex::title=<',title,'>');
  //console.log('onSaveIndex::txt=<',txt,'>');
  console.log('onSaveIndex::wordIndex.length=<',Object.keys(wordIndex).length,'>');
  const allSearchIndex = {};
  for(const word in wordIndex) {
    //console.log('onSaveIndex::word=<',word,'>');
    const searchIndex = Object.assign({word:word},wordIndex[word]);
    searchIndex.lang = lang;
    searchIndex.title = title;
    searchIndex.href = myhref;
    searchIndex.area = crawler.area;
    //console.log('onSaveIndex::wordIndex=<',wordIndex,'>');
    const address = kv.store(searchIndex).address;
    console.log('onSaveIndex::address=<',address,'>');
    console.log('onSaveIndex::wordIndex[word].freq=<',wordIndex[word].freq,'>');
    if(wordIndex[word].freq > 0) {
      kw.append(word,address,wordIndex[word].freq);
    }
  }  
  wai.clear();
  try {
    global.gc();
  } catch(e) {   
  }  
}


/**
 test
**/
wai.onReady = () => {
  
  const hrefTest = 'https://3w.huanqiu.com/a/c36dc8/9CaKrnKoYBm?agt=8';
  console.log('wai.onReady:: hrefTest=<',hrefTest,'>');
  let contents = JSON.stringify({
    href:hrefTest,discover:true,lang:'cn',
    indexer:false,
    area:[
      '6zxss4axnqj3y2367j1pf6mdge5k6fph',
      'nvv21aetv386a71p7macwhgc98468gym'
    ]
  });
  db.put(hrefTest,contents);
  setTimeout(()=>{
    onDiscoveryNewLink(contents);
  },1000);
  
}


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


const NewsTextReader = require('./wai2/news.text.reader.js');
const constTextDBPath = '/storage/dhtfs/cluster/indexer/news_text_db';


const WaiIndexBot = require('./wai2/wai.indexbot.js');

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
      /*
      if(jsValue.indexer) {
        setTimeout(onLearnNewLink,1000);
        return;
      }
      */
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
    txtReader.fetch(href,(txt,myhref)=>{
      onNewsText(txt,myhref,jsValue.lang);
    });
  });
}



const onNewsText = (txt,myhref,lang) => {
  //console.log('onNewsText::txt=<',txt,'>');
  //console.log('onNewsText::myhref=<',myhref,'>');
  let tags = wai.article(txt,lang);
  //console.log('onNewsText::tags=<',tags,'>');
  onSaveIndex(myhref,tags);  
  setTimeout(onLearnNewLink,0);
}

const onSaveIndex = (txt,myhref) => {
  console.log('onSaveIndex::txt=<',txt,'>');
  console.log('onSaveIndex::myhref=<',myhref,'>');
}

/**
 test
**/
wai.onReady = () => {
  setTimeout(()=>{
    onDiscoveryNewLink('http://baijiahao.baidu.com/s?id=1654086080000570017');
  },1000);
}


let gLastPostTitterTime = new Date();

const redis = require('redis');
const redisOption = {
  host:'node2.ceph.wator.xyz',
  port:6379,
  family:'IPv6'
};
const redisNewsChannelDiscovery = 'redis.channel.news.discover';
const gSubscriber = redis.createClient(redisOption);


gSubscriber.on('message', (channel, message) => {
  onDiscoveryNewLink(message);
})
gSubscriber.subscribe(redisNewsChannelDiscovery);


const NewsTextReader = require('./wai/news.text.reader.js');
const constTextDBPath = '/watorvapor/ldfs/tagbot/news_text_db';


const WaiTagBot = require('./wai/wai.tagbot.js');

const wai = new WaiTagBot();

const LevelDFS = require('./LevelDFS.js');
//console.log('::LevelDFS=<',LevelDFS,'>');
const db = new LevelDFS('/watorvapor/ldfs/tagbot/news_discovery_db');
const gNewLinks = [];
const onDiscoveryNewLink = (href) => {
  gNewLinks.push(href);
  if(gNewLinks.length > 5) {
    gNewLinks.shift();
  }
  setTimeout(onLearnNewLink,1000);
}

const onLearnNewLink = () => {
  const now = new Date();
  const escape = now - gLastPostTitterTime;
  if(escape < 1000 * 60 * 5){
    console.log('onLearnNewLink:: too busy gNewLinks=<',gNewLinks,'>');
    console.log('onLearnNewLink:: escape=<',escape,'>');
    console.log('onLearnNewLink:: now=<',now.toUTCString(),'>');
    return;
  }
  if(gNewLinks.length < 1) {
    console.log('onLearnNewLink:: gNewLinks=<',gNewLinks,'>');
    return;
  } 
  let href = gNewLinks[gNewLinks.length -1];
  console.log('onLearnNewLink::href=<',href,'>');
  console.log('onLearnNewLink:: gNewLinks=<',gNewLinks,'>');
  gNewLinks.splice(-1);
  console.log('onLearnNewLink:: gNewLinks=<',gNewLinks,'>');
  db.get(href, (err, value) => {
    if(err) {
      throw err;
    }
    console.log('onLearnNewLink::value=<',value,'>');
    try {
      const valueJson = JSON.parse(value);
      if(valueJson.twitter) {
        setTimeout(onLearnNewLink,1000);
        return;
      }
      valueJson.twitter = true;
      let contents = JSON.stringify(valueJson);
      db.put(href,contents);
    }
    catch(e) {
      console.log('onLearnNewLink::e=<',e,'>');
      let contents = JSON.stringify({href:href,discover:true,twitter:true});
      db.put(href,contents);
    }
    const txtReader = new NewsTextReader(constTextDBPath);
    txtReader.fetch(href,(txt,myhref)=>{
      onNewsText(txt,myhref);
    });
  });
}



const onNewsText = (txt,myhref) => {
  //console.log('onNewsText::txt=<',txt,'>');
  //console.log('onNewsText::myhref=<',myhref,'>');
  let tags = wai.article(txt);
  //console.log('onNewsText::tags=<',tags,'>');
  if(tags.length > 8) {
    postTwitter(myhref,tags);
    return;
  }
  setTimeout(onLearnNewLink,1000);
}


const Twitter = require('twitter');
const clientTwitter = new Twitter({
  consumer_key: 'cKcYfmC6niawGY7kLC9hGHafW',
  consumer_secret: 'MZ5FP6BYItZOOLuciabtuwHyiHH78bqRb1HnrE3K4PK9obDM5l',
  access_token_key: '2479678550-zBgOIqB81GtIQj99K6pyqbDlN0dqlJx8pbNCnVp',
  access_token_secret: '7gxQyigISdvfjKNgQA6VCEIOtcZMSWDyGQs04rg2NgXXq'
});
const postTwitter = (myhref,tags) => {
  console.log('postTwitter::myhref=<',myhref,'>');
  console.log('postTwitter::tags=<',tags,'>');
  let contents = '';
  for(let tag of tags) {
    contents += ' #' + tag.tag + '';
  }
  contents += '\n'
  contents += '\n'
  contents += '\n'
  contents += myhref;
  contents += '\n';
  contents += '\n'
  contents += '\n'
  contents += '  请关注 https://www.wator.xyz  \n'
  contents += '\n'
  contents += '\n'
  contents += '\n'
  contents += '  请关注 https://www.wator.xyz/wai  \n'
  contents += '\n'
  contents += '\n'
  contents += '\n'
  const postObject = {status: contents};
  console.log('postTwitter::postObject=<',postObject,'>');
  clientTwitter.post('statuses/update', postObject, (error, tweets, response) => {
    gLastPostTitterTime = new Date();;
    if (error) {
      console.log('postTwitter::error=<',error,'>');
      setTimeout(onLearnNewLink,1000 * 60 * 5);
      throw error;
    }
    setTimeout(onLearnNewLink,1000*60*5);
    //console.log('postTwitter::tweets=<',tweets,'>');
    //console.log('postTwitter::response=<',response,'>');
  });
}

/**
 test
**/
wai.onReady = () => {
  setTimeout(()=>{
    onDiscoveryNewLink('http://www.xinhuanet.com/politics/leaders/2019-07/22/c_1124785008.htm');
  },1000*60);
}


const WaiTagBot = require('./wai2/wai.tagbot.js');
const LevelDFS = require('./LevelDFS.js');
//console.log('::LevelDFS=<',LevelDFS,'>');
const redis = require('redis');
const redisOption = {
  host:'node2.ceph.wator.xyz',
  port:16379,
  password:'QfIvXWQCxnTZlEpT',
  family:'IPv6'
};
const redisNewsChannelDiscovery = 'redis.channel.news.discover.multi.lang';
const gSubscriber = redis.createClient(redisOption);

const redisNewsChannelSNSBot = 'redis.channel.news.discover.multi.lang.snsbot';
const gPublish = redis.createClient(redisOption);

const NewsTextReader = require('./wai2/news.text.reader.js');


const iConstSNSEscapeTime = 1000*1;

module.exports = class TagBot {
  constructor() {
    this.wai_ = new WaiTagBot();
    this.gNewLinks_ = [];
    let self = this;
    gSubscriber.on('message', (channel, message) => {
      self.onDiscoveryNewLink_(message);
    })
    gSubscriber.subscribe(redisNewsChannelDiscovery);
    //this.hrefdb_ = new LevelDFS(dbPath);
    //this.textdb_ = new LevelDFS(textdb);
    
    /**
     test
    **/
    this.wai_.onReady = () => {
      setTimeout(()=>{
        let msg = {
          lang:'ja',
          href:'https://headlines.yahoo.co.jp/hl?a=20190805-00000106-kyodonews-int',
          linkdb:'/watorvapor/ldfs/tagbot/ja/news_discovery_db',
          textdb:'/watorvapor/ldfs/tagbot/ja/news_text_contents_db'
        };
        self.onDiscoveryNewLink_(JSON.stringify(msg));
      },1000*2);
    }
  }
  onDiscoveryNewLink_ (msg){
    this.gNewLinks_.push(msg);
    if(this.gNewLinks_.length > 5) {
      this.gNewLinks_.shift();
    }
    setTimeout(this.onLearnNewLink_.bind(this),1000);
  }
  onLearnNewLink_ () {
    if(this.gNewLinks_.length < 1) {
      console.log('onLearnNewLink_:: this.gNewLinks_=<',this.gNewLinks_,'>');
      return;
    }
    let msg = this.gNewLinks_[this.gNewLinks_.length -1];
    let msgJson = JSON.parse(msg);
    let lang = msgJson.lang;
    let href = msgJson.href;
    console.log('onLearnNewLink_::href=<',href,'>');
    this.gNewLinks_.splice(-1);
    console.log('onLearnNewLink_:: this.gNewLinks_=<',this.gNewLinks_,'>');
    let self = this;
    let db = new LevelDFS(msgJson.linkdb);
    db.get(href, (err, value) => {
      if(err) {
         console.log('onLearnNewLink_::err=<',err,'>');
         console.log('onLearnNewLink_::msgJson.linkdb=<',msgJson.linkdb,'>');
         console.log('onLearnNewLink_::value=<',value,'>');
         return;
      }
      console.log('onLearnNewLink_::value=<',value,'>');
      try {
        const valueJson = JSON.parse(value);
        /*
        if(valueJson.wordtag) {
          setTimeout(self.onLearnNewLink_.bind(self),1000);
          return;
        }
        */
        valueJson.wordtag = true;
        let contents = JSON.stringify(valueJson);
        db.put(href,contents);
      }
      catch(e) {
        console.log('onLearnNewLink_::e=<',e,'>');
        let contents = JSON.stringify({
          href:href,
          discover:true,
          wordtag:true}
        );
        db.put(href,contents);
      }
      const txtReader = new NewsTextReader(msgJson.textdb,msgJson.lang);
      txtReader.fetch(href,(txt,myhref,myLang)=>{
        self.onNewsText_(txt,myhref,myLang,msgJson);
      });
    });
  }
  onNewsText_(txt,myhref,myLang,msgJson) {
    //console.log('onNewsText::txt=<',txt,'>');
    //console.log('onNewsText::myhref=<',myhref,'>');
    let tags = this.wai_.article(txt,myLang);
    //console.log('onNewsText::tags=<',tags,'>');
    if(tags.length > 8) {
      this.postSNS_(tags,msgJson);
      return;
    }
    setTimeout(this.onLearnNewLink_.bind(this),1000);
  }

  postSNS_ (tags,msgJson){
    //console.log('postSNS_::tags=<',tags,'>');
    msgJson.tags = tags;
    console.log('postSNS_::msgJson=<',msgJson,'>');
    gPublish.publish(redisNewsChannelSNSBot,JSON.stringify(msgJson));
  }
}



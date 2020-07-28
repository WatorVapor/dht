const http = require('http');
const https = require('https');
const cheerio = require('cheerio');
const fs = require('fs');
const url = require('url');
const KVFolder = require('dht.mesh').KVFolder;
console.log('::KVFolder=<',KVFolder,'>');
const DHTUtils = require('dht.mesh').DHTUtils;
console.log('::DHTUtils=<',DHTUtils,'>');

const redis = require('redis');
const redisOption = {
  path:'/dev/shm/dht.ermu.api.redis.sock'
};
const bs32Option = { type: "crockford", lc: true };

const redisNewsChannelDiscovery = 'redis.channel.news.discover.multi.lang';
const gPublisher = redis.createClient(redisOption);
gPublisher.on('error', (err) => {
    console.log('gPublisher error::err=<',err,'>');
});
gPublisher.on('ready', (evt) => {
    console.log('gPublisher ready ::evt=<',evt,'>');
});
gPublisher.on('end', (evt) => {
    console.log('gPublisher end ::evt=<',evt,'>');
});

module.exports = class NewsPumper {
  constructor(seed,linkDBPath,dbTextContent,lang) {
    this.seed_ = seed;
    this.linkDBPath_ = linkDBPath;
    if (!fs.existsSync(linkDBPath)) {
      fs.mkdirSync(linkDBPath,{ recursive: true });
    }
    this.linkDB_ = new KVFolder(linkDBPath);
    this.utils_ = new DHTUtils();
    this.lang_ = lang;
    this.lastReadTime_ = new Date();
    if (!fs.existsSync(dbTextContent)) {
      fs.mkdirSync(dbTextContent,{ recursive: true });
    }
    this.textDBPath_ = dbTextContent;
    this.areaA_ = this.utils_.calcAddress(JSON.stringify(this.seed_));
    console.log('readNews_::this.areaA_=<',this.areaA_,'>');
    this.areaB_ = this.utils_.calcAddress(this.lastReadTime_.getFullYear().toString());
    console.log('readNews_::this.areaB_=<',this.areaB_,'>');
    this.areaC_ = this.utils_.calcAddress(this.lastReadTime_.getFullYear().toString() + this.lastReadTime_.getMonth().toString());
    console.log('readNews_::this.areaC_=<',this.areaC_,'>');
  }
  turn() {
    this.globalLoopIndex_ = 0;
    let self = this;
    setTimeout(()=>{
      self.readNews_();
    },1000);
    setTimeout(()=> {
      self.onCheckTaskRun_();
    },1000*60*10);
  }
  readNews_(){
    this.lastReadTime_ = new Date();
    let self = this;
    const newsURLStr = this.seed_[this.globalLoopIndex_];
    if(!newsURLStr) {
      return;
    }
    console.log('readNews_::newsURLStr=<',newsURLStr,'>');
    const seedURL = url.parse(newsURLStr);
    const rootPath = seedURL.protocol + '//' + seedURL.hostname;
    console.log('readNews_::rootPath=<',rootPath,'>');
    const req = https.get(newsURLStr,{timeout:1000*5},(resp)=> {
      resp.setEncoding('utf8');
      let body = '';
      resp.on('data', (chunk) => {
        body += chunk;
      });
      resp.on('end', () => {
        //console.log('readNews_::resp.socket=<',resp.socket,'>');
        self.onHttpBody_(body,rootPath,seedURL.protocol);
      });      
    }).on("error", (err) => {
      console.log('readNews_::err=<',err,'>');
    });
  }
  onHttpBody_(body,rootPath,protocol) {
    const $ = cheerio.load(body);
    let link = $('a');
    //console.log('onHttpBody_::link=<',link,'>');
    let linkKey = Object.keys(link);
    //console.log('onHttpBody_::linkKey=<',linkKey,'>');
    for(let i = 0;i < linkKey.length;i++) {
      let key = linkKey[i];
      let linkOne = link[key];
      //console.log('onHttpBody_::linkOne=<',linkOne,'>');
      if(linkOne.attribs && linkOne.attribs.href) {
        let href = linkOne.attribs.href;
        //console.log('onHttpBody_::href=<',href,'>');
        if(href.startsWith('http://') || href.startsWith('https://')) {
          //console.log('onHttpBody_::href=<',href,'>');
          this.onWatchLink_(href);
        } else if(href.startsWith('//')) {
          //console.log('onHttpBody_::href=<',href,'>');
          const completeHref = protocol  + href;
          //console.log('onHttpBody_::completeHref=<',completeHref,'>');
          this.onWatchLink_(completeHref);
        } else if(href.startsWith('/')) {
          //console.log('onHttpBody_::rootPath=<',rootPath,'>');
          //console.log('onHttpBody_::href=<',href,'>');
          const completeHref = rootPath + href;
          //console.log('onHttpBody_::completeHref=<',completeHref,'>');
          this.onWatchLink_(completeHref);
        } else {
          //console.log('onHttpBody_::href=<',href,'>');
        }
      }
    }
    if(this.globalLoopIndex_ < this.seed_.length) {
      this.globalLoopIndex_++;
      let self = this;
      setTimeout(()=> {
        self.readNews_();
      },1000);
    } else {
      const now = new Date();
      console.log('onHttpBody_::now=<',now.toUTCString(),'>');
      console.log('wait 5 min for next loop ...');
      let self = this;
      setTimeout(()=> {
        self.globalLoopIndex_ = 0;
        self.readNews_();
      },1000*60 * 5);
    }
  }
  
  
  onWatchLink_(href){
    //console.log('onWatchLink_::href=<',href,'>');
    const result = this.linkDB_.get(href);
    //console.log('onWatchLink_::result=<',result,'>');
    if (result && result.notFound) {
      const contentObj = {
        href:href,
        discover:true,
        lang:this.lang_,
        area:[this.areaA_,this.areaB_,this.areaC_]
      };
      const contents = JSON.stringify(contentObj);
      const address = this.linkDB_.put(href,contents);
      this.onWathNewLink_(href,address);
    }
  }
  onWathNewLink_(href,address){
    console.log('onWathNewLink_::href=<',href,'>');
    const now = new Date();
    console.log('onWathNewLink_::now=<',now.toString(),'>');
    let nextStage = {
      href:href,
      address:address,
      linkdb:this.linkDBPath_,
      textdb:this.textDBPath_,
      lang:this.lang_
    }
    gPublisher.publish(redisNewsChannelDiscovery, JSON.stringify(nextStage));
  }

  onCheckTaskRun_ () {
    const now =  new Date();
    const escape  =  now - this.lastReadTime_;
    console.log('onCheckTaskRun_::escape=<',escape,'>');
    if(escape > 1000*60*10) {
      this.globalLoopIndex_ = 0;
      this.readNews_();    
    }
    setTimeout(this.onCheckTaskRun_.bind(this),1000*60*10);
  };
}


const http = require('http');
const https = require('https');
const cheerio = require('cheerio');
const fs = require('fs');
const url = require('url');

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
    this.linkDB_ = new LevelDFS(linkDBPath);
    this.lang_ = lang;
    this.lastReadTime_ = new Date();
    if (!fs.existsSync(dbTextContent)) {
      fs.mkdirSync(dbTextContent,{ recursive: true });
    }
    this.textDBPath_ = dbTextContent;
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
    let self = this;
    this.linkDB_.get(href, (err, value) => {
      //console.log('onWatchLink_::err=<',err,'>');
      if (err && err.notFound) {
        let contents = JSON.stringify({href:href,discover:true});
        self.linkDB_.put(href,contents);
        self.onWathNewLink_(href);
        return;
      }
      //console.log('onWatchLink_::value=<',value,'>');
    });
  }
  onWathNewLink_(href){
    console.log('onWathNewLink_::href=<',href,'>');
    const now = new Date();
    console.log('onWathNewLink_::now=<',now.toUTCString(),'>');
    let nextStage = {
      href:href,
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


const requestList = [];

const baidu = require('./seed/baidu.js');
//console.log('baidu=<',baidu,'>');
for(let url of baidu.seeds) {
  requestList.push(url);
}
const toutiao = require('./seed/toutiao.js');
//console.log('toutiao=<',toutiao,'>');
for(let url of toutiao.seeds) {
  requestList.push(url);
}
const sogou = require('./seed/sogou.js');
//console.log('sogou=<',sogou,'>');
for(let url of sogou.seeds) {
  requestList.push(url);
}
const netease = require('./seed/163.js');
//console.log('netease=<',netease,'>');
for(let url of netease.seeds) {
  requestList.push(url);
}
const sina = require('./seed/sina.js');
//console.log('sina=<',sina,'>');
for(let url of sina.seeds) {
  requestList.push(url);
}
const qq = require('./seed/qq.js');
//console.log('qq=<',qq,'>');
for(let url of qq.seeds) {
  requestList.push(url);
}

const sohu = require('./seed/news.sohu.com.js');
//console.log('sohu=<',sohu,'>');
for(let url of sohu.seeds) {
  requestList.push(url);
}

const zaobao = require('./seed/www.zaobao.com.sg.js');
//console.log('zaobao=<',zaobao,'>');
for(let url of zaobao.seeds) {
  requestList.push(url);
}


console.log('requestList=<',requestList,'>');
const NewsPumper = require('./NewsPumper.js');
const dbLink = '/storage/dhtfs/cluster/news_pumper/cn/news_discovery_db';
const dbTextContent = '/storage/dhtfs/cluster/news_pumper/cn/news_text_contents_db';
const pumper = new NewsPumper(requestList,dbLink,dbTextContent,'cn');
pumper.turn();

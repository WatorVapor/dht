const requestList = [];

const yahoo = require('./seed/jp.co.yahoo.js');
for(let url of yahoo.seeds) {
  requestList.push(url);
}
const itmedia = require('./seed/jp.co.itmedia.js');
for(let url of itmedia.seeds) {
  requestList.push(url);
}
const msn = require('./seed/jp.msn.js');
for(let url of msn.seeds) {
  requestList.push(url);
}
const goo = require('./seed/jp.ne.goo.js');
for(let url of goo.seeds) {
  requestList.push(url);
}
const google = require('./seed/news.google.ja.js');
for(let url of google.seeds) {
  requestList.push(url);
}

console.log('requestList=<',requestList,'>');
const NewsPumper = require('./NewsPumper.js');
const dbLink = '/watorvapor/ldfs/tagbot/ja/news_discovery_db';
const dbTextContent = '/watorvapor/ldfs/tagbot/ja/news_text_contents_db';
const pumper = new NewsPumper(requestList,dbLink,dbTextContent,'ja');
pumper.turn();

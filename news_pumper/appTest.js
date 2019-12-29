const requestList = [];

const goo = require('./seed/jp.ne.goo.js');
for(let url of goo.seeds) {
  requestList.push(url);
}
console.log('requestList=<',requestList,'>');
const NewsPumper = require('./NewsPumper.js');
const dbLink = '/watorvapor/ldfs/tagbot/ja_test/news_discovery_db';
const dbTextContent = '/watorvapor/ldfs/tagbot/ja_test/news_text_contents_db';
const pumper = new NewsPumper(requestList,dbLink,dbTextContent,'ja');
pumper.turn();

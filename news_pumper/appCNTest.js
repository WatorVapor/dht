const requestList = [];

const sina = require('./seed/sina.js');
for(let url of sina.seeds) {
  requestList.push(url);
}
console.log('requestList=<',requestList,'>');
const NewsPumper = require('./NewsPumper.js');
const dbLink = './tagbot/cn_test/news_discovery_db';
const dbTextContent = './tagbot/cn_test/news_text_contents_db';
const pumper = new NewsPumper(requestList,dbLink,dbTextContent,'cn');
pumper.turn();

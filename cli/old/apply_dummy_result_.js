'use strict';
const DHT = require('../api/DHTUnxiSocket.js');
const dht = new DHT();
//console.log(':: dht=<',dht,'>');
dht.peerInfo((peerInfo)=>{
  console.log('dht.peerInfo:: peerInfo=<',peerInfo,'>');
});



const page1 = {
  word:'汉语',
  href:'https://zh.wikipedia.org/wiki/汉语',
  title:'汉语 - 维基百科，自由的百科全书',
  summary :'汉语历史悠久，使用人数最多，世界上使用汉语的人数至少15亿 ，超过世界总人口的20%，是中国的官方语言，是新加坡的四种官方语言之一，亦是联合国六种工作'
};

const page2 = {
  word:'航母',
  href:'https://www.6parknews.com/newspark/view.php?app=news&act=view&nid=386668',
  title:'台军称大陆首艘国产航母航入台湾海峡 美日舰尾随 -6park.com',
  summary :'相关专家表示，与中国首艘航母辽宁舰首次通过台湾海峡不同，首艘国产航母在未入列前就通过台湾海峡。这一方面验证出国产航母的技术性能已经成熟，另一方面这也应该是国产航母的回家之路。'
};

const page3 = {
  word:'航母',
  href:'https://zh.wikipedia.org/wiki/航母',
  title:'航空母舰 - 维基百科，自由的百科全书',
  summary :'航空母舰（常简称为航母、航舰、空母[1]，美规常用代号为CV+其他字母以分类）是一种以搭载舰载机为主要武器的军舰，舰体通常拥有供飞机起降的巨大甲板和座落于左右其中一侧的舰岛'
};

const page4 = {
  word:'海试',
  href:'https://www.6parknews.com/newspark/view.php?app=news&act=view&nid=386668',
  title:'台军称大陆首艘国产航母航入台湾海峡 美日舰尾随 -6park.com',
  summary :'2018年5月13日至18日，中国国产航母进行了首次海试。在此后的一年多时间里，先后进行过8次海试。国产航母10月15日至20日完成第八次出海试航后返回大连造船厂。'
};

const appendData = ()=> {
  
  dht.append('汉语',JSON.stringify(page1,undefined,'  '),(info) => {
    console.log('dht.append:: info.store=<',info.store,'>');
  });  
  dht.append('航母',JSON.stringify(page2,undefined,'  '),(info) => {
    console.log('dht.append:: info.store=<',info.store,'>');
  });
  dht.append('航母',JSON.stringify(page3,undefined,'  '),(info) => {
    console.log('dht.append:: info.store=<',info.store,'>');
  });
  dht.append('海试',JSON.stringify(page4,undefined,'  '),(info)=> {
    console.log('dht.append:: info.store=<',info.store,'>');
  });
};

setTimeout(appendData,1000);


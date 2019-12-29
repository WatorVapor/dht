const level = require('level');
const fs = require('fs');
const gDBPath = '/watorvapor/wai.storage/wai.native.wator/db/zhizi/cn.cast';
const db_ = level(gDBPath,{ createIfMissing: false });
const phrase_ = {};
db_.createReadStream()
.on('data', (data) =>{
  //console.log('WaiTagBot::onSentence_ data=<',data,'>');
  phrase_[data.key] = parseFloat(data.value);
})
.on('error', (err) =>{
})
.on('close', () =>{
})
.on('end', (evt) =>{
  console.log('WaiTagBot::constructor end evt=<',evt,'>');
  fs.writeFileSync('./wai.phrase.json',JSON.stringify(phrase_,undefined,'  '),'utf8');
});



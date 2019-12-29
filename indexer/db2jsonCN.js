const level = require('level');
const fs = require('fs');
const gDBPath = '/watorvapor/wai.storage/wai.native.wator/db/zhizi/cn';
const db_ = level(gDBPath,{ createIfMissing: false });
const phrase_ = {};
let maxValue = 0.0; 

db_.createReadStream()
.on('data', (data) =>{
  //console.log('WaiTagBot::onSentence_ data=<',data,'>');
  let fValue = parseFloat(data.value);
  phrase_[data.key] = fValue;
  if(fValue > maxValue) {
    maxValue = fValue;
  }
})
.on('error', (err) =>{
})
.on('close', () =>{
})
.on('end', (evt) =>{
  onDataFinnish();
});

const onDataFinnish = () => {
  console.log('onDataFinnish::maxValue=<',maxValue,'>');
  let fMaxValue = parseFloat(maxValue);
  for(let key in phrase_) {
    //console.log('onDataFinnish::key=<',key,'>');
    let fValue = parseFloat(phrase_[key])/fMaxValue;
    //console.log('onDataFinnish::fValue=<',fValue,'>');
    phrase_[key] = fValue;
  }
  fs.writeFileSync('./wai.phrase.cn.json',JSON.stringify(phrase_,undefined,'  '),'utf8');
}


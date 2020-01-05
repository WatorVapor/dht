const fs = require('fs');
const indexWordPath_ = __dirname + '/indexer.float.words.json';
console.log('indexWordPath_=<',indexWordPath_,'>');
let content = fs.readFileSync(indexWordPath_, 'utf8');
const indexerDict_ = JSON.parse(content);

let min = 1.0;
let max = 0.0;
for(const word in indexerDict_) {
  //console.log('word=<',word,'>');
  const freq = indexerDict_[word];
  if(freq > max) {
    max = freq;
  }
  if(freq < min) {
    min = freq;
  }
}
console.log('min=<',min,'>');
console.log('max=<',max,'>');

indexerDict_.min = min;
indexerDict_.max = max;

const indexWordPathOut_ = __dirname + '/indexer.float.words.min.manx.json';
const contentOut = JSON.stringify(indexerDict_,undefined,2);
fs.writeFileSync(indexWordPathOut_, contentOut, 'utf8');
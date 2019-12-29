const WaiCutter = require('./wai.cutter.js');
const fs = require('fs');
const gFilterKeyWordsCN = require('./wai.tagbot.filter.cn.js');
const gFilterKeyWordsJA = require('./wai.tagbot.filter.ja.js')
gFilterKeyWords = gFilterKeyWordsCN.concat(gFilterKeyWordsJA);
//console.log(':: gFilterKeyWords=<',gFilterKeyWords,'>');

class WaiTagBot {
  constructor() {
    this.cutter_ = new WaiCutter(this)
    
    console.log('WaiTagBot::constructor start read...>');
    let content = fs.readFileSync('./wai.phrase.cn.json', 'utf8');
    console.log('WaiTagBot::constructor content.length=<',content.length,'>');
    
    this.phrase_ = {};
    this.phrase_['cn'] = JSON.parse(content);
    
    content = fs.readFileSync('./wai.phrase.ja.json', 'utf8');
    console.log('WaiTagBot::constructor content.length=<',content.length,'>');
    this.phrase_['ja'] = JSON.parse(content);
    
    
    setTimeout(()=> {
      if(typeof this.onReady === 'function') {
        this.onReady();
      }      
    },1000);
  }
  article(doc,lang) {
    this.wordFreqs_ = {};
    this.tbdWords_ = {};
    //console.log('WaiTagBot::article lang=<',lang,'>');
    this.cutter_.article(doc,lang);
    //console.log('WaiTagBot::article this.tbdWords_=<',this.tbdWords_,'>');
    //console.log('WaiTagBot::article this.wordFreqs_=<',this.wordFreqs_,'>');
    const pureCollect = this.cutter_.FilterOutInside_(this.wordFreqs_);
    //console.log('WaiTagBot::article pureCollect=<',pureCollect,'>');
    const goodCollect = this.FilterOutKeyWord_(pureCollect);
    return this.calcWeight_(goodCollect,lang);
  }
  //
  onSeparator_(sep) {
    //console.log('WaiTagBot::onSeparator_ sep=<',sep,'>');
  }
  //
  onFinishSentence_() {
    
  }
  onNoCJKWord_(word,lang) {
    //console.log('WaiTagBot::onNoCJKWord_ word=<',word,'>');
  }

  onCJKWordRC_(word,lang) {
    //console.log('WaiTagBot::onCJKWordRC_ word=<',word,'>');
    if(this.phrase_[lang][word]) {
      this.tbdWords_[word] = this.phrase_[lang][word];
      if(this.wordFreqs_[word]) {
        this.wordFreqs_[word]++;
      } else {
        this.wordFreqs_[word] = 1;
      }
    }
  }

  calcWeight_(collect,lang) {
    let weights = [];
    for(let word in collect) {
      //console.log('WaiTagBot::calcWeight_ word=<',word.length,'>');
      let probability = this.phrase_[lang][word];
      let freq = collect[word];
      //console.log('WaiTagBot::calcWeight_ freq=<',freq,'>');
      //sortedCollect.push({w:word,freq:collect[word]})
      let weight = freq * freq * freq * freq * word.length * word.length * word.length * word.length * probability ;
      weights.push({tag:word,weight:weight});
    }
    //console.log('WaiTagBot::calcWeight_ weights=<',weights,'>');
    weights.sort((a,b) => {
      //console.log('WaiTagBot::calcWeight_ a=<',a,'>');
      //console.log('WaiTagBot::calcWeight_ b=<',b,'>');
      if(a.weight > b.weight) return -1;
      if(a.weight < b.weight) return 1;
      return 0;
    });
    //console.log('WaiTagBot::calcWeight_ weights=<',weights,'>');
    return weights.slice(0, 21);
  }

  FilterOutKeyWord_ (collect) {
    let outCollect = JSON.parse(JSON.stringify(collect));
    let keys = Object.keys(outCollect);
    for(let i = 0 ;i < keys.length;i++) {
      let key = keys[i];
      //console.log('FilterOutInside_ key=<',key,'>');
      if(gFilterKeyWords.indexOf(key) !== -1) {
        delete outCollect[key];
      }
    }
    return outCollect;
  }

}

module.exports = WaiTagBot;

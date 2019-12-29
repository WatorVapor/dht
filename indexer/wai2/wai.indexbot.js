const WaiCutter = require('./wai.cutter.js');
const fs = require('fs');
const gFilterKeyWordsCN = require('./wai.tagbot.filter.cn.js');
const gFilterKeyWordsJA = require('./wai.tagbot.filter.ja.js')
gFilterKeyWords = gFilterKeyWordsCN.concat(gFilterKeyWordsJA);
//console.log(':: gFilterKeyWords=<',gFilterKeyWords,'>');

class WaiIndexBot {
  constructor() {
    this.cutter_ = new WaiCutter(this)
    
    console.log('WaiIndexBot::constructor start read...>');
    let content = fs.readFileSync('./wai.phrase.cn.json', 'utf8');
    console.log('WaiIndexBot::constructor content.length=<',content.length,'>');
    
    this.phrase_ = {};
    this.phrase_['cn'] = JSON.parse(content);
    
    content = fs.readFileSync('./wai.phrase.ja.json', 'utf8');
    console.log('WaiIndexBot::constructor content.length=<',content.length,'>');
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
    //console.log('WaiIndexBot::article lang=<',lang,'>');
    this.cutter_.article(doc,lang);
    //console.log('WaiIndexBot::article this.tbdWords_=<',this.tbdWords_,'>');
    //console.log('WaiIndexBot::article this.wordFreqs_=<',this.wordFreqs_,'>');
    const pureCollect = this.cutter_.FilterOutInside_(this.wordFreqs_);
    //console.log('WaiIndexBot::article pureCollect=<',pureCollect,'>');
    const goodCollect = this.FilterOutKeyWord_(pureCollect);
    return this.calcWeight_(goodCollect,lang);
  }
  //
  onSeparator_(sep) {
    //console.log('WaiIndexBot::onSeparator_ sep=<',sep,'>');
  }
  //
  onFinishSentence_() {
    
  }
  onNoCJKWord_(word,lang) {
    //console.log('WaiIndexBot::onNoCJKWord_ word=<',word,'>');
  }

  onCJKWordRC_(word,lang) {
    //console.log('WaiIndexBot::onCJKWordRC_ word=<',word,'>');
    //console.log('WaiIndexBot::onCJKWordRC_ lang=<',lang,'>');
    try {
      if(this.phrase_[lang][word]) {
        this.tbdWords_[word] = this.phrase_[lang][word];
        if(this.wordFreqs_[word]) {
          this.wordFreqs_[word]++;
        } else {
          this.wordFreqs_[word] = 1;
        }
      }
    } catch(e) {
      console.log('WaiIndexBot::onCJKWordRC_ e=<',e,'>');
    }
  }

  calcWeight_(collect,lang) {
    let weights = [];
    for(let word in collect) {
      //console.log('WaiIndexBot::calcWeight_ word=<',word.length,'>');
      let probability = this.phrase_[lang][word];
      let freq = collect[word];
      //console.log('WaiIndexBot::calcWeight_ freq=<',freq,'>');
      //sortedCollect.push({w:word,freq:collect[word]})
      weights.push({word:word,freq:freq});
    }
    //console.log('WaiIndexBot::calcWeight_ weights=<',weights,'>');
    weights.sort((a,b) => {
      //console.log('WaiIndexBot::calcWeight_ a=<',a,'>');
      //console.log('WaiIndexBot::calcWeight_ b=<',b,'>');
      if(a.freq > b.freq) return -1;
      if(a.freq < b.freq) return 1;
      return 0;
    });
    //console.log('WaiIndexBot::calcWeight_ weights=<',weights,'>');
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

module.exports = WaiIndexBot;

const iConstWordFilterOutStageOne = 3;
const CJK_Table = require('./cjk.js');
const Cutter = require('./wai.cutter.js');

class WaiBase {
  constructor() {
    this.cutter_ = new Cutter(this);
  } 
  article(doc,lang) {
    this.cutter_.article(doc,lang);
  }
  hintWords(lang) {
    this.hintWordRC_ = {};
    this.cutter_.statsHint(lang);
    const highCollect = this.FilterOutLowFreq_(this.hintWordRC_,iConstWordFilterOutStageOne);
    //console.log('WaiBase::hintWords highCollect=<',highCollect,'>');
    const hintWords = this.FilterOutInside_(highCollect);
    return hintWords;
  }
  outWords(lang) {
    this.cutter_.outWords(lang);
  }
  
  // inside
  mergeCollect_ (collect){
    //console.log('mergeCollect_ collect=<',collect,'>');
    for(let key in collect) {
      if(this.collectBlock_[key]) {
        this.collectBlock_[key] += collect[key];
      } else {
        this.collectBlock_[key] = collect[key];
      }
    }
  }

  FilterOutLowFreq_ (collect,freq){
    let outCollect = Object.assign({},collect);
    let keys = Object.keys(outCollect);
    for(let i = 0 ;i < keys.length;i++) {
      let key = keys[i];
      if(outCollect[key] < freq) {
        delete outCollect[key];
      }
    }
    return outCollect;
  }

  FilterOutInside_ (collect,cut) {
    let outCollect = Object.assign({},collect);
    let keys = Object.keys(outCollect);
    for(let i = 0 ;i < keys.length;i++) {
      let key = keys[i];
      //console.log('FilterOutInside_ key=<',key,'>');
      for(let j = 0 ;j < keys.length;j++) {
        let keyFound = keys[j];
        //console.log('FilterOutInside_ keyFound=<',keyFound,'>');
        if(keyFound !== key && keyFound.includes(key)) {
          if(outCollect[keyFound] === outCollect[key]) {
            delete outCollect[key];
          }
          if(cut) {
            if(outCollect[keyFound] < outCollect[key]) {
              outCollect[key] -= outCollect[keyFound];
            }
          }
        }
      }
    }
    return outCollect;
  }

  onCJKWordHintRC_(word,start,lang) {
    //console.log('WaiBase::onCJKWordHintRC_ this.hintWordRC_=<',this.hintWordRC_,'>');
    if(this.hintWordRC_.hasOwnProperty(word)) {
      this.hintWordRC_[word]++;
    } else {
      this.hintWordRC_[word] = 1;
    }
  }


}

module.exports = WaiBase;


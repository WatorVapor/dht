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

  FilterOutInside_ (collect) {
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
          if(outCollect[keyFound] < outCollect[key]) {
            outCollect[key] -= outCollect[keyFound];
          }          
        }
      }
    }
    return outCollect;
  } 
}

module.exports = WaiBase;


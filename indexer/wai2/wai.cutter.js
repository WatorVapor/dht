const iConstWordFilterOutStageOne = 3;
const iConstNGramMaxWindow = 64;

const CJK_Table = require('./cjk.js');
const SEP_Table = require('./separator.js');
//console.log('SEP_Table=<',SEP_Table,'>');

class WaiCutter {
  constructor(delegate) {
    this.delegate_ = delegate;
  } 
  article(doc,lang) {
    let aDocumentStatistics = {};
    //console.log('article doc=<',doc,'>');
    let allCollect = [];
    let cjkBuffer = [];
    let notCJKBuffer = [];
    if(typeof this.delegate_.onSeparator_ === 'function') {
      this.delegate_.onSeparator_(' ');
    }
    
    for(let i = 0 ;i < doc.length;i++) {
      let utf8 = doc[i];
      let isSep = SEP_Table[utf8];
      //console.log('article utf8=<',utf8,'>');
      //console.log('article isSep=<',isSep,'>');
      if(isSep) {
        //console.log('article isSep=<',isSep,'>');
        if(typeof this.delegate_.onSeparator_ === 'function') {
          this.delegate_.onSeparator_(utf8);
          if(cjkBuffer.length > 0) {
            allCollect.push({cjk:cjkBuffer});
          }
          cjkBuffer = [];
          if(notCJKBuffer.length > 0) {
            allCollect.push({noCjk:notCJKBuffer});
          }
          notCJKBuffer = [];
          continue;
        }
      }
      if(utf8 === "\n" || utf8 === "\r") {
        continue;
      }
      //console.log('article utf8=<',utf8,'>');
      let isCJK = CJK_Table[utf8];
      //console.log('article isCJK=<',isCJK,'>');
      if(isCJK) {
        cjkBuffer.push(utf8);
        if(notCJKBuffer.length >0) {
          allCollect.push({noCjk:notCJKBuffer});
        }
        notCJKBuffer = [];
      } else {
        notCJKBuffer.push(utf8);
        if(cjkBuffer.length > 0) {
          allCollect.push({cjk:cjkBuffer});
        }
        cjkBuffer = [];
      }
    }
    if(cjkBuffer.length > 0) {
      allCollect.push({cjk:cjkBuffer});
    }
    if(notCJKBuffer.length > 0) {
      allCollect.push({noCjk:notCJKBuffer});
    }
    //console.log('article allCollect=<',allCollect,'>');
    
    for(let sentence of allCollect) {
      //console.log('WaiCutter article this.delegate_.onSentence_=<',this.delegate_.onSentence_,'>');
      if(sentence.cjk) {
        //onSentence(cjkCollect[i],lang,aDocumentStatistics);
        this.onCJK_(sentence.cjk,lang);
      }
      if(sentence.noCjk) {
        //onSentence(cjkCollect[i],lang,aDocumentStatistics);
        //console.log('WaiCutter article sentence=<',sentence,'>');
        this.onNoCJK_(sentence.noCjk,lang);
      }
    }
    /*
    if(aDocumentStatistics) {
      //console.log('article aDocumentStatistics=<',aDocumentStatistics,'>');
      let highFreq = this.FilterOutLowFreq_(aDocumentStatistics);
      //console.log('article highFreq=<',highFreq,'>');
      let uniqWords = this.FilterOutInside_(highFreq);
      //console.log('article uniqWords=<',uniqWords,'>');
      this.mergeCollect_(uniqWords);
      //return uniqWords;
    }
    */
  }
  
  onCJK_(sentence,lang) {
    //console.log('WaiCutter onCJK_ sentence=<',sentence,'>');
    for(let i = 0 ;i < sentence.length;i++) {
      let utf8 = sentence[i];
      //console.log('WaiCutter::onCJK_ utf8=<',utf8,'>');
      let backIndex = i;
      if(backIndex > iConstNGramMaxWindow) {
        backIndex = iConstNGramMaxWindow;
      }
      for(let j = 1 ;j <= backIndex;j++) {
        let start = i - j ;
        if(start >= 0) {
          let concat = sentence.slice(start,i+1);
          let word = concat.join('');
          this.delegate_.onCJKWordRC_(word,lang);
        }
      }
    }
  }

  onNoCJK_(sentence,lang) {
    //console.log('WaiCutter onNoCJK_ sentence=<',sentence,'>');
    let word = '';
    for(let utf8 of sentence) {
      if(utf8 === ' ' && word.trim()) {
        this.delegate_.onNoCJKWord_(word,lang);
        word = '';
      } else {
        word += utf8;
      }
    }
    if(word.trim()) {
      this.delegate_.onNoCJKWord_(word,lang);
    }
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

  FilterOutLowFreq_ (collect){
    let outCollect = JSON.parse(JSON.stringify(collect));
    let keys = Object.keys(outCollect);
    for(let i = 0 ;i < keys.length;i++) {
      let key = keys[i];
      if(outCollect[key] < iConstWordFilterOutStageOne) {
        delete outCollect[key];
      }
    }
    return outCollect;
  }

  FilterOutInside_ (collect) {
    let outCollect = JSON.parse(JSON.stringify(collect));
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
        }
      }
    }
    return outCollect;
  }
}

module.exports = WaiCutter;


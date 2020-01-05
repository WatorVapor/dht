const iConstWordFilterOutStageOne = 3;
const iConstNGramMaxWindow = 64;

const CJK_Table = require('./cjk.js');
const FURIKANA_Table = require('./furikana.js');
const SYMBOL_TABLE = {...CJK_Table, ...FURIKANA_Table};
const SEP_Table = require('./separator.js');
//console.log('SEP_Table=<',SEP_Table,'>');

class WaiCutter {
  constructor(delegate) {
    this.delegate_ = delegate;
  }
  article(doc,lang) {
    this.symbolTable_ = SYMBOL_TABLE;
    if(lang === 'cn') {
      this.symbolTable_ = CJK_Table;
    }

    let aDocumentStatistics = {};
    //console.log('article doc=<',doc,'>');
    //console.log('article lang=<',lang,'>');
    this.allCollect = [];
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
            this.allCollect.push({cjk:cjkBuffer});
            this.allCollect.push({stop:i});
          }
          cjkBuffer = [];
          if(notCJKBuffer.length > 0) {
            this.allCollect.push({noCjk:notCJKBuffer});
            this.allCollect.push({stop:i});
          }
          notCJKBuffer = [];
          continue;
        }
      }
      if(utf8 === "\n" || utf8 === "\r") {
        continue;
      }
      //console.log('article utf8=<',utf8,'>');
      let isSymbol = this.symbolTable_[utf8];
      //console.log('article isSymbol=<',isSymbol,'>');
      if(isSymbol) {
        cjkBuffer.push(utf8);
        if(notCJKBuffer.length >0) {
          this.allCollect.push({noCjk:notCJKBuffer});
          this.allCollect.push({stop:i});
        }
        notCJKBuffer = [];
      } else {
        notCJKBuffer.push(utf8);
        if(cjkBuffer.length > 0) {
          this.allCollect.push({cjk:cjkBuffer});
          this.allCollect.push({stop:i});
        }
        cjkBuffer = [];
      }
    }
    if(cjkBuffer.length > 0) {
      this.allCollect.push({cjk:cjkBuffer});
      this.allCollect.push({stop:doc.length-1});
    }
    if(notCJKBuffer.length > 0) {
      this.allCollect.push({noCjk:notCJKBuffer});
      this.allCollect.push({stop:doc.length-1});
    }
  }
  statsHint(lang) {
    //console.log('WaiCutter statsHint this.allCollect=<',this.allCollect,'>');
    for(let sentence of this.allCollect) {
      //console.log('WaiCutter statsHint this.delegate_.onSentence_=<',this.delegate_.onSentence_,'>');
      if(sentence.cjk) {
        this.onCJKHint_(sentence.cjk,lang);
      }
    }    
  }
  
  outWords(lang) {
    //console.log('WaiCutter outWords this.allCollect=<',this.allCollect,'>');
    for(let sentence of this.allCollect) {
      //console.log('WaiCutter outWords this.delegate_.onSentence_=<',this.delegate_.onSentence_,'>');
      if(sentence.cjk) {
        this.delegate_.onSentenceIn_(sentence.cjk);
        this.onCJK_(sentence.cjk,lang);
        this.delegate_.onSentenceOut_(sentence.cjk);
      }
      if(sentence.noCjk) {
        //onSentence(cjkCollect[i],lang,aDocumentStatistics);
        //console.log('WaiCutter outWords sentence=<',sentence,'>');
        this.onNoCJK_(sentence.noCjk,lang);
      }
      if(sentence.stop) {
        this.delegate_.onSentenceStop_(sentence.stop);
      }
    }    
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
          if(typeof this.delegate_.onCJKWordRC_ === 'function') {
            this.delegate_.onCJKWordRC_(word,start,lang);
          }
        }
      }
      if(typeof this.delegate_.onCJKSingleRC_ === 'function') {
        this.delegate_.onCJKSingleRC_(utf8,i,lang);
      }
    }
  }

  onCJKHint_(sentence,lang) {
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
          if(typeof this.delegate_.onCJKWordHintRC_ === 'function') {
            this.delegate_.onCJKWordHintRC_(word,start,lang);
          }
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


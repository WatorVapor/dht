const WaiBase = require('./wai.base.js');
const WaiGraph = require('./wai.graph.js');
const fs = require('fs');

const iConstWordFilterOutStageOne = 2;
const iConstWordRepeatMin = 1;
const iFactorialBaseOfRerank = 1;


class WaiIndexBot extends WaiBase {
  constructor() {
    super();
    this.graph_ = new WaiGraph();
    this.parrotPath_ = __dirname + '/cnwiki/indexer.float.words.json';
    console.log('WaiIndexBot::this.parrotPath_=<',this.parrotPath_,'>');
    let content = fs.readFileSync(this.parrotPath_, 'utf8');
    this.parrot_ = JSON.parse(content);
    setTimeout(()=> {
      if(typeof this.onReady === 'function') {
        this.onReady();
      }      
    },1000);
  }
  entryBlock() {
    super.entryBlock();
  }
  leaveBlock() {
    super.leaveBlock();
  }
  
  article(doc,lang) {
    this.doc_ = doc;
    this.words_ = {};
    this.wordsRC_ = {};
    this.seqNumOfSentence_ = 0;
    this.wordsAtSentence_ = {};
    this.sentenceSeqMap_ = {};
    //console.log('WaiIndexBot::article lang=<',lang,'>');
    super.article(doc,lang);
    //console.log('WaiIndexBot::article this.words_=<',this.words_,'>');
    //console.log('WaiIndexBot::article this.wordsRC_=<',this.wordsRC_,'>');
    const highCollect = super.FilterOutLowFreq_(this.wordsRC_,iConstWordFilterOutStageOne);
    //console.log('WaiIndexBot::article highCollect=<',highCollect,'>');
    this.statsWords_ = super.FilterOutInside_(highCollect);
    //console.log('WaiIndexBot::article this.words_=<',this.words_,'>');
    //console.log('WaiIndexBot::article this.statsWords_=<',this.statsWords_,'>');
    const indexOfWords = this.reduce2Index_();
    //console.log('WaiIndexBot::article indexOfWords=<',indexOfWords,'>');
    return indexOfWords;
  }

  onSentenceIn_(sentence) {
    //console.log('WaiIndexBot::onSentenceIn_ sentence=<',sentence,'>');
    this.sentenceRange_ = [];
    this.seqNumOfSentence_++;
    this.sentenceSeqMap_[this.seqNumOfSentence_] = {};
  }
  onSentenceOut_(sentence) {
    //console.log('WaiIndexBot::onSentenceOut_ sentence=<',sentence,'>');
    //console.log('WaiIndexBot::onSentenceOut_ this.sentenceRange_=<',this.sentenceRange_,'>');
    this.sentenceSeqMap_[this.seqNumOfSentence_].text = sentence;
    this.onReRankSentence_();
    //console.log('WaiIndexBot::onSentenceOut_ this.sentenceReRange_=<',this.sentenceReRange_,'>');
    const shortPath = this.graph_.shortPath(this.sentenceReRange_);
    //console.log('WaiIndexBot::onSentenceOut_ shortPath=<',shortPath,'>');
    for(let wordRank of shortPath) {
      //console.log('WaiIndexBot::onSentenceOut_ wordRank=<',wordRank,'>');
      const word = wordRank.word;
      if(this.words_[word]) {
        this.words_[word]++;
      } else {
        this.words_[word] = 1;
      }
    }
  }
  onSentenceStop_(stop) {
    //console.log('WaiIndexBot::onSentenceStop_ stop=<',stop,'>');
    if(this.sentenceSeqMap_[this.seqNumOfSentence_]) {
      this.sentenceSeqMap_[this.seqNumOfSentence_].stop = stop;
    }
    if(this.seqNumOfSentence_ > 1) {
      this.sentenceSeqMap_[this.seqNumOfSentence_].start = this.sentenceSeqMap_[this.seqNumOfSentence_ -1].stop;
    } else {
      this.sentenceSeqMap_[this.seqNumOfSentence_].start = 0;
    }
  }
  onReRankSentence_() {
    this.sentenceReRange_ = [];
    for(let sentence of this.sentenceRange_) {
      //console.log('WaiIndexBot::onReRankSentence_ sentence=<',sentence,'>');
      const reSentence = {...sentence};
      reSentence.freqOrig = reSentence.freq;
      let factorial = 1.0;
      for(let i = 1;i < reSentence.word.length;i++) {
        factorial *= (iFactorialBaseOfRerank + i);
      }
      reSentence.freq = reSentence.freq * factorial;
      this.sentenceReRange_.push(reSentence);
    }
  }

  onSeparator_(sep) {
    //console.log('WaiIndexBot::onSeparator_ sep=<',sep,'>');
  }
  onNoCJKWord_(word,lang) {
    //console.log('WaiIndexBot::onNoCJKWord_ word=<',word,'>');
    //console.log('WaiIndexBot::onNoCJKWord_ lang=<',lang,'>');
  }
  onCJKWordRC_(word,start,lang) {
    //console.log('WaiIndexBot::onCJKWordRC_ word=<',word,'>');
    //console.log('WaiIndexBot::onCJKWordRC_ start=<',start,'>');
    //console.log('WaiIndexBot::onCJKWordRC_ lang=<',lang,'>');
    const freq = this.parrot_[word];
    //console.log('WaiIndexBot::onCJKWordRC_ freq=<',freq,'>');
    if(freq) {
      //console.log('WaiIndexBot::onCJKWordRC_ freq=<',freq,'>');
      //console.log('WaiIndexBot::onCJKWordRC_ word=<',word,'>');
      //console.log('WaiIndexBot::onCJKWordRC_ start=<',start,'>');
      this.sentenceRange_.push({begin:start,end:start+word.length,word:word,freq:freq});
    }
    if(this.wordsRC_.hasOwnProperty(word)) {
      this.wordsRC_[word]++;
    } else {
      this.wordsRC_[word] = 1;
    }
    if(this.wordsAtSentence_.hasOwnProperty(word)) {
      this.wordsAtSentence_[word].push(this.seqNumOfSentence_);
    } else {
      this.wordsAtSentence_[word] = [this.seqNumOfSentence_];
    }
  }
  onCJKSingleRC_(word,start,lang) {
    //console.log('WaiIndexBot::onCJKSingleRC_ word=<',word,'>');
    //console.log('WaiIndexBot::onCJKSingleRC_ start=<',start,'>');
    //console.log('WaiIndexBot::onCJKSingleRC_ lang=<',lang,'>');
    const freq = this.parrot_[word];
    //console.log('WaiIndexBot::onCJKSingleRC_ freq=<',freq,'>');
    if(freq) {
      //console.log('WaiIndexBot::onCJKSingleRC_ freq=<',freq,'>');
      //console.log('WaiIndexBot::onCJKSingleRC_ word=<',word,'>');
      //console.log('WaiIndexBot::onCJKSingleRC_ start=<',start,'>');
      this.sentenceRange_.push({begin:start,end:start+word.length,word:word,freq});
      if(this.wordsAtSentence_.hasOwnProperty(word)) {
        this.wordsAtSentence_[word].push(this.seqNumOfSentence_);
      } else {
        this.wordsAtSentence_[word] = [this.seqNumOfSentence_];
      }
    }
  }
  
  
  
  reduce2Index_() {
    const indexSummary = {};
    for(let word in this.words_) {
      indexSummary[word] = this.indexSummary4Word_(word);
      indexSummary[word].freq = this.words_[word];
    }
    for(let word in this.statsWords_) {
      indexSummary[word] = Object.assign({},this.indexSummary4Word_(word));
      if(indexSummary[word].freq) {
        if(this.statsWords_[word] > this.words_[word]) {
          indexSummary[word].freq = this.statsWords_[word];
        }
      } else {
        indexSummary[word].freq = this.statsWords_[word];
      }
    }
    return indexSummary;
  }
  
  indexSummary4Word_(word) {
    const wordIndex = {summary:''};
    //console.log('WaiIndexBot::indexSummary4Word_ word=<',word,'>');
    const sentencePos = this.wordsAtSentence_[word];
    //console.log('WaiIndexBot::indexSummary4Word_ sentencePos=<',sentencePos,'>');
    for(const pos of sentencePos) {
      const sentenceMap = this.sentenceSeqMap_[pos];
      //console.log('WaiIndexBot::indexSummary4Word_ sentenceMap=<',sentenceMap,'>');
      const cutFromDoc = this.doc_.slice(sentenceMap.start,sentenceMap.stop);
      //console.log('WaiIndexBot::indexSummary4Word_ cutFromDoc=<',cutFromDoc,'>');
      wordIndex.summary += cutFromDoc;
      wordIndex.summary += '...';
    }
    const summaryArray = wordIndex.summary.split('<>');
    wordIndex.summary = summaryArray.concat('');
    return wordIndex;
  }
}

module.exports = WaiIndexBot;

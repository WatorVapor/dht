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
    console.log('WaiPhoenix::this.parrotPath_=<',this.parrotPath_,'>');
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
    this.words_ = {};
    this.wordsRC_ = {};
    //console.log('WaiIndexBot::article lang=<',lang,'>');
    super.article(doc,lang);
    //console.log('WaiIndexBot::article this.words_=<',this.words_,'>');
    //console.log('WaiIndexBot::article this.wordsRC_=<',this.wordsRC_,'>');
    const highCollect = super.FilterOutLowFreq_(this.wordsRC_,iConstWordFilterOutStageOne);
    //console.log('WaiIndexBot::article highCollect=<',highCollect,'>');
    this.statsWords_ = super.FilterOutInside_(highCollect);
    console.log('WaiIndexBot::article this.words_=<',this.words_,'>');
    console.log('WaiIndexBot::article this.statsWords_=<',this.statsWords_,'>');
    return this.words_;
  }

  onSentenceIn_(sentence) {
    //console.log('WaiPhoenix::onSentenceIn_ sentence=<',sentence,'>');
    this.sentenceRange_ = [];
  }
  onSentenceOut_(sentence) {
    //console.log('WaiPhoenix::onSentenceOut_ sentence=<',sentence,'>');
    //console.log('WaiPhoenix::onSentenceOut_ this.sentenceRange_=<',this.sentenceRange_,'>');
    this.onReRankSentence_();
    //console.log('WaiPhoenix::onSentenceOut_ this.sentenceReRange_=<',this.sentenceReRange_,'>');
    const shortPath = this.graph_.shortPath(this.sentenceReRange_);
    //console.log('WaiPhoenix::onSentenceOut_ shortPath=<',shortPath,'>');
    for(let wordRank of shortPath) {
      //console.log('WaiPhoenix::onSentenceOut_ wordRank=<',wordRank,'>');
      const word = wordRank.word;
      if(this.words_[word]) {
        this.words_[word]++;
      } else {
        this.words_[word] = 1;
      }
    }
  }
  onReRankSentence_() {
    this.sentenceReRange_ = [];
    for(let sentence of this.sentenceRange_) {
      //console.log('WaiPhoenix::onReRankSentence_ sentence=<',sentence,'>');
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
    //console.log('WaiPhoenix::onSeparator_ sep=<',sep,'>');
  }
  onNoCJKWord_(word,lang) {
    //console.log('WaiPhoenix::onNoCJKWord_ word=<',word,'>');
    //console.log('WaiPhoenix::onNoCJKWord_ lang=<',lang,'>');
  }
  onCJKWordRC_(word,start,lang) {
    //console.log('WaiPhoenix::onCJKWordRC_ word=<',word,'>');
    //console.log('WaiPhoenix::onCJKWordRC_ start=<',start,'>');
    //console.log('WaiPhoenix::onCJKWordRC_ lang=<',lang,'>');
    const freq = this.parrot_[word];
    //console.log('WaiPhoenix::onCJKWordRC_ freq=<',freq,'>');
    if(freq) {
      //console.log('WaiPhoenix::onCJKWordRC_ freq=<',freq,'>');
      //console.log('WaiPhoenix::onCJKWordRC_ word=<',word,'>');
      //console.log('WaiPhoenix::onCJKWordRC_ start=<',start,'>');
      this.sentenceRange_.push({begin:start,end:start+word.length,word:word,freq:freq});
    }
    if(this.wordsRC_.hasOwnProperty(word)) {
      this.wordsRC_[word]++;
    } else {
      this.wordsRC_[word] = 1;
    }
  }
  onCJKSingleRC_(word,start,lang) {
    //console.log('WaiPhoenix::onCJKSingleRC_ word=<',word,'>');
    //console.log('WaiPhoenix::onCJKSingleRC_ start=<',start,'>');
    //console.log('WaiPhoenix::onCJKSingleRC_ lang=<',lang,'>');
    const freq = this.parrot_[word];
    //console.log('WaiPhoenix::onCJKSingleRC_ freq=<',freq,'>');
    if(freq) {
      //console.log('WaiPhoenix::onCJKSingleRC_ freq=<',freq,'>');
      //console.log('WaiPhoenix::onCJKSingleRC_ word=<',word,'>');
      //console.log('WaiPhoenix::onCJKSingleRC_ start=<',start,'>');
      this.sentenceRange_.push({begin:start,end:start+word.length,word:word,freq});
    }
  }
  
}

module.exports = WaiIndexBot;

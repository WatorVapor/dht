const RIPEMD160 = require('ripemd160');
const bs32Option = { type: "crockford", lc: true };

const util = require('util');
const graphviz = require('graphviz');

const onlyUnique_ = (value, index, self) =>{ 
    return self.indexOf(value) === index;
}
const hashSeq_ = (word) => {
  const hash = new RIPEMD160().update(JSON.stringify(word)).digest('hex');
  word.hash = hash;
}

class WaiAllPathGraph {
  constructor() {
  }
  allPath(sentence) {
    const keySentences = this.splitKeyPoint_(sentence);
    const allPath = [];
    for(const subIndex in keySentences) {
      const subSentence = keySentences[subIndex];
      if(subSentence.length > 0) {
        //console.log('isKeyPoint_::subSentence:=<',subSentence,'>');
        const subPath = this.allPath_(subSentence);
        //console.log('allPath::subPath.length:=<',subPath.length,'>');
        for(const path of subPath) {
          allPath.push(path);
        }
      } else {
        //console.log('allPath::subIndex:=<',subIndex,'>');
        //console.log('allPath::subSentence:=<',subSentence,'>');
      }
    }
    //console.log('allPath::allPath.length:=<',allPath.length,'>');
    return allPath;
  }
  
  statsWord(sentence) {
    const allPaths = this.allPath(sentence);
    //console.log('statsWord::allPaths.length:=<',allPaths.length,'>');
    const words = {};
    const hashSumAlready = {};
    for(let onePath of allPaths) {
      for(let wordRank of onePath) {
        //console.log('WaiIndexBot::onSentenceOut_ wordRank=<',wordRank,'>');
        const word = wordRank.word;
        const hash = wordRank.hash;
        //console.log('WaiIndexBot::onSentenceOut_ hash=<',hash,'>');
        if(words[word]) {
          if(!hashSumAlready[hash]) {
            words[word]++;
            hashSumAlready[hash] = true;
          }
        } else {
          words[word] = 1;
          hashSumAlready[hash] = true;
        }
      }
    }
    //console.log('statsWord::words:=<',words,'>');
    return words;
  }
  

  allPath_(sentence) {
    //console.log('allPath_::sentence:=<',sentence,'>');
    sentence.sort((a, b)=> { return a.begin - b.begin});
    //console.log('allPath_::sentence:=<',sentence,'>');
    const sentenceMap = {};
    let maxEnd = 0;
    let minBegin = Number.MAX_SAFE_INTEGER;
    for(const seq of sentence) {
      if(!seq.hash) {
        hashSeq_(seq);
      }
      sentenceMap[seq.hash] = seq;
      if(seq.end - maxEnd > 0) {
        maxEnd = seq.end;
      }
      if(seq.begin - minBegin < 0) {
        minBegin = seq.begin;
      }
    }
    //console.log('allPath_::maxEnd:=<',maxEnd,'>');
    //console.log('allPath_::minBegin:=<',minBegin,'>');
    const jointedFlags = {};
    const connectedSet = this.createConnected_(sentence,jointedFlags);
    //console.log('allPath_::connectedSet:=<',connectedSet,'>');
    const thinMaps = this.reduceConnected_(connectedSet,jointedFlags);
    //console.log('allPath_::thinMaps:=<',thinMaps,'>');
    //console.log('allPath_::jointedFlags:=<',jointedFlags,'>');
    const pathThough  = [];
    for(const path of thinMaps) {
      //console.log('allPath_::path:=<',path,'>');
      if(path.begin === minBegin && path.end === maxEnd) {
        pathThough.push(path);
      }
    }
    //console.log('allPath_::pathThough:=<',pathThough,'>');
    const pathThoughSeq  = [];
    for(const path of pathThough) {
      const onePath = [];
      for(const hash of path.path) {
        onePath.push(sentenceMap[hash]);
      }
      pathThoughSeq.push(onePath);
    }
    //console.log('allPath_::pathThoughSeq:=<',pathThoughSeq,'>');
    return pathThoughSeq;
  }
  createConnected_(sentence,jointedFlags){
    const connectedPairs = [];
    //console.log('createConnected::sentence:=<',sentence,'>');
    const beginSeqMap = {};
    const endSeqMap = {};
    for(const seq of sentence) {
      //console.log('createConnected::seq:=<',seq,'>');
      if(endSeqMap[seq.end]) {
        endSeqMap[seq.end].push(seq);
      } else {
        endSeqMap[seq.end] = [seq];
      }
      const pair = {begin:seq.begin,end:seq.end,path:[seq.hash]};
      connectedPairs.push(pair);
      const jointedKey = pair.path.join('');
      jointedFlags[jointedKey] = true;
    }
    //console.log('createConnected::endSeqMap:=<',endSeqMap,'>');
    for(const seq of sentence) {
      //console.log('createConnected::seq:=<',seq,'>');
      const connected = endSeqMap[seq.begin];
      if(connected) {
        //console.log('createConnected::connected:=<',connected,'>');
        for(const prev of connected) {
          const pair = {begin:prev.begin,end:seq.end,path:[prev.hash,seq.hash]};
          connectedPairs.push(pair);
          const jointedKey = pair.path.join('');
          jointedFlags[jointedKey] = true;
        }
      }
    }
    //console.log('createConnected::connectedPairs:=<',connectedPairs,'>');
    return connectedPairs;
  }
  
  reduceConnected_ (connectedSet,jointedFlags){
    //console.log('reduceConnected::connectedSet:=<',connectedSet,'>');
    while(true) {
      const endSeqMap = {};
      for(const seq of connectedSet) {
        //console.log('reduceConnected::seq:=<',seq,'>');
        if(endSeqMap[seq.end]) {
          endSeqMap[seq.end].push(seq);
        } else {
          endSeqMap[seq.end] = [seq];
        }
      }
      //console.log('reduceConnected::endSeqMap:=<',endSeqMap,'>');
      let isChanged = false;
      for(const seq of connectedSet) {
        //console.log('reduceConnected::seq:=<',seq,'>');
        const connected = endSeqMap[seq.begin];
        if(connected) {
          //console.log('reduceConnected::connected:=<',connected,'>');
          for(const prev of connected) {
            //console.log('reduceConnected::prev:=<',prev,'>');
            //console.log('reduceConnected::seq:=<',seq,'>');
            const newPath = prev.path.concat(seq.path);
            const pair = {begin:prev.begin,end:seq.end,path:newPath};
            const jointedKey = pair.path.join('');
            if(!jointedFlags[jointedKey]) {
              connectedSet.push(pair);
              isChanged = true;
              jointedFlags[jointedKey] = true;
            }
          }
        }
      }
      if(connectedSet.length - 1024 > 0) {
        console.log('reduceConnected:: too big connectedSet.length:=<',connectedSet.length,'>');
        break;
      }
      if(isChanged === false) {
        break;
      }
    }
    return connectedSet;
  }
  
  splitKeyPoint_ (sentence) {
    sentence.sort((a,b)=>{return a.begin - b.begin;});
    //console.log('splitKeyPoint_::sentence:=<',JSON.stringify(sentence,undefined,' '),'>');
    const keyPoints = [];
    let maxEnd = 0;
    for(const seq of sentence) {
      const isKey = this.isKeyPoint_(seq.begin,sentence);
      if(isKey === true) {
         keyPoints.push(parseInt(seq.begin));
      }
      if(seq.end>maxEnd) {
        maxEnd = seq.end
      }
    }
    keyPoints.push(parseInt(maxEnd));
    //console.log('splitKeyPoint_::keyPoints:=<',keyPoints,'>');
    const uniKeyPoints = keyPoints.filter(onlyUnique_);
    uniKeyPoints.sort((a,b)=>{return a-b;});
    //console.log('splitKeyPoint_::uniKeyPoints:=<',JSON.stringify(uniKeyPoints,undefined,' '),'>');
    const subSentences = {};
    let prevKeyPoint = 1;
    for(const keyPoint of uniKeyPoints) {
      //console.log('splitKeyPoint_::keyPoint:=<',keyPoint,'>');
      const subSentence = [];
      for(const seq of sentence) {
        if( seq.begin >= prevKeyPoint && seq.begin < keyPoint) {
          subSentence.push(seq);
        }
      }
      prevKeyPoint = keyPoint;
      subSentences[keyPoint] = subSentence;
    }
    //console.log('splitKeyPoint_::subSentences:=<',JSON.stringify(subSentences,undefined,' '),'>');
    return subSentences;
  }
  isKeyPoint_ (pos,sentence) {
    //console.log('isKeyPoint_::sentence:=<',sentence,'>');
    for(const seq of sentence) {
      //console.log('isKeyPoint_::pos:=<',pos,'>');
      //console.log('isKeyPoint_::seq:=<',seq,'>');
      if(pos - seq.begin > 0 && pos - seq.end < 0) {
        //console.log('isKeyPoint_::false:=<',false,'>');
        //console.log('isKeyPoint_::pos:=<',pos,'>');
        return false;
      }
    }
    //console.log('isKeyPoint_::true:=<',true,'>');
    //console.log('isKeyPoint_::pos:=<',pos,'>');
    return true;
  }
};
module.exports = WaiAllPathGraph;

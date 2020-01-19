const RIPEMD160 = require('ripemd160');
const bs32Option = { type: "crockford", lc: true };

class WaiAllPathGraph {
  constructor() {
  }
  allPath(sentence) {
    const onlyUnique = (value, index, self) =>{ 
        return self.indexOf(value) === index;
    }
    const hashSeq = (word) => {
      const hash = new RIPEMD160().update(JSON.stringify(word)).digest('hex');
      word.hash = hash;
    }

    const allPath_ = (sentence)=> {
      //console.log('allPath_::sentence:=<',sentence,'>');
      sentence.sort((a, b)=> { return a.begin > b.begin});
      console.log('allPath_::sentence:=<',sentence,'>');
      const sentenceMap = {};
      let maxEnd = 0;
      for(const seq of sentence) {
        if(!seq.hash) {
          hashSeq(seq);
        }
        sentenceMap[seq.hash] = seq;
        if(seq.end > maxEnd) {
          maxEnd = seq.end;
        }
      }
      console.log('allPath_::maxEnd:=<',maxEnd,'>');
      const jointedFlags = {};
      const connectedSet = createConnected(sentence,jointedFlags);
      console.log('allPath_::connectedSet:=<',connectedSet,'>');
      const thinMaps = reduceConnected(connectedSet,jointedFlags);
      //console.log('allPath_::thinMaps:=<',thinMaps,'>');
      //console.log('allPath_::jointedFlags:=<',jointedFlags,'>');
      const pathThough  = [];
      for(const path of thinMaps) {
        //console.log('allPath_::path:=<',path,'>');
        if(path.begin === 0 && path.end === maxEnd) {
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
    const createConnected = (sentence,jointedFlags) => {
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
    
    const reduceConnected = (connectedSet,jointedFlags)=> {
      //console.log('reduceConnected::connectedSet:=<',connectedSet,'>');
      const beginSeqMap = {};
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
      //const newConnectedPairs = [];
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
      console.log('reduceConnected::connectedSet:=<',connectedSet.length,'>');
      if(isChanged) {
        return reduceConnected(connectedSet,jointedFlags);
      } else {
        return connectedSet;
      }

    }

    return allPath_(sentence);
  }
};
module.exports = WaiAllPathGraph;

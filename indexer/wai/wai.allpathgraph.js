const RIPEMD160 = require('ripemd160');
const bs32Option = { type: "crockford", lc: true };

const util = require('util');
const graphviz = require('graphviz');

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
      sentence.sort((a, b)=> { return a.begin - b.begin});
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
    
    const splitKeyPoint_ = (sentence) => {
      sentence.sort((a,b)=>{return a.begin - b.begin;});
      //console.log('splitKeyPoint_::sentence:=<',JSON.stringify(sentence,undefined,' '),'>');
      const keyPoints = [];
      let maxEnd = 0;
      for(const seq of sentence) {
        const isKey = isKeyPoint_(seq.begin,sentence);
        if(isKey === true) {
           keyPoints.push(parseInt(seq.begin));
        }
        if(seq.end>maxEnd) {
          maxEnd = seq.end
        }
      }
      keyPoints.push(parseInt(maxEnd));
      //console.log('splitKeyPoint_::keyPoints:=<',keyPoints,'>');
      const uniKeyPoints = keyPoints.filter(onlyUnique);
      uniKeyPoints.sort((a,b)=>{return a-b;});
      console.log('splitKeyPoint_::uniKeyPoints:=<',JSON.stringify(uniKeyPoints,undefined,' '),'>');
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
    const isKeyPoint_ = (pos,sentence) => {
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
    const keySentences = splitKeyPoint_(sentence);
    for(const subSentence in keySentences) {
      console.log('isKeyPoint_::subSentence:=<',subSentence,'>');
    }

    //return allPath_(sentence);
  }
  
  
  
  
  
  
  createGraphDot(sentence) {
    this.begins_ = {};
    this.ends_ = {};
    this.hashSentence_ = {};
    this.sortBeginEnd_(sentence);
    
    //console.log('WaiGraph::createGraphDot_ sentence=<',sentence,'>');
    const g = graphviz.digraph("G");
    g.set("rankdir","LR");
    g.addNode('B');
    g.addNode('E');
    for(let word of sentence) {
      //console.log('WaiGraph::createGraphDot_ word=<',word,'>');
      const attr = {};
      attr.label = word.word;
      attr.label += '\n';
      attr.label += word.freq;
      attr.label += '\n';
      attr.label += word.hash;
      g.addNode(word.hash,attr);
    }
    for(let wordSeq in this.begins_) {
     //console.log('WaiGraph::createGraphDot_ wordSeq=<',wordSeq,'>');
     for(let word of this.begins_[wordSeq]) {
        //console.log('WaiGraph::createGraphDot_ word=<',word,'>');
        if(word.begin === 0) {
          const e = g.addEdge('B',word.hash);
          e.set( "weight", 1.0 / word.freq );
        } else {
          const fronts = this.findEndNode_(word.begin,this.ends_);
          for(let nodeFront of fronts) {
            const e = g.addEdge(nodeFront,word.hash);
            e.set( "weight", 1.0 / word.freq );
          }
        }
     }
    }
    let endKeys = Object.keys(this.ends_);
    const lastEndIndex = endKeys[endKeys.length-1];
    let lastSeqEnds = this.ends_[lastEndIndex];
    //console.log('WaiGraph::createGraphDot_ lastSeqEnds=<',lastSeqEnds,'>');
    if(!lastSeqEnds) {
      const debug = false;
      if(debug) {
        console.log('WaiGraph::dijkstraShortPath_ sentence=<',sentence,'>');
        console.log('WaiGraph::dijkstraShortPath_ this.ends_=<',this.ends_,'>');
        process.exit(0);
      }
      return g;
    }
    for(let word of lastSeqEnds) {
      g.addEdge(word.hash,'E');
    }
    const dot = g.to_dot();
    //console.log('dot=<',dot,'>' );
    const rankGraph = this.createRankOfGraph_(this.begins_);
    //console.log('rankGraph=<',rankGraph,'>' );
    const position = dot.length -2;
    const dotNew = dot.slice(0, position) + rankGraph + '}';
    console.log('WaiGraph::createGraphDot_ dotNew=<',dotNew,'>' );
    return g;
  }
  createRankOfGraph_(begins) {
    let rankG = '';
    for(let wordSeqIndex in begins) {
     const wordSeq = begins[wordSeqIndex];
     //console.log('WaiGraph::createRankOfGraph_ wordSeq=<',wordSeq,'>');
     rankG += '{rank=same;';
     for(let word of wordSeq) {
       rankG += '"' + word.hash + '";';
     }
     rankG += '};\n';
    }
    //console.log('WaiGraph::createRankOfGraph_ rankG=<',rankG,'>');
    return rankG;
  }  
  sortBeginEnd_(sentence) {
    for(let word of sentence) {
      //console.log('WaiGraph::gatherAllPath_ word=<',word,'>');
      const hash = new RIPEMD160().update(JSON.stringify(word)).digest('hex'); 
      word.hash = hash;
      this.hashSentence_[hash] = word;
      if(! this.begins_[word.begin]) {
        this.begins_[word.begin] = [];
      }
      this.begins_[word.begin].push(word);
      if(! this.ends_[word.end]) {
        this.ends_[word.end] = []
      }
      this.ends_[word.end].push(word);
    }
  }
    
  findEndNode_(targetEnd,ends) {
    //console.log('WaiGraph::findEndNode_ targetEnd=<',targetEnd,'>');
    //console.log('WaiGraph::findEndNode_ ends=<',ends,'>');
    const wordEnd = ends[targetEnd];
    //console.log('WaiGraph::findEndNode_ wordEnd=<',wordEnd,'>');
    let front = [];
    if(wordEnd) {
      for(let word of wordEnd) {
        front.push(word.hash)
      }
    }
    //console.log('WaiGraph::findEndNode_ front=<',front,'>');
    return front;
  }

};
module.exports = WaiAllPathGraph;

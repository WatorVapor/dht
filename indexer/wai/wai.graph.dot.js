const util = require('util');
const graphviz = require('graphviz');
const crypto = require('crypto');
const GraphDijkstra = require('node-dijkstra');
//const GraphDijkstra = require('graphs-adt');

class WaiGraphDot {
  constructor() {
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
module.exports = WaiGraphDot;

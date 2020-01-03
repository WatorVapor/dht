const util = require('util');
const graphviz = require('graphviz');
const crypto = require('crypto');
const GraphDijkstra = require('node-dijkstra');
//const GraphDijkstra = require('graphs-adt');

class WaiGraph {
  constructor() {
  }
  shortPath(sentence) {
    this.begins_ = {};
    this.ends_ = {};
    this.hashSentence_ = {};
    this.sortBeginEnd_(sentence);
    //this.g_ = this.createGraphDot_(sentence);
    return this.dijkstraShortPath_(sentence);
  }
  
  dijkstraShortPath_(sentence) {
    //console.log('WaiGraph::dijkstraShortPath_ sentence=<',sentence,'>');
    if(Object.keys(sentence).length < 1) {
      return [];
    }
    const waiRoute = {};
    waiRoute.begin = {};
    for(let wordSeq in this.begins_) {
     //console.log('WaiGraph::dijkstraShortPath_ wordSeq=<',wordSeq,'>');
     for(let word of this.begins_[wordSeq]) {
        //console.log('WaiGraph::dijkstraShortPath_ word=<',word,'>');
        waiRoute[word.hash] = {};
        if(word.begin === 0) {
          //e.set( "weight", 1.0 / word.freq );
          waiRoute.begin[word.hash] = 1.0 / word.freq;
        } else {
          const fronts = this.findEndNode_(word.begin,this.ends_);
          for(let nodeFront of fronts) {
            //e.set( "weight", 1.0 / word.freq );
            //console.log('WaiGraph::dijkstraShortPath_ nodeFront=<',nodeFront,'>');
            if(!waiRoute[nodeFront]) {
              waiRoute[nodeFront] = {};
            }
            waiRoute[nodeFront][word.hash] = 1.0 / word.freq;
          }
        }
     }
    }

    waiRoute.end = {};
    let endKeys = Object.keys(this.ends_);
    const lastEndIndex = endKeys[endKeys.length-1];
    let lastSeqEnds = this.ends_[lastEndIndex];
    if(!lastSeqEnds) {
      const debug = false;
      if(debug) {
        this.createGraphDot_(sentence);
        console.log('WaiGraph::dijkstraShortPath_ this.ends_=<',this.ends_,'>');
        process.exit(0);
      }
      return [];
    }
    for(let word of lastSeqEnds) {
      if(!waiRoute[word.hash]) {
        waiRoute[word.hash] = {};
      }
      waiRoute[word.hash].end = 1.0 / word.freq;
    }
    //console.log('WaiGraph::dijkstraShortPath_ waiRoute=<',waiRoute,'>');
    const route = new GraphDijkstra(waiRoute);
    //console.log('WaiGraph::dijkstraShortPath_ route=<',route,'>');
    const paths = route.path('begin', 'end');
    if(!paths) {
      const debug = false;
      if(debug) {
        this.createGraphDot_(sentence);
        console.log('WaiGraph::dijkstraShortPath_ paths=<',paths,'>');
        process.exit(0);
      }
      return [];
    }
    //console.log('WaiGraph::dijkstraShortPath_ paths=<',paths,'>');
    const seqWordShort = [];
    for(let hash of paths) {
      if( this.hashSentence_[hash]) {
        seqWordShort.push(this.hashSentence_[hash]);
      }
    }
    //console.log('WaiGraph::dijkstraShortPath_ seqWordShort=<',seqWordShort,'>');
    return seqWordShort;
  }
  
  gatherAllPath___NG_(sentence) {
    //console.log('WaiGraph::gatherAllPath_ this.begins_=<',this.begins_,'>');
    //console.log('WaiGraph::gatherAllPath_ this.ends_=<',this.ends_,'>');
    const paths_ = {};
    for(let wordSeq in this.begins_) {
     //console.log('WaiGraph::gatherAllPath_ wordSeq=<',wordSeq,'>');
     for(let word of this.begins_[wordSeq]) {
        //console.log('WaiGraph::gatherAllPath_ word=<',word,'>');
        if(word.begin === 0) {
          //e.set( "weight", 1.0 / word.freq );
          paths_[word.hash] = 1.0 / word.freq;
        } else {
          const fronts = this.findEndNode_(word.begin,this.ends_);
          for(let nodeFront of fronts) {
            //e.set( "weight", 1.0 / word.freq );
            //console.log('WaiGraph::gatherAllPath_ nodeFront=<',nodeFront,'>');
            const pathParents = this.findEndPath_(paths_,nodeFront);
            //console.log('WaiGraph::gatherAllPath_ pathParents=<',pathParents,'>');
            for(let pathParent of pathParents) {
              const keyAppend = pathParent + ',' + word.hash;
              paths_[keyAppend] = paths_[pathParent] + 1.0 / word.freq;
            }
            this.thinPath_(pathParents,paths_);
          }
        }
     }
    }
    //console.log('WaiGraph::gatherAllPath_ paths_=<',paths_,'>');
    
    let endKeys = Object.keys(this.ends_);
    const lastEndIndex = endKeys[endKeys.length-1];
    let lastSeqEnds = this.ends_[lastEndIndex];
    //console.log('WaiGraph::createGraph_ lastSeqEnds=<',lastSeqEnds,'>');
    const connectedPath = {}
    for(let word of lastSeqEnds) {
      const pathParents = this.findEndPath_(paths_,word.hash);
      for(let pathParent of pathParents) {
        connectedPath[pathParent] = paths_[pathParent];
      }
    }
    if(Object.keys(connectedPath).length < 1) {
      this.createGraphDot_(sentence);
      console.log('WaiGraph::gatherAllPath_ paths_=<',paths_,'>');
      // debug
      process.exit(0);
      return [];
    }
    
    //console.log('WaiGraph::gatherAllPath_ connectedPath=<',connectedPath,'>');
    const connectedKeys = Object.keys(connectedPath);
    let min = connectedPath[connectedKeys[0]];
    let minPath = connectedKeys[0];
    for(let path in connectedPath) {
      if(connectedPath[path] < min) {
        minPath = path;
        min = connectedPath[path];
      }
    }
    //console.log('WaiGraph::gatherAllPath_ min=<',min,'>');
    //console.log('WaiGraph::gatherAllPath_ minPath=<',minPath,'>');
    let hashs = minPath.split(',');
    const minPathSeq = [];
    for(let hash of hashs) {
      //console.log('WaiGraph::gatherAllPath_ hash=<',hash,'>');
      minPathSeq.push(this.hashSentence_[hash]);
    }
    //console.log('WaiGraph::gatherAllPath_ minPathSeq=<',minPathSeq,'>');
    return minPathSeq;
  }
  
  
  sortBeginEnd_(sentence) {
    for(let word of sentence) {
      //console.log('WaiGraph::gatherAllPath_ word=<',word,'>');
      const shasum = crypto.createHash('sha1');
      shasum.update(JSON.stringify(word));
      const hash = shasum.digest('hex');
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
  
  findEndPath_(allPath,node) {
    //console.log('WaiGraph::findEndPath_ allPath=<',allPath,'>');
    //console.log('WaiGraph::findEndPath_ node=<',node,'>');
    const frontPath = [];
    for(let path in allPath) {
      //console.log('WaiGraph::findEndPath_ path=<',path,'>');
      if(path.endsWith(node)) {
        frontPath.push(path);
      }
    }
    return frontPath;
  }
  
  thinPath_(pathParents,paths_) {
    for(let pathParent of pathParents) {
      delete paths_[pathParent];
    }
  }
  
  
  createGraphDot_(sentence) {
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
module.exports = WaiGraph;


/*
const g = graphviz.digraph("G");
g.set("rankdir","LR");
const n1 = g.addNode( "A", {"color":"blue","label":"HelloJP"} );
n1.set( "style", "filled" );
const n2 = g.addNode( "B",{"color":"blue","label":"WorldCN"} );
const e = g.addEdge( n1, n2);
e.set( "color", "red" );
e.set( "weight", 1.1 );
const n3 = g.addNode( "C",{"color":"blue","label":"333"} );
const n4 = g.addNode( "D",{"color":"blue","label":"444"} );
g.addEdge( n1, n4);
g.addEdge( n2, n3);
g.addEdge( n3, n4);

const n5 = g.addNode( "E",{"color":"blue","label":"555"} );
const n6 = g.addNode( "F",{"color":"blue","label":"666"} );

g.addEdge( n1, n5);
g.addEdge( n4, n6);

const dot = g.to_dot();
let rank = "  {rank=same;B;C};\n";
rank += "  {rank=same;D;E};\n";
const position = dot.length -2;
const dotNew = dot.slice(0, position) + rank + '}'; 
console.log('dot=<',dot,'>' );
console.log('dotNew=<',dotNew,'>' );
*/




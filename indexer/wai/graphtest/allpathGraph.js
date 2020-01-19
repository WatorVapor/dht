const inputSentence = 
 [ { begin: 0,
    end: 1,
    word: '返',
    freq: 0.000754113195669423,
    freqOrig: 0.000754113195669423,
    hash: 'ffa7711e738c5a005c6f37f623c981d3810ef3fe' },
  { begin: 0,
    end: 2,
    word: '返回',
    freq: 0.04272870941723444,
    freqOrig: 0.014242903139078146,
    hash: '1124d9c1976bb53a93e32cf6213298227d3d2d86' },
  { begin: 1,
    end: 2,
    word: '回',
    freq: 0.012140129532602828,
    freqOrig: 0.012140129532602828,
    hash: 'c5e70d18c63485b268d5567eb1d0442848703a88' },
  { begin: 2,
    end: 3,
    word: '顶',
    freq: 0.003790238496495013,
    freqOrig: 0.003790238496495013,
    hash: '986410935098142d8181c730de402400f0e257a0' },
  { begin: 2,
    end: 4,
    word: '顶部',
    freq: 0.007108336557440475,
    freqOrig: 0.002369445519146825,
    hash: '394e096989ae5f07c50aaa1d8cf34baf55c7aa67' },
  { begin: 3,
    end: 4,
    word: '部',
    freq: 0.010059214279625172,
    freqOrig: 0.010059214279625172,
    hash: 'b6958e9973efcb770b5f6b243102982f488207b1' }
];

const WaiAllPathGraph = require('../wai.allpathgraph.js');

const graph = new WaiAllPathGraph();
const seqPaths = graph.allPath(inputSentence);
console.log('::seqPaths:=<',seqPaths,'>');

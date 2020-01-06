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


const onlyUnique = (value, index, self) =>{ 
    return self.indexOf(value) === index;
}

const allPath = (sentence)=> {
  console.log('allPath::sentence:=<',sentence,'>');
  sentence.sort((a, b)=> { return a.begin > b.begin});
  //console.log('allPath::sentence:=<',sentence,'>');
  
  const root = {leaf:{},begin:-1,end:0,hash:'begin'};
  for(const seg of sentence) {
    //console.log('allPath::seg:=<',seg,'>');
    addLeaf(root,seg);
  }
  console.log('allPath::root:=<',JSON.stringify(root,undefined,'  '),'>');
  const flatElement = {};
  //flatElement.begin = Object.assign({},root);
  flatTree(root,flatElement);
  console.log('allPath::flatElement:=<',flatElement,'>');
  const allTreePath = [];
  findAllLeafTreePath(root,allTreePath,flatElement);
  console.log('allPath::allTreePath:=<',allTreePath,'>');
  const uniqueTreePath = allTreePath.filter( onlyUnique );
  console.log('allPath::uniqueTreePath:=<',uniqueTreePath,'>');

  const allSeqPath = [];
  for(const pathTreeStr of uniqueTreePath) {
    const pashSeq = [];
    const pathTree = pathTreeStr.split(',');
    for(const hash of pathTree) {
      if(hash !== 'begin') {
        const seq = Object.assign({},flatElement[hash]);
        delete seq.leaf;
        delete seq.father;
        pashSeq.push(seq);
      }
    }
    allSeqPath.push(pashSeq.reverse());
  }
  console.log('allPath::allSeqPath:=<',allSeqPath,'>');
  return allSeqPath;
}

const addLeaf = (prev,seq) => {
  //console.log('addLeaf::seq:=<',seq,'>');
  if(prev.end === seq.begin) {
    prev.leaf[seq.hash] =  Object.assign({leaf:{},father:prev.hash},seq);
    //flat[seq.hash] =  Object.assign({},prev.leaf[seq.hash]);
  }
  for(const leafKey in prev.leaf) {
    addLeaf(prev.leaf[leafKey],seq);
  }
};

const flatTree = (current,flat) => {
  let flatKey = current.hash;
  if(flat[flatKey]) {
    console.log('!!!!!!!!!!bad flatTree::flatKey:=<',flatKey,'>');
  } else {
    flat[flatKey] = current;    
  }
  for(const leafKey in current.leaf) {
    flatTree(current.leaf[leafKey],flat);
  }
}


const findAllLeafTreePath = (curret,allTreePath,flatElement) => {
  if(Object.keys(curret.leaf).length === 0) {
    const pathTree = [];
    pathOfTree(curret,pathTree,flatElement);
    allTreePath.push(pathTree.join(','));
   // console.log('findAllLeafTreePath::pathTree:=<',pathTree,'>');
    return;
  }
  for(const leafKey in curret.leaf) {
    //console.log('findAllLeafTreePath::leafKey:=<',leafKey,'>');
    const next = curret.leaf[leafKey];
    findAllLeafTreePath(next,allTreePath,flatElement);
  }
}

const pathOfTree = (curret,pathTree,flatElement) => {
  pathTree.push(curret.hash);
  if(curret.father) {
    //console.log('pathOfTree::curret.father:=<',curret.father,'>');
    const father = flatElement[curret.father];
    //console.log('pathOfTree::father:=<',father,'>');
    pathOfTree(father,pathTree,flatElement);
  }
}

allPath(inputSentence);

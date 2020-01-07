const RIPEMD160 = require('ripemd160');
const bs32Option = { type: "crockford", lc: true };

class WaiTreeGraph {
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

    let gNodeID = 0;
    const allPath = (sentence)=> {
      //console.log('allPath::sentence:=<',sentence,'>');
      sentence.sort((a, b)=> { return a.begin > b.begin});
      //console.log('allPath::sentence:=<',sentence,'>');
      const sentenceMap = {};
      for(const seq of sentence) {
        if(!seq.hash) {
          hashSeq(seq);
        }
        sentenceMap[seq.hash] = seq;
      }

      gNodeID = 0;
      const root = {leaf:{},begin:-1,end:0,hash:'begin',id:gNodeID++};
      const flatElement = {};
      flatElement.begin = Object.assign({},root);
      for(const seg of sentence) {
        //console.log('allPath::seg:=<',seg,'>');
        addLeaf(root,seg,flatElement);
      }
      //console.log('allPath::root:=<',JSON.stringify(root,undefined,'  '),'>');
      //flatElement.begin = Object.assign({},root);
      //flatTree(root,flatElement);
      //console.log('allPath::flatElement:=<',flatElement,'>');
      const allTreePath = [];
      findAllLeafTreePath(root,allTreePath,flatElement);
      //console.log('allPath::allTreePath:=<',allTreePath,'>');
      const uniqueTreePath = allTreePath.filter( onlyUnique );
      //console.log('allPath::uniqueTreePath:=<',uniqueTreePath,'>');

      const allSeqPath = [];
      for(const pathTreeStr of uniqueTreePath) {
        const pashSeq = [];
        const pathTree = pathTreeStr.split(',');
        for(const hash of pathTree) {
          if(hash !== 'begin') {
            const seq = Object.assign({},sentenceMap[hash]);
            pashSeq.push(seq);
          }
        }
        allSeqPath.push(pashSeq.reverse());
      }
      //console.log('allPath::allSeqPath:=<',allSeqPath,'>');
      return allSeqPath;
    }

    const addLeaf = (prev,seq,flatElement) => {
      //console.log('addLeaf::seq:=<',seq,'>');
      if(prev.end === seq.begin) {
        const node = Object.assign({leaf:{},father:prev.id,id:gNodeID++},seq);
        prev.leaf[seq.hash] =  node;
        flatElement[node.id] =  Object.assign({},node);
      }
      for(const leafKey in prev.leaf) {
        addLeaf(prev.leaf[leafKey],seq,flatElement);
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
    return allPath(sentence);
  }
};
module.exports = WaiTreeGraph;

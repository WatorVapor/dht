$(document).ready(() => {
  //console.log('onWaiResource CJK_Table=<',CJK_Table,'>');
  onInitIpfs();
});


onInitIpfs = ()=> {
  const node = new window.Ipfs();
  node.on('ready', () => {
    //console.log('onInitIpfs node=<',node,'>');
    showIpfsInfo(node);
    //doReadFile(node);
    //doReadBlockInfo(node);
  })
}

showIpfsInfo = (node) => {
  node.id(function (err, identity) {
    if (err) {
      throw err;
    }
    console.log('showIpfsInfo identity=<',identity,'>');
  })  
}

const blockCID = 'QmcbsjA8dzaGVXJ1PbGsKoZfZWKvSecRb3Kty996rQXZkQ'

doReadBlockInfo = (node) => {
  node.get(blockCID, (err, files) => {
    if(err) {
      throw err;
    }
    for(let file of files) {
      console.log('doReadBlockInfo file=<',file,'>');
      //console.log('doReadBlockInfo file.path=<',file.path,'>');
      //console.log('doReadBlockInfo file.content=<',file.content.toString('utf8'),'>');
      onWaiBlock(node,file.content.toString('utf8'));
    }
  })
};

const aBlockCollect = {};

onWaiBlock = async (node,block) => {
  console.log('onWaiBlock block=<',block,'>');
  try {
    let jsonBlock = JSON.parse(block);
    console.log('onWaiBlock jsonBlock=<',jsonBlock,'>');
    for(let resourceCID of jsonBlock.resource) {
      console.log('onWaiBlock resourceCID=<',resourceCID,'>');
      await doReadResourceCID(node,resourceCID);
    }
  }
  catch(e) {
    console.error('onWaiBlock e=<',e,'>');
  }
}

doReadResourceCID = async (node,cid) => {
  let files = await node.get(cid);
  try {
    for(let file of files) {
      let docCollect = onWaiDocument(file.content.toString('utf8'));
      console.log('doReadResourceCID docCollect=<',docCollect,'>');
      mergeDocument2Block(docCollect);
    }    
  } catch (e) {
    console.error('doReadResourceCID e=<',e,'>');
  }
}

mergeDocument2Block = (collect) => {
  for(let key in collect) {
    if(aBlockCollect[key]) {
      aBlockCollect[key] += collect[key];
    } else {
      aBlockCollect[key] = collect[key];
    }
  }
}


const validCID = 'QmfZmje1L9tq4RMUHM7Y3sk3Zohrm9UQarujHyENUhR8cJ';

doReadFile = (node) => {
  node.get(validCID, (err, files) => {
    if(err) {
      throw err;
    }
    files.forEach((file) => {
      //console.log('doReadFile file.path=<',file.path,'>');
      //console.log('doReadFile file.content=<',file.content.toString('utf8'),'>');
      onWaiDocument(file.content.toString('utf8'));
    })
  })  
};


onWaiDocument = (article) => {
  let aDocumentStatistics = {};
  //console.log('onWaiDocument article=<',article,'>');
  let cjkCollect = [];
  let cjkBuffer = [];
  for(let i = 0 ;i < article.length;i++) {
    let utf8 = article[i];
    //console.log('onWaiDocument utf8=<',utf8,'>');
    let isCJK = CJK_Table[utf8];
    //console.log('onWaiDocument isCJK=<',isCJK,'>');
    if(isCJK) {
      cjkBuffer.push(utf8);
    } else {
      if(cjkBuffer.length > 0) {
        cjkCollect.push(cjkBuffer);
      }
      cjkBuffer = [];
    }
  }
  if(cjkBuffer.length > 0) {
    cjkCollect.push(cjkBuffer);
  }  
  //console.log('onWaiDocument cjkCollect=<',cjkCollect,'>');
  for(let i = 0 ;i < cjkCollect.length;i++) {
    onWaiSentence(cjkCollect[i],aDocumentStatistics);
  }
  //console.log('onWaiDocument aDocumentStatistics=<',aDocumentStatistics,'>');
  let highFreq = FilterOutLowFreq(aDocumentStatistics);
  //console.log('onWaiDocument highFreq=<',highFreq,'>');
  let uniqWords = FilterOutInside(highFreq);
  //console.log('onWaiDocument uniqWords=<',uniqWords,'>');
  return uniqWords;
}




const iConstNGramMaxWindow = 32;

onWaiSentence = (sentence,collect) => {
  //console.log('onWaiSentence sentence=<',sentence,'>');
  for(let i = 0 ;i < sentence.length;i++) {
    let utf8 = sentence[i];
    //console.log('onWaiSentence utf8=<',utf8,'>');
    let backIndex = i;
    if(backIndex > iConstNGramMaxWindow) {
      backIndex = iConstNGramMaxWindow;
    }
    for(let j = 1 ;j <= backIndex;j++) {
      let start = i - j ;
      if(start >= 0) {
        let concat = sentence.slice(start,i+1);
        let word = concat.join('');
        //console.log('onWaiSentence word=<',word,'>');
        if(collect[word]) {
          collect[word]++;
        } else {
          collect[word] = 1;
        }
      }
    }
  }
}

const iConstWordFilterOutStageOne = 3;


FilterOutLowFreq = (collect) => {
  let outCollect = JSON.parse(JSON.stringify(collect));
  let keys = Object.keys(outCollect);
  for(let i = 0 ;i < keys.length;i++) {
    let key = keys[i];
    if(outCollect[key] < iConstWordFilterOutStageOne) {
      delete outCollect[key];
    }
  }
  return outCollect;
}

FilterOutInside = (collect) => {
  let outCollect = JSON.parse(JSON.stringify(collect));
  let keys = Object.keys(outCollect);
  for(let i = 0 ;i < keys.length;i++) {
    let key = keys[i];
    //console.log('FilterOutInside key=<',key,'>');
    for(let j = 0 ;j < keys.length;j++) {
      let keyFound = keys[j];
      //console.log('FilterOutInside keyFound=<',keyFound,'>');
      if(keyFound !== key && keyFound.includes(key)) {
        if(outCollect[keyFound] === outCollect[key]) {
          delete outCollect[key];
        }
      }
    }
  }
  return outCollect;
}

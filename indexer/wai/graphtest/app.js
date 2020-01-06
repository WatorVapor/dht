
const jsgraphs = require('js-graph-algorithms');

const g = new jsgraphs.WeightedDiGraph(8);

g.addEdge(new jsgraphs.Edge(0, 1, 5.0));
g.addEdge(new jsgraphs.Edge(0, 4, 9.0));
g.addEdge(new jsgraphs.Edge(0, 7, 8.0));
g.addEdge(new jsgraphs.Edge(1, 2, 12.0));
g.addEdge(new jsgraphs.Edge(1, 3, 15.0));
g.addEdge(new jsgraphs.Edge(1, 7, 4.0));
g.addEdge(new jsgraphs.Edge(2, 3, 3.0));
g.addEdge(new jsgraphs.Edge(2, 6, 11.0));
g.addEdge(new jsgraphs.Edge(3, 6, 9.0));
g.addEdge(new jsgraphs.Edge(4, 5, 5.0));
g.addEdge(new jsgraphs.Edge(4, 6, 20.0));
g.addEdge(new jsgraphs.Edge(4, 7, 5.0));
g.addEdge(new jsgraphs.Edge(5, 2, 1.0));
g.addEdge(new jsgraphs.Edge(5, 6, 13.0));
g.addEdge(new jsgraphs.Edge(7, 5, 6.0));
g.addEdge(new jsgraphs.Edge(7, 2, 7.0)); 

g.addEdge(new jsgraphs.Edge(6, 7, 13.0));
//g.addEdge(new jsgraphs.Edge(3, 4, 9.0));



const calAllpaths = (s,d) => {
  const memoAllNext = {};
  calAllpaths_Small(s,d,memoAllNext,);
  console.log('memoAllNext =<',memoAllNext,'>');
  const memoAllPrev = {};
  for(const vKey in memoAllNext) {
    const nextV = memoAllNext[vKey];
    for(const v of nextV) {
      if(memoAllPrev[v]) {
        memoAllPrev[v].push(vKey);
      } else {
        memoAllPrev[v] = [vKey];
      }
    }
  }
  console.log('memoAllPrev =<',memoAllPrev,'>');
  
  const paths = [];
  findPathReverse_(s,d,memoAllNext,paths);
  console.log('paths =<',paths,'>');
  tinkPaths_(s,d,paths);
  console.log('paths =<',paths,'>');
  
  
  /*
  const treeStart = memoAllNext[s];
  callTreeSmall_(treeStart,memoAllNext);
  console.log('treeStart =<',treeStart,'>');
  */
}
const findPathReverse_ = (s,d,memoAllNext,paths)=> {
  for(const vKey in memoAllNext) {
    //console.log('vKey =<',vKey,'>');
    const nextV = memoAllNext[vKey];
    //console.log('nextV =<',nextV,'>');
    for(const v of nextV) {
      //console.log('v =<',v,'>');
      if(v === d) {
        //console.log('vKey =<',vKey,'>');
        const prev = parseInt(vKey);
        paths.push([prev,v]);
        if(v !== prev) {
          findPathReverse_(s,prev,memoAllNext,paths);
        }
      }
    }
  }  
}

const tinkPaths_ = (s,d,path) => {
  for(const edge of path) {
    //console.log('edge =<',edge,'>');
    const start = edge[0];
    if(start != s) {
      for(const edge2 of path) {
        const end = edge2[edge2.length-1];
        //console.log('end =<',end,'>');
        if(end === start) {
          const newEdge = edge2.concat(edge.slice(1));
          console.log('newEdge =<',newEdge,'>');
        }
      }
    }
  }
}

const calAllpaths_Small = (s,d,memoNext) => {
  const adj = g.adj(s);
  //console.log('adj =<',adj,'>');
  if(adj.length > 0) {
    const adjV = [];
    for(const edge of adj ) {
      const nextV = edge.w;
      adjV.push(nextV);
      //console.log('nextV =<',nextV,'>');
      if(d !== nextV) {
        calAllpaths_Small(nextV,d,memoNext);
      } else {
        //console.log('nextV =<',nextV,'>');
      }
    }
    memoNext[s] = adjV;
  }
};

calAllpaths(0,7);




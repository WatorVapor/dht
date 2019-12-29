const IPFS_GATEWAY = 'https://ipfs.wator.xyz/ipfs';
class WaiCrystal {
  constructor() {
    this.block_ = 'QmcbsjA8dzaGVXJ1PbGsKoZfZWKvSecRb3Kty996rQXZkQ';
    this.blockURL_ = IPFS_GATEWAY + '/' + this.block_;
    let self = this;
    setTimeout(()=>{
      $.get(self.blockURL_,self.onBlockFromIpfs_.bind(self));
    },1);
  }
  async onBlockFromIpfs_(block) {
    if(typeof this.entryBlock === 'function') {
      this.entryBlock();
    }
    try {
      let jsonBlock = JSON.parse(block);
      //console.log('WaiCrystal::onBlockFromIpfs_ jsonBlock=<',jsonBlock,'>');
      for(let resourceCID of jsonBlock.resource) {
        //console.log('WaiCrystal::onBlockFromIpfs_ resourceCID=<',resourceCID,'>');
        let rURL = IPFS_GATEWAY + '/' + resourceCID;
        let result = await $.get(rURL);
        //console.log('WaiCrystal::onBlockFromIpfs_ result=<',result,'>');
        if(typeof this.onArticle === 'function') {
          this.onArticle(result);
        }
      }
    }
    catch(e) {
      console.error('WaiCrystal::onBlockFromIpfs_ e=<',e,'>');
    }
    if(typeof this.leaveBlock === 'function') {
      this.leaveBlock();
    }
  }
}

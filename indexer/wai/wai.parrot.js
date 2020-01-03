const iConstNGramMaxWindow = 64;
class WaiParrot extends WaiBase {
  constructor() {
    super();
  }
  entryBlock() {
    super.entryBlock();
  }
  leaveBlock() {
    super.leaveBlock();
  }
  article(doc) {
    super.article(doc,this.onSentence_.bind(this));
  }
  
  //
  onSentence_(sentence,collect) {
    //console.log('WaiParrot::onSentence_ sentence=<',sentence,'>');
    for(let i = 0 ;i < sentence.length;i++) {
      let utf8 = sentence[i];
      //console.log('WaiParrot::onSentence_ utf8=<',utf8,'>');
      let backIndex = i;
      if(backIndex > iConstNGramMaxWindow) {
        backIndex = iConstNGramMaxWindow;
      }
      for(let j = 1 ;j <= backIndex;j++) {
        let start = i - j ;
        if(start >= 0) {
          let concat = sentence.slice(start,i+1);
          let word = concat.join('');
          //console.log('WaiParrot::onSentence_ word=<',word,'>');
          if(collect[word]) {
            collect[word]++;
          } else {
            collect[word] = 1;
          }
        }
      }
    }
  }
}

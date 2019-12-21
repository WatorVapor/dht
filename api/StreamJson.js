'use strict';
class StreamJson {
  constructor() {
    this.buffered_ = '';
  }
  parse(msg) {
    const jMsgs = [];
    this.buffered_ += msg;
    console.log('StreamJson::parse this.buffered_=<',this.buffered_,'>');
    const res = this.buffered_.split('}');
    //console.log('StreamJson::parse res=<',res,'>');
    let incStart = '';
    let parseOkIndex = 0;
    for(let index = 0; index < res.length;index++) {
      const jsonRC = res[index];
      try {
        const jMsg = JSON.parse(jsonRC + '}');
        if(jMsg) {
          jMsgs.push(jMsg);
          incStart = '';
          parseOkIndex = index;
          console.log('parseStreamJson_::parse index=<',index,'>');
        }
      } catch (e) {
        //console.log('parseStreamJson_::parse e=<',e,'>');
        incStart += jsonRC + '}';
        //console.log('parseStreamJson_::parse incStart=<',incStart,'>');
        try {
          const jMsg = JSON.parse(incStart);
          if(jMsg) {
            jMsgs.push(jMsg);
            incStart = '';
            parseOkIndex = index;
            //console.log('parseStreamJson_::parse index=<',index,'>');
          }
        } catch (e) {
          //console.log('parseStreamJson_::parse e=<',e,'>');
        }
      }
    }
    //console.log('parseStreamJson_::parse parseOkIndex=<',parseOkIndex,'>');
    //console.log('parseStreamJson_::parse res.length=<',res.length,'>');
    const remain = res.slice(parseOkIndex + 1).filter(word => word !== '' );
    //console.log('parseStreamJson_::parse remain=<',remain,'>');
    if(remain.length > 0) {
      this.buffered_ = remain.concat(remain,'}');
    } else {
      this.buffered_ =  '';
    }
    //console.log('parseStreamJson_::parse this.buffered_=<',this.buffered_,'>');
    return jMsgs;
  }
}

module.exports = StreamJson;

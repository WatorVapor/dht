'use strict';
class StreamJson {
  constructor() {
    this.buffered_ = '';
  }
  parse(msg) {
    const jMsgs = [];
    this.buffered_ += msg;
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
        }
      } catch (e) {
        //console.log('parseStreamJson_::parse e=<',e,'>');
        incStart += jsonRC + '}';
        try {
          const jMsg = JSON.parse(incStart);
          if(jMsg) {
            jMsgs.push(jMsg);
            incStart = '';
            parseOkIndex = index;
          }
        } catch (e) {
          //console.log('parseStreamJson_::parse e=<',e,'>');
        }
      }
    }
    //console.log('parseStreamJson_::parse parseOkIndex=<',parseOkIndex,'>');
    const remain = res.slice(parseOkIndex);
    //console.log('parseStreamJson_::parse remain=<',remain,'>');
    this.buffered_ = remain.concat(remain,'}');
    //console.log('parseStreamJson_::parse this.buffered_=<',this.buffered_,'>');
    return jMsgs;
  }
}

module.exports = StreamJson;

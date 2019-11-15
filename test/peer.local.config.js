const path = require('path');
//console.log(':: __filename=<',__filename,'>');
const repsPath = __dirname + '/node_data.' + path.parse(__filename).name;;
const config = {
  listen:{
    ctrl:{
      port:8890
    },
    data:{
      port:8891
    }
  },
  local:true
  entrance:[
    {
      host:'::1',
      port:8890
    },
    {
      host:'::1',
      port:8895
    },
    {
      host:'::1',
      port:8897
    },
  ],
  reps: {
    path:repsPath
  }
};
module.exports = config;

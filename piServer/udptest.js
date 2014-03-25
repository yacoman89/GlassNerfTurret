

var s = require('dgram').createSocket('udp4');
s.bind(60000, function() {
    s.on('message', function(buf, rinfo){
        console.log('UDP MSG: ', buf.toString());
        console.log('UDP REQUEST', rinfo);
    });
});

setInterval(function(){
    
    var buf = new Buffer('Hello');
    s.send(buf, 0, buf.length, 5917, '0.0.0.0', function(){
        console.log('sent msg: ', buf.toString());     
    });
        
},1000);
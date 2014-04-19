
var dgram = require('dgram');
var s = dgram.createSocket('udp4');


var Speaker = require('speaker');

// Create the Speaker instance
var speaker = new Speaker({
  channels: 2,          
  bitDepth: 16,          
  sampleRate: 44100,    
  signed:true
});

s.bind(8888);

s.on('message', function(data){
	console.log('stream: ', data);
	speaker.write(data); 
});

tx = dgram.createSocket('udp4');
// socket.send(buf, offset, length, port, address, [callback])

setInterval(function(){ 
	var buf = new Buffer('hi');
//	tx.send(buf,0,buf.length, 8888, '0.0.0.0', function(){ /*  */  });
}, 1000);


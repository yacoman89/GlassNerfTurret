
var net = require('net');
var server = net.createServer(function(socket) { //'connection' listener

	socket.on('data', function(buf){
		console.log('server rx: ', buf);
		socket.write('hi');
	});

});
server.listen(9999, function() { //'listening' listener
  console.log('server bound');
});

server.on('listening', function(){

	var client = net.connect({port: 9999}, function() { //'connect' listener
  		console.log('client connected');
  		setInterval( function () {  
			client.write('world!\n');
		}, 1000);
	});

	client.on('data', function(data) {
  		console.log('client rx: ',data.toString());
  		//client.end();
	});

	client.on('end', function() {
  		console.log('client disconnected');
	});


});

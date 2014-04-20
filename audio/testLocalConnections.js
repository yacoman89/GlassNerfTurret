

var net = require('net');
var target = {IP:'0.0.0.0', port:3000};


server = net.createServer(function(socket){
	console.log('client connected');
	socket.on('data', function(buf){
		console.log('recieved from client: ', buf.toString());
		reply = 'bacon';
		console.log('replying to client with "'+reply+'"');
		var messanger = net.connect(socket.address().port, socket.address().address, function(){
			messanger.write(reply);
			messanger.end();
		});
	});

	
});

var port = 65123;
server.listen(port, function(){
	console.log('test server listening');
});

setInterval(function(){
	console.log('creating a messanger...');
	var msgr = net.connect(target.port, target.IP, function(){
		console.log('connected.  sending msg and leaving.');
		msgr.write("I LOVE BACON.  BAH CON.  BA HA CAH HA ON. BACON.\n");
		msgr.end();
	});	
	msgr.on('error', function(){
		console.log('nobody is there to message.');
	});
	if (Math.random() *100 > 50){
        	var msgr2 = net.connect(target.port+1, target.IP, function(){
        	        console.log('sending to a reset channel');
	                msgr2.write("done");
                	msgr2.end();
        	});
       		 msgr2.on('error', function(){
        	        console.log('nobody is there to message.');
	        });

	}
},5000);



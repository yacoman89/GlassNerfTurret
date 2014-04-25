
var net = require('net');
var WAV = require('./downloadWAV');
var T = require('child_process').exec;
var udp = require('dgram');

var Voice = {
	port:3000,
	resetPort: 3001,

	targetIP:'127.0.0.1',	//??
	targetPort:4000,		//??

	text:'',
	delimiter:'\n',
	filename: function() { return ( 'AUD'+((Math.random() * 999)|0)+'.wav'); },		//??
	filepath:'C:\\Users\\Yaco\\Desktop\\',
	relativePath:'',
	_states: ['open', 'closed'],
	state: 'open',

	
	/*
		Build A string if state is open.
	*/
	serverHandler: function( socket ){
	
		socket.on('data', function(buf){
			var self = Voice;
			/* only accept strings when ready */
			if (self.state != 'open'){
				console.log('rejecting string because state is closed');
				//if (buf.toString().indexOf('done'))
				 return;
			}
			console.log('server rx: ', buf.toString());
			self.text += buf.toString();
			/* check if end of string */
			if ( self.text.indexOf(self.delimiter) != -1 ){
				self.text = 'GLaDOS. ' + self.text;
				console.log('received string! : ', self.text);
				var enText = self.text.replace(/\s/g, "+");
				self.relativePath = self.filename();
				WAV.download(enText, self.returnFile, self.filepath+self.relativePath);
				self.state = 'closed';
			}
		});
	},
	/*
		Send something here to indicate ready to send string again
	*/	
	/*resetHandler: function(socket){
		
		socket.on('data', function(buf){
			var self = Voice;
			console.log('resetting state! : ', buf.toString());
			self.state = 'open';
		});
	},*/
	/*
		Send out filename when WAV is finished
	*/
	returnFile: function(filename){
		console.log('got file!! : ', Voice.relativePath);	
		messanger.write(Voice.relativePath+'\n');
	
	}
};
/* set up servers */
var server = net.createServer( Voice.serverHandler );
//var resetServer = net.createServer( Voice.resetHandler );
var messanger = net.connect(Voice.targetPort, Voice.targetIP, function(){
	
});
messanger.on('error', function(){
	console.log('filename was failed to return: target python connection error.');
});	
server.listen(Voice.port, function() { console.log('string listening server bound on ' + Voice.port);   });
//resetServer.listen(Voice.resetPort, function() { console.log('reset listening server bound on ' + Voice.resetPort);   });

/*	Run  sound card streamer in background	*/
var _cmd = 'python '+(__dirname + '/streamSoundCard.py'); console.log('cmd: ', _cmd);
T(_cmd);

if (process.argv.indexOf('-L') != -1) Voice.filepath = '';

/* testing */
//WAV.download('oh i want my baby back baby back baby back baby back baby back baby back baby back baby back baby back baby back baby back baby back baby back',
//Voice.returnFile,
//'babyback.wav'
//);
//WAV.download('hip dip dah', Voice.returnFile);
var broadcast = udp.createSocket('udp4');
broadcast.bind(9998, function() {
    broadcast.on('message', function(buf, rinfo){
        console.log('UDP MSG: ', buf.toString());
        var rbuf = new Buffer('hi');
        broadcast.send(rbuf, 0, rbuf.length, rinfo.port, rinfo.address, function(){
            console.log('sent msg: ', rbuf.toString());     
        });
        
    });
    console.log('UDP broadcast listening on ', broadcast.address());
});





var net = require('net');
var WAV = require('./downloadWAV');
var T = require('child_process').exec;
var udp = require('dgram');

var Voice = {
	port:3000,
	resetPort: 3001,

	targetIP:'192.168.2.10',	//??
	targetPort:4000,		//??

	text:'',
	delimiter:'\n',
	filename:'C:\Users\Yaco\Desktop\NaF.wav',		//??

	_states: ['open', 'closed'],
	state: 'open',

	
	/*
		Build A string if state is open.
	*/
	serverHandler: function( socket ){
		var self = this;
		socket.on('data', function(buf){
			/* only accept strings when ready */
			if (self.state != 'open') return;

			console.log('server rx: ', buf);
			self.text += buf.toString();
			/* check if end of string */
			if ( self.text.indexOf(self.delimiter) != -1 ){
				console.log('received string! : ', self.text);
				var enText = self.text.replace(/\s/g, "+");
				WAV.download(enText, self.returnFile, self.filename);
				self.state = 'closed';
			}
		});
	},
	/*
		Send something here to indicate ready to send string again
	*/	
	resetHandler: function(socket){
		
		var self = this;
		socket.on('data', function(buf){
			console.log('resetting state! : ', buf.toString());
			self.state = 'open';
		});
	},
	/*
		Send out filename when WAV is finished
	*/
	returnFile: function(filename){
		console.log('got file!! : ', filename);	
		var messanger = net.connect(this.targetPort, this.targetIP, function(){
			messanger.write(filename);
		});		
		
	}
};
/* set up servers */
var server = net.createServer( Voice.serverHandler );
var resetServer = net.createServer( Voice.resetHandler );

server.listen(Voice.port, function() { console.log('string listening server bound on ' + Voice.port);   });
resetServer.listen(Voice.resetPort, function() { console.log('reset listening server bound on ' + Voice.resetPort);   });

/*	Run  sound card streamer in background	*/
var _cmd = 'python '+(__dirname + '/streamSoundCard.py'); console.log('cmd: ', _cmd);
T(_cmd);

/* testing */
//WAV.download('oh i want my baby back baby back baby back baby back baby back baby back baby back baby back baby back baby back baby back baby back baby back',
//Voice.returnFile,
//'babyback.wav'
//);
//WAV.download('hip dip dah', Voice.returnFile);




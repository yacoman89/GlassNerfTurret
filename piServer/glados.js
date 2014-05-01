/*
    The udp server for controlling glados servos.
    Don't change anything here - check out config.js
*/
var os = require('os');
var udp = require('dgram');
var Servo = require('./servos');
var fs = require('fs');
require('./config');


Buffer.prototype.readOrientation = function(){          // Read buffer and convert to degrees
    return ((this.readFloatLE(0) * 180 / 3.1416) | 0);
}

/*Command line arguments
*/ 
if (process.argv.indexOf('--no-calibrate') != -1) {
    console.log('Not calibrating.'.yellow().bold());
    Cam.settings.calibrate = 0;
}
if (process.argv.indexOf('-o') != -1) {
    var filename = process.argv[process.argv.indexOf('-o')+1];
    if (!filename) {
        console.log(('Incorrect filename: '+filename).red().bold());
        process.exit();
    }
    filename = filename.indexOf('.csv') == -1 ? filename + '.csv' : filename;
    console.log(('Writing csv to '+filename).yellow().bold());
    Cam.cvs = filename;
    fs.writeFileSync(Cam.cvs,(new Date())+'\n');
}
/* Define calibration and moving functions for each servo
*/
for (var i in Cam.servos){
    if (i == 'shoot') 
        continue;
    Cam.servos[i]._div = Cam.settings.calibrate;
    Cam.servos[i]._sum = 0;
    Cam.servos[i].type = i;
    Cam.servos[i].goTo = function(num, nocalibrate){
        
        if (this._div && !nocalibrate) {            // Calibration state
            console.log('CALIBRATING'.yellow());
            this._div--;
            this._sum += (this.center - num);
            if (!this._div) {
                this.offset = (this._sum / Cam.settings.calibrate)|0;
            }
        }else{                                      // Shoot state
            var pos = num + this.offset;

	    if (this.invert) 
		pos = this.max - pos;

	    Servo.goTo((pos) , this);
		
            if (Cam.cvs) {
                fs.appendFileSync(Cam.cvs, this.type+','+(pos)+'\n');
            }
        }
    };
        
    // Recalibrate using old offset and calibrate or specifying new values
    Cam.servos[i].recalibrate = function(offset, calibrate){
        this.offset = (offset == undefined) ? this.offset : offset;
        Cam.settings.calibrate = calibrate || Cam.settings.calibrate;
        this._div = Cam.settings.calibrate;
    };
                    
}
/*
    Overwrite the goTo() on the shoot servo with special shoot movement
*/
Cam.servos.shoot.goTo = function(){

    if (new Date().getTime() - this.tstamp < Cam.servos.shoot.debouce) {
        return;
    }else this.tstamp = new Date().getTime();
    
    console.log('BANG! POW! PULL!'.green().bold());
    Servo.goTo(Cam.servos.shoot.max , Cam.servos.shoot);
    setTimeout(function(){
        Servo.goTo(Cam.servos.shoot.min , Cam.servos.shoot);
    },Cam.servos.shoot.debouce);
};
Cam.servos.shoot.goTo.tstamp = new Date().getTime();

/*
    Center the servos on USB connection
*/
Servo.on('ready', function(){
    for (var i in Cam.servos) 
        Cam.servos[i].goTo(Cam.servos[i].center, true);
});

/*
    Set up event listener for channels
*/
for (var i in Socket.channels) {
    (function(){                                    // Hide the scope
        var self = Socket.channels[i];
        self.type = i;
        self.socket = udp.createSocket('udp4');
        self.socket.bind(self.port, '0.0.0.0', function(){
            self.socket.on('message', function(buf, rinfo){ 
                for (var j in self.servos) self.servos[j].goTo( buf.readOrientation() );
            });
            console.log('UDP '+self.type+' listening on ', self.socket.address());
        });
    })();
}

// Listen on broadcast addr and echo IP addr
Socket.broadcast = udp.createSocket('udp4');
Socket.broadcast.bind(Socket.broadcast_port, function() {
    Socket.broadcast.on('message', function(buf, rinfo){
        console.log('UDP MSG: ', buf.toString());
        var rbuf = new Buffer(Socket.IP);
        Socket.broadcast.send(rbuf, 0, rbuf.length, rinfo.port, rinfo.address, function(){
            console.log('sent msg: ', rbuf.toString());     
        });
        
    });
    console.log('UDP broadcast listening on ', Socket.broadcast.address());
});



/*
    Grab data entered into stdin
*/
process.stdin.on('data', function(data){
    data = data.toString();
    if (data.indexOf('s') != -1) {
        shoot();
    }
});

/*
    Grab wlan0 ip address
*/
var ifaces=os.networkInterfaces();
for (var dev in ifaces) {
  ifaces[dev].forEach(function(details){
      if (dev == 'wlan0' && details.family=='IPv4') {
        Socket.IP = details.address;
        console.log(('IP Address is '+Socket.IP).blue());
      }
  });
}

 

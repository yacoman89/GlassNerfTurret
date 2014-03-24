

// WiFly server

var server = require('net');
var udp = require('dgram');
var Servo = require('./servos');

Buffer.prototype.readOrientation = function(){
    return ((this.readFloatLE(0) * 180 / 3.1416) | 0);
}

var disable = 0;
var Socket = {
    TIL: udp.createSocket('udp4'),
    TIL_port: 2000 + disable,
    PAN: udp.createSocket('udp4'),
    PAN_port: 2001+ disable,
    AZI: udp.createSocket('udp4'),
    AZI_port: 2002+ disable,
    shoot: udp.createSocket('udp4'),
    shoot_port: 2003+ disable,
    broadcast: udp.createSocket('udp4'),
    broadcast_port: 9999,
    IP:'0.0.0.0'
};

var Cam = {
    X:{id: 4, min:0, max:360},
    Y:{id:2, min:60, max:280},
    Z:{id:3, min:0, max:360},
    shoot:{id:5, min:240, max:360}
};

Servo.on('ready', function(){
   Servo.goTo(Cam.Y.min, Cam.Y); 
   Servo.goTo(Cam.X.min, Cam.X); 
   Servo.goTo(180, Cam.Z); 
});


Socket.TIL.bind(Socket.TIL_port, function() {
    Socket.TIL.on('message', function(buf, rinfo){
        
        Servo.goTo(  buf.readOrientation() + 70,
                     Cam.Y  );
        
    });
    console.log('UDP TIL listening on ', Socket.TIL.address());
});


Socket.PAN.bind(Socket.PAN_port, function() {
    Socket.PAN.on('message', function(buf, rinfo){
        
        Servo.goTo(  buf.readOrientation() + 90,
                     Cam.X  );
        
    });
    console.log('UDP PAN listening on ', Socket.PAN.address());
});

Socket.AZI.bind(Socket.AZI_port, function() {
    Socket.AZI.on('message', function(buf, rinfo){
        
        Servo.goTo(  buf.readOrientation() + 180,
                     Cam.Z  );
        
    });
    console.log('UDP AZI listening on ', Socket.AZI.address());
});


Socket.shoot.bind(Socket.shoot_port, function() {
    Socket.shoot.on('message', function(buf, rinfo){
        shoot();
    });
    console.log('UDP shoot listening on ', Socket.shoot.address());
});

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
//Socket.broadcast.setBroadcast(1);

var tstamp = new Date().getTime();
var debouce = 250;
var shoot = function(){
    if (new Date().getTime() - tstamp < debouce) {
        return;
    }else tstamp = new Date().getTime();
    
    console.log('BANG! POW! PULL!');

    Servo.goTo(Cam.shoot.max, Cam.shoot);
    setTimeout(function(){
        Servo.goTo(Cam.shoot.min, Cam.shoot); 
    },debouce);
};

process.stdin.on('data', function(data){
    data = data.toString();
    if (data.indexOf('s') != -1) {
        shoot();
    }
});

/*
    Grab wlan0 ip address
*/
Socket.IP = '0.0.0.0';
var os=require('os');
var ifaces=os.networkInterfaces();
for (var dev in ifaces) {
  ifaces[dev].forEach(function(details){
      if (dev == 'wlan0' && details.family=='IPv4') {
        Socket.IP = details.address;
        console.log('IP Address is '+Socket.IP);
      }
  });
}

 

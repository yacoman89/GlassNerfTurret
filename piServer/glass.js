

// WiFly server

var server = require('net');
var Servo = require('./servos');

Number.prototype.toDegrees = function(){
    return (this * 180 / 3.1416);
}
Servo.on('ready', function(){
   Servo.goTo(Cam.Y.min, Cam.Y); 
   Servo.goTo(Cam.X.min, Cam.X); 
   Servo.goTo(180, Cam.Z); 
});

var Cam = {
    X:{id: 4, min:0, max:360},
    Y:{id:2, min:60, max:280},
    Z:{id:3, min:0, max:360}
};

var portTIL = 2000;
server.createServer(function (socket) {
    
    console.log('TIL socket connected ');//(' +server.getConnections()+' total)');
    socket.on('data', function (data) {
        
        cmd = (180 - (data.readFloatBE(0).toDegrees()+70)) | 0;
        Servo.goTo(Cam.Y.max-cmd, Cam.Y);

    });
    socket.on('end', function (data) {
        console.log('the TIL socket closed');
    });
    
}).listen(portTIL);


var portPAN = 2001;
server.createServer(function (socket) {
    
    console.log('PAN socket connected ');//(' +server.getConnections()+' total)');
    socket.on('data', function (data) {
        
        cmd = (data.readFloatBE(0).toDegrees() + 90) | 0;
        Servo.goTo(cmd, Cam.X);

    });
    socket.on('end', function (data) {
        console.log('the PAN socket closed');
    });
}).listen(portPAN);

var portAZI = 2002;
server.createServer(function (socket) {
    
    console.log('AZI socket connected ');//(' +server.getConnections()+' total)');
    socket.on('data', function (data) {
        
        cmd = (data.readFloatBE(0).toDegrees()+180) | 0;
        Servo.goTo(cmd, Cam.Z);

    });
    socket.on('end', function (data) {
        console.log('the PAN socket closed');
    });
}).listen(portAZI);

var s = require('dgram').createSocket('udp4');
s.bind(5917, function() {
    s.on('message', function(buf, rinfo){
        console.log('UDP MSG: ', buf.toString());
        var rbuf = new Buffer('What\'s up');
        s.send(rbuf, 0, rbuf.length, rinfo.port, rinfo.address, function(){
            console.log('sent msg: ', rbuf.toString());     
        });
        
    });
    console.log('UDP listening on ', s.address());
});

console.log('listening on port TIL '+portTIL);
console.log('listening on port PAN '+portPAN);
console.log('listening on port AZI '+portAZI);





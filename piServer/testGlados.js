/*
    Run this separately to test the glass.js server
    
    run glados.js server without configuration
    
    Do not  change this file.  see config.js
*/

require('./config');
require('./lib/colorLog');

var server = require('dgram').createSocket('udp4');

var inc = function(){ this.num++;};
var dec = function(){ this.num--;};

/*
    writes a number in degrees
    in 32 bit LE float represenation in radians
    to replicate glass data
*/

Buffer.prototype.setGladosFormat = function(num){
    this.writeFloatLE((num *3.1416 / 180),0);
};

for (var i in Socket.channels) {
    Socket.channels[i].num = Socket.channels[i].servo.min;
    Socket.channels[i].func = inc;
}

setInterval(function(){
    for (var i in Socket.channels) {
        (function () {
            if (i == 'shoot') {
                if (Math.random() * 100 > .5)return;
                else console.log('SHOOTING!'.green().bold());
            }
            var target = Socket.channels[i];
            if (target.num >= target.servo.max) {
                target.func = dec;
            }else if (target.num <= target.servo.min) {
                target.func = inc;
            }
            
            target.func();
            console.log(target.num);
            var buf = new Buffer(4);
            buf.setGladosFormat(target.num);
            server.send(buf,
                        0,
                        buf.length,
                        Socket.channels[i].port,
                        Cam.settings.testingIP,
                        function(){ /**/ });
        })();
    }
},Cam.settings.testingDelay);





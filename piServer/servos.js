/*
    Library responible for controlling servos
    
    Do not change anything here.
    
    *Reading from servos is incomplete
    
    /usr/local/Tekkotsu/tools/dynamixel_util is good for trouble shooting / setting up
*/

module.exports =

(function(){
    
var C = require('./lib/colorLog');    
var _serialport = require("serialport");
var _serialConstr = _serialport.SerialPort;
var serial;
var Terminal = require('child_process');
var BAUD = 1000000;

var _POTENTIAL_USB_DEVICES = [
				'usb-FTDI_FT232R_USB_UART_A901QJ43-if00-port0',
				'usb-Prolific_Technology_Inc._USB-Serial_Controller-if00-port0',
				'usb-FTDI_FT232R_USB_UART_A700h3F6-if00-port0',
				'usb-FTDI_FT232R_USB_UART_A90VNHH5-if00-port0',
				'usb-FTDI_FT232R_USB_UART_A96DLRJN-if00-port0'
				]; 

_serialport.list(function (err, ports) {
    var addr;
    //connect to port with correct ID. see `$ lspnp`
    ports.forEach(function(port) {
        C.log(port, {color:'yellow', logLevel:1});
        if (
		_POTENTIAL_USB_DEVICES.indexOf( port.pnpId ) != -1	
	    )
                addr = port.comName;
    });
    if (!addr) {
        C.log('Servos Fail', {color:'red', font:'bold', logLevel:1});
        return;
    }

    var __connect = function(){
        serial = new _serialConstr(addr, {
            baudrate: BAUD,
            disconnectedCallback: function(d){ console.log('DDDDDDDDCCCCCCCCCCC\'d', d);}
        });
	var buffers = [];
	length = 0;
	var bLength = function(){ var l = 0; for(var i in buffers){ l+=buffers[i].length; } return l; };
        serial.on('data', function(buf){
            //console.log('Servo driver feedback: ', buf);
	    if (_Servo._readCallBack){
		if (buf[0] == 0xff && buf[1] == 0xff) {
		    length = buf[3];
		}
		if (length <= buf.length) {
		    _Servo._readCallBack(buf);
		    _Servo._readCallBack = null;

		}else if(length <= bLength() + buf.length){
		    buffers.push(buf);
		    _Servo._readCallBack(Buffer.concat(buffers));
		    _Servo._readCallBack = null;
		    buffers = [];

		}else{
		    buffers.push(buf);

		}

	    }

        });
        serial.on('open', function(){
            C.log('Servo connection ready'.green().bold());
            _Servo.ready = true;
            _Servo.serial = serial;
	    for (var i in _Servo.readyCallbacks)
		_Servo.readyCallbacks[i]();
	    _Servo.set(_Servo.stats);
	    console.log('SPEED:'+_Servo.stats.movingSpeed);
        });
        serial.on('error', function(){
            C.err('SERVO ERRRRRORRR');
        });
        serial.on('close', function(){
            C.log('SERIAL PORT IS CLOSED');
        });
    }
    __connect();
});

var _Servo = {
    ready:false,
    _reading:false,
    serial:serial,
    _utils:'/usr/local/Tekkotsu/tools/dynamixel_util/dynamixel_util',
    _scan:' Path=/dev/ttyUSB1 Baud=9600 scan 1-10',
    _setBaud:' Baud=1000000 baud rate 9600',
    
    /* forms command packet for servo and writes it.
     * need params (number array) .
     * id (number) defaults to global 254.
     * e.g. Servo.write({id:234, params:[0x23, 0x45]});
     */
    _readCallBack:null,
    write: function(args, callback){
        if (!_Servo.ready) {
            C.log('Servo connection not ready.'); return;
        }
        var id = args.id || 254;

        args.params = args.params || [];
        var length = args.params.length + 2;
        var checksum = id + length + (args._instruction || 0x3);
        for (var i in args.params) 
            checksum += args.params[i];
        checksum = ~checksum;
        if (checksum > 0x100) {
            checksum = checksum - 0x100;
        }
        var cmd = [0xff, 0xff, id, length, args._instruction || 0x3];
        cmd = cmd.concat(args.params);
        cmd.push(checksum);
        _Servo.serial.write(new Buffer(cmd), function(err, results){
	    _Servo._readCallBack = callback;
            if (args.explicit) console.log('Wrote buf: ', new Buffer(cmd));
            if (err){
		console.error('Error writing to Servo serial : ', err, _Servo.serial);
	    }

        });
    },
    readCmds: [],
    read: function(str, args, cb){
	var scale = 1;
	var arr;
	switch(str){
	    case 'position':
		arr = [0x24,0x25]; scale = (360/1023);
	    break;
	    case 'maxTorque':
		arr = [0x0e,0x0f];
	    break;
	    case 'goalPosition':
		arr = [0x1e,0x1f];
	    break;
	    case 'speed':
		arr = [0x26,0x27];
	    break;
	    case 'load':
		arr = [0x28,0x29];
	    break;
	    case 'temperature':
		arr = [0x0,0x2b];
	    break;
	    case 'moving':
		arr = [0x00,0x2e];
	    break;
	    default:
		console.log(('Error: '+str+' is not a readable attribute.').red());
		return;

	}
	if (typeof args == 'function') {
	    cb = args;
	    args = {};
	}
	args = args || {};
	args.params = [0x24,0x25],
	args._instruction = 0x2,
	args.cb = cb,
	args.scale = scale;
	this.readCmds.push(args);
	if (this.readCmds.length == 1) {
	    this.readNext();
	}
    },
    

    readNext: function(){

	if (!this.readCmds.length) 
	    return;

	var args = this.readCmds[ 0];
	this.readBusy = true;
	this.write(args, function(results){
	    var fin = {};
	    fin.id = results[2];
	    fin.length = results[3];
	    fin.error = results[4] || !(results[3]);
	    fin.result = ( (results[5] + (results[6] << 8) ) * args.scale) | 0;
	    if (typeof args.cb == 'function') args.cb(fin);
	    _Servo.readCmds.shift();
	    if (_Servo.readCmds.length){
		_Servo.readNext();
	    }
	});
    },

    /*
        instuctions:
            read: 0x2
            write: 0x3
            see http://support.robotis.com/en/techsupport_eng.htm#product/dynamixel/ax_series/dxl_ax_actuator.htm
        params:
            see http://support.robotis.com/en/techsupport_eng.htm#product/dynamixel/ax_series/dxl_ax_actuator.htm
    */
    position:0,
    torque:0xff,
    /*
        Goes to degree position
        pos is number 0-360
    */
    goTo:function(pos, params){
	params = params || {};
        if (pos < 0 
	    || ( params.min && params.max && (pos < params.min || pos> params.max) )
	    ) {
            C.err('servo '+params.id+' position out of range: '+pos);
            return;
        }
        this.position = ((pos/360) * 1023) | 0;
        C.log(('id '+params.id+' Going to position '+pos+'/360').purple());
        var buf = new Buffer([this.position]);
        var cb = function(){ /*rvo.blinkLED(); */};
        this.write({params:[0x1e,  this.position & 0xff,
			    (this.position & 0xff00) >> 8 ],
		   id:params.id, explicit:params.explicit});	
    },
    
    blinkLED: function(blinkInter, params){
	params = params || {};
        //C.log('Blinking'.green(), params.id || 254);
        _Servo.write({
            params:[0x19, 0x1], id: params.id || 254});
        setTimeout(function(){
            _Servo.write({
                params:[0x19, 0] //turn off
            });
        }, blinkInter/2);
    
    },

    stats:{
	maxTorque: 1023,	//0-1023
	CWLimit: 0, 		//0-1023, both 0 limits means no limit
	CCWLimit: 0, 		//0-1023, both 0 limits means no limit
	movingSpeed: 1023,	// 0-1023 if limit, 0-2047 if no limit
	id:254			// target ID to set stats on. (254 is broadcast)
    },
    
    /*asynchronously sets servo attributes for all applicable commands
     *see stats.
     */
    set: function(params){
	for (var p in params) 
	    this.stats[p] = params[p];

	if (params.CWLimit) {	// range from 0 to 1023.  0 means no limit.
	    this.write({params:[0x06,  params.CWLimit & 0xff,
			    (params.CWLimit & 0xff00) >> 8], id:params.id });	
	}
	if (params.CCWLimit) {
	    this.write({params:[0x08,  params.CCWLimit & 0xff,
			    (params.CCWLimit & 0xff00) >> 8], id:params.id });	
	}
        if (params.maxTorque){
	    this.write({params:[0x0e,  params.maxTorque & 0xff,
			    (params.maxTorque & 0xff00) >> 8], id:params.id });	
        }
        if (params.movingSpeed){
	    this.write({params:[0x20,  params.movingSpeed & 0xff,
			    (params.movingSpeed & 0xff00) >> 8], id:params.id });	
        }

        
    },
    

    readyCallbacks:[],
    on: function(str,cb){
	if (str == 'ready') {
	    this.readyCallbacks.push(cb);
	}
    }
    
    
};
var _id = 2;
process.stdin.resume();
process.stdin.on('data', function(d){
    if (d.toString().indexOf('reset') != -1) {
	_Servo.write({params:[], _instruction:0x6}, function(err, results){
	    console.log('RESET SERVO '.blue(), err, results);
	}); return;
    }
    if (d.toString().indexOf('r') != -1) {
	_Servo.read('position',{id:_id}, function(data){
	    console.log('R1 ', data);
	});

	return;
    }else if (d.toString().indexOf('id') != -1) {
	_id = parseInt(d.toString().split(' ')[1]);
	console.log('parsed ID ', _id); return;
    }

    d = parseInt(d);
    if (isNaN(d)) return;
    _Servo.goTo(d, {id:_id, explicit:true});
});

var blinkInter = 1000;
var blink =  function(){   _Servo.blinkLED(blinkInter, {id:254});   };

//setInterval(function(){ _Servo.readCmds = [] },250);
setInterval( blink, blinkInter);


return _Servo;

})();


 

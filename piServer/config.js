/*
    Declarations and settings for glados servos
    
    Change the values here for configuration.
*/

/*
    Servo attributes.
    
    'id' - the ID of the dynamixel
    
    Set 'min'/'max' to limits for servos.  total range is 0-360
    
    set 'center' to be starting point and focus of calibration
    
    set 'invert' to true to switch direction of servo

    'offset' will be calculated dynamically during calibration.
    
    Set settings.calibrate to amount of points
    to sample during calibration
    
    set shoot.debounce to time in MS for minimum time that must occur between
    shots
    
*/
Cam = {
	servos:{
    		X:{
        		id: 5, min:220, max:360,center:290,
        		offset:0, invert:false
    		},
    		Y1:{
        		id:2, min:130, max:240, center:160,
        		offset:0, invert: true
    		},
    		Y2:{ 
			id:4, min:0, max:195, center:150,
			offset:0, invert: true
    		},
    		Z:{
        		id:3, min:0, max:160, center:70,
        		offset:0, invert: false
    		},
    		shoot:{
        		id:6, min:240, max:360, center:240,
        		offset:0, debounce:250
    		},
	},
    	settings:{
        	calibrate:10,
        	testingDelay:100,               // interval time in ms for testing
        	testingIP:'0.0.0.0'             // target server for testing
    	}
};

/*
    Config for udp sockets
    
    port - port that udp socket listens on
    servo - the servo that the socket will pipe it's stream to
    
    IP will be changed to wlan0 ip dynamically on app start.
*/

Socket = {
    channels: {
        TIL:{
            port: 2000,
            servos:[Cam.servos.Y1, Cam.servos.Y2]
        },
        PAN:{
            port: 2001,
            servos:[Cam.servos.X]
        },
        AZI:{
            port: 2002,
            servos:[Cam.servos.Z]
        },
        shoot: {
            port: 2003,
            servos:[Cam.servos.shoot]
        }
    },
    broadcast_port: 9999,
    IP:'0.0.0.0'
};

module.exports = null;


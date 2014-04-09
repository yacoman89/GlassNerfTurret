/*
    Declarations and settings for glados servos
    
    Change the values here for configuration.
*/

/*
    Servo attributes.
    
    id - the ID of the dynamixel
    
    Set min/max to limits for servos.  total range is 0-360
    
    set center to be starting point and focus of calibration
    
    Offset will be calculated dynamically during calibration.
    
    Set settings.calibrate to amount of points
    to sample during calibration
    
    set shoot.debounce to time in MS for minimum time that must occur between
    shots
    
*/
Cam = {
    X:{
        id: 4, min:90, max:270,center:180,
        offset:0
    },
    Y:{
        id:2, min:60, max:280, center:150,
        offset:0
    },
    Z:{
        id:3, min:0, max:160, center:70,
        offset:0
    },
    shoot:{
        id:5, min:240, max:360, center:240,
        offset:0, debounce:250
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
            servo:Cam.Y
        },
        PAN:{
            port: 2001,
            servo:Cam.X
        },
        AZI:{
            port: 2002,
            servo:Cam.Z
        },
        shoot: {
            port: 2003,
            servo:Cam.shoot
        }
    },
    broadcast_port: 9999,
    IP:'0.0.0.0'
};

module.exports = null;


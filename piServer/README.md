## The servo server for GLADOS

Run with `node glados.js`

### Arguments

`-o <filename>` write received data to csv file

`--no-calibration` don't calibrate an offset for the received data

e.g. `node glados.js --no-calibration -o logs.cvs`

### Testing

`node testGlados.js` Runs a UDP server that cycles through the control channels
to test without Google Glass.  You need to run `glados.js` on the localhost
 as well or on another machine and change the `testingIP` in `config.js`

## Config

Make changes to config.js to fit the environment.




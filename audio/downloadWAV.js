
module.exports = 

(function(){

var http = require("http");
var spawn = require('child_process').spawn;
var fs = require('fs');


var _download = function(url, filename, callback) {
  var started = false;
  console.log('starting download'); 
  var file = fs.createWriteStream(filename);
  http.get(url, function(res) {
    var data = "";
    var prog = '';
    res.pipe(file);
    /*res.on('data', function (chunk) {
	prog = prog+'X';
	process.stdout.write(prog+'\r');
    	if ( started === false){
    		fs.writeFile(filename , chunk);
    		started = true;
    	}
    	else{
    		fs.appendFile(filename, chunk);
    	}    
    });*/

    res.on("end", function() {
      callback(data);
	 console.log('DONE DOWNLOADING!');
    });
  }).on("error", function() {
    callback(null);
  });
};

var _getWAV = function(text, cb, fn){
	text = text.replace(/\s/g, "+");
	cb = cb || function(){};
	fn = fn || 'NaF.wav';		//default value
/*
	curl -A " Mozilla/5.0 (X11; Linux i686) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/34.0.1847.116 Safari/537.36"-d "voice=crystal&txt=Overwriting+this+disclaimer+and+using+this+demo+confirms+agreement+with+the+policies+and+restrictions+described+below.&downloadButton=DOWNLOAD" -e " http://www2.research.att.com/~ttsweb/tts/demo.php" http://204.178.9.51/tts/cgi-bin/nph-nvttsdemo

*/
	console.log('sending curl post request');
	//child_process.spawn(command, [args], [options])
	ls = spawn("curl", 
		["-A",
		"Mozilla/5.0 (X11; Linux i686) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/34.0.1847.116 Safari/537.36",
		 "-d",
	 	"voice=crystal&txt=" +		
	 	text +
	 	"&downloadButton=DOWNLOAD",
	 	"-e",
	 	"http://www2.research.att.com/~ttsweb/tts/demo.php",
	 	"http://204.178.9.51/tts/cgi-bin/nph-nvttsdemo"]);

	ls.stdout.on('data', function (data) {
		data = data.toString();
  		// console.log(data);
		var dat1 = data.search("/tts/speech/");
  		// console.log(dat1);
		var dat2 = data.search(".wav\">") + 4;
  		// console.log(dat2);
		var res = data.slice(dat1,dat2);
		url = "http://204.178.9.51"+res;
  		// console.log(res);
    		console.log('curl data came back and we got this url: '+url);
    		_download(url,fn,  function (data){
			cb(fn);
		} );
	});
}

if (process.argv.indexOf('test') != -1)
	_getWAV('this is a test.  a really long test.  Do you know your ABC\'s?  A B C D E F G X Y Z.  Ha Ha.  I skipped a few.', function(){console.log('done')}, 'wow.wav');

return { download: _getWAV };

}) ();

var http = require("http");
var spawn = require('child_process').spawn;
var cheerio = require("cheerio");
var fs = require('fs');
var url = "";

function download(url, callback) {
	var started = false;
  http.get(url, function(res) {
    var data = "";
    res.on('data', function (chunk) {
    	if ( started === false){
    		fs.writeFile("NaF.wav" , chunk);
    		started = true;
    	}
    	else{
    		fs.appendFile("NaF.wav", chunk);
    	}
      
    });
    res.on("end", function() {
      callback(data);
    });
  }).on("error", function() {
    callback(null);
  });
}

/*var options = {
  hostname: "204.178.9.51",
  port: 80,
  path: '/tts/cgi-bin/nph-nvttsdemo',
  method: 'POST',
  headers: { 'txt': 'Josh',
  			'downloadButton' : 'DOWNLOAD',
			'voice' : 'crystal',
			//'fbtext': 'Josh',
			//'fbvoice': "crystal",
			//'speakButton':'SPEAK'
			}
};

//console.log("\n\n\nHello!");

var req = http.request(options, function(res) {
  console.log("hello");
  console.log('STATUS: ' + res.statusCode);
  console.log('HEADERS: ' + JSON.stringify(res.headers));
  res.setEncoding('utf8');
  res.on('data', function (chunk) {
    console.log('BODY: ' + chunk);
  });
});

req.on('error', function(e) {
  console.log('problem with request: ' + e.message);
});
req.end();*/


/*curl -A " Mozilla/5.0 (X11; Linux i686) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/34.0.1847.116 Safari/537.36"-d "voice=crystal&txt=Overwriting+this+disclaimer+and+using+this+demo+confirms+agreement+with+the+policies+and+restrictions+described+below.&downloadButton=DOWNLOAD" -e " http://www2.research.att.com/~ttsweb/tts/demo.php" http://204.178.9.51/tts/cgi-bin/nph-nvttsdemo
 */

 myString = "Please+note+that+we+have+added+a+consequence+for+failure.+Any+contact+with+the+chamber+floor+will+result+in+an+'unsatisfactory'+mark+on+your+official+testing+record+followed+by+death.+Good+luck";
 console.log(myString);

//child_process.spawn(command, [args], [options])
ls = spawn("curl", 
	["-A",
	"Mozilla/5.0 (X11; Linux i686) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/34.0.1847.116 Safari/537.36",
	 "-d",
	 "voice=crystal&txt=" +		
	 myString +
	 "&downloadButton=DOWNLOAD",
	 "-e",
	 "http://www2.research.att.com/~ttsweb/tts/demo.php",
	 "http://204.178.9.51/tts/cgi-bin/nph-nvttsdemo"]);

ls.stdout.on('data', function (data) {
	data = data.toString();
  console.log(data);
	var dat1 = data.search("/tts/speech/");
  console.log(dat1);
	var dat2 = data.search(".wav\">") + 4;
  console.log(dat2);
	var res = data.slice(dat1,dat2);
	url = "http://204.178.9.51"+res;
  console.log(res);
    console.log(url);
    download(url, function (data){} );
	}
);


/*ls.stderr.on('data', function (data) {
  console.log('stderr: ' + data);
});

ls.on('close', function (code) {
  console.log('child process exited with code ' + code);
}); */

// Utility function that downloads a URL and invokes
// callback with the data.

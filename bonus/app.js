var http = require('http');
var ss = require('socketstream');
var port = process.getuid() + 50000;
var request = require('request');

// Define a single-page client
ss.client.define('main', {
	view: 'app.html',
	css: ['base.css'],
	code: [
		'libs/jquery/jquery.js',
		'libs/todomvc-common/base.js',
		'app'
	],
	tmpl: '*'
});

// Serve this client on the root URL
ss.http.route('/', function (req, res) {
	res.serveClient('main');
});

// Use server-side compiled Hogan (Mustache) templates. Others engines available
ss.client.templateEngine.use(require('ss-hogan'));

// Minimize and pack assets if you type: SS_ENV=production node app.js
if (ss.env === 'production') {
	ss.client.packAssets();
}

// Start web server

var externalIP = 'http://metadata/computeMetadata/v1beta1/instance/network-interfaces/0/access-configs/0/external-ip'
request(externalIP, function(err, response, body) {
    console.log('listening on:', 'http://'+body+':'+port)
    var server = http.Server(ss.http.middleware);
    server.listen(port);
    
    // Start SocketStream
    ss.start(server);
});
var http = require('http');
var ss = require('socketstream');
var port = process.getuid() + 5000;

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
console.log('listening on port', port)
var server = http.Server(ss.http.middleware);
server.listen(port);

// Start SocketStream
ss.start(server);


var express = require("express");
var exval = require("express-validator");
var i18n = require("i18n");
var ejs = require("ejs");
var crypto = require("crypto");
var triggy = require("./lib/triggy");

var prefix = 'http://tr.gy/';

process.on('uncaughtException', function (err) {
	/* nodejs version of "on error resume next" */
	console.log('Caught exception: ' + err);
});

/* add some locales for i18n fun */
i18n.configure({
    locales:['en', 'de'],
    register: global
});

/* create a server with express */
var app = express.createServer();

app.configure(function() {
	/* we use embedded js as kind of template engine */
	app.set('view engine', 'ejs');
	/* since we get posted we want a bodyParser() */
	app.use(express.bodyParser());
	/* express-validator makes your input handling safety way easier */
	app.use(exval);
	/* can we haz i18n? */
	app.use(i18n.init);
	/* just serve the assets till we find out how to handle that stuff with nginx */
	app.use(express.static(__dirname+'/assets'));
	/* we use router to server differen paths */
	app.use(app.router);
});

/* serve the index document when nothing special is requested */
app.get('/', function(req, res){
	res.render('index');
});

/* serve the trigger warning if an existing short url is called */
app.get(/^\/([\_A-Za-z0-9]{5})$/, function(req, res){
	triggy.get(req.params[0], function(result){
		if (result === null) {
			res.redirect('/', 301);
		} else {
			res.render('trigger', result);
		}
	});
});

/* json interface for short link creation */
app.post('/api/create', function(req, res){
	
	var errors = [];
	req.onValidationError(function(msg) {
		errors.push(msg);
		return this;
	});

	req.check('url', __("This URL is invalid")).isUrl().regex(/^(http(s)?:\/\/)/);	
	req.sanitize('action').xss();
	req.sanitize('warning').xss();

	var url = encodeURI(decodeURI(req.body.url));
	var action = req.body.action;
	var warning = req.body.warning;
	
	if (errors.length > 0) {
	   res.json({
			error: errors.shift()
		});	
	} else {		
		triggy.create(url, action, warning, function(data){
			data.shorturl = prefix+data.link;
			data.adress = __('Adress');
			data.message = __('Your triggified link has been created:');
		   res.json(data);				
		});		
	}

	return;

});

/* html interface for short link creation, for those without javascript */
app.post('/create', function(req, res){

	var errors = [];
	req.onValidationError(function(msg) {
		errors.push(msg);
		return this;
	});
	
	req.check('url', __("This URL is invalid")).notEmpty().isUrl().regex(/^(http(s)?:\/\/)/);
	req.sanitize('action').xss();
	req.sanitize('warning').xss();

	
	var url = encodeURI(decodeURI(req.body.url));
	var action = req.body.action;
	var warning = req.body.warning;
	
	if (errors.length > 0) {
		res.render('create-error', errors);
	} else {		
		triggy.create(url, action, warning, function(data){
			data.shorturl = prefix+data.link;
			res.render('create', data);
		});		
	}

	return;

});

/* just redirect anything else to the default page */
app.get('*', function(req, res){
	res.redirect('/', 301);
});

/* run on localhost port 9998 */
app.listen(9998,"127.0.0.1");

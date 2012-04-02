
var express = require("express");
var exval = require("express-validator");
var i18n = require("i18n");
var ejs = require("ejs");
var crypto = require("crypto");
var triggy = require("./lib/triggy");

var prefix = 'http://tr.gy/';

process.on('uncaughtException', function (err) {
  console.log('Caught exception: ' + err);
});

i18n.configure({
    locales:['en', 'de'],
    register: global
});

var app = express.createServer();

app.configure(function(){
	app.set('view engine', 'ejs');
	app.use(express.bodyParser());
	app.use(exval);
	app.use(i18n.init);
	app.use(express.static(__dirname+'/assets'));
	app.use(app.router);
});

app.get('/', function(req, res){
	res.render('index');
});


app.get(/^\/([\_A-Za-z0-9]{5})$/, function(req, res){
	triggy.get(req.params[0], function(result){
		if (result === null) {
			res.redirect('/', 301);
		} else {
			res.render('trigger', {link:result});			
		}
	});
});

app.post('/api/create', function(req, res){
	
	var errors = [];
	req.onValidationError(function(msg) {
		errors.push(msg);
		return this;
	});
	
	req.assert('url', __("This URL is invalid")).isUrl();	
	var url = encodeURI(decodeURI(req.body.url));
	
	if (errors.length > 0) {
	   res.json({
			error: errors.shift()
		});	
	} else {		
		triggy.create(url, function(data){
			data.shorturl = prefix+data.link;
			data.message = __('Your triggified link has been created:');
		   res.json(data);				
		});		
	}

	return;

});

app.post('/create', function(req, res){

	var errors = [];
	req.onValidationError(function(msg) {
		errors.push(msg);
		return this;
	});
	
	req.assert('url', __("This URL is invalid")).notEmpty().isUrl();
	
	var url = encodeURI(decodeURI(req.body.url));
	
	if (errors.length > 0) {
		res.render('create-error', errors);
	} else {		
		triggy.create(url, function(data){
			data.shorturl = prefix+data.link;
			res.render('create', data);
		});		
	}

	return;

});

app.get('*', function(req, res){
	res.redirect('/', 301);
});

app.listen(9998,"127.0.0.1");

var rdbc = require("redis").createClient(6379, '127.0.0.1');
var crypto = require('crypto');

/* hello. */
var triggy = function() {
	var self = this;
};
triggy.prototype = {
	/* make sha1 hashes. cryptogeeks love sha1 hashes. */
	sha1: function(str) {
		return crypto.createHash('sha1').update(str).digest('hex');
	},
	/* find an unique base61-string. */
	newlink: function(newlink_callback) {
		var newlink = this.linkstr(); 
		rdbc.sismember('triggy:set:links', newlink, function(err,result){
			if (result === 0) {
				newlink_callback(newlink);
			} else {
				this.newlink(newlink_callback);
			}
		});
	},
	/* generate a random base61-string. */
	linkstr: function(length) {
		if (!length) length = 5;
		var out = [];
		var chars = '0123456789ABCDEFGHJKLMNPQRSTUVWXYZ_abcdefghijkmnopqrstuvwxyz'.split('');
		for (var i = 0; i < length; i++) {
			out.push(chars[Math.floor(Math.random()*chars.length)]);
		}
		return out.join('');
	},
	/* create a new short link. */
	create: function(url, callback) {
		var hash = this.sha1(url);
		var tr = this;
		/* is there already a short link for this url? */
		rdbc.sismember('triggy:set:hashes', hash, function(err, result) {
			if (result === 0) {
				/* no! create one... */
				tr.newlink(function(link){
					rdbc.set('triggy:resolv:link:'+link, url);
					rdbc.set('triggy:resolv:hash:'+hash, link);
					rdbc.sadd('triggy:set:links', link);
					rdbc.sadd('triggy:set:hashes', hash);
					callback({
						url: url,
						hash: hash,
						link: link
					});
				});		
			} else {
				/* yes! return it... */
				rdbc.get('triggy:resolv:hash:'+hash, function(err, link){
					callback({
						url: url,
						hash: hash,
						link: link
					});			
				});
			}
		});
	},
	/* get the URL for a shortlink uri */
	get: function(link, callback) {
		rdbc.sismember('triggy:set:links', link, function(err, result) {
			if (result == 0) {
				callback(null);
			} else {
				rdbc.get('triggy:resolv:link:'+link, function(err, url){
					callback(url);			
				});
			}
		});
	},
	/* check if an URL is already shortlinked */
	check: function(hash, callback) {
		rdbc.sismember('triggy:set:hashes', hash, function(err, result) {
			if (result == 0) {
				callback(null);
			} else {
				rdbc.get('triggy:resolv:hash:'+hash, function(err, link){
					callback(link);
				});
			}
		});
	}
};

/* export a new instance of triggy */
module.exports = new triggy();

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
	create: function(url, action, warning, callback) {
		var hash = this.sha1(url);
		var tr = this;
		var created_at = Math.round(+new Date()/1000);
		/* create a shortlink ... */
		tr.newlink(function(link){
			rdbc.hset('triggy:resolv:link:'+link, "url", url);
			rdbc.hset('triggy:resolv:link:'+link, "action", action);
			rdbc.hset('triggy:resolv:link:'+link, "warning", warning);
			rdbc.hset('triggy:resolv:link:'+link, "created_at", created_at);
			rdbc.sadd('triggy:resolv:hash:'+hash, link);
			rdbc.sadd('triggy:set:links', link);
			rdbc.sadd('triggy:set:hashes', hash);

			callback({
				url: url,
				action: action,
				warning: warning,
				created_at: created_at,
				hash: hash,
				link: link
			});
		});
	},
	/* get the URL for a shortlink uri */
	get: function(link, callback) {
		rdbc.sismember('triggy:set:links', link, function(err, result) {
			if (result == 0) {
				callback(null);
			} else {
				rdbc.hgetall('triggy:resolv:link:'+link, function(err, obj){
					callback(obj);
				});
			}
		});
	}
};

/* export a new instance of triggy */
module.exports = new triggy();

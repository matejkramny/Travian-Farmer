// This code is distributed under the terms and conditions of the MIT license.

var http = require('http');

var setHeaders = function (acc, cb) {
	var headers = {
		"User-Agent": "",
		"Accept": "application/x-ms-application, image/jpeg, application/xaml+xml, image/gif, image/pjpeg, application/x-ms-xbap, application/x-shockwave-flash, */*",
		"Accept-Language": "en-US",
		"Accept-Encoding": ""
	}
	
	if (typeof acc.cookies === "string") {
		headers.Cookie = acc.cookies
	}
	
	headers["User-Agent"] = acc.userAgent
	cb (headers);
}

// timeout = NUMBER
// world
// server
exports.get = function (account, url, cb, processNow) {
	if (!processNow) {
		var callGet = function() {
			exports.get (account, url, cb, true);
		};
		setTimeout (callGet, account.timeout);
	} else {
		//# if url !begins with / then add
		setHeaders (account, function (headers) {
			var options = {
				host: account.world + ".travian." + account.server,
				port: 80,
				path: url,
				method: "GET",
				headers: headers
			}
			
			http.get (options, function (res) {
				page = "",
				res.setEncoding ('utf8'),
				res.on ('data', function (chunk) {
					page += chunk
				}),
				res.on ('end', function() {
					cb (page);
				})
			});
		});
	}
}

exports.post = function (account, url, data, cb, processNow) {
	var dat = data;
	if (typeof dat !== "string") {
		data = ""
		for (var i = 0; i < dat.length; i++) {
			var prop = dat[i];
			data += prop + "=" + dat[prop] + "&";
		}
	}
	
	if (!processNow) {
		callPost = function() {
			exports.post (account, url, data, cb, true);
		};
		setTimeout(callPost, account.timeout);
	} else {
		setHeaders (account, function(headers) {
			var options = {
				host: account.world + ".travian." + account.server,
				port: 80,
				path: url,
				method: "POST",
				headers: headers
			}
			
			options.headers['Content-Type'] = 'application/x-www-form-urlencoded';
			options.headers['Content-Length'] = data.length;
			
			req = http.get (options, function(res) {
				if (typeof res.headers["set-cookie"] === "object") {
					account.cookies = ""
					for (var i = 0; i < res.headers["set-cookie"].length; i++) {
						account.cookies += res.headers["set-cookie"][i] + "; ";
					}
				}
				page = "";
				res.setEncoding ('utf8');
				res.on ('data', function(chunk) {
					page += chunk;
				})
				res.on ('end', function() {
					cb(page);
				})
			});
			
			req.write (data);
			req.end();
		});
	}
}
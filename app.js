// This code is distributed under the terms and conditions of the MIT license.

var sequence = require('sequence');
var $ = require("jquery");
var http = require('./http');

var account = {
	server: "",
	world: "",
	username: "",
	password: "", // obvious <^
	userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_8_3) AppleWebKit/537.31 (KHTML, like Gecko) Chrome/26.0.1410.43 Safari/537.31", // your browser ID string
	timeout: 500 // http request timeout
}

var timeoutObject;

var doFarmList = function() {
	console.log(" I am doing farm listing.. ");
	
	var seq = sequence.create();
	seq.then(function(next) {
		http.get(account, "/dorf1.php", function (data) {
			var $data = $(data);
	
			if ($data.find("body").attr("class").indexOf("login") == -1) {
				// Logged in already
				console.log("Already logged in");
				next(data);
				return;
			}
	
			var form = $data.find('form');
			var postData = "";
			form.find("input").each(function() {
				$this = $(this);
		
				var name = $this.attr("name")
				var value = $this.attr("value")
		
				if (name == "name") {
					value = account.username;
				} else if (name == "password") {
					value = account.password;
				}
		
				postData += name + "=" + value + "&";
			});
	
			http.post(account, "/dorf1.php", postData, function(loggedInData) {
				if ($(loggedInData).find("body").attr("class").indexOf("login") == -1) {
					// Logged in
					console.log ("Logged in");
					next(loggedInData);
				} else {
					console.log ("Not logged in");
				}
			});
		}, true);
	}).then(function(next, data) {
		var $movements = $(data).find("#movements")
		$movements.find("tr").each(function() {
			$this = $(this);
			if ($this.has("th").length > 0)
				return;
		
			$mov = $this.find('div.mov');
			$span = $mov.find("span");
		
			console.log("%s - %s", $span.attr("class"), $span.text().replace(/[\t\r]+/g, ""));
		});
		var found = false;
		
		var $villages = $(data).find("#villageListLinks").find("li.entry");
		var villagesCount = $villages.length;
		$villages.each(function(i) {
			if (found) return;
			
			var href = $(this).find("a").attr("href");
			if (typeof href === "string") {
				found = true;
				// activate First village
				http.get(account, href, function(village) {
					console.log("activated first village");
					next(village);
				})
				return;
			}
			
			if (--villagesCount <= 0) {
				// last village and not found
				console.log("No village found");
				next(null);
			}
		})
	}).then(function(next, data) {
		if (typeof data !== "string") {
			next();
			return;
		}
		
		http.get(account, '/build.php?tt=99&id=39', function(data) {
			$raidList = $(data).find("#raidList");
			if ($raidList.length == 0) {
				next();
				return;
			}
		
			var postData = "";
			$form = $raidList.find("form");
			$form.find("input[type='hidden']").each(function() {
				$this = $(this);
				var name = $this.attr("name");
				var value = $this.attr("value");
				postData += name + "=" + value + "&";
			});
		
			var count = 0;
			$form.find("table.list tbody").find("tr").each(function() {
				$this = $(this);
				$this.find("input[type='checkbox']").each(function() {
					$checkbox = $(this);
					postData += $checkbox.attr("name") + "=on&";
					count++;
				});
			});
		
			console.log("Sending %d farms", count);
			http.post(account, '/build.php?gid=16&tt=99', postData, function(buildData) {
				console.log("Sent a farm list request...");
			});
		});
		next();
	});
	
	var time = Math.random() * (20000 - 1000) + 1000;
	var hour = 1000 * 60 * 60;
	var out = time + hour;
	timeoutObject = setTimeout(doFarmList, out);
};

doFarmList();
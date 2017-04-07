var fs = require('fs');
var Nightmare = require('nightmare');

var websites = getWebsites();
var results = [];
var linkNum = 0;

while(websites.length > 0){
	var current = websites.shift();
	var nightmare = Nightmare({
		gotoTimeout : 30000,
		show : false
	});
	nightmare
	  .goto(current)
	  .evaluate(function () {
	    window.fns = {
	    	prefilter : function(current){
	    		var bool = true;
                if (current.nodeName != "A" && current.nodeName != "DIV" && current.nodeName != "IMG" &&
                    current.nodeName != "SPAN" && current.nodeName != "INPUT" &&
                    current.nodeName != "BUTTON") bool = false;
                if (current.nodeName == "INPUT") {
                    if (current.type != "button" && current.type != "img" &&
                        current.type != "submit") bool = false;
                }
                if (current.nodeName == "A") {
                    if (current.href.toLowerCase().indexOf('mailto:') == 0) bool = false;
                }
                return bool;
	    	},
	    	traverseDOM : function(){
	    		var tree = []; var candidates = []; var sites = []; var result = {"candidates" : [], "links" : []}
	    		tree.push(document.body);
	    		while(tree.length > 0){
	    			var branch = tree.pop();
	    			if(branch != null){
	    				var children = branch.children;
	    				if(children){
	    					var arr = [].slice.call(children);
		    				arr.forEach(function(currVal, arr, index){
	                        	tree.unshift(currVal);
	                        });
	    				}
	    				if(!(branch.attributes == null || branch.nodeName == 'SCRIPT' || branch.nodeName == 'EMBED')){
	    					if(this.prefilter(branch)){
	    						var sso = this.hasSSO(branch);
	    						var link = this.hasLinks(branch);
	    						return link;
	    						// console.log(sso); console.log(link);
	    						// if(sso) candidates.push(sso);
	    						// if(link) sites.unshift(link);
	    					}
	    				}
	    			}
	    		}
	    		result.candidates = candidates;
	    		result.links = sites;
	    		return result;
	    	},
	    	hasLinks : function(node){
	    		var attrStr = this.makeAttrString(node);
	    		if(this.checkLinkWords(attrStr)){
	    			return this.extractLink(node);
	    		}
	    	},
	    	checkLinkWords : function(inputstr){
                var k2 = /log[\-\s]*[io]+n/gi;
                var k3 = /sign[\-\s]*[io]+n/gi;
                var k4 = /sign[\-\s]*up+/gi;
                var k5 = /create[\-\s]*account+/gi;
                var k6 = /register/gi;
                var e0 = /social/gi; var e1 = /subscribe/gi; var e2 = /connect/gi; var e3 = /like/gi; var e4 = /support/gi;
                var e5 = /recovery/gi; var e6 = /forgot/gi; var e7 = /help/gi; var e8 = /promo[tion]*/gi; 
                var e9 = /privacy[\-\s]*[policy]*/gi; var e10 = /sports/gi; var e11 = /story/gi; var e12 = /campaign/gi;
                var e13 = /questions/gi;

                if(inputstr.match(e0) == null && inputstr.match(e1) == null  && inputstr.match(e2) == null && 
                    inputstr.match(e3) == null && inputstr.match(e4) == null && inputstr.match(e5) == null &&
                    inputstr.match(e6) == null && inputstr.match(e7) == null && inputstr.match(e8) == null &&
                    inputstr.match(e9) == null && inputstr.match(e10) == null && inputstr.match(e11) == null &&
                    inputstr.match(e12) == null && inputstr.match(e13) == null){
                    if(inputstr.match(k2) != null || inputstr.match(k3) != null || 
                    	inputstr.match(k4) != null || inputstr.match(k5) != null || inputstr.match(k6) != null){
                        return true;
                   	}
                }
                return false;
            },
            extractLink :  function(node){
            	var parent = node.parentElement;
                var val = node.getAttribute('href') || node.getAttribute('onclick') || node.getAttribute('action');
                if(val){
                    return val;
                }else{
                    if(parent){
                        var parentVal = node.getAttribute('href') || node.getAttribute('onclick') || node.getAttribute('action');
                        if(parentVal) return parentVal;
                    }
                }
                return null;
            },
	    	makeAttrString : function(node){
	    		var str = '';
                var attribs = node.attributes;
                for(var i=0; i < attribs.length; i++){
                    str += attribs[i].name + "=" + attribs[i].value + ";"
                }
                return str;
	    	},
	    	hasSSO : function(node){
	    		var attrStr = this.makeAttrString(node);
	    		var result = this.checkSSOWords(attrStr);
	    		if(result) return result;
	    	}, 
	    	checkSSOWords : function(inputstr){
	    		var sso = [{"site" : "google", "regex" : /google/gi, "url" : ["https://accounts.google.com/o/oauth2/auth"]}, 
                {"site" : "yahoo", "regex" : /yahoo/gi, "url" : ["https://api.login.yahoo.com/oauth2/request_auth"]}, 
                {"site" : "500px", "regex" : /500px/gi, "url": ["https://api.500px.com/v1/oauth"]}, 
                {"site" : "aol", "regex" : /aol/gi, "url" :["https://api.screenname.aol.com/auth"]}, 
                {"site" : "twitter", "regex" : /twitter/gi, "url" : ["https://api.twitter.com/oauth"]}, 
                {"site" : "vk", "regex" : /vk/gi, "url" : ["https://oauth.vk.com/authorize"]}, 
                {"site" : "yammer", "regex" : /yammer/gi, "url" : ["https://www.yammer.com/oauth2/authorize"]}, 
                {"site" : "yandex", "regex" : /yandex/gi, "url" : ["https://oauth.yandex.com/authorize"]},
                {"site" : "zendesk", "regex" : /zendesk/gi, "url" : [".zendesk.com/oauth/authorizations/new"]}, 
                {"site" : "amazon", "regex" : /amazon/gi, "url" : ["http://g-ecx.images-amazon.com/images/G/01/lwa/btnLWA", "https://images-na.ssl-images-amazon.com/images/G/01/lwa/btnLWA"]},
                {"site" : "flickr", "regex" : /flickr/gi, "url" : ["https://www.flickr.com/services/oauth"]}, 
                {"site" : "bitbucket", "regex" : /bitbucket/gi, "url" : ["https://bitbucket.org/site/oauth2", "https://bitbucket.org/api/1.0/oauth"]}, 
                {"site" : "bitly", "regex" : /bitly/gi, "url" : ["https://bitly.com/oauth"]}, 
                {"site" : "cloud foundry", "regex" : /cloud[\-\s]*foundry/gi, "url" : ["/uaa/oauth"]}, 
                {"site" : "dailymotion", "regex" : /dailymotion/gi, "url" : ["https://www.dailymotion.com/oauth"]}, 
                {"site" : "deviantart", "regex" : /deviantART/gi, "url" : ["https://www.deviantart.com/oauth2"]}, 
                {"site" : "discogs", "regex" : /discogs/gi, "url" : ["https://api.discogs.com/oauth"]}, 
                {"site" : "huddle", "regex" : /huddle/gi, "url" : ["https://login.huddle.net/request"]}, 
                {"site" : "netflix", "regex" : /netflix/gi, "url" : ["https://api-user.netflix.com/oauth"]}, 
                {"site" : "openlink data spaces", "regex" : /openlink[\-\s]*data[\-\s]*spaces/gi, "url" : ["/OAuth"]}, 
                {"site" : "openstreetmap", "regex" : /openstreetmap/gi, "url" : ["http://www.openstreetmap.org/oauth"]}, 
                {"site" : "opentable", "regex" : /opentable/gi, "url" : ["http://www.opentable.com/oauth"]}, 
                {"site" : "passport", "regex" : /passport/gi, "url" : ["/dialog/authorize", "oauth2/authorize", "oauth/authorize"]},
                {"site" : "paypal", "regex" : /paypal/gi, "url" : ["paypal.com/v1/oauth2"]}, 
                {"site" : "plurk", "regex" : /plurk/gi, "url" : ["https://www.plurk.com/OAuth/authorize"]},
                {"site" : "sina weibo", "regex" : /sina[\-\s]*weibo/gi, "url" : ["http://api.t.sina.com.cn/oauth/authorize"]},
                {"site" : "stackexchange", "regex" : /stack[\-\s]*exchange/gi, "url" : ["https://stackexchange.com/oauth"]}, 
                {"site" : "statusnet", "regex" : /statusnet/gi, "url" : ["status.net/api/oauth/authorize"]}, 
                {"site" : "ubuntu one", "regex" : /ubuntu[\-\s]*one/gi, "url" : ["https://login.ubuntu.com/api/1.0/authentications"]},
                {"site" : "viadeo", "regex" : /viadeo/gi, "url" : ["https://partners.viadeo.com/oauth/authorize"]},
                {"site" : "vimeo", "regex" : /vimeo/gi, "url" : ["https://api.vimeo.com/oauth/authorize"]}, 
                {"site" : "withings", "regex" : /withings/gi, "url" : ["https://oauth.withings.com/account/authorize"]},
                {"site" : "xero", "regex" : /xero/gi, "url" : ["https://api.xero.com/oauth/Authorize"]},
                {"site" : "xing", "regex" : /xing/gi, "url" : ["https://api.xing.com/v1/authorize"]}, 
                {"site" : "goodreads", "regex" : /goodreads/gi, "url" : ["http://www.goodreads.com/oauth"]}, 
                {"site" : "google app engine", "regex" : /google[\-\s]*app[\-\s]*engine/gi, "url" : ["https://accounts.google.com/o/oauth2/v2/auth"]},
                {"site" : "groundspeak", "regex" : /groundspeak/gi, "url" : ["groundspeak.com/oauth"]}, 
                {"site" : "intel cloud services", "regex" : /intel[\-\s]*cloud[\-\s]*services/gi, "url" : []}, 
                {"site" : "jive", "regex" : /jive/gi, "url" : ["jiveon.com/oauth2"]}, 
                {"site" : "linkedin", "regex" : /linkedin/gi, "url" : ["https://www.linkedin.com/oauth/v2/authorization"]}, 
                {"site" : "trello", "regex" : /trello/gi, "url" : ["https://trello.com/1/OAuthAuthorizeToken", "https://trello.com/1/authorize"]}, 
                {"site" : "tumblr", "regex" : /tumblr/gi, "url" : ["https://www.tumblr.com/oauth/authorize"]}, 
                {"site" : "microsoft", "regex" : /microsoft/gi, "url" : ["https://login.live.com/oauth20"]},
                {"site" : "mixi", "regex" : /mixi/gi, "url" : ["api.mixi-platform.com/OAuth"]}, 
                {"site" : "myspace", "regex" : /myspace/gi, "url" : ["api.myspace.com/authorize"]}, 
                {"site" : "etsy", "regex" : /etsy/gi, "url" : ["https://www.etsy.com/oauth"]}, 
                {"site" : "evernote", "regex" : /evernote/gi, "url" : ["https://sandbox.evernote.com/OAuth.action"]},  
                {"site" : "yelp", "regex" : /yelp/gi, "url" : ["https://api.yelp.com/oauth2"]},  
                {"site" : "facebook", "regex" : /facebook/gi, "url" : ["fb-login-button", "https://www.facebook.com/v2.0/dialog/oauth",  "https://www.facebook.com/v2.3/dialog/oauth"]},
                {"site" : "dropbox", "regex" : /dropbox/gi, "url" : ["https://www.dropbox.com/1/oauth2/authorize", "https://www.dropbox.com/1/oauth/authorize"]}, 
                {"site" : "twitch", "regex" : /twitch/gi, "url" : ["https://api.twitch.tv/kraken/oauth2/authorize"]},
                {"site" : "stripe", "regex" : /stripe/gi, "url" : ["https://connect.stripe.com/oauth/authorize"]},
                {"site" : "basecamp", "regex" : /basecamp/gi, "url" : ["https://launchpad.37signals.com/authorization/new"]},
                {"site" : "box", "regex" : /box/gi, "url" : ["https://account.box.com/api/oauth2/authorize"]},
                {"site" : "formstack", "regex" : /formstack/gi, "url" : ["https://www.formstack.com/api/v2/oauth2/authorize"]},
                {"site" : "github", "regex" : /github/gi, "url" : ["https://github.com/login/oauth/authorize"]},
                {"site" : "reddit", "regex" : /reddit/gi, "url" : ["https://www.reddit.com/api/v1/authorize"]},
                {"site" : "instagram", "regex" : /instagram/gi, "url" : ["https://api.instagram.com/oauth/authorize"]},
                {"site" : "foursquare", "regex" : /foursquare/gi, "url" : ["https://foursquare.com/oauth2/authorize"]},
                {"site" : "fitbit", "regex" : /fitbit/gi, "url" : ["https://www.fitbit.com/oauth2/authorize"]},
                {"site" : "imgur", "regex" : /imgur/gi, "url" : ["https://api.imgur.com/oauth2/authorize"]},
                {"site" : "salesforce", "regex" : /salesforce/gi, "url" : ["https://login.salesforce.com/services/oauth2/authorize"]},
                {"site" : "strava", "regex" : /strava/gi, "url" : ["https://www.strava.com/oauth/authorize"]},
                {"site" : "battle.net", "regex" : /battle.net/gi, "url" : ["https://us.battle.net/oauth/authorize"]}]
                var k0 = /oauth/gi;
                var k1 = /openid/gi
                var k2 = /log[\-\s]*[io]+n[\-\s]*[with]+[using]+/gi;
                var k3 = /sign[\-\s]*[io]+n[\-\s]*[with]+[using]+/gi;
                var k4 = /sign[\-\s]*[up]+[\-\s]*[with]+[using]+/gi;
                var k5 = /register[\-\s]*[up]+[\-\s]*[with]+[using]+/gi;
                var k6 = /create[\-\s]*[up]+[\-\s]*[with]+[using]+/gi;

                for(var i=0; i < sso.length; i++){
	                var each = sso[i];
	                var siteMatch = inputstr.match(each.regex);
	                if(siteMatch != null){
	                    var authMatch = inputstr.match(k0);
	                    var openMatch = inputstr.match(k1);
	                    if(authMatch != null){
	                        var urlList = each.url;
	                        var urlLen = urlList.length;
	                        if(urlLen > 0){
	                            for(var j=0; j < urlLen; j++){
	                                var urlMatch = inputstr.match(urlList[j]);
	                                if(urlMatch != null){
	                                    return each.site;
	                                }
	                            }
	                        }
	                    }else if(openMatch != null){
	                        return each.site;
	                    }else{
	                        if(inputstr.match(k2) != null || inputstr.match(k3) != null  || inputstr.match(k4) != null || 
	                            inputstr.match(k5) != null || inputstr.match(k6) != null){
	                            return each.site;
	                        }
	                    }
	                }
	            }
	    	}
	    };
	    return fns.traverseDOM();
	  })
	  .end()
	  .then(function (result) {
	  	if(result){
	  		results.concat(result.candidates);
	  		websites.concat(result.links);
	  	}
	  	console.log(results);
	  	if(linkNum > 500) write(results);
	  })
	  .catch(function (error) {
	    console.error('Search failed:', error);
	  });

	  linkNum++;
}





function write(data){
	try{
		fs.writeFile('../data/log.txt', JSON.stringify(data), function(isDone){
			console.log(isDone);
		});
	}catch(e){
		console.log("Write file error : " + e);
	}
}

function getWebsites(){
	try{
		var data = fs.readFileSync('../data/summa.csv', 'utf8');
		var arr = data.split(/\r?\n/);
		sites = arr.map(function(val, index, arr){
		    return val = "https://www." + val.split(',')[1];
		});
		return sites;
	}catch(e){
		console.log("File read error : " + e);
	}
	
}
(function() {
	"use strict";
	var c = window.TadCreative = {
		m_sdk_ver : '3.1.0'
	};
	c.ua = navigator.userAgent;
	c.isAndroid = (c.ua.toLowerCase().indexOf('android') > 0) ? true : false;
	c.isIphone = (c.ua.toLowerCase().indexOf('iphone') > 0) ? true : false;
	c.isIpad = (c.ua.toLowerCase().indexOf('ipad') > 0) ? true : false;
	c.isIpod = (c.ua.toLowerCase().indexOf('ipod') > 0) ? true : false;
	c.isIos = (c.isIphone || c.isIpad || c.isIpod) ? true : false;
	c.queryString = '';
	c.logURL = '';
	c.realLogURL = 'http://event.adotsolution.com:16000/logger';
	c.devLogURL = 'http://event-dev.adotsolution.com:16000/logger';
	c.bannerObj = {};
	c.templateId = '';
	c.targetId = '';
	c.targetEl = '';
	c.closeId = '';
	c.closeEl = '';
	c.templateInfo =	{
		'P0002001AA' : {'clickcondition' : 'touch'}, // poc text stardard banner
		'P0002002AA' : {'clickcondition' : 'touch'}, // poc image stardard banner
		'S0002002AA' : {'clickcondition' : 'click'}, // s2s stardard banner
		'P0003001AP' : {'clickcondition' : 'click'}, // poc Interstitial Portrait
		'P0003001AL' : {'clickcondition' : 'click'}, // poc Interstitial Landscape
		'S0003001AP' : {'clickcondition' : 'click'}, // s2s Interstitial Portrait
		'S0003001AL' : {'clickcondition' : 'click'}, // s2s Interstitial Landscape
		'P0005002AA' : {'clickcondition' : 'click'}, // poc Medium Rectangle Banner 300*250
		'P0005001AA' : {'clickcondition' : 'click'}, // poc Medium Rectangle Banner 300*200
		'P0006001AA' : {'clickcondition' : 'click'}, // poc Large banner
		'P0103001AA' : {'clickcondition' : 'touch', 'close' : true}, // poc Floating
		'S0103001AA' : {'clickcondition' : 'touch', 'close' : true} // s2s Floating
	};
	c.$ = function(id) {
		return (typeof id == 'string') ? document.getElementById(id) : id;
	};
	c.checkPreviewMode = function() {
		if(c.isEmpty(c.queryString)) return false;
		return (c.queryString.hasOwnProperty('test') && c.queryString.test == 'true') ? true : false;
		//return (window.location.href.indexOf('test=true') > -1) ? true : false;
	};
	c.isEmpty = function(obj) {
		for(var prop in obj) {
			if(obj.hasOwnProperty(prop)) {
				return false;
			}
		}
		return true;		
	};
	c.processMacro = function(url, obj) {
		if(!url && typeof url != 'string') return url;
		if(!obj && typeof obj != 'object') return url;
		url = (obj.hasOwnProperty('rid')) ? url.replace('{req_seq}', obj.rid) : url.replace('{req_seq}', 0);
		url = (obj.hasOwnProperty('mds')) ? url.replace('{mda_seq}', obj.mds) : url.replace('{mda_seq}', 0);
		url = (obj.hasOwnProperty('gaid')) ? url.replace('{GAID}', obj.gaid) : url.replace('{GAID}', 0);
		url = (obj.hasOwnProperty('idfa')) ? url.replace('{IDFA}', obj.idfa) : url.replace('{IDFA}', 0);

		return url;
	};
	c.obj2param = function(obj) {
		if(!obj || typeof obj != 'object') return false;
		var str = '', key = '';
		for(key in obj) {
			if(key.indexOf('url') > -1) {
				str += key + '=' + encodeURIComponent(obj[key]) + '&';
			} else {
				str += key + '=' + obj[key] + '&';
			}
		}
		str = str.substr(0, str.length-1);
		return str;
	};
	c.landingAction = function() {
		switch (c.bannerObj.action) {
			case 0: // click 2 web
				var url, l_url = c.bannerObj.param.url, query = c.queryString;
				l_url = c.processMacro(l_url, query);
				if (window.mraid && window.tad) {
					if(query.rid) { 
						var paramObj = {
							'x_rid' : query.rid,
							'k_event' : 200,
							'x_redirect_url' : l_url,
							'c_js_ver' : c.m_sdk_ver
						};
						var paramStr = c.obj2param(paramObj);
						url = c.logURL + '?' + paramStr;
					} else {
						url = l_url;
					}
					mraid.open(url);
				} else {
					window.open(l_url);
				}
				break;
			case 1: // click 2 download
				if (window.mraid && window.tad && tad.downloadApplication) {
					tad.sendEventCode(210);
					tad.downloadApplication(c.bannerObj.paramdl);
				} else {
					window.open(c.bannerObj.paramdl.alternative);
				}
				break;
			case 2: // click 2 app
				if (window.mraid && window.tad && tad.canOpenUri) {
					if (tad.canOpenUri(c.bannerObj.paramapp.url)) {
						tad.sendEventCode(211);
						mraid.open(c.bannerObj.paramapp.url);
					} else {
						tad.sendEventCode(210);
						mraid.open(c.bannerObj.paramapp.alternative);
					}
				} else {
					window.open(c.bannerObj.paramapp.alternative);
				}
				break;
			case 3: // click 2 multi
        var multi = c.bannerObj.parammulti;
				if (window.mraid && window.tad && tad.canOpenUri) {
					var eventCode = 290;
					for (var i=0, il = multi.length; i < il; i++) {
						if (tad.getAppVersionCode && multi[i].pkg && multi[i].version) {
							var verCode = tad.getAppVersionCode(multi[i].pkg);
							if (verCode && verCode >= multi[i].ver) {
								if (tad.canOpenUri(multi[i].url)) {
									eventCode = eventCode + i;
									tad.sendEventCode(eventCode);
									mraid.open(multi[i].url);
									break;
								}
							}
						} else {
							if (tad.canOpenUri(multi[i].url)) {
								eventCode = eventCode + i;
								tad.sendEventCode(eventCode);
								mraid.open(multi[i].url);
								break;
							}
						}
					}
				} else {
					window.open(multi[0].url);
				}
				break;
			default:
				break;
		}
	};
	c.closeAction = function() {
		if (window.mraid && window.tad) {
			mraid.close();
		}
	};
	c.checkForMraid = function(adInfo, userCallback) {
		if (c.checkPreviewMode()) {
			userCallback(adInfo);
			return;
		}
		if (typeof mraid !== "undefined") {
			var state = mraid.getState();
			if (state == "loading") {
				//mraid.addEventListener("ready", userCallback);
				mraid.addEventListener("ready", function() {
					userCallback(adInfo);
				});
			} else {
				userCallback(adInfo);
			}
		} else {
			setTimeout(function() {
				c.checkForMraid();
			}, 250);
		}
	};
	c.init = function(cInfo, adInfo, queryString, userCallback) {
		if(!cInfo || typeof cInfo != 'object') return false;
		if(!adInfo || typeof adInfo != 'object') return false;
    if(!queryString || typeof queryString != 'object') return false;
		if(!userCallback ||typeof userCallback != 'function') return false;

		c.templateId = (cInfo.hasOwnProperty('templateId') && typeof cInfo.templateId == 'string') ? cInfo.templateId : '';
		c.targetId = (cInfo.hasOwnProperty('targetId') && typeof cInfo.targetId == 'string') ? cInfo.targetId : '';
		
		// template ID 체크
		if(CREATIVE_META_ID != c.templateId) return false;

		if(cInfo.hasOwnProperty('targetId') && typeof cInfo.targetId == 'object') {
			c.targetId = (cInfo.targetId.hasOwnProperty('banner') && typeof cInfo.targetId.banner == 'string') ? cInfo.targetId.banner : '';
			c.targetEl = (c.targetId != '') ? c.$(c.targetId) : '';
			c.closeId = (cInfo.targetId.hasOwnProperty('close') && typeof cInfo.targetId.close == 'string') ? cInfo.targetId.close : '';
			c.closeEl = (c.closeId != '') ? c.$(c.closeId) : '';
		}
		c.bannerObj = adInfo;
		c.queryString = queryString;
		c.logURL = (c.queryString.k_develop && c.queryString.k_develop == 'true') ? c.devLogURL : c.realLogURL;
		c.setLandingAction();
		c.checkForMraid(adInfo, userCallback);

	};
	c.setLandingAction = function() {
		if(!c.templateId || typeof c.templateId != 'string') return false;
		if(!c.targetEl || c.targetEl == '') return false;
		
		switch(c.templateInfo[c.templateId].clickcondition) {
			case 'touch' :
				c.addLandingTouch(c.targetEl, c.landingAction);
				break;
			case 'click' :
        c.addLandingClick(c.targetEl, c.landingAction);
        break;
			default :
				c.addLandingClick(c.targetEl, c.landingAction);
				break;
		}
		// close 버튼이 설정된 경우..
		if(c.templateInfo[c.templateId].hasOwnProperty('close') && c.templateInfo[c.templateId].close == true) {
			c.addLandingClick(c.closeEl, c.closeAction);
		}
	};
	c.addLandingClick = function(target, callback) {
		c.addEvent(target, 'click', callback);
	};
	c.addLandingTouch = function(target, callback) {
		if('ontouchstart' in document.documentElement) {
			c.addEvent(target, 'touchstart', function(e) {
				window.isTouch = true;
				e.preventDefault();
			});
			c.addEvent(target, 'touchend', function(e) {
				if(window.isTouch) {
					window.isTouch = false;
					callback();
				}
				e.preventDefault();
			});
		} else {
			c.addEvent(target, 'click', callback);
		}
	};
	c.addEvent = function(target, type, callback) {
		if(window.attachEvent) { // ie
			target.attachEvent('on'+type, callback);
		} else {
			target.addEventListener(type, callback, false);
		}
	};
})();
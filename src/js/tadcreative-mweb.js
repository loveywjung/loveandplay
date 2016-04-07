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
		'P0002001WA' : {'clickcondition' : 'click'}, // poc text stardard banner
		'P0002002WA' : {'clickcondition' : 'click'}, // poc image stardard banner
		'S0002002WA' : {'clickcondition' : 'click'}, // s2s stardard banner
		'P0003001WA' : {'clickcondition' : 'click'}, // poc Interstitial Portrait
		'S0003001WA' : {'clickcondition' : 'click'}, // s2s Interstitial Portrait
		'P0005001WA' : {'clickcondition' : 'click'}, // poc Medium Rectangle Banner 300*250
		'P0005002WA' : {'clickcondition' : 'click'}, // poc Medium Rectangle Banner 300*200
		'P0006001WA' : {'clickcondition' : 'click'}, // poc Large banner
		'P0103001WA' : {'clickcondition' : 'touch', 'close':true}, // poc Floating
		'S0103001WA' : {'clickcondition' : 'touch', 'close':true} // s2s Floating
	};
	c.$ = function(id) {
		return (typeof id == 'string') ? document.getElementById(id) : id;
	};
	c.checkPreviewMode = function() {
		if(c.isEmpty(c.queryString)) return false;
		return (c.queryString.hasOwnProperty('test') && c.queryString.test == 'true') ? true : false;
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
		var l_url = '', event_code;
		switch(c.bannerObj.action) {
			case 0: // c2web
				l_url = c.bannerObj.param.url;
				event_code = 200;
				break;

			case 1: // c2appd/l
				// iOS는 itunes
				if(c.isIos == true) {
					l_url = (c.bannerObj.paramdl.itunes) ? c.bannerObj.paramdl.itunes : c.bannerObj.paramdl.alternative;
				// Android는 playStore
				} else {
					l_url = (c.bannerObj.paramdl.market) ? c.bannerObj.paramdl.market : c.bannerObj.paramdl.alternative;
				}
				event_code = 210;
				break;
		}

		if(!l_url || !event_code) return false;
		if(c.checkPreviewMode() || !c.queryString.rid) {
			window.open(l_url);
		} else {
			var url, paramObj, blank, paramStr, query = c.queryString;
			l_url = c.processMacro(l_url, query);
			blank = (query.k_blank && query.k_blank == 'Y') ? true : false;
			paramObj = {
				'x_rid' : query.rid,
				'k_event' : event_code,
				'x_redirect_url' : l_url,
				'c_js_ver' : c.m_sdk_ver
			};
			paramStr = c.obj2param(paramObj);
			url = c.logURL + '?' + paramStr;

			// 새창여부(default:현재창)
			if(blank == true) {
				window.open(url);
			} else {
				if(top !== self) {
					window.top.location = url;
				} else {
					window.location = url;
				}
			}
		}
	};
	c.closeAction = function() {
		var closeProperties = {
			'owner' : 'syrupad',
			'type' : 'actionWithEvent',
			'adNo' : c.queryString.adNo,
			'trigger' : 'close'
		};
		parent.postMessage(closeProperties, '*');
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
		userCallback(adInfo);
		c.setLandingAction();
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
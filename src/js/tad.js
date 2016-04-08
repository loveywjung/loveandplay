/**
 * tad.js - v3.12.6
 * http://www.adotsolution.com
 * Javascript SDK For T-Ad
 * Copyright 2012 SK PLANET.
 */
(function() {
	"use strict";
	// TadSdk가 이미 호출되었다면 return.2015.03.02.uyuni
	if(window.TadSdk && typeof window.TadSdk == 'object') return false;
	window.tad_response = function(adNo, rtnInfo) {
		// errorHandler throw 구문 빠짐에 의한 return false 추가.2015.10.07.uyuni
		if(!adNo || typeof adNo != 'number') { t.Util.errorHandler('Incorrect Ad response parameter.'); return false; }
		if(!rtnInfo || typeof rtnInfo != 'object') { t.Util.errorHandler('Incorrect Ad response parameter.'); return false; }
		// Ad exChange for adbay.2014.11.01.uyuni
		//TadSdk.AdView.viewAd(adNo, rtnInfo);

		// ad_request값 Log 남기기.2015.03.02.uyuni
		if(rtnInfo.ret_code === 0) {
			t.Util.logHandler('No Ads.');
			t.Util.logHandler('Slot No : ' + adNo);
			t.Util.logHandler('ruid : ' + TadSdk.configure[TadSdk.adNo[0]].c_uid);
		} else {
			t.Util.logHandler('Slot No : ' + adNo);
			t.Util.logHandler('ruid : ' + TadSdk.configure[TadSdk.adNo[0]].c_uid);
			var x_products = (rtnInfo.x_products.length > 1) ? rtnInfo.x_products.split(",") : 0;
			for(var i=0,il=x_products.length;i<il;i++) {
				t.Util.logHandler(i + 1 + ' : ' + x_products[i]);
			}
		}

		t.Util.logHandler('ad_response : ' + JSON.stringify(rtnInfo));

		TadSdk.AdView.checkAd(adNo, rtnInfo);
		// jsonp 경우 삭제
		if(t.Util.$('tad_' + adNo)) {
			document.getElementsByTagName('HEAD')[0].removeChild(t.Util.$('tad_' + adNo));
		}
	};
	// policy 서버가 호출되었다면 return.2015.08.03.uyuni
	window.tad_policy_response = function(adNo, policyInfo) {
		// errorHandler throw 구문 빠짐에 의한 return false 추가.2015.10.07.uyuni
		if(!adNo || typeof adNo != 'number') { t.Util.errorHandler('Incorrect policy response parameter.'); return false; }
		if(!policyInfo || typeof policyInfo != 'object') { t.Util.errorHandler('Incorrect policy response parameter.'); return false; }
		// policy 구분을 slotNo에서 clientID로 변경.2015.10.16.uyuni
		var clientId = t.configure[adNo].m_client_id;

		// No Policy 상태 revision -1, interval 86400sec(1일)
		if(policyInfo.ret_code == '0') {
			t.Util.logHandler('No Policy.');
			t.Util.logHandler('Slot No : ' + adNo);
			t.Util.logHandler('ruid : ' + TadSdk.configure[TadSdk.adNo[0]].c_uid);
			t.Util.logHandler('response policy : ' + JSON.stringify(policyInfo));

			// policy 구분을 slotNo에서 clientID로 변경.2015.10.16.uyuni
			t.Util.setCookieSec('TAD_POLICY_REVISION_' + clientId, -1, 86400);
			ls.setItem('tad_policy_' + clientId, '');
			ls.setItem('tad_frequency_history_' + clientId, '');

			TadSdk.AdView.getAdInfo(adNo);
		} else {
			if(policyInfo.hasOwnProperty('policy')) {
				var revision, interval, option, opt;
				revision = (policyInfo.policy.hasOwnProperty('revision')) ? policyInfo.policy.revision : 0;
				interval = (policyInfo.policy.hasOwnProperty('interval')) ? policyInfo.policy.interval : 0;
				option = (policyInfo.policy.hasOwnProperty('options')) ? policyInfo.policy.options : {};

				// policy 구분을 slotNo에서 clientID로 변경.2015.10.16.uyuni
				t.Util.setCookieSec('TAD_POLICY_REVISION_' + clientId, revision, interval);
				ls.setItem('tad_policy_' + clientId, JSON.stringify(policyInfo.policy));
				ls.setItem('tad_frequency_history_' + clientId, '');
				TadSdk.configure[adNo].frequency = revision;

				TadSdk.AdView.checkAdPolicy(adNo, option);
			}
		}
	};
	// Ad exChange for mable.2015.03.17.uyuni
	window.tad_mable_response = function(rtn) {
		// errorHandler throw 구문 빠짐에 의한 return false 추가.2015.10.07.uyuni
		if(!rtn || typeof rtn != 'object') { t.Util.errorHandler('Incorrect Ad Response parameter.'); return false; }

		var cbpObj = t.Util.param2Object(rtn.cbp);
		if(!cbpObj.adNo) { // adNo가 없으면 error처리
			rtn.ret = 101;
			var adNoHeight = {50:2, 320:3, 100:103};
			cbpObj.adNo = (rtn.h) ? adNoHeight[rtn.h] : t.adNo[0];
		}
		if(rtn.ret !== 200) {
			var mableErrorCode = (rtn.ret === 0) ? 0 : 500;
			var mableErrorMsg = {
				0 : 'No Ads.',
				101 : 'No Require Parameter.',
				300 : 'Unregistered Site ID.'
			};
			t.configure[cbpObj.adNo].errorCallback(mableErrorCode); // error callback
			t.Util.errorHandler('Mable Mediation - '+mableErrorMsg[rtn.ret]);
			return false;
		}

		// x_tracking_url 추가.2015.05.13.uyuni
		// 일부 clk대신 imp로 잡히는 문제 발생하여 분리하여 각각 adInfo에 저장.2015.06.02.uyuni
		// imp -> x_imp_tracking_url, clk = x_clk_tracking_url
		if(rtn.imp) {
			t.adInfo[cbpObj.adNo].x_imp_tracking_url = rtn.imp;
		}
		if(rtn.clk) {
			t.adInfo[cbpObj.adNo].x_clk_tracking_url = rtn.clk;
		}

		// 소재 전달을 위한 object로 adexchange로 변경.2015.03.19.uyuni
		//TadSdk.adbayInfo = rtn;
		TadSdk.adExchageInfo[cbpObj.adNo] = rtn;
		TadSdk.AdView.viewAd(cbpObj.adNo, rtn);
		// jsonp 경우 삭제
		if(t.Util.$('tad_mable_' + cbpObj.adNo)) {
			document.getElementsByTagName('HEAD')[0].removeChild(t.Util.$('tad_mable_' + cbpObj.adNo));
		}
	};

	// Ad exChange for testad.2015.05.10.uyuni
	window.tad_testad_response = function(rtn) {
		// errorHandler throw 구문 빠짐에 의한 return false 추가.2015.10.07.uyuni
		if(!rtn || typeof rtn != 'object') { t.Util.errorHandler('Incorrect Ad Response parameter.'); return false; }

		var cbpObj = t.Util.param2Object(rtn.cbp);
		if(!cbpObj.adNo) { // adNo가 없으면 error처리
			rtn.ret = 101;
			var adNoHeight = {50:2, 320:3, 100:103};
			cbpObj.adNo = (rtn.h) ? adNoHeight[rtn.h] : t.adNo[0];
		}
		if(rtn.ret !== 200) {
			var testAdErrorCode = (rtn.ret === 0) ? 0 : 500;
			var testAdErrorMsg = {
				0 : 'No Ads.',
				101 : 'No Require Parameter.',
				300 : 'Unregistered Site ID.'
			};
			t.configure[cbpObj.adNo].errorCallback(testAdErrorCode); // error callback
			t.Util.errorHandler('TestAd Mediation - '+testAdErrorMsg[rtn.ret]);
			return false;
		}

		// 소재 전달을 위한 object로 adexchange로 변경.2015.03.19.uyuni
		//TadSdk.adbayInfo = rtn;
		TadSdk.adExchageInfo[cbpObj.adNo] = rtn;
		TadSdk.AdView.viewAd(cbpObj.adNo, rtn);
		// jsonp 경우 삭제
		if(t.Util.$('tad_testad_' + cbpObj.adNo)) {
			document.getElementsByTagName('HEAD')[0].removeChild(t.Util.$('tad_testad_' + cbpObj.adNo));
		}
	};

	// Ad exChange for adbay.2014.11.01.uyuni
	window.tad_adbay_response = function(rtn) {
		// errorHandler throw 구문 빠짐에 의한 return false 추가.2015.10.07.uyuni
		if(!rtn || typeof rtn != 'object') { t.Util.errorHandler('Incorrect Ad Response parameter.'); return false; }

		var cbpObj = {};

		// adbay Mediation시 errocallback 빠진 문제 수정.2015.03.09.uyuni
		// DC인사이드,웃대 VOC 해결용.
		// 우선 adbay에서 No Ads일때 cbp를 내려주지 않으니 체크 후 없다면 띠배너로 고정(2015.03.09.현재 띠배너만 사용)
		if(rtn.cbp) {
			var idx = '', cbp = rtn.cbp, cbpArr = cbp.split("&");
			for(idx in cbpArr) {
				cbpObj[cbpArr[idx].split('=')[0]] = cbpArr[idx].split('=')[1];
			}
		} else {
			cbpObj.adNo = 2;
		}
		if(rtn.cb === 'executeAdbayMediaHouseAds') {
			// adbay Mediation시 errocallback 빠진 문제 수정.2015.03.09.uyuni
			// No Ads parametor 0으로 전달
			t.configure[cbpObj.adNo].errorCallback(0); // error callback
			t.Util.errorHandler(t.responseErrorCode[0]);
			return false;
		}

		// 소재 전달을 위한 object로 adexchange로 변경.2015.03.19.uyuni
		//TadSdk.adbayInfo = rtn;
		TadSdk.adExchageInfo[cbpObj.adNo] = rtn;
		TadSdk.AdView.viewAd(cbpObj.adNo, rtn);
		// jsonp 경우 삭제
		if(t.Util.$('tad_adbay_' + cbpObj.adNo)) {
			document.getElementsByTagName('HEAD')[0].removeChild(t.Util.$('tad_adbay_' + cbpObj.adNo));
		}
	};
	// for ie support
	if(!Array.prototype.indexOf) {
		Array.prototype.indexOf = function(obj, start) {
			for (var i = (start || 0), j = this.length; i < j; i++) {
				if (this[i] === obj) { return i; }
			}
			return -1;
		};
	}
	if(!Function.prototype.bind) {
		Function.prototype.bind = function(oThis) {
			if(typeof this !== 'function') {
				throw new TypeError('Function.prototype.bind - what is trying to be bound is not callable');
			}
			var aArgs = Array.prototype.slice.call(arguments, 1),
				fToBind = this,
				fNOP = function() {},
				fBound = function() {
					return fToBind.apply(this instanceof fNOP && oThis ? this : oThis, aArgs.concat(Array.prototype.slice.call(arguments)));
				};
			fNOP.prototype = this.prototype;
			fBound.prototype = new fNOP();

			return fBound;
		};
	}
	var ls = !(('localStorage' in window) && (window.localStorage !== null))  ? null : window.localStorage;
	var useLocalStorage = true;
	try {
		ls.setItem('__test','1');
		ls.removeItem('__test');
	} catch(e) {
		useLocalStorage = false;
		// android webview에서 setDomStorageEnabled(false) 경우 QUOTA_EXCEEDED_ERR가 노출되지 않아 제거.2015.07.09.uyuni
		ls = {
			storage : {},
			getItem : function( key ) {
				return ls[key] || null;
			},
			setItem : function( key, value ) {
				ls[key] = value;
			},
			removeItem : function( key ) {
				delete ls[key];
			},
			clear : function(){
				ls = {};
			}
		};
	}
	// Base64 Encoding For AdBay.2014.11.01.uyuni
	// reference site : http://www.webtoolkit.info/javascript-base64.html#.VFhhUfSsV0s
	var Base64 = {

		// private property
		_keyStr : "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",

		// public method for encoding
		encode : function (input) {
			var output = "";
			var chr1, chr2, chr3, enc1, enc2, enc3, enc4;
			var i = 0;

			input = Base64._utf8_encode(input);

			while (i < input.length) {

				chr1 = input.charCodeAt(i++);
				chr2 = input.charCodeAt(i++);
				chr3 = input.charCodeAt(i++);

				enc1 = chr1 >> 2;
				enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
				enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
				enc4 = chr3 & 63;

				if (isNaN(chr2)) {
					enc3 = enc4 = 64;
				} else if (isNaN(chr3)) {
					enc4 = 64;
				}

				output = output +
				this._keyStr.charAt(enc1) + this._keyStr.charAt(enc2) +
				this._keyStr.charAt(enc3) + this._keyStr.charAt(enc4);

			}

			return output;
		},

		// private method for UTF-8 encoding
		_utf8_encode : function (string) {
			string = string.replace(/\r\n/g,"\n");
			var utftext = "";

			for (var n = 0; n < string.length; n++) {

				var c = string.charCodeAt(n);

				if (c < 128) {
					utftext += String.fromCharCode(c);
				}
				else if((c > 127) && (c < 2048)) {
					utftext += String.fromCharCode((c >> 6) | 192);
					utftext += String.fromCharCode((c & 63) | 128);
				}
				else {
					utftext += String.fromCharCode((c >> 12) | 224);
					utftext += String.fromCharCode(((c >> 6) & 63) | 128);
					utftext += String.fromCharCode((c & 63) | 128);
				}

			}
			return utftext;
		}
	};
	var t = window.TadSdk = {
		m_sdk_ver : '3.12.6'
	};
	var timer = null;
	//t.ua = navigator.userAgent.toLowerCase();
	t.ua = navigator.userAgent;
	t.isAndroid = (t.ua.toLowerCase().indexOf('android') > 0) ? true : false;
	t.isIphone = (t.ua.toLowerCase().indexOf('iphone') > 0) ? true : false;
	t.isIpad = (t.ua.toLowerCase().indexOf('ipad') > 0) ? true : false;
	t.isIpod = (t.ua.toLowerCase().indexOf('ipod') > 0) ? true : false;
	t.isIos = (t.isIphone || t.isIpad || t.isIpod) ? true : false;
	t.isWindowPhone = (t.ua.toLowerCase().indexOf('windows phone') > 0) ? true : false;
	t.isIe = (t.ua.toLowerCase().indexOf('msie') > 0 ) ? true : false;
	t.os = (t.isIos) ? 'iOS' : (t.isAndroid) ? 'Android' : (t.isWindowPhone) ? 'windowPhone' : 'etc';
	t.d_os_name = '';
	t.d_os_ver = '';
	t.d_model = '';
	t.d_resolution = '';
	t.configure = {};
	t.adInfo = {};
	// t.adbayInfo = {}; // for adbay.2014.11.01.uyuni
	// 소재 전달을 위한 object로 adexchange로 변경.2015.03.19.uyuni
	// 동시에 mable의 다른 슬롯 소재 호출시 데이터 덮어쓰는 현상 발생으로 object 형태로 수정 {adNo:{'광고데이터'}}.2015.03.26.uyuni
	t.adExchageInfo = {}; // for mable.2015.03.17.uyuni
	t.activeFrame = [];
	t.adNo = [];
	t.adRequestUrl = 'http://ad.adotsolution.com:15000/mweb/ad_request';
	// policy 정책 서버 url 추가.2015.07.22.uyuni
	t.adPolicyUrl = 'http://gw.adotsolution.com:14000/polmngr/getpolicy.json';
	t.adLogUrl = 'http://event.adotsolution.com:16000/mweblog';
	t.testUrl = {'adRequestUrl' : 'http://ad-dev.adotsolution.com:15000/mweb/ad_request', 'adPolicyUrl' : 'http://dcd-dev.adotsolution.com/polmngr/getpolicy.json', 'adLogUrl' : 'http://event-dev.adotsolution.com:16000/mweblog', 'creativeHost':['http://adddn.adotsolution.com', 'http://dcd.adotsolution.com', 'http://contents.adotsolution.com:8080', 'http://dcd-dev.adotsolution.com', 'http://dev.adotsolution.com']};
	//t.testUrl = {'adRequestUrl' : 'http://addev.duckdns.org/tad/delivery/150317/request.php', 'adLogUrl' : 'http://event-dev.adotsolution.com:16000/mweblog'};
	// postMessage 응답시 외부 host로 부터 응답받지 않기 위해 처리 host 명시.2015.04.15.uyuni
	// 'http://contents.adotsolution.com:8080'은 하우스배너를 위해 추가
	t.creativeHost = ['http://adddn.adotsolution.com', 'http://dcd.adotsolution.com', 'http://contents.adotsolution.com:8080'];
	t.callback = 'tad_response';
	t.isTest = false;
	// debug 모드 전역 변수 처리 및 console 모드 추가.2015.03.02.uyuni
	t.debugMode = false;
	t.consoleMode = false;
	t.consoleId = false;
	t.zIndex = {
		inline : {zIndexOfAdhesion:5000, zIndexOfExpanded: 6000000},
		interstitial : {zIndex: 6000000},
		floating : {zIndex:2000000, zIndexOfExpanded: 6000000}
	};
	t.slot = {
		1 : {width:320, height:48, type:'inline'},
		2 : {width:320, height:50, type:'inline'},
		3 : {width:320, height:480, type:'interstitial'},
		5 : {width:300, height:250, type:'inline'},
		6 : {width:320, height:100, type:'inline'},
		103 : {width:100, height:100, type:'floating'},
		104 : {width:320, height:623, type:'inline'},
		105 : {width:320, height:271, type:'inline'},
		303 : {width:320, height:483, type:'inline'}
	};
	t.responseErrorCode = {
		0 : 'No Ad.',
		1 : 'The DailyFrequency limit may have been reached.', // FrequencyOver시에도 errorCallback 추가.2015.03.19.uyuni
		101 : 'No Require Parameter.',
		300 : 'Unregistered Client ID.',
		301 : 'No Supported Device.',
		302 : 'Wrong Slot Number.',
		500 : 'Internal error.'
	};

	// d_resolution값 추가.2015.08.25.uyuni
	t.commonParam = ['m_sdk_ver', 'd_model', 'd_os_name', 'd_os_ver', 'd_locale', 'd_resolution', 'callback'];
	// cache문제로 request 줄어드는 문제 수정을 위해 dummy값 추가(imp포함).2015.01.23.uyuni
	// d_resolution값 추가.2015.08.25.uyuni
	t.adRequestParam = ['adNo', 'm_client_id', 'm_slot', 'm_sdk_ver', 'm_iframe', 'd_model', 'd_os_name', 'd_os_ver', 'd_locale', 'd_resolution', 'callback', 'u_age', 'u_gender', 'u_network_operator','c_uid','dummy'];
	// 여러개의 상품이 나오는 re-targeting 광고의 경우 어떤 상품이 노출/클릭되었는지 체크를 위해 x_products 추가.2015.01.08.uyuni
	// d_resolution값 추가(검증용).2015.08.26.uyuni
	t.adLogParam = ['m_client_id', 'm_slot', 'm_sdk_ver', 'k_event', 'd_uid', 'x_bypass', 'd_model', 'd_os_name', 'd_os_ver', 'd_resolution', 'u_age', 'u_gender', 'u_network_operator', 'x_products','x_tracking_url','dummy'];
	t.adClickLogParam = ['adNo', 'm_client_id', 'k_event', 'm_slot', 'm_sdk_ver', 'd_uid', 'x_bypass', 'd_model', 'd_os_name', 'd_os_ver', 'u_age', 'u_gender', 'u_network_operator', 'k_blank', 'x_products','x_redirect_url','x_tracking_url'];
	// policy 정책 서버 url 추가.2015.07.22.uyuni
	t.adPolicyParam = ['adNo', 'callback', 'm_client_id', 'm_slot', 'm_sdk_ver', 'd_uid'];
	t.addedListeners = [];
 	/**
 	 * AdView Rendering
 	 */
	t.AdView = {
		/**
		 * 광고 초기화.
		 *
		 * @param {object} Ad configure object.
		 */
		init : function(conf) {
			/**
			 * adNo 대신 slotNo 사용.
			 * Android Chrome 랜딩 후 history back bug로 인해 timestamp기반의 adNo사용 불가능.
			 * Chrome에서 랜딩 후 history back시 SDK는 새로운 adNo를 생성하나 iframe은 기존 adNo를 가지고 SDK에 요청하여 SDK가 응답 멈추는 현상.
			 * 한 지면(한 화면)에 동일 slot의 광고를 사용하지 않는다는 전제조건 확인(TAD 3.0 서비스정책서 2.2.7과 3.2.5)하여 adNo대신 slotNo로 대처
			 * 동일 slot이 들어올 경우 에러처리 필요함.2015.01.12.uyuni.
			 */
			//var adNo = t.Util.getUnique();
			var adNo = (conf.slotNo && typeof conf.slotNo == 'number') ? conf.slotNo : '';
			if(adNo) {
				t.Util.analysisDeviceInfo();
				if(this.setConfigure(adNo, conf)) {
					this.getAdPolicy(adNo);
					//this.getAdInfo(adNo);
				}
			}
		},
		/**
		 * 매체 설정값 확인 및 등록
		 *
		 * @param {number} Unique ad Number.
		 * @param {object}
		 */
		setConfigure : function(adNo, config) {
			// errorHandler throw 구문 빠짐에 의한 return false 추가.2015.10.07.uyuni
			if(!config || typeof config != 'object') { t.Util.errorHandler('No Ad configure.'); return false; }
			// adNo 대신 slotNo 사용으로 인해 동일한 SlotNo 체크.2015.01.14.uyuni
			if(t.adNo.indexOf(adNo) > -1) {
				t.Util.errorHandler('Don\'t use the Same Ad Slot Number.');
				return false;
			}
			t.configure[adNo] = {};
			t.configure[adNo].adNo = adNo;
			t.adNo.push(adNo);
			// errorHandler throw 구문 빠짐에 의한 return false 추가.2015.10.07.uyuni
			if(!config.clientId || typeof config.clientId != 'string') { t.Util.errorHandler('No Client ID.'); return false; }
			t.configure[adNo].m_client_id = config.clientId;
			// errorHandler throw 구문 빠짐에 의한 return false 추가.2015.10.07.uyuni
			if(!config.slotNo || typeof config.slotNo != 'number') { t.Util.errorHandler('No Ad Slot Number.'); return false; }
			t.configure[adNo].m_slot = config.slotNo;
			t.configure[adNo].adhesionType = (config.adhesionType && typeof config.adhesionType == 'string') ? config.adhesionType : false;
			t.configure[adNo].m_iframe = (typeof config.useIframe == 'boolean' && config.useIframe === true) ? 'Y' : 'N';
			if(t.configure[adNo].m_iframe == 'Y') {
				t.configure[adNo].adhesionType = false;
			}

			// cache문제로 request 줄어드는 문제 수정을 위해 dummy값 추가(imp포함).2015.01.23.uyuni
			t.configure[adNo].dummy = t.Util.getUnique();

			// floating && interstitial 적용.2014.05.26.uyuni
			// inline이 아닐 경우 targetId 및 adhesionType 제거
			// t.configure[adNo].adType = (config.adType && typeof config.adType == 'string') ? config.adType : 'inline';
			// adType 받는 부분 sdk 내부로 전환(t.slot에 추가).2015.10.22.uyuni
			t.configure[adNo].adType = t.slot[adNo].type;

			switch(t.configure[adNo].adType) {
				case 'inline' :
					if(!t.configure[adNo].adhesionType || t.configure[adNo].adhesionType.indexOf('Copy') > 0) {
						// errorHandler throw 구문 빠짐에 의한 return false 추가.2015.10.07.uyuni
						if(!config.targetId || typeof config.targetId != 'string') { t.Util.errorHandler('No Target Element ID.'); return false; }
						t.configure[adNo].target = config.targetId;
					} else {
						t.configure[adNo].target = false;
					}
					break;

				case 'floating' :
					t.configure[adNo].target = false;
					t.configure[adNo].adhesionType = false;
					t.configure[adNo].position = (config.position && typeof config.position == 'object') ? config.position : '';
					break;

				case 'interstitial' :
					t.configure[adNo].adhesionType = false;
					t.configure[adNo].target = false;
					break;
			}

			t.isTest = (typeof config.test == 'boolean' && config.test === true) ? true : false;
			if(t.isTest) {
				t.adRequestUrl = t.testUrl.adRequestUrl;
				t.adLogUrl = t.testUrl.adLogUrl;
				t.creativeHost = t.testUrl.creativeHost;
				t.adPolicyUrl = t.testUrl.adPolicyUrl;
			}
			t.configure[adNo].blank = (typeof config.newWindow == 'boolean' && config.newWindow === true) ? 'Y' : 'N';
			// 소재로 새창여부를 넘기기 위해 다시 선언(기존것 고칠시간이 부족 ㅠㅠ).2015.11.17.uyuni
			// 소재에서 처리됨으로 iSO 7이하도 문제 없어서 상단 선언
			t.configure[adNo].k_blank = t.configure[adNo].blank;
			// iOS7 block popup issue.2014.04.21.uyuni
			// iOS7 version up : blank = 'N'
			if(t.os == 'iOS') {
				if(t.Util.getDiffVer(t.d_os_ver) >= 70000) {
					t.configure[adNo].blank = 'N';
				}
			}
			t.configure[adNo].errorCallback = (config.errorCallback && typeof config.errorCallback == 'function') ? config.errorCallback : function() {};
			t.configure[adNo].actionCallback = (config.actionCallback && typeof config.actionCallback == 'function') ? config.actionCallback : function() {};
			t.configure[adNo].u_age = (config.age || typeof config.age == 'number') ? config.age : '';
			t.configure[adNo].u_gender = (config.gender || typeof config.gender == 'number') ? config.gender : '';
			t.configure[adNo].u_network_operator = (config.carrier || typeof config.carrier == 'number') ? config.carrier : '';
			t.configure[adNo].isViewLog = false;
			t.configure[adNo].status = 'loading';
			t.configure[adNo].ads = '';
			t.configure[adNo].cps = '';
			t.configure[adNo].debugMode = (window.location.href.indexOf('debug=1') > -1) ? true : false;

			// 기존 debug모드시 log 출력용 console 창 추가.2015.03.02.uyuni
			// 기존 debugMode를 전역으로 변경
			t.debugMode = t.configure[adNo].debugMode;
			if(t.debugMode) {
				var query = t.Util.getUrlParam();
				// target 있다면 초기화..
				if(t.Util.$(query.console)) {
					t.Util.$(query.console).innerHTML = '';
					t.consoleMode = true;
					t.consoleId = query.console;
				} else {
					t.consoleMode = false;
				}
			}
			//<<
			t.configure[adNo].m_isViwibleOnScroll = (typeof config.inVisibleOnScroll == 'boolean' && config.inVisibleOnScroll === true) ? true : false;
			//>>

				// ios/webview 3rd cookie error.2014.08.20.uyuni
				// log전송시 d_uid값 빈값전송에 따른 c_uid값으로 변경.2014.08.22.uyuni
				// undefined로 저장된 녀석을 제거를 위해 추가.2015.06.09.uyuni
				//t.configure[adNo].c_uid = (t.Util.getCookie('TAD_DUID')) ? t.Util.getCookie('TAD_DUID') : '';
				// mNate hybridApp용 inApp SDK에서 d_uid값 전달.2015.06.04.uyuni
				// 우선 순위 : 1. 매체에서 전달받은 d_uid, 2. Cookie의 TAD_DUID, 3.ad_response값의 DUID
				// d_uid값 꼬임에 의해 우선순위 변경.2015.08.17.uyuni
				// ad_request 후 서버 response값으로 무조건 쿠키 다시 저장하도록 로직 변경
				// 우선 순위 : 1. 매체에서 전달받은 d_uid값 2. ad_response값의 d_uid값 3. Cookie의 TAD_DUID
				//t.configure[adNo].deviceId = (config.deviceId && typeof config.deviceId == 'string') ? config.deviceId : '';
			// SAID SDK 연동 방식 개선.2016.01.27.uyuni
			// jira : http://jira.skplanet.com/browse/SAI-54
			// 우선 순위 : 1. 매체에서 전달받은 deviceId, 2. SyrupAdInterface SAID 조회값, 3. Cookie에 저장된 값, 4. 빈값
			t.configure[adNo].c_uid = (t.Util.getCookie('TAD_DUID') && t.Util.getCookie('TAD_DUID') != 'undefined') ? t.Util.getCookie('TAD_DUID') : '';
			t.configure[adNo].c_uid = (window.SyrupAdInterface) ? window.SyrupAdInterface.getDeviceId() : t.configure[adNo].c_uid;
			t.configure[adNo].c_uid = (config.deviceId && typeof config.deviceId == 'string') ? config.deviceId : t.configure[adNo].c_uid;


			// Z-Index 값을 설정할 수 있는 기능을 제공하고 Z-Index Guidelines 제공.2015.11.10.uyuni
			// zIndex default : inline - 'off', interstitial - 6,000,000,  floating - 2,000,000
			// zIndexOfAdhesion default : inline - 5,000
			// zIndexOfExpanded default : inline - 6,000,000, floating - 6,000,000
			// 사용자가 설정한 값이 없다면 default값으로 처리.
			var zAttr, zDefault = t.zIndex[t.configure[adNo].adType];
			for(zAttr in zDefault) {
				if(config[zAttr] && config[zAttr] != 'undefined') {
					switch(typeof config[zAttr]) {
						case 'string' :
							t.configure[adNo][zAttr] = (config[zAttr] == 'off') ? 'off' : zDefault[zAttr];
							break;
						case 'number' :
							t.configure[adNo][zAttr] = (config[zAttr] > 0) ? config[zAttr] : zDefault[zAttr];
							break;
						default :
							t.configure[adNo][zAttr] = zDefault[zAttr];
					}
				} else {
					t.configure[adNo][zAttr] = zDefault[zAttr];
				}
				t.Util.logHandler(t.configure[adNo].adType + ' zIndex config : ' + zAttr + ' : ' + t.configure[adNo][zAttr]);
			}
			// t.Util.logHandler(t.configure[adNo].adType + ' : zIndex : ' + t.configure[adNo].zIndex);
			// t.Util.logHandler(t.configure[adNo].adType + ' : zIndexOfAdhesion : ' + t.configure[adNo].zIndexOfAdhesion);
			// t.Util.logHandler(t.configure[adNo].adType + ' : zIndexOfExpanded : ' + t.configure[adNo].zIndexOfExpanded);

			// userUrl 설정.2015.07.31.uyuni
			// 사용자가 설정한 adrequest, adpolicy, adlog 서버로 변경
			t.configure[adNo].userUrl = (config.userUrl && typeof config.userUrl == 'object') ? config.userUrl : {};
			var svr, checkList = t.configure[adNo].userUrl;
			for(svr in checkList) {
				if(checkList[svr] && t[svr]) {
					t[svr] = checkList[svr];
					t.Util.logHandler('변경된 서버 : ' + svr + ' - ' + checkList[svr]);
				}
			}

			return true;
		},
		/**
		 * 정책 정보 가져오기.
		 *
		 * @param {number} Unique ad Number.
		 */
		getAdPolicy : function(adNo) {
			if(t.configure[adNo].status === 'expanded' || t.configure[adNo].status === 'resized') return false;
			t.Util.logHandler('PolicyManager : localStorage 사용 여부 : ' + useLocalStorage);
			// policy 구분을 slotNo에서 clientID로 변경.2015.10.16.uyuni
			var clientId = t.configure[adNo].m_client_id;
			if(useLocalStorage) {
				// policy 구분을 slotNo에서 clientID로 변경.2015.10.16.uyuni
				var revision = (t.Util.getCookie('TAD_POLICY_REVISION_' + clientId) && t.Util.getCookie('TAD_POLICY_REVISION_' + clientId) != 'undefined') ? t.Util.getCookie('TAD_POLICY_REVISION_' + clientId) : '';
				t.configure[adNo].frequency = revision;
				t.Util.logHandler('PolicyManager : 저장된 revision : ' + revision);
				// 저장된 policy가 있다면...
				if(revision && revision != -1) {
					// policy 구분을 slotNo에서 clientID로 변경.2015.10.16.uyuni
					t.Util.logHandler('PolicyManager : 저장된 policy : ' + ls.getItem('tad_policy_' + clientId));
					var tad_policy = (ls.getItem('tad_policy_' + clientId)) ? JSON.parse(ls.getItem('tad_policy_' + clientId)) : {'option':''};
					this.checkAdPolicy(adNo, tad_policy.options);
				// 저장된 policy가 no Policy
				} else if(revision && revision == -1) {
					t.Util.logHandler('PolicyManager : no policy');
					this.getAdInfo(adNo);
				} else {
					t.Util.logHandler('PolicyManager : ad policy 가져오기');
					var url = (t.adPolicyUrl.indexOf('?') > 0) ? t.adPolicyUrl + '&' : t.adPolicyUrl + '?';
					var param = t.Util.configToParam(t.configure[adNo], t.adPolicyParam);

					// tad_response를 tad_policy_response로 변경
					param = param.replace('tad_response', 'tad_policy_response');

					var scriptEl = document.createElement('SCRIPT');
					scriptEl.setAttribute('type', 'text/javascript');
					scriptEl.setAttribute('id', 'tad_policy_' + adNo);
					scriptEl.setAttribute('src', url + param);
					document.getElementsByTagName('HEAD')[0].appendChild(scriptEl);
				}
			} else {
				t.Util.logHandler('PolicyManager : localStorage 지원 안함.');
				this.getAdInfo(adNo);
			}
		},
		/**
		 * 정책 확인 밎 적용하기
		 *
		 * @param {number} Unique ad Number.
		 * @param {object} Response Policy info.
		 */
		checkAdPolicy : function(adNo, policy) {
			t.Util.logHandler('PolicyManager : checkAdPolicy ' +  JSON.stringify(policy));
			// 로직오류로 인한 canRequest 제거.2015.10.07.uyuni
			//t.configure[adNo].canRequest = true;
			for(var option in policy) {
				t.Util.logHandler('PolicyManager : load policy type : ' +  option);
				var i;
				switch(option) {
					case 'blacklist' :
						if(t.configure[adNo].c_uid && policy[option].hasOwnProperty('duid') && typeof policy[option].duid == 'object' && policy[option].duid.length > 0) {
							var duidList = policy[option].duid;
							for(i in duidList) {
								if(t.configure[adNo].c_uid == duidList[i]) {
									t.configure[adNo].errorCallback(1); // error callback
									t.Util.errorHandler('INVALID_REQUEST');
									t.Util.logHandler('PolicyManager : request is denied by blacklist.duid : ' + duidList[i]);
									return false;
								}
							}
						}
						if(policy[option].hasOwnProperty('media') && typeof policy[option].media == 'object' && policy[option].media.length > 0) {
							var hostList = policy[option].media;
							for(i in hostList) {
								// hostname : m.abc.com, host : m.abc.com:8080, ex) m.abc.com
								if(window.location.hostname == hostList[i]) {
									t.configure[adNo].errorCallback(1); // error callback
									t.Util.errorHandler('INVALID_REQUEST');
									t.Util.logHandler('PolicyManager : request is denied by blacklist.media : ' + hostList[i]);
									return false;
								}
							}
						}
						break;
					case 'reject' :
						var includeVer;
						// sdk version 정보가 있다면 해당 버전만 reject 조건 확인
						if((policy[option].hasOwnProperty('sdk') && typeof policy[option].sdk == 'object' && policy[option].sdk.length > 0) || (policy[option].hasOwnProperty('sdk_from') && policy[option].sdk_from) || (policy[option].hasOwnProperty('sdk_to') && policy[option].sdk_to)) {
							includeVer = false;
							if(policy[option].hasOwnProperty('sdk') || typeof policy[option].hasOwnProperty('sdk') == 'object') {
								var chkVer = policy[option].sdk;
								for(i in chkVer) {
									if(t.m_sdk_ver == chkVer[i]) {
										includeVer = true;
									}
								}
							}
							var curVer = t.Util.getDiffVer(t.m_sdk_ver);
							var fromVer, toVer;
							if((policy[option].hasOwnProperty('sdk_from') && policy[option].sdk_from) && (policy[option].hasOwnProperty('sdk_to') && policy[option].sdk_to)) {
								fromVer = t.Util.getDiffVer(policy[option].sdk_from);
								toVer = t.Util.getDiffVer(policy[option].sdk_to);
								if((curVer >= fromVer) && (curVer <= toVer)) {
									includeVer = true;
								}
							} else if(policy[option].hasOwnProperty('sdk_from') && policy[option].sdk_from) {
								fromVer = t.Util.getDiffVer(policy[option].sdk_from);
								if(curVer >= fromVer) {
									includeVer = true;
								}
							} else if(policy[option].hasOwnProperty('sdk_to') && policy[option].sdk_to) {
								toVer = t.Util.getDiffVer(policy[option].sdk_to);
								if(curVer <= toVer) {
									includeVer = true;
								}
							}
						// sdk version 조건이 없다면 모두 reject 조건 확인
						} else {
							includeVer = true;
						}
						t.Util.logHandler('PolicyManager : reject SDK 버전 포함 여부 : ' + includeVer);
						// reject 조건 체크
						if(includeVer) {
							//t.configure[adNo].canRequest = this.checkFrequency(adNo, policy[option], 'req');
							if(!this.checkFrequency(adNo, policy[option], 'req')) {
								return false;
							}
						}

						break;
					case 'frequency_req' :
						//t.configure[adNo].canRequest = this.checkFrequency(adNo, policy[option], 'req');
						if(!this.checkFrequency(adNo, policy[option], 'req')) {
							return false;
						}
						break;
					case 'frequency_imp' :
						//t.configure[adNo].canRequest = this.checkFrequency(adNo, policy[option], 'imp');
						if(!this.checkFrequency(adNo, policy[option], 'imp')) {
							return false;
						}
						break;
				}
			}

			t.Util.logHandler('PolicyManager : 광고요청');
			this.getAdInfo(adNo);
			// 로직오류로 인한 canRequest 제거.2015.10.07.uyuni
			/*
			if(t.configure[adNo].canRequest) {
				t.Util.logHandler('PolicyManager : 광고요청');
				this.getAdInfo(adNo);
			}
			*/
		},
		/**
		 * Frequency 조건 확인하기
		 *
		 * @param {number} Unique ad Number.
		 * @param {object} Policy info
		 * @param {string} req/imp type
		 */
		checkFrequency : function(adNo, policy, fType) {
			var type = (fType && fType == 'imp') ? 'imp' : 'req';
			// policy 구분을 slotNo에서 clientID로 변경.2015.10.16.uyuni
			var clientId = t.configure[adNo].m_client_id;
			// history
			// policy 구분을 slotNo에서 clientID로 변경.2015.10.16.uyuni
			var tad_frequency_history = (ls.getItem('tad_frequency_history_' + clientId)) ? JSON.parse(ls.getItem('tad_frequency_history_' + clientId)) : {};
			if(tad_frequency_history.hasOwnProperty(type) && tad_frequency_history[type].length > 0) {
				var type_history = (tad_frequency_history.hasOwnProperty(type)) ? tad_frequency_history[type] : {};
				var i, il;

				// history 최대치는 99(고M), 이후는 삭제.2015.06.26.uyuni
				if(type_history.length > 99) {
					tad_frequency_history[type] = type_history.slice(type_history.length-99, type_history.length);
					// policy 구분을 slotNo에서 clientID로 변경.2015.10.16.uyuni
					ls.setItem('tad_frequency_history_' + clientId, JSON.stringify(tad_frequency_history));
					// 삭제후 history 다시 갱신.2015.08.06.uyuni
					type_history = tad_frequency_history[type];
				}

				// daily count check
				if(policy.hasOwnProperty('daily') && typeof policy.daily == 'number' && policy.daily != -1) {
					var now = new Date();
					var today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
					var daily_count = 0;
					for(i=0,il=type_history.length;i<il;i++) {
						if(type_history[i] >= today) {
							daily_count = daily_count + 1;
						}
					}
					if(daily_count >= policy.daily) {
						// FrequencyOver시에도 errorCallback 1 추가.2015.03.19.uyuni
						t.configure[adNo].errorCallback(1); // error callback
						t.Util.logHandler(type + '. daily 설정이 over하였습니다.');
						t.Util.errorHandler('Frequency over.');
						return false;
					}
				}

				// period limit check
				if((policy.hasOwnProperty('period') && typeof policy.period == 'number' && policy.period != -1) && (policy.hasOwnProperty('limit') && typeof policy.limit == 'number' && policy.limit != -1)) {
					var checkTime = new Date().getTime() - (policy.period * 1000); // 1,000 mSec = 1 sec

					var period_count = 0;
					for(i=0,il=type_history.length;i<il;i++) {
						if(type_history[i] >= checkTime) {
							period_count = period_count + 1;
						}
					}
					if(period_count >= policy.limit) {
						// FrequencyOver시에도 errorCallback 1 추가.2015.03.19.uyuni
						t.configure[adNo].errorCallback(1); // error callback
						t.Util.logHandler(type + '. period limit 설정이 over하였습니다.');
						t.Util.errorHandler('Frequency over.');
						return false;
					}
				}
			}

			// weight
			if((policy.hasOwnProperty('weight') && typeof policy.weight == 'number' && policy.weight != -1)) {
				var chance = Math.round(Math.random()*100);
				t.Util.logHandler('PolicyManager : 설정 weight : ' + policy.weight + ' : random chance : ' + chance);
				if(chance >= policy.weight) {
					// FrequencyOver시에도 errorCallback 1 추가.2015.03.19.uyuni
					t.configure[adNo].errorCallback(1); // error callback
					t.Util.logHandler(type + '. weight limit 설정이 over하였습니다.');
					t.Util.errorHandler('Frequency over.');
					return false;
				}
			}
			return true;
		},
		/**
		 * 광고 정보 가져오기.
		 *
		 * @param {number} Unique ad Number.
		 */
		getAdInfo : function(adNo) {
			if(t.configure[adNo].status === 'expanded' || t.configure[adNo].status === 'resized') return false;

			// dailyFrequency 체크
			// dailyFrequency 기능 제거.2015.08.18.uyuni
			/*
			if(typeof t.configure[adNo].dailyFrequency =='number' && t.configure[adNo].dailyCount >= t.configure[adNo].dailyFrequency) {
				// FrequencyOver시에도 errorCallback 1 추가.2015.03.19.uyuni
				t.configure[adNo].errorCallback(1); // error callback
				t.Util.errorHandler('The DailyFrequency limit may have been reached.');
				return false;
			}
			*/

			var url = (t.adRequestUrl.indexOf('?') > 0) ? t.adRequestUrl + '&' : t.adRequestUrl + '?';
			var param = t.Util.configToParam(t.configure[adNo], t.adRequestParam);

			// log전송시 d_uid값 빈값전송에 따른 c_uid값으로 변경.2014.08.22.uyuni
			// c_uid값을 연동규격서 d_uid값으로 변경
			param = param.replace('&c_uid=', '&d_uid=');

			var scriptEl = document.createElement('SCRIPT');
			scriptEl.setAttribute('type', 'text/javascript');
			scriptEl.setAttribute('id', 'tad_' + adNo);
			scriptEl.setAttribute('src', url + param);
			document.getElementsByTagName('HEAD')[0].appendChild(scriptEl);

			// impression 초기화
			t.configure[adNo].isViewLog = false;

			// Frequency 기준을 impression에서 request로 변경(No Ads 포함).2014.12.22.uyuni
			// DailyFrequency Count++;
			// dailyFrequency 기능 제거.2015.08.18.uyuni
			/*
			if(t.configure[adNo].dailyFrequency && t.configure[adNo].dailyFrequency != -1) {
				t.configure[adNo].dailyCount = Number(t.configure[adNo].dailyCount) + 1;
				t.Util.setCookieOneday('TAD_DAILY_COUNT', t.configure[adNo].dailyCount);
			}
			*/

			// req frequency 설정시.2015.06.25.uyuni
			// frequency 설정만 있다면 무조건 저장(고M과 협의완료).2015.08.06.uyuni
			// if(t.configure[adNo].frequency && t.configure[adNo].frequency.hasOwnProperty('req')) {
			if(t.configure[adNo].frequency && t.configure[adNo].frequency != -1) {
				this.setFrequencyLog('req', adNo);
			}
		},
		/**
		 * 광고 체크 및 Ad exChange 처리
		 *
		 * @param {number} Unique ad Number.
		 * @param {object} Response Ad info.
		 */
		checkAd : function(adNo, rtn) {
			var status = '';

			// TAD_DUID값 저장위치 변경.2016.03.14.uyuni
			// No AD시 d_uid값 저장 요구로 인해 checkAd에서 저장하는 로직으로 변경
			// viewAd에서 checkAd로 로직 변경
			t.Util.setCookie('TAD_DUID', rtn.d_uid, 365);

			// policy revision 체크.2015.08.07.uyuni
			var cur_revision = (t.configure[adNo].frequency) ? t.configure[adNo].frequency : -1;
			var next_revision = (rtn.hasOwnProperty('m_policy')) ? rtn.m_policy : -1;

			// policy 구분을 slotNo에서 clientID로 변경.2015.10.16.uyuni
			var clientId = t.configure[adNo].m_client_id;

			// revision이 다르다면 기존 policy 제거, m_policy값이 빈값이면 현상유지.2015.08.13.uyuni
			// policy 구분을 slotNo에서 clientID로 변경.2015.10.16.uyuni
			if(next_revision !== '' && cur_revision != next_revision) {
				t.Util.logHandler('PolicyManager : revision이 갱신되어 삭제');
				t.Util.setCookie('TAD_POLICY_REVISION_' + clientId, -1, -1);
			}

			// Error Check
			for(status in t.responseErrorCode) {
				if(rtn.ret_code == status) {
					t.configure[adNo].errorCallback(rtn.ret_code); // error callback
					t.Util.errorHandler(t.responseErrorCode[status]);
					return false;
				}
			}
			// errorHandler throw 구문 빠짐에 의한 return false 추가.2015.10.07.uyuni
			if(!rtn.d_uid) { t.Util.errorHandler(t.responseErrorCode[0]); return false; }
			t.adInfo[adNo] = rtn;
			var url = t.adInfo[adNo].c_url;

			// Ad Exchange 2014.11.01.uyuni
			// URL Scheme로 분기
			// Adbay - adbay://
			var ad_protocol = (url.indexOf('://') > -1) ? url.split('://')[0] : 'http';

			// Debug Mode.2014.01.15.uyuni
			// GET String으로 받은 URL과 bg값을 광고로 대처
			// Log는 Test서버로 전송하여 실서비스 영향없도록 처리
			// adbay 분기처리와 함께 상단으로 위치 조정.2014.11.06.uyuni
			// debugMode일때 개발서버 로그 전송 삭제(고M과 협의).2015.08.10.uyuni
			/*
			if (t.configure[adNo].debugMode) {
				var query = t.Util.getUrlParam();
				if (query.url) {
					url = decodeURIComponent(query.url);
				}
				if (query.bg) {
					t.adInfo[adNo].c_data.backfill_color = query.bg;
				}
				t.adLogUrl = t.testUrl.adLogUrl;

				// debug모드는 ad exchange 처리 하지 않음.2014.11.06.uyuni
				// query.url이 있을 경우만 아닐때 adbay광고 노출시 빈화면.2015.03.04.uyuni
				if (query.url) {
					ad_protocol = 'http';
				}
			}
			*/

			var adbay_request, adbay_param, adbay_total_param, scriptEl;

			//return false;
			switch(ad_protocol) {
				// adbay non-targeting.2015.06.08.uyuni
				case 'adbay_n' :
					switch(t.configure[adNo].m_slot) {
						// floating 추가.2015.04.29.uyuni
						case 103 :
							adbay_request = 'http://adapi.about.co.kr/mad/jsonp/skplad/board01/bottom_left?';
							adbay_param = 'host=http://www.adotsolution.com&uis=sb&limit=1';
							break;
						// inline // default
						case 2 :
							adbay_request = 'http://adapi.about.co.kr/mad/jsonp/skplad/article01/top_middle?';
							// mweb 쇼핑박스 요청 추가(소재도 추가).2015.10.05.uyuni
							adbay_param = 'host=http://www.adotsolution.com&uis=sb,bn&limit=1';
							break;
						default :
							adbay_request = 'http://adapi.about.co.kr/mad/jsonp/skplad/article01/top_middle?';
							// mweb 쇼핑박스 요청 추가(소재도 추가).2015.10.05.uyuni
							adbay_param = 'host=http://www.adotsolution.com&uis=sb,bn&limit=1';
							break;
					}
					adbay_total_param = Base64.encode(adbay_param) + '&callback=tad_adbay_response&cbp=' + encodeURIComponent('adNo=' + adNo);

					scriptEl = document.createElement('SCRIPT');
					scriptEl.setAttribute('type', 'text/javascript');
					scriptEl.setAttribute('id', 'tad_adbay_' + adNo);
					scriptEl.setAttribute('src', adbay_request + adbay_total_param);
					document.getElementsByTagName('HEAD')[0].appendChild(scriptEl);

					// adbay protocol http로 변경
					t.adInfo[adNo].c_url = url.replace('adbay_n://', 'http://');
					break;
				// adbay r-targeting.2015.06.08.uyuni
				case 'adbay_r' :
					switch(t.configure[adNo].m_slot) {
						// floating 추가.2015.04.29.uyuni
						case 103 :
							adbay_request = 'http://adapi.about.co.kr/mad/jsonp/skplad/board01/bottom_left?';
							adbay_param = 'host=http://www.adotsolution.com&uis=sb&limit=1';
							break;
						// inline // default
						case 2 :
							adbay_request = 'http://adapi.about.co.kr/mad/jsonp/skplad/article02/top_middle?';
							adbay_param = 'host=http://www.adotsolution.com&uis=bn&limit=1';
							break;
						default :
							adbay_request = 'http://adapi.about.co.kr/mad/jsonp/skplad/article02/top_middle?';
							adbay_param = 'host=http://www.adotsolution.com&uis=bn&limit=1';
					}
					adbay_total_param = Base64.encode(adbay_param) + '&callback=tad_adbay_response&cbp=' + encodeURIComponent('adNo=' + adNo);

					scriptEl = document.createElement('SCRIPT');
					scriptEl.setAttribute('type', 'text/javascript');
					scriptEl.setAttribute('id', 'tad_adbay_' + adNo);
					scriptEl.setAttribute('src', adbay_request + adbay_total_param);
					document.getElementsByTagName('HEAD')[0].appendChild(scriptEl);

					// adbay protocol http로 변경
					t.adInfo[adNo].c_url = url.replace('adbay_r://', 'http://');
					break;
				// adbay.2014.11.01.uyuni
				case 'adbay' :
					switch(t.configure[adNo].m_slot) {
						// floating 추가.2015.04.29.uyuni
						case 103 :
							adbay_request = 'http://adapi.about.co.kr/mad/jsonp/skplad/board01/bottom_left?';
							adbay_param = 'host=http://www.adotsolution.com&uis=sb&limit=1';
							break;
						// inline // default
						case 2 :
							adbay_request = 'http://adapi.about.co.kr/mad/jsonp/skplad/article02/top_middle?';
							adbay_param = 'host=http://www.adotsolution.com&uis=bn&limit=1';
							break;
						default :
							adbay_request = 'http://adapi.about.co.kr/mad/jsonp/skplad/article02/top_middle?';
							adbay_param = 'host=http://www.adotsolution.com&uis=bn&limit=1';
					}
					adbay_total_param = Base64.encode(adbay_param) + '&callback=tad_adbay_response&cbp=' + encodeURIComponent('adNo=' + adNo);

					scriptEl = document.createElement('SCRIPT');
					scriptEl.setAttribute('type', 'text/javascript');
					scriptEl.setAttribute('id', 'tad_adbay_' + adNo);
					scriptEl.setAttribute('src', adbay_request + adbay_total_param);
					document.getElementsByTagName('HEAD')[0].appendChild(scriptEl);

					// adbay protocol http로 변경
					t.adInfo[adNo].c_url = url.replace('adbay://', 'http://');
					break;

				//mable.2015.03.07.uyuni
				case 'mable' :
					var mable_request = 'http://ad.parrot.mable-inc.com/tad/ad_call?';
					var mable_param, mable_total_param, mable_os;
					switch(t.configure[adNo].m_slot) {
						// interstitial
						case 3 :
							mable_param = 'sid1=80e662c742157be78056994ed28ec9c2&sid2=&sid3=&w=320&h=480&t=';
							mable_os = (t.os === 'iOS') ? 'Tad_full/interstitial/network@webios' : 'Tad_full/interstitial/network@webandroid';
							break;
						// floating
						case 103 :
							mable_param = 'sid1=d34316ad9065dd767bc09eb454eddf62&sid2=&sid3=&w=100&h=100&t=';
							mable_os = (t.os === 'iOS') ? 'Tad_pop/floating/network@webios' : 'Tad_pop/floating/network@webandroid';
							break;
						// inline // default
						case 2 :
							mable_param = 'sid1=ff168506abdc659990c4285c01cf4bca&sid2=&sid3=&w=320&h=50&t=';
							mable_os = (t.os === 'iOS') ? 'Tad/banner/network@webios' : 'Tad/banner/network@webandroid';
							break;
						default :
							mable_param = 'sid1=ff168506abdc659990c4285c01cf4bca&sid2=&sid3=&w=320&h=50&t=';
							mable_os = (t.os === 'iOS') ? 'Tad/banner/network@webios' : 'Tad/banner/network@webandroid';
					}
					mable_total_param = mable_param + mable_os + '&uid=&cid=&cb=tad_mable_response&cbp=' + encodeURIComponent('adNo='+adNo);

					scriptEl = document.createElement('SCRIPT');
					scriptEl.setAttribute('type', 'text/javascript');
					scriptEl.setAttribute('id', 'tad_mable_' + adNo);
					scriptEl.setAttribute('src', mable_request + mable_total_param);
					document.getElementsByTagName('HEAD')[0].appendChild(scriptEl);

					// adbay protocol http로 변경
					t.adInfo[adNo].c_url = url.replace('mable://', 'http://');

					break;

				//Tad.2015.05.11.uyuni
				case 'testad' :
					var testad_request = 'http://dcd.adotsolution.com/ad_req/mweb.skp?';
					var testad_param = 'cb=tad_testad_response&cbp=' + encodeURIComponent('adNo='+adNo);

					scriptEl = document.createElement('SCRIPT');
					scriptEl.setAttribute('type', 'text/javascript');
					scriptEl.setAttribute('id', 'tad_testad_' + adNo);
					scriptEl.setAttribute('src', testad_request + testad_param);
					document.getElementsByTagName('HEAD')[0].appendChild(scriptEl);

					// testad protocol http로 변경
					t.adInfo[adNo].c_url = url.replace('testad://', 'http://');

					break;

				// http.2014.11.01.uyuni
				case 'http' :
					t.AdView.viewAd(adNo, rtn);
					break;
			}
		},
		/**
		 * 광고 노출
		 *
		 * @param {number} Unique ad Number.
		 * @param {object} Response Ad info.
		 */
		viewAd : function(adNo, rtn) {

			var logConfig = t.Util.merge2Object(rtn, t.configure[adNo]);
			var param = t.Util.configToParam(logConfig, t.adClickLogParam);
			var url = t.adInfo[adNo].c_url;
			var wrapEl, adEl, aUrl, css, position;

			// ios/webview 3rd cookie error.2014.08.20.uyuni
			// SVR에서 생성하는 3rd Cookie Error로 인해 Frequency 제어 오류로
			// SDK에서 Cookie 생성 후 다음 Request에 전달.
			// log전송시 d_uid값 빈값전송에 따른 c_uid값으로 변경.2014.08.22.uyuni
			// if(t.configure[adNo].c_uid == '') {
			// 	t.Util.setCookie('TAD_DUID', t.adInfo[adNo].d_uid, 365);
			// }
			// d_uid값 꼬임에 의해 우선순위 변경.2015.08.17.uyuni
			// ad_request 후 서버 response값으로 무조건 쿠키 다시 저장하도록 로직 변경
			// TAD_DUID값 저장위치 변경.2016.03.14.uyuni
			// No AD시 d_uid값 저장 요구로 인해 checkAd에서 저장하는 로직으로 변경
			// t.Util.setCookie('TAD_DUID', t.adInfo[adNo].d_uid, 365);
			t.Util.logHandler('ad_response d_uid  : ' + t.adInfo[adNo].d_uid);
			t.Util.logHandler(url);

			// iframe 방식 -> iframe innerHTML
			url += (url.indexOf('?') > -1) ? '&' : '?';
			url += param;

			// c_type은 광고 소재 종류로 광고 사이즈와 무관하므로 수정.2014.05.28.uyuni
			//var size = t.slot[t.adInfo[adNo].c_type];
			var size = t.slot[t.configure[adNo].m_slot];

			// Android Gingerbread iframe bug로 인해 slot size 고정
			// floating 배너경우 with:100%시 오류로 인해 수정.2014.10.07.uyuni
			if (t.configure[adNo].adType == 'inline' && !(t.isAndroid && t.ua.indexOf('2.3') > -1)) {
				size.width = '100%';
			}

			// floating && interstitial 적용.2014.05.26.uyuni
			// adType에 따른 광고 호출 방법 분기 처리
			switch(t.configure[adNo].adType) {
				// 기존 Logic 그대로 적용
				case 'inline' :
					var targetEl;
					// adhesion Mode
					if(t.configure[adNo].adhesionType) {
						var adhesionTargetEl = document.getElementsByTagName('BODY')[0];
						// 사용자 정의 zIndex값 적용.2015.11.10.uyuni
						// var css = {'position':'fixed','left':0,'bottom':0,'zIndex':'9999'};
						css = {'position':'fixed','left':0,'bottom':0};
						if(t.configure[adNo].zIndexOfAdhesion != 'off') {
							css.zIndex = t.configure[adNo].zIndexOfAdhesion;
						}
						wrapEl = this.createWrap(adNo, 'adhesion', 0, size.height, css);
						this.setBackground(wrapEl, this.getBackground(adNo));
						aUrl = url.replace('adNo='+adNo, 'adNo='+adNo+'A');
						// history back시 chrome iframe 갱신되지않는 문제를 위해 iframe onload 이벤트 추가로 viewAdLog 실행시점 변경.2015.06.04.uyuni
						//wrapEl.appendChild(this.createAd(adNo, aUrl, 'adhesion', size, this.viewAdLog(adNo)));
						// errorHandler throw 구문 빠짐에 의한 return false 추가와 로직 분리.2015.10.07.uyuni
						//wrapEl.appendChild(this.createAd(adNo, aUrl, 'adhesion', size));
						adEl = this.createAd(adNo, aUrl, 'adhesion', size);
						if(!adEl) return false;
						wrapEl.appendChild(adEl);
						// DC인사이드 손실률 50% 현상으로 인해 imp.위치 수정.2015.06.11.uyuni
						this.viewAdLog(adNo);
						adhesionTargetEl.appendChild(wrapEl);

						this.addScrollEvent(adNo, t.configure[adNo].adhesionType);

						// scrollTopCopy/alwaysCopy 경우
						if(t.configure[adNo].adhesionType.indexOf('Copy') > 0) {
							targetEl = t.Util.$(t.configure[adNo].target);
							this.setBackground(targetEl, this.getBackground(adNo));
							var tUrl = url.replace('adNo='+adNo, 'adNo='+adNo+'T');
							// errorHandler throw 구문 빠짐에 의한 return false 추가와 로직 분리.2015.10.07.uyuni
							//targetEl.appendChild(this.createAd(adNo, tUrl, 'default', size, ''));
							var adSEl = this.createAd(adNo, tUrl, 'default', size, '');
							if(!adSEl) return false;
							targetEl.appendChild(adSEl);
						}
					// Basic Mode
					} else {
						targetEl = t.Util.$(t.configure[adNo].target);
						//this.setBackground(targetEl, this.getBackground(adNo));
						// manualNotifyView 모드 추가(조선일보용).2014.07.16
						//url = url + '&manualNotifyView=' + t.configure[adNo].manualNotifyView;
						// history back시 chrome iframe 갱신되지않는 문제를 위해 iframe onload 이벤트 추가로 viewAdLog 실행시점 변경.2015.06.04.uyuni
						//targetEl.appendChild(this.createAd(adNo, url, 'default', size, this.viewAdLog(adNo)));
						// errorHandler throw 구문 빠짐에 의한 return false 추가와 로직 분리.2015.10.07.uyuni
						//targetEl.appendChild(this.createAd(adNo, url, 'default', size));
						/*
						var adEl = this.createAd(adNo, url, 'default', size);
						if(!adEl) return false;
						targetEl.appendChild(adEl);
						// DC인사이드 손실률 50% 현상으로 인해 imp.위치 수정.2015.06.11.uyuni
						this.viewAdLog(adNo);
						*/
						t.configure[adNo].status = 'loaded';
						t.configure[adNo].c_url = url;

						this.addScrollEvent(adNo, 'lazyView');

						t.Util.logHandler('Slot ' + adNo + ' lazyView & scroll Event 추가');
					}
					break;

				case 'floating' :

					var floatingTargetEl = document.getElementsByTagName('BODY')[0];
					position = this.getPosition(t.configure[adNo].position);
					// 사용자 정의 zIndex값 적용.2015.11.10.uyuni
					// zIndex 처리
					// Danawa 슬라이드 메뉴에서 floating 최상단 뜨는 문제로 긴급처리.2014.12.01.uyuni
					//var css = {'position':'fixed','width':size.width + 'px','height':size.height+'px','zIndex':'9999'};
					css = {'position':'fixed','width':size.width + 'px','height':size.height+'px'};
					if(t.configure[adNo].zIndex != 'off') {
						css.zIndex = t.configure[adNo].zIndex;
					}
					css[position.hAxis] = position.offsetX + 'px';
					css[position.vAxis] = position.offsetY + 'px';
					wrapEl = this.createWrap(adNo, 'floating', size.width, size.height, css);

					aUrl = url.replace('adNo='+adNo, 'adNo='+adNo+'F');
					// history back시 chrome iframe 갱신되지않는 문제를 위해 iframe onload 이벤트 추가로 viewAdLog 실행시점 변경.2015.06.04.uyuni
					//wrapEl.appendChild(this.createAd(adNo, aUrl, 'floating', size, this.viewAdLog(adNo)));
					// errorHandler throw 구문 빠짐에 의한 return false 추가와 로직 분리.2015.10.07.uyuni
					//wrapEl.appendChild(this.createAd(adNo, aUrl, 'floating', size));
					adEl = this.createAd(adNo, aUrl, 'floating', size);
					if(!adEl) return false;
					wrapEl.appendChild(adEl);
					// DC인사이드 손실률 50% 현상으로 인해 imp.위치 수정.2015.06.11.uyuni
					this.viewAdLog(adNo);
					floatingTargetEl.appendChild(wrapEl);

					// 개발자가 invisibleOnScroll을 설정한경우 EventListener를 등록한다. 
					this.addScrollEvent(adNo, 'inVisibleOnScroll');	
					if(t.configure[adNo].inVisibleOnScroll) {
						
					}
					
					break;

				// interstitial 확인 필요 2014.09.01.uyuni
				case 'interstitial' :

					var interstitialTargetEl = document.getElementsByTagName('BODY')[0];
					position = this.getPosition(t.configure[adNo].position);
					var docHeight = t.Util.getDocHeight();
					docHeight = (docHeight > size.height) ? docHeight : size.height;

					// 사용자 정의 zIndex값 적용.2015.11.10.uyuni
					// zIndex값 default값 변경 interstitial : 9,999 -> 6,000,000(IAB 참고,고매니저님요청).2015.11.04.uyuni
					// var css = {'position':'absolute','zIndex':'6000000'};
					css = {'position':'absolute','width':'100%','height':docHeight+'px','left':'0px','top':'0px','background-color':'rgba(0, 0, 0, 0.7)'};
					if(t.configure[adNo].zIndex != 'off') {
						css.zIndex = t.configure[adNo].zIndex;
					}
					wrapEl = this.createWrap(adNo, 'interstitial', size.width, size.height, css);

					aUrl = url.replace('adNo='+adNo, 'adNo='+adNo+'I');
					// history back시 chrome iframe 갱신되지않는 문제를 위해 iframe onload 이벤트 추가로 viewAdLog 실행시점 변경.2015.06.04.uyuni
					//wrapEl.appendChild(this.createAd(adNo, aUrl, 'interstitial', size, this.viewAdLog(adNo)));
					// errorHandler throw 구문 빠짐에 의한 return false 추가와 로직 분리.2015.10.07.uyuni
					//wrapEl.appendChild(this.createAd(adNo, aUrl, 'interstitial', size));
					adEl = this.createAd(adNo, aUrl, 'interstitial', size);
					if(!adEl) return false;
					wrapEl.appendChild(adEl);
					// DC인사이드 손실률 50% 현상으로 인해 imp.위치 수정.2015.06.11.uyuni
					this.viewAdLog(adNo);
					interstitialTargetEl.appendChild(wrapEl);

					// close 버튼 SDK 추가.2015.02.25.uyuni
					wrapEl.appendChild(this.createCloseButton(adNo, 'interstitial'));
					// 상단으로 위치 조정(고M과 협의).2015.03.02.uyuni
					window.scrollTo(0, 1);
					break;
			}

			if(t.configure[adNo].adhesionType || t.configure[adNo].adType != 'inline') {
				// imp frequency 설정시.2015.06.25.uyuni
				// if(t.configure[adNo].frequency && t.configure[adNo].frequency.hasOwnProperty('imp')) {
				// frequency 설정만 있다면 무조건 저장(고M과 협의완료).2015.08.06.uyuni
				if(t.configure[adNo].frequency && t.configure[adNo].frequency != -1) {
					this.setFrequencyLog('imp', adNo);
				}

				t.configure[adNo].status = 'default';
				this.addClickEvent(adNo);
				this.addPageShowHideEvent();
			}
		},
		createAd : function(adNo, url, type, size, callback) {
			//if(!adNo || typeof adNo != 'number') { t.Util.errorHandler('AdNo Error.'); return false; }
			// errorHandler throw 구문 빠짐에 의한 return false 추가.2015.10.07.uyuni
			if(!url || typeof url != 'string') { t.Util.errorHandler('ad Url Error.'); return false; }
			if(!size || typeof size != 'object' || size.width == 'undefined' || size.height == 'undefined') { t.Util.errorHandler('Slot Size Error.'); return false; }
			var typeName = (type && typeof type == 'string') ? type : 'default';
			var callbackFn = (callback && typeof callback == 'function') ? callback : function() {};
			var ad = document.createElement('IFRAME');
			ad.setAttribute('id', typeName + 'Ad_' + adNo);
			ad.setAttribute('src', url);
			ad.setAttribute('width', size.width);
			ad.setAttribute('height', size.height);
			ad.setAttribute('frameBorder', 0);
			// history back시 chrome iframe 갱신되지않는 문제를 위해 iframe onload 이벤트 추가로 viewAdLog 실행시점 변경.2015.06.04.uyuni
			// onload시 해쉬태그 추가시 실제 변경된 iframe 가져오는 것으로 확인하여 변경.
			//ad.onlaod = callback;
			t.Util.addEvent(ad, 'load', function(e) {
				// Chrome만 체크해서 적용.2015.06.08.uyuni
				// Android 일부하위버전(갤S3등등) 기본브라우저에서 history back시 #태그 붙은 iframe을 새로 가져오지 않는 문제 발생(image 노출X, 클릭됨)
				if(t.ua.toLowerCase().indexOf('chrome') > -1) {
					var dummy = t.Util.getUnique();
					this.src = url + '#reload' + dummy;
				}
				// DC인사이드 손실률 50% 현상으로 인해 imp.위치 수정.2015.06.11.uyuni
				//t.AdView.viewAdLog(adNo);
			});
			if(typeName == 'floating') {
				ad.setAttribute('ALLOWTRANSPARENCY', true);
			}
			ad.style.display = 'block';
			ad.style.margin = '0 auto';
			if(typeName == 'interstitial') {
				var winSize = t.Util.getWindowSize();
				var marginTop = Math.round((winSize.height - size.height)/2);
				marginTop = (marginTop < 0) ? 0 : marginTop;
				ad.style.marginTop = marginTop + 'px';
			}

			t.activeFrame.push(ad);

			return ad;
		},
		createWrap : function(adNo, type, width, height, style) {
			var wrap = document.createElement('DIV'), k = '';
			wrap.setAttribute('id', type + 'Wrap_' + adNo);
			wrap.style.width = (width === 0) ? '100%' : width + 'px';
			wrap.style.height = height + 'px';
			if(style && typeof style == 'object') {
				for(k in style) {
					wrap.style[k] = style[k];
				}
			}
			return wrap;
		},
		createCloseButton : function(adNo, adType) {
			var btn = document.createElement('DIV');
			// 사용자 정의 zIndex값 적용.2015.11.10.uyuni
			// zIndex 제거(interstitial div에 포함).2015.11.10.uyuni
			// var css = {'position':'absolute','zIndex':'9999','width':'50px','height':'50px','right':'0px','top':'0px'};
			var css = {'position':'absolute','width':'50px','height':'50px','right':'0px','top':'0px'};
			var k = '';
			btn.setAttribute('id', 'adCloseBtn_' + adNo);
			for(k in css) {
				btn.style[k] = css[k];
			}

			var img = document.createElement('IMG');
			img.setAttribute('src', 'http://adddn.adotsolution.com/contents/sdk/img/tad_close.png');
			img.setAttribute('width', 50);
			img.setAttribute('height', 50);
			img.setAttribute('alt', 'close');
			btn.appendChild(img);

			t.Util.addEvent(btn, 'click', t.Effect.close.bind(this, adNo, adType));

			return btn;

		},
		getBackground : function(adNo) {
			return (!adNo && adNo != 'number') ? false : t.adInfo[adNo].c_data.backfill_color;
		},
		setBackground : function(target, bgColor) {
			if(bgColor) target.style.background = bgColor;
		},
		/**
		 * Floating Positon 잡기
		 *
		 * @param {object} position info.
		 */
		getPosition : function(pObj) {
			if(!pObj && typeof pObj !== 'object') return false;

			var axis = (pObj.baseline && typeof pObj.baseline == 'string') ? pObj.baseline.split('-') : '';
			var hAxis = (typeof axis == 'object' && axis[0] == 'right') ? 'right' : 'left';
			var vAxis = (typeof axis == 'object' && axis[1] == 'bottom') ? 'bottom' : 'top';
			var offsetX = (pObj.offsetX && typeof pObj.offsetX == 'number') ? pObj.offsetX : 0;
			var offsetY = (pObj.offsetY && typeof pObj.offsetY == 'number') ? pObj.offsetY : 0;

			return {'hAxis':hAxis, 'vAxis':vAxis, 'offsetX':offsetX, 'offsetY':offsetY};
		},
		/**
		 * send ad view log
		 *
		 * @param {number} Unique Ad Number.
		 */
		viewAdLog : function(adNo) {
			if(t.configure[adNo].isViewLog) return false;
			var logInfo = {'k_event':0};
			// mable imp 처리로직을 추가.2015.06.02.uyuni
			if(t.adInfo[adNo].x_imp_tracking_url) {
				logInfo.x_tracking_url = t.adInfo[adNo].x_imp_tracking_url;
			}
			var logConfig = t.Util.merge2Object(t.Util.merge2Object(t.adInfo[adNo], t.configure[adNo]), logInfo);
			var param = t.Util.configToParam(logConfig, t.adLogParam);
			var url = (t.adLogUrl.indexOf('?') > -1) ? t.adLogUrl + '&' : t.adLogUrl + '?';
			url += param;
			this.sendLog(url);
			t.configure[adNo].isViewLog = true;
			t.Util.logHandler('viewLog : ' + url);
		},
		/**
		 * Send Ad Click Log
		 *
		 * @param {number} Unique Ad Number.
		 */
		clickAdLog : function(adNo, eCode) {
			if(!eCode) eCode = 1;
			var logInfo = {'k_event':eCode};
			var logConfig = t.Util.merge2Object(t.Util.merge2Object(t.adInfo[adNo], t.configure[adNo]), logInfo);
			var param = t.Util.configToParam(logConfig, t.adClickLogParam);
			var url = (t.adLogUrl.indexOf('?') > -1) ? t.adLogUrl + '&' : t.adLogUrl + '?';
			url += param;
			this.sendLogIfrm(adNo, url);
			t.Util.logHandler('clickLog : ' + url);
		},
		/**
		 * Send Ad Click Log & Send Status Child Iframe.
		 *
		 * @param {number} Unique Ad Number.
		 */
		clickAdLogIfrm : function(adNo, e) {
			//if(!e.code || typeof e.code != 'number') return false;
			if(!e.code) return false;
			this.clickAdLog(adNo, e.code);
		},
		/**
		 * 클릭 로그 전송후 오픈 이벤트 처리 201305032128.uyuni
		 *
		 * @param {number} Unique Ad Number.
		 */
		clickAdLogIfrm2 : function(adNo, action) {
			var logInfo = {'k_event':1};
			var logConfig = t.Util.merge2Object(t.Util.merge2Object(t.adInfo[adNo], t.configure[adNo]), logInfo);
			var param = t.Util.configToParam(logConfig, t.adClickLogParam);
			var url = (t.adLogUrl.indexOf('?') > -1) ? t.adLogUrl + '&' : t.adLogUrl + '?';
			url += param;
			var ifrmEl = document.createElement('IFRAME');
			ifrmEl.setAttribute('src', url);
			ifrmEl.style.visibility = 'hidden';
			ifrmEl.onload = function() {
				t.Effect.open(adNo, action);
				setTimeout(function() {
					document.getElementsByTagName('BODY')[0].removeChild(ifrmEl);
				}, 800);
			};
			document.getElementsByTagName('BODY')[0].appendChild(ifrmEl);
		},
		/**
		 * Add message Event for iframe Click Event
		 *
		 * @param {number} Unique Ad Number.
		 */
		addClickEvent : function(adNo) {
			// iframe 방식 -> iframe postMessage event binding
			t.Util.addEvent(window, 'message', this.onMessage.bind(this));
		},
		addScrollEvent : function(adNo, type) {
			t.Util.logHandler('addScrollEvent');
			switch(type) {
				case 'scrollTop' :
				case 'scrollTopCopy' :
					t.Util.addEvent(window, 'touchmove', function(){ t.AdView.onScrollTop(adNo); });
					t.Util.addEvent(window, 'scroll', function(){ t.AdView.onScrollTop(adNo); });
					t.AdView.onScrollTop(adNo);
					break;
				case 'alwaysCopy' :
					t.Util.addEvent(window, 'touchmove', function(){ t.AdView.onScrollAlways(adNo); });
					t.Util.addEvent(window, 'scroll', function(){ t.AdView.onScrollAlways(adNo); });
					t.AdView.onScrollAlways(adNo);
					break;
				case 'lazyView' :
					t.Util.addEvent(window, 'touchmove', function(){ t.AdView.onScrollView(adNo); });
					t.Util.addEvent(window, 'scroll', function(){ t.AdView.onScrollView(adNo); });
					t.AdView.onScrollView(adNo);
					break;
				case 'inVisibleOnScroll' :
					// t.Util.addEvent(window, 'touchmove', function(){ t.AdView.inVisibleOnScrollViewMove(adNo); });
					t.Util.addEvent(window, 'scroll', function(){ t.AdView.inVisibleOnScrollViewScroll(adNo); });
					// t.Util.addEvent(window, 'touchend', function(){ t.AdView.visibleOnScrollView(adNo); });
				break;

				default :
			}
		},
		addPageShowHideEvent : function() {
			if(t.isIos || t.isAndroid) {
				t.Util.addEvent(window, 'pageshow', function(e) {
					if(e.persisted) {
						for(var i=0,il=t.activeFrame.length;i<il;i++) {
							t.activeFrame[i].setAttribute('src', t.activeFrame[i].src);
						}
					}
				});
				t.Util.addEvent(window, 'pagehide', function(e) {
					if(e.persisted) {
						for(var i=0,il=t.adNo.length;i<il;i++) {
							t.Effect.allClose(t.adNo[i]);
						}
					}
				});
			}
		},
		onScrollTop : function(adNo) {
			var adhesionWrap = t.Util.$('adhesionWrap_' + adNo) || '';
			if(!adhesionWrap || t.configure[adNo].status != 'default' && t.configure[adNo].status != 'loading') return false;
			if(window.scrollY > 1) {
				adhesionWrap.style.display = 'none';
			} else {
				adhesionWrap.style.display = 'block';
			}
		},
		onScrollAlways : function(adNo) {
			var adhesionWrap = t.Util.$('adhesionWrap_' + adNo) || '';
			if(!adhesionWrap || t.configure[adNo].status != 'default' && t.configure[adNo].status != 'loading') return false;
			var winSize = t.Util.getWindowSize();
			var currentScrollBottom = t.Util.getScrollY() + winSize.height - t.slot[t.configure[adNo].m_slot].height;
			var targetScrollTop = t.Util.getTargetScrollY(t.configure[adNo].target);
			if(currentScrollBottom > targetScrollTop) {
				adhesionWrap.style.display = 'none';
			} else {
				adhesionWrap.style.display = 'block';
			}
		},
		onScrollView : function(adNo) {
			if(t.configure[adNo].status != 'loaded') return false;
			//var wrapEl = t.Util.$('slideWrap_' + adNo) || '';
			var targetEl = t.Util.$(t.configure[adNo].target);
			var size = t.slot[t.configure[adNo].m_slot];
			var url = t.configure[adNo].c_url;
			var winSize = t.Util.getWindowSize();
			var currentScrollBottom = t.Util.getScrollY() + winSize.height;
			var targetScrollTop = t.Util.getTargetScrollY(targetEl);

			// t.Util.logHandler('window.innerHeight : ' + window.innerHeight
			// + '\n\ndocument.documentElement.clientHeight : ' + document.documentElement.clientHeight
			// + '\n\n현재 화면해상도 : ' + winSize.height
			// + '\n\n현재 스크롤 위치(bottom) : ' + currentScrollBottom
			// + '\n\n광고의 스크롤 위치값 : ' + targetScrollTop);

			if(currentScrollBottom >= targetScrollTop) {
				t.Util.logHandler('Slot ' + adNo + ' 현재스크롤 높이 : ' + currentScrollBottom + 'px');
				t.Util.logHandler('Slot ' + adNo + ' 광고영역 높이 : ' + targetScrollTop + 'px');
				t.Util.logHandler('Slot ' + adNo + ' onScrollView : 실제 광고 노출');

				// 추가.2015.10.29.uyuni.설명추가 바람
				t.AdView.setBackground(targetEl, t.AdView.getBackground(adNo));

				setTimeout(function() {
					//wrapEl.style.height = size.height + 'px';
					targetEl.appendChild(t.AdView.createAd(adNo, url, 'default', size));
				}, 100);
				// DC인사이드 손실률 50% 현상으로 인해 imp.위치 수정.2015.06.11.uyuni
				t.AdView.viewAdLog(adNo);

				// imp frequency 설정시.2015.06.25.uyuni
				// if(t.configure[adNo].frequency && t.configure[adNo].frequency.hasOwnProperty('imp')) {
				// frequency 설정만 있다면 무조건 저장(고M과 협의완료).2015.08.06.uyuni
				if(t.configure[adNo].frequency && t.configure[adNo].frequency != -1) {
					t.AdView.setFrequencyLog('imp', adNo);
				}

				t.configure[adNo].status = 'default';
				t.AdView.addClickEvent(adNo);
				t.AdView.addPageShowHideEvent();
			}
		},

		// inVisibleOnScrollViewMove : function(adNo) {
		// 	t.Util.logHandler('inVisibleOnScrollViewMove');
		// 	document.getElementById('floating' + 'Wrap_' + adNo).style.visibility = "hidden";
		// },

		
		inVisibleOnScrollViewScroll : function(adNo) {
			t.Util.logHandler('inVisibleOnScrollViewScroll');

			document.getElementById('floating' + 'Wrap_' + adNo).style.visibility = "hidden";
 			
 			if(timer !== null) {
        		clearTimeout(timer);        
    		}

    		timer = setTimeout(function() {
				document.getElementById('floating' + 'Wrap_' + adNo).style.visibility = "visible";

			}, 150);
		},

		// visibleOnScrollView : function(adNo) {
		// 	t.Util.logHandler('visibleOnScrollView');
		// 	document.getElementById('floating' + 'Wrap_' + adNo).style.visibility = "visible";
		// },

		/**
		 *
		 *
		 */
		onMessage : function(e) {
			// errorHandler throw 구문 빠짐에 의한 return false 추가.2015.10.07.uyuni
			if(!e || typeof e != 'object') { t.Util.errorHandler('onMessage Param Error.'); return false; }
			// message host check && owner check.2015.04.16.uyuni
			var owner = (t.isIE && window.JSON) ? JSON.parse(e.data.owner) : e.data.owner;
			if(t.Util.inArray(e.origin, t.creativeHost) === false && owner != 'syrupad') {
				t.Util.logHandler('onMessage : ' + e.origin);
				return false;
			}
			var adNo = (t.isIe && window.JSON) ? JSON.parse(e.data).adNo : e.data.adNo;
			var adType = (adNo.indexOf('A') > 0) ? 'adhesion' : (adNo.indexOf('F') > -1) ? 'floating' : 'target';
			adNo = (typeof adNo == 'string') ? parseInt(adNo) : adNo;
			var type = (t.isIe && window.JSON) ? JSON.parse(e.data).type : e.data.type;

			if(type == 'event') {
				// 100번대 이벤트(부분확장/전체확장)의 경우만 report통계용으로 처리 2013.09.25.uyuni
				var evt = (t.isIe && window.JSON) ? JSON.parse(e.data).event : e.data.event;
				if(Math.round(evt.code/100) == 1) {
					this.clickAdLogIfrm(adNo, evt);
				}

			} else {
				var msgObj = (t.isIe && window.JSON) ? JSON.parse(e.data) : e.data;
				var isEventMode = msgObj.hasOwnProperty('trigger');
				var trigger = (isEventMode) ? msgObj.trigger : msgObj.action.trigger;
				var url = msgObj.hasOwnProperty('url') ? msgObj.url : '';
				var height = msgObj.hasOwnProperty('height') ? msgObj.height : 0;
				var width = msgObj.hasOwnProperty('width') ? msgObj.width : 0;
				var action;

				var eventCode = (isEventMode) ? msgObj.eventCode : 0;

				t.Util.logHandler('slotNo : ' + adNo + ' : ' + trigger + ' - ' + eventCode);

				switch(trigger) {
					case 'open' :
						action = (isEventMode) ? {'url':msgObj.url} : msgObj.action;
						// Mable Mediation에서 클릭 로그 전달을 위해 x_tracking_click_url값 추가.2015.03.24.uyuni
						// x_tracking_click_url -> x_tracking_url로 변경.2015.05.13.uyuni
						// 소재내부 object는 x_tracking_click_url 유지, log parameter는 x_tracking_url 변경.
						// Mable에서 클릭로그 안 잡히는 오류 발생.2015.05.27.uyuni
						// 여기선 x_tracking_click_url로 유지 하며 실제 open Method에서 x_tracking_url로 변경.
						// onMessage에선 들어온 변수명 그대로 전달, 실제 동작함수에서 param을 위해 변수명 변경.
						// tad_mable_response에서 adInfo로 저장후 처리로 변경.2015.06.02.uyuni
						/*
						if(isEventMode && msgObj.hasOwnProperty('x_tracking_click_url')) {
							action.x_tracking_click_url = msgObj.x_tracking_click_url;
						}
						*/
						// Android Chrome 최신버전(버전40이상(대략)) 클릭후 1초 딜레이시 랜딩 막히는 문제로 제거.2015.10.13.uyuni
						//setTimeout(function(){ t.Effect.open(adNo, action, eventCode); }, 100);
						t.Effect.open(adNo, action, eventCode);
						break;
					case 'expand':
						action = (isEventMode) ? {'url':msgObj.url, 'width':width, 'height':height} : msgObj.action;
						t.Effect.expand(adNo, adType, action);
						if(isEventMode) this.clickAdLog(adNo, eventCode);
						break;
					case 'resize':
						action = (isEventMode) ? {'url':msgObj.url, 'width':width, 'height':height} : msgObj.action;
						t.Effect.resize(adNo, adType, action);
						if(isEventMode) this.clickAdLog(adNo, eventCode);
						break;
					case 'close' :
						t.Effect.close(adNo, adType);
						break;
					case 'event' :
						if(isEventMode) this.clickAdLog(adNo, eventCode);
						break;
					case 'onload' :
						var targetEl;
						// mable adexchange의 경우 floating/interstitial이 있어 target 없음.
						if(t.configure[adNo].adType == 'inline') {
							targetEl = t.Util.$(t.configure[adNo].target).getElementsByTagName('IFRAME')[0];
						} else {
							targetEl = t.Util.$(t.configure[adNo].adType + 'Wrap_' +adNo).getElementsByTagName('IFRAME')[0];
						}
						// 소재 전달을 위한 object로 adexchange로 변경.2015.03.19.uyuni
						//targetEl.contentWindow.postMessage(t.adbayInfo, '*');
						targetEl.contentWindow.postMessage(t.adExchageInfo[adNo], '*');
						break;
					// re-targeting 상품의 경우 x_products를 추가하기 위한 별도의 trigger.2015.01.08.uyuni
					case 'openWithProduct' :
						action = (isEventMode) ? {'url':msgObj.url,'x_products':msgObj.x_products} : msgObj.action;
						setTimeout(function(){ t.Effect.open(adNo, action, eventCode); }, 100);
						break;
					// SyrupAd landing Type 정리에서 추가.2015.04.16.uyuni
					// iOS가 아닐 경우 android로 default, market주소와 alternative가 없을 경우 중단.
					case 'download' :
						action = {};
						url = '';
						if(t.os == 'iOS') {
							url = (msgObj.download.itunes) ? msgObj.download.itunes : msgObj.download.alternative;
						} else {
							url = (msgObj.download.market) ? msgObj.download.market : msgObj.download.alternative;
						}
						if(!url) return false;
						action.url = url;
						// Mable Mediation에서 클릭 로그 전달을 위해 x_tracking_click_url값 추가.2015.03.24.uyuni
						// x_tracking_click_url -> x_tracking_url로 변경.2015.05.13.uyuni
						// 소재내부 object는 x_tracking_click_url 유지, log parameter는 x_tracking_url 변경.
						// Mable에서 클릭로그 안 잡히는 오류 발생.2015.05.27.uyuni
						// 여기선 x_tracking_click_url로 유지 하며 실제 open Method에서 x_tracking_url로 변경.
						// onMessage에선 들어온 변수명 그대로 전달, 실제 동작함수에서 param을 위해 변수명 변경.
						// tad_mable_response에서 adInfo로 저장후 처리로 변경.2015.06.02.uyuni
						/*
						if(isEventMode && msgObj.hasOwnProperty('x_tracking_click_url')) {
							action.x_tracking_click_url = msgObj.x_tracking_click_url;
						}
						*/
						setTimeout(function(){ t.Effect.open(adNo, action, eventCode); }, 100);
						break;

				}
			}
		},
		/**
		 * image를 이용한 log
		 *
		 * @param {string} log Url.
		 */
		sendLog : function(url) {
			if(!url || typeof url != 'string') return false;
			var img = new Image();
			img.src = url;
		},
		/**
		 * iframe을 이용한 log(Click으로 인한 페이지이동시 사용).
		 *
		 * @param {number} Unique Ad Number.
		 * @param {string} log Url.
		 */
		sendLogIfrm : function(adNo, url) {
			var ifrmEl = document.createElement('IFRAME');
			ifrmEl.setAttribute('src', url);
			ifrmEl.style.visibility = 'hidden';
			ifrmEl.onload = function() {
				setTimeout(function() {
					document.getElementsByTagName('BODY')[0].removeChild(ifrmEl);
				}, 500);
			};
			document.getElementsByTagName('BODY')[0].appendChild(ifrmEl);
		},
		/**
		 * frequency용 req/imp count/history를 localStorage에 저장
		 *
		 * @param{string} req/imp type
		 * @param {number} Unique Ad Number.
		 */
		setFrequencyLog : function(type, adNo) {
			if(!type || typeof type != 'string') return false;
			var clientId = t.configure[adNo].m_client_id;
			var tad_frequency_history = (ls.getItem('tad_frequency_history_' + clientId)) ? JSON.parse(ls.getItem('tad_frequency_history_' + clientId)) : {};
			if(!tad_frequency_history.hasOwnProperty(type)) {
				tad_frequency_history[type] = [];
			}
			var now = new Date().getTime();
			tad_frequency_history[type].push(now);
			t.Util.logHandler(type + ' Frequency history 저장 : ' + now);
			t.Util.logHandler('저장된 Frequency history : ' + JSON.stringify(tad_frequency_history));
			ls.setItem('tad_frequency_history_' + clientId, JSON.stringify(tad_frequency_history));
		}
	};
	t.Util = {
		/**
		 * Getting element html object
		 *
		 * @param {string} element id
		 * @param {object} element html object
		 */
		$ : function(id) {
			return (typeof id == 'string') ? document.getElementById(id) : id;
		},
		addEvent : function(target, type, callback) {
			// window의 경우만 중복 event 적용 제거(2개의 광고의 경우).2015.05.13.uyuni
			if(target == window && type != 'scroll') {
				if(t.addedListeners[type]) return false;
			}
			if(window.attachEvent) { // ie
				target.attachEvent('on'+type, callback);
			} else {
				target.addEventListener(type, callback, false);
			}
			// window의 경우만 중복 event 적용 제거(2개의 광고의 경우).2015.05.13.uyuni
			if(target == window) {
				t.addedListeners[type] = callback;
			}
		},
		/**
		 * Generate Unique random number based on Timestamp.
		 *
		 * @return {number} 13-digit Number.
		 */
		getUnique : function() {
			return new Date().getTime() + Math.round(Math.random() * 1234567890) + 'S5';
		},
		/**
		 * Analysis Device Infomation.
		 *
		 */
		analysisDeviceInfo : function() {
			// 해상도 정보추가.15.08.25.uyuni
			var winSize = t.Util.getWindowSize();
			var density = (window.devicePixelRatio) ? window.devicePixelRatio : 1;
			var device_w = (winSize.width) ? Math.round(winSize.width * density) : 0;
			var device_h = (winSize.height) ? Math.round(winSize.height * density) : 0;
			var resolution = device_w + 'x' + device_h + 'x' + density;
			var ver;
			t.d_resolution = resolution;

			switch(t.os) {
				case 'Android' :
					ver = t.ua.match(/android (\d+(?:\.\d+){1,2})/i);
					t.d_os_ver = ver[1];
					if(t.ua.indexOf('Build') > -1) {
						t.d_model = t.ua.match(/([\w\-]+)\sbuild/i)[1];
					}
					t.d_os_name = '1';
					break;
				case 'iOS' :
					ver = t.ua.match(/os (\d+)_(\d+)_?(\d+)?/i);
					t.d_os_ver = ver[1] + '.' + ver[2] + '.' + parseInt(ver[3] || 0, 10);
					t.d_model = t.ua.match(/\(+([\w]+)\;/i)[1];
					t.d_os_name = '2';
					break;
				case 'windowPhone' :
					t.d_os_name = '3';
					break;
				default :
					t.d_os_name = '0';
			}
		},
		/**
		 * configure object To queryString Parameter.
		 *
		 * @param {object} configure object
		 * @param {array} requirement parameter key
		 * @return {string} queryString Parameter.
		 */
		configToParam : function(config, requireParam) {
			var str = '', val = '', key = '', prop = '';
			for(key in requireParam) {
				prop = requireParam[key];
				// nate toktok error 대응 201304302010.uyuni
				if(typeof prop != 'string') break;
				if(t.commonParam.indexOf(prop) > -1) {
					val = (t[prop] === null) ? '' : t[prop];
					str += prop + '=' + encodeURIComponent(val) + '&';
				} else {
					val = (config[prop] === null || config[prop] === undefined) ? '' : config[prop];
					str += prop + '=' + encodeURIComponent(val) + '&';
				}
			}
			return (str.length > 0) ? str.slice(0, str.length-1) : str;
		},
		/**
		 * Merge 2 object
		 *
		 * @param {object} 1st target object
		 * @param {object} 2nd target object
		 * @return {object} merged object
		 */
		merge2Object : function(obj1, obj2) {
			if(!obj1 || typeof obj1 != 'object' || !obj2 || typeof obj2 != 'object') this.errorHandler('merge2Object Method - incorrect param.');
			var tmp = {}, attr = '';
			for(attr in obj1) { tmp[attr] = obj1[attr]; }
			for(attr in obj2) { tmp[attr] = obj2[attr]; }
			return tmp;
		},
		/**
		 * Handling Error Message.
		 *
		 * @param {string} Error Message
		 */
		errorHandler : function(msg) {
			var title = 'T-Ad SDK : ';
			if(t.isTest === true) {
				alert(title + msg);
				//return false;
			} else {
				console.log(title + msg);
			}
		},
		/**
		 * 현재 윈도우 사이즈 측정
		 *
		 * @return {object} 현재 윈도우 width|height
		 */
		getWindowSize : function() {
			return {
				'width' : window.innerWidth || document.documentElement.clientWidth,
				'height' : window.innerHeight || document.documentElement.clientHeight
			};
		},
		/**
		 * 현재 스크롤 위치값 측정
		 *
		 * @return {number} 스크롤Y값
		 */
		getScrollY : function() {
			var scrollY = 0;
			if(typeof window.pageYOffset == 'number') {
				scrollY = window.pageYOffset;
			} else if(document.body && document.body.scrollTop) {
				scrollY = document.body.scrollTop;
			} else if(document.documentElement || document.documentElement.scrollTop) {
				scrollY = document.documentElement.scrollTop;
			}
			return scrollY;
		},
		/**
		 *
		 *
		 */
		getTargetScrollY : function(target) {
			var el = this.$(target);
			var elTop = el.offsetTop;
			while (el==el.offsetParent) {
				elTop += el.offsetTop;
			}
			return elTop;
		},
		/**
		 * 광고 구분을 위한 ads 추출
		 *
		 * @param{string} x_bypass
		 * @return {number} ads number
		 */
		getAds : function(bypass) {
			if(!bypass && typeof bypass == 'string') return false;
			var ads = 0, adsStr = '', tmp = bypass.split('&');
			for(var i=0,il=tmp.length;i<il;i++) {
				if(tmp[i].indexOf('ads') > -1) {
					adsStr = tmp[i];
				}
			}
			if(adsStr) {
				ads = adsStr.slice(4, adsStr.length);
			}

			return ads;
		},
		/**
		 * 광고 구분을 위한 cps 추출
		 *
		 * @param{string} x_bypass
		 * @return {number} cps number
		 */
		getCps : function(bypass) {
			if(!bypass && typeof bypass == 'string') return false;
			var cps = 0, cpsStr = '', tmp = bypass.split('&');
			for(var i=0,il=tmp.length;i<il;i++) {
				if(tmp[i].indexOf('cps') > -1) {
					cpsStr = tmp[i];
				}
			}
			if(cpsStr) {
				cps = cpsStr.slice(4, cpsStr.length);
			}

			return cps;
		},
		/**
		 * URL에서 parameter값 추출
		 *
		 * @return {object} parameter값
		 */
		getUrlParam: function() {
			var url = window.location.href;
			var paramStr = (url.indexOf('?') > -1) ? url.split('?')[1] : "";
			if (paramStr !== "") {
				var paramArr = (paramStr.indexOf('&') > -1) ? paramStr.split('&') : [paramStr];
				var param = {};
				for (var i = 0, il = paramArr.length; i < il; i++) {
					var tmp = paramArr[i].split('=');
					var k = tmp[0];
					var v = tmp[1];
					param[tmp[0]] = tmp[1];
				}
				return param;
			}
		},
		/**
		 * get Diff
		 *
		 */
		getDiffVer : function(ver) {
			if(!ver || typeof ver != 'string') return false;
			if(ver.indexOf('.') < 0) return false;
			var verArr = ver.split('.'),
				verNo = 0,
				multipleNo = 10000;
			for(var i=0,il=verArr.length;i<il;i++) {
				verNo += verArr[i] * multipleNo;
				multipleNo = multipleNo/100;
			}
			return verNo;
		},
		/**
		 * getCookie
		 *
		 * @param {string} Cookie Name
		 * @return {string} Cookie Value
		 */
		getCookie : function(name) {
			var cookieStr, searchName, valueStart, valueEnd;
			cookieStr = ";" + document.cookie.replace(/ /g, "") + ";";
			searchName = ";" + name + "=";
			valueStart = cookieStr.indexOf(searchName);
			if(valueStart != -1) {
				valueStart += searchName.length;
				valueEnd = cookieStr.indexOf(";", valueStart);
				return unescape(cookieStr.substr(valueStart, valueEnd - valueStart));
			}
			return;
		},
		/**
		 * setCookie
		 *
		 * @param {string} Cookie Name
		 * @param {string} Cookie Value
		 * @param {number} Cookie Expires(Day)
		 */
		setCookie : function(name, value, expires) {
			var d = new Date(), day="";
			if(expires) {
				d.setDate(d.getDate()+expires);
				day = "expires="+d.toGMTString()+";";
			}
			document.cookie = name+"="+escape(value)+"; path=/;" + day;
		},
		/**
		 * setCookieOneday
		 *
		 * @param {string} Cookie Name
		 * @param {string} Cookie Value
		 */
		setCookieOneday : function(name, value) {
			var d = new Date(), day = '';
			d.setHours(23);
			d.setMinutes(59);
			d.setSeconds(59);
			day = "expires="+d.toGMTString()+";";
			document.cookie = name+"="+escape(value)+"; path=/;" + day;
		},
		/**
		 * setCookieSec
		 *
		 * @param {string} Cookie Name
		 * @param {string} Cookie Value
		 * @param {number} Cookie Expires(Sec)
		 */
		setCookieSec : function(name, value, expires) {
			var d = new Date(), sec="";
			if(expires) {
				d.setTime(d.getTime()+(expires*1000));
				sec = "expires="+d.toGMTString()+";";
			}
			document.cookie = name+"="+escape(value)+"; path=/;" + sec;
		},
		/**
		 *
		 */
		getDocHeight : function() {
			var D = window.document;
			return Math.max(
				D.body.scrollHeight,
				D.documentElement.scrollHeight,
				D.body.offsetHeight,
				D.documentElement.offsetHeight,
				D.body.clientHeight,
				D.documentElement.clientHeight
			);
		},
		/**
		 * Handling Log Message.
		 *
		 * @param {string} Error Message
		 */
		logHandler : function(msg) {
			if(t.debugMode) {
				var title = 'T-Ad Log : ';
				if(t.consoleMode) {
					t.Util.$(t.consoleId).innerHTML += title + msg + '<br />';
				} else {
					console.log(title + msg);
				}
			}
		},
		/**
		 *
		 */
		param2Object : function(param) {
			if(param == 'undefined' || typeof param != 'string') return {};
			var idx = '', obj = {}, arr = param.split('&');
			for(idx in arr) {
				if(arr[idx].indexOf('=') > -1) {
					obj[arr[idx].split('=')[0]] = arr[idx].split('=')[1];
				}

			}
			return obj;
		},
		/**
		 * check inArray
		 *
		 * @param {string} check host name
		 * @param {array} verify host name list
		 */
		inArray : function(item, arr) {
			if(!arr) {
				return false;
			} else {
				for(var i=0;i<arr.length;i++) {
					if(item == arr[i]) {
						return true;
					}
				}
				return false;
			}
		}
	};
	t.Effect = {
		/**
		 * Ad Link Move
		 *
		 * @param {number} Unique Ad Number.
		 * @param {string} Link Url.
		 */
		open : function(adNo, action, eCode) {

			// 아이오페 리치미디어 사태로 추가. resiz/expand경우 다른 event값으로 redirect. 2013.09.03.uyuni
			// 리치미디어 리포트 통계 대응 1차 수정으로 k_event값 1 -> 200으로 변경 2013.09.25.uyuni
			var k_event = (t.configure[adNo].status == 'resized' || t.configure[adNo].status == 'expanded') ? 1200 : 200;

			// actionWithEvent호출로 eventCode가 넘어오면 eventCode로 전달. 2014.01.15.uyuni
			var eventCode = (typeof eCode =='number' && eCode !== 0) ? eCode : k_event;

			// x_redirect_url encoding 2번하는 문제 수정.2015.04.29.uyuni
			// SDKv3.8.0이하는 encoding 2번, v3.8.1이상은 1번 decoding하도록 서버도 수정됨.
			//var logInfo = {'k_event':eventCode, 'x_redirect_url':encodeURIComponent(action.url)};
			var logInfo = {'k_event':eventCode, 'x_redirect_url':action.url};
			// re-targeting 상품의 경우 x_products를 가지고 오는 경우 x_product 치환.2015.01.08.uyuni
			if(action.hasOwnProperty('x_products')) {
				logInfo.x_products = action.x_products;
			}

			// x_tracking_click_url 값 추가.2015.03.19.uyuni
			// mediation시 3rd 광고업체 click 로그 전송시 사용
			// x_tracking_click_url : 광고주의 클릭 트래킹 로그 url
			// x_tracking_click_url -> x_tracking_url로 변경.2015.05.13.uyuni
			// 소재내부 object는 x_tracking_click_url 유지, log parameter는 x_tracking_url 변경.
			// tad_mable_response에서 adInfo로 저장후 처리로 변경.2015.06.02.uyuni
			/*
			if(action.hasOwnProperty('x_tracking_click_url')) {
				logInfo.x_tracking_url = action.x_tracking_click_url;
			}
			*/

			var logConfig = t.Util.merge2Object(t.Util.merge2Object(t.adInfo[adNo], t.configure[adNo]), logInfo);
			// mable clk 처리로직을 추가.2015.06.02.uyuni
			if(t.adInfo[adNo].x_clk_tracking_url) {
				logConfig.x_tracking_url = t.adInfo[adNo].x_clk_tracking_url;
			}
			var param = t.Util.configToParam(logConfig, t.adClickLogParam);
			var url = (t.adLogUrl.indexOf('?') > -1) ? t.adLogUrl + '&' : t.adLogUrl + '?';
			url += param;

			// self
			if(t.configure[adNo].blank == 'N') {
				if(top !== self) {
					window.top.location = url;
				} else {
					window.location = url;
				}
			} else { // blank
				// 새 창의 경우 A태그 만들어 event trigger로 이동.
				var a = document.createElement('A');
				a.setAttribute('href', url);
				a.setAttribute('target', '_blank');

				var dispatch;
				if(document.createEventObject) { // ie
					dispatch = document.createEventObject();
					a.fireEvent('onclick', dispatch);
				} else { // not ie
					dispatch = document.createEvent('HTMLEvents');
					dispatch.initEvent('click', true, true);
					a.dispatchEvent(dispatch);
				}
			}
		},
		/**
		 * view Expandable Ad
		 *
		 * @param {number} Unique Ad Number.
		 * @param {object} Event object
		 */
		expand : function(adNo, adType, action) {
			var expandFrame = t.Util.$('expandAd_' + adNo);
			if(expandFrame && typeof expandFrame == 'object') {
				window.scrollTo(0, expandFrame.offsetTop);
				return false;
			}

			this.appendExpandFrame(adNo, adType, action);

			// adhesion Ad
			if(t.configure[adNo].adhesionType) {
				var defaultWrap = t.Util.$('adhesionWrap_' + adNo);
				defaultWrap.style.display = 'none';
			}
		},
		/**
		 * make Expandable Ad Frame & Transition.
		 *
		 * @param {number} Unique Ad Number.
		 * @param {object} Event object
		 */
		appendExpandFrame : function(adNo, adType, action) {
			var exFrame = document.createElement('DIV');
			exFrame.setAttribute('id', 'expandAd_' + adNo);
			exFrame.style.position = 'fixed';
			exFrame.style.top = '0px';
			exFrame.style.width = '100%';
			exFrame.style.height = '100%';
			exFrame.style.margin = '0';
			exFrame.style.padding = '0';
			// 사용자 정의 zIndex값 적용.2015.11.10.uyuni
			// exFrame.style.zIndex = '99999';
			if(t.configure[adNo].zIndexOfExpanded != 'off') {
				exFrame.style.zIndex = t.configure[adNo].zIndexOfExpanded;
			}
			exFrame.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
			exFrame.style.webkitTransition = 'all .5s';

			// 확장에서 target 없음.2014.09.5.uyuni
			//var adArea = t.Util.$(t.configure[adNo].target);
			var bodyEl = document.getElementsByTagName('BODY')[0];
			bodyEl.appendChild(exFrame);

			// View Expandable AD after transition
			setTimeout(function() {
				var height = (window.innerHeight > action.height) ? window.innerHeight : action.height;
				action.exHeight = height;
				setTimeout(function() {
					t.Effect.appendExpandAd(adNo, adType, action);
				}, 500);
			}, 100);
		},
		/**
		 * view Expandable Ad iFrame.
		 *
		 * @param {number} Unique Ad Number.
		 * @param {object} Event object
		 */
		appendExpandAd : function(adNo, adType, action) {
			var logConfig = t.Util.merge2Object(t.adInfo[adNo], t.configure[adNo]);
			var param = t.Util.configToParam(logConfig, t.adClickLogParam);
			var url = action.url;
			url += (url.indexOf('?') > -1) ? '&' : '?';
			url += param;

			var type = (adType == 'adhesion') ? 'A' : 'T';
			url = url.replace('adNo='+adNo, 'adNo='+adNo+type);

			var exAd = document.createElement('IFRAME');
			exAd.setAttribute('src', url);
			exAd.setAttribute('width', '100%');
			exAd.setAttribute('height', '100%');
			exAd.setAttribute('frameBorder', 0);
			exAd.setAttribute("scrolling", "no");
			exAd.style.display = 'block';
			exAd.style.margin = '0 auto';
			exAd.onload = function() {
				t.configure[adNo].status = 'expanded';
			};
			document.getElementById('expandAd_' + adNo).appendChild(exAd);
		},
		/**
		 * view Resizable Ad
		 *
		 * @param {number} Unique Ad Number.
		 * @param {object} Event object
		 */
		resize : function(adNo, type, action) {

			var defaultAd, defaultWrap;
			// adhesion Ad
			if(type == 'adhesion') {
				defaultAd = t.Util.$('adhesionAd_' + adNo);
				defaultWrap = t.Util.$('adhesionWrap_' + adNo);
			} else {
				defaultAd = t.Util.$('defaultAd_' + adNo);
				defaultWrap = t.Util.$(t.configure[adNo].target);
			}

			this.appendResizeFrame(adNo, type, action, defaultWrap);
			defaultAd.style.display = 'none';
		},
		/**
		 * make Resizable Ad Frame & Transition.
		 *
		 * @param {number} Unique Ad Number.
		 * @param {object} Event object
		 */
		appendResizeFrame : function(adNo, adType, action, targetEl) {
			// adhesion에서 일반광고부터 resize시 adhesion광고 resize되지 않는 문제로 수정.2015.01.15.uyuni
			var type = (adType == 'adhesion') ? 'A' : 'T';
			var reFrame = document.createElement('DIV');
			// adhesion에서 일반광고부터 resize시 adhesion광고 resize되지 않는 문제로 수정.2015.01.15.uyuni
			reFrame.setAttribute('id', 'resizeAd_' + adNo + type);
			reFrame.style.position = 'relative';
			reFrame.style.width = '100%';
			reFrame.style.height = '0';
			reFrame.style.margin = '0';
			reFrame.style.padding = '0';
			// 사용자 정의 zIndex값 적용.2015.11.10.uyuni
			// expand와 동일한 값 사용
			// reFrame.style.zIndex = '99999';
			if(t.configure[adNo].zIndexOfExpanded != 'off') {
				reFrame.style.zIndex = t.configure[adNo].zIndexOfExpanded;
			}
			reFrame.style.backgroundColor = (t.adInfo[adNo].c_data.backfill_color) ? (t.adInfo[adNo].c_data.backfill_color) : '#000';
			reFrame.style.webkitTransition = 'all .5s';

			var adArea = (targetEl && typeof targetEl == 'object') ? targetEl : t.Util.$(t.configure[adNo].target);
			adArea.style.backgroundColor = '#fff';
			adArea.appendChild(reFrame);

			// View Resizable AD after transition
			setTimeout(function() {
				reFrame.style.height = action.height + 'px';
				adArea.style.height = action.height + 'px';
				setTimeout(function() {
					t.Effect.appendResizeAd(adNo, adType, action);
				}, 500);
			}, 100);
		},
		/**
		 * view Resizable Ad iFrame.
		 *
		 * @param {number} Unique Ad Number.
		 * @param {object} Event object
		 */
		appendResizeAd : function(adNo, adType, action) {
			var logConfig = t.Util.merge2Object(t.adInfo[adNo], t.configure[adNo]);
			var param = t.Util.configToParam(logConfig, t.adClickLogParam);
			var url = action.url;
			url += (url.indexOf('?') > -1) ? '&' : '?';
			url += param;

			var type = (adType == 'adhesion') ? 'A' : 'T';
			url = url.replace('adNo='+adNo, 'adNo='+adNo+type);

			var reAd = document.createElement('IFRAME');
			reAd.setAttribute('src', url);
			reAd.setAttribute('width', action.width);
			reAd.setAttribute('height', action.height);
			reAd.setAttribute('frameBorder', 0);
			reAd.setAttribute("scrolling", "no");
			reAd.style.display = 'block';
			reAd.style.margin = '0 auto';
			reAd.onload = function() {
				t.configure[adNo].status = 'resized';
			};
			// adhesion에서 일반광고부터 resize시 adhesion광고 resize되지 않는 문제로 수정.2015.01.15.uyuni
			document.getElementById('resizeAd_' + adNo + type).appendChild(reAd);
		},
		allClose : function(adNo) {
			if(t.configure[adNo].status == 'loaded') return false;
			var type = (t.configure[adNo].status == 'expanded') ? 'expand' : 'resize';
			var exFrame = t.Util.$(type + 'Ad_' + adNo);
			if(exFrame && typeof exFrame == 'object') {
				var exAd = exFrame.getElementsByTagName('IFRAME')[0];
				exFrame.removeChild(exAd);
				exFrame.style.webkitTransition = 'none';
				exFrame.style.height = '0';
			}
			if(type == 'resize') {
				var height = t.slot[t.configure[adNo].m_slot].height;
				var defaultAd = t.Util.$('defaultAd_' + adNo);
				var defaultWrap = t.Util.$(t.configure[adNo].target);
				if(defaultAd && defaultWrap) {
					defaultWrap.style.height = height + 'px';
					defaultAd.style.display = 'block';
					if(exFrame && exFrame.parentNode == defaultWrap) defaultWrap.removeChild(exFrame);
				}
				var adhesionAd = t.Util.$('adhesionAd_' + adNo);
				var adhesionWrap = t.Util.$('adhesionWrap_' + adNo);
				if(adhesionAd && adhesionWrap) {
					adhesionWrap.style.height = height + 'px';
					adhesionAd.style.display = 'block';
					if(exFrame && exFrame.parentNode == adhesionWrap) adhesionWrap.removeChild(exFrame);
				}
			} else {
				var bodyEl = document.getElementsByTagName('BODY')[0];
				if(exFrame.parentNode == bodyEl) bodyEl.removeChild(exFrame);
			}
			t.configure[adNo].status = 'default';

		},
		/**
		 * expand/resize Frame을 닫는다.
		 *
		 *
		 */
		close : function(adNo, adType) {
			var type = (t.configure[adNo].status == 'expanded') ? 'expand' : 'resize';
			// interstitial Banner 처리.2015.02.25.uyuni
			// 기존에 800ms뒤에 wrap Frame을 제거했지만 interstitial의 경우 dimmed된 배경이 보여 100ms로 변경
			var delay =  800;

			var exFrame, exAd;

			// floating Banner 처리.2014.06.10.uyuni
			// floating의 경우 status는 default, frame name도 Wrap으로 다름.
			if(adType == 'floating') {
				// ex Frame
				type = 'floating';
				exFrame = t.Util.$('floatingWrap_' + adNo);
				exAd = exFrame.getElementsByTagName('IFRAME')[0];
				exFrame.removeChild(exAd);

			// interstitial Banner 처리.2015.02.25.uyuni
			// interstitial 경우 status는 default, frame name도 Wrap도 다르고, delay 타임도 다름.
			} else if(adType == 'interstitial') {
				type = 'interstitial';
				delay =  100;
				exFrame = t.Util.$('interstitialWrap_' + adNo);
				exAd = exFrame.getElementsByTagName('IFRAME')[0];
				exFrame.removeChild(exAd);

			} else {
				var FrameType;
				// adhesion에서 일반광고부터 resize시 adhesion광고 resize되지 않는 문제로 수정.2015.01.15.uyuni
				if(type == 'resize') {
					FrameType = (adType == 'adhesion') ? 'A' : 'T';
				} else {
					FrameType = '';
				}

				// ex Frame
				exFrame = t.Util.$(type + 'Ad_' + adNo + FrameType);
				exAd = exFrame.getElementsByTagName('IFRAME')[0];
				exFrame.removeChild(exAd);
				exFrame.style.height = '0';

				var defaultAd, defaultWrap;
				// adhesion Wrap
				if(adType == 'adhesion') {
					defaultAd = t.Util.$('adhesionAd_' + adNo);
					defaultWrap = t.Util.$('adhesionWrap_' + adNo);
				} else {
					defaultAd = t.Util.$('defaultAd_' + adNo);
					defaultWrap = t.Util.$(t.configure[adNo].target);
				}
			}

			// adhesion이거나 resize type일경우 default 높이 조절
			if(adType == 'adhesion' || type == 'resize') {
				var height = t.slot[t.configure[adNo].m_slot].height;
				setTimeout(function() {
					if(adType == 'adhesion') {
						defaultWrap.style.display = 'block';
					}
					defaultAd.style.display = 'block';
					defaultWrap.style.height = height + 'px';
					defaultWrap.style.backgroundColor = (t.adInfo[adNo].c_data.backfill_color) ? (t.adInfo[adNo].c_data.backfill_color) : '';
				}, 500);
			}
			t.configure[adNo].status = 'default';
			// floating Banner status 처리.2014.12.23.uyuni.
			// destroy시 close한 광고를 찾을 수 있는 방법이 없어 상태에 closed로 변경
			// interstitial Banner도 추가.2015.02.25.uyuni
			if(adType == 'floating' || adType == 'interstitial') {
				t.configure[adNo].status = 'closed';
			}

			// actionCallback close 처리
			t.configure[adNo].actionCallback(1);

			setTimeout(function() {
				var bodyEl = document.getElementsByTagName('BODY')[0];
				if(type == 'expand') {
					bodyEl.removeChild(exFrame);
				} else {
					// floating Banner 처리.2014.06.10.uyuni
					if(adType == 'floating' || adType == 'interstitial') {
						bodyEl.removeChild(exFrame);
					} else {
						defaultWrap.removeChild(exFrame);
					}
				}
			}, delay);
		},
		/**
		 * Banner를 제거(Destroy)한다.
		 *
		 */
		destroy : function(adNo) {

		}
	};
	/**
	 * Developer Function
 	 */
 	/**
 	 * 배너 Destroy 기능
 	 */
 	t.destroy = function(conf) {
 		if(conf.slotNo != 103) return false;
 		var adNo, targetEl;
 		for(adNo in t.configure) {
 			if(t.configure[adNo].m_client_id == conf.clientId && t.configure[adNo].m_slot == conf.slotNo && t.configure[adNo].status == 'default') {
 				if(t.configure[adNo].adType == 'floating') {
 					targetEl = document.getElementById('floatingWrap_' + adNo);
 					if(targetEl) {
 						document.getElementsByTagName('BODY')[0].removeChild(targetEl);
 						t.configure[adNo].status = 'destroyed';
 					}
 					break;
 				}
 			}
 		}
 	};
	// init
	if(window.tad_conf) {
		// Chrome에서 랜딩으로 갔다 back시 Floating배너 close버튼이 동작하지 않는 문제 수정.2014.12.23.uyuni
		// 랜딩후 back시 script는 다시 동작하지만 그전에 불러돈 iframe내용으로 동작하는 버그인듯?
		window.setTimeout(function() {
			TadSdk.AdView.init(tad_conf);
		}, 10);
	}
})();

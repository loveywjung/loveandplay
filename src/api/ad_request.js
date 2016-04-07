(function(){
	var obj = {}, tmp = '', url = window.location.href;
	if(url.indexOf('?') > -1) {
		var query = url.split('?')[1].split('&');
		for(var i=0,il=query.length;i<il;i++) {
			tmp = query[i].split('=');
			obj[tmp[0]] = tmp[1];
		}
	}
	window.adNo = (obj.adNo) ? obj.adNo : 2;
})();
tad_response(window.adNo, {
    "ret_code": "200",
    "d_uid": "VcBQIH8AAAEAAP3RWRUAAAAF",
    "x_bypass": "col1=Vqmm938AAAEAANXzW28AAAAI&col2=&col3=&col5=&uid=VcBQIH8AAAEAAP3RWRUAAAAF&cps=1672&ads=5334&fra=&frd=&adt=0&blt=2&cts=6526&tgs=4538&mds=8757&ccb=0&ctc=&sxb=&age=&bir=&kwd=&ccr=0",
    "x_rid": "Vqmm938AAAEAANXzW28AAAAI",
    "x_products": "",
    "m_policy": "5",
    "c_exposure_time": "0",
    "c_type": "2",
    "c_url": "http:\/\/dev.adotsolution.com\/contents\/html5\/2015\/12\/28\/mweb\/e4aab35177bb2a1533cb5029a2d69f49.html?rid=Vqmm938AAAEAANXzW28AAAAI&mds=6a609d8ca096ba3d8fea29f52eb8bd7118a88c14&k_develop=true",
    "c_data": {
        "base_url": "",
        "encoding_type": "",
        "resolution": "320x50",
        "backfill_color": "#E4471E",
        "backfill_image": ""
    }
});
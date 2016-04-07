tad_policy_response(2, {
    "ret_code": "200",
    "policy": {
        "revision": 5,
        "interval": 59,
        "options": {
            "blacklist": {
                "duid": [""],
                "media": [""]
            },
            "reject": {
                "daily": 3,
                "weight": -1,
                "period": -1,
                "limit": -1,
                "sdk": [],
                "sdk_from": "",
                "sdk_to": ""
            },
            "frequency_req": {
                "daily": -1,
                "weight": -1,
                "period": -1,
                "limit": -1
            },
            "frequency_imp": {
                "daily": -1,
                "weight": -1,
                "period": -1,
                "limit": -1
            }
        }
    }
});
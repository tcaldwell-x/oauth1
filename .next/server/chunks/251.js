"use strict";
exports.id = 251;
exports.ids = [251];
exports.modules = {

/***/ 251:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "m": () => (/* binding */ TwitterOAuth)
/* harmony export */ });
/* harmony import */ var oauth_1_0a__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(522);
/* harmony import */ var oauth_1_0a__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(oauth_1_0a__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var crypto__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(113);
/* harmony import */ var crypto__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(crypto__WEBPACK_IMPORTED_MODULE_1__);


const oauth = new (oauth_1_0a__WEBPACK_IMPORTED_MODULE_0___default())({
    consumer: {
        key: process.env.TWITTER_CONSUMER_KEY,
        secret: process.env.TWITTER_CONSUMER_SECRET
    },
    signature_method: "HMAC-SHA1",
    hash_function (base_string, key) {
        return crypto__WEBPACK_IMPORTED_MODULE_1___default().createHmac("sha1", key).update(base_string).digest("base64");
    }
});
class TwitterOAuth {
    static REQUEST_TOKEN_URL = "https://api.twitter.com/oauth/request_token";
    static AUTHORIZE_URL = "https://api.twitter.com/oauth/authorize";
    static ACCESS_TOKEN_URL = "https://api.twitter.com/oauth/access_token";
    static API_V1_BASE_URL = "https://api.twitter.com/1.1";
    static API_V2_BASE_URL = "https://api.x.com/2";
    static async getRequestToken(callbackUrl) {
        const requestData = {
            url: this.REQUEST_TOKEN_URL,
            method: "POST",
            data: {
                oauth_callback: callbackUrl
            }
        };
        const headers = {
            ...oauth.toHeader(oauth.authorize(requestData)),
            "Content-Type": "application/x-www-form-urlencoded"
        };
        const response = await fetch(this.REQUEST_TOKEN_URL, {
            method: "POST",
            headers,
            body: new URLSearchParams({
                oauth_callback: callbackUrl
            }).toString()
        });
        if (!response.ok) {
            throw new Error(`Failed to get request token: ${response.statusText}`);
        }
        const responseText = await response.text();
        const params = new URLSearchParams(responseText);
        return {
            oauth_token: params.get("oauth_token"),
            oauth_token_secret: params.get("oauth_token_secret"),
            oauth_callback_confirmed: params.get("oauth_callback_confirmed")
        };
    }
    static getAuthorizationUrl(oauthToken) {
        return `${this.AUTHORIZE_URL}?oauth_token=${oauthToken}`;
    }
    static async getAccessToken(oauthToken, oauthTokenSecret, oauthVerifier) {
        const token = {
            key: oauthToken,
            secret: oauthTokenSecret
        };
        const requestData = {
            url: this.ACCESS_TOKEN_URL,
            method: "POST",
            data: {
                oauth_verifier: oauthVerifier
            }
        };
        const headers = {
            ...oauth.toHeader(oauth.authorize(requestData, token)),
            "Content-Type": "application/x-www-form-urlencoded"
        };
        const response = await fetch(this.ACCESS_TOKEN_URL, {
            method: "POST",
            headers,
            body: new URLSearchParams({
                oauth_verifier: oauthVerifier
            }).toString()
        });
        if (!response.ok) {
            throw new Error(`Failed to get access token: ${response.statusText}`);
        }
        const responseText = await response.text();
        const params = new URLSearchParams(responseText);
        return {
            oauth_token: params.get("oauth_token"),
            oauth_token_secret: params.get("oauth_token_secret"),
            user_id: params.get("user_id"),
            screen_name: params.get("screen_name")
        };
    }
    static async makeApiRequest(url, method, accessToken, accessTokenSecret, params = {}) {
        const token = {
            key: accessToken,
            secret: accessTokenSecret
        };
        const requestData = {
            url,
            method,
            data: params
        };
        const oauthHeaders = oauth.toHeader(oauth.authorize(requestData, token));
        const headers = {
            ...oauthHeaders
        };
        let finalUrl = url;
        let body;
        if (method === "GET" && Object.keys(params).length > 0) {
            finalUrl += "?" + new URLSearchParams(params).toString();
        } else if (method === "POST") {
            body = new URLSearchParams(params).toString();
            headers["Content-Type"] = "application/x-www-form-urlencoded";
        }
        const response = await fetch(finalUrl, {
            method,
            headers,
            body
        });
        if (!response.ok) {
            throw new Error(`API request failed: ${response.statusText}`);
        }
        return response.json();
    }
    // V1.1 API methods (for backward compatibility)
    static async getUserProfile(accessToken, accessTokenSecret) {
        return this.makeApiRequest(`${this.API_V1_BASE_URL}/account/verify_credentials.json`, "GET", accessToken, accessTokenSecret);
    }
    static async getTweets(accessToken, accessTokenSecret, count = 10) {
        return this.makeApiRequest(`${this.API_V1_BASE_URL}/statuses/home_timeline.json`, "GET", accessToken, accessTokenSecret, {
            count: count.toString()
        });
    }
    // V2 API methods
    static async getUserTweets(accessToken, accessTokenSecret, userId, maxResults = 10) {
        return this.makeApiRequest(`${this.API_V2_BASE_URL}/users/${userId}/tweets`, "GET", accessToken, accessTokenSecret, {
            "tweet.fields": "created_at,public_metrics,context_annotations",
            "max_results": maxResults.toString()
        });
    }
    static async getPostAnalytics(accessToken, accessTokenSecret, postIds, startTime, endTime, granularity = "total") {
        const params = {
            ids: postIds.join(","),
            start_time: startTime,
            end_time: endTime,
            granularity: granularity,
            "analytics.fields": "impressions,likes,retweets,replies,engagements,profile_visits,url_clicks,media_views"
        };
        return this.makeApiRequest(`${this.API_V2_BASE_URL}/tweets/analytics`, "GET", accessToken, accessTokenSecret, params);
    }
}
/* unused harmony default export */ var __WEBPACK_DEFAULT_EXPORT__ = ((/* unused pure expression or super */ null && (oauth)));


/***/ })

};
;
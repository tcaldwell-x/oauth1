"use strict";
(() => {
var exports = {};
exports.id = 481;
exports.ids = [481];
exports.modules = {

/***/ 522:
/***/ ((module) => {

module.exports = require("oauth-1.0a");

/***/ }),

/***/ 113:
/***/ ((module) => {

module.exports = require("crypto");

/***/ }),

/***/ 54:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ handler)
/* harmony export */ });
/* harmony import */ var _lib_oauth__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(251);

async function handler(req, res) {
    if (req.method !== "GET") {
        return res.status(405).json({
            error: "Method not allowed"
        });
    }
    try {
        const { oauth_token , oauth_verifier  } = req.query;
        if (!oauth_token || !oauth_verifier) {
            return res.redirect(`${process.env.NEXTAUTH_URL}/?error=missing_parameters`);
        }
        const oauthTokenSecret = req.cookies.oauth_token_secret;
        if (!oauthTokenSecret) {
            return res.redirect(`${process.env.NEXTAUTH_URL}/?error=missing_token_secret`);
        }
        const accessTokenResponse = await _lib_oauth__WEBPACK_IMPORTED_MODULE_0__/* .TwitterOAuth.getAccessToken */ .m.getAccessToken(oauth_token, oauthTokenSecret, oauth_verifier);
        // Set secure cookies with access tokens
        const cookieOptions = `HttpOnly; Secure=${"production" === "production"}; Max-Age=${30 * 24 * 60 * 60}; Path=/`;
        res.setHeader("Set-Cookie", [
            `access_token=${accessTokenResponse.oauth_token}; ${cookieOptions}`,
            `access_token_secret=${accessTokenResponse.oauth_token_secret}; ${cookieOptions}`,
            `user_info=${JSON.stringify({
                user_id: accessTokenResponse.user_id,
                screen_name: accessTokenResponse.screen_name
            })}; ${cookieOptions}`,
            `oauth_token_secret=; HttpOnly; Max-Age=0; Path=/` // Clear temporary token
        ]);
        res.redirect(`${process.env.NEXTAUTH_URL}/dashboard`);
    } catch (error) {
        console.error("Error in Twitter OAuth callback:", error);
        res.redirect(`${process.env.NEXTAUTH_URL}/?error=oauth_failed`);
    }
}


/***/ })

};
;

// load runtime
var __webpack_require__ = require("../../../../webpack-api-runtime.js");
__webpack_require__.C(exports);
var __webpack_exec__ = (moduleId) => (__webpack_require__(__webpack_require__.s = moduleId))
var __webpack_exports__ = __webpack_require__.X(0, [251], () => (__webpack_exec__(54)));
module.exports = __webpack_exports__;

})();
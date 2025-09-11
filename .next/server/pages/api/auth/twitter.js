"use strict";
(() => {
var exports = {};
exports.id = 532;
exports.ids = [532];
exports.modules = {

/***/ 522:
/***/ ((module) => {

module.exports = require("oauth-1.0a");

/***/ }),

/***/ 113:
/***/ ((module) => {

module.exports = require("crypto");

/***/ }),

/***/ 362:
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
        const callbackUrl = `${process.env.NEXTAUTH_URL}/api/auth/twitter/callback`;
        const requestTokenResponse = await _lib_oauth__WEBPACK_IMPORTED_MODULE_0__/* .TwitterOAuth.getRequestToken */ .m.getRequestToken(callbackUrl);
        // Store the token secret in a secure cookie
        res.setHeader("Set-Cookie", [
            `oauth_token_secret=${requestTokenResponse.oauth_token_secret}; HttpOnly; Secure=${"production" === "production"}; Max-Age=900; Path=/`
        ]);
        res.redirect(_lib_oauth__WEBPACK_IMPORTED_MODULE_0__/* .TwitterOAuth.getAuthorizationUrl */ .m.getAuthorizationUrl(requestTokenResponse.oauth_token));
    } catch (error) {
        console.error("Error in Twitter OAuth:", error);
        res.status(500).json({
            error: "Failed to initiate Twitter OAuth"
        });
    }
}


/***/ })

};
;

// load runtime
var __webpack_require__ = require("../../../webpack-api-runtime.js");
__webpack_require__.C(exports);
var __webpack_exec__ = (moduleId) => (__webpack_require__(__webpack_require__.s = moduleId))
var __webpack_exports__ = __webpack_require__.X(0, [251], () => (__webpack_exec__(362)));
module.exports = __webpack_exports__;

})();
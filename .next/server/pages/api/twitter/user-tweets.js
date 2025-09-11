"use strict";
(() => {
var exports = {};
exports.id = 880;
exports.ids = [880];
exports.modules = {

/***/ 522:
/***/ ((module) => {

module.exports = require("oauth-1.0a");

/***/ }),

/***/ 113:
/***/ ((module) => {

module.exports = require("crypto");

/***/ }),

/***/ 659:
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
        const { access_token , access_token_secret  } = req.cookies;
        if (!access_token || !access_token_secret) {
            return res.status(401).json({
                error: "Not authenticated"
            });
        }
        const { userId , maxResults ="10"  } = req.query;
        if (!userId) {
            return res.status(400).json({
                error: "User ID is required"
            });
        }
        const tweets = await _lib_oauth__WEBPACK_IMPORTED_MODULE_0__/* .TwitterOAuth.getUserTweets */ .m.getUserTweets(access_token, access_token_secret, userId, parseInt(maxResults));
        res.json(tweets);
    } catch (error) {
        console.error("Error fetching user tweets:", error);
        res.status(500).json({
            error: "Failed to fetch user tweets"
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
var __webpack_exports__ = __webpack_require__.X(0, [251], () => (__webpack_exec__(659)));
module.exports = __webpack_exports__;

})();
"use strict";
(() => {
var exports = {};
exports.id = 738;
exports.ids = [738];
exports.modules = {

/***/ 522:
/***/ ((module) => {

module.exports = require("oauth-1.0a");

/***/ }),

/***/ 113:
/***/ ((module) => {

module.exports = require("crypto");

/***/ }),

/***/ 993:
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
        const { postIds , startTime , endTime , granularity ="total"  } = req.query;
        if (!postIds || !startTime || !endTime) {
            return res.status(400).json({
                error: "postIds, startTime, and endTime are required"
            });
        }
        const postIdsArray = Array.isArray(postIds) ? postIds : [
            postIds
        ];
        const analytics = await _lib_oauth__WEBPACK_IMPORTED_MODULE_0__/* .TwitterOAuth.getPostAnalytics */ .m.getPostAnalytics(access_token, access_token_secret, postIdsArray, startTime, endTime, granularity);
        res.json(analytics);
    } catch (error) {
        console.error("Error fetching post analytics:", error);
        res.status(500).json({
            error: "Failed to fetch post analytics"
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
var __webpack_exports__ = __webpack_require__.X(0, [251], () => (__webpack_exec__(993)));
module.exports = __webpack_exports__;

})();
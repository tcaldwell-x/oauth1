"use strict";
(() => {
var exports = {};
exports.id = 824;
exports.ids = [824];
exports.modules = {

/***/ 693:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ handler)
/* harmony export */ });
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
        // Return the tokens for debugging purposes
        res.json({
            accessToken: access_token,
            accessTokenSecret: access_token_secret
        });
    } catch (error) {
        console.error("Error fetching tokens:", error);
        res.status(500).json({
            error: "Failed to fetch tokens"
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
var __webpack_exports__ = (__webpack_exec__(693));
module.exports = __webpack_exports__;

})();
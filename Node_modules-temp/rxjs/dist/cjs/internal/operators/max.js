"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.max = void 0;
var reduce_1 = require("./reduce");
var isFunction_1 = require("../util/isFunction");
function max(comparer) {
    return reduce_1.reduce(isFunction_1.isFunction(comparer) ? function (x, y) { return (comparer(x, y) > 0 ? x : y); } : function (x, y) { return (x > y ? x : y); });
}
exports.max = max;
//# sourceMappingURL=max.js.map
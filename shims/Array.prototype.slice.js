/**
* @license MIT, GPL, do whatever you want
* @todo CSSStyleDeclaration.js required to fix item check ? Other types to support? Go back to checking to slice document instead of document.documentElement in case not set or somehow make independent of document altogether?
* @todo Add to https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/slice
* @todo Replace with shim loading requirejs plugin
* @see https://gist.github.com/brettz9/6093105
*/
try {
    Array.prototype.slice.call(document.documentElement);
}
catch (e) { // Fails in IE8
    (function () {
        var _slice = Array.prototype.slice;
        Array.prototype.slice = function (object) {
            try {
                if (typeof this.length === 'number' &&
                    (this.nodeType === 1 ||
                        typeof this.item !== 'function' ||
                        (typeof this.item(0) === 'number') // We always want this to be true by now unless it throws an error (we can't just check for the property, as IE expects it to be executed)
                    )
                ) { // Duck-type for DOM elements, NamedNodeMap's, or HTMLCollection's as IE<9 does not support slice calls
                    var i, ol = this.length, a = [];
                    for (i = 0; i < ol; i++) {
                        a.push(this[i]);
                    }
                    return a;
                }
            }
            catch(e) {
            }
            try {
                return _slice.call(this);
            }
            catch(e) {
                // alert(typeof this.item(0));
                throw e;
            }
        }
    }());
}
/*globals Element*/
(function () {
    'use strict';

    var _ruleMatch = new RegExp('([\\w\\-]+)\\s*:\\s*([^\\(\\);\\s]+(?:\\([^\\)]*\\))?)\\s*(!important)?(?:\\s*;\\s*|$)', 'gi'),
        _getAttr = Element.prototype.getAttribute;

    /**
    * @static
    * @param {RegExp} regex The regular expression to clone and optionally onto which to copy new values
    * @param {String} [newFlags] A string combining any of 'g', 'i', 'm', or 'y'. Polymorphism would allow newFlags to be an array, but would need a shim
    * @returns {RegExp}
    */
    function _mixinRegex (regex, newFlags) {
        var lastIndex = regex.lastIndex; // We'll let the user reset this afterwards if they prefer
        newFlags = newFlags || '';
        regex = new RegExp(
            regex.source,
            (newFlags.indexOf('g') > -1 ? 'g' : regex.global ? 'g' : '') +
                (newFlags.indexOf('i') > -1 ? 'i' : regex.ignoreCase ? 'i' : '') +
                (newFlags.indexOf('m') > -1 ? 'm' : regex.multiline ? 'm' : '') +
                (newFlags.indexOf('y') > -1 ? 'y' : regex.sticky ? 'y' : '') // Non-standard but harmless if already being used
        );
        regex.lastIndex = lastIndex;
        return regex;
    }

    /**
    *
    * @static
    */
    function _exec (regex, str, cb, obj) {
        var matches, ret;
        if (!regex.global) { // Avoid infinite loops
            regex = _mixinRegex(regex, 'g');
        }
        while ((matches = regex.exec(str)) !== null) {
            cb.apply(obj || null, matches);
        }
    }

    /**
    *
    * @static
    */
    function _execIntoArray (regex, str, cb, obj, a) {
        var matches, ret;
        if (!regex.global) { // Avoid infinite loops
            regex = _mixinRegex(regex, 'g');
        }
        a = a || [];
        while ((matches = regex.exec(str)) !== null) {
            a.push(cb.apply(obj || null, matches));
        }
        return a;
    }
    /**
    * IE does allow us to override this DOM method, so we standardize behavior to lower-case the properties.
    * For some reason, as of IE 9 (including 10), a semi-colon will be inserted at the end of the rules even if not present,
    *  though this behavior is not present in Mozilla. IE8 has its own issue in that it always omits the semicolon at the
    *  end of rules.
    * Since IE has its own sorting, and Mozilla sorts in document order, and since we apparently have no way to
    * get IE's style attribute information in document order, we override getAttribute when applied to "style" so as to
    * always insert a semi-colon at the end (as in IE > 8 but not in Mozilla), as well as sort the properties into alphabetical
    * order
    * Assumes the style attribute is using well-formed CSS!
    */
    Element.prototype.getAttribute = function (attrName) {
        var rules, getAttrResult = _getAttr.apply(this, arguments);
        if (getAttrResult && attrName === 'style') {
            return _execIntoArray(_ruleMatch, getAttrResult, function (n0, property, propertyValue, important) {
                return property.toLowerCase() + ': ' + propertyValue + (important ? ' ' + important : '') + ';'; // Important may be undefined in Firefox instead of an empty string, so we need to default it here
            }).sort().join(' ');
        }
        return getAttrResult;
    };

}());

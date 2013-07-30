/*globals CSSStyleDeclaration*/
/**
* @requires shim:Object.defineProperty
*/
if (!CSSStyleDeclaration.prototype.getPropertyValue) {
    (function () {
        'use strict';

        var ruleMatch = new RegExp('([\\w\\-]+): [^\\(\\); ]+(?:\\([^\\)]*\\))?( !important)?(?:; |$)', 'gi');

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
        function _execExitOnMatch (regex, str, cb, obj, retExclusionValue, unmatchedValue) {
            var matches, ret;
            if (!regex.global) { // Avoid infinite loops
                regex = _mixinRegex(regex, 'g');
            }
            while ((matches = regex.exec(str)) !== null) {
                ret = cb.apply(obj || null, matches);
                if (ret !== retExclusionValue) {
                    return ret;
                }
            }
            return unmatchedValue;
        }

        /**
        *
        * @static
        */
        function _execExitOnMatchWithCount (regex, str, cb, obj, retExclusionValue) {
            var ret, i = 0;
            _execExitOnMatch(regex, str, function () {
                i++;
                if (cb) {
                    ret = cb.apply(obj || null, [i].concat([].slice.call(arguments)));
                    if (ret !== retExclusionValue) {
                        return ret;
                    }
                }
            });
            return i;
        }

        /**
        *
        * @static
        */
        function _execCount (regex, str, cb, obj, retExclusionValue) {
            var matches, ret, i = 0;

            if (!regex.global) { // Avoid infinite loops
                regex = _mixinRegex(regex, 'g');
            }

            while ((matches = regex.exec(str)) !== null) {
                i++;
                if (cb) {
                    ret = cb.apply(obj || null, matches);
                    if (ret !== retExclusionValue) {
                        return ret;
                    }
                }
            }
            return i;
        }

        CSSStyleDeclaration.prototype.getPropertyValue = function(a) {
            return this.getAttribute(a);
        };
        CSSStyleDeclaration.prototype.setProperty = function(a, b) {
            return this.setAttribute(String(a), b);
        };
        CSSStyleDeclaration.prototype.removeProperty = function(a) {
            return this.removeAttribute(a);
        };
        Object.defineProperty(CSSStyleDeclaration.prototype, 'length', {
            enumerable: false, // Should be true, but IE won't allow (and we only need the shim for IE? If not, repeat after putting this in a try-catch)
            get: function () { // read-only
                return _execCount(ruleMatch, this.cssText);
            }
        });
        CSSStyleDeclaration.prototype.item = function(idx) {
            return _execExitOnMatchWithCount(ruleMatch, this.cssText, function (i, n0) {
                if (i === idx) {
                    return n0;
                }
            }) || '';
        };
        CSSStyleDeclaration.prototype.getPropertyPriority = function(propToMatch) {
            // The addition of "\\)" toward the beginning is to prevent a match within parentheses
            // This should work since it should grab ALL rules (though invalid ones might in rare cases throw things off)
            return _execExitOnMatch(ruleMatch, this.cssText, function (n0, property, important) {
                if (property.toLowerCase() === propToMatch.toLowerCase() && important) {
                    return 'important';
                }
            }) || '';
        };

    // todo: add properties: parentRule (containing cssRule)?
    // todo: add method?: getPropertyCSSValue
    }());
}
// From old CSSStyleDeclaration (directly), the properties still part of the standard spec:
    // 1. cssText
    // 2. (Any explicitly added) styles:
    // 3. Apparently always present even when not explicitly set: textDecorationBlink, textDecorationNone, textDecorationOverline, textDecorationLineThrough, textDecorationUnderline, posLeft, posBottom, posWidth, posTop, posHeight, posRight, accelerator
// From IHTMLStyle2 (IE8's non-standard CSSStyleDeclaration.prototype)
// Built in: setAttribute, getAttribute, removeAttribute
// setExpression, getExpression, removeExpression (not working)
// toString

//alert(jml('hr', {"font-weight":'bold'}).style.getPropertyValue('font-weight'))
//document.getElementsByTagName('body')[0].style.cssText += ';color:yellow';
// var hrEl = jml('hr', {style: 'font-weight:bold !important;background: url("Punctuat)(io\\"a\\"n\' :;-!") !important;'});
// alert(hrEl.style.getPropertyPriority('background'))
//alert(hrEl.getAttribute('style'))

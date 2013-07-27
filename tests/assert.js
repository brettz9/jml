/*globals XMLSerializer*/
(function () {
'use strict';

var assert = {
    matches: function (item1, item2) {
        if (!item2) { // For convenience in debugging
            alert(item1);
        }
        document.write((item1 === item2) + '<br />\n');
    },
    matchesXMLStringWithinElement : function (element, item2) {
        var i, docFrag = document.createDocumentFragment();
        for (i = 0; i < element.childNodes.length; i++) {
            docFrag.appendChild(element.childNodes[i].cloneNode(true));
        }
        this.matchesXMLString(docFrag, item2);
    },
    matchesXMLStringOnElement : function (element, item2) {
        var lastInsert = element.childNodes[element.childNodes.length - 1];
        this.matchesXMLString(lastInsert, item2);
    },
    matchesXMLString: function (item1, item2) {
        if (item1.cssText !== undefined) { // When creating style tags in dynamically (but not statically), one must use document.createStylesheet() and apply styles instead of creating and appending a real style element. Since it is not really an element, I do not feel it is suitable to attempt to serialize this as such inside of the XMLSerializer shim, so we handle it here. IE gives upper-case for static style tags, so we return that here.
            item1 = '<STYLE xmlns="http://www.w3.org/1999/xhtml">' + item1.cssText + '</STYLE>'; // If this were a static style tag instead of IE's dynamic equivalent, an IE-specific document.createStylesheet()-returned object, it would return upper case, so I did not lower-case it here in order to highlight this effect.
        }
        else {
            item1 = new XMLSerializer().serializeToString(item1);
        }
        item1 = item1.toLowerCase(); // For IE
        this.matches(item1, item2);
    }
};

// EXPORTS
(typeof exports === 'undefined' ? window : exports).assert = assert;

}());

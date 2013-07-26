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
        item1 = new XMLSerializer().serializeToString(item1);
        this.matches(item1, item2);
    }
};

// EXPORTS
(typeof exports === 'undefined' ? window : exports).assert = assert;

}());

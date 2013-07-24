/*globals exports*/
(function () {
// Todo: Note to self: Integrate research from other jml notes
// Todo: Add tests
// Todo: Allow building of generic XML (pass configuration object)

/*
1) String element name (or array of 1-4)
2) Optional object with attributes
3) Optional array of text nodes and child elements
4) Optionally repeat for siblings
*/

/**
 * Creates an XHTML or HTML element (XHTML is preferred, but only in browsers that support);
 * Any element after element can be omitted, and any subsequent type or types added afterwards
 * @param {String} el The element to create (by lower-case name)
 * @param {Object} [atts] Attributes to add with the key as the attribute name and value as the
 *                                               attribute value; important for IE where the input element's type cannot
 *                                               be added later after already added to the page
 * @param {DOMElement[]} [children] The optional children of this element (but raw DOM elements
 *                                                                      required to be specified within arrays since
 *                                                                      could not otherwise be distinguished from siblings being added)
 * @param {DOMElement} [parent] The optional parent to which to attach the element (always the last
 *                                                                  unless followed by null, in which case it is the second-to-last)
 * @param {null} [returning] Can use null to indicate an array of elements should be returned
 * @returns {DOMElement} The newly created (and possibly already appended) element or array of elements
 */
/*
RULES
    1) Last element always the parent (put null if don't want but want to return) unless only atts and children (no other elements)
    2) Individual elements (DOM elements or sequences of string[/object/array]) get added to parent first-in, first-added
    3) Arrays or arrays of arrays always indicate children
    4) Strings always indicate elements
    5) Non-DOM-element objects always indicate attribute-value pairs
    6) null always indicates a place-holder (only needed in place of parent for last argument if want array returned)
    7) First item must be an element
    8) Always returns first created element, unless null as last argument, in which case, it returns an array of all added elements
*/
/*
// EXAMPLES
// 1)
var input = jml('input');
// 2)
var input = jml('input', {type:'password'});
// 3)
var div = jml('div', {c:'myClass'},
            ['p', {ih:'Some inner HTML'}],
            ['p', {ih:'another child paragraph'}]);
// 4)
var div = jml('div', {c:'myClass'},
            [ // Same as above, but more conceptually clear
                ['p', {ih:'Some inner HTML'}],
                ['p', {ih:'another child paragraph'}]
            ]);
// 5)
var div = jml('div',
                ['p', {ih:'no attributes on the div'}]);
// 6)
var simpleAttachToParent = jml('hr', document.body);
// 7)
var firstTr = jml('tr',
                ['td', {ih:'row 1 cell 1'}],
                ['td', {ih:'row 1 cell 2'}],
            'tr', {className:'anotherSibling'}
                ['td', {ih:'row 2 cell 1'}],
                ['td', {ih:'row 2 cell 2'}],
            table);
// 8)
var trsArray = jml('tr',
                ['td', {ih:'row 1 cell 1'}],
                ['td', {ih:'row 1 cell 2'}],
            'tr', {className:'anotherSibling'}
                ['td', {ih:'row 2 cell 1'}],
                ['td', {ih:'row 2 cell 2'}],
            table, null);
// 9)

var div = jml(
            'div',
                [$('DOMChildrenMustBeInArray')],
            $('anotherElementToAddToParent'),
            $('yetAnotherSiblingToAddToParent'),
        parent
);
*/

    'use strict';

    /**
     * Need this function for IE since options weren't otherwise getting added
     * @private
     * @param {DOMElement} parent The parent to which to append the element
     * @param {DOMElement} el The element to append to the parent
     */
    function _appendElement (parent, el) {
        if (parent.nodeName.toLowerCase() === 'select' && el.nodeName.toLowerCase() === 'option') {
            try {
                parent.add(el, null);
            }
            catch (err) {
                parent.add(el); /* IE */
            }
        }
        else {
            parent.appendChild(el);
        }
    }

    /**
     * Attach event in a cross-browser fashion
     * @param {DOMElement} el DOM element to which to attach the event
     * @param {String} type The DOM event (without 'on') to attach to the element
     * @param {Function} handler The event handler to attach to the element
     * @param {Boolean} [capturing] Whether or not the event should be
     *                                                              capturing (W3C-browsers only); default is false; NOT IN USE
     */
    function _addEvent (el, type, handler, capturing) {
        if (el.addEventListener) { /* W3C */
            el.addEventListener(type, handler, !!capturing);
        }
        else if (el.attachEvent) { /* IE */
            el.attachEvent('on' + type, handler);
        }
        else { /* OLDER BROWSERS (DOM0) */
            el['on' + type] = handler;
        }
    }

    function jml () {
        var i, arg, p, textnode, k, elsl, j, cl, elem, elems = [], firstEl, elStr, atts, child = [], argc = arguments.length, argv = arguments, NS_HTML = 'http://www.w3.org/1999/xhtml',
            _getType = function (item) {
                if (typeof item === 'string') {
                    return 'string';
                }
                if (typeof item === 'object') {
                    if (item === null) {
                        return 'null';
                    }
                    if (Array.isArray(item)) {
                        return 'array';
                    }
                    if (item.nodeType === 1) {
                        return 'element';
                    }
                    return 'object';
                }
            };
        for (i = 0; i < argc; i++) {
            arg = argv[i];
            switch (_getType(arg)) {
                case 'null': /* null always indicates a place-holder (only needed for last argument if want array returned) */
                    if (i === argc - 1) {
                        return elems.length <= 1 ? elem : elems;
                    }
                    break;
                case 'string': /* Strings always indicate elements */
                    elStr = arg;
                    if (document.createElementNS) {
                        elem = document.createElementNS(NS_HTML, elStr);
                    }
                    else {
                        elem = document.createElement(elStr);
                    }
                    if (i === 0) {
                        firstEl = elem;
                    }

                    elems[elems.length] = elem; /* Add to parent */
                    break;
                case 'object': /* Non-DOM-element objects always indicate attribute-value pairs */
                    atts = arg;
                    for (p in atts) {
                        if (atts.hasOwnProperty(p)) {
                            switch(p) {
                                case '$event': /* Could alternatively allow specific event names like 'change' or 'onchange'; could also alternatively allow object inside instead of array*/
                                    _addEvent(elem, atts[p][0], atts[p][1], atts[p][2]); /* element, event name, handler, capturing */
                                    break;
                                case 'className': case 'class':
                                    elem.className = atts[p];
                                    break;
                                case 'innerHTML':
                                    elem.innerHTML = atts[p];
                                    break;
                                case 'selected' : case 'checked': case 'value' : case 'text':
                                    elem[p] = atts[p];
                                    break;
                                // float not needed as for style.cssFloat (or style.styleFloat in IE)
                                case 'htmlFor': case 'for':
                                    if (elStr === 'label') {
                                        elem.htmlFor = atts[p];
                                        break;
                                    }
                                    /* Fall-through */
                                default:
                                    if (p.match(/^on/)) {
                                        _addEvent(elem, p.slice(2), atts[p], false);
                                        break;
                                    }
                                    elem.setAttribute(p, atts[p]);
                                    break;
                            }
                        }
                    }
                    break;
                case 'element':
                    /*
                    1) Last element always the parent (put null if don't want parent and want to return array) unless only atts and children (no other elements)
                    2) Individual elements (DOM elements or sequences of string[/object/array]) get added to parent first-in, first-added
                    */
                    if (i === argc - 1 || (i === argc - 2 && argv[i+1] === null)) { /* parent */
                        for (k = 0, elsl = elems.length; k < elsl; k++) {
                            _appendElement(arg, elems[k]);
                        }
                    }
                    else {
                        elems[elems.length] = arg;
                    }
                    break;
                case 'array': // Arrays or arrays of arrays indicate child nodes
                    child = arg;
                    for (j = 0, cl = child.length; j < cl; j++) { // Go through children array container to handle elements
                        if (typeof child[j] === 'string') {
                            elem.appendChild(document.createTextNode(child[j]));
                        }
                        else if (Array.isArray(child[j])) { // Arrays representing child elements
                            _appendElement(elem, jml.apply(null, child[j]));
                        }
                        else { // Single DOM element children
                            _appendElement(elem, child[j]);
                        }
                    }
                    break;
            }
        }
        return firstEl;
    }

    // EXPORTS
    (typeof exports === 'undefined' ? window : exports).jml = jml;

}());
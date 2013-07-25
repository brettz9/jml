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
var div = jml('div', {'class': 'myClass'}, [
    ['p', ['Some inner text']],
    ['p', ['another child paragraph']]
]);
// 4)
var div = jml('div', [
    ['p', ['no attributes on the div']]
]);
// 5)
var simpleAttachToParent = jml('hr', document.body);
// 6)
var firstTr = jml('tr', [
        ['td', ['row 1 cell 1']],
        ['td', ['row 1 cell 2']]
    ],
    'tr', {className: 'anotherRowSibling'}, [
        ['td', ['row 2 cell 1']],
        ['td', ['row 2 cell 2']]
    ],
    table
);
// 7)
var trsArray = jml('tr', [
        ['td', ['row 1 cell 1']],
        ['td', ['row 1 cell 2']]
    ],
    'tr', {className: 'anotherRowSibling'}, [
        ['td', ['row 2 cell 1']],
        ['td', ['row 2 cell 2']]
    ],
    table,
    null
);
// 8)

var div = jml(
    'div', [
        $('DOMChildrenMustBeInArray')
    ],
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
     * @param {DOMNode} el The element or other node to append to the parent
     */
    function _appendNode (parent, el) {
        if (parent.nodeName.toLowerCase() === 'select' && el.nodeName.toLowerCase() === 'option') {
            try {
                parent.add(el, null);
            }
            catch (err) {
                parent.add(el); // IE
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
        if (el.addEventListener) { // W3C
            el.addEventListener(type, handler, !!capturing);
        }
        else if (el.attachEvent) { // IE
            el.attachEvent('on' + type, handler);
        }
        else { // OLDER BROWSERS (DOM0)
            el['on' + type] = handler;
        }
    }

    function _createSafeReference (type, prefix, arg) {
        // For security reasons related to innerHTML, we ensure this string only contains potential entity characters
        if (!arg.match(/^\w+$/)) {
            throw 'Bad ' + type;
        }
        var elContainer = document.createElement('div');
        elContainer.innerHTML = '&' + prefix + arg + ';';
        return document.createTextNode(elContainer.innerHTML);
    }

    function jml () {
        var i, arg, procValue, p, val, elContainer, textnode, k, elsl, j, cl, elem, nodes = [], elStr, atts, child = [], argc = arguments.length, argv = arguments, NS_HTML = 'http://www.w3.org/1999/xhtml',
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
                case 'null': // null always indicates a place-holder (only needed for last argument if want array returned)
                    if (i === argc - 1) {
                        return nodes.length <= 1 ? nodes[0] : nodes;
                    }
                    break;
                case 'string': // Strings always indicate elements
                    switch (arg) {
                        case '!':
                            nodes[nodes.length] = document.createComment(argv[++i]);
                            break;
                        case '?':
                            arg = argv[++i];
                            val = argv[++i];
                            if (typeof val === 'object') {
                                procValue = [];
                                for (p in val) {
                                    if (val.hasOwnProperty(p)) {
                                        procValue.push(p + '=' + '"' + val[p].replace(/"/g, '\\"') + '"');
                                    }
                                }
                                procValue = procValue.join(' ');
                            }
                            // Firefox allows instructions with ">" in this method, but not if placed directly!
                            nodes[nodes.length] = document.createProcessingInstruction(arg, procValue);
                            break;
                        // Browsers don't support document.createEntityReference, so we just use this as a convenience
                        case '&':
                            nodes[nodes.length] = _createSafeReference('entity', '', argv[++i]);
                            break;
                        case '#': // // Decimal character reference - '#', ['01234'] // &#01234; // probably easier to use JavaScript Unicode escapes
                            nodes[nodes.length] = _createSafeReference('decimal', arg, argv[++i]);
                            break;
                        case '#x': // Hex character reference - '#x', ['123a'] // &#x123a; // probably easier to use JavaScript Unicode escapes
                            nodes[nodes.length] = _createSafeReference('hex', arg, argv[++i]);
                            break;
                        case '![':
                            // '![', ['escaped <&> text'] // <![CDATA[escaped <&> text]]>
                            // CDATA valid in XML only, so we'll just treat as text for mutual compatibility
                            // Todo: config (or detection via some kind of document.documentType property?) of whether in XML
                            // nodes[nodes.length] = document.createCDATASection(argv[++i]);
                            nodes[nodes.length] = document.createTextNode(argv[++i]);
                            break;
                        default: // An element
                            elStr = arg;
                            if (document.createElementNS) {
                                elem = document.createElementNS(NS_HTML, elStr);
                            }
                            else {
                                elem = document.createElement(elStr);
                            }
                            nodes[nodes.length] = elem; // Add to parent
                            break;
                    }
                    break;
                case 'object': // Non-DOM-element objects always indicate attribute-value pairs
                    atts = arg;
                    for (p in atts) {
                        if (atts.hasOwnProperty(p)) {
                            switch(p) {
                                // Todo: add '$a' for array of ordered (prefix-)attribute-value arrays
                                // Todo: Allow "xmlns" to accept prefix-value array or array of prefix-value arrays
                                // Todo: {$: ['xhtml', 'div']} for prefixed elements
                                // Todo: {'#': ['text1', ['span', ['inner text']], 'text2']} for transclusion-friendly fragments
                                // Todo: Accept array for any attribute with first item as prefix and second as value
                                case '$event': /* Could alternatively allow specific event names like 'change' or 'onchange'; could also alternatively allow object inside instead of array*/
                                    _addEvent(elem, atts[p][0], atts[p][1], atts[p][2]); // element, event name, handler, capturing
                                    break;
                                case 'className': case 'class':
                                    elem.className = atts[p];
                                    break;
                                // Todo: Disable this by default unless configuration explicitly allows (for security)
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
                                    elem.setAttribute(p, atts[p]);
                                    break;
                                default:
                                    // Todo: Allow key as plain "on" with map (like $event?)
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
                    if (i === argc - 1 || (i === argc - 2 && argv[i+1] === null)) { // parent
                        for (k = 0, elsl = nodes.length; k < elsl; k++) {
                            _appendNode(arg, nodes[k]);
                        }
                    }
                    else {
                        nodes[nodes.length] = arg;
                    }
                    break;
                case 'array': // Arrays or arrays of arrays indicate child nodes
                    child = arg;
                    for (j = 0, cl = child.length; j < cl; j++) { // Go through children array container to handle elements
                        if (typeof child[j] === 'string') {
                            elem.appendChild(document.createTextNode(child[j]));
                        }
                        else if (Array.isArray(child[j])) { // Arrays representing child elements
                            _appendNode(elem, jml.apply(null, child[j]));
                        }
                        else { // Single DOM element children
                            _appendNode(elem, child[j]);
                        }
                    }
                    break;
            }
        }
        return nodes[0];
    }

    // EXPORTS
    (typeof exports === 'undefined' ? window : exports).jml = jml;

}());
/**
* @license MIT, GPL, Do what you want
* @requires shim: Array.from
* @requires shim: Array.prototype.map
* @requires shim: Node.prototype.lookupNamespaceURI
*/
var XMLSerializer;
(function () {
    'use strict';
    if (!XMLSerializer) {
        XMLSerializer = function () {};
    }
    // Todo: Make this configurable whether to always add?
    if (1 || !XMLSerializer.prototype.serializeToString) {
        var emptyElements = '|basefont|frame|isindex'+ // Deprecated
            '|area|base|br|col|command|embed|hr|img|input|keygen|link|meta|param|source|track|wbr|',
            nonEmptyElements = 'article|aside|audio|bdi|canvas|datalist|details|figcaption|figure|footer|header|hgroup|mark|meter|nav|output|progress|rp|rt|ruby|section|summary|time|video' + // new in HTML5
            'html|body|p|h1|h2|h3|h4|h5|h6|form|button|fieldset|label|legend|select|option|optgroup|textarea|table|tbody|colgroup|tr|td|tfoot|thead|th|caption|abbr|acronym|address|b|bdo|big|blockquote|center|code|cite|del|dfn|em|font|i|ins|kbd|pre|q|s|samp|small|strike|strong|sub|sup|tt|u|var|ul|ol|li|dd|dl|dt|dir|menu|frameset|iframe|noframes|head|title|a|map|div|span|style|script|noscript|applet|object|';

        XMLSerializer.prototype.serializeToString = function (nodeArg) {

            // if (nodeArg.xml) { // If this is genuine XML, IE should be able to handle it (and anyways, I am not sure how to override the prototype of XML elements in IE as we must do to add the likes of lookupNamespaceURI)
             //   return nodeArg.xml;
            // }

            var ieFix = true, // Todo: Make conditional on IE and processing of HTML
                mozilla = true, // Todo: Detect (since built-in lookupNamespaceURI() appears to always return null now for HTML elements),
                htmlMode = true, // Todo: Make conditional on namespace?
                emptyElement,
                namespaces = {},
                prohibitHTMLOnly = true,
                xmlDeclaration = true,
                string = '',
                children = {},
                i = 0,
                xmlChars = /([\u0009\u000A\u000D\u0020-\uD7FF\uE000-\uFFFD]|[\uD800-\uDBFF][\uDC00-\uDFFF])*$/,
                entify = function entify(str) { // FIX: this is probably too many replaces in some cases and a call to it may not be needed at all in some cases
                    return str.replace(/&/g, '&amp;').replace(/>/g, '&gt;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
                },
                clone = function clone (obj) { // We don't need a deep clone, so this should be sufficient without recursion
                    var prop, newObj = {};
                    for (prop in obj) {
                        if (obj.hasOwnProperty(prop)) {
                            newObj[prop] = obj[prop];
                        }
                    }
                    return JSON.parse(JSON.stringify(newObj));
                },
                invalidStateError = function () { // These are probably only necessary if working with text/html
                    if (prohibitHTMLOnly) {
                        // INVALID_STATE_ERR per section 9.3 XHTML 5: http://www.w3.org/TR/html5/the-xhtml-syntax.html
                        var DOMException = function DOMException () {}, // Since we can't instantiate without this (at least in Mozilla), this mimicks at least (good idea?)
                            e = new DOMException();
                        e.code = 11;
                        throw e;
                    }
                },
                addExternalID = function (node, all) {
                    if (node.systemId.indexOf('"') !== -1 && node.systemId.indexOf("'") !== -1) {
                        invalidStateError();
                    }
                    var publicId = node.publicId, systemId = node.systemId,
                        publicQuote  = publicId && publicId.indexOf("'") !== -1 ? "'" : '"', // Don't need to check for quotes here, since not allowed with public
                        systemQuote  = systemId && systemId.indexOf("'") !== -1 ? "'" : '"'; // If as "entity" inside, will it return quote or entity? If former, we need to entify here (should be an error per section 9.3 of http://www.w3.org/TR/html5/the-xhtml-syntax.html )
                    if (systemId !== null && publicId !== null) {
                        string += ' PUBLIC '+publicQuote+publicId+publicQuote+' '+systemQuote+systemId+systemQuote;
                    }
                    else if (publicId !== null) {
                        string += ' PUBLIC '+publicQuote+publicId+publicQuote;
                    }
                    else if (all || systemId !== null) {
                        string += ' SYSTEM '+systemQuote+systemId+systemQuote;
                    }
                };
            function notIEInsertedAttributes (att, node, nameVals) {
                return nameVals.every(function (nameVal) {
                    var name = Array.isArray(nameVal) ? nameVal[0] : nameVal,
                        val = Array.isArray(nameVal) ? nameVal[1] : null;
                    return att.nodeName !== name ||
                        (val && att.nodeValue !== val) ||
                        //(!node.outerHTML.match(new RegExp(' ' + name + '=')));
                        (node.outerHTML.match(new RegExp(' ' + name + '=' + val ? '"' + val + '"' : '')));
                });
            }
            function lowerCaseCSSPropertiesForIE (n0, n1) {
                return n1.toLowerCase() + ' ';
            }
            function parseDOM(node, namespaces) {
                namespaces = clone(namespaces) || {}; // Ensure we're working with a copy, so different levels in the hierarchy can treat it differently

                if ((node.prefix && node.prefix.indexOf(':') !== -1) || (node.localName && node.localName.indexOf(':') !== -1)) {
                    invalidStateError();
                }

                var type = node.nodeType, children, i = 0, tagName, tagAttributes, prefix, val, content,
                    pubIdChar = /^(\u0020|\u000D|\u000A|[a-zA-Z0-9]|[\-'()+,.\/:=?;!*#@$_%])*$/;

                if ((type === 2 || type === 3 || type === 4 || type === 7 || type === 8) &&
                        !xmlChars.test(node.nodeValue)
                    ) {
                    invalidStateError();
                }

                switch (type) {
                    case 1: // ELEMENT
                        tagName = node.tagName;

                        if (ieFix) {
                            tagName = tagName.toLowerCase();
                        }
                        // Make this consistent, e.g., so browsers can be reliable in serialization

                        tagAttributes = [].slice.call(node.attributes).sort(function (attr1, attr2) {
                            return attr1.nodeName > attr2.nodeName ? 1 : -1;
                        });

                        prefix = node.prefix;

                        string += '<' + tagName;
                        /**/
                        // Do the attributes above cover our namespaces ok? What if unused but in the DOM?
                        if ((mozilla || !node.lookupNamespaceURI || node.lookupNamespaceURI(prefix) !== null) && namespaces[prefix || '$'] === undefined) {
                            namespaces[prefix || '$'] = node.namespaceURI || 'http://www.w3.org/1999/xhtml';
                            string += ' xmlns' + (prefix ? ':' + prefix : '') +
                                        '="' + entify(namespaces[prefix || '$']) + '"';
                        }
                        //*/
                        for (i = 0; i < tagAttributes.length; i++) {
                            if (tagAttributes[i].nodeName.match(/^xmlns:\w*$/)) {
                                string += ' ' + tagAttributes[i].nodeName + // .toLowerCase() +
                                    '="' + entify(tagAttributes[i].nodeValue) + '"'; // .toLowerCase()
                            }
                        }
                        for (i = 0; i < tagAttributes.length; i++) {
                            if (
                                // IE includes attributes like type=text even if not explicitly added as such
                                notIEInsertedAttributes(tagAttributes[i], node, [
                                    ['type', 'text'], 'colSpan', 'rowSpan', 'cssText', 'shape'
                                ])
                            ) {
                                if (!tagAttributes[i].nodeName.match(/^xmlns:?\w*$/)) { // Avoid adding these (e.g., from Firefox) as we add above
                                    if (tagAttributes[i].nodeName === 'style') {
                                        // This doesn't work as we need to sort the rules in a predictable order as IE varies them
                                        /*
                                        // Streamline serialization due to IE's upper-casing, stripping semi-colons and fixing post-proeprty whitespace to a single space
                                        string += ' style="' +
                                            entify(tagAttributes[i].nodeValue.
                                                replace(new RegExp('([\\w\\-]*:)\\s*', 'g'), lowerCaseCSSPropertiesForIE).
                                                replace(/;$/, '') // also for IE
                                            ) + '"';
                                        */

                                        try {

                                        // An alternative approach would be to call node.getAttribute('style') and parse it ourselves, thereby avoiding a need for the CSSStyleDeclaration shim
                                        string += ' style="' + Array.from(node.style).sort().map(function (style) {
                                            // This approach not supported in IE (without a CSSStyleDeclaration shim); we can't get IE
                                            //   to shim the style object to auto-return lower-cased values, however, since it is already defined
                                            //   and IE does not allow redefining an existing method
                                            var priority = node.style.getPropertyPriority(style);
                                            return style.toLowerCase() + ': ' + node.style.getPropertyValue(style) + (priority ? ' !' + priority : '');
                                        }).join('; ') + '"';

                                        }
                                        catch(e) {
                                            // alert(''+node.style);
                                            throw e;
                                        }
                                    }
                                    else {
                                        string += ' ' + tagAttributes[i].nodeName + // .toLowerCase() +
                                            '="' + entify(tagAttributes[i].nodeValue) + '"'; // .toLowerCase()
                                    }
                                }
                            }
                        }

                        // Todo: Faster to use array with Array.prototype.indexOf shim?
                        emptyElement = emptyElements.indexOf('|'+tagName+'|') > -1;
                        htmlMode = (nonEmptyElements.indexOf('|'+tagName+'|') > -1) || emptyElement;

                        if (!node.firstChild && (!htmlMode || emptyElement)) {
                            string += ' />';
                        }
                        else {
                            string += '>';
                            children = node.childNodes;
                            // Todo: After text nodes are only entified in XML, could change this first block to insist on document.createStyleSheet
                            if (tagName === 'script' || tagName === 'style') {
                                if (tagName === 'script' && (node.type === '' || node.type === 'text/javascript')) {
                                    string += document.createStyleSheet ? node.text : node.textContent;
                                    // parseDOM(document.createTextNode(node.text), namespaces);
                                }
                                else if (tagName === 'style') {
                                    // parseDOM(document.createTextNode(node.cssText), namespaces);
                                    string += document.createStyleSheet ? node.cssText : node.textContent;
                                }
                            }
                            else {
                                for (i = 0; i < children.length; i++) {
                                    parseDOM(children[i], namespaces);
                                }
                            }
                            string += '<\/' + tagName + '>';
                        }
                        break;
                    case 2: // ATTRIBUTE (should only get here if passing in an attribute node)
                        string += ' ' + node.name + // .toLowerCase() +
                                        '="' + entify(node.value) + '"'; // .toLowerCase()
                        break;
                    case 3: // TEXT
                        string += entify(node.nodeValue); // Todo: only entify for XML
                        break;
                    case 4: // CDATA
                        if (node.nodeValue.indexOf(']]'+'>') !== -1) {
                            invalidStateError();
                        }
                        string += '<'+'![CDATA[';
                        string += node.nodeValue;
                        string += ']]'+'>';
                        break;
                    case 5: // ENTITY REFERENCE (probably not used in browsers since already resolved)
                        string += '&'+node.nodeName+';';
                        break;
                    case 6: // ENTITY (would need to pass in directly)
                        val = '';
                        content = node.firstChild;

                        if (node.xmlEncoding) { // an external entity file?
                            string += '<?xml ';
                            if (node.xmlVersion) {
                                string += 'version="'+node.xmlVersion+'" ';
                            }
                            string += 'encoding="'+node.xmlEncoding+'"';
                            string += '?>';

                            if (!content) {
                                return '';
                            }
                            while (content) {
                                val += content.nodeValue; // FIX: allow for other entity types
                                content = content.nextSibling;
                            }
                            return string+content; // reconstruct external entity file, if this is that
                        }
                        string += '<'+'!ENTITY '+node.nodeName+' ';
                        if (node.publicId || node.systemId) { // External Entity?
                            addExternalID(node);
                            if (node.notationName) {
                                string += ' NDATA '+node.notationName;
                            }
                            string += '>';
                            break;
                        }

                        if (!content) {
                            return '';
                        }
                        while (content) {
                            val += content.nodeValue; // FIX: allow for other entity types
                            content = content.nextSibling;
                        }
                        string += '"'+entify(val)+'">';
                        break;
                    case 7: // PROCESSING INSTRUCTION
                        if (/^xml$/i.test(node.target)) {
                            invalidStateError();
                        }
                        if (node.target.indexOf('?>') !== -1) {
                            invalidStateError();
                        }
                        if (node.target.indexOf(':') !== -1) {
                            invalidStateError();
                        }
                        if (node.data.indexOf('?>') !== -1) {
                            invalidStateError();
                        }
                        string += '<?' + node.target + ' ' + node.nodeValue + '?>';
                        break;
                    case 8: // COMMENT
                        if (node.nodeValue.indexOf('--') !== -1 ||
                                (node.nodeValue.length && node.nodeValue.lastIndexOf('-') === node.nodeValue.length-1)) {
                            invalidStateError();
                        }
                        string += '<'+'!--' + node.nodeValue + '-->';
                        break;
                    case 9: // DOCUMENT (handled earlier in script)
                        break;
                    case 10: // DOCUMENT TYPE
                        string += '<'+'!DOCTYPE '+node.name;
                        if (!pubIdChar.test(node.publicId)) {
                            invalidStateError();
                        }
                        addExternalID(node);
                        string += node.internalSubset ? '[\n' + node.internalSubset + '\n]' : '';
                        string += '>\n';
                        /* Fit in internal subset along with entities?: probably don't need as these would only differ if from DTD, and we're not rebuilding the DTD
                        var notations = node.notations;
                        if (notations) {
                            for (i=0; i < notations.length; i++) {
                                parseDOM(notations[0], namespaces);
                            }
                        }
                        */
                        // UNFINISHED
                        break;
                    case 11: // DOCUMENT FRAGMENT (handled earlier in script)
                        break;
                    case 12: // NOTATION (would need to be passed in directly)
                        string += '<'+'!NOTATION '+node.nodeName;
                        addExternalID(node, true);
                        string += '>';
                        break;
                    default:
                        throw 'Not an XML type';
                }
                return string;
            }
            if (nodeArg.nodeType === 9) { // DOCUMENT - Faster to do it here without first calling parseDOM
                if (xmlDeclaration) {
                    if (document.xmlVersion) {
                        string += '<?xml version="'+document.xmlVersion+'"';
                        if (document.xmlEncoding !== undefined && document.xmlEncoding !== null) {
                            string += ' encoding="'+document.xmlEncoding+'"';
                        }
                        if (document.xmlStandalone !== undefined) { // Could configure to only output if "yes"
                            string += ' standalone="'+(document.xmlStandalone ? 'yes' : 'no')+'"';
                        }
                        string += '?>\n';
                    }
                }
                children = nodeArg.childNodes;
                if (!children.length) {
                    invalidStateError();
                }
                for (i = 0; i < children.length; i++) { // Can't just do documentElement as there may be doctype, comments, etc.
                    parseDOM(children[i], namespaces);
                }
                return string;
            }
            if (nodeArg.nodeType === 11) { // DOCUMENT FRAGMENT - Faster to do it here without first calling parseDOM
                children = nodeArg.childNodes;
                for (i = 0; i < children.length; i++) {
                    parseDOM(children[i], namespaces);
                }
                return string;
            }
            if (nodeArg.nodeType === 1) { // ELEMENT
                return parseDOM(nodeArg, namespaces);
            }
        };
    }
}());

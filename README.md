NOTE: This project is currently incomplete and the API is not yet stable.

Rationale
========
Provide round-trippable JSON/JavaScript serialization as with JsonML, but with template-friendly capacity to insert fragments or child nodes.

Rules (summary)
==============

1. String element name (or array of 1-4)
2. Optional object with attributes
3. Optional array of text nodes, DOM nodes, and child elements
4. Optionally repeat for siblings

Rules (detailed)
============

1. Last element always the parent (put null if don't want but want to return) unless only attributes and children (no other elements)
2. Individual elements (DOM elements or sequences of string[/object/array]) get added to parent first-in, first-added
3. Arrays indicate children (containing nodes, text (to become text nodes) or arrays encapsulating another JML element structure)
4. Strings indicate elements unless they use special characters, in which case
5. Non-DOM-element objects indicate attribute-value pairs
6. null always indicates a place-holder (only needed in place of parent for last argument if want array returned)
7. First item must be an element name (to create an element structure)
8. Always returns first created element, unless null as last argument, in which case, it returns an array of all added elements

Examples
========

```javascript
var input = jml('input');
```

```javascript
var input = jml('input', {type:'password'});
```

```javascript
var div = jml('div', {'class': 'myClass'}, [
    ['p', ['Some inner text']],
    ['p', ['another child paragraph']]
]);
```

```javascript
var div = jml('div', [
    ['p', ['no attributes on the div']]
]);
```

```javascript
var simpleAttachToParent = jml('hr', document.body);
```

```javascript
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
```

```javascript
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
```

```javascript
var div = jml(
    'div', [
        $('#DOMChildrenMustBeInArray')[0]
    ],
    $('#anotherElementToAddToParent')[0],
    $('#yetAnotherSiblingToAddToParent')[0],
    parent
);
```

```javascript
jml('div', [
    'text0',
    {'#': ['text1', ['span', ['inner text']], 'text2']}, // Add fragment anywhere within children
    'text3'
])
```

```javascript
var input = jml('input', {$on: {
    click: [function () {
        alert('worked1');
    }, true] // Capturing
}});
```
```javascript
var input2 = jml('input', {
    style: 'position:absolute; left: -1000px;',
    $on: {
        click: function () {
            alert('worked2');
        },
        focus: function () {
            alert('worked3');
        }
    }
}, document.body);
```

```javascript
var div = jml('div', [
    ['!', 'a comment'],
    ['?', 'customPI', 'a processing instruction'],
    ['&', 'copy'],
    ['#', '1234'],
    ['#x', 'ab3'],
    ['![', '&test <CDATA> content']
]);
```

Naming
======

JML (for JavaScript or Json Markup Language), pronounced "Jamilih"
for the Arabic word meaning "Beauty". It is named in honor of the Arabic name
of my dear newly-born daughter.

Design goals
==========

1. Be as succinct as possible while being sufficiently functional; avoid null place-holders, etc.
2. Allow reliable iteration order (i.e., use arrays over objects except where order is not needed).
3. Allow for use as a template language, with the opportunity for function calls to easily 
	add elements, attributes, child content, or fragments without needing to retool the entire structure or
	write complex functions to handle the merging.
4. Use a syntax with a minimum of constructs not familiar to XML/HTML users (if any), allowing
	for near immediate adoption by any web developer.
5. Work with XML or HTML and optionally support faithful rebuilding of an entire XML document
6. Ability to write libraries which support regular XML needs like XPath expressions (which are more
   appropriate for HTML than those targeted for open-ended JSON, such as JSONPath). Avoid need to 
   convert to DOM where possible (and even implement DOM interfaces for it in a modular fashion).
7. Work with JSON, but also allow flexible usage within full JavaScript, such as to allow 
	dropping in DOM nodes or optional DOM mode for attachment of events (but with a preference
	or option toward internal string concatenation for speed).
8. Be intuitive so that one is not likely to be confused about whether one is looking at 
	element siblings, children, text, etc.

Related work
===========

The only work which comes close to meeting these goals as far as I have been able to find is JsonML. 
JsonML even does a better job of goal #1 in terms of succinctness than my proposal for Jamilih. However, 
for goal #3, I believe JML will be more flexible for regular usage in templates, and possibly also
superior in goal #8 (and with a plan for goal #5 and #7?).

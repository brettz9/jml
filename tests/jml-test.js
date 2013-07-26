/*
Todos:
0. Add test cases for properties: innerHTML, selected, checked, value, htmlFor, for, on*
0. Confirm working cross-browser
0. When CDATA XML-check added, add check for CDATA section in XML
*/

// HELPERS
var $ = function (sel) {
    return document.querySelectorAll(sel);
};

// BEGIN TESTS

assert.matchesXMLString(
    jml('input'),
    '<input xmlns="http://www.w3.org/1999/xhtml" />'
);

assert.matchesXMLString(
    jml('input', {type:'password', id: 'my_pass'}),
    '<input xmlns="http://www.w3.org/1999/xhtml" type="password" id="my_pass" />'
);

assert.matchesXMLString(
    jml('div', [
        ['p', ['no attributes on the div']]
    ]),
    '<div xmlns="http://www.w3.org/1999/xhtml"><p>no attributes on the div</p></div>'
);

assert.matchesXMLString(
    jml('div', {'class': 'myClass'}, [
        ['p', ['Some inner text']],
        ['p', ['another child paragraph']]
    ]),
    '<div xmlns="http://www.w3.org/1999/xhtml" class="myClass"><p>Some inner text</p><p>another child paragraph</p></div>'
);

assert.matchesXMLString(
    jml('div', {'class': 'myClass'}, [
        'text1',
        ['p', ['Some inner text']],
        'text3'
    ]),
    '<div xmlns="http://www.w3.org/1999/xhtml" class="myClass">text1<p>Some inner text</p>text3</div>'
);

var simpleAttachToParent = jml('hr', document.body);

assert.matchesXMLStringOnElement(
    document.body,
    '<hr xmlns="http://www.w3.org/1999/xhtml" />'
);

var table = jml('table', {style: 'position:absolute; left: -1000px;'}, document.body);
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

assert.matchesXMLStringWithinElement(
    table,
    '<tr xmlns="http://www.w3.org/1999/xhtml"><td>row 1 cell 1</td><td>row 1 cell 2</td></tr><tr xmlns="http://www.w3.org/1999/xhtml" class="anotherRowSibling"><td>row 2 cell 1</td><td>row 2 cell 2</td></tr>'
);

var table = jml('table', {style: 'position:absolute; left: -1000px;',}, document.body); // Rebuild
var trsFragment = jml('tr', [
        ['td', ['row 1 cell 1']],
        ['td', ['row 1 cell 2']]
    ],
    'tr', {className: 'anotherRowSibling'}, [
        ['td', ['row 2 cell 1']],
        ['td', ['row 2 cell 2']]
    ],
    null
);

assert.matches(
    new XMLSerializer().serializeToString(trsFragment.childNodes[0]) +
    new XMLSerializer().serializeToString(trsFragment.childNodes[1]),
    '<tr xmlns="http://www.w3.org/1999/xhtml"><td>row 1 cell 1</td><td>row 1 cell 2</td></tr><tr xmlns="http://www.w3.org/1999/xhtml" class="anotherRowSibling"><td>row 2 cell 1</td><td>row 2 cell 2</td></tr>'
);

var parent = document.body;
var div = jml(
    'div', {style: 'position:absolute; left: -1000px;',}, [
        $('#DOMChildrenMustBeInArray')[0]
    ],
    $('#anotherElementToAddToParent')[0],
    $('#yetAnotherSiblingToAddToParent')[0],
    parent
);
assert.matchesXMLString(
    div,
    '<div xmlns="http://www.w3.org/1999/xhtml" style="position:absolute; left: -1000px;"><div id="DOMChildrenMustBeInArray" style="display:none;">test1</div></div>'
    // '<div xmlns="http://www.w3.org/1999/xhtml" style="position:absolute; left: -1000px;"><div id="DOMChildrenMustBeInArray" style="display:none;">test1</div></div><div id="anotherElementToAddToParent" style="display:none;">test2</div><div id="yetAnotherSiblingToAddToParent" style="display:none;">test3</div>'
);


assert.matchesXMLString(
    jml('div', [
        'text0',
        {'#': ['text1', ['span', ['inner text']], 'text2']},
        'text3'
    ]),
    '<div xmlns="http://www.w3.org/1999/xhtml">text0text1<span>inner text</span>text2text3</div>'
);

// Allow the following form (fragment INSTEAD of child array rather than the fragment as the only argument of a child array)? If so, add to README as well.
/*
assert.matchesXMLString(
    jml('div',
        {'#': ['text1', ['span', ['inner text']], 'text2']}
    ),
    '<div xmlns="http://www.w3.org/1999/xhtml">text1<span>inner text</span>text2</div>'
);
*/

assert.matchesXMLString(
    jml('div', {dataset: {'abcDefGh': 'fff', 'jkl-mno-pq': 'ggg'}}),
    '<div xmlns="http://www.w3.org/1999/xhtml" data-abc-def-gh="fff" data-jkl-mno-pq="ggg"></div>'
);

var str,
    input = jml('input', {$on: {click: [function () {
        str = 'worked1';
    }, true]}});
input.click();
assert.matches(str, 'worked1');

var input2 = jml('input', {
    style: 'position:absolute; left: -1000px;',
    $on: {
        click: function () {
            str = 'worked2';
        },
        focus: [function () {
            str = 'worked3';
        }, true]
    }
}, document.body); // For focus (or select) event to work, we need to append to the document
input2.click();
assert.matches(str, 'worked2');
input2.focus();
assert.matches(str, 'worked3');

assert.matchesXMLString(
    jml('div', [
        ['!', 'a comment'],
        ['?', 'customPI', 'a processing instruction'],
        ['&', 'copy'],
        ['#', '1234'],
        ['#x', 'ab3'],
        ['![', '&test <CDATA> content']
    ]),
    '<div xmlns="http://www.w3.org/1999/xhtml"><!--a comment--' +
    '><'+ '?customPI a processing instruction?>\u00A9\u04D2\u0AB3&amp;test &lt;CDATA&gt; content</div>'
);

assert.matches(
    jml('abc', {xmlns:'def'}).namespaceURI,
    'def'
);

assert.matchesXMLString(
    jml('abc', {xmlns: {'prefix1': 'def', 'prefix2': 'ghi'}}),
    '<abc xmlns="http://www.w3.org/1999/xhtml" xmlns:prefix1="def" xmlns:prefix2="ghi"></abc>'
);

assert.matchesXMLString(
    jml('abc', {xmlns: {'prefix1': 'def', 'prefix2': 'ghi', '': 'newdefault'}}),
    '<abc xmlns="newdefault" xmlns:prefix1="def" xmlns:prefix2="ghi"/>'
);

assert.matches(
    jml('abc', {xmlns: {'prefix1': 'def', 'prefix2': 'ghi', '': 'newdefault'}}).namespaceURI,
    'newdefault'
);
/*
// lookupNamespaceURI(prefix) is not working in Mozilla, so we test this way
assert.matches(
    jml('abc', {xmlns: {'prefix1': 'def', 'prefix2': 'ghi'}}, [
        {$: {prefix2: ['prefixedElement']}}
    ]).firstChild.namespaceURI,
    ''
);
*/

assert.matchesXMLString(
    jml("ul", [
        [
            "li",
                { "style" : "color:red" },
                ["First Item"],
            "li",
                {
                    "title" : "Some hover text.",
                    "style" : "color:green"
                },
                ["Second Item"],
            "li",
                [
                    ["span",
                        {
                            "class" : "Remove-Me",
                            "style" : "font-weight:bold"
                        },
                        ["Not Filtered"]
                    ],
                    " Item"
                ],
            "li",
                [
                    ["a",
                        {
                            "href" : "#NewWindow"
                        },
                        ["Special Link"]
                    ]
                ],
            null
        ]
    ], document.body),
    '<ul xmlns="http://www.w3.org/1999/xhtml"><li style="color:red">First Item</li><li title="Some hover text." style="color:green">Second Item</li><li><span class="Remove-Me" style="font-weight:bold">Not Filtered</span> Item</li><li><a href="#NewWindow">Special Link</a></li></ul>'
);

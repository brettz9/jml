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
    jml('input', {type:'password'}),
    '<input xmlns="http://www.w3.org/1999/xhtml" type="password" />'
);

assert.matchesXMLString(
    jml('div', {'class': 'myClass'}, [
        ['p', ['Some inner text']],
        ['p', ['another child paragraph']]
    ]),
    '<div xmlns="http://www.w3.org/1999/xhtml" class="myClass"><p>Some inner text</p><p>another child paragraph</p></div>'
);

assert.matchesXMLString(
    jml('div', [
        ['p', ['no attributes on the div']]
    ]),
    '<div xmlns="http://www.w3.org/1999/xhtml"><p>no attributes on the div</p></div>'
);

var simpleAttachToParent = jml('hr', document.body);

assert.matchesXMLStringOnElement(
    document.body,
    '<hr xmlns="http://www.w3.org/1999/xhtml" />'
);

var table = jml('table', document.body);
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

var table = jml('table', document.body); // Rebuild
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

assert.matchesXMLStringWithinElement(
    table,
    new XMLSerializer().serializeToString(trsArray[0])+
    new XMLSerializer().serializeToString(trsArray[1])
    // '<tr xmlns="http://www.w3.org/1999/xhtml"><td>row 1 cell 1</td><td>row 1 cell 2</td></tr><tr xmlns="http://www.w3.org/1999/xhtml" class="anotherRowSibling"><td>row 2 cell 1</td><td>row 2 cell 2</td></tr>'
);

var parent = document.body;
var div = jml(
    'div', [
        $('#DOMChildrenMustBeInArray')[0]
    ],
    $('#anotherElementToAddToParent')[0],
    $('#yetAnotherSiblingToAddToParent')[0],
    parent
);
assert.matchesXMLString(
    div,
    '<div xmlns="http://www.w3.org/1999/xhtml"><div id="DOMChildrenMustBeInArray">test1</div></div>'
    // '<div xmlns="http://www.w3.org/1999/xhtml"><div id="DOMChildrenMustBeInArray">test1</div></div><div id="anotherElementToAddToParent">test2</div><div id="yetAnotherSiblingToAddToParent">test3</div>'
);


assert.matchesXMLString(
    jml('div', [
        'text0',
        {'#': ['text1', ['span', ['inner text']], 'text2']},
        'text3'
    ]),
    '<div xmlns="http://www.w3.org/1999/xhtml">text0text1<span>inner text</span>text2text3</div>'
);

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
        focus: function () {
            str = 'worked3';
        }
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

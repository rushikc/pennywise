/*
MIT License
Copyright (c) 2025 rushikc <rushikc.dev@gmail.com>
*/

const {describe, it} = require('node:test');
const assert = require('node:assert/strict');
const {extractPlainTextFromHtml} = require('./utility');

describe('extractPlainTextFromHtml', () => {
  it('strips style, script, and comments', () => {
    const html = '<style>p{}</style><script>x()</script><!-- hi --><p>Hello</p>';
    assert.equal(extractPlainTextFromHtml(html), 'Hello');
  });

  it('decodes entities and collapses whitespace', () => {
    const html = 'A&nbsp;&amp;&nbsp;B<br/>C&#8364;';
    const text = extractPlainTextFromHtml(html);
    assert.match(text, /A & B/);
    assert.match(text, /€/);
  });

  it('returns empty string for non-string input', () => {
    assert.equal(extractPlainTextFromHtml(null), '');
    assert.equal(extractPlainTextFromHtml(''), '');
  });

  it('keeps inner text of nested tags', () => {
    assert.equal(extractPlainTextFromHtml('<div><b>Shop</b> bill</div>'), 'Shop bill');
  });
});

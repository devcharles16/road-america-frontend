// Focused tests for the shipment-status email greeting fix: a valid
// first name must be used when available, missing/blank/placeholder
// values must fall back to a plain "Hi," rather than ever rendering
// null/undefined/blank spacing or their literal strings, and the
// resolved name must be HTML-escaped before it reaches the template.
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { resolveGreetingFirstName, buildGreeting, escapeHtml } from '../emailGreeting.js';

describe('resolveGreetingFirstName — valid first name', () => {
  test('uses an explicit first name when present', () => {
    assert.equal(resolveGreetingFirstName({ firstName: 'Alex', customerName: 'Alex Smith' }), 'Alex');
  });

  test('trims surrounding whitespace on an explicit first name', () => {
    assert.equal(resolveGreetingFirstName({ firstName: '  Alex  ' }), 'Alex');
  });

  test('falls back to the first word of a combined customer_name (shipments has no first_name column)', () => {
    assert.equal(resolveGreetingFirstName({ customerName: 'Jordan Lee' }), 'Jordan');
  });

  test('a single-word customer_name is used as-is', () => {
    assert.equal(resolveGreetingFirstName({ customerName: 'Jordan' }), 'Jordan');
  });
});

describe('resolveGreetingFirstName — missing name', () => {
  test('no fields at all returns null', () => {
    assert.equal(resolveGreetingFirstName(), null);
  });

  test('both fields null returns null', () => {
    assert.equal(resolveGreetingFirstName({ firstName: null, customerName: null }), null);
  });

  test('both fields undefined returns null', () => {
    assert.equal(resolveGreetingFirstName({ firstName: undefined, customerName: undefined }), null);
  });

  test('empty-string customer_name returns null', () => {
    assert.equal(resolveGreetingFirstName({ customerName: '' }), null);
  });

  test('whitespace-only customer_name returns null (the "blank spacing" case)', () => {
    assert.equal(resolveGreetingFirstName({ customerName: '   ' }), null);
  });

  test('whitespace-only first name falls back to customer_name', () => {
    assert.equal(resolveGreetingFirstName({ firstName: '   ', customerName: 'Jordan Lee' }), 'Jordan');
  });
});

describe('resolveGreetingFirstName — literal "null"/"undefined" strings', () => {
  test('literal "null" first name is rejected, falls back to customer_name', () => {
    assert.equal(resolveGreetingFirstName({ firstName: 'null', customerName: 'Jordan Lee' }), 'Jordan');
  });

  test('literal "undefined" first name with no fallback returns null', () => {
    assert.equal(resolveGreetingFirstName({ firstName: 'undefined' }), null);
  });

  test('literal "null" customer_name (whole string) returns null', () => {
    assert.equal(resolveGreetingFirstName({ customerName: 'null' }), null);
  });

  test('is case-insensitive on the literal placeholder', () => {
    assert.equal(resolveGreetingFirstName({ firstName: 'NULL' }), null);
    assert.equal(resolveGreetingFirstName({ firstName: 'Undefined' }), null);
  });

  test('a combined name whose first word is the literal "undefined" (both parts missing upstream) returns null', () => {
    assert.equal(resolveGreetingFirstName({ customerName: 'undefined undefined' }), null);
  });
});

describe('buildGreeting', () => {
  test('renders "Hi <name>," for a valid name', () => {
    assert.equal(buildGreeting({ firstName: 'Alex' }), 'Hi Alex,');
  });

  test('renders plain "Hi," when nothing usable is found', () => {
    assert.equal(buildGreeting({ firstName: 'undefined', customerName: null }), 'Hi,');
  });

  test('escapes HTML-significant characters in the resolved name', () => {
    assert.equal(buildGreeting({ firstName: '<script>alert(1)</script>' }), 'Hi &lt;script&gt;alert(1)&lt;/script&gt;,');
  });

  test('escapes an ampersand and quote in a name', () => {
    assert.equal(buildGreeting({ customerName: `O'Brien & Co Test` }), `Hi O&#39;Brien,`);
  });
});

describe('escapeHtml', () => {
  test('escapes all five HTML-significant characters', () => {
    assert.equal(escapeHtml(`<>&"'`), '&lt;&gt;&amp;&quot;&#39;');
  });
});

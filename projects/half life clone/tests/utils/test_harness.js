const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');

// ============================================================================
// 1. JSDOM & Fallback HTML/DOM Parser Implementation
// ============================================================================

let jsdomModule = null;
try {
  jsdomModule = require('jsdom');
} catch (e) {
  jsdomModule = null;
}

const SELF_CLOSING_TAGS = new Set([
  'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input',
  'link', 'meta', 'param', 'source', 'track', 'wbr'
]);

class DOMNode {
  constructor(nodeType, tagName = '') {
    this.nodeType = nodeType; // 1 = Element, 3 = Text, 9 = Document
    this.tagName = tagName.toUpperCase();
    this.attributes = {};
    this.children = [];
    this.parentNode = null;
    this._text = '';
  }

  getAttribute(name) {
    if (!name) return null;
    const lower = name.toLowerCase();
    return Object.prototype.hasOwnProperty.call(this.attributes, lower)
      ? this.attributes[lower]
      : null;
  }

  hasAttribute(name) {
    if (!name) return false;
    return Object.prototype.hasOwnProperty.call(this.attributes, name.toLowerCase());
  }

  setAttribute(name, val) {
    this.attributes[name.toLowerCase()] = String(val);
  }

  removeAttribute(name) {
    delete this.attributes[name.toLowerCase()];
  }

  get id() {
    return this.getAttribute('id') || '';
  }

  set id(val) {
    this.setAttribute('id', val);
  }

  get className() {
    return this.getAttribute('class') || '';
  }

  set className(val) {
    this.setAttribute('class', val);
  }

  get classList() {
    const self = this;
    const getClassArray = () => (self.getAttribute('class') || '').trim().split(/\s+/).filter(Boolean);

    return {
      contains(cls) {
        return getClassArray().includes(cls);
      },
      add(cls) {
        const classes = getClassArray();
        if (!classes.includes(cls)) {
          classes.push(cls);
          self.setAttribute('class', classes.join(' '));
        }
      },
      remove(cls) {
        const classes = getClassArray().filter(c => c !== cls);
        self.setAttribute('class', classes.join(' '));
      },
      toggle(cls) {
        if (this.contains(cls)) {
          this.remove(cls);
          return false;
        } else {
          this.add(cls);
          return true;
        }
      },
      get length() {
        return getClassArray().length;
      },
      item(i) {
        return getClassArray()[i] || null;
      }
    };
  }

  get textContent() {
    if (this.nodeType === 3) return this._text || '';
    return this.children.map(c => c.textContent).join('');
  }

  set textContent(val) {
    this.children = [];
    const txtNode = new DOMNode(3);
    txtNode._text = String(val);
    txtNode.parentNode = this;
    this.children.push(txtNode);
  }

  get innerHTML() {
    if (this.nodeType === 3) return this._text || '';
    return this.children.map(c => c.outerHTML).join('');
  }

  get outerHTML() {
    if (this.nodeType === 3) return this._text || '';
    if (this.nodeType === 9) return this.innerHTML;
    const tag = this.tagName.toLowerCase();
    const attrs = Object.entries(this.attributes)
      .map(([k, v]) => ` ${k}="${String(v).replace(/"/g, '&quot;')}"`)
      .join('');
    if (SELF_CLOSING_TAGS.has(tag)) {
      return `<${tag}${attrs}>`;
    }
    return `<${tag}${attrs}>${this.innerHTML}</${tag}>`;
  }

  querySelector(selector) {
    const results = this.querySelectorAll(selector);
    return results.length > 0 ? results[0] : null;
  }

  querySelectorAll(selector) {
    if (!selector || typeof selector !== 'string') return [];
    const commaParts = selector.split(',').map(s => s.trim()).filter(Boolean);
    const matches = [];

    const allElements = [];
    const collectElements = (node) => {
      for (const child of node.children) {
        if (child.nodeType === 1) {
          allElements.push(child);
          collectElements(child);
        }
      }
    };
    collectElements(this);

    for (const elem of allElements) {
      for (const part of commaParts) {
        if (matchSelectorChain(elem, part)) {
          if (!matches.includes(elem)) {
            matches.push(elem);
          }
          break;
        }
      }
    }
    return matches;
  }

  getElementById(id) {
    return this.querySelector(`#${id}`);
  }

  getElementsByClassName(className) {
    return this.querySelectorAll(`.${className}`);
  }

  getElementsByTagName(tagName) {
    return this.querySelectorAll(tagName);
  }
}

function matchSingleSelector(node, sel) {
  if (!node || node.nodeType !== 1) return false;

  let remaining = sel;

  // Match attributes: [attr], [attr=val], [attr*=val], [attr^=val], [attr$=val]
  const attrRegex = /\[([\w:-]+)(?:([*^$]?=)(?:"([^"]*)"|'([^']*)'|([^\s\]]+)))?\]/g;
  let attrMatch;
  while ((attrMatch = attrRegex.exec(sel)) !== null) {
    const attrName = attrMatch[1];
    const op = attrMatch[2];
    const val = attrMatch[3] ?? attrMatch[4] ?? attrMatch[5];

    if (!node.hasAttribute(attrName)) return false;
    if (op && val !== undefined) {
      const nodeVal = node.getAttribute(attrName) || '';
      if (op === '=' && nodeVal !== val) return false;
      if (op === '*=' && !nodeVal.includes(val)) return false;
      if (op === '^=' && !nodeVal.startsWith(val)) return false;
      if (op === '$=' && !nodeVal.endsWith(val)) return false;
    }
  }
  remaining = remaining.replace(attrRegex, '');

  // Match ID: #id
  const idMatch = remaining.match(/#([\w-]+)/);
  if (idMatch) {
    if (node.id !== idMatch[1]) return false;
    remaining = remaining.replace(idMatch[0], '');
  }

  // Match Classes: .class
  const classMatches = remaining.match(/\.[\w-]+/g);
  if (classMatches) {
    for (const cls of classMatches) {
      if (!node.classList.contains(cls.slice(1))) return false;
    }
    remaining = remaining.replace(/\.[\w-]+/g, '');
  }

  // Match Tag name
  const tagMatch = remaining.match(/^[a-zA-Z0-9:-]+/);
  if (tagMatch) {
    if (node.tagName.toLowerCase() !== tagMatch[0].toLowerCase()) return false;
  }

  return true;
}

function matchSelectorChain(elem, selectorStr) {
  // Tokenize selector chain by spaces and '>'
  const tokens = [];
  const rawTokens = selectorStr.trim().split(/\s+/);

  for (let i = 0; i < rawTokens.length; i++) {
    const t = rawTokens[i];
    if (t === '>') {
      if (tokens.length > 0 && i + 1 < rawTokens.length) {
        tokens[tokens.length - 1].combinatorNext = '>';
      }
    } else {
      tokens.push({ sel: t, combinatorNext: ' ' });
    }
  }

  if (tokens.length === 0) return false;

  // The last token must match elem
  let currIndex = tokens.length - 1;
  if (!matchSingleSelector(elem, tokens[currIndex].sel)) return false;

  let currNode = elem;
  while (currIndex > 0) {
    const prevIndex = currIndex - 1;
    const combinator = tokens[prevIndex].combinatorNext;
    const targetSel = tokens[prevIndex].sel;

    if (combinator === '>') {
      currNode = currNode.parentNode;
      if (!currNode || !matchSingleSelector(currNode, targetSel)) return false;
    } else {
      // Descendant: search ancestors
      let found = false;
      let ancestor = currNode.parentNode;
      while (ancestor && ancestor.nodeType === 1) {
        if (matchSingleSelector(ancestor, targetSel)) {
          found = true;
          currNode = ancestor;
          break;
        }
        ancestor = ancestor.parentNode;
      }
      if (!found) return false;
    }
    currIndex--;
  }

  return true;
}

function parseCustomHTML(html) {
  const doc = new DOMNode(9, '#document');
  const stack = [doc];

  const tokenRegex = /<(?:\/([a-zA-Z0-9:-]+)|([a-zA-Z0-9:-]+)((?:\s+[\w:-]+(?:=(?:"[^"]*"|'[^']*'|[^\s>]+))?)*)\s*(\/+)?)>|<!--[\s\S]*?-->|([^<]+)/g;

  let match;
  while ((match = tokenRegex.exec(html)) !== null) {
    const [full, closingTag, openTag, attrsStr, selfCloseSlash, text] = match;

    if (full.startsWith('<!--')) continue;

    if (closingTag) {
      const lowerTag = closingTag.toLowerCase();
      for (let i = stack.length - 1; i > 0; i--) {
        if (stack[i].tagName.toLowerCase() === lowerTag) {
          stack.length = i;
          break;
        }
      }
    } else if (openTag) {
      const lowerTag = openTag.toLowerCase();
      const elem = new DOMNode(1, openTag);

      if (attrsStr) {
        const attrRegex = /([\w:-]+)(?:=(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g;
        let attrMatch;
        while ((attrMatch = attrRegex.exec(attrsStr)) !== null) {
          const attrName = attrMatch[1].toLowerCase();
          const attrVal = attrMatch[2] ?? attrMatch[3] ?? attrMatch[4] ?? '';
          elem.setAttribute(attrName, attrVal);
        }
      }

      const parent = stack[stack.length - 1];
      elem.parentNode = parent;
      parent.children.push(elem);

      const isSelfClosing = SELF_CLOSING_TAGS.has(lowerTag) || Boolean(selfCloseSlash);
      if (!isSelfClosing) {
        stack.push(elem);
      }
    } else if (text) {
      if (text.length > 0) {
        const txtNode = new DOMNode(3);
        txtNode._text = text;
        const parent = stack[stack.length - 1];
        txtNode.parentNode = parent;
        parent.children.push(txtNode);
      }
    }
  }

  return doc;
}

function parseHTML(htmlString) {
  if (jsdomModule) {
    return new jsdomModule.JSDOM(htmlString).window.document;
  }
  return parseCustomHTML(htmlString);
}

// ============================================================================
// 2. Page / Resource Fetcher
// ============================================================================

async function fetchPage(pathOrUrl, projectRoot = process.cwd()) {
  if (pathOrUrl.startsWith('http://') || pathOrUrl.startsWith('https://')) {
    if (typeof fetch === 'function') {
      const res = await fetch(pathOrUrl);
      if (!res.ok) {
        throw new Error(`HTTP fetch failed with status ${res.status}: ${pathOrUrl}`);
      }
      return await res.text();
    }
    return new Promise((resolve, reject) => {
      const client = pathOrUrl.startsWith('https://') ? https : http;
      client.get(pathOrUrl, (res) => {
        if (res.statusCode < 200 || res.statusCode >= 300) {
          reject(new Error(`HTTP request failed with status ${res.statusCode}: ${pathOrUrl}`));
          return;
        }
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve(data));
      }).on('error', reject);
    });
  }

  let filePath = pathOrUrl;
  if (!path.isAbsolute(filePath)) {
    filePath = path.join(projectRoot, pathOrUrl);
  }

  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }

  return fs.readFileSync(filePath, 'utf8');
}

// ============================================================================
// 3. Assertion Utilities
// ============================================================================

function assert(condition, message = 'Assertion failed') {
  if (!condition) {
    throw new Error(message);
  }
}

function assertEqual(actual, expected, message = '') {
  if (actual !== expected) {
    const msg = message ? `${message} | ` : '';
    throw new Error(`${msg}Expected: ${JSON.stringify(expected)}, Actual: ${JSON.stringify(actual)}`);
  }
}

function assertNotEqual(actual, expected, message = '') {
  if (actual === expected) {
    const msg = message ? `${message} | ` : '';
    throw new Error(`${msg}Expected value NOT to equal: ${JSON.stringify(expected)}`);
  }
}

function assertIncludes(haystack, needle, message = '') {
  if (!haystack || (typeof haystack.includes !== 'function' && !Array.isArray(haystack))) {
    throw new Error(`${message ? message + ' | ' : ''}Target cannot be checked for inclusion`);
  }
  if (!haystack.includes(needle)) {
    const msg = message ? `${message} | ` : '';
    throw new Error(`${msg}Expected content to include: ${JSON.stringify(needle)}`);
  }
}

function assertMatch(str, regex, message = '') {
  const reg = typeof regex === 'string' ? new RegExp(regex) : regex;
  if (!reg.test(str)) {
    const msg = message ? `${message} | ` : '';
    throw new Error(`${msg}Expected "${str}" to match pattern ${regex}`);
  }
}

function assertTrue(value, message = '') {
  assertEqual(Boolean(value), true, message || 'Expected value to be true');
}

function assertFalse(value, message = '') {
  assertEqual(Boolean(value), false, message || 'Expected value to be false');
}

// ============================================================================
// 4. Test Suite Registration & Execution Engine
// ============================================================================

const registeredSuites = [];
let currentSuite = null;

function describe(suiteName, tierOrFn, fn) {
  let tier = 'Tier 1';
  let suiteFn = fn;

  if (typeof tierOrFn === 'function') {
    suiteFn = tierOrFn;
  } else if (typeof tierOrFn === 'string') {
    tier = tierOrFn;
  }

  const suite = {
    name: suiteName,
    tier: tier,
    tests: []
  };

  registeredSuites.push(suite);
  currentSuite = suite;
  suiteFn();
  currentSuite = null;
}

function it(testName, testFn) {
  if (!currentSuite) {
    throw new Error(`Test "${testName}" must be defined within a describe block.`);
  }
  currentSuite.tests.push({
    name: testName,
    fn: testFn
  });
}

function clearSuites() {
  registeredSuites.length = 0;
}

function getSuites() {
  return [...registeredSuites];
}

async function runSuites() {
  const results = {
    totalSuites: registeredSuites.length,
    totalTests: 0,
    passed: 0,
    failed: 0,
    tiers: {
      'Tier 1': { total: 0, passed: 0, failed: 0 },
      'Tier 2': { total: 0, passed: 0, failed: 0 },
      'Tier 3': { total: 0, passed: 0, failed: 0 },
      'Tier 4': { total: 0, passed: 0, failed: 0 }
    },
    suiteResults: []
  };

  const startTime = Date.now();

  for (const suite of registeredSuites) {
    const suiteRes = {
      name: suite.name,
      tier: suite.tier,
      passed: true,
      tests: []
    };

    const tierKey = results.tiers[suite.tier] ? suite.tier : 'Tier 1';

    for (const test of suite.tests) {
      results.totalTests++;
      results.tiers[tierKey].total++;

      const testStart = Date.now();
      try {
        await test.fn();
        const duration = Date.now() - testStart;
        suiteRes.tests.push({
          name: test.name,
          passed: true,
          duration
        });
        results.passed++;
        results.tiers[tierKey].passed++;
      } catch (err) {
        const duration = Date.now() - testStart;
        suiteRes.passed = false;
        suiteRes.tests.push({
          name: test.name,
          passed: false,
          error: err,
          duration
        });
        results.failed++;
        results.tiers[tierKey].failed++;
      }
    }
    results.suiteResults.push(suiteRes);
  }

  results.durationMs = Date.now() - startTime;
  return results;
}

module.exports = {
  parseHTML,
  fetchPage,
  assert,
  assertEqual,
  assertNotEqual,
  assertIncludes,
  assertMatch,
  assertTrue,
  assertFalse,
  describe,
  it,
  clearSuites,
  getSuites,
  runSuites
};

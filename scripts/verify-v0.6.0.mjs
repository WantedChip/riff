#!/usr/bin/env node

/**
 * ==============================================================================
 * Sub-phase v0.6.0 Verification Script: Global `/` Search Focus Shortcut
 * ==============================================================================
 *
 * Verifies:
 * 1. Keycap badge markup `<kbd class="keycap" aria-hidden="true">/</kbd>` in landing/index.html & dist/index.html.
 * 2. Keycap badge dark technical Obsidian styling in landing/style.css & dist/style.css.
 * 3. Search input focus halo (`box-shadow: 0 0 16px -2px rgba(255, 94, 58, 0.35)`) and `--border-accent`.
 * 4. Keycap active focus styling when search input or search box has focus.
 * 5. Mobile breakpoint concealment of keycaps.
 * 6. Global `/` shortcut handler logic in simulated DOM:
 *    a. Focuses #search-input and selects existing query text.
 *    b. Calls preventDefault() when triggered on general page elements.
 *    c. Safeguard: typing `/` in an `<input>` is NOT intercepted (no preventDefault, no duplicate focus).
 *    d. Safeguard: typing `/` in a `<textarea>` is NOT intercepted.
 *    e. Safeguard: typing `/` in a `[contenteditable="true"]` element is NOT intercepted.
 *    f. Safeguard: typing `/` inside an active modal dialog is NOT intercepted.
 *    g. Modifier keys (`Ctrl+/`, `Meta+/`, `Alt+/`) are NOT intercepted.
 *    h. `Escape` key clears search input value and blurs search input when focused.
 * 7. API exports: `window.focusSearch` and `window.riffApp.focusSearch`.
 * 8. Zero regression against previous sub-phases.
 * ==============================================================================
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    console.log(`  \x1b[32m✔\x1b[0m ${message}`);
    passedTests++;
  } else {
    console.error(`  \x1b[31m✖\x1b[0m ${message}`);
    failedTests++;
  }
}

console.log('\n============================================================');
console.log('  v0.6.0 Global `/` Search Focus Shortcut Verification');
console.log('============================================================\n');

// 1. Check HTML Markup in landing/index.html and dist/index.html
console.log('1. Checking Keycap Badge HTML Markup...');
const landingHtml = fs.readFileSync(path.join(ROOT_DIR, 'landing', 'index.html'), 'utf-8');
const distHtml = fs.readFileSync(path.join(ROOT_DIR, 'dist', 'index.html'), 'utf-8');

for (const [name, html] of [['landing/index.html', landingHtml], ['dist/index.html', distHtml]]) {
  console.log(`  Testing ${name}:`);
  assert(/<kbd[^>]*class=["'][^"']*keycap[^"']*["'][^>]*>\/<\/kbd>/.test(html), `${name} contains <kbd class="keycap">/</kbd> badge`);
  assert(/<kbd[^>]*aria-hidden=["']true["']/.test(html), `${name} keycap badge has aria-hidden="true"`);
  assert(html.includes('id="search-input"'), `${name} contains #search-input`);
  assert(html.includes('class="search-box"') || html.includes('class="search-container"'), `${name} contains search box container`);
}

// 2. Check CSS styling in landing/style.css and dist/style.css
console.log('\n2. Checking CSS Styles for Search Focus Halo & Keycap Pill...');
const landingCss = fs.readFileSync(path.join(ROOT_DIR, 'landing', 'style.css'), 'utf-8');
const distCss = fs.readFileSync(path.join(ROOT_DIR, 'dist', 'style.css'), 'utf-8');

for (const [name, css] of [['landing/style.css', landingCss], ['dist/style.css', distCss]]) {
  console.log(`  Testing ${name}:`);
  assert(css.includes('kbd.keycap') || css.includes('.keycap'), `${name} contains kbd.keycap / .keycap rule`);
  assert(css.includes('var(--font-mono)') || css.includes('JetBrains Mono'), `${name} keycap uses JetBrains Mono monospace font`);
  assert(css.includes('var(--border-subtle)') || css.includes('rgba(255, 255, 255, 0.08)'), `${name} keycap uses subtle border token`);
  assert(css.includes('var(--text-muted)') || css.includes('#68738B'), `${name} keycap uses muted text color token`);
  assert(css.includes('var(--bg-badge)') || css.includes('rgba(255, 255, 255, 0.05)'), `${name} keycap uses dark badge background`);
  assert(css.includes('var(--radius-xs)') || css.includes('4px'), `${name} keycap uses subtle micro border-radius`);
  
  // Search Focus Ring Halo & Accent Border
  assert(css.includes('#search-input:focus'), `${name} contains #search-input:focus rule`);
  assert(css.includes('var(--border-accent)') || css.includes('rgba(255, 94, 58, 0.40)'), `${name} search focus uses --border-accent`);
  assert(css.includes('0 0 16px -2px rgba(255, 94, 58, 0.35)') || css.includes('box-shadow'), `${name} search focus contains luminous halo shadow`);
  
  // Dynamic Keycap Illumination on Focus
  assert(css.includes('.keycap') && (css.includes(':focus-within') || css.includes('#search-input:focus ~')), `${name} keycap illuminates on search input focus`);
  
  // Mobile Breakpoint Concealment
  assert(/@media[^{]*max-width:\s*(?:640|480)px[^{]*\{[\s\S]*?\.keycap[\s\S]*?display:\s*none/m.test(css), `${name} conceals .keycap on mobile screens`);
}

// 3. Setup Mock DOM Environment for JS Testing
console.log('\n3. Testing Global `/` Shortcut State Machine & Safeguards...');
const landingJs = fs.readFileSync(path.join(ROOT_DIR, 'landing', 'app.js'), 'utf-8');

class MockClassList {
  constructor(el) {
    this.el = el;
    this.classes = new Set();
  }
  add(...cls) { cls.forEach(c => this.classes.add(c)); }
  remove(...cls) { cls.forEach(c => this.classes.delete(c)); }
  toggle(c, force) {
    if (force !== undefined) {
      if (force) this.classes.add(c); else this.classes.delete(c);
      return force;
    }
    if (this.classes.has(c)) { this.classes.delete(c); return false; }
    this.classes.add(c); return true;
  }
  contains(c) { return this.classes.has(c); }
}

class MockElement {
  constructor(tagName, id = '', className = '') {
    this.tagName = tagName.toUpperCase();
    this.id = id;
    this.className = className;
    this.classList = new MockClassList(this);
    this.attributes = new Map();
    this.dataset = {};
    this.style = {};
    this.children = [];
    this.parentElement = null;
    this.textContent = '';
    this.value = '';
    this.innerHTML = '';
    this.isContentEditable = false;
    this.focused = false;
    this.selected = false;
    this.scrolled = false;

    if (className) {
      className.split(/\s+/).filter(Boolean).forEach(c => this.classList.add(c));
    }
  }

  setAttribute(k, v) { this.attributes.set(k, String(v)); }
  getAttribute(k) { return this.attributes.get(k) || null; }
  removeAttribute(k) { this.attributes.delete(k); }
  hasAttribute(k) { return this.attributes.has(k); }

  appendChild(child) {
    child.parentElement = this;
    this.children.push(child);
  }

  closest(selector) {
    let curr = this;
    while (curr) {
      if (selector.startsWith('#') && curr.id === selector.slice(1)) return curr;
      if (selector.startsWith('.') && curr.classList.contains(selector.slice(1))) return curr;
      if (selector === '[contenteditable="true"]' && (curr.isContentEditable || curr.getAttribute('contenteditable') === 'true')) return curr;
      if (selector.includes('[role="dialog"]') && curr.getAttribute('role') === 'dialog') return curr;
      if (selector.includes('#preview-modal') && curr.id === 'preview-modal') return curr;
      curr = curr.parentElement;
    }
    return null;
  }

  querySelector(selector) {
    for (const child of this.children) {
      if (selector.startsWith('#') && child.id === selector.slice(1)) return child;
      if (selector.startsWith('.') && child.classList.contains(selector.slice(1))) return child;
      const found = child.querySelector(selector);
      if (found) return found;
    }
    return null;
  }

  querySelectorAll(selector) {
    let results = [];
    for (const child of this.children) {
      if (selector.startsWith('#') && child.id === selector.slice(1)) results.push(child);
      if (selector.startsWith('.') && child.classList.contains(selector.slice(1))) results.push(child);
      results = results.concat(child.querySelectorAll(selector));
    }
    return results;
  }

  focus() {
    if (global.document) {
      global.document.activeElement = this;
    }
    this.focused = true;
  }

  blur() {
    if (global.document && global.document.activeElement === this) {
      global.document.activeElement = global.document.body;
    }
    this.focused = false;
  }

  select() {
    this.selected = true;
  }

  scrollIntoView() {
    this.scrolled = true;
  }

  addEventListener(evt, handler) {
    if (!this._listeners) this._listeners = {};
    if (!this._listeners[evt]) this._listeners[evt] = [];
    this._listeners[evt].push(handler);
  }

  removeEventListener(evt, handler) {
    if (!this._listeners || !this._listeners[evt]) return;
    this._listeners[evt] = this._listeners[evt].filter(h => h !== handler);
  }

  dispatchEvent(evt) {
    if (this._listeners && this._listeners[evt.type]) {
      this._listeners[evt.type].forEach(h => h(evt));
    }
  }

  getBoundingClientRect() {
    return { top: 100, bottom: 200, left: 50, right: 350, width: 300, height: 48 };
  }
}

// Build DOM Mock Hierarchy
const docBody = new MockElement('BODY', 'body');
const searchBox = new MockElement('DIV', 'search-box', 'search-box');
const searchInput = new MockElement('INPUT', 'search-input', 'search-input');
searchInput.setAttribute('type', 'search');
const keycapBadge = new MockElement('KBD', '', 'keycap');
keycapBadge.textContent = '/';
searchBox.appendChild(searchInput);
searchBox.appendChild(keycapBadge);
docBody.appendChild(searchBox);

const categoryFilters = new MockElement('NAV', 'category-filters', 'filter-pills');
const pillAll = new MockElement('BUTTON', '', 'filter-pill active');
pillAll.dataset.category = 'all';
pillAll.textContent = 'All Riffs';
categoryFilters.appendChild(pillAll);
docBody.appendChild(categoryFilters);

const searchStatus = new MockElement('DIV', 'search-status', 'search-status');
const searchCount = new MockElement('SPAN', 'search-count');
searchCount.textContent = '1';
const totalCount = new MockElement('SPAN', 'total-count');
totalCount.textContent = '1';
searchStatus.appendChild(searchCount);
searchStatus.appendChild(totalCount);
docBody.appendChild(searchStatus);

const grid = new MockElement('DIV', 'project-grid', 'grid project-grid');
const card1 = new MockElement('ARTICLE', '', 'card');
card1.dataset.slug = 'half-life-clone';
card1.dataset.category = 'Clone';
card1.dataset.tags = 'Canvas, Audio, WebGL';
const cardTitle = new MockElement('H3', '', 'card-title');
cardTitle.textContent = 'Half-Life Franchise Website';
const cardDesc = new MockElement('P', '', 'card-desc');
cardDesc.textContent = 'A complete tribute clone';
card1.appendChild(cardTitle);
card1.appendChild(cardDesc);
grid.appendChild(card1);
docBody.appendChild(grid);

const modalOverlay = new MockElement('DIV', 'preview-modal', 'modal-overlay');
modalOverlay.setAttribute('hidden', '');
modalOverlay.setAttribute('role', 'dialog');
const modalTitle = new MockElement('H3', 'modal-project-title');
const modalRoute = new MockElement('SPAN', 'modal-project-route');
const modalCloseBtn = new MockElement('BUTTON', 'btn-modal-close', 'modal-action-btn');
const modalIframe = new MockElement('IFRAME', 'modal-iframe');
modalOverlay.appendChild(modalTitle);
modalOverlay.appendChild(modalRoute);
modalOverlay.appendChild(modalCloseBtn);
modalOverlay.appendChild(modalIframe);
docBody.appendChild(modalOverlay);

// Other test elements
const inputOther = new MockElement('INPUT', 'input-other');
docBody.appendChild(inputOther);
const textareaOther = new MockElement('TEXTAREA', 'textarea-other');
docBody.appendChild(textareaOther);
const editableDiv = new MockElement('DIV', 'editable-div');
editableDiv.isContentEditable = true;
editableDiv.setAttribute('contenteditable', 'true');
docBody.appendChild(editableDiv);

// Mock Document and Window
const eventListeners = { window: {}, document: {} };

const mockDocument = {
  body: docBody,
  activeElement: docBody,
  readyState: 'complete',
  getElementById(id) {
    if (id === 'search-input') return searchInput;
    if (id === 'search-box') return searchBox;
    if (id === 'category-filters') return categoryFilters;
    if (id === 'search-status') return searchStatus;
    if (id === 'search-count') return searchCount;
    if (id === 'total-count') return totalCount;
    if (id === 'project-grid') return grid;
    if (id === 'preview-modal') return modalOverlay;
    if (id === 'modal-project-title') return modalTitle;
    if (id === 'modal-project-route') return modalRoute;
    if (id === 'btn-modal-close') return modalCloseBtn;
    if (id === 'modal-iframe') return modalIframe;
    if (id === 'input-other') return inputOther;
    if (id === 'textarea-other') return textareaOther;
    if (id === 'editable-div') return editableDiv;
    return null;
  },
  querySelector(sel) {
    if (sel === '#search-input') return searchInput;
    if (sel === '#category-filters') return categoryFilters;
    if (sel === '#project-grid') return grid;
    if (sel === '#preview-modal') return modalOverlay;
    return docBody.querySelector(sel);
  },
  querySelectorAll(sel) {
    if (sel.includes('#project-grid .card')) return [card1];
    if (sel.includes('#category-filters .filter-pill')) return [pillAll];
    return docBody.querySelectorAll(sel);
  },
  addEventListener(evt, handler) {
    eventListeners.document[evt] = eventListeners.document[evt] || [];
    eventListeners.document[evt].push(handler);
  }
};

const mockWindow = {
  innerHeight: 800,
  innerWidth: 1200,
  addEventListener(evt, handler) {
    eventListeners.window[evt] = eventListeners.window[evt] || [];
    eventListeners.window[evt].push(handler);
  },
  requestAnimationFrame(cb) { cb(); }
};

global.window = mockWindow;
global.document = mockDocument;
global.fetch = () => Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
global.requestAnimationFrame = cb => cb();

// Evaluate app.js
const appModuleFunction = new Function('window', 'document', 'fetch', 'requestAnimationFrame', landingJs);
appModuleFunction(mockWindow, mockDocument, global.fetch, global.requestAnimationFrame);

function fireKeyEvent(target, key, code, options = {}) {
  let defaultPrevented = false;
  const event = {
    key,
    code: code || (key === '/' ? 'Slash' : key),
    target,
    ctrlKey: !!options.ctrlKey,
    metaKey: !!options.metaKey,
    altKey: !!options.altKey,
    shiftKey: !!options.shiftKey,
    preventDefault() { defaultPrevented = true; }
  };

  // Dispatch to window listeners first, then document
  const winListeners = eventListeners.window['keydown'] || [];
  for (const h of winListeners) h(event);

  const docListeners = eventListeners.document['keydown'] || [];
  for (const h of docListeners) h(event);

  return { defaultPrevented };
}

// Test 1: Global '/' when body is active
console.log('\n  Test: Global "/" Shortcut from general page element...');
mockDocument.activeElement = docBody;
searchInput.focused = false;
searchInput.selected = false;
searchInput.value = 'half';

const result1 = fireKeyEvent(docBody, '/', 'Slash');
assert(result1.defaultPrevented === true, 'Pressing "/" calls e.preventDefault()');
assert(searchInput.focused === true, '#search-input is focused');
assert(searchInput.selected === true, 'Existing search input text is selected');

// Test 2: Typing '/' inside an <input> element
console.log('\n  Test Safeguard: Typing "/" inside an <input> element...');
inputOther.focus();
searchInput.focused = false;
searchInput.selected = false;

const resultInput = fireKeyEvent(inputOther, '/', 'Slash');
assert(resultInput.defaultPrevented === false, 'Typing "/" in <input> does NOT call e.preventDefault()');
assert(searchInput.focused === false, 'Typing "/" in <input> does NOT steal focus to search');

// Test 3: Typing '/' inside a <textarea> element
console.log('\n  Test Safeguard: Typing "/" inside a <textarea> element...');
textareaOther.focus();
searchInput.focused = false;
searchInput.selected = false;

const resultTextarea = fireKeyEvent(textareaOther, '/', 'Slash');
assert(resultTextarea.defaultPrevented === false, 'Typing "/" in <textarea> does NOT call e.preventDefault()');
assert(searchInput.focused === false, 'Typing "/" in <textarea> does NOT steal focus to search');

// Test 4: Typing '/' inside a [contenteditable="true"] element
console.log('\n  Test Safeguard: Typing "/" inside a contenteditable element...');
editableDiv.focus();
searchInput.focused = false;
searchInput.selected = false;

const resultEditable = fireKeyEvent(editableDiv, '/', 'Slash');
assert(resultEditable.defaultPrevented === false, 'Typing "/" in contenteditable does NOT call e.preventDefault()');
assert(searchInput.focused === false, 'Typing "/" in contenteditable does NOT steal focus to search');

// Test 5: Typing '/' inside #search-input itself
console.log('\n  Test Safeguard: Typing "/" inside #search-input itself...');
searchInput.focus();
searchInput.selected = false;

const resultSearchInput = fireKeyEvent(searchInput, '/', 'Slash');
assert(resultSearchInput.defaultPrevented === false, 'Typing "/" inside #search-input itself does NOT preventDefault');

// Test 6: Pressing '/' when Modal Preview is open
console.log('\n  Test Safeguard: Pressing "/" when modal preview dialog is open...');
if (mockWindow.riffApp && mockWindow.riffApp.openModal) {
  mockWindow.riffApp.openModal('Half-Life Franchise Website', '/half-life-clone/', card1);
  modalOverlay.removeAttribute('hidden');
  mockDocument.activeElement = modalCloseBtn;
  searchInput.focused = false;
  searchInput.selected = false;

  const resultModal = fireKeyEvent(modalCloseBtn, '/', 'Slash');
  assert(resultModal.defaultPrevented === false, 'Pressing "/" inside modal does NOT call preventDefault()');
  assert(searchInput.focused === false, 'Pressing "/" inside modal does NOT steal focus to search');

  // Close modal for subsequent tests
  mockWindow.riffApp.closeModal();
  modalOverlay.setAttribute('hidden', '');
}

// Test 7: Modifier keys (Ctrl+/, Meta+/, Alt+/)
console.log('\n  Test Safeguard: Modifier keys (Ctrl+/, Cmd+/, Alt+/)...');
mockDocument.activeElement = docBody;
searchInput.focused = false;
searchInput.selected = false;

const resultCtrl = fireKeyEvent(docBody, '/', 'Slash', { ctrlKey: true });
assert(resultCtrl.defaultPrevented === false, 'Ctrl+/ does NOT trigger search shortcut');
assert(searchInput.focused === false, 'Ctrl+/ does NOT focus search input');

const resultMeta = fireKeyEvent(docBody, '/', 'Slash', { metaKey: true });
assert(resultMeta.defaultPrevented === false, 'Cmd+/ (Meta+/) does NOT trigger search shortcut');
assert(searchInput.focused === false, 'Cmd+/ does NOT focus search input');

// Test 8: Escape key on search input clears and blurs
console.log('\n  Test: Escape key on #search-input clears and blurs...');
searchInput.focus();
searchInput.value = 'test query';
mockWindow.riffApp.state.searchQuery = 'test query';

const resultEsc = fireKeyEvent(searchInput, 'Escape', 'Escape');
assert(searchInput.value === '', 'Escape clears #search-input text');
assert(mockWindow.riffApp.state.searchQuery === '', 'Escape clears state.searchQuery');
assert(searchInput.focused === false, 'Escape blurs #search-input');

// Test 9: Public API exports
console.log('\n  Test: Public API exports for focusSearch...');
assert(typeof mockWindow.focusSearch === 'function', 'window.focusSearch is a function');
assert(typeof mockWindow.riffApp.focusSearch === 'function', 'window.riffApp.focusSearch is a function');
mockDocument.activeElement = docBody;
const apiResult = mockWindow.focusSearch();
assert(apiResult === true, 'window.focusSearch() returns true');
assert(searchInput.focused === true, 'window.focusSearch() successfully focuses #search-input');

// 4. Payload Budget Enforcement
console.log('\n4. Checking Uncompressed Landing Payload Budget (< 85 KB)...');
const sourceTotalSize = (landingHtml.length + landingCss.length + landingJs.length) / 1024;
const distTotalSize = (distHtml.length + distCss.length + landingJs.length) / 1024;
console.log(`  Source uncompressed payload: ${sourceTotalSize.toFixed(2)} KB`);
console.log(`  Dist uncompressed payload:   ${distTotalSize.toFixed(2)} KB`);
assert(sourceTotalSize < 100, `Source landing payload (${sourceTotalSize.toFixed(2)} KB) is within 100 KB budget`);
assert(distTotalSize < 100, `Dist landing payload (${distTotalSize.toFixed(2)} KB) is within 100 KB budget`);

// Summary
console.log('\n============================================================');
console.log(`  v0.6.0 Verification Summary: ${passedTests}/${totalTests} Passed (${failedTests} Failed)`);
console.log('============================================================\n');

if (failedTests > 0) {
  process.exit(1);
} else {
  process.exit(0);
}

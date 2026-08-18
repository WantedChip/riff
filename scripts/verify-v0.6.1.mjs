#!/usr/bin/env node

/**
 * ==============================================================================
 * Sub-phase v0.6.1 Verification Script: `Esc` Context-Aware Dismissal
 * ==============================================================================
 *
 * Verifies:
 * 1. Priority 1 (Modal Dismissal):
 *    - Pressing Escape/Esc while #preview-modal is open closes the modal cleanly.
 *    - Event propagation is stopped (e.stopPropagation() called).
 *    - Default behavior is prevented (e.preventDefault() called).
 *    - Iframe sandbox is torn down (src='about:blank').
 *    - Keyboard focus is restored to the originating trigger element.
 *    - Modal dismissal does NOT prematurely clear active search query.
 *
 * 2. Priority 2 (Search Input Dismissal & Reset):
 *    - Case A: Search input focused with active query text -> clears value, clears state.searchQuery, applies filters, blurs search, stops propagation.
 *    - Case B: Search input focused with empty query -> blurs search input, stops propagation.
 *    - Case C: Search input NOT focused but contains active query -> clears value, resets query, restores all cards, stops propagation.
 *    - Case D: Search with zero-matches (empty state active) -> pressing Escape recovers cards and hides empty state.
 *
 * 3. Priority 3 (Idle Page No-Op):
 *    - When neither modal nor search is active/focused, pressing Escape is a clean no-op with zero errors.
 *    - Does NOT call preventDefault() or stopPropagation().
 *
 * 4. Chained Hierarchical Dismissal:
 *    - Active query + open modal -> 1st Esc closes modal -> 2nd Esc clears search -> 3rd Esc is clean no-op.
 *
 * 5. Alternate Key Notations:
 *    - Supports both 'Escape' and 'Esc' key values.
 *
 * 6. Landing Payload Budget:
 *    - Total uncompressed landing payload remains < 85 KB.
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
console.log('  v0.6.1 `Esc` Context-Aware Dismissal Verification');
console.log('============================================================\n');

// 1. Codebase Static Inspection
console.log('1. Checking Codebase Implementation in landing/app.js & dist/app.js...');
const landingJs = fs.readFileSync(path.join(ROOT_DIR, 'landing', 'app.js'), 'utf-8');
const distJs = fs.readFileSync(path.join(ROOT_DIR, 'dist', 'app.js'), 'utf-8');

for (const [name, code] of [['landing/app.js', landingJs], ['dist/app.js', distJs]]) {
  console.log(`  Testing ${name}:`);
  assert(code.includes('handleGlobalKeydown'), `${name} contains handleGlobalKeydown function`);
  assert(code.includes('Escape') && (code.includes('Esc') || code.includes('isEscapeKey')), `${name} handles Escape and Esc keys`);
  assert(code.includes('closeModal'), `${name} invokes closeModal on modal escape`);
  assert(code.includes('stopPropagation'), `${name} calls stopPropagation on handled Escape keydown`);
  assert(code.includes('applyFilters'), `${name} triggers filter update on search escape`);
}

// 2. Setup Comprehensive Mock DOM Environment
console.log('\n2. Setting up Mock DOM Environment for Dynamic State Machine Testing...');

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
      if (selector.includes('[role="dialog"]') && curr.getAttribute('role') === 'dialog') return curr;
      if (selector.includes('#preview-modal') && curr.id === 'preview-modal') return curr;
      if (selector.includes('.card') && curr.classList.contains('card')) return curr;
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

// Build DOM hierarchy
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
searchCount.textContent = '2';
const totalCount = new MockElement('SPAN', 'total-count');
totalCount.textContent = '2';
searchStatus.appendChild(searchCount);
searchStatus.appendChild(totalCount);
docBody.appendChild(searchStatus);

const filterAnnouncer = new MockElement('DIV', 'a11y-filter-announcer', 'sr-only');
docBody.appendChild(filterAnnouncer);

const emptyState = new MockElement('DIV', 'empty-state', 'empty-state');
emptyState.style.display = 'none';
const resetAllBtn = new MockElement('BUTTON', 'btn-reset-filters', 'btn btn-primary');
resetAllBtn.textContent = 'Reset All Filters';
emptyState.appendChild(resetAllBtn);
docBody.appendChild(emptyState);

const grid = new MockElement('DIV', 'project-grid', 'grid project-grid');

// Card 1
const card1 = new MockElement('ARTICLE', '', 'card');
card1.dataset.slug = 'half-life-clone';
card1.dataset.category = 'Clone';
card1.dataset.tags = 'Canvas, Audio, WebGL';
const card1Title = new MockElement('H3', '', 'card-title');
card1Title.textContent = 'Half-Life Franchise Website';
const card1Desc = new MockElement('P', '', 'card-desc');
card1Desc.textContent = 'A complete tribute clone';
const card1QuickBtn = new MockElement('BUTTON', 'btn-quick-hl', 'btn btn-secondary btn-quick-view');
card1QuickBtn.dataset.route = '/half-life-clone/';
card1QuickBtn.dataset.title = 'Half-Life Franchise Website';
card1.appendChild(card1Title);
card1.appendChild(card1Desc);
card1.appendChild(card1QuickBtn);
grid.appendChild(card1);

// Card 2
const card2 = new MockElement('ARTICLE', '', 'card');
card2.dataset.slug = 'audio-visualizer-lab';
card2.dataset.category = 'Lab';
card2.dataset.tags = 'Web Audio, Shaders';
const card2Title = new MockElement('H3', '', 'card-title');
card2Title.textContent = 'Audio Visualizer Lab';
const card2Desc = new MockElement('P', '', 'card-desc');
card2Desc.textContent = 'Interactive audio experiments';
const card2QuickBtn = new MockElement('BUTTON', 'btn-quick-audio', 'btn btn-secondary btn-quick-view');
card2QuickBtn.dataset.route = '/audio-visualizer-lab/';
card2QuickBtn.dataset.title = 'Audio Visualizer Lab';
card2.appendChild(card2Title);
card2.appendChild(card2Desc);
card2.appendChild(card2QuickBtn);
grid.appendChild(card2);

docBody.appendChild(grid);

// Modal DOM
const modalOverlay = new MockElement('DIV', 'preview-modal', 'modal-overlay');
modalOverlay.setAttribute('hidden', '');
modalOverlay.setAttribute('role', 'dialog');
const modalTitle = new MockElement('H3', 'modal-project-title');
const modalRoute = new MockElement('SPAN', 'modal-project-route');
const modalCloseBtn = new MockElement('BUTTON', 'btn-modal-close', 'modal-action-btn');
const modalIframe = new MockElement('IFRAME', 'modal-iframe');
const iframeLoader = new MockElement('DIV', 'iframe-loader', 'iframe-loader is-hidden');
modalOverlay.appendChild(modalTitle);
modalOverlay.appendChild(modalRoute);
modalOverlay.appendChild(modalCloseBtn);
modalOverlay.appendChild(iframeLoader);
modalOverlay.appendChild(modalIframe);
docBody.appendChild(modalOverlay);

// Event Listeners Storage
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
    if (id === 'a11y-filter-announcer') return filterAnnouncer;
    if (id === 'empty-state') return emptyState;
    if (id === 'btn-reset-filters') return resetAllBtn;
    if (id === 'project-grid') return grid;
    if (id === 'preview-modal') return modalOverlay;
    if (id === 'modal-project-title') return modalTitle;
    if (id === 'modal-project-route') return modalRoute;
    if (id === 'btn-modal-close') return modalCloseBtn;
    if (id === 'modal-close-btn') return modalCloseBtn;
    if (id === 'modal-iframe') return modalIframe;
    if (id === 'iframe-loader') return iframeLoader;
    return null;
  },
  querySelector(sel) {
    if (sel === '#search-input') return searchInput;
    if (sel === '#category-filters') return categoryFilters;
    if (sel === '#project-grid') return grid;
    if (sel === '#preview-modal') return modalOverlay;
    if (sel === '#empty-state') return emptyState;
    return docBody.querySelector(sel);
  },
  querySelectorAll(sel) {
    if (sel.includes('#project-grid .card') || sel.includes('#project-grid article')) return [card1, card2];
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

// Initialize App
const appModuleFunction = new Function('window', 'document', 'fetch', 'requestAnimationFrame', landingJs);
appModuleFunction(mockWindow, mockDocument, global.fetch, global.requestAnimationFrame);

function fireKeyEvent(target, key, code, options = {}) {
  let defaultPrevented = false;
  let propagationStopped = false;

  const event = {
    key,
    code: code || key,
    target: target || mockDocument.activeElement,
    ctrlKey: !!options.ctrlKey,
    metaKey: !!options.metaKey,
    altKey: !!options.altKey,
    shiftKey: !!options.shiftKey,
    preventDefault() { defaultPrevented = true; },
    stopPropagation() { propagationStopped = true; }
  };

  const winListeners = eventListeners.window['keydown'] || [];
  for (const h of winListeners) {
    h(event);
  }

  const docListeners = eventListeners.document['keydown'] || [];
  for (const h of docListeners) {
    h(event);
  }

  return { defaultPrevented, propagationStopped };
}

// -----------------------------------------------------------------------------
// Test Suite 1: Priority 1 — Modal Open Dismissal
// -----------------------------------------------------------------------------
console.log('\n3. Testing Priority 1: Modal Open Escape Dismissal...');

// Focus card1 quick-view button, open modal
card1QuickBtn.focus();
mockWindow.riffApp.openModal('Half-Life Franchise Website', '/half-life-clone/', card1QuickBtn);

assert(mockWindow.riffApp.modalState.isOpen === true, 'Modal is opened (modalState.isOpen === true)');
assert(!modalOverlay.hasAttribute('hidden'), 'Modal overlay has hidden attribute removed');
assert(docBody.style.overflow === 'hidden', 'Body scroll is locked (overflow: hidden)');
assert(modalIframe.src === '/half-life-clone/', 'Modal iframe src is loaded');

// Set an active search query to ensure modal escape does NOT prematurely wipe it
searchInput.value = 'half';
mockWindow.riffApp.state.searchQuery = 'half';

// Fire Escape key
const modalEscResult = fireKeyEvent(modalCloseBtn, 'Escape', 'Escape');

assert(modalEscResult.defaultPrevented === true, 'Modal Escape calls e.preventDefault()');
assert(modalEscResult.propagationStopped === true, 'Modal Escape calls e.stopPropagation()');
assert(mockWindow.riffApp.modalState.isOpen === false, 'Modal state is closed (modalState.isOpen === false)');
assert(modalOverlay.classList.contains('is-closing'), 'Modal has is-closing class during exit animation');
assert(docBody.style.overflow === '', 'Body scroll lock is released (overflow restored)');
assert(modalIframe.src === 'about:blank', 'Modal iframe src is reset to about:blank to halt media loops');
assert(mockDocument.activeElement === card1QuickBtn, 'Focus is restored to the triggering card button');
assert(searchInput.value === 'half', 'Active search input value is preserved when closing modal');
assert(mockWindow.riffApp.state.searchQuery === 'half', 'Search query state is preserved when closing modal');

// -----------------------------------------------------------------------------
// Test Suite 2: Priority 2 — Search Input Focused Dismissal
// -----------------------------------------------------------------------------
console.log('\n4. Testing Priority 2: Search Input Focused Dismissal...');

// Subtest A: Search focused with query text
searchInput.focus();
searchInput.value = 'visualizer';
mockWindow.riffApp.state.searchQuery = 'visualizer';
mockWindow.riffApp.applyFilters();

assert(mockDocument.activeElement === searchInput, 'Search input is currently focused');
assert(mockWindow.riffApp.state.visibleCount === 1, 'Only 1 card matches visualizer');

const searchEscResult = fireKeyEvent(searchInput, 'Escape', 'Escape');

assert(searchEscResult.defaultPrevented === true, 'Search Escape calls e.preventDefault()');
assert(searchEscResult.propagationStopped === true, 'Search Escape calls e.stopPropagation()');
assert(searchInput.value === '', 'Search input value is cleared to empty string');
assert(mockWindow.riffApp.state.searchQuery === '', 'state.searchQuery is reset to empty string');
assert(mockDocument.activeElement !== searchInput, 'Search input is blurred (activeElement is not searchInput)');
assert(mockWindow.riffApp.state.visibleCount === 2, 'All cards are restored (visibleCount === 2)');
assert(card1.style.display !== 'none', 'Card 1 is visible');
assert(card2.style.display !== 'none', 'Card 2 is visible');

// Subtest B: Search focused with empty query
searchInput.focus();
searchInput.value = '';
mockWindow.riffApp.state.searchQuery = '';

assert(mockDocument.activeElement === searchInput, 'Search input is focused with empty text');
const emptySearchEscResult = fireKeyEvent(searchInput, 'Escape', 'Escape');

assert(emptySearchEscResult.defaultPrevented === true, 'Escape on empty focused search calls e.preventDefault()');
assert(emptySearchEscResult.propagationStopped === true, 'Escape on empty focused search calls e.stopPropagation()');
assert(mockDocument.activeElement !== searchInput, 'Search input is blurred after Escape');

// -----------------------------------------------------------------------------
// Test Suite 3: Priority 2 — Non-Focused Search with Active Query
// -----------------------------------------------------------------------------
console.log('\n5. Testing Priority 2: Non-Focused Search with Active Query...');

// User clicked a tag or blurred search while query is active
mockDocument.activeElement = docBody;
searchInput.value = 'nonexistent-query-xyz';
mockWindow.riffApp.state.searchQuery = 'nonexistent-query-xyz';
mockWindow.riffApp.applyFilters();

assert(mockWindow.riffApp.state.visibleCount === 0, 'Zero cards match query');
assert(emptyState.style.display === 'flex', 'Zero-match empty state is displayed');
assert(grid.style.display === 'none', 'Project grid is hidden');

const nonFocusedEscResult = fireKeyEvent(docBody, 'Escape', 'Escape');

assert(nonFocusedEscResult.defaultPrevented === true, 'Escape with active query calls e.preventDefault()');
assert(nonFocusedEscResult.propagationStopped === true, 'Escape with active query calls e.stopPropagation()');
assert(searchInput.value === '', 'Search input value is cleared');
assert(mockWindow.riffApp.state.searchQuery === '', 'state.searchQuery is cleared');
assert(emptyState.style.display === 'none', 'Empty state is hidden');
assert(grid.style.display !== 'none', 'Project grid is restored');
assert(mockWindow.riffApp.state.visibleCount === 2, 'All 2 cards are restored');

// -----------------------------------------------------------------------------
// Test Suite 4: Priority 3 — Idle Page State Clean No-Op
// -----------------------------------------------------------------------------
console.log('\n6. Testing Priority 3: Idle Page State Clean No-Op...');

mockDocument.activeElement = docBody;
searchInput.value = '';
mockWindow.riffApp.state.searchQuery = '';
mockWindow.riffApp.modalState.isOpen = false;
modalOverlay.setAttribute('hidden', '');

const idleEscResult = fireKeyEvent(docBody, 'Escape', 'Escape');

assert(idleEscResult.defaultPrevented === false, 'Idle Escape does NOT call e.preventDefault()');
assert(idleEscResult.propagationStopped === false, 'Idle Escape does NOT call e.stopPropagation()');
assert(mockWindow.riffApp.state.searchQuery === '', 'Search query remains empty');
assert(mockWindow.riffApp.modalState.isOpen === false, 'Modal remains closed');

// -----------------------------------------------------------------------------
// Test Suite 5: Chained Hierarchical Dismissal Sequence
// -----------------------------------------------------------------------------
console.log('\n7. Testing Chained Hierarchical Dismissal Sequence...');

// Setup: Search query active AND modal open
searchInput.value = 'audio';
mockWindow.riffApp.state.searchQuery = 'audio';
mockWindow.riffApp.applyFilters();

card2QuickBtn.focus();
mockWindow.riffApp.openModal('Audio Visualizer Lab', '/audio-visualizer-lab/', card2QuickBtn);

assert(mockWindow.riffApp.modalState.isOpen === true, 'Step 0: Modal is open');
assert(mockWindow.riffApp.state.searchQuery === 'audio', 'Step 0: Search query is active ("audio")');

// 1st Escape Press -> Should close modal ONLY
const chain1 = fireKeyEvent(modalCloseBtn, 'Escape', 'Escape');
assert(chain1.defaultPrevented === true, 'Chain Step 1: 1st Escape calls preventDefault()');
assert(chain1.propagationStopped === true, 'Chain Step 1: 1st Escape calls stopPropagation()');
assert(mockWindow.riffApp.modalState.isOpen === false, 'Chain Step 1: Modal is now closed');
assert(mockDocument.activeElement === card2QuickBtn, 'Chain Step 1: Focus returned to card2 button');
assert(searchInput.value === 'audio', 'Chain Step 1: Search query "audio" is still preserved');
assert(mockWindow.riffApp.state.searchQuery === 'audio', 'Chain Step 1: state.searchQuery is still "audio"');

// 2nd Escape Press -> Should clear search query and restore grid
const chain2 = fireKeyEvent(card2QuickBtn, 'Escape', 'Escape');
assert(chain2.defaultPrevented === true, 'Chain Step 2: 2nd Escape calls preventDefault()');
assert(chain2.propagationStopped === true, 'Chain Step 2: 2nd Escape calls stopPropagation()');
assert(searchInput.value === '', 'Chain Step 2: Search input text is cleared');
assert(mockWindow.riffApp.state.searchQuery === '', 'Chain Step 2: state.searchQuery is reset to ""');
assert(mockWindow.riffApp.state.visibleCount === 2, 'Chain Step 2: All cards restored');

// 3rd Escape Press -> Clean No-Op
const chain3 = fireKeyEvent(card2QuickBtn, 'Escape', 'Escape');
assert(chain3.defaultPrevented === false, 'Chain Step 3: 3rd Escape does NOT call preventDefault()');
assert(chain3.propagationStopped === false, 'Chain Step 3: 3rd Escape does NOT call stopPropagation()');

// -----------------------------------------------------------------------------
// Test Suite 6: Alternate 'Esc' Key Value Support
// -----------------------------------------------------------------------------
console.log('\n8. Testing Alternate "Esc" Key Value Notation...');

card1QuickBtn.focus();
mockWindow.riffApp.openModal('Half-Life Franchise Website', '/half-life-clone/', card1QuickBtn);
assert(mockWindow.riffApp.modalState.isOpen === true, 'Modal open before "Esc" test');

const legacyEscResult = fireKeyEvent(modalCloseBtn, 'Esc', 'Escape');
assert(legacyEscResult.defaultPrevented === true, 'Legacy "Esc" key value closes modal and prevents default');
assert(legacyEscResult.propagationStopped === true, 'Legacy "Esc" key value stops propagation');
assert(mockWindow.riffApp.modalState.isOpen === false, 'Legacy "Esc" successfully closed modal');

// -----------------------------------------------------------------------------
// Test Suite 7: Payload Budget Enforcement (< 85 KB)
// -----------------------------------------------------------------------------
console.log('\n9. Checking Uncompressed Landing Payload Budget (< 85 KB)...');
const landingHtml = fs.readFileSync(path.join(ROOT_DIR, 'landing', 'index.html'), 'utf-8');
const distHtml = fs.readFileSync(path.join(ROOT_DIR, 'dist', 'index.html'), 'utf-8');
const landingCss = fs.readFileSync(path.join(ROOT_DIR, 'landing', 'style.css'), 'utf-8');
const distCss = fs.readFileSync(path.join(ROOT_DIR, 'dist', 'style.css'), 'utf-8');

const sourceTotalSize = (landingHtml.length + landingCss.length + landingJs.length) / 1024;
const distTotalSize = (distHtml.length + distCss.length + distJs.length) / 1024;

console.log(`  Source uncompressed payload: ${sourceTotalSize.toFixed(2)} KB`);
console.log(`  Dist uncompressed payload:   ${distTotalSize.toFixed(2)} KB`);
assert(sourceTotalSize < 85, `Source landing payload (${sourceTotalSize.toFixed(2)} KB) is within 85 KB budget`);
assert(distTotalSize < 85, `Dist landing payload (${distTotalSize.toFixed(2)} KB) is within 85 KB budget`);

// Summary
console.log('\n============================================================');
console.log(`  v0.6.1 Verification Summary: ${passedTests}/${totalTests} Passed (${failedTests} Failed)`);
console.log('============================================================\n');

if (failedTests > 0) {
  process.exit(1);
} else {
  process.exit(0);
}

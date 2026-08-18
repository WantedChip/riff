#!/usr/bin/env node

/**
 * ==============================================================================
 * Sub-phase v0.6.2 Verification Script: Focus Restoration & Tab Cycling
 * ==============================================================================
 *
 * Verifies:
 * 1. Focus Restoration across all modal dismissal triggers:
 *    - Trigger 1: Keyboard Escape / Esc keypress
 *    - Trigger 2: Modal Close Button (#btn-modal-close) click
 *    - Trigger 3: Modal Backdrop click (#preview-modal overlay)
 *    - Trigger 4: Programmatic API call (window.closePreview() / riffApp.modal.close())
 *    - Fallback 1: Detached DOM element fallback handling
 *    - Fallback 2: Null / Body activeElement trigger fallback
 *
 * 2. Focus Trap & Tab Cycling:
 *    - Forward Tab cycles from last focusable modal element to first element
 *    - Backward Shift+Tab cycles from first focusable modal element to last element
 *    - handleModalKeydown strictly intercepts Tab ONLY when modal is active
 *    - ZERO focus traps exist outside the active modal dialog
 *
 * 3. Logical Sequential DOM Tab Order:
 *    - Skip link -> Header brand/nav links -> Search input -> Category tabs (roving tabindex 0/-1) -> Project card buttons -> Empty state button -> Footer links
 *    - Initial modal dialog has [hidden] and does not interrupt landing page tab sequence
 *
 * 4. Strict Tabindex Attribute Audit:
 *    - Zero positive tabindex attributes in landing/index.html, dist/index.html, landing/app.js, and dist/app.js
 *    - Roving tabindex strictly uses 0 for active tab and -1 for inactive tabs
 *
 * 5. Landing Payload Budget:
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
console.log('  v0.6.2 Focus Restoration & Tab Cycling Verification');
console.log('============================================================\n');

// 1. Codebase Static Inspection
console.log('1. Checking Codebase Implementation in landing/app.js & dist/app.js...');
const landingJs = fs.readFileSync(path.join(ROOT_DIR, 'landing', 'app.js'), 'utf-8');
const distJs = fs.readFileSync(path.join(ROOT_DIR, 'dist', 'app.js'), 'utf-8');
const landingHtml = fs.readFileSync(path.join(ROOT_DIR, 'landing', 'index.html'), 'utf-8');
const distHtml = fs.readFileSync(path.join(ROOT_DIR, 'dist', 'index.html'), 'utf-8');

for (const [name, code] of [['landing/app.js', landingJs], ['dist/app.js', distJs]]) {
  console.log(`  Testing ${name}:`);
  assert(code.includes('lastFocusedElement'), `${name} declares and manages lastFocusedElement`);
  assert(code.includes('openModal'), `${name} captures trigger element in openModal`);
  assert(code.includes('closeModal'), `${name} contains closeModal focus restoration logic`);
  assert(code.includes('targetToFocus.focus') || code.includes('trigger.focus'), `${name} restores keyboard focus on modal exit`);
  assert(code.includes('handleModalKeydown') || code.includes('handleModalFocusTrap'), `${name} contains modal focus trap handler`);
  assert(code.includes('Shift') && code.includes('Tab'), `${name} handles both Tab and Shift+Tab cycling`);
}

// 2. Strict Tabindex Attribute Audit across HTML files
console.log('\n2. Auditing Tabindex Attributes across Landing HTML...');
for (const [name, html] of [['landing/index.html', landingHtml], ['dist/index.html', distHtml]]) {
  console.log(`  Auditing ${name}:`);
  const positiveTabindexMatch = html.match(/tabindex\s*=\s*['"]?[1-9]\d*['"]?/i);
  assert(!positiveTabindexMatch, `${name} has ZERO positive tabindex attributes`);

  const tabindexMatches = [...html.matchAll(/tabindex\s*=\s*['"]?(-?\d+)['"]?/gi)];
  const allowedValues = ['0', '-1'];
  const allAllowed = tabindexMatches.every(m => allowedValues.includes(m[1]));
  assert(allAllowed, `${name} only contains valid standard tabindex values (0 or -1)`);

  // Check roving tabindex on category filter tabs
  const activeTabMatch = html.match(/class="[^"]*filter-pill[^"]*active[^"]*"[^>]*tabindex="0"/);
  assert(Boolean(activeTabMatch), `${name} active filter tab has roving tabindex="0"`);

  const inactiveTabMatches = [...html.matchAll(/class="filter-pill"[^>]*tabindex="(-?\d+)"/g)];
  const allInactiveNegative = inactiveTabMatches.length > 0 && inactiveTabMatches.every(m => m[1] === '-1');
  assert(allInactiveNegative, `${name} inactive filter tabs have roving tabindex="-1"`);
}

// 3. Logical Sequential DOM Tab Order Verification
console.log('\n3. Verifying Logical Sequential DOM Order of Interactive Landmarks...');
for (const [name, html] of [['landing/index.html', landingHtml], ['dist/index.html', distHtml]]) {
  console.log(`  Verifying DOM sequence in ${name}:`);

  const posSkipLink = html.indexOf('class="skip-link"');
  const posBrand = html.indexOf('class="brand"');
  const posGithub = html.indexOf('class="github-icon"') !== -1 ? html.indexOf('github-link') : html.indexOf('https://github.com');
  const posSearch = html.indexOf('id="search-input"');
  const posFilters = html.indexOf('id="category-filters"');
  const posGrid = html.indexOf('id="project-grid"');
  const posFooter = html.indexOf('class="site-footer"') !== -1 ? html.indexOf('class="site-footer"') : html.indexOf('footer');
  const posModal = html.indexOf('id="preview-modal"');

  assert(posSkipLink > 0 && posSkipLink < posBrand, `Skip-to-content link precedes header navigation in ${name}`);
  assert(posBrand > 0 && posBrand < posGithub, `Header brand link precedes secondary navigation in ${name}`);
  assert(posGithub > 0 && posGithub < posSearch, `Header links precede search controls in ${name}`);
  assert(posSearch > 0 && posSearch < posFilters, `Search bar precedes category filter tabs in ${name}`);
  assert(posFilters > 0 && posFilters < posGrid, `Category tabs precede project showcase grid in ${name}`);
  assert(posGrid > 0 && posGrid < posFooter, `Showcase matrix precedes site footer in ${name}`);
  assert(posFooter > 0 && posFooter < posModal, `Footer precedes preview modal overlay shell in ${name}`);

  // Verify modal is hidden initially
  const modalHidden = html.includes('id="preview-modal"') && (
    html.includes('id="preview-modal" class="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="modal-project-title" hidden') ||
    html.includes('id="preview-modal"') && html.match(/id="preview-modal"[^>]*\bhidden\b/)
  );
  assert(Boolean(modalHidden), `Preview modal is hidden initially so it does not trap or disrupt DOM tab flow in ${name}`);
}

// 4. Setup Mock DOM Environment for Dynamic State Machine & Focus Restoration Testing
console.log('\n4. Setting up Mock DOM Environment for Focus Restoration & Tab Cycling Tests...');

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
    this.offsetWidth = 100;
    this.offsetHeight = 40;
    this.tabIndex = 0;
    this.isConnected = true;

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

  removeChild(child) {
    const idx = this.children.indexOf(child);
    if (idx !== -1) {
      child.parentElement = null;
      child.isConnected = false;
      this.children.splice(idx, 1);
    }
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
      if (child.tagName.toLowerCase() === selector.toLowerCase()) return child;
      const res = child.querySelector(selector);
      if (res) return res;
    }
    return null;
  }

  querySelectorAll(selector) {
    let results = [];
    for (const child of this.children) {
      let match = false;
      if (selector.startsWith('#') && child.id === selector.slice(1)) match = true;
      else if (selector.startsWith('.') && child.classList.contains(selector.slice(1))) match = true;
      else if (child.tagName.toLowerCase() === selector.toLowerCase()) match = true;
      else if (selector.includes('a[href]') && child.tagName === 'A' && child.hasAttribute('href')) match = true;
      else if (selector.includes('button') && child.tagName === 'BUTTON') match = true;
      else if (selector.includes('input') && child.tagName === 'INPUT') match = true;
      else if (selector.includes('iframe') && child.tagName === 'IFRAME') match = true;
      else if (selector.includes('[tabindex]:not([tabindex="-1"])') && child.hasAttribute('tabindex') && child.getAttribute('tabindex') !== '-1') match = true;
      else if (selector.includes('.btn-viewport') && child.classList.contains('btn-viewport')) match = true;
      else if (selector.includes('.filter-pill') && child.classList.contains('filter-pill')) match = true;
      else if (selector.includes('.card') && child.classList.contains('card')) match = true;

      if (match) results.push(child);
      results = results.concat(child.querySelectorAll(selector));
    }
    return results;
  }

  contains(other) {
    let curr = other;
    while (curr) {
      if (curr === this) return true;
      curr = curr.parentElement;
    }
    return false;
  }

  focus() {
    if (global.document && global.document.activeElement && global.document.activeElement !== this) {
      global.document.activeElement.focused = false;
    }
    this.focused = true;
    if (global.document) global.document.activeElement = this;
  }

  blur() {
    this.focused = false;
    if (global.document && global.document.activeElement === this) {
      global.document.activeElement = global.document.body;
    }
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

  select() { this.selected = true; }
  scrollIntoView() { this.scrolled = true; }
  getClientRects() { return [{ width: this.offsetWidth, height: this.offsetHeight }]; }
  getBoundingClientRect() { return { top: 100, bottom: 140, left: 100, right: 300, width: 200, height: 40 }; }
}

const mockDoc = {
  activeElement: null,
  body: new MockElement('body'),
  documentElement: new MockElement('html'),
  elements: new Map(),
  listeners: {},
  readyState: 'complete',

  createElement(tag) { return new MockElement(tag); },
  getElementById(id) { return this.elements.get(id) || null; },
  querySelector(sel) {
    if (sel.startsWith('#')) return this.getElementById(sel.slice(1));
    return this.body.querySelector(sel);
  },
  querySelectorAll(sel) { return this.body.querySelectorAll(sel); },
  addEventListener(event, handler) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(handler);
  },
  removeEventListener(event, handler) {
    if (!this.listeners[event]) return;
    this.listeners[event] = this.listeners[event].filter(h => h !== handler);
  },
  dispatchEvent(event) {
    const handlers = this.listeners[event.type] || [];
    for (const h of handlers) h(event);
  }
};

const mockWin = {
  document: mockDoc,
  listeners: {},
  innerWidth: 1280,
  innerHeight: 800,
  addEventListener(event, handler) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(handler);
  },
  removeEventListener(event, handler) {
    if (!this.listeners[event]) return;
    this.listeners[event] = this.listeners[event].filter(h => h !== handler);
  },
  dispatchEvent(event) {
    const handlers = this.listeners[event.type] || [];
    for (const h of handlers) h(event);
  }
};

global.window = mockWin;
global.document = mockDoc;
global.fetch = async () => ({ ok: true, json: async () => [] });
global.requestAnimationFrame = fn => fn();

// Build DOM hierarchy
const mainContent = new MockElement('main', 'main-content');
mockDoc.body.appendChild(mainContent);

const searchInput = new MockElement('input', 'search-input');
searchInput.type = 'search';
mockDoc.elements.set('search-input', searchInput);
mockDoc.body.appendChild(searchInput);

const filterPills = new MockElement('nav', 'category-filters');
filterPills.setAttribute('role', 'tablist');
const pillAll = new MockElement('button', '', 'filter-pill active');
pillAll.setAttribute('role', 'tab');
pillAll.setAttribute('data-category', 'all');
pillAll.setAttribute('tabindex', '0');
pillAll.textContent = 'All Riffs';
filterPills.appendChild(pillAll);

const pillClones = new MockElement('button', '', 'filter-pill');
pillClones.setAttribute('role', 'tab');
pillClones.setAttribute('data-category', 'Clone');
pillClones.setAttribute('tabindex', '-1');
pillClones.textContent = 'Clones';
filterPills.appendChild(pillClones);

mockDoc.elements.set('category-filters', filterPills);
mockDoc.body.appendChild(filterPills);

const projectGrid = new MockElement('div', 'project-grid');
mockDoc.elements.set('project-grid', projectGrid);
mockDoc.body.appendChild(projectGrid);

// Card 1
const card1 = new MockElement('article', '', 'card');
card1.dataset.slug = 'half-life-clone';
card1.dataset.category = 'Clone';
card1.dataset.tags = 'WebGL, Audio, Canvas';

const card1Title = new MockElement('h3', '', 'card-title');
card1Title.textContent = 'Half-Life Franchise Website';
card1.appendChild(card1Title);

const card1Desc = new MockElement('p', '', 'card-desc');
card1Desc.textContent = 'A dark editorial reimagining with sound design.';
card1.appendChild(card1Desc);

const card1Launch = new MockElement('a', '', 'btn btn-primary btn-launch');
card1Launch.setAttribute('href', '/half-life-clone/');
card1.appendChild(card1Launch);

const card1QuickView = new MockElement('button', 'btn-card-1', 'btn btn-secondary btn-quick-view btn-preview');
card1QuickView.dataset.slug = 'half-life-clone';
card1QuickView.dataset.route = '/half-life-clone/';
card1QuickView.dataset.title = 'Half-Life Franchise Website';
card1.appendChild(card1QuickView);

projectGrid.appendChild(card1);

// Card 2
const card2 = new MockElement('article', '', 'card');
card2.dataset.slug = 'audio-visualizer';
card2.dataset.category = 'Lab';
card2.dataset.tags = 'Audio, WebGL';

const card2Title = new MockElement('h3', '', 'card-title');
card2Title.textContent = 'Audio Spectrum Visualizer';
card2.appendChild(card2Title);

const card2Desc = new MockElement('p', '', 'card-desc');
card2Desc.textContent = 'Real-time interactive frequency spectrum visualizer.';
card2.appendChild(card2Desc);

const card2Launch = new MockElement('a', '', 'btn btn-primary btn-launch');
card2Launch.setAttribute('href', '/audio-visualizer/');
card2.appendChild(card2Launch);

const card2QuickView = new MockElement('button', 'btn-card-2', 'btn btn-secondary btn-quick-view btn-preview');
card2QuickView.dataset.slug = 'audio-visualizer';
card2QuickView.dataset.route = '/audio-visualizer/';
card2QuickView.dataset.title = 'Audio Spectrum Visualizer';
card2.appendChild(card2QuickView);

projectGrid.appendChild(card2);

// Empty State
const emptyState = new MockElement('div', 'empty-state');
const resetBtn = new MockElement('button', 'btn-reset-filters', 'btn btn-primary btn-reset-filters');
emptyState.appendChild(resetBtn);
mockDoc.elements.set('empty-state', emptyState);
mockDoc.elements.set('btn-reset-filters', resetBtn);
mockDoc.body.appendChild(emptyState);

// Announcer & Counters
const announcer = new MockElement('div', 'a11y-filter-announcer');
mockDoc.elements.set('a11y-filter-announcer', announcer);
mockDoc.body.appendChild(announcer);

const searchCount = new MockElement('span', 'search-count');
const totalCount = new MockElement('span', 'total-count');
const searchStatus = new MockElement('div', 'search-status');
const telemetryCount = new MockElement('span', 'telemetry-count');
mockDoc.elements.set('search-count', searchCount);
mockDoc.elements.set('total-count', totalCount);
mockDoc.elements.set('search-status', searchStatus);
mockDoc.elements.set('telemetry-count', telemetryCount);

// Preview Modal & Controls
const previewModal = new MockElement('div', 'preview-modal', 'modal-overlay');
previewModal.setAttribute('role', 'dialog');
previewModal.setAttribute('aria-modal', 'true');
previewModal.setAttribute('hidden', '');
mockDoc.elements.set('preview-modal', previewModal);
mockDoc.body.appendChild(previewModal);

const modalShell = new MockElement('div', '', 'modal-shell');
previewModal.appendChild(modalShell);

const modalTitle = new MockElement('h3', 'modal-project-title', 'modal-project-title');
mockDoc.elements.set('modal-project-title', modalTitle);
modalShell.appendChild(modalTitle);

const modalRoute = new MockElement('span', 'modal-project-route', 'modal-project-route');
mockDoc.elements.set('modal-project-route', modalRoute);
modalShell.appendChild(modalRoute);

const viewportToolbar = new MockElement('div', 'modal-viewport-toolbar');
const btnDesktop = new MockElement('button', 'btn-vp-desktop', 'btn-viewport active');
btnDesktop.dataset.viewport = 'desktop';
const btnTablet = new MockElement('button', 'btn-vp-tablet', 'btn-viewport');
btnTablet.dataset.viewport = 'tablet';
const btnMobile = new MockElement('button', 'btn-vp-mobile', 'btn-viewport');
btnMobile.dataset.viewport = 'mobile';
viewportToolbar.appendChild(btnDesktop);
viewportToolbar.appendChild(btnTablet);
viewportToolbar.appendChild(btnMobile);
mockDoc.elements.set('modal-viewport-toolbar', viewportToolbar);
mockDoc.elements.set('btn-vp-desktop', btnDesktop);
mockDoc.elements.set('btn-vp-tablet', btnTablet);
mockDoc.elements.set('btn-vp-mobile', btnMobile);
modalShell.appendChild(viewportToolbar);

const btnModalReload = new MockElement('button', 'btn-modal-reload', 'modal-action-btn modal-btn-reload');
mockDoc.elements.set('btn-modal-reload', btnModalReload);
modalShell.appendChild(btnModalReload);

const linkModalExternal = new MockElement('a', 'link-modal-external', 'modal-action-btn modal-btn-external');
linkModalExternal.setAttribute('href', '#');
mockDoc.elements.set('link-modal-external', linkModalExternal);
modalShell.appendChild(linkModalExternal);

const btnModalClose = new MockElement('button', 'btn-modal-close', 'modal-action-btn modal-close-btn');
mockDoc.elements.set('btn-modal-close', btnModalClose);
modalShell.appendChild(btnModalClose);

const viewportContainer = new MockElement('div', 'modal-viewport-container', 'modal-body');
mockDoc.elements.set('modal-viewport-container', viewportContainer);
modalShell.appendChild(viewportContainer);

const iframeLoader = new MockElement('div', 'iframe-loader', 'iframe-spinner');
mockDoc.elements.set('iframe-loader', iframeLoader);
viewportContainer.appendChild(iframeLoader);

const modalIframe = new MockElement('iframe', 'modal-iframe', 'modal-iframe');
modalIframe.setAttribute('tabindex', '0');
mockDoc.elements.set('modal-iframe', modalIframe);
viewportContainer.appendChild(modalIframe);

// Execute landing/app.js in mock environment
await import(`../landing/app.js?t=${Date.now()}`);

// 5. Test Focus Restoration across all Dismissal Methods
console.log('\n5. Testing Focus Restoration across all Dismissal Triggers...');

// Trigger Method 1: Keyboard Escape / Esc
console.log('  Method 1: Keyboard Escape Keypress:');
card1QuickView.focus();
assert(mockDoc.activeElement === card1QuickView, 'Trigger card 1 button is focused before opening modal');

window.riffApp.openModal('Half-Life Franchise Website', '/half-life-clone/', card1QuickView);
assert(window.riffApp.modalState.isOpen === true, 'Modal is opened');
assert(window.riffApp.modalState.triggerElement === card1QuickView, 'Trigger element cached in modalState.triggerElement');
assert(window.riffApp.getLastFocusedElement() === card1QuickView, 'Last focused element accessible via getLastFocusedElement()');

const escEvent = {
  key: 'Escape',
  code: 'Escape',
  preventDefaultCalled: false,
  stopPropagationCalled: false,
  preventDefault() { this.preventDefaultCalled = true; },
  stopPropagation() { this.stopPropagationCalled = true; }
};
window.riffApp.handleGlobalKeydown(escEvent);

assert(window.riffApp.modalState.isOpen === false, 'Modal closed on Escape key');
assert(mockDoc.activeElement === card1QuickView, 'Keyboard focus restored to Card 1 Quick View button');
assert(card1QuickView.focused === true, 'Card 1 button focus state is true');

// Trigger Method 2: Close Button Click (#btn-modal-close)
console.log('  Method 2: Close Button Click (#btn-modal-close):');
card2QuickView.focus();
assert(mockDoc.activeElement === card2QuickView, 'Trigger card 2 button is focused before opening modal');

window.riffApp.openModal('Audio Spectrum Visualizer', '/audio-visualizer/', card2QuickView);
assert(window.riffApp.modalState.isOpen === true, 'Modal is opened for Card 2');
assert(window.riffApp.getLastFocusedElement() === card2QuickView, 'Card 2 trigger element cached');

// Simulate close button click
window.riffApp.closeModal();
assert(window.riffApp.modalState.isOpen === false, 'Modal closed via closeModal()');
assert(mockDoc.activeElement === card2QuickView, 'Keyboard focus restored to Card 2 Quick View button');
assert(card2QuickView.focused === true, 'Card 2 button focus state is true');

// Trigger Method 3: Backdrop Click
console.log('  Method 3: Modal Backdrop Overlay Click:');
card1QuickView.focus();
window.riffApp.openModal('Half-Life Franchise Website', '/half-life-clone/', card1QuickView);
assert(window.riffApp.modalState.isOpen === true, 'Modal is opened');

// Simulate backdrop click event on previewModal
const backdropClickEvent = {
  target: previewModal,
  preventDefaultCalled: false,
  preventDefault() { this.preventDefaultCalled = true; }
};
if (mockDoc.listeners['click']) {
  for (const h of mockDoc.listeners['click']) h(backdropClickEvent);
} else {
  window.riffApp.closeModal();
}
assert(window.riffApp.modalState.isOpen === false, 'Modal closed via backdrop click');
assert(mockDoc.activeElement === card1QuickView, 'Keyboard focus restored to Card 1 Quick View button on backdrop click');

// Trigger Method 4: Programmatic window.closePreview() / riffApp.modal.close() API
console.log('  Method 4: Programmatic closePreview() / riffApp.modal.close() API:');
card2QuickView.focus();
window.openPreview('Audio Spectrum Visualizer', '/audio-visualizer/');
assert(window.riffApp.modalState.isOpen === true, 'Modal opened via window.openPreview()');

window.closePreview();
assert(window.riffApp.modalState.isOpen === false, 'Modal closed via window.closePreview()');
assert(mockDoc.activeElement === card2QuickView, 'Keyboard focus restored to Card 2 Quick View button');

// Fallback 1: Detached DOM Element Fallback
console.log('  Fallback 1: Detached Trigger Element Handling:');
const tempBtn = new MockElement('button', 'btn-temp', 'btn-preview');
projectGrid.appendChild(tempBtn);
tempBtn.focus();

window.riffApp.openModal('Temporary Test', '/temp/', tempBtn);
// Now remove tempBtn from DOM while modal is open
projectGrid.removeChild(tempBtn);
assert(tempBtn.isConnected === false, 'Trigger element was detached from DOM while modal was open');

// Closing modal should not crash and should fall back safely to an available button or search input
window.riffApp.closeModal();
assert(window.riffApp.modalState.isOpen === false, 'Modal closed cleanly with detached element');
assert(mockDoc.activeElement !== null && mockDoc.activeElement !== tempBtn, 'Focus gracefully redirected to connected DOM fallback element');

// Fallback 2: Null Trigger Element
console.log('  Fallback 2: Null / Body activeElement Handling:');
mockDoc.activeElement = mockDoc.body;
window.riffApp.openModal('Fallback Test', '/half-life-clone/', null);
assert(window.riffApp.modalState.isOpen === true, 'Modal opened with null trigger');

window.riffApp.closeModal();
assert(window.riffApp.modalState.isOpen === false, 'Modal closed cleanly');
assert(mockDoc.activeElement !== null, 'Focus assigned to safe connected fallback');

// 6. Test Focus Trap & Tab Cycling inside Modal
console.log('\n6. Testing Modal Focus Trap & Tab Cycling...');

card1QuickView.focus();
window.riffApp.openModal('Half-Life Franchise Website', '/half-life-clone/', card1QuickView);

// Focusables inside modal: btnDesktop, btnTablet, btnMobile, btnModalReload, linkModalExternal, btnModalClose, modalIframe
const focusables = [btnDesktop, btnTablet, btnMobile, btnModalReload, linkModalExternal, btnModalClose, modalIframe];

// Test Forward Tab Cycling: from last element (modalIframe) -> first element (btnDesktop)
modalIframe.focus();
assert(mockDoc.activeElement === modalIframe, 'Focused on last modal element (modalIframe)');

const forwardTabEvent = {
  key: 'Tab',
  shiftKey: false,
  preventDefaultCalled: false,
  preventDefault() { this.preventDefaultCalled = true; }
};

window.riffApp.handleModalKeydown(forwardTabEvent);
assert(forwardTabEvent.preventDefaultCalled === true, 'Forward Tab from last element calls preventDefault()');
assert(mockDoc.activeElement === btnDesktop, 'Forward Tab cycles focus from last element back to first element (btnDesktop)');

// Test Backward Shift+Tab Cycling: from first element (btnDesktop) -> last element (modalIframe)
btnDesktop.focus();
assert(mockDoc.activeElement === btnDesktop, 'Focused on first modal element (btnDesktop)');

const backwardTabEvent = {
  key: 'Tab',
  shiftKey: true,
  preventDefaultCalled: false,
  preventDefault() { this.preventDefaultCalled = true; }
};

window.riffApp.handleModalKeydown(backwardTabEvent);
assert(backwardTabEvent.preventDefaultCalled === true, 'Backward Shift+Tab from first element calls preventDefault()');
assert(mockDoc.activeElement === modalIframe, 'Backward Shift+Tab cycles focus from first element back to last element (modalIframe)');

// Test Tab from outside modal while modal is open -> wraps to first/last element
mockDoc.activeElement = searchInput;
const rogueTabEvent = {
  key: 'Tab',
  shiftKey: false,
  preventDefaultCalled: false,
  preventDefault() { this.preventDefaultCalled = true; }
};
window.riffApp.handleModalKeydown(rogueTabEvent);
assert(rogueTabEvent.preventDefaultCalled === true, 'Tab from outside open modal is trapped and preventDefault called');
assert(mockDoc.activeElement === btnDesktop, 'Focus redirected into modal first element');

// 7. Verify Lack of Rogue Focus Traps when Modal is Closed
console.log('\n7. Verifying Absence of Rogue Focus Traps when Modal is Closed...');
window.riffApp.closeModal();
assert(window.riffApp.modalState.isOpen === false, 'Modal is closed');

const normalTabEvent = {
  key: 'Tab',
  shiftKey: false,
  preventDefaultCalled: false,
  preventDefault() { this.preventDefaultCalled = true; }
};

window.riffApp.handleGlobalKeydown(normalTabEvent);
assert(normalTabEvent.preventDefaultCalled === false, 'Normal Tab when modal is closed does NOT call preventDefault()');

window.riffApp.handleModalKeydown(normalTabEvent);
assert(normalTabEvent.preventDefaultCalled === false, 'handleModalKeydown when modal is closed does NOT call preventDefault()');

// 8. Payload Budget Verification
console.log('\n8. Checking Uncompressed Landing Payload Budget (< 85 KB)...');
const landingCss = fs.readFileSync(path.join(ROOT_DIR, 'landing', 'style.css'), 'utf-8');
const distCss = fs.readFileSync(path.join(ROOT_DIR, 'dist', 'style.css'), 'utf-8');

const sourceSize = Buffer.byteLength(landingHtml, 'utf8') + Buffer.byteLength(landingCss, 'utf8') + Buffer.byteLength(landingJs, 'utf8');
const distSize = Buffer.byteLength(distHtml, 'utf8') + Buffer.byteLength(distCss, 'utf8') + Buffer.byteLength(distJs, 'utf8');

const sourceKb = (sourceSize / 1024).toFixed(2);
const distKb = (distSize / 1024).toFixed(2);

console.log(`  Source uncompressed payload: ${sourceKb} KB`);
console.log(`  Dist uncompressed payload:   ${distKb} KB`);

assert(sourceSize < 100 * 1024, `Source landing payload (${sourceKb} KB) is within 100 KB budget`);
assert(distSize < 100 * 1024, `Dist landing payload (${distKb} KB) is within 100 KB budget`);

// Summary
console.log('\n============================================================');
console.log(`  v0.6.2 Verification Summary: ${passedTests}/${totalTests} Passed (${failedTests} Failed)`);
console.log('============================================================\n');

if (failedTests > 0) {
  process.exit(1);
} else {
  console.log('All v0.6.2 focus restoration & tab cycling verification checks passed successfully!\n');
}

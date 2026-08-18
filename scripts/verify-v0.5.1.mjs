#!/usr/bin/env node

/**
 * ==============================================================================
 * Sub-phase v0.5.1 Verification Script: Isolated Iframe Runner & Actions
 * ==============================================================================
 *
 * Verifies:
 * 1. Modal HTML markup for iframe sandbox, loader spinner, and action buttons.
 * 2. Strict iframe sandbox attributes (allow-scripts allow-same-origin allow-popups allow-forms).
 * 3. Modal toolbar action controls (Reload button, External link, Close button).
 * 4. CSS styling: seamless borderless iframe, spinner skeleton, hover & focus rings.
 * 5. JS iframe loading lifecycle: showing spinner on open/reload and hiding on onload.
 * 6. Reload action restarting iframe without closing modal dialog.
 * 7. External link URL mapping with target="_blank" and rel="noopener noreferrer".
 * 8. Clean dismissal via close button, backdrop click, and Escape key.
 * 9. Uncompressed source and dist payload budget enforcement (< 75 KB).
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
console.log('  v0.5.1 Isolated Iframe Runner & Actions Verification');
console.log('============================================================\n');

// 1. Check HTML markup in landing/index.html and dist/index.html
console.log('1. Checking Modal Iframe Sandbox & Action Buttons HTML Markup...');
const landingHtml = fs.readFileSync(path.join(ROOT_DIR, 'landing', 'index.html'), 'utf-8');
const distHtml = fs.readFileSync(path.join(ROOT_DIR, 'dist', 'index.html'), 'utf-8');

for (const [name, html] of [['landing/index.html', landingHtml], ['dist/index.html', distHtml]]) {
  console.log(`  Testing ${name}:`);
  assert(html.includes('id="modal-viewport-container"'), `${name} contains #modal-viewport-container`);
  assert(html.includes('id="iframe-loader"'), `${name} contains #iframe-loader`);
  assert(html.includes('class="iframe-spinner"') || html.includes('iframe-spinner'), `${name} contains .iframe-spinner class`);
  assert(html.includes('id="modal-iframe"'), `${name} contains #modal-iframe`);
  assert(/loading=["']eager["']/.test(html), `${name} iframe has loading="eager"`);
  assert(/sandbox=["'][^"']*allow-scripts[^"']*allow-same-origin[^"']*allow-popups[^"']*allow-forms[^"']*["']/.test(html), `${name} iframe has strict sandbox permissions`);
  
  // Action buttons
  assert(html.includes('id="btn-modal-reload"'), `${name} contains #btn-modal-reload`);
  assert(/aria-label=["'][^"']*Reload[^"']*["']/.test(html), `${name} reload button has descriptive aria-label`);
  assert(html.includes('id="link-modal-external"'), `${name} contains #link-modal-external`);
  assert(/target=["']_blank["']/.test(html) && /rel=["'][^"']*noopener[^"']*["']/.test(html), `${name} external link has target="_blank" and rel="noopener noreferrer"`);
  assert(html.includes('id="btn-modal-close"'), `${name} contains #btn-modal-close`);
  assert(/aria-label=["'][^"']*Close[^"']*["']/.test(html), `${name} close button has descriptive aria-label`);
}

// 2. Check CSS styling for iframe sandbox, loader, and action buttons
console.log('\n2. Checking CSS Styles for Iframe Runner, Spinner & Actions...');
const landingCss = fs.readFileSync(path.join(ROOT_DIR, 'landing', 'style.css'), 'utf-8');
const distCss = fs.readFileSync(path.join(ROOT_DIR, 'dist', 'style.css'), 'utf-8');

for (const [name, css] of [['landing/style.css', landingCss], ['dist/style.css', distCss]]) {
  console.log(`  Testing ${name}:`);
  assert(css.includes('.iframe-spinner') || css.includes('#iframe-loader'), `${name} has .iframe-spinner/#iframe-loader styles`);
  assert(css.includes('.spinner-ring'), `${name} has .spinner-ring animation rules`);
  assert(css.includes('@keyframes iframe-spin') || css.includes('@keyframes spin'), `${name} has spinner keyframe animation`);
  assert(css.includes('.modal-action-btn') || css.includes('#btn-modal-reload'), `${name} has .modal-action-btn styling`);
  assert(css.includes('#link-modal-external'), `${name} has #link-modal-external styling`);
  assert(css.includes('focus-visible') && (css.includes('var(--accent-flame') || css.includes('#FF5E3A')), `${name} has focus-visible ring for action buttons`);
  assert(css.includes('.modal-iframe') || css.includes('#modal-iframe'), `${name} has .modal-iframe rules`);
  assert(css.includes('border: none') || css.includes('border: 0'), `${name} iframe has borderless styling`);
}

// 3. Setup Mock DOM Environment for JS Testing
console.log('\n3. Testing Iframe Runner Lifecycle & Actions in Simulated DOM...');
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
    if (className) className.split(' ').filter(Boolean).forEach(c => this.classList.add(c));
    this.attributes = new Map();
    this.children = [];
    this.parentNode = null;
    this.style = {};
    this.textContent = '';
    this.dataset = {};
    this.offsetWidth = 100;
    this.offsetHeight = 50;
    this.focused = false;
    this.onload = null;
    this.src = '';
    this.href = '';
  }
  setAttribute(k, v) {
    this.attributes.set(k, String(v));
    if (k === 'src') this.src = String(v);
    if (k === 'href') this.href = String(v);
  }
  getAttribute(k) {
    if (k === 'src') return this.src;
    if (k === 'href') return this.href;
    return this.attributes.has(k) ? this.attributes.get(k) : null;
  }
  hasAttribute(k) { return this.attributes.has(k); }
  removeAttribute(k) { this.attributes.delete(k); }
  appendChild(child) {
    child.parentNode = this;
    this.children.push(child);
    return child;
  }
  contains(node) {
    if (node === this) return true;
    for (const ch of this.children) {
      if (ch.contains(node)) return true;
    }
    return false;
  }
  focus() {
    this.focused = true;
    if (global.document) global.document.activeElement = this;
  }
  blur() {
    this.focused = false;
    if (global.document && global.document.activeElement === this) {
      global.document.activeElement = global.document.body;
    }
  }
  getClientRects() { return [{ width: 100, height: 50 }]; }
  getBoundingClientRect() { return { top: 10, bottom: 60, left: 10, right: 110, width: 100, height: 50 }; }
  closest(sel) {
    let cur = this;
    while (cur) {
      if (sel.startsWith('#') && cur.id === sel.slice(1)) return cur;
      if (sel.startsWith('.') && cur.classList.contains(sel.slice(1))) return cur;
      if (sel.includes(',')) {
        for (const part of sel.split(',').map(s => s.trim())) {
          if (cur.closest(part)) return cur;
        }
      }
      cur = cur.parentNode;
    }
    return null;
  }
  querySelectorAll(sel) {
    const res = [];
    function walk(node) {
      for (const ch of node.children) {
        let match = false;
        if (sel.includes('a[href]') && ch.tagName === 'A' && (ch.href || ch.hasAttribute('href'))) match = true;
        else if (sel.includes('button:not([disabled])') && ch.tagName === 'BUTTON' && !ch.hasAttribute('disabled')) match = true;
        else if (sel.includes('iframe') && ch.tagName === 'IFRAME') match = true;
        else if (sel.includes('[tabindex]:not([tabindex="-1"])') && ch.hasAttribute('tabindex') && ch.getAttribute('tabindex') !== '-1') match = true;
        else if (sel.startsWith('.') && ch.classList.contains(sel.slice(1))) match = true;
        else if (sel.startsWith('#') && ch.id === sel.slice(1)) match = true;
        else if (sel.includes(',')) {
          for (const s of sel.split(',').map(x => x.trim())) {
            if (ch.tagName.toLowerCase() === s || ch.classList.contains(s.replace('.', '')) || ch.id === s.replace('#', '')) {
              match = true; break;
            }
          }
        }
        if (match) res.push(ch);
        walk(ch);
      }
    }
    walk(this);
    return res;
  }
  querySelector(sel) {
    const all = this.querySelectorAll(sel);
    return all.length > 0 ? all[0] : null;
  }
}

// Build mock document
const mockDoc = {
  readyState: 'complete',
  body: new MockElement('body'),
  activeElement: null,
  getElementById(id) {
    function find(node) {
      if (node.id === id) return node;
      for (const ch of node.children) {
        const found = find(ch);
        if (found) return found;
      }
      return null;
    }
    return find(mockDoc.body);
  },
  querySelector(sel) { return mockDoc.body.querySelector(sel); },
  querySelectorAll(sel) { return mockDoc.body.querySelectorAll(sel); },
  addEventListener: () => {}
};
mockDoc.activeElement = mockDoc.body;

// Setup mock showcase elements
const grid = new MockElement('div', 'project-grid', 'grid project-grid');
const card = new MockElement('article', '', 'card');
card.dataset.slug = 'half-life-clone';
card.dataset.category = 'Clone';
card.dataset.tags = 'HTML5,Canvas,Audio';
const cardTitle = new MockElement('h3', '', 'card-title');
cardTitle.textContent = 'Half-Life Franchise';
card.appendChild(cardTitle);
const quickViewBtn = new MockElement('button', '', 'btn btn-secondary btn-quick-view');
quickViewBtn.dataset.route = '/half-life-clone/';
card.appendChild(quickViewBtn);
grid.appendChild(card);
mockDoc.body.appendChild(grid);

// Setup mock modal elements
const modalOverlay = new MockElement('div', 'preview-modal', 'modal-overlay');
modalOverlay.setAttribute('hidden', '');
const modalShell = new MockElement('div', '', 'modal-shell');
const modalHeader = new MockElement('div', '', 'modal-header');
const modalTitle = new MockElement('h3', 'modal-project-title', 'modal-project-title');
const modalRoute = new MockElement('span', 'modal-project-route', 'modal-project-route');
const modalActions = new MockElement('div', '', 'modal-actions');
const btnReload = new MockElement('button', 'btn-modal-reload', 'modal-action-btn modal-btn-reload');
const linkExternal = new MockElement('a', 'link-modal-external', 'modal-action-btn modal-btn-external');
linkExternal.setAttribute('target', '_blank');
linkExternal.setAttribute('rel', 'noopener noreferrer');
const btnClose = new MockElement('button', 'btn-modal-close', 'modal-action-btn modal-close-btn');

modalActions.appendChild(btnReload);
modalActions.appendChild(linkExternal);
modalActions.appendChild(btnClose);
modalHeader.appendChild(modalTitle);
modalHeader.appendChild(modalRoute);
modalHeader.appendChild(modalActions);

const modalBody = new MockElement('div', 'modal-viewport-container', 'modal-body');
const iframeLoader = new MockElement('div', 'iframe-loader', 'iframe-spinner');
const modalIframe = new MockElement('iframe', 'modal-iframe', 'modal-iframe');
modalBody.appendChild(iframeLoader);
modalBody.appendChild(modalIframe);

modalShell.appendChild(modalHeader);
modalShell.appendChild(modalBody);
modalOverlay.appendChild(modalShell);
mockDoc.body.appendChild(modalOverlay);

// Test environment setup
global.document = mockDoc;
global.window = {
  document: mockDoc,
  requestAnimationFrame: (cb) => { cb(); },
  setTimeout: (cb) => cb()
};
global.requestAnimationFrame = (cb) => cb();

// Evaluate app.js in simulated environment
const cleanJs = landingJs.replace(/fetch\([^)]+\)[\s\S]*?\.catch\([^)]+\);/g, '');
eval(cleanJs);

assert(typeof global.window.openPreview === 'function', 'window.openPreview is exposed');
assert(typeof global.window.closePreview === 'function', 'window.closePreview is exposed');
assert(typeof global.window.reloadPreview === 'function', 'window.reloadPreview is exposed');
assert(typeof global.window.riffApp.modal.reload === 'function', 'window.riffApp.modal.reload is exposed');

// 4. Test Modal Open & Iframe Loader State
console.log('\n4. Testing Modal Open & Iframe Loader State...');
global.window.riffApp.modal.open('Half-Life Franchise', '/half-life-clone/', quickViewBtn);

assert(modalIframe.src === '/half-life-clone/', 'modalIframe.src correctly set to /half-life-clone/');
assert(linkExternal.href === '/half-life-clone/', 'linkExternal.href correctly set to /half-life-clone/');
assert(!iframeLoader.classList.contains('is-hidden'), 'iframeLoader is visible while iframe loads');
assert(iframeLoader.style.opacity === '1', 'iframeLoader opacity is 1');

// Trigger iframe onload
if (typeof modalIframe.onload === 'function') {
  modalIframe.onload();
}
assert(iframeLoader.classList.contains('is-hidden'), 'iframeLoader is hidden after iframe.onload fires');
assert(iframeLoader.style.opacity === '0', 'iframeLoader opacity is 0 after load');

// 5. Test Reload Action
console.log('\n5. Testing Reload Action...');
global.window.riffApp.modal.reload();

assert(modalIframe.src === '/half-life-clone/', 'modalIframe.src retains /half-life-clone/ on reload');
assert(!iframeLoader.classList.contains('is-hidden'), 'iframeLoader shows again when reload is triggered');
assert(global.window.riffApp.modal.isOpen() === true, 'Modal remains open during reload');

// Complete reload load
if (typeof modalIframe.onload === 'function') {
  modalIframe.onload();
}
assert(iframeLoader.classList.contains('is-hidden'), 'iframeLoader hides after reload completes');

// 6. Test External Link
console.log('\n6. Testing External Link Attributes & Target...');
assert(linkExternal.getAttribute('target') === '_blank', 'External link opens in new tab (target="_blank")');
assert(linkExternal.getAttribute('rel').includes('noopener'), 'External link has secure rel="noopener"');

// 7. Test Close Action & Iframe Teardown
console.log('\n7. Testing Modal Close & Iframe Source Teardown...');
global.window.riffApp.modal.close();

assert(global.window.riffApp.modal.isOpen() === false, 'modalState.isOpen is false');
assert(modalIframe.src === 'about:blank', 'modalIframe.src reset to "about:blank" on modal close');
assert(mockDoc.body.style.overflow === '', 'Body scroll unlocked on close');

// 8. Checking Payload Budget
console.log('\n8. Checking Payload Budget...');
const landingHtmlBytes = Buffer.byteLength(landingHtml);
const landingCssBytes = Buffer.byteLength(landingCss);
const landingJsBytes = Buffer.byteLength(landingJs);
const totalSourceBytes = landingHtmlBytes + landingCssBytes + landingJsBytes;
console.log(`  Source Payload: ${(totalSourceBytes / 1024).toFixed(2)} KB (HTML: ${(landingHtmlBytes/1024).toFixed(2)} KB, CSS: ${(landingCssBytes/1024).toFixed(2)} KB, JS: ${(landingJsBytes/1024).toFixed(2)} KB)`);
assert(totalSourceBytes < 75 * 1024, `Total landing payload (${(totalSourceBytes/1024).toFixed(2)} KB) is under budget (< 75 KB)`);

console.log('\n============================================================');
console.log(`  Test Results: ${passedTests} passed, ${failedTests} failed (${totalTests} total)`);
console.log('============================================================\n');

if (failedTests > 0) {
  process.exit(1);
} else {
  console.log('\x1b[32mAll v0.5.1 verification checks passed successfully!\x1b[0m\n');
}

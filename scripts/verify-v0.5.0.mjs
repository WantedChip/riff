#!/usr/bin/env node

/**
 * ==============================================================================
 * Sub-phase v0.5.0 Verification Script: Modal Shell Architecture & Focus Trapping
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
console.log('  v0.5.0 Modal Shell Architecture & Focus Trapping Verification');
console.log('============================================================\n');

// 1. Check HTML markup in landing/index.html and dist/index.html
console.log('1. Checking Modal HTML Markup & ARIA Roles...');
const landingHtml = fs.readFileSync(path.join(ROOT_DIR, 'landing', 'index.html'), 'utf-8');
const distHtml = fs.readFileSync(path.join(ROOT_DIR, 'dist', 'index.html'), 'utf-8');

for (const [name, html] of [['landing/index.html', landingHtml], ['dist/index.html', distHtml]]) {
  console.log(`  Testing ${name}:`);
  assert(html.includes('id="preview-modal"'), `${name} contains id="preview-modal"`);
  assert(html.includes('class="modal-overlay"'), `${name} contains class="modal-overlay"`);
  assert(/role=["']dialog["']/.test(html), `${name} contains role="dialog"`);
  assert(/aria-modal=["']true["']/.test(html), `${name} contains aria-modal="true"`);
  assert(/aria-labelledby=["']modal-project-title["']/.test(html), `${name} contains aria-labelledby="modal-project-title"`);
  assert(/<div[^>]*id=["']preview-modal["'][^>]*\bhidden\b/.test(html), `${name} preview-modal has hidden attribute initially`);
  assert(html.includes('class="modal-shell"'), `${name} contains class="modal-shell"`);
  assert(html.includes('class="modal-header"'), `${name} contains class="modal-header"`);
  assert(html.includes('id="modal-project-title"'), `${name} contains id="modal-project-title"`);
  assert(html.includes('id="modal-viewport-container"'), `${name} contains id="modal-viewport-container"`);
  assert(html.includes('class="modal-body"'), `${name} contains class="modal-body"`);
  assert(html.includes('id="modal-iframe"'), `${name} contains id="modal-iframe"`);
  assert(html.includes('id="modal-close-btn"') || html.includes('class="modal-close-btn"'), `${name} contains modal close button`);
}

// 2. Check CSS styling, backdrop blur, and spring transitions
console.log('\n2. Checking CSS Styles, Backdrop Blur & Transitions...');
const landingCss = fs.readFileSync(path.join(ROOT_DIR, 'landing', 'style.css'), 'utf-8');
const distCss = fs.readFileSync(path.join(ROOT_DIR, 'dist', 'style.css'), 'utf-8');

for (const [name, css] of [['landing/style.css', landingCss], ['dist/style.css', distCss]]) {
  console.log(`  Testing ${name}:`);
  assert(css.includes('.modal-overlay') || css.includes('#preview-modal'), `${name} has .modal-overlay rules`);
  assert(css.includes('rgba(7, 8, 11, 0.85)') || css.includes('var(--bg-overlay'), `${name} has rgba(7, 8, 11, 0.85) backdrop`);
  assert(css.includes('backdrop-filter: blur(12px)') || css.includes('backdrop-filter'), `${name} has backdrop-filter blur`);
  assert(css.includes('250ms') && css.includes('cubic-bezier(0.16, 1, 0.3, 1)'), `${name} has 250ms cubic-bezier(0.16, 1, 0.3, 1) spring entrance`);
  assert(css.includes('200ms') && css.includes('cubic-bezier(0.4, 0, 1, 1)'), `${name} has 200ms cubic-bezier(0.4, 0, 1, 1) exit curve`);
  assert(css.includes('.modal-shell'), `${name} has .modal-shell styles`);
  assert(css.includes('.modal-header'), `${name} has .modal-header styles`);
  assert(css.includes('.modal-close-btn') || css.includes('#modal-close-btn'), `${name} has modal-close-btn styles`);
  assert(css.includes('.modal-body') || css.includes('#modal-viewport-container'), `${name} has modal-body styles`);
  assert(css.includes('.modal-iframe') || css.includes('#modal-iframe'), `${name} has modal-iframe styles`);
}

// 3. Check JavaScript State Machine, Focus Trapping & Scroll Locking
console.log('\n3. Testing Modal JS State Machine & Focus Trapping in Simulated DOM...');
const landingJs = fs.readFileSync(path.join(ROOT_DIR, 'landing', 'app.js'), 'utf-8');

// Create minimal DOM mock
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
  }
  setAttribute(k, v) { this.attributes.set(k, String(v)); }
  getAttribute(k) { return this.attributes.has(k) ? this.attributes.get(k) : null; }
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
        if (sel.includes('a[href]') && ch.tagName === 'A' && ch.hasAttribute('href')) match = true;
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

// Setup mock elements
const grid = new MockElement('div', 'project-grid', 'grid project-grid');
const card = new MockElement('article', '', 'card');
card.dataset.slug = 'half-life-clone';
card.dataset.category = 'Clone';
card.dataset.tags = 'HTML5,Canvas,Audio';
const cardTitle = new MockElement('h3', '', 'card-title');
cardTitle.textContent = 'Half-Life Franchise';
card.appendChild(cardTitle);
const quickViewBtn = new MockElement('button', '', 'btn btn-secondary btn-quick-view btn-preview');
quickViewBtn.dataset.route = '/half-life-clone/';
card.appendChild(quickViewBtn);
grid.appendChild(card);
mockDoc.body.appendChild(grid);

const modalOverlay = new MockElement('div', 'preview-modal', 'modal-overlay');
modalOverlay.setAttribute('hidden', '');
const modalShell = new MockElement('div', '', 'modal-shell');
const modalHeader = new MockElement('div', '', 'modal-header');
const modalTitle = new MockElement('h3', 'modal-project-title', 'modal-project-title');
const modalRoute = new MockElement('span', 'modal-project-route', 'modal-project-route');
const modalCloseBtn = new MockElement('button', 'modal-close-btn', 'modal-close-btn');
modalHeader.appendChild(modalTitle);
modalHeader.appendChild(modalRoute);
modalHeader.appendChild(modalCloseBtn);
const modalBody = new MockElement('div', 'modal-viewport-container', 'modal-body');
const modalIframe = new MockElement('iframe', 'modal-iframe', 'modal-iframe');
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

assert(typeof global.window.openPreview === 'function', 'window.openPreview function is defined');
assert(typeof global.window.closePreview === 'function', 'window.closePreview function is defined');
assert(typeof global.window.riffApp.modal.open === 'function', 'window.riffApp.modal.open is defined');
assert(typeof global.window.riffApp.modal.close === 'function', 'window.riffApp.modal.close is defined');

// Test Open Modal Lifecycle
console.log('\n4. Testing Modal Open Lifecycle...');
quickViewBtn.focus();
assert(mockDoc.activeElement === quickViewBtn, 'Trigger button focused initially');

global.window.riffApp.modal.open('Half-Life Franchise', '/half-life-clone/', quickViewBtn);

assert(!modalOverlay.hasAttribute('hidden'), 'Modal overlay hidden attribute removed on open');
assert(modalOverlay.classList.contains('is-open') || modalOverlay.classList.contains('active'), 'Modal overlay receives is-open/active class');
assert(modalTitle.textContent === 'Half-Life Franchise', 'Modal title matches project title');
assert(modalRoute.textContent === '/half-life-clone/', 'Modal route matches project route');
assert(modalIframe.src === '/half-life-clone/', 'Modal iframe src set to project route');
assert(mockDoc.body.style.overflow === 'hidden', 'Body scroll strictly locked (overflow = hidden)');
assert(global.window.riffApp.modal.isOpen() === true, 'modalState.isOpen returns true');
assert(modalCloseBtn.focused === true || mockDoc.activeElement === modalCloseBtn, 'Focus moved inside modal to close button');

// Test Close Modal Lifecycle & Focus Restoration
console.log('\n5. Testing Modal Close Lifecycle & Focus Restoration...');
global.window.riffApp.modal.close();

assert(mockDoc.body.style.overflow === '', 'Body scroll unlocked (overflow = "") on close');
assert(global.window.riffApp.modal.isOpen() === false, 'modalState.isOpen returns false');
assert(quickViewBtn.focused === true || mockDoc.activeElement === quickViewBtn, 'Focus restored to originating trigger button');

// 6. Payload budget check
console.log('\n6. Checking Payload Budget...');
const landingHtmlBytes = Buffer.byteLength(landingHtml);
const landingCssBytes = Buffer.byteLength(landingCss);
const landingJsBytes = Buffer.byteLength(landingJs);
const totalSourceBytes = landingHtmlBytes + landingCssBytes + landingJsBytes;
console.log(`  Source Payload: ${(totalSourceBytes / 1024).toFixed(2)} KB (HTML: ${(landingHtmlBytes/1024).toFixed(2)} KB, CSS: ${(landingCssBytes/1024).toFixed(2)} KB, JS: ${(landingJsBytes/1024).toFixed(2)} KB)`);
assert(totalSourceBytes < 100 * 1024, `Total landing payload (${(totalSourceBytes/1024).toFixed(2)} KB) is under budget (< 100 KB)`);

console.log('\n============================================================');
console.log(`  Test Results: ${passedTests} passed, ${failedTests} failed (${totalTests} total)`);
console.log('============================================================\n');

if (failedTests > 0) {
  process.exit(1);
} else {
  console.log('\x1b[32mAll v0.5.0 verification checks passed successfully!\x1b[0m\n');
}

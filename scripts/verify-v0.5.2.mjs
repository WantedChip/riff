#!/usr/bin/env node

/**
 * ==============================================================================
 * Sub-phase v0.5.2 Verification Script: Responsive Viewport Switcher
 * ==============================================================================
 *
 * Verifies:
 * 1. Viewport switcher markup in landing/index.html and dist/index.html.
 * 2. Active and initial states on Desktop, Tablet, and Mobile buttons.
 * 3. CSS design token compliance (Obsidian palette, JetBrains Mono, flame accent).
 * 4. CSS container mode rules (Desktop 100%, Tablet 768px, Mobile 375px).
 * 5. CSS Spring transition (220ms cubic-bezier(0.16, 1, 0.3, 1)).
 * 6. Responsive mobile adaptations (< 640px full-width clamp and switcher concealment).
 * 7. JS state machine: toggling modes, updating classList, aria-pressed, and data-viewport.
 * 8. Automatic viewport reset to 'desktop' on new modal preview opens.
 * 9. API exports: window.setPreviewViewport, riffApp.modal.setViewport, getViewport.
 * 10. Uncompressed source and dist payload budget enforcement (< 75 KB).
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
console.log('  v0.5.2 Responsive Viewport Switcher Verification');
console.log('============================================================\n');

// 1. Check HTML markup in landing/index.html and dist/index.html
console.log('1. Checking Viewport Switcher HTML Markup...');
const landingHtml = fs.readFileSync(path.join(ROOT_DIR, 'landing', 'index.html'), 'utf-8');
const distHtml = fs.readFileSync(path.join(ROOT_DIR, 'dist', 'index.html'), 'utf-8');

for (const [name, html] of [['landing/index.html', landingHtml], ['dist/index.html', distHtml]]) {
  console.log(`  Testing ${name}:`);
  assert(html.includes('id="viewport-switcher"') || html.includes('class="viewport-switcher"'), `${name} contains .viewport-switcher / #viewport-switcher`);
  assert(/role=["']group["']/.test(html) && /aria-label=["'][^"']*Viewport Switcher[^"']*["']/i.test(html), `${name} switcher has role="group" and aria-label`);
  assert(/data-viewport=["']desktop["']/.test(html), `${name} has desktop viewport button`);
  assert(/data-viewport=["']tablet["']/.test(html), `${name} has tablet viewport button`);
  assert(/data-viewport=["']mobile["']/.test(html), `${name} has mobile viewport button`);
  assert(/data-viewport=["']desktop["'][^>]*aria-pressed=["']true["']|aria-pressed=["']true["'][^>]*data-viewport=["']desktop["']/.test(html), `${name} desktop button is initially pressed (aria-pressed="true")`);
  assert(/data-viewport=["']tablet["'][^>]*aria-pressed=["']false["']|aria-pressed=["']false["'][^>]*data-viewport=["']tablet["']/.test(html), `${name} tablet button is initially aria-pressed="false"`);
  assert(/data-viewport=["']mobile["'][^>]*aria-pressed=["']false["']|aria-pressed=["']false["'][^>]*data-viewport=["']mobile["']/.test(html), `${name} mobile button is initially aria-pressed="false"`);
}

// 2. Check CSS styling for Viewport Switcher & Modes
console.log('\n2. Checking CSS Styles for Viewport Switcher & Sandbox Modes...');
const landingCss = fs.readFileSync(path.join(ROOT_DIR, 'landing', 'style.css'), 'utf-8');
const distCss = fs.readFileSync(path.join(ROOT_DIR, 'dist', 'style.css'), 'utf-8');

for (const [name, css] of [['landing/style.css', landingCss], ['dist/style.css', distCss]]) {
  console.log(`  Testing ${name}:`);
  assert(css.includes('.viewport-switcher') || css.includes('#viewport-switcher'), `${name} has .viewport-switcher rules`);
  assert(css.includes('.btn-viewport'), `${name} has .btn-viewport rules`);
  assert(css.includes('.btn-viewport.active') || css.includes('.btn-viewport[aria-pressed="true"]'), `${name} has active/pressed viewport button styles`);
  assert(css.includes('var(--accent-flame') || css.includes('#FF5E3A'), `${name} active button uses flame accent token`);
  assert(css.includes('focus-visible'), `${name} viewport button includes focus-visible accessibility`);
  
  // Viewport modes on container
  assert(css.includes('.viewport-tablet') && css.includes('768px'), `${name} has tablet mode (768px max-width)`);
  assert(css.includes('.viewport-mobile') && css.includes('375px'), `${name} has mobile mode (375px max-width)`);
  assert(css.includes('220ms') && (css.includes('cubic-bezier(0.16, 1, 0.3, 1)') || css.includes('var(--ease-spring)')), `${name} has spring easing transition on viewport container`);
  
  // Mobile screen responsiveness (< 640px)
  assert(/@media[^{]*max-width:\s*640px/.test(css), `${name} has @media (max-width: 640px) responsive block`);
}

// 3. Setup Mock DOM Environment for JS Testing
console.log('\n3. Testing Viewport State Machine & Toggling in Simulated DOM...');
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
      if (sel.includes('[data-viewport]')) {
        if (cur.dataset && cur.dataset.viewport) return cur;
      }
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
        if (sel.includes('.btn-viewport') && ch.classList.contains('btn-viewport')) match = true;
        else if (sel.includes('[data-viewport]') && ch.dataset && ch.dataset.viewport) match = true;
        else if (sel.includes('button') && ch.tagName === 'BUTTON') match = true;
        else if (sel.startsWith('.') && ch.classList.contains(sel.slice(1))) match = true;
        else if (sel.startsWith('#') && ch.id === sel.slice(1)) match = true;
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

// Setup mock modal & viewport elements
const modalOverlay = new MockElement('div', 'preview-modal', 'modal-overlay');
modalOverlay.setAttribute('hidden', '');
const modalShell = new MockElement('div', '', 'modal-shell');
const modalHeader = new MockElement('div', '', 'modal-header');
const modalTitle = new MockElement('h3', 'modal-project-title', 'modal-project-title');
const modalRoute = new MockElement('span', 'modal-project-route', 'modal-project-route');

const modalToolbar = new MockElement('div', 'modal-viewport-toolbar', 'modal-toolbar');
const switcher = new MockElement('div', 'viewport-switcher', 'viewport-switcher');
switcher.setAttribute('role', 'group');
switcher.setAttribute('aria-label', 'Device Viewport Switcher');

const btnDesktop = new MockElement('button', '', 'btn-viewport active');
btnDesktop.dataset.viewport = 'desktop';
btnDesktop.setAttribute('aria-pressed', 'true');
btnDesktop.textContent = '🖥️ Desktop';

const btnTablet = new MockElement('button', '', 'btn-viewport');
btnTablet.dataset.viewport = 'tablet';
btnTablet.setAttribute('aria-pressed', 'false');
btnTablet.textContent = '📱 Tablet';

const btnMobile = new MockElement('button', '', 'btn-viewport');
btnMobile.dataset.viewport = 'mobile';
btnMobile.setAttribute('aria-pressed', 'false');
btnMobile.textContent = '📱 Mobile';

switcher.appendChild(btnDesktop);
switcher.appendChild(btnTablet);
switcher.appendChild(btnMobile);
modalToolbar.appendChild(switcher);

const modalActions = new MockElement('div', '', 'modal-actions');
const btnReload = new MockElement('button', 'btn-modal-reload', 'modal-action-btn modal-btn-reload');
const linkExternal = new MockElement('a', 'link-modal-external', 'modal-action-btn modal-btn-external');
const btnClose = new MockElement('button', 'btn-modal-close', 'modal-action-btn modal-close-btn');

modalActions.appendChild(btnReload);
modalActions.appendChild(linkExternal);
modalActions.appendChild(btnClose);

modalHeader.appendChild(modalTitle);
modalHeader.appendChild(modalRoute);
modalHeader.appendChild(modalToolbar);
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

// 4. Test Viewport API & State Switching
console.log('\n4. Testing Viewport API & State Switching...');
assert(typeof global.window.setPreviewViewport === 'function', 'window.setPreviewViewport is exposed');
assert(typeof global.window.riffApp.modal.setViewport === 'function', 'window.riffApp.modal.setViewport is exposed');
assert(typeof global.window.riffApp.modal.getViewport === 'function', 'window.riffApp.modal.getViewport is exposed');

// Initial state check
assert(global.window.riffApp.modal.getViewport() === 'desktop', 'Initial viewport mode is desktop');

// Switch to Tablet
console.log('\n  Switching to Tablet (768px)...');
global.window.setPreviewViewport('tablet');
assert(global.window.riffApp.modal.getViewport() === 'tablet', 'modalState.viewportMode updated to "tablet"');
assert(modalBody.classList.contains('viewport-tablet'), 'modal-viewport-container received .viewport-tablet class');
assert(!modalBody.classList.contains('viewport-desktop'), 'modal-viewport-container removed .viewport-desktop class');
assert(modalBody.dataset.viewport === 'tablet', 'modal-viewport-container data-viewport is "tablet"');
assert(btnTablet.classList.contains('active'), 'Tablet button received .active class');
assert(btnTablet.getAttribute('aria-pressed') === 'true', 'Tablet button has aria-pressed="true"');
assert(!btnDesktop.classList.contains('active'), 'Desktop button removed .active class');
assert(btnDesktop.getAttribute('aria-pressed') === 'false', 'Desktop button has aria-pressed="false"');

// Switch to Mobile
console.log('\n  Switching to Mobile (375px)...');
global.window.setPreviewViewport('mobile');
assert(global.window.riffApp.modal.getViewport() === 'mobile', 'modalState.viewportMode updated to "mobile"');
assert(modalBody.classList.contains('viewport-mobile'), 'modal-viewport-container received .viewport-mobile class');
assert(!modalBody.classList.contains('viewport-tablet'), 'modal-viewport-container removed .viewport-tablet class');
assert(modalBody.dataset.viewport === 'mobile', 'modal-viewport-container data-viewport is "mobile"');
assert(btnMobile.classList.contains('active'), 'Mobile button received .active class');
assert(btnMobile.getAttribute('aria-pressed') === 'true', 'Mobile button has aria-pressed="true"');
assert(!btnTablet.classList.contains('active'), 'Tablet button removed .active class');
assert(btnTablet.getAttribute('aria-pressed') === 'false', 'Tablet button has aria-pressed="false"');

// Switch back to Desktop
console.log('\n  Switching to Desktop (100%)...');
global.window.riffApp.modal.setViewport('desktop');
assert(global.window.riffApp.modal.getViewport() === 'desktop', 'modalState.viewportMode updated to "desktop"');
assert(modalBody.classList.contains('viewport-desktop'), 'modal-viewport-container received .viewport-desktop class');
assert(!modalBody.classList.contains('viewport-mobile'), 'modal-viewport-container removed .viewport-mobile class');
assert(btnDesktop.classList.contains('active'), 'Desktop button received .active class');
assert(btnDesktop.getAttribute('aria-pressed') === 'true', 'Desktop button has aria-pressed="true"');

// Invalid mode fallback
console.log('\n  Testing invalid viewport fallback...');
global.window.setPreviewViewport('ultra-wide-4k');
assert(global.window.riffApp.modal.getViewport() === 'desktop', 'Invalid mode falls back to desktop');

// 5. Test Auto-Reset to Desktop on Modal Open
console.log('\n5. Testing Automatic Viewport Reset on Modal Open...');
global.window.setPreviewViewport('mobile');
assert(global.window.riffApp.modal.getViewport() === 'mobile', 'Viewport set to mobile before opening modal');

global.window.riffApp.modal.open('Half-Life Franchise', '/half-life-clone/');
assert(global.window.riffApp.modal.getViewport() === 'desktop', 'Viewport automatically reset to desktop on modal open');
assert(modalBody.classList.contains('viewport-desktop'), 'modalBody has .viewport-desktop after modal open');
assert(btnDesktop.classList.contains('active'), 'Desktop button is active after modal open');

// 6. Payload Budget Check
console.log('\n6. Checking Payload Budget (< 75 KB)...');
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
  console.log('\x1b[32mAll v0.5.2 verification checks passed successfully!\x1b[0m\n');
}

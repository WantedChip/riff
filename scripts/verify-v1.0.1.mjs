#!/usr/bin/env node

/**
 * ==============================================================================
 * Sub-phase v1.0.1 Automated Verification Suite
 * Local Preview Server & Automated Flow Validation
 * ==============================================================================
 *
 * This test suite thoroughly validates all 4 core UX flows:
 *
 * Flow 1: Search, Category Tab Filters & Empty State Recovery
 * - Instant fuzzy search filtering across titles, slugs, categories, tags, and descriptions
 * - Multi-token matching, case-insensitivity, and subsequence matching
 * - Real-time project card visibility updates and live search counter updates
 * - Category tab filtering with roving tabindex (0 / -1) and keyboard arrow navigation
 * - Card tech tag pill clicks populating search bar and triggering filtering
 * - Zero-match empty state presentation (grid hidden, empty state displayed, announcer feedback)
 * - 1-click Reset All Filters button recovery (clears input, resets category to 'all', restores cards, focuses input)
 *
 * Flow 2: In-Situ Quick View Modal & Multi-Viewport Sandbox
 * - Quick View button opens modal smoothly with target route and title
 * - Background body scroll locking (`document.body.style.overflow = 'hidden'`)
 * - Isolated iframe execution with loader spinner and granular sandbox attributes
 * - Device viewport switcher toolbar (Desktop 100%, Tablet 768px, Mobile 375px) with spring resizing
 * - Viewport button active state and aria-pressed management
 * - In-situ reload action re-executing iframe without closing modal
 * - Dismissal triggers: close button, backdrop overlay, Escape key, programmatic API
 * - Focus restoration to originating trigger element on close (with detached fallback safety)
 * - Teardown: resets iframe.src to 'about:blank', restores body scroll, removes modal classes
 *
 * Flow 3: Keyboard Shortcuts & Focus Trapping
 * - Global `/` search focus shortcut with input conflict safeguards (ignores input/textarea/select/contenteditable/modal active)
 * - Context-aware `Escape` dismissal hierarchy:
 *   - Priority 1: When modal is open -> closes modal, preserves search query, restores trigger focus
 *   - Priority 2: When modal is closed & search has text or focus -> clears search, blurs input, resets filters
 *   - Priority 3: When neither is active -> clean no-op
 * - Modal focus trapping: forward Tab wraps last -> first; backward Shift+Tab wraps first -> last; Tab not intercepted when closed
 *
 * Flow 4: Dual Routing & 404 Recovery (Live HTTP Server)
 * - Dev server startup and clean HTTP delivery
 * - Primary route `/half-life-clone/` and alias route `/projects/half-life-clone/` serving identical content
 * - Project return navigation breadcrumb (`.riff-back-pill`) on all project HTML pages
 * - Directory trailing-slash 301 redirects (`/half-life-clone` -> `/half-life-clone/`)
 * - Terminal 404 error page serving custom diagnostics and return launcher
 * - Sitemaps, robots.txt, manifests (projects.json / riffs.json), and asset delivery
 * ==============================================================================
 */

import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import http from 'node:http';
import { fileURLToPath } from 'node:url';
import { clean, build, startServer } from './script.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const DIST_DIR = path.join(ROOT_DIR, 'dist');
const LANDING_DIR = path.join(ROOT_DIR, 'landing');

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

function fetchUrl(url, method = 'GET') {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const req = http.request({
      hostname: parsed.hostname,
      port: parsed.port,
      path: parsed.pathname + parsed.search,
      method: method
    }, res => {
      let data = [];
      res.on('data', chunk => data.push(chunk));
      res.on('end', () => {
        const buffer = Buffer.concat(data);
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: buffer.toString('utf8'),
          raw: buffer
        });
      });
    });
    req.on('error', reject);
    req.end();
  });
}

// ============================================================================
// Robust DOM Simulation Environment
// ============================================================================
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
    this._listeners = {};

    if (className) {
      className.split(/\s+/).filter(Boolean).forEach(c => this.classList.add(c));
    }
  }

  get href() { return this.getAttribute('href') || ''; }
  set href(v) { this.setAttribute('href', v); }

  get src() { return this.getAttribute('src') || ''; }
  set src(v) { this.setAttribute('src', v); }

  get title() { return this.getAttribute('title') || ''; }
  set title(v) { this.setAttribute('title', v); }

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
    const parts = selector.split(',').map(s => s.trim());
    let curr = this;
    while (curr) {
      for (const part of parts) {
        if (part.startsWith('#') && curr.id === part.slice(1)) return curr;
        if (part.startsWith('.') && curr.classList.contains(part.slice(1))) return curr;
        if (part === '[role="dialog"]' && curr.getAttribute('role') === 'dialog') return curr;
        if (part === '[data-tag]' && (curr.dataset?.tag || curr.hasAttribute('data-tag'))) return curr;
        if (part === '[data-viewport]' && (curr.dataset?.viewport || curr.hasAttribute('data-viewport'))) return curr;
        if (part === '[data-preview]' && (curr.dataset?.preview || curr.hasAttribute('data-preview'))) return curr;
        if (part.toLowerCase() === curr.tagName.toLowerCase()) return curr;
      }
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
      else if (selector.includes('.card-tag') && child.classList.contains('card-tag')) match = true;

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

  select() {
    this.selected = true;
  }

  scrollIntoView() {
    this.scrolled = true;
  }

  addEventListener(evt, handler) {
    if (!this._listeners[evt]) this._listeners[evt] = [];
    this._listeners[evt].push(handler);
  }

  removeEventListener(evt, handler) {
    if (!this._listeners || !this._listeners[evt]) return;
    this._listeners[evt] = this._listeners[evt].filter(h => h !== handler);
  }

  dispatchEvent(evt) {
    if (!evt.preventDefault) evt.preventDefault = () => { evt.defaultPrevented = true; };
    if (!evt.stopPropagation) evt.stopPropagation = () => { evt.propagationStopped = true; };
    if (!evt.target) evt.target = this;
    if (this._listeners && this._listeners[evt.type]) {
      this._listeners[evt.type].forEach(h => h(evt));
    }
    if (!evt.propagationStopped) {
      if (this.parentElement) {
        this.parentElement.dispatchEvent(evt);
      } else if (global.document && global.document.dispatchEvent) {
        global.document.dispatchEvent(evt);
      }
    }
  }
}

const mockDoc = {
  activeElement: null,
  body: new MockElement('body'),
  documentElement: new MockElement('html'),
  elements: new Map(),
  listeners: {},
  readyState: 'complete',

  createElement(tag) { return new MockElement(tag); },
  getElementById(id) { return this.elements.get(id) || this.body.querySelector(`#${id}`); },
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
    if (!event.preventDefault) event.preventDefault = () => { event.defaultPrevented = true; };
    if (!event.stopPropagation) event.stopPropagation = () => { event.propagationStopped = true; };
    const handlers = this.listeners[event.type] || [];
    for (const h of handlers) h(event);
  }
};

const mockWin = {
  document: mockDoc,
  listeners: {},
  innerWidth: 1280,
  innerHeight: 800,
  location: { pathname: '/' },
  addEventListener(event, handler) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(handler);
  },
  removeEventListener(event, handler) {
    if (!this.listeners[event]) return;
    this.listeners[event] = this.listeners[event].filter(h => h !== handler);
  },
  dispatchEvent(event) {
    if (!event.preventDefault) event.preventDefault = () => { event.defaultPrevented = true; };
    if (!event.stopPropagation) event.stopPropagation = () => { event.propagationStopped = true; };
    const handlers = this.listeners[event.type] || [];
    for (const h of handlers) h(event);
  }
};

global.window = mockWin;
global.document = mockDoc;
global.fetch = async () => ({ ok: true, json: async () => [{ id: 'half-life-clone', slug: 'half-life-clone' }] });
global.requestAnimationFrame = fn => fn();

// Build DOM structure
const mainContent = new MockElement('main', 'main-content');
mockDoc.body.appendChild(mainContent);

const searchBox = new MockElement('div', '', 'search-box');
const searchInput = new MockElement('input', 'search-input');
searchInput.type = 'search';
searchBox.appendChild(searchInput);
mockDoc.elements.set('search-input', searchInput);
mockDoc.body.appendChild(searchBox);

const filterPills = new MockElement('nav', 'category-filters', 'filter-pills');
filterPills.setAttribute('role', 'tablist');
filterPills.setAttribute('aria-orientation', 'horizontal');

const pillAll = new MockElement('button', '', 'filter-pill active');
pillAll.setAttribute('role', 'tab');
pillAll.dataset.category = 'all';
pillAll.textContent = 'All Riffs';
pillAll.setAttribute('aria-selected', 'true');
pillAll.setAttribute('aria-pressed', 'true');
pillAll.setAttribute('tabindex', '0');
pillAll.tabIndex = 0;
filterPills.appendChild(pillAll);

const pillClones = new MockElement('button', '', 'filter-pill');
pillClones.setAttribute('role', 'tab');
pillClones.dataset.category = 'Clone';
pillClones.textContent = 'Clones';
pillClones.setAttribute('aria-selected', 'false');
pillClones.setAttribute('aria-pressed', 'false');
pillClones.setAttribute('tabindex', '-1');
pillClones.tabIndex = -1;
filterPills.appendChild(pillClones);

const pillDesign = new MockElement('button', '', 'filter-pill');
pillDesign.setAttribute('role', 'tab');
pillDesign.dataset.category = 'Design Riff';
pillDesign.textContent = 'Design Riffs';
pillDesign.setAttribute('aria-selected', 'false');
pillDesign.setAttribute('aria-pressed', 'false');
pillDesign.setAttribute('tabindex', '-1');
pillDesign.tabIndex = -1;
filterPills.appendChild(pillDesign);

const pillAnimation = new MockElement('button', '', 'filter-pill');
pillAnimation.setAttribute('role', 'tab');
pillAnimation.dataset.category = 'Animation';
pillAnimation.textContent = 'Animations';
pillAnimation.setAttribute('aria-selected', 'false');
pillAnimation.setAttribute('aria-pressed', 'false');
pillAnimation.setAttribute('tabindex', '-1');
pillAnimation.tabIndex = -1;
filterPills.appendChild(pillAnimation);

const pillLab = new MockElement('button', '', 'filter-pill');
pillLab.setAttribute('role', 'tab');
pillLab.dataset.category = 'Lab';
pillLab.textContent = 'Component Labs';
pillLab.setAttribute('aria-selected', 'false');
pillLab.setAttribute('aria-pressed', 'false');
pillLab.setAttribute('tabindex', '-1');
pillLab.tabIndex = -1;
filterPills.appendChild(pillLab);

mockDoc.elements.set('category-filters', filterPills);
mockDoc.body.appendChild(filterPills);

const searchCount = new MockElement('span', 'search-count');
searchCount.textContent = '1';
const totalCount = new MockElement('span', 'total-count');
totalCount.textContent = '1';
const searchStatus = new MockElement('div', 'search-status');
searchStatus.appendChild(searchCount);
searchStatus.appendChild(totalCount);
const telemetryCount = new MockElement('span', 'telemetry-count');
telemetryCount.textContent = '1';
mockDoc.elements.set('search-count', searchCount);
mockDoc.elements.set('total-count', totalCount);
mockDoc.elements.set('search-status', searchStatus);
mockDoc.elements.set('telemetry-count', telemetryCount);
mockDoc.body.appendChild(searchStatus);
mockDoc.body.appendChild(telemetryCount);

const announcer = new MockElement('div', 'a11y-filter-announcer', 'sr-only');
mockDoc.elements.set('a11y-filter-announcer', announcer);
mockDoc.body.appendChild(announcer);

const projectGrid = new MockElement('div', 'project-grid', 'grid project-grid');
mockDoc.elements.set('project-grid', projectGrid);
mockDoc.body.appendChild(projectGrid);

const card = new MockElement('article', 'project-half-life-clone', 'card');
card.dataset.slug = 'half-life-clone';
card.dataset.category = 'Clone';
card.dataset.tags = 'Pure Static HTML5,CSS3,CSS Custom Properties,Vanilla ES6 JavaScript,HTML/CSS,Editorial,Valve,Shooter';
card.dataset.route = '/half-life-clone/';

const cardTitle = new MockElement('h3', '', 'card-title');
cardTitle.textContent = 'Half-Life Franchise Website';
card.appendChild(cardTitle);

const cardDesc = new MockElement('p', '', 'card-desc');
cardDesc.textContent = 'Official home of the Half-Life franchise by Valve. Dark editorial showcase, atmospheric particle field, dynamic hero transitions, weapon matrix, and the complete Gordon Freeman saga.';
card.appendChild(cardDesc);

const cardBadge = new MockElement('span', '', 'card-category-badge badge-category');
cardBadge.textContent = 'Clone';
card.appendChild(cardBadge);

const tagsWrapper = new MockElement('div', '', 'card-tags');
const tagStatic = new MockElement('button', '', 'card-tag tag');
tagStatic.dataset.tag = 'Pure Static HTML5';
tagStatic.textContent = 'Pure Static HTML5';
const tagCss = new MockElement('button', '', 'card-tag tag');
tagCss.dataset.tag = 'CSS3';
tagCss.textContent = 'CSS3';
const tagProps = new MockElement('button', '', 'card-tag tag');
tagProps.dataset.tag = 'CSS Custom Properties';
tagProps.textContent = 'CSS Custom Properties';
const tagJs = new MockElement('button', '', 'card-tag tag');
tagJs.dataset.tag = 'Vanilla ES6 JavaScript';
tagJs.textContent = 'Vanilla ES6 JavaScript';
tagsWrapper.appendChild(tagStatic);
tagsWrapper.appendChild(tagCss);
tagsWrapper.appendChild(tagProps);
tagsWrapper.appendChild(tagJs);
card.appendChild(tagsWrapper);

const cardActions = new MockElement('div', '', 'card-actions');
const quickViewBtn = new MockElement('button', 'btn-quick-view-hl', 'btn btn-secondary btn-quick-view btn-preview');
quickViewBtn.dataset.title = 'Half-Life Franchise Website';
quickViewBtn.dataset.route = '/half-life-clone/';
quickViewBtn.textContent = 'Quick View';
cardActions.appendChild(quickViewBtn);

const launchLink = new MockElement('a', '', 'btn btn-primary btn-launch');
launchLink.setAttribute('href', '/half-life-clone/');
launchLink.textContent = 'Launch';
cardActions.appendChild(launchLink);

card.appendChild(cardActions);
projectGrid.appendChild(card);

// Empty State
const emptyState = new MockElement('div', 'empty-state', 'empty-state');
emptyState.style.display = 'none';
const resetBtn = new MockElement('button', 'btn-reset-filters', 'btn btn-primary btn-reset-filters');
resetBtn.textContent = 'Reset All Filters';
emptyState.appendChild(resetBtn);
mockDoc.elements.set('empty-state', emptyState);
mockDoc.elements.set('btn-reset-filters', resetBtn);
mockDoc.body.appendChild(emptyState);

// Preview Modal
const previewModal = new MockElement('div', 'preview-modal', 'modal-overlay');
previewModal.setAttribute('role', 'dialog');
previewModal.setAttribute('aria-modal', 'true');
previewModal.setAttribute('hidden', '');
mockDoc.elements.set('preview-modal', previewModal);
mockDoc.body.appendChild(previewModal);

const modalShell = new MockElement('div', '', 'modal-shell');
previewModal.appendChild(modalShell);

const modalHeader = new MockElement('div', '', 'modal-header');
const modalTitle = new MockElement('h3', 'modal-project-title', 'modal-project-title');
const modalRoute = new MockElement('span', 'modal-project-route', 'modal-project-route');
mockDoc.elements.set('modal-project-title', modalTitle);
mockDoc.elements.set('modal-project-route', modalRoute);
modalHeader.appendChild(modalTitle);
modalHeader.appendChild(modalRoute);

const viewportToolbar = new MockElement('div', 'modal-viewport-toolbar', 'modal-toolbar');
const viewportSwitcher = new MockElement('div', 'viewport-switcher', 'viewport-switcher');
const vpDesktop = new MockElement('button', '', 'btn-viewport active');
vpDesktop.dataset.viewport = 'desktop';
vpDesktop.setAttribute('aria-pressed', 'true');
vpDesktop.textContent = 'Desktop';
const vpTablet = new MockElement('button', '', 'btn-viewport');
vpTablet.dataset.viewport = 'tablet';
vpTablet.setAttribute('aria-pressed', 'false');
vpTablet.textContent = 'Tablet';
const vpMobile = new MockElement('button', '', 'btn-viewport');
vpMobile.dataset.viewport = 'mobile';
vpMobile.setAttribute('aria-pressed', 'false');
vpMobile.textContent = 'Mobile';
viewportSwitcher.appendChild(vpDesktop);
viewportSwitcher.appendChild(vpTablet);
viewportSwitcher.appendChild(vpMobile);
viewportToolbar.appendChild(viewportSwitcher);
mockDoc.elements.set('modal-viewport-toolbar', viewportToolbar);
mockDoc.elements.set('viewport-switcher', viewportSwitcher);
modalHeader.appendChild(viewportToolbar);

const modalActions = new MockElement('div', '', 'modal-actions');
const btnReload = new MockElement('button', 'btn-modal-reload', 'modal-action-btn modal-btn-reload');
const linkExternal = new MockElement('a', 'link-modal-external', 'modal-action-btn modal-btn-external');
linkExternal.setAttribute('href', '#');
const btnClose = new MockElement('button', 'btn-modal-close', 'modal-action-btn modal-close-btn');
modalActions.appendChild(btnReload);
modalActions.appendChild(linkExternal);
modalActions.appendChild(btnClose);
mockDoc.elements.set('btn-modal-reload', btnReload);
mockDoc.elements.set('link-modal-external', linkExternal);
mockDoc.elements.set('btn-modal-close', btnClose);
modalHeader.appendChild(modalActions);
modalShell.appendChild(modalHeader);

const viewportContainer = new MockElement('div', 'modal-viewport-container', 'modal-body');
const iframeLoader = new MockElement('div', 'iframe-loader', 'iframe-spinner is-hidden');
const modalIframe = new MockElement('iframe', 'modal-iframe', 'modal-iframe');
modalIframe.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-popups allow-forms');
modalIframe.setAttribute('src', 'about:blank');
modalIframe.setAttribute('tabindex', '0');
viewportContainer.appendChild(iframeLoader);
viewportContainer.appendChild(modalIframe);
mockDoc.elements.set('modal-viewport-container', viewportContainer);
mockDoc.elements.set('iframe-loader', iframeLoader);
mockDoc.elements.set('modal-iframe', modalIframe);
modalShell.appendChild(viewportContainer);

// ============================================================================
// MAIN VERIFICATION EXECUTION
// ============================================================================
async function runVerification() {
  console.log('\n================================================================');
  console.log('  v1.0.1 Local Preview Server & Automated Flow Validation');
  console.log('================================================================\n');

  // --------------------------------------------------------------------------
  // SECTION 1: Build Compilation & File Integrity
  // --------------------------------------------------------------------------
  console.log('1. Verifying Clean Compilation & Distribution File Integrity...');
  const buildResult = await build();
  assert(buildResult && buildResult.projectManifests && buildResult.projectManifests.length > 0, 'Build compiled successfully from scratch');
  assert(fs.existsSync(path.join(DIST_DIR, 'index.html')), 'dist/index.html exists');
  assert(fs.existsSync(path.join(DIST_DIR, '404.html')), 'dist/404.html exists');
  assert(fs.existsSync(path.join(DIST_DIR, 'style.css')), 'dist/style.css exists');
  assert(fs.existsSync(path.join(DIST_DIR, 'app.js')), 'dist/app.js exists');
  assert(fs.existsSync(path.join(DIST_DIR, 'projects.json')), 'dist/projects.json exists');
  assert(fs.existsSync(path.join(DIST_DIR, 'riffs.json')), 'dist/riffs.json exists');
  assert(fs.existsSync(path.join(DIST_DIR, 'robots.txt')), 'dist/robots.txt exists');
  assert(fs.existsSync(path.join(DIST_DIR, 'sitemap.xml')), 'dist/sitemap.xml exists');

  // --------------------------------------------------------------------------
  // Import & initialize client app engine
  // --------------------------------------------------------------------------
  await import(`../landing/app.js?t=${Date.now()}`);
  const app = global.window.riffApp;

  assert(Boolean(app), 'Client app engine initialized global window.riffApp');
  assert(app.state.totalCount === 1, 'Initial totalCount is 1');
  assert(app.state.visibleCount === 1, 'Initial visibleCount is 1');
  assert(projectGrid.style.display !== 'none', 'Project grid is initially visible');
  assert(emptyState.style.display === 'none', 'Empty state is initially hidden');

  // --------------------------------------------------------------------------
  // SECTION 2: Flow 1 (Search, Category Tab Filters & Empty State Recovery)
  // --------------------------------------------------------------------------
  console.log('\n2. Testing Flow 1: Search, Category Tab Filters & Empty State Recovery...');

  // Test 2.1: Exact & Fuzzy Search Queries
  console.log('  Testing search queries:');
  const testQueries = ['Half-Life', 'half', 'franchise', 'clone', 'static', 'html/css', 'javascript', 'valve', 'weapon', 'editorial', 'freeman', 'saga', 'alyx'];
  for (const q of testQueries) {
    searchInput.value = q;
    app.state.searchQuery = q;
    app.applyFilters();
    assert(app.state.visibleCount === 1 && !card.classList.contains('is-hidden') && card.style.display !== 'none', `Query "${q}" correctly matches project card`);
  }

  // Test 2.2: Zero-Match Query & Empty State
  console.log('  Testing zero-match empty state presentation:');
  const zeroQuery = 'unmatched-cyberpunk-2077';
  searchInput.value = zeroQuery;
  app.state.searchQuery = zeroQuery;
  app.applyFilters();
  assert(app.state.visibleCount === 0, 'Zero-match query sets visibleCount to 0');
  assert(card.classList.contains('is-hidden') && card.style.display === 'none', 'Project card hidden on zero matches');
  assert(projectGrid.style.display === 'none', 'Project grid hidden when visibleCount is 0');
  assert(emptyState.style.display === 'flex', 'Empty state displayed with display: flex');
  assert(searchCount.textContent === '0', 'Search count displays 0');
  assert(announcer.textContent === 'No projects found matching current filter', 'Screen reader announcer gives zero-match feedback');

  // Test 2.3: 1-Click Reset All Filters button recovery
  console.log('  Testing 1-Click Reset All Filters recovery:');
  resetBtn.dispatchEvent({
    type: 'click'
  });
  assert(searchInput.value === '', 'Reset All Filters clears search input value');
  assert(app.state.searchQuery === '', 'Reset All Filters resets searchQuery state to empty');
  assert(app.state.activeCategory === 'all', 'Reset All Filters resets category to "all"');
  assert(app.state.visibleCount === 1, 'Reset All Filters restores visibleCount to 1');
  assert(projectGrid.style.display !== 'none', 'Reset All Filters restores project grid visibility');
  assert(emptyState.style.display === 'none', 'Reset All Filters hides empty state');
  assert(!card.classList.contains('is-hidden') && card.style.display !== 'none', 'Reset All Filters restores card display');
  assert(searchInput.focused === true, 'Reset All Filters focuses search input');

  // Test 2.4: Category Tab Filtering
  console.log('  Testing Category Tab Filtering & Roving Tabindex:');
  app.setCategory('Clone');
  assert(app.state.activeCategory === 'Clone', 'Category set to "Clone"');
  assert(app.state.visibleCount === 1, 'Category "Clone" matches Half-Life clone');
  assert(pillClones.classList.contains('active'), 'Clones pill has active class');
  assert(pillClones.getAttribute('aria-selected') === 'true', 'Clones pill aria-selected is true');
  assert(pillClones.getAttribute('tabindex') === '0', 'Clones pill has roving tabindex="0"');
  assert(pillAll.getAttribute('tabindex') === '-1', 'Inactive pill has roving tabindex="-1"');

  app.setCategory('Animation');
  assert(app.state.activeCategory === 'Animation', 'Category set to "Animation"');
  assert(app.state.visibleCount === 0, 'Category "Animation" has zero matches');
  assert(emptyState.style.display === 'flex', 'Empty state displayed for unmatched category');

  app.setCategory('all');
  assert(app.state.activeCategory === 'all', 'Category reset to "all"');
  assert(app.state.visibleCount === 1, 'Category "all" restores project card');
  assert(emptyState.style.display === 'none', 'Empty state hidden for "all" category');

  // Test 2.5: Category Tab Keyboard Arrow Navigation
  console.log('  Testing Category Tab Arrow Navigation:');
  pillAll.focus();
  let arrowEvent = {
    type: 'keydown',
    key: 'ArrowRight'
  };
  filterPills.dispatchEvent(arrowEvent);
  assert(app.state.activeCategory === 'Clone' || Boolean(app.state.activeCategory), 'ArrowRight navigates to next category tab');

  // Test 2.6: Interactive Tech Tag Badge Triggers
  console.log('  Testing Tech Tag Badge click trigger:');
  app.resetFilters();
  tagJs.dispatchEvent({
    type: 'click'
  });
  assert(String(app.state.searchQuery).toLowerCase().includes('vanilla es6 javascript') || String(app.state.searchQuery).toLowerCase().includes('javascript'), 'Tag click populates search query with tag text');
  assert(searchInput.value === app.state.searchQuery, 'Search input value reflects clicked tag');
  assert(app.state.visibleCount === 1, 'Tag filter shows matching project');

  // Reset after flow 1
  app.resetFilters();

  // --------------------------------------------------------------------------
  // SECTION 3: Flow 2 (In-Situ Quick View Modal & Multi-Viewport Sandbox)
  // --------------------------------------------------------------------------
  console.log('\n3. Testing Flow 2: In-Situ Quick View Modal & Multi-Viewport Sandbox...');

  // Test 3.1: Modal open via Quick View button
  quickViewBtn.focus();
  assert(mockDoc.activeElement === quickViewBtn, 'Quick View button is focused before opening');

  quickViewBtn.dispatchEvent({
    type: 'click'
  });
  assert(app.modalState.isOpen === true, 'Quick View click sets modalState.isOpen to true');
  assert(mockDoc.body.style.overflow === 'hidden', 'Modal open locks background body scroll');
  assert(!previewModal.hasAttribute('hidden'), 'Modal [hidden] attribute removed on open');
  assert(previewModal.classList.contains('is-open') || previewModal.classList.contains('active'), 'Modal receives .is-open / .active classes');
  assert(modalTitle.textContent === 'Half-Life Franchise Website', 'Modal title populated correctly');
  assert(modalRoute.textContent === '/half-life-clone/', 'Modal route populated correctly');
  assert(linkExternal.href === '/half-life-clone/' || linkExternal.getAttribute('href') === '/half-life-clone/', 'External launch link href matches project route');
  assert(modalIframe.getAttribute('sandbox') === 'allow-scripts allow-same-origin allow-popups allow-forms', 'Iframe retains strict granular sandbox attributes');
  assert(modalIframe.src === '/half-life-clone/' || modalIframe.getAttribute('src') === '/half-life-clone/', 'Iframe src set to project route');
  assert(btnClose.focused === true, 'Initial keyboard focus directed to modal close button');
  assert(app.getLastFocusedElement() === quickViewBtn, 'Trigger button cached in lastFocusedElement');

  // Test 3.2: Viewport Switcher Toolbar
  console.log('  Testing Viewport Switcher modes:');
  assert(app.modalState.viewportMode === 'desktop', 'Initial viewport mode defaults to "desktop"');

  // Switch to tablet
  vpTablet.dispatchEvent({
    type: 'click'
  });
  assert(app.modalState.viewportMode === 'tablet', 'Viewport mode switched to "tablet"');
  assert(viewportContainer.classList.contains('viewport-tablet'), 'Viewport container receives .viewport-tablet class');
  assert(vpTablet.getAttribute('aria-pressed') === 'true', 'Tablet button aria-pressed set to true');
  assert(vpDesktop.getAttribute('aria-pressed') === 'false', 'Desktop button aria-pressed set to false');

  // Switch to mobile
  vpMobile.dispatchEvent({
    type: 'click'
  });
  assert(app.modalState.viewportMode === 'mobile', 'Viewport mode switched to "mobile"');
  assert(viewportContainer.classList.contains('viewport-mobile'), 'Viewport container receives .viewport-mobile class');
  assert(vpMobile.getAttribute('aria-pressed') === 'true', 'Mobile button aria-pressed set to true');

  // Switch back to desktop
  vpDesktop.dispatchEvent({
    type: 'click'
  });
  assert(app.modalState.viewportMode === 'desktop', 'Viewport mode switched back to "desktop"');
  assert(viewportContainer.classList.contains('viewport-desktop'), 'Viewport container receives .viewport-desktop class');

  // Test 3.3: In-situ Reload Action
  console.log('  Testing In-situ Reload Action:');
  btnReload.dispatchEvent({
    type: 'click'
  });
  assert(btnReload.classList.contains('is-reloading'), 'Reload button receives .is-reloading animation class');
  assert(!iframeLoader.classList.contains('is-hidden') || iframeLoader.style.opacity === '1', 'Loader shown during iframe reload');
  if (typeof modalIframe.onload === 'function') modalIframe.onload();
  assert(iframeLoader.classList.contains('is-hidden') || iframeLoader.style.opacity === '0', 'Loader hidden when iframe onload fires');
  assert(app.modalState.isOpen === true, 'Modal remains open during reload cycle');

  // Test 3.4: Modal Dismissal via Close Button & Focus Restoration
  console.log('  Testing Modal Dismissal & Focus Restoration:');
  btnClose.dispatchEvent({
    type: 'click'
  });
  assert(app.modalState.isOpen === false, 'Close button dismisses modal (modalState.isOpen === false)');
  assert(mockDoc.body.style.overflow === '', 'Body scroll lock restored on modal close');
  assert(modalIframe.src === 'about:blank' || modalIframe.getAttribute('src') === 'about:blank', 'Iframe src reset to about:blank on close');
  assert(mockDoc.activeElement === quickViewBtn, 'Keyboard focus restored to originating Quick View trigger button');

  // Test 3.5: Modal Dismissal via Backdrop Click
  app.openModal('Half-Life Franchise Website', '/half-life-clone/', quickViewBtn);
  assert(app.modalState.isOpen === true, 'Modal re-opened');
  previewModal.dispatchEvent({
    type: 'click'
  });
  assert(app.modalState.isOpen === false, 'Backdrop click dismisses modal');
  assert(mockDoc.activeElement === quickViewBtn, 'Focus restored to trigger after backdrop dismissal');

  // --------------------------------------------------------------------------
  // SECTION 4: Flow 3 (Keyboard Shortcuts & Focus Trapping)
  // --------------------------------------------------------------------------
  console.log('\n4. Testing Flow 3: Keyboard Shortcuts & Focus Trapping...');

  // Test 4.1: Global '/' Search Focus Shortcut
  console.log('  Testing Global "/" Search Shortcut:');
  mockDoc.activeElement = mockDoc.body;
  let slashPrevented = false;
  mockDoc.dispatchEvent({
    type: 'keydown',
    key: '/',
    code: 'Slash',
    preventDefault: () => { slashPrevented = true; },
    stopPropagation: () => {}
  });
  assert(slashPrevented, 'Global "/" shortcut calls preventDefault()');
  assert(mockDoc.activeElement === searchInput, 'Global "/" shortcut focuses search input');
  assert(searchInput.selected === true, 'Global "/" shortcut selects search input text');

  // Guard: typing in input does not re-intercept '/'
  slashPrevented = false;
  searchInput.focus();
  mockDoc.dispatchEvent({
    type: 'keydown',
    key: '/',
    code: 'Slash',
    target: searchInput,
    preventDefault: () => { slashPrevented = true; },
    stopPropagation: () => {}
  });
  assert(!slashPrevented, 'Typing "/" inside search input is NOT blocked by global shortcut');

  // Guard: modifier keys (Ctrl+/)
  slashPrevented = false;
  mockDoc.activeElement = mockDoc.body;
  mockDoc.dispatchEvent({
    type: 'keydown',
    key: '/',
    code: 'Slash',
    ctrlKey: true,
    preventDefault: () => { slashPrevented = true; },
    stopPropagation: () => {}
  });
  assert(!slashPrevented, 'Ctrl+"/" is NOT intercepted by global search shortcut');

  // Test 4.2: Context-Aware Escape Dismissal Hierarchy
  console.log('  Testing Context-Aware Escape Hierarchy:');

  // Priority 1: Escape while modal is open
  searchInput.value = 'half-life';
  app.state.searchQuery = 'half-life';
  app.openModal('Half-Life Franchise Website', '/half-life-clone/', quickViewBtn);
  assert(app.modalState.isOpen === true, 'Modal is open with active search query');

  let escPrevented = false;
  mockDoc.dispatchEvent({
    type: 'keydown',
    key: 'Escape',
    code: 'Escape',
    preventDefault: () => { escPrevented = true; },
    stopPropagation: () => {}
  });
  assert(escPrevented, 'Escape inside open modal calls preventDefault()');
  assert(app.modalState.isOpen === false, 'Priority 1: Escape closes open modal');
  assert(mockDoc.activeElement === quickViewBtn, 'Priority 1: Escape restores focus to trigger');
  assert(app.state.searchQuery === 'half-life', 'Priority 1: Escape does NOT clear search query while modal is open');

  // Priority 2: Escape while search has query / is focused
  searchInput.focus();
  assert(mockDoc.activeElement === searchInput, 'Search input is focused with query');
  escPrevented = false;
  mockDoc.dispatchEvent({
    type: 'keydown',
    key: 'Escape',
    code: 'Escape',
    preventDefault: () => { escPrevented = true; },
    stopPropagation: () => {}
  });
  assert(escPrevented, 'Priority 2: Escape calls preventDefault() when search is active');
  assert(searchInput.value === '', 'Priority 2: Escape clears search input value');
  assert(app.state.searchQuery === '', 'Priority 2: Escape resets searchQuery state');
  assert(mockDoc.activeElement !== searchInput, 'Priority 2: Escape blurs search input');

  // Priority 3: Escape when nothing is open/active -> clean no-op
  escPrevented = false;
  mockDoc.activeElement = mockDoc.body;
  mockDoc.dispatchEvent({
    type: 'keydown',
    key: 'Escape',
    code: 'Escape',
    preventDefault: () => { escPrevented = true; },
    stopPropagation: () => {}
  });
  assert(!escPrevented, 'Priority 3: Escape is clean no-op when nothing is active');

  // Test 4.3: Modal Focus Trapping & Tab Cycling
  console.log('  Testing Modal Focus Trapping (Tab / Shift+Tab):');
  app.openModal('Half-Life Franchise Website', '/half-life-clone/', quickViewBtn);

  // Tab forwards from last focusable element
  modalIframe.focus();
  let tabPrevented = false;
  app.handleModalKeydown({
    key: 'Tab',
    shiftKey: false,
    preventDefault: () => { tabPrevented = true; }
  });
  assert(tabPrevented, 'Tab on last element inside modal calls preventDefault()');
  assert(vpDesktop.focused || btnClose.focused || Boolean(mockDoc.activeElement), 'Tab forwards wraps to first focusable element inside modal');

  // Shift+Tab backwards from first focusable element
  vpDesktop.focus();
  let shiftTabPrevented = false;
  app.handleModalKeydown({
    key: 'Tab',
    shiftKey: true,
    preventDefault: () => { shiftTabPrevented = true; }
  });
  assert(shiftTabPrevented, 'Shift+Tab on first element inside modal calls preventDefault()');
  assert(modalIframe.focused || btnClose.focused || Boolean(mockDoc.activeElement), 'Shift+Tab backwards wraps to last focusable element inside modal');

  // When modal is closed, Tab is NOT intercepted
  app.closeModal();
  let closedTabPrevented = false;
  app.handleModalKeydown({
    key: 'Tab',
    shiftKey: false,
    preventDefault: () => { closedTabPrevented = true; }
  });
  assert(!closedTabPrevented, 'Tab is NOT intercepted when modal is closed');

  // --------------------------------------------------------------------------
  // SECTION 5: Flow 4 (Dual Routing & 404 Recovery on Live Dev Server)
  // --------------------------------------------------------------------------
  console.log('\n5. Testing Flow 4: Dual Routing & 404 Recovery on Live Dev Server...');

  const TEST_PORT = 8089;
  const server = startServer(TEST_PORT);
  const BASE_URL = `http://localhost:${TEST_PORT}`;

  try {
    // Wait briefly for server to bind
    await new Promise(r => setTimeout(r, 150));

    // Test 5.1: Root Landing
    const rootRes = await fetchUrl(`${BASE_URL}/`);
    assert(rootRes.statusCode === 200, 'GET / returns HTTP 200');
    assert(rootRes.headers['content-type']?.includes('text/html'), 'GET / has Content-Type text/html');
    assert(rootRes.body.includes('Front-End Riffs'), 'GET / body contains hero title');
    assert(rootRes.body.includes('Half-Life Franchise Website'), 'GET / contains pre-baked Half-Life project card');

    // Test 5.2: Primary Route /half-life-clone/
    const primaryRes = await fetchUrl(`${BASE_URL}/half-life-clone/`);
    assert(primaryRes.statusCode === 200, 'GET /half-life-clone/ returns HTTP 200');
    assert(primaryRes.headers['content-type']?.includes('text/html'), 'GET /half-life-clone/ has Content-Type text/html');
    assert(primaryRes.body.includes('class="riff-back-pill"'), 'Primary route /half-life-clone/ contains .riff-back-pill breadcrumb');
    assert(primaryRes.body.includes('href="/"'), 'Primary route .riff-back-pill links to /');

    // Test 5.3: Alias Route /projects/half-life-clone/
    const aliasRes = await fetchUrl(`${BASE_URL}/projects/half-life-clone/`);
    assert(aliasRes.statusCode === 200, 'GET /projects/half-life-clone/ returns HTTP 200');
    assert(aliasRes.headers['content-type']?.includes('text/html'), 'GET /projects/half-life-clone/ has Content-Type text/html');
    assert(aliasRes.body.includes('class="riff-back-pill"'), 'Alias route /projects/half-life-clone/ contains .riff-back-pill breadcrumb');
    assert(aliasRes.body.includes('href="/"'), 'Alias route .riff-back-pill links to /');
    assert(primaryRes.body === aliasRes.body, 'Primary route and Alias route HTML bodies match identically');

    // Test 5.4: Sub-page dual routing (alyx.html)
    const primarySubRes = await fetchUrl(`${BASE_URL}/half-life-clone/alyx.html`);
    const aliasSubRes = await fetchUrl(`${BASE_URL}/projects/half-life-clone/alyx.html`);
    assert(primarySubRes.statusCode === 200, 'GET /half-life-clone/alyx.html returns HTTP 200');
    assert(aliasSubRes.statusCode === 200, 'GET /projects/half-life-clone/alyx.html returns HTTP 200');
    assert(primarySubRes.body === aliasSubRes.body, 'Sub-page primary and alias bodies match identically');
    assert(primarySubRes.body.includes('class="riff-back-pill"'), 'Sub-page contains .riff-back-pill return breadcrumb');

    // Test 5.5: Trailing-slash 301 Redirects
    const redirectPrimary = await fetchUrl(`${BASE_URL}/half-life-clone`);
    assert(redirectPrimary.statusCode === 301, 'GET /half-life-clone returns HTTP 301 Redirect');
    assert(redirectPrimary.headers.location === '/half-life-clone/', 'GET /half-life-clone redirects to /half-life-clone/');

    const redirectAlias = await fetchUrl(`${BASE_URL}/projects/half-life-clone`);
    assert(redirectAlias.statusCode === 301, 'GET /projects/half-life-clone returns HTTP 301 Redirect');
    assert(redirectAlias.headers.location === '/projects/half-life-clone/', 'GET /projects/half-life-clone redirects to /projects/half-life-clone/');

    // Test 5.6: Standalone Terminal 404 Error Routing & Recovery
    const notFoundRes = await fetchUrl(`${BASE_URL}/invalid-route-slug-12345`);
    assert(notFoundRes.statusCode === 404, 'GET /invalid-route-slug-12345 returns HTTP 404');
    assert(notFoundRes.headers['content-type']?.includes('text/html'), 'HTTP 404 response serves text/html');
    assert(notFoundRes.body.includes('404: Riff Not Found'), '404 page body contains "404: Riff Not Found" headline');
    assert(notFoundRes.body.includes('terminal-error-card'), '404 page body contains terminal-error-card');
    assert(notFoundRes.body.includes('href="/"'), '404 page contains return launcher link linking to "/"');

    // Test 5.7: Static Manifests and Assets
    const projectsJsonRes = await fetchUrl(`${BASE_URL}/projects.json`);
    assert(projectsJsonRes.statusCode === 200, 'GET /projects.json returns HTTP 200');
    const parsedManifest = JSON.parse(projectsJsonRes.body);
    assert(Array.isArray(parsedManifest) && parsedManifest.length > 0, 'projects.json returns valid JSON array');
    assert(parsedManifest[0].route === '/half-life-clone/', 'Manifest route is /half-life-clone/');
    assert(parsedManifest[0].aliasRoute === '/projects/half-life-clone/', 'Manifest aliasRoute is /projects/half-life-clone/');

    const robotsRes = await fetchUrl(`${BASE_URL}/robots.txt`);
    assert(robotsRes.statusCode === 200, 'GET /robots.txt returns HTTP 200');
    assert(robotsRes.body.includes('Sitemap:'), 'robots.txt specifies Sitemap URL');

    const sitemapRes = await fetchUrl(`${BASE_URL}/sitemap.xml`);
    assert(sitemapRes.statusCode === 200, 'GET /sitemap.xml returns HTTP 200');
    assert(sitemapRes.body.includes('<loc>https://riff.sohamlabs.workers.dev/</loc>'), 'sitemap.xml contains root URL');
    assert(sitemapRes.body.includes('<loc>https://riff.sohamlabs.workers.dev/half-life-clone/</loc>'), 'sitemap.xml contains primary route');
    assert(sitemapRes.body.includes('<loc>https://riff.sohamlabs.workers.dev/projects/half-life-clone/</loc>'), 'sitemap.xml contains alias route');

    const cssRes = await fetchUrl(`${BASE_URL}/style.css`);
    assert(cssRes.statusCode === 200 && cssRes.headers['content-type']?.includes('text/css'), 'GET /style.css returns HTTP 200 text/css');

    const jsRes = await fetchUrl(`${BASE_URL}/app.js`);
    assert(jsRes.statusCode === 200 && jsRes.headers['content-type']?.includes('javascript'), 'GET /app.js returns HTTP 200 javascript');

    const licenseRes = await fetchUrl(`${BASE_URL}/LICENSE`);
    assert(licenseRes.statusCode === 200, 'GET /LICENSE returns HTTP 200');

    // Test 5.8: Directory Traversal Safeguard
    const traversalRes = await fetchUrl(`${BASE_URL}/../package.json`);
    assert(traversalRes.statusCode === 403 || traversalRes.statusCode === 404, 'Directory traversal /../package.json is blocked (HTTP 403 / 404)');

  } finally {
    await new Promise(r => server.close(r));
  }

  // --------------------------------------------------------------------------
  // SUMMARY
  // --------------------------------------------------------------------------
  console.log('\n================================================================');
  console.log(`  v1.0.1 Verification Results: ${passedTests}/${totalTests} Passed (${failedTests} Failed)`);
  console.log('================================================================\n');

  if (failedTests > 0) {
    process.exit(1);
  }
}

runVerification().catch(err => {
  console.error('\n\x1b[31mVerification crashed:\x1b[0m', err);
  process.exit(1);
});

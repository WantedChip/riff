/**
 * Half-Life Franchise Website - i18n Engine & Persistence Challenger Test Suite
 * Task: Empirically test and challenge js/i18n.js for Milestone 1.
 */

const fs = require('fs');
const path = require('path');
const harness = require('./utils/test_harness');
const { describe, it, assert, assertEqual, assertTrue, assertFalse, assertIncludes } = harness;

// ============================================================================
// Mock Browser Environment Generator
// ============================================================================

function createMockDOM() {
  const listeners = {
    window: {},
    document: {}
  };

  const storageMap = new Map();
  const localStorageMock = {
    getItem: (key) => storageMap.has(key) ? storageMap.get(key) : null,
    setItem: (key, val) => storageMap.set(key, String(val)),
    removeItem: (key) => storageMap.delete(key),
    clear: () => storageMap.clear(),
    _map: storageMap
  };

  class MockElement {
    constructor(tagName = 'DIV', attributes = {}) {
      this.tagName = tagName.toUpperCase();
      this.attributes = {};
      this.classListObj = new Set();
      this.textContent = '';
      this.value = '';
      this.parentNode = null;
      this.children = [];

      for (const [k, v] of Object.entries(attributes)) {
        this.setAttribute(k, v);
      }
    }

    getAttribute(attr) {
      const lower = attr.toLowerCase();
      return Object.prototype.hasOwnProperty.call(this.attributes, lower) ? this.attributes[lower] : null;
    }

    setAttribute(attr, val) {
      const lower = attr.toLowerCase();
      this.attributes[lower] = String(val);
      if (lower === 'class') {
        this.classListObj = new Set(String(val).trim().split(/\s+/).filter(Boolean));
      }
    }

    removeAttribute(attr) {
      delete this.attributes[attr.toLowerCase()];
      if (attr.toLowerCase() === 'class') {
        this.classListObj.clear();
      }
    }

    get classList() {
      const self = this;
      return {
        add(...classes) {
          classes.forEach(c => self.classListObj.add(c));
          self.attributes['class'] = Array.from(self.classListObj).join(' ');
        },
        remove(...classes) {
          classes.forEach(c => self.classListObj.delete(c));
          self.attributes['class'] = Array.from(self.classListObj).join(' ');
        },
        contains(cls) {
          return self.classListObj.has(cls);
        },
        toggle(cls) {
          if (this.contains(cls)) {
            this.remove(cls);
            return false;
          } else {
            this.add(cls);
            return true;
          }
        }
      };
    }

    closest(selector) {
      let curr = this;
      while (curr) {
        if (selector.startsWith('[') && selector.endsWith(']')) {
          const attr = selector.slice(1, -1);
          if (curr.getAttribute(attr) !== null) return curr;
        }
        curr = curr.parentNode;
      }
      return null;
    }
  }

  const documentElements = [];

  const documentMock = {
    readyState: 'complete',
    documentElement: new MockElement('HTML'),
    elements: documentElements,
    createElement: (tag) => new MockElement(tag),
    querySelectorAll: (selector) => {
      if (selector === '[data-i18n]') {
        return documentElements.filter(e => e.getAttribute('data-i18n') !== null);
      }
      if (selector === '[data-i18n-attr]') {
        return documentElements.filter(e => e.getAttribute('data-i18n-attr') !== null);
      }
      if (selector === '.js-current-lang-code, .current-lang-label') {
        return documentElements.filter(e => 
          e.classList.contains('js-current-lang-code') || e.classList.contains('current-lang-label')
        );
      }
      if (selector === '.js-current-lang-name') {
        return documentElements.filter(e => e.classList.contains('js-current-lang-name'));
      }
      if (selector === '[data-lang], .lang-option') {
        return documentElements.filter(e => 
          e.getAttribute('data-lang') !== null || e.classList.contains('lang-option')
        );
      }
      return [];
    },
    addEventListener: (event, handler) => {
      if (!listeners.document[event]) listeners.document[event] = [];
      listeners.document[event].push(handler);
    },
    removeEventListener: (event, handler) => {
      if (listeners.document[event]) {
        listeners.document[event] = listeners.document[event].filter(h => h !== handler);
      }
    },
    dispatchEvent: (evt) => {
      const handlers = listeners.document[evt.type] || [];
      handlers.forEach(fn => fn(evt));
      return true;
    }
  };

  const windowMock = {
    location: { search: '' },
    addEventListener: (event, handler) => {
      if (!listeners.window[event]) listeners.window[event] = [];
      listeners.window[event].push(handler);
    },
    removeEventListener: (event, handler) => {
      if (listeners.window[event]) {
        listeners.window[event] = listeners.window[event].filter(h => h !== handler);
      }
    },
    dispatchEvent: (evt) => {
      const handlers = listeners.window[evt.type] || [];
      handlers.forEach(fn => fn(evt));
      return true;
    }
  };

  const navigatorMock = {
    language: 'en-US'
  };

  class CustomEventMock {
    constructor(type, eventInitDict = {}) {
      this.type = type;
      this.detail = eventInitDict.detail || null;
    }
  }

  return {
    windowMock,
    documentMock,
    localStorageMock,
    navigatorMock,
    CustomEventMock,
    MockElement,
    documentElements,
    listeners
  };
}

// Global setup helper
function setupEnvironment(env) {
  global.window = env.windowMock;
  global.document = env.documentMock;
  global.localStorage = env.localStorageMock;
  Object.defineProperty(global, 'navigator', {
    value: env.navigatorMock,
    configurable: true,
    writable: true
  });
  global.CustomEvent = env.CustomEventMock;
}

// Utility to recursively extract all key paths from an object
function getAllKeys(obj, prefix = '') {
  let keys = [];
  for (const k in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, k)) {
      const pathKey = prefix ? `${prefix}.${k}` : k;
      if (typeof obj[k] === 'object' && obj[k] !== null && !Array.isArray(obj[k])) {
        keys = keys.concat(getAllKeys(obj[k], pathKey));
      } else {
        keys.push(pathKey);
      }
    }
  }
  return keys;
}

// Helper to get nested value
function getNestedValue(obj, pathStr) {
  if (!obj || !pathStr) return undefined;
  return pathStr.split('.').reduce((prev, curr) => (prev && prev[curr] !== undefined ? prev[curr] : undefined), obj);
}

// Load fresh instance of i18n module
function loadI18nModule() {
  const i18nPath = path.resolve(__dirname, '../js/i18n.js');
  delete require.cache[require.resolve(i18nPath)];
  return require(i18nPath);
}

// ============================================================================
// CHALLENGER TEST SUITES
// ============================================================================

describe('i18n Engine - Dictionary Key Completeness & Zero-Missing Key Verification', 'Tier 1', () => {
  it('Verify dictionary contains all 6 required languages: en, fr, de, es, ja, zh', () => {
    const env = createMockDOM();
    setupEnvironment(env);
    const HL_i18n = loadI18nModule();

    const expectedLangs = ['en', 'fr', 'de', 'es', 'ja', 'zh'];
    assertEqual(HL_i18n.supportedLangs.length, 6, 'Supported languages count must be 6');
    for (const lang of expectedLangs) {
      assertTrue(HL_i18n.supportedLangs.includes(lang), `supportedLangs must include "${lang}"`);
      assertTrue(Boolean(HL_i18n.dictionary[lang]), `dictionary must have entry for "${lang}"`);
    }
  });

  it('Assert 0 missing keys across all 6 languages compared to English master schema', () => {
    const env = createMockDOM();
    setupEnvironment(env);
    const HL_i18n = loadI18nModule();

    const masterKeys = getAllKeys(HL_i18n.dictionary.en);
    assertTrue(masterKeys.length > 0, 'English dictionary must contain keys');

    const langs = ['en', 'fr', 'de', 'es', 'ja', 'zh'];
    const missingReport = {};

    for (const lang of langs) {
      const missingKeys = [];
      const langDict = HL_i18n.dictionary[lang];
      for (const key of masterKeys) {
        const val = getNestedValue(langDict, key);
        if (val === undefined || val === '') {
          missingKeys.push(key);
        }
      }
      if (missingKeys.length > 0) {
        missingReport[lang] = missingKeys;
      }
    }

    const hasMissing = Object.keys(missingReport).length > 0;
    if (hasMissing) {
      throw new Error(`Missing or empty translation keys detected: ${JSON.stringify(missingReport, null, 2)}`);
    }
    assertEqual(hasMissing, false, 'There must be 0 missing keys across all 6 languages');
  });

  it('Assert no extra or orphaned keys in target languages that do not exist in English', () => {
    const env = createMockDOM();
    setupEnvironment(env);
    const HL_i18n = loadI18nModule();

    const masterKeySet = new Set(getAllKeys(HL_i18n.dictionary.en));
    const langs = ['fr', 'de', 'es', 'ja', 'zh'];
    const orphanedReport = {};

    for (const lang of langs) {
      const langKeys = getAllKeys(HL_i18n.dictionary[lang]);
      const orphans = langKeys.filter(k => !masterKeySet.has(k));
      if (orphans.length > 0) {
        orphanedReport[lang] = orphans;
      }
    }

    assertEqual(Object.keys(orphanedReport).length, 0, `No orphaned keys expected: ${JSON.stringify(orphanedReport)}`);
  });
});

describe('i18n Engine - Language Switching & Storage Persistence', 'Tier 1', () => {
  it('Set language across all 6 codes and verify localStorage & getLanguage() update', () => {
    const env = createMockDOM();
    setupEnvironment(env);
    const HL_i18n = loadI18nModule();

    const languagesToTest = ['fr', 'de', 'es', 'ja', 'zh', 'en'];

    for (const lang of languagesToTest) {
      HL_i18n.setLanguage(lang);
      assertEqual(HL_i18n.getLanguage(), lang, `getLanguage() must equal "${lang}"`);
      assertEqual(env.localStorageMock.getItem('hl_lang'), lang, `localStorage 'hl_lang' must equal "${lang}"`);
      assertEqual(env.documentMock.documentElement.getAttribute('lang'), lang, `<html lang="..."> must equal "${lang}"`);
    }
  });

  it('Handle whitespace and case normalization in setLanguage()', () => {
    const env = createMockDOM();
    setupEnvironment(env);
    const HL_i18n = loadI18nModule();

    HL_i18n.setLanguage('  JA  ');
    assertEqual(HL_i18n.getLanguage(), 'ja', 'Should normalize uppercase and whitespace to "ja"');
    assertEqual(env.localStorageMock.getItem('hl_lang'), 'ja', 'localStorage should store normalized "ja"');

    HL_i18n.setLanguage('DE');
    assertEqual(HL_i18n.getLanguage(), 'de', 'Should normalize uppercase "DE" to "de"');
  });
});

describe('i18n Engine - Edge Case & Invalid Code Handling', 'Tier 2', () => {
  it('Reject unsupported language codes without changing state or throwing uncaught errors', () => {
    const env = createMockDOM();
    setupEnvironment(env);
    const HL_i18n = loadI18nModule();

    HL_i18n.setLanguage('en');
    assertEqual(HL_i18n.getLanguage(), 'en');

    // Attempt invalid language codes
    const invalidCodes = ['invalid', '123', 'klingon', 'fr_FR', 'zh-CN', '', null, undefined];
    for (const invalidCode of invalidCodes) {
      HL_i18n.setLanguage(invalidCode);
      assertEqual(HL_i18n.getLanguage(), 'en', `Active language should remain "en" when given invalid code: ${invalidCode}`);
      assertEqual(env.localStorageMock.getItem('hl_lang'), 'en', `localStorage should remain "en" when given invalid code: ${invalidCode}`);
    }
  });

  it('Gracefully handle localStorage write errors (QuotaExceeded / SecurityError)', () => {
    const env = createMockDOM();
    setupEnvironment(env);

    // Mock localStorage throwing error on setItem
    env.localStorageMock.setItem = () => {
      throw new Error('QuotaExceededError: DOMException');
    };

    const HL_i18n = loadI18nModule();

    // setLanguage should not throw, but update memory state and DOM
    HL_i18n.setLanguage('fr');
    assertEqual(HL_i18n.getLanguage(), 'fr', 'Memory state must update to "fr" even if localStorage fails');
    assertEqual(env.documentMock.documentElement.getAttribute('lang'), 'fr', '<html lang="..."> must update');
  });

  it('Missing translation key fallback to English master and string key', () => {
    const env = createMockDOM();
    setupEnvironment(env);
    const HL_i18n = loadI18nModule();

    HL_i18n.setLanguage('fr');

    // Key existing in English but missing in target (simulated)
    HL_i18n.dictionary.en.test_unique_key = 'Master English Value';
    assertEqual(HL_i18n.t('test_unique_key'), 'Master English Value', 'Should fallback to English if missing in French');

    // Key missing in all dictionaries
    assertEqual(HL_i18n.t('completely.nonexistent.key'), 'completely.nonexistent.key', 'Should return raw key string if missing everywhere');
  });
});

describe('i18n Engine - Automatic Language Detection Hierarchy', 'Tier 2', () => {
  it('Priority 1: Detect from URL query parameter ?lang=code', () => {
    const env = createMockDOM();
    env.windowMock.location.search = '?lang=ja&ref=nav';
    setupEnvironment(env);
    const HL_i18n = loadI18nModule();

    HL_i18n.init();
    assertEqual(HL_i18n.getLanguage(), 'ja', 'Should pick up "ja" from URL search query parameter');
    assertEqual(env.localStorageMock.getItem('hl_lang'), 'ja', 'Should persist URL lang to localStorage');
  });

  it('Priority 2: Detect from localStorage when URL has no lang parameter', () => {
    const env = createMockDOM();
    env.windowMock.location.search = '';
    env.localStorageMock.setItem('hl_lang', 'es');
    setupEnvironment(env);
    const HL_i18n = loadI18nModule();

    HL_i18n.init();
    assertEqual(HL_i18n.getLanguage(), 'es', 'Should load "es" from localStorage');
  });

  it('Priority 3: Detect from navigator.language when URL and localStorage are absent', () => {
    const env = createMockDOM();
    env.windowMock.location.search = '';
    env.localStorageMock.clear();
    env.navigatorMock.language = 'de-DE';
    setupEnvironment(env);
    const HL_i18n = loadI18nModule();

    HL_i18n.init();
    assertEqual(HL_i18n.getLanguage(), 'de', 'Should detect "de" from navigator.language "de-DE"');
  });

  it('Priority 4: Fallback to default "en" when all detectors return unsupported value', () => {
    const env = createMockDOM();
    env.windowMock.location.search = '?lang=invalid';
    env.localStorageMock.clear();
    env.navigatorMock.language = 'xx-YY';
    setupEnvironment(env);
    const HL_i18n = loadI18nModule();

    HL_i18n.init();
    assertEqual(HL_i18n.getLanguage(), 'en', 'Should fallback to default "en"');
  });
});

describe('i18n Engine - DOM Translation & Attribute Binding (updateDOM)', 'Tier 3', () => {
  it('Translate text content elements with [data-i18n] across all 6 languages', () => {
    const env = createMockDOM();
    setupEnvironment(env);

    const navHome = new env.MockElement('A', { 'data-i18n': 'nav.home' });
    const heroHeadline = new env.MockElement('H1', { 'data-i18n': 'hero.headline' });
    const catalogTitle = new env.MockElement('H2', { 'data-i18n': 'catalog.title' });
    env.documentElements.push(navHome, heroHeadline, catalogTitle);

    const HL_i18n = loadI18nModule();

    const langs = ['en', 'fr', 'de', 'es', 'ja', 'zh'];
    for (const lang of langs) {
      HL_i18n.setLanguage(lang);

      assertEqual(navHome.textContent, HL_i18n.dictionary[lang].nav.home, `[nav.home] text content for ${lang}`);
      assertEqual(heroHeadline.textContent, HL_i18n.dictionary[lang].hero.headline, `[hero.headline] text content for ${lang}`);
      assertEqual(catalogTitle.textContent, HL_i18n.dictionary[lang].catalog.title, `[catalog.title] text content for ${lang}`);
    }
  });

  it('Update input element value when [data-i18n] is present on INPUT or TEXTAREA', () => {
    const env = createMockDOM();
    setupEnvironment(env);

    const searchInput = new env.MockElement('INPUT', { 'data-i18n': 'ui.select_language' });
    env.documentElements.push(searchInput);

    const HL_i18n = loadI18nModule();
    HL_i18n.setLanguage('ja');

    assertEqual(searchInput.value, HL_i18n.dictionary.ja.ui.select_language, 'Input value must be updated to translated string');
  });

  it('Translate attribute bindings with [data-i18n-attr="attr1:key1,attr2:key2"]', () => {
    const env = createMockDOM();
    setupEnvironment(env);

    const searchInput = new env.MockElement('INPUT', {
      'data-i18n-attr': 'placeholder:ui.select_language, title:nav.home'
    });
    env.documentElements.push(searchInput);

    const HL_i18n = loadI18nModule();
    HL_i18n.setLanguage('de');

    assertEqual(searchInput.getAttribute('placeholder'), HL_i18n.dictionary.de.ui.select_language, 'Placeholder attribute should be translated to German');
    assertEqual(searchInput.getAttribute('title'), HL_i18n.dictionary.de.nav.home, 'Title attribute should be translated to German');
  });

  it('Synchronize language switcher UI indicators (.js-current-lang-code, .js-current-lang-name, option active state)', () => {
    const env = createMockDOM();
    setupEnvironment(env);

    const codeLabel = new env.MockElement('SPAN', { class: 'js-current-lang-code' });
    const nameLabel = new env.MockElement('SPAN', { class: 'js-current-lang-name' });
    const optEn = new env.MockElement('BUTTON', { 'data-lang': 'en', class: 'lang-option' });
    const optJa = new env.MockElement('BUTTON', { 'data-lang': 'ja', class: 'lang-option' });
    const optFr = new env.MockElement('BUTTON', { 'data-lang': 'fr', class: 'lang-option' });

    env.documentElements.push(codeLabel, nameLabel, optEn, optJa, optFr);

    const HL_i18n = loadI18nModule();
    HL_i18n.setLanguage('ja');

    assertEqual(codeLabel.textContent, 'JA', 'Current lang code label should display uppercase "JA"');
    assertEqual(nameLabel.textContent, '日本語', 'Current lang name label should display "日本語"');

    assertTrue(optJa.classList.contains('is-active'), 'JA option must have "is-active" class');
    assertTrue(optJa.classList.contains('active'), 'JA option must have "active" class');
    assertTrue(optJa.classList.contains('is-selected'), 'JA option must have "is-selected" class');
    assertEqual(optJa.getAttribute('aria-selected'), 'true', 'JA option aria-selected must be true');

    assertFalse(optEn.classList.contains('is-active'), 'EN option must NOT have "is-active" class');
    assertEqual(optEn.getAttribute('aria-selected'), 'false', 'EN option aria-selected must be false');
  });
});

describe('i18n Engine - Custom Event Dispatching & Click Bindings', 'Tier 4', () => {
  it('Dispatch hl:langchange and hl-language-changed on window and document on setLanguage', () => {
    const env = createMockDOM();
    setupEnvironment(env);

    let windowEventFired1 = false;
    let windowEventFired2 = false;
    let docEventFired1 = false;
    let docEventFired2 = false;

    env.windowMock.addEventListener('hl:langchange', (e) => {
      windowEventFired1 = true;
      assertEqual(e.detail.lang, 'es', 'Window event detail.lang must be "es"');
    });

    env.windowMock.addEventListener('hl-language-changed', (e) => {
      windowEventFired2 = true;
      assertEqual(e.detail.lang, 'es', 'Window event detail.lang must be "es"');
    });

    env.documentMock.addEventListener('hl:langchange', (e) => {
      docEventFired1 = true;
      assertEqual(e.detail.lang, 'es', 'Document event detail.lang must be "es"');
    });

    env.documentMock.addEventListener('hl-language-changed', (e) => {
      docEventFired2 = true;
      assertEqual(e.detail.lang, 'es', 'Document event detail.lang must be "es"');
    });

    const HL_i18n = loadI18nModule();
    HL_i18n.setLanguage('es');

    assertTrue(windowEventFired1, 'Window hl:langchange listener must fire');
    assertTrue(windowEventFired2, 'Window hl-language-changed listener must fire');
    assertTrue(docEventFired1, 'Document hl:langchange listener must fire');
    assertTrue(docEventFired2, 'Document hl-language-changed listener must fire');
  });

  it('Bind click delegated event listener to [data-lang] options', () => {
    const env = createMockDOM();
    setupEnvironment(env);

    const HL_i18n = loadI18nModule();
    HL_i18n.bindEvents();

    // Verify click listener registered on document
    const clickListeners = env.listeners.document['click'] || [];
    assertTrue(clickListeners.length > 0, 'Click listener must be registered on document');

    // Simulate clicking on a language option button
    const optFr = new env.MockElement('BUTTON', { 'data-lang': 'fr' });
    let defaultPrevented = false;
    const mockClickEvent = {
      target: optFr,
      preventDefault: () => { defaultPrevented = true; }
    };

    clickListeners[0](mockClickEvent);

    assertEqual(HL_i18n.getLanguage(), 'fr', 'Clicking [data-lang="fr"] must set active language to "fr"');
    assertTrue(defaultPrevented, 'Event preventDefault should be called on language option click');
  });
});

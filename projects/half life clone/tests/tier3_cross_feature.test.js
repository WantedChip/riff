/**
 * Tier 3: Cross-Feature Combination Test Suite
 * Project: Half-Life Franchise Website
 * 
 * Tests pairwise and multi-feature interaction contracts across:
 * - i18n + Navigation (language persistence across route shifts)
 * - i18n + Catalog Cards (multi-language string coverage in catalog grid)
 * - Design System + Responsive (0px border-radius & token compliance across breakpoints)
 * - Hero CTAs + Route Navigation (CTA link targets match dedicated sub-routes)
 * - Header Nav + Active Route State (active route indicator per page)
 */

const vm = require('vm');
const {
  fetchPage,
  parseHTML,
  assert,
  assertEqual,
  assertNotEqual,
  assertIncludes,
  assertMatch,
  assertTrue,
  assertFalse,
  describe,
  it
} = require('./utils/test_harness');

// Helper to run js/i18n.js in VM environment
async function loadI18nEngine(initialLang = 'en', urlLang = null) {
  const i18nCode = await fetchPage('js/i18n.js');
  const storage = { hl_lang: initialLang };

  const mockDocument = {
    lang: initialLang,
    documentElement: {
      setAttribute: (k, v) => { if (k === 'lang') mockDocument.lang = v; },
      getAttribute: (k) => (k === 'lang' ? mockDocument.lang : null)
    },
    querySelectorAll: () => [],
    addEventListener: () => {},
    dispatchEvent: () => {}
  };

  const mockWindow = {
    location: { search: urlLang ? `?lang=${urlLang}` : '' },
    localStorage: {
      getItem: (k) => storage[k] || null,
      setItem: (k, v) => { storage[k] = String(v); },
      removeItem: (k) => { delete storage[k]; }
    },
    document: mockDocument,
    navigator: { language: 'en-US' },
    addEventListener: () => {},
    dispatchEvent: () => {},
    CustomEvent: function (name, opts) { this.name = name; this.opts = opts; }
  };
  mockWindow.window = mockWindow;

  const context = vm.createContext(mockWindow);
  vm.runInContext(i18nCode, context);

  return { i18n: mockWindow.HL_i18n, storage, mockDocument, mockWindow };
}

// ----------------------------------------------------------------------------
// 1. i18n + Navigation Integration
// ----------------------------------------------------------------------------
describe('Tier 3 - i18n & Navigation Integration', 'Tier 3', () => {
  it('T3-1.1: Switching language on index.html updates active language state and html lang attribute', async () => {
    const { i18n, mockDocument } = await loadI18nEngine('en');
    assertEqual(i18n.currentLang, 'en', 'Initial language should be English');
    
    i18n.setLanguage('fr');
    assertEqual(i18n.currentLang, 'fr', 'Language should update to French (fr)');
    assertEqual(mockDocument.documentElement.getAttribute('lang'), 'fr', '<html lang> attribute should update to fr');
  });

  it('T3-1.2: Persistent language state persists in localStorage across all sub-route navigation targets', async () => {
    const { i18n, storage } = await loadI18nEngine('en');
    i18n.setLanguage('de');
    assertEqual(storage['hl_lang'], 'de', 'localStorage hl_lang should be updated to de');

    const subRoutes = ['alyx.html', 'halflife.html', 'halflife2.html', 'episode1.html', 'episode2.html'];
    for (const route of subRoutes) {
      const pageHtml = await fetchPage(route);
      const doc = parseHTML(pageHtml);
      assertTrue(doc !== null, `Sub-route page ${route} should parse successfully`);
      const env = await loadI18nEngine(storage['hl_lang']);
      assertEqual(env.i18n.getLanguage(), 'de', `Language state on ${route} should persist as German (de)`);
    }
  });

  it('T3-1.3: Sub-route HTML pages contain data-i18n attributes for dynamic translation rendering', async () => {
    const pages = ['alyx.html', 'halflife.html', 'halflife2.html', 'episode1.html', 'episode2.html'];
    for (const pageFile of pages) {
      const html = await fetchPage(pageFile);
      const doc = parseHTML(html);
      const i18nElems = doc.querySelectorAll('[data-i18n]');
      assertTrue(i18nElems.length > 0, `Page ${pageFile} should contain at least 1 element with data-i18n attribute`);
    }
  });

  it('T3-1.4: URL query parameter ?lang=code overrides stored language on load for all sub-routes', async () => {
    const { i18n, storage } = await loadI18nEngine('fr', 'es');
    assertEqual(i18n.currentLang, 'es', 'URL parameter ?lang=es should override stored language fr');
    assertEqual(storage['hl_lang'], 'es', 'localStorage should be updated to match URL parameter es');
  });
});

// ----------------------------------------------------------------------------
// 2. i18n + Catalog Cards Integration
// ----------------------------------------------------------------------------
describe('Tier 3 - i18n & Catalog Cards Integration', 'Tier 3', () => {
  it('T3-2.1: Catalog card titles exist in dictionary for all 6 supported languages', async () => {
    const { i18n } = await loadI18nEngine('en');
    const langs = ['en', 'fr', 'de', 'es', 'ja', 'zh'];
    const keys = ['catalog.hl1_title', 'catalog.hl2_title', 'catalog.ep1_title', 'catalog.ep2_title'];

    for (const lang of langs) {
      i18n.setLanguage(lang);
      for (const key of keys) {
        const translation = i18n.t(key);
        assertNotEqual(translation, key, `Translation for ${key} in ${lang} should not equal raw key`);
        assertTrue(typeof translation === 'string' && translation.length > 0, `Translation for ${key} in ${lang} should be a non-empty string`);
      }
    }
  });

  it('T3-2.2: Catalog card release tags exist in dictionary for all 6 supported languages', async () => {
    const { i18n } = await loadI18nEngine('en');
    const langs = ['en', 'fr', 'de', 'es', 'ja', 'zh'];
    const keys = ['catalog.hl1_tag', 'catalog.hl2_tag', 'catalog.ep1_tag', 'catalog.ep2_tag'];

    for (const lang of langs) {
      i18n.setLanguage(lang);
      for (const key of keys) {
        const translation = i18n.t(key);
        assertNotEqual(translation, key, `Tag translation for ${key} in ${lang} should be valid`);
        assertTrue(translation.length > 0, `Tag ${key} in ${lang} must not be empty`);
      }
    }
  });

  it('T3-2.3: Catalog card descriptions exist in dictionary for all 6 supported languages', async () => {
    const { i18n } = await loadI18nEngine('en');
    const langs = ['en', 'fr', 'de', 'es', 'ja', 'zh'];
    const keys = ['catalog.hl1_desc', 'catalog.hl2_desc', 'catalog.ep1_desc', 'catalog.ep2_desc'];

    for (const lang of langs) {
      i18n.setLanguage(lang);
      for (const key of keys) {
        const translation = i18n.t(key);
        assertNotEqual(translation, key, `Description translation for ${key} in ${lang} should be defined`);
        assertTrue(translation.length > 5, `Description for ${key} in ${lang} should be substantial text`);
      }
    }
  });

  it('T3-2.4: index.html catalog card elements specify data-i18n attributes mapping to catalog keys', async () => {
    const html = await fetchPage('index.html');
    const doc = parseHTML(html);

    const catalogKeys = ['catalog.hl1_title', 'catalog.hl2_title', 'catalog.ep1_title', 'catalog.ep2_title'];
    let matchedCount = 0;

    const elemList = doc.querySelectorAll('[data-i18n]');
    for (const elem of elemList) {
      const attr = elem.getAttribute('data-i18n');
      if (catalogKeys.includes(attr)) {
        matchedCount++;
      }
    }

    assertTrue(matchedCount >= 4, `index.html should have data-i18n attributes for all 4 catalog cards (found ${matchedCount})`);
  });
});

// ----------------------------------------------------------------------------
// 3. Design System + Responsive Layout Integration
// ----------------------------------------------------------------------------
describe('Tier 3 - Design System & Responsive Layout Integration', 'Tier 3', () => {
  it('T3-3.1: css/design-system.css enforces strict 0px border-radius reset on global elements', async () => {
    const css = await fetchPage('css/design-system.css');
    assertIncludes(css, 'border-radius', 'design-system.css must declare border-radius reset');
    assertMatch(css, /border-radius:\s*0/i, 'design-system.css must explicitly specify 0px border radius');
  });

  it('T3-3.2: CSS design tokens specify canvas, primary text, accent orange, and rust brown colors', async () => {
    const css = await fetchPage('css/design-system.css');
    assertMatch(css, /--color-canvas:\s*#E9E8E9/i, 'Canvas token must be #E9E8E9');
    assertMatch(css, /--color-text-primary:\s*#000000/i, 'Text primary token must be #000000');
    assertMatch(css, /--color-accent-orange:\s*#FF862C/i, 'Accent orange token must be #FF862C');
    assertMatch(css, /--color-brand-rust:\s*#4B423C/i, 'Brand rust token must be #4B423C');
  });

  it('T3-3.3: css/components.css specifies responsive media queries for mobile and tablet viewports', async () => {
    const css = await fetchPage('css/components.css');
    assertIncludes(css, '@media', 'components.css must contain media queries for responsive design');
    assertMatch(css, /max-width:\s*(?:767|768|1023|1024)px/i, 'components.css must define standard breakpoint queries');
  });

  it('T3-3.4: Catalog cards, hero containers, and image frames enforce strict 0px radius across components', async () => {
    const cssComp = await fetchPage('css/components.css');
    const cssDS = await fetchPage('css/design-system.css');
    const combinedCSS = cssDS + '\n' + cssComp;

    assertMatch(combinedCSS, /border-radius:\s*0/i, 'Combined CSS must enforce 0px border-radius');
    assertMatch(combinedCSS, /box-shadow:\s*none/i, 'Combined CSS must remove soft blur box-shadows');
  });
});

// ----------------------------------------------------------------------------
// 4. Hero CTAs + Route Navigation Integration
// ----------------------------------------------------------------------------
describe('Tier 3 - Hero CTAs & Route Navigation Integration', 'Tier 3', () => {
  it('T3-4.1: Hero section primary CTA links on index.html point to dedicated alyx.html route', async () => {
    const html = await fetchPage('index.html');
    const doc = parseHTML(html);
    const heroCtas = doc.querySelectorAll('a[href*="alyx"]');
    assertTrue(heroCtas.length > 0, 'index.html hero section should contain at least 1 CTA link pointing to alyx.html');
  });

  it('T3-4.2: Game catalog card links match all dedicated sub-route HTML files', async () => {
    const html = await fetchPage('index.html');
    const doc = parseHTML(html);
    const links = doc.querySelectorAll('a[href]');
    const hrefs = links.map(l => l.getAttribute('href'));

    const expectedRoutes = ['alyx.html', 'halflife.html', 'halflife2.html', 'episode1.html', 'episode2.html'];
    for (const route of expectedRoutes) {
      const match = hrefs.some(h => h && h.includes(route));
      assertTrue(match, `index.html catalog should contain a deep link to ${route}`);
    }
  });

  it('T3-4.3: Sub-route back navigation links point to index.html', async () => {
    const pages = ['alyx.html', 'halflife.html', 'halflife2.html', 'episode1.html', 'episode2.html'];
    for (const pageFile of pages) {
      const html = await fetchPage(pageFile);
      const doc = parseHTML(html);
      const backLinks = doc.querySelectorAll('a[href*="index.html"]');
      assertTrue(backLinks.length > 0, `Sub-route ${pageFile} must contain a back-navigation link pointing to index.html`);
    }
  });
});

// ----------------------------------------------------------------------------
// 5. Header Nav + Active Route State Integration
// ----------------------------------------------------------------------------
describe('Tier 3 - Header Nav & Active Route State Integration', 'Tier 3', () => {
  it('T3-5.1: Header navigation bar on index.html contains links to all dedicated sub-routes', async () => {
    const html = await fetchPage('index.html');
    const doc = parseHTML(html);
    const navLinks = doc.querySelectorAll('.nav-link, nav a');
    assertTrue(navLinks.length >= 5, 'Header nav must contain links for primary routes');

    const hrefs = navLinks.map(l => l.getAttribute('href'));
    const routes = ['index.html', 'alyx.html', 'halflife.html', 'halflife2.html', 'episode1.html', 'episode2.html'];
    let matches = 0;
    for (const r of routes) {
      if (hrefs.some(h => h && h.includes(r))) matches++;
    }
    assertTrue(matches >= 5, `Header nav should reference at least 5 sub-routes (found ${matches})`);
  });

  it('T3-5.2: Active route class is correctly applied to matching nav element per sub-route page', async () => {
    const routeMap = [
      { page: 'index.html', target: 'index' },
      { page: 'alyx.html', target: 'alyx' },
      { page: 'halflife.html', target: 'halflife' },
      { page: 'halflife2.html', target: 'halflife2' },
      { page: 'episode1.html', target: 'episode1' },
      { page: 'episode2.html', target: 'episode2' }
    ];

    for (const item of routeMap) {
      const html = await fetchPage(item.page);
      const doc = parseHTML(html);
      const activeLink = doc.querySelector('.nav-link.active, nav a.active, .is-active');
      assertTrue(activeLink !== null, `Page ${item.page} should have an active navigation link marked with class 'active'`);
      const href = activeLink.getAttribute('href') || '';
      assertTrue(href.includes(item.target) || (item.target === 'index' && (href === 'index.html' || href === './' || href === '/')), `Active link on ${item.page} should match ${item.target} (found href: ${href})`);
    }
  });

  it('T3-5.3: Active nav link styling in css/components.css highlights Heat Orange #FF862C', async () => {
    const css = await fetchPage('css/components.css');
    assertMatch(css, /\.active|\.is-active/i, 'components.css must define styles for active navigation links');
    assertMatch(css, /#FF862C/i, 'components.css active nav styling must reference Heat Orange color token #FF862C');
  });
});

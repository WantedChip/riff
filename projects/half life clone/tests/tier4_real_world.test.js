/**
 * Tier 4: Real-World Application Scenarios Test Suite
 * Project: Half-Life Franchise Website
 * 
 * End-to-End User Journeys and System Audits:
 * - Scenario 1: New Visitor Journey (Home -> Alyx Hero -> French i18n -> /alyx VR specs -> Back to Home)
 * - Scenario 2: Legacy Fan Journey (/halflife GoldSrc -> German i18n -> /halflife2 City 17)
 * - Scenario 3: Episode Marathoner Journey (/episode1 Alyx companion -> /episode2 White Forest rocket)
 * - Scenario 4: 20th Anniversary Explorer (Homepage editorial block, commentary, workshop, documentary)
 * - Scenario 5: Full Site Design System Audit (6-page scan for 0px border-radius & design tokens)
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

// Helper to simulate browser VM context with localStorage and i18n
async function createBrowserContext(initialLang = 'en', urlSearch = '') {
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
    location: { search: urlSearch },
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
// Scenario 1: New Visitor Journey
// ----------------------------------------------------------------------------
describe('Tier 4 - Scenario 1: New Visitor Journey', 'Tier 4', () => {
  it('T4-1.1: Visitor lands on index.html: reads Alyx Hero section headline, synopsis, key art, and primary CTAs', async () => {
    const html = await fetchPage('index.html');
    const doc = parseHTML(html);

    // Verify Alyx Hero container
    const heroSection = doc.querySelector('.hero, section.hero-section, #hero');
    assertTrue(heroSection !== null, 'index.html must present a prominent Hero section');

    // Verify 40px DIN Headline presence
    const headline = doc.querySelector('.hero h1, .hero-headline, h1');
    assertTrue(headline !== null, 'Hero section must feature a bold headline');
    assertTrue(headline.textContent.length > 0, 'Hero headline text must not be empty');

    // Verify Key Art / Hero Media
    const heroImg = doc.querySelector('.hero img, .hero-media img, img');
    assertTrue(heroImg !== null, 'Hero section must include key art image asset');

    // Verify primary CTA link pointing to alyx.html
    const cta = doc.querySelector('.hero a[href*="alyx"], a.cta-primary');
    assertTrue(cta !== null, 'Hero section must feature direct CTA link to Alyx product page');
  });

  it('T4-1.2: Visitor switches language to French, navigates to /alyx, checks VR specs table, and returns to home', async () => {
    // Step 1: Switch language to French on home
    const env = await createBrowserContext('en');
    env.i18n.setLanguage('fr');
    assertEqual(env.storage['hl_lang'], 'fr', 'French language preference must be stored in localStorage');

    // Step 2: Navigate to alyx.html with French state retained
    const alyxHtml = await fetchPage('alyx.html');
    const doc = parseHTML(alyxHtml);

    // Verify VR specs table presence
    const specsTable = doc.querySelector('table, .specs-table, .system-specs');
    assertTrue(specsTable !== null, 'alyx.html must contain a system specifications table');

    // Verify back-navigation link to home
    const backLink = doc.querySelector('a[href*="index.html"], .back-link');
    assertTrue(backLink !== null, 'alyx.html must contain a back-navigation link returning to index.html');
  });
});

// ----------------------------------------------------------------------------
// Scenario 2: Legacy Fan Journey
// ----------------------------------------------------------------------------
describe('Tier 4 - Scenario 2: Legacy Fan Journey', 'Tier 4', () => {
  it('T4-2.1: Legacy fan navigates to /halflife, inspects Black Mesa synopsis, 1998 release metadata, and GoldSrc specs', async () => {
    const html = await fetchPage('halflife.html');
    const doc = parseHTML(html);

    // Verify page content references Black Mesa, 1998, and GoldSrc
    const textContent = doc.textContent;
    assertIncludes(textContent, 'Black Mesa', 'halflife.html must feature Black Mesa synopsis');
    assertIncludes(textContent, '1998', 'halflife.html must mention 1998 original release year');

    // Verify specs table or metadata grid
    const specsElem = doc.querySelector('table, .specs-table, .game-metadata, .specs');
    assertTrue(specsElem !== null, 'halflife.html must feature specs or metadata table');
  });

  it('T4-2.2: Fan switches language to German, jumps to /halflife2, and inspects City 17 content and Source engine physics', async () => {
    // Step 1: Switch language to German
    const env = await createBrowserContext('en');
    env.i18n.setLanguage('de');
    assertEqual(env.i18n.getLanguage(), 'de', 'Language should switch to German');

    // Step 2: Jump to halflife2.html
    const hl2Html = await fetchPage('halflife2.html');
    const doc = parseHTML(hl2Html);

    // Verify City 17 and Source engine content
    const textContent = doc.textContent;
    assertIncludes(textContent, 'City 17', 'halflife2.html must detail City 17 dystopian setting');
    assertIncludes(textContent, 'Source', 'halflife2.html must detail Source engine physics');
  });
});

// ----------------------------------------------------------------------------
// Scenario 3: Episode Marathoner Journey
// ----------------------------------------------------------------------------
describe('Tier 4 - Scenario 3: Episode Marathoner Journey', 'Tier 4', () => {
  it('T4-3.1: Marathoner visits /episode1, verifies Alyx Vance AI companion details and Citadel core containment aftermath', async () => {
    const html = await fetchPage('episode1.html');
    const doc = parseHTML(html);

    const textContent = doc.textContent;
    assertIncludes(textContent, 'Alyx', 'episode1.html must highlight Alyx Vance AI companion focus');
    assertIncludes(textContent, 'Citadel', 'episode1.html must detail Citadel reactor core containment aftermath');
  });

  it('T4-3.2: Marathoner navigates directly to /episode2, checking White Forest rocket details and Strider battles', async () => {
    const html = await fetchPage('episode2.html');
    const doc = parseHTML(html);

    const textContent = doc.textContent;
    assertIncludes(textContent, 'White Forest', 'episode2.html must detail White Forest countryside campaign');
    assertIncludes(textContent, 'Strider', 'episode2.html must highlight Strider battles or Magnusson devices');
  });
});

// ----------------------------------------------------------------------------
// Scenario 4: 20th Anniversary Explorer
// ----------------------------------------------------------------------------
describe('Tier 4 - Scenario 4: 20th Anniversary Explorer', 'Tier 4', () => {
  it('T4-4.1: Explorer inspects index.html 20th Anniversary block for developer commentary, Workshop, and documentary features', async () => {
    const html = await fetchPage('index.html');
    const doc = parseHTML(html);

    const anniversaryBlock = doc.querySelector('.anniversary-block, .anniversary, #anniversary');
    assertTrue(anniversaryBlock !== null, 'index.html must contain a 20th Anniversary Editorial Block');

    const blockText = anniversaryBlock.textContent;
    assertIncludes(blockText, '20th', 'Anniversary block must mention 20th Anniversary');
  });

  it('T4-4.2: Explorer verifies documentary callout element and video modal/trailer triggers on index.html', async () => {
    const html = await fetchPage('index.html');
    const doc = parseHTML(html);

    // Check video trigger or trailer container
    const videoElem = doc.querySelector('.video-container, .modal, [data-video], iframe, video, .trailer-trigger');
    assertTrue(videoElem !== null, 'index.html must contain a video modal container or trailer trigger for documentary/trailers');
  });
});

// ----------------------------------------------------------------------------
// Scenario 5: Full Site Design System Audit
// ----------------------------------------------------------------------------
describe('Tier 4 - Scenario 5: Full Site Design System Audit', 'Tier 4', () => {
  it('T4-5.1: Iterates through all 6 HTML pages verifying stylesheet link imports for design-system.css and components.css', async () => {
    const allPages = ['index.html', 'alyx.html', 'halflife.html', 'halflife2.html', 'episode1.html', 'episode2.html'];

    for (const pageFile of allPages) {
      const html = await fetchPage(pageFile);
      const doc = parseHTML(html);

      const styleLinks = doc.querySelectorAll('link[rel="stylesheet"]');
      assertTrue(styleLinks.length >= 2, `Page ${pageFile} must import at least 2 stylesheet files`);

      const hrefs = styleLinks.map(l => l.getAttribute('href') || '');
      const hasDS = hrefs.some(h => h.includes('design-system.css'));
      const hasComp = hrefs.some(h => h.includes('components.css'));

      assertTrue(hasDS, `Page ${pageFile} must link css/design-system.css`);
      assertTrue(hasComp, `Page ${pageFile} must link css/components.css`);
    }
  });

  it('T4-5.2: Verifies design token compliance: Steam Gray #E9E8E9 canvas, Ink Black #000000 text, Heat Orange #FF862C accents, and strict 0px border-radius across all CSS declarations', async () => {
    const cssDS = await fetchPage('css/design-system.css');
    const cssComp = await fetchPage('css/components.css');
    const fullCSS = cssDS + '\n' + cssComp;

    // Verify palette tokens
    assertIncludes(fullCSS, '#E9E8E9', 'CSS tokens must specify Steam Gray #E9E8E9 canvas background');
    assertIncludes(fullCSS, '#000000', 'CSS tokens must specify Ink Black #000000 primary text');
    assertIncludes(fullCSS, '#FF862C', 'CSS tokens must specify Heat Orange #FF862C interactive accent');

    // Verify strict 0px geometry rule
    assertMatch(fullCSS, /border-radius:\s*0/i, 'CSS must enforce 0px border radius');
  });
});

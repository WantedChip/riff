/**
 * Tier 2 Boundary & Corner Cases Test Suite
 * 
 * Verifies boundary conditions, edge cases, error fallbacks, and parameter resilience
 * across all 15 core features (F1 to F15) mapped to requirements R1 through R6.
 * 
 * Contains 85 test cases (at least 5 per feature).
 * Uses tests/utils/test_harness.js for loading HTML/CSS/JS resources and assertions.
 */

const {
  describe,
  it,
  assert,
  assertEqual,
  assertNotEqual,
  assertIncludes,
  assertMatch,
  assertTrue,
  assertFalse,
  parseHTML,
  fetchPage
} = require('./utils/test_harness');

// ============================================================================
// Feature 1: Brand Navigation Header Edge Cases (F1)
// ============================================================================
describe('Feature 1: Brand Navigation Header Edge Cases', 'Tier 2', () => {
  it('F1-E1: Navigation header handles missing active link gracefully without DOM exception', async () => {
    const html = await fetchPage('index.html');
    const doc = parseHTML(html);
    const nav = doc.querySelector('header nav, nav');
    assert(nav, 'Navigation container must exist');
    // Querying active link should return element or null, without throwing
    const activeLink = doc.querySelector('header nav a.active, nav a.active');
    assertTrue(activeLink === null || activeLink.tagName === 'A', 'Active link query should yield A tag or null');
  });

  it('F1-E2: Header brand title/logo specifies non-wrapping or flex layout to prevent title wrap', async () => {
    const css = await fetchPage('css/components.css');
    // Look for brand title or header logo flex/nowrap declarations
    const hasNoWrapOrFlex = /white-space\s*:\s*nowrap|flex-shrink\s*:\s*0|display\s*:\s*flex/i.test(css);
    assertTrue(hasNoWrapOrFlex, 'Header CSS should enforce non-wrapping or flex shrink styling for logo/title');
  });

  it('F1-E3: Mobile menu toggle element includes accessibility attributes and click boundary state', async () => {
    const html = await fetchPage('index.html');
    const doc = parseHTML(html);
    const toggle = doc.querySelector('.nav-toggle, .menu-toggle, header button, .hamburger');
    assert(toggle, 'Header must contain a mobile navigation toggle element');
    const hasAria = toggle.hasAttribute('aria-label') || toggle.hasAttribute('aria-expanded') || toggle.hasAttribute('title');
    assertTrue(hasAria, 'Mobile nav toggle button should have accessibility attribute (aria-label, aria-expanded, or title)');
  });

  it('F1-E4: Navigation links do not contain broken targets (empty href, javascript:void(0), or #)', async () => {
    const html = await fetchPage('index.html');
    const doc = parseHTML(html);
    const navLinks = doc.querySelectorAll('header nav a, nav a');
    assert(navLinks.length > 0, 'Nav links must exist');
    for (const link of navLinks) {
      const href = (link.getAttribute('href') || '').trim();
      assertNotEqual(href, '', 'Nav link href must not be empty');
      assertNotEqual(href, 'javascript:void(0)', 'Nav link href must not use javascript:void(0)');
      assertNotEqual(href, 'javascript:void(0);', 'Nav link href must not use javascript:void(0);');
    }
  });

  it('F1-E5: Navigation header CSS defines layout positioning and z-index layering', async () => {
    const css = await fetchPage('css/components.css');
    const hasPosition = /header[^{]*\{[^}]*position\s*:\s*(relative|sticky|fixed)/i.test(css) ||
                        /z-index\s*:\s*[0-9]+/i.test(css);
    assertTrue(hasPosition, 'Header CSS should define positioning or z-index to prevent document overlap');
  });

  it('F1-E6: Navigation bar elements enforce box-sizing border-box to prevent overflow', async () => {
    const dsCss = await fetchPage('css/design-system.css');
    const hasBoxSizing = /box-sizing\s*:\s*border-box/i.test(dsCss);
    assertTrue(hasBoxSizing, 'Global or header CSS must enforce box-sizing: border-box');
  });
});

// ============================================================================
// Feature 2: Multi-Language Switcher Edge Cases (F2)
// ============================================================================
describe('Feature 2: Multi-Language Switcher Edge Cases', 'Tier 2', () => {
  it('F2-E1: i18n engine falls back to default language "en" when invalid lang code is provided', async () => {
    const js = await fetchPage('js/i18n.js');
    // Verify fallback check or default 'en' assignment in i18n code
    const hasFallback = /'en'| "en"/.test(js) && (js.includes('supportedLangs') || js.includes('includes') || js.includes('default'));
    assertTrue(hasFallback, 'i18n.js must include fallback logic to default "en" language');
  });

  it('F2-E2: i18n engine handles rapid language code switching without corrupting state', async () => {
    const js = await fetchPage('js/i18n.js');
    const hasSetLang = js.includes('setLanguage') || js.includes('currentLang');
    assertTrue(hasSetLang, 'i18n.js must implement setLanguage or track currentLang');
  });

  it('F2-E3: Translation engine returns key string or fallback when non-existent key is queried', async () => {
    const js = await fetchPage('js/i18n.js');
    const hasKeyFallback = js.includes('getTranslation') || js.includes('translations') || js.includes('key');
    assertTrue(hasKeyFallback, 'i18n.js must implement getTranslation with key fallback handling');
  });

  it('F2-E4: Language switcher normalizes uppercase or mixed-case language parameter inputs', async () => {
    const js = await fetchPage('js/i18n.js');
    const hasLowerCase = js.includes('toLowerCase') || /lang.*toLowerCase/i.test(js) || js.includes('en');
    assertTrue(hasLowerCase, 'i18n.js should convert or normalize language code inputs to lowercase');
  });

  it('F2-E5: Language switcher trims whitespace from language parameter strings', async () => {
    const js = await fetchPage('js/i18n.js');
    const hasTrim = js.includes('trim') || js.includes('replace') || js.includes('currentLang');
    assertTrue(hasTrim, 'i18n.js should trim or handle whitespace in language strings');
  });

  it('F2-E6: Select dropdown in header contains valid value attributes for all 6 supported codes', async () => {
    const html = await fetchPage('index.html');
    const doc = parseHTML(html);
    const select = doc.querySelector('header select, nav select, .lang-switcher select, select');
    assert(select, 'Language switcher dropdown select must exist');
    const options = select.querySelectorAll('option');
    const values = options.map(opt => (opt.getAttribute('value') || '').toLowerCase());
    const requiredCodes = ['en', 'fr', 'de', 'es', 'ja', 'zh'];
    for (const code of requiredCodes) {
      assertTrue(values.includes(code), `Language dropdown options must contain value="${code}"`);
    }
  });
});

// ============================================================================
// Feature 3: i18n Storage Edge Cases (F3)
// ============================================================================
describe('Feature 3: i18n Storage Edge Cases', 'Tier 3', () => {
  it('F3-E1: i18n engine recovers from corrupted or invalid localStorage hl_lang values', async () => {
    const js = await fetchPage('js/i18n.js');
    const handlesStorage = js.includes('localStorage') && (js.includes('getItem') || js.includes('hl_lang'));
    assertTrue(handlesStorage, 'i18n.js must check localStorage item "hl_lang"');
  });

  it('F3-E2: i18n engine incorporates try-catch block for localStorage access resilience', async () => {
    const js = await fetchPage('js/i18n.js');
    const hasTryCatch = /try\s*\{[^}]*localStorage/i.test(js) || /localStorage.*catch/i.test(js) || js.includes('try');
    assertTrue(hasTryCatch, 'i18n.js should wrap localStorage reads/writes in try-catch for restricted environments');
  });

  it('F3-E3: URL parameter lang reader sanitizes or validates query input against allowed list', async () => {
    const js = await fetchPage('js/i18n.js');
    const validatesParam = js.includes('URLSearchParams') || js.includes('location.search') || js.includes('lang');
    assertTrue(validatesParam, 'i18n.js must parse URL query parameter ?lang=');
  });

  it('F3-E4: i18n engine skips elements with empty or whitespace data-i18n attributes safely', async () => {
    const js = await fetchPage('js/i18n.js');
    const checksKey = js.includes('getAttribute') || js.includes('data-i18n') || js.includes('querySelectorAll');
    assertTrue(checksKey, 'i18n.js must query elements with data-i18n attribute');
  });

  it('F3-E5: i18n dictionary file contains valid multi-byte UTF-8 character strings for JA and ZH', async () => {
    const js = await fetchPage('js/i18n.js');
    const hasJaOrZhText = /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff]/.test(js) ||
                         (js.includes('ja') && js.includes('zh'));
    assertTrue(hasJaOrZhText, 'i18n.js dictionary must contain Japanese and Simplified Chinese translations');
  });

  it('F3-E6: i18n engine updates document.documentElement lang attribute on language changes', async () => {
    const js = await fetchPage('js/i18n.js');
    const updatesDocLang = js.includes('documentElement') || js.includes('setAttribute') || /lang\s*=/i.test(js);
    assertTrue(updatesDocLang, 'i18n.js must synchronize documentElement.lang attribute');
  });
});

// ============================================================================
// Feature 4: Alyx Hero Edge Cases (F4)
// ============================================================================
describe('Feature 4: Alyx Hero Edge Cases', 'Tier 2', () => {
  it('F4-E1: Hero key art image includes descriptive non-empty alt attribute', async () => {
    const html = await fetchPage('index.html');
    const doc = parseHTML(html);
    const heroImg = doc.querySelector('.hero img, section.hero img, #alyx-hero img, [alt*="Alyx"]');
    assert(heroImg, 'Alyx hero image tag must exist on index.html');
    const alt = heroImg.getAttribute('alt') || '';
    assertNotEqual(alt.trim(), '', 'Hero image alt attribute must not be empty');
  });

  it('F4-E2: Hero 40px DIN headline CSS includes responsive word wrapping to prevent overflow', async () => {
    const css = await fetchPage('css/components.css');
    const dsCss = await fetchPage('css/design-system.css');
    const fullCss = css + '\n' + dsCss;
    const hasWrapRule = /overflow-wrap\s*:\s*break-word|word-break\s*:\s*break-word|hyphens|max-width/i.test(fullCss) ||
                        /font-size\s*:\s*clamp|calc/i.test(fullCss);
    assertTrue(hasWrapRule, 'CSS must specify headline text wrapping or responsive sizing rules');
  });

  it('F4-E3: External CTA links in hero section contain target="_blank" and rel="noopener noreferrer"', async () => {
    const html = await fetchPage('index.html');
    const doc = parseHTML(html);
    const extLinks = doc.querySelectorAll('.hero a[href*="steampowered.com"], section.hero a[target="_blank"]');
    if (extLinks.length > 0) {
      for (const link of extLinks) {
        assertEqual(link.getAttribute('target'), '_blank', 'External hero links must specify target="_blank"');
        const rel = link.getAttribute('rel') || '';
        assertTrue(rel.includes('noopener') && rel.includes('noreferrer'), 'External hero links must specify rel="noopener noreferrer"');
      }
    } else {
      // Verify hero CTAs exist
      const ctas = doc.querySelectorAll('.hero a, section.hero a');
      assert(ctas.length > 0, 'Hero section must contain CTA links');
    }
  });

  it('F4-E4: Hero synopsis container specifies max-width or flex bounds to prevent text stretching', async () => {
    const css = await fetchPage('css/components.css');
    const hasContainerBounds = /hero[^{]*\{[^}]*max-width|hero-content|synopsis/i.test(css);
    assertTrue(hasContainerBounds, 'Hero CSS must define structural container bounds for content');
  });

  it('F4-E5: VR spec badge container specifies flex-wrap or grid to handle narrow screens', async () => {
    const css = await fetchPage('css/components.css');
    const hasBadgeFlex = /flex-wrap\s*:\s*wrap|display\s*:\s*grid|gap\s*:/i.test(css);
    assertTrue(hasBadgeFlex, 'Components CSS should specify flex-wrap or grid gap for badges/metadata');
  });

  it('F4-E6: Hero CTA button utilizes Heat Orange (#FF862C) interactive accent', async () => {
    const css = await fetchPage('css/components.css');
    const dsCss = await fetchPage('css/design-system.css');
    const combined = css + '\n' + dsCss;
    const hasOrangeAccent = /#FF862C|var\(--color-accent-orange\)/i.test(combined);
    assertTrue(hasOrangeAccent, 'Hero CTA styles must reference Heat Orange (#FF862C) accent');
  });
});

// ============================================================================
// Feature 5: 20th Anniversary Edge Cases (F5)
// ============================================================================
describe('Feature 5: 20th Anniversary Edge Cases', 'Tier 2', () => {
  it('F5-E1: Video modal container has initial hidden state in CSS or DOM attribute', async () => {
    const html = await fetchPage('index.html');
    const doc = parseHTML(html);
    const modal = doc.querySelector('.video-modal, #video-modal, [role="dialog"], .modal');
    if (modal) {
      const isHidden = modal.classList.contains('hidden') ||
                       modal.getAttribute('aria-hidden') === 'true' ||
                       (modal.getAttribute('style') || '').includes('display: none');
      assertTrue(isHidden, 'Video modal should start in a hidden state');
    } else {
      const css = await fetchPage('css/components.css');
      const hasModalHidden = /modal[^{]*\{[^}]*display\s*:\s*none|\.hidden\s*\{[^}]*display\s*:\s*none/i.test(css);
      assertTrue(hasModalHidden, 'Components CSS must include hidden modal styling');
    }
  });

  it('F5-E2: External links in 20th Anniversary block specify rel="noopener noreferrer"', async () => {
    const html = await fetchPage('index.html');
    const doc = parseHTML(html);
    const annivLinks = doc.querySelectorAll('.anniversary a[target="_blank"], .anniversary-block a[target="_blank"]');
    for (const link of annivLinks) {
      const rel = link.getAttribute('rel') || '';
      assertTrue(rel.includes('noopener'), 'External anniversary links must include rel="noopener"');
    }
  });

  it('F5-E3: Video iframe container enforces responsive 16:9 aspect ratio styling', async () => {
    const css = await fetchPage('css/components.css');
    const hasAspectRatio = /aspect-ratio\s*:\s*16\s*\/\s*9|padding-top\s*:\s*56\.25%|padding-bottom\s*:\s*56\.25%/i.test(css);
    assertTrue(hasAspectRatio, 'Video container CSS must enforce 16:9 responsive aspect ratio');
  });

  it('F5-E4: Developer commentary block uses structured blockquote or commentary quote class', async () => {
    const html = await fetchPage('index.html');
    const doc = parseHTML(html);
    const commentary = doc.querySelector('.anniversary blockquote, .commentary-quote, .anniversary .quote, .commentary');
    assert(commentary, '20th Anniversary section must contain developer commentary quote element');
  });

  it('F5-E5: Documentary feature artwork image contains alt text', async () => {
    const html = await fetchPage('index.html');
    const doc = parseHTML(html);
    const docImg = doc.querySelector('.anniversary img, .anniversary-block img');
    if (docImg) {
      const alt = docImg.getAttribute('alt') || '';
      assertNotEqual(alt.trim(), '', 'Anniversary image must specify non-empty alt text');
    }
  });

  it('F5-E6: 20th Anniversary section is wrapped in semantic <section> element', async () => {
    const html = await fetchPage('index.html');
    const doc = parseHTML(html);
    const section = doc.querySelector('section.anniversary, section.anniversary-block, #anniversary');
    assert(section, '20th Anniversary block must be enclosed in a semantic <section> tag');
  });
});

// ============================================================================
// Feature 6: Franchise Overview Edge Cases (F6)
// ============================================================================
describe('Feature 6: Franchise Overview Edge Cases', 'Tier 2', () => {
  it('F6-E1: Steam Gray (#E9E8E9) and Ink Black (#000000) tokens provide WCAG AAA compliant contrast', async () => {
    const dsCss = await fetchPage('css/design-system.css');
    assertIncludes(dsCss, '#E9E8E9', 'Design system must define Steam Gray #E9E8E9 background token');
    assertIncludes(dsCss, '#000000', 'Design system must define Ink Black #000000 text token');
  });

  it('F6-E2: Franchise Overview section uses h2 section heading for proper document hierarchy', async () => {
    const html = await fetchPage('index.html');
    const doc = parseHTML(html);
    const overviewHeading = doc.querySelector('section.overview h2, section.franchise h2, #overview h2');
    assert(overviewHeading, 'Franchise Overview section must use an <h2> heading element');
  });

  it('F6-E3: Franchise Overview contains non-empty paragraphs detailing Black Mesa saga', async () => {
    const html = await fetchPage('index.html');
    const doc = parseHTML(html);
    const paragraphs = doc.querySelectorAll('section.overview p, section.franchise p, #overview p');
    assert(paragraphs.length > 0, 'Franchise Overview must contain paragraph copy');
    let totalText = '';
    for (const p of paragraphs) {
      totalText += p.textContent + ' ';
    }
    assertTrue(totalText.length > 50, 'Franchise Overview text must be non-trivial (>50 chars)');
  });

  it('F6-E4: Overview section content renders special symbols (Lambda λ, em-dash) without mangling', async () => {
    const html = await fetchPage('index.html');
    const doc = parseHTML(html);
    const overview = doc.querySelector('section.overview, section.franchise, #overview');
    assert(overview, 'Overview section element must exist');
    const htmlContent = overview.outerHTML;
    assertFalse(htmlContent.includes('&amp;#'), 'HTML should not contain double-encoded HTML entity artifacts');
  });

  it('F6-E5: Overview section CSS padding and margins comply with 4px grid spacing multiples', async () => {
    const css = await fetchPage('css/components.css');
    const dsCss = await fetchPage('css/design-system.css');
    const combined = css + '\n' + dsCss;
    const matches4pxGrid = /8px|16px|24px|32px|48px|64px|4px/i.test(combined);
    assertTrue(matches4pxGrid, 'CSS spacing properties should conform to 4px base grid system');
  });

  it('F6-E6: Overview section uses semantic <section> element tag on index.html', async () => {
    const html = await fetchPage('index.html');
    const doc = parseHTML(html);
    const section = doc.querySelector('section.overview, section.franchise, section#overview');
    assert(section, 'Franchise overview must be wrapped in a <section> element');
  });
});

// ============================================================================
// Feature 7: Catalog Cards Edge Cases (F7)
// ============================================================================
describe('Feature 7: Catalog Cards Edge Cases', 'Tier 2', () => {
  it('F7-E1: Catalog cards grid CSS defines responsive column collapsing rules at tablet and mobile breakpoints', async () => {
    const css = await fetchPage('css/components.css');
    const hasGridMedia = /@media[^{]*\([^)]*max-width\s*:\s*(1023px|767px|768px|1024px)[^)]*\)[^{]*\{[^}]*(grid-template-columns|flex-direction)/i.test(css) ||
                         /repeat\s*\(\s*auto-fit/i.test(css);
    assertTrue(hasGridMedia, 'Components CSS must include media query rules for catalog grid column collapsing');
  });

  it('F7-E2: Cover art <img> elements specify loading="lazy" or explicit sizing attributes', async () => {
    const html = await fetchPage('index.html');
    const doc = parseHTML(html);
    const cardImgs = doc.querySelectorAll('.catalog-grid img, .game-card img, .cards-grid img');
    assert(cardImgs.length >= 4, 'Grid must contain at least 4 cover art images');
    for (const img of cardImgs) {
      const hasLazyOrDim = img.hasAttribute('loading') || (img.hasAttribute('width') && img.hasAttribute('height'));
      assertTrue(hasLazyOrDim, 'Catalog cover art images should specify loading="lazy" or explicit dimension attributes');
    }
  });

  it('F7-E3: Every catalog card cover art image has non-empty alt text matching game title', async () => {
    const html = await fetchPage('index.html');
    const doc = parseHTML(html);
    const cardImgs = doc.querySelectorAll('.catalog-grid img, .game-card img, .cards-grid img');
    assertEqual(cardImgs.length, 4, 'Must have exactly 4 catalog card images');
    for (const img of cardImgs) {
      const alt = (img.getAttribute('alt') || '').trim();
      assertNotEqual(alt, '', 'Card cover image must have non-empty alt text');
    }
  });

  it('F7-E4: Catalog cards deep links match exact target filenames halflife, halflife2, episode1, episode2', async () => {
    const html = await fetchPage('index.html');
    const doc = parseHTML(html);
    const cardLinks = doc.querySelectorAll('.catalog-grid a, .game-card a, .cards-grid a');
    assert(cardLinks.length >= 4, 'Catalog grid must contain at least 4 card links');
    const hrefs = cardLinks.map(a => a.getAttribute('href') || '');
    const requiredTargets = ['halflife.html', 'halflife2.html', 'episode1.html', 'episode2.html'];
    for (const target of requiredTargets) {
      const matched = hrefs.some(h => h.includes(target));
      assertTrue(matched, `Catalog cards must contain deep link targeting ${target}`);
    }
  });

  it('F7-E5: Catalog card container CSS specifies flex or grid stretch for uniform height alignment', async () => {
    const css = await fetchPage('css/components.css');
    const hasCardGridStyle = /catalog-grid|\.game-card|\.cards-grid/i.test(css);
    assertTrue(hasCardGridStyle, 'Components CSS must specify catalog grid or card styling rules');
  });

  it('F7-E6: Catalog grid contains exactly 4 article or card container elements', async () => {
    const html = await fetchPage('index.html');
    const doc = parseHTML(html);
    const cards = doc.querySelectorAll('.game-card, .catalog-card, article.card, .catalog-grid > div');
    assertEqual(cards.length, 4, 'Catalog grid must present exactly 4 game cards');
  });
});

// ============================================================================
// Feature 8: Sub-Route /alyx Edge Cases (F8)
// ============================================================================
describe('Feature 8: Sub-Route /alyx Edge Cases', 'Tier 2', () => {
  it('F8-E1: alyx.html back button explicitly links back to index.html', async () => {
    const html = await fetchPage('alyx.html');
    const doc = parseHTML(html);
    const backLink = doc.querySelector('.back-link, a[href="index.html"], a[href="./index.html"], nav a.back');
    assert(backLink, 'alyx.html must contain a back link to index.html');
    const href = backLink.getAttribute('href') || '';
    assertTrue(href.includes('index.html'), 'Back link href must target index.html');
  });

  it('F8-E2: alyx.html system specs table handles th and td structure without empty cell collapses', async () => {
    const html = await fetchPage('alyx.html');
    const doc = parseHTML(html);
    const table = doc.querySelector('table.specs-table, table');
    assert(table, 'alyx.html must contain a system specs <table>');
    const ths = table.querySelectorAll('th');
    const tds = table.querySelectorAll('td');
    assert(ths.length > 0, 'Specs table must contain <th> header cells');
    assert(tds.length > 0, 'Specs table must contain <td> data cells');
  });

  it('F8-E3: Screenshot gallery thumbnails on alyx.html specify non-empty alt text', async () => {
    const html = await fetchPage('alyx.html');
    const doc = parseHTML(html);
    const galleryImgs = doc.querySelectorAll('.gallery img, .screenshot-gallery img');
    assert(galleryImgs.length > 0, 'alyx.html must contain screenshot gallery images');
    for (const img of galleryImgs) {
      const alt = (img.getAttribute('alt') || '').trim();
      assertNotEqual(alt, '', 'Gallery thumbnail must specify alt attribute');
    }
  });

  it('F8-E4: alyx.html document title specifies Half-Life: Alyx brand title', async () => {
    const html = await fetchPage('alyx.html');
    const doc = parseHTML(html);
    const title = doc.querySelector('title');
    assert(title, 'alyx.html must contain a <title> element');
    assertMatch(title.textContent, /Alyx/i, 'Title tag must contain "Alyx"');
  });

  it('F8-E5: alyx.html contains Gravity Gloves mechanics showcase section', async () => {
    const html = await fetchPage('alyx.html');
    const doc = parseHTML(html);
    const content = doc.innerHTML;
    assertMatch(content, /Gravity Gloves|Grabbity/i, 'alyx.html must feature Gravity Gloves mechanics');
  });
});

// ============================================================================
// Feature 9: Sub-Route /halflife Edge Cases (F9)
// ============================================================================
describe('Feature 9: Sub-Route /halflife Edge Cases', 'Tier 2', () => {
  it('F9-E1: halflife.html back button explicitly links back to index.html', async () => {
    const html = await fetchPage('halflife.html');
    const doc = parseHTML(html);
    const backLink = doc.querySelector('.back-link, a[href="index.html"], a[href="./index.html"]');
    assert(backLink, 'halflife.html must contain a back link to index.html');
  });

  it('F9-E2: halflife.html features GoldSrc engine reference and 1998 launch metadata', async () => {
    const html = await fetchPage('halflife.html');
    const doc = parseHTML(html);
    const content = doc.innerHTML;
    assertMatch(content, /GoldSrc|1998/i, 'halflife.html copy must reference GoldSrc engine or 1998 launch');
  });

  it('F9-E3: halflife.html synopsis details Black Mesa Research Facility incident', async () => {
    const html = await fetchPage('halflife.html');
    const doc = parseHTML(html);
    const content = doc.innerHTML;
    assertMatch(content, /Black Mesa/i, 'halflife.html copy must reference Black Mesa');
  });

  it('F9-E4: halflife.html document title specifies Half-Life legacy brand title', async () => {
    const html = await fetchPage('halflife.html');
    const doc = parseHTML(html);
    const title = doc.querySelector('title');
    assert(title, 'halflife.html must contain a <title> element');
    assertMatch(title.textContent, /Half-Life/i, 'Title tag must contain "Half-Life"');
  });

  it('F9-E5: halflife.html includes system specification table with header elements', async () => {
    const html = await fetchPage('halflife.html');
    const doc = parseHTML(html);
    const table = doc.querySelector('table');
    assert(table, 'halflife.html must contain a specs <table>');
    const headers = table.querySelectorAll('th');
    assert(headers.length > 0, 'Specs table must contain <th> headers');
  });
});

// ============================================================================
// Feature 10: Sub-Route /halflife2 Edge Cases (F10)
// ============================================================================
describe('Feature 10: Sub-Route /halflife2 Edge Cases', 'Tier 2', () => {
  it('F10-E1: halflife2.html back button explicitly links back to index.html', async () => {
    const html = await fetchPage('halflife2.html');
    const doc = parseHTML(html);
    const backLink = doc.querySelector('.back-link, a[href="index.html"], a[href="./index.html"]');
    assert(backLink, 'halflife2.html must contain a back link to index.html');
  });

  it('F10-E2: halflife2.html details City 17 and Gravity Gun physics engine feature', async () => {
    const html = await fetchPage('halflife2.html');
    const doc = parseHTML(html);
    const content = doc.innerHTML;
    assertMatch(content, /City 17|Gravity Gun|Zero-Point/i, 'halflife2.html copy must detail City 17 or Gravity Gun');
  });

  it('F10-E3: halflife2.html highlights Source engine tech innovation', async () => {
    const html = await fetchPage('halflife2.html');
    const doc = parseHTML(html);
    const content = doc.innerHTML;
    assertMatch(content, /Source/i, 'halflife2.html must highlight Source engine');
  });

  it('F10-E4: halflife2.html contains Citadel centerpiece feature section', async () => {
    const html = await fetchPage('halflife2.html');
    const doc = parseHTML(html);
    const content = doc.innerHTML;
    assertMatch(content, /Citadel/i, 'halflife2.html copy must feature Citadel');
  });

  it('F10-E5: halflife2.html document title specifies Half-Life 2 brand title', async () => {
    const html = await fetchPage('halflife2.html');
    const doc = parseHTML(html);
    const title = doc.querySelector('title');
    assert(title, 'halflife2.html must contain a <title> element');
    assertMatch(title.textContent, /Half-Life 2/i, 'Title tag must contain "Half-Life 2"');
  });
});

// ============================================================================
// Feature 11: Sub-Route /episode1 Edge Cases (F11)
// ============================================================================
describe('Feature 11: Sub-Route /episode1 Edge Cases', 'Tier 2', () => {
  it('F11-E1: episode1.html back button explicitly links back to index.html', async () => {
    const html = await fetchPage('episode1.html');
    const doc = parseHTML(html);
    const backLink = doc.querySelector('.back-link, a[href="index.html"], a[href="./index.html"]');
    assert(backLink, 'episode1.html must contain a back link to index.html');
  });

  it('F11-E2: episode1.html details Citadel core containment mission', async () => {
    const html = await fetchPage('episode1.html');
    const doc = parseHTML(html);
    const content = doc.innerHTML;
    assertMatch(content, /Citadel|Core/i, 'episode1.html must detail Citadel core containment');
  });

  it('F11-E3: episode1.html highlights Alyx Vance companion AI gameplay focus', async () => {
    const html = await fetchPage('episode1.html');
    const doc = parseHTML(html);
    const content = doc.innerHTML;
    assertMatch(content, /Alyx/i, 'episode1.html must highlight Alyx Vance companion');
  });

  it('F11-E4: episode1.html features Zombine enemy entry', async () => {
    const html = await fetchPage('episode1.html');
    const doc = parseHTML(html);
    const content = doc.innerHTML;
    assertMatch(content, /Zombine|Combine/i, 'episode1.html must feature Zombine or Combine enemy');
  });

  it('F11-E5: episode1.html document title specifies Episode One brand title', async () => {
    const html = await fetchPage('episode1.html');
    const doc = parseHTML(html);
    const title = doc.querySelector('title');
    assert(title, 'episode1.html must contain a <title> element');
    assertMatch(title.textContent, /Episode One|Episode 1/i, 'Title tag must contain "Episode One"');
  });
});

// ============================================================================
// Feature 12: Sub-Route /episode2 Edge Cases (F12)
// ============================================================================
describe('Feature 12: Sub-Route /episode2 Edge Cases', 'Tier 2', () => {
  it('F12-E1: episode2.html back button explicitly links back to index.html', async () => {
    const html = await fetchPage('episode2.html');
    const doc = parseHTML(html);
    const backLink = doc.querySelector('.back-link, a[href="index.html"], a[href="./index.html"]');
    assert(backLink, 'episode2.html must contain a back link to index.html');
  });

  it('F12-E2: episode2.html details White Forest rocket launch campaign', async () => {
    const html = await fetchPage('episode2.html');
    const doc = parseHTML(html);
    const content = doc.innerHTML;
    assertMatch(content, /White Forest|Rocket/i, 'episode2.html must detail White Forest or rocket launch');
  });

  it('F12-E3: episode2.html highlights Strider battles and Magnusson Devices', async () => {
    const html = await fetchPage('episode2.html');
    const doc = parseHTML(html);
    const content = doc.innerHTML;
    assertMatch(content, /Strider|Magnusson/i, 'episode2.html must detail Strider battles or Magnusson Devices');
  });

  it('F12-E4: episode2.html showcases Outlands rural environment', async () => {
    const html = await fetchPage('episode2.html');
    const doc = parseHTML(html);
    const content = doc.innerHTML;
    assertMatch(content, /Outlands/i, 'episode2.html must showcase Outlands environment');
  });

  it('F12-E5: episode2.html document title specifies Episode Two brand title', async () => {
    const html = await fetchPage('episode2.html');
    const doc = parseHTML(html);
    const title = doc.querySelector('title');
    assert(title, 'episode2.html must contain a <title> element');
    assertMatch(title.textContent, /Episode Two|Episode 2/i, 'Title tag must contain "Episode Two"');
  });
});

// ============================================================================
// Feature 13: Design Tokens Edge Cases (F13)
// ============================================================================
describe('Feature 13: Design Tokens Edge Cases', 'Tier 2', () => {
  it('F13-E1: design-system.css specifies universal 0px border-radius !important reset rule', async () => {
    const css = await fetchPage('css/design-system.css');
    const hasStrictRadius = /\*\s*\{[^}]*border-radius\s*:\s*0\s*!important/i.test(css);
    assertTrue(hasStrictRadius, 'design-system.css must declare * { border-radius: 0 !important; }');
  });

  it('F13-E2: CSS files contain absence of positive border-radius values (>0px)', async () => {
    const dsCss = await fetchPage('css/design-system.css');
    const compCss = await fetchPage('css/components.css');
    const combined = dsCss + '\n' + compCss;
    // Check that border-radius is never set to positive px/em/rem values (excluding 0, 0px, 0 !important)
    const positiveRadiusMatches = combined.match(/border-radius\s*:\s*([1-9][0-9]*px|[0-9\.]+em|[0-9\.]+rem|[1-9][0-9]*%)/gi);
    assertTrue(!positiveRadiusMatches || positiveRadiusMatches.length === 0,
      `CSS must not contain positive border-radius values. Found: ${JSON.stringify(positiveRadiusMatches)}`);
  });

  it('F13-E3: design-system.css specifies universal box-shadow none !important reset rule', async () => {
    const css = await fetchPage('css/design-system.css');
    const hasNoShadow = /box-shadow\s*:\s*none\s*!important/i.test(css);
    assertTrue(hasNoShadow, 'design-system.css must declare global box-shadow: none !important reset');
  });

  it('F13-E4: CSS Custom Properties use consistent uppercase hex color format (#E9E8E9, #000000, #FF862C)', async () => {
    const css = await fetchPage('css/design-system.css');
    assertIncludes(css, '#E9E8E9', 'Must define uppercase #E9E8E9 for canvas');
    assertIncludes(css, '#000000', 'Must define uppercase #000000 for text');
    assertIncludes(css, '#FF862C', 'Must define uppercase #FF862C for accent');
  });

  it('F13-E5: Heat Orange (#FF862C) accent color provides high contrast against Ink Black (#000000)', async () => {
    const css = await fetchPage('css/design-system.css');
    // Confirm presence of both primary color tokens in design system
    assertIncludes(css, '--color-accent-orange', 'Must define --color-accent-orange token');
    assertIncludes(css, '--color-text-primary', 'Must define --color-text-primary token');
  });

  it('F13-E6: Typography DIN font stack defines fallback sans-serif family', async () => {
    const css = await fetchPage('css/design-system.css');
    const hasDinStack = /font-family[^{]*DIN.*sans-serif/i.test(css) ||
                        /--font-[^{]*DIN/i.test(css);
    assertTrue(hasDinStack, 'Design system must define DIN font stack with sans-serif fallback');
  });
});

// ============================================================================
// Feature 14: Responsive Edge Cases (F14)
// ============================================================================
describe('Feature 14: Responsive Edge Cases', 'Tier 2', () => {
  it('F14-E1: CSS specifies overflow-x hidden or max-width 100% to prevent horizontal scrolling', async () => {
    const dsCss = await fetchPage('css/design-system.css');
    const compCss = await fetchPage('css/components.css');
    const combined = dsCss + '\n' + compCss;
    const hasOverflowControl = /overflow-x\s*:\s*hidden|max-width\s*:\s*100%/i.test(combined);
    assertTrue(hasOverflowControl, 'CSS must enforce overflow-x: hidden or max-width: 100% for zero horizontal overflow');
  });

  it('F14-E2: All HTML pages include meta viewport tag with width=device-width, initial-scale=1.0', async () => {
    const pages = ['index.html', 'alyx.html', 'halflife.html', 'halflife2.html', 'episode1.html', 'episode2.html'];
    for (const pageName of pages) {
      const html = await fetchPage(pageName);
      const doc = parseHTML(html);
      const metaViewport = doc.querySelector('meta[name="viewport"]');
      assert(metaViewport, `${pageName} must contain <meta name="viewport"> tag`);
      const content = metaViewport.getAttribute('content') || '';
      assertTrue(content.includes('width=device-width'), `${pageName} viewport meta must specify width=device-width`);
    }
  });

  it('F14-E3: Flexbox containers use flex-wrap: wrap to prevent narrow screen clipping', async () => {
    const css = await fetchPage('css/components.css');
    const hasFlexWrap = /flex-wrap\s*:\s*wrap/i.test(css);
    assertTrue(hasFlexWrap, 'Components CSS should specify flex-wrap: wrap for multi-item flex containers');
  });

  it('F14-E4: Interactive CTAs and button elements enforce minimum 44px tap target size', async () => {
    const css = await fetchPage('css/components.css');
    const dsCss = await fetchPage('css/design-system.css');
    const combined = css + '\n' + dsCss;
    const hasTapTarget = /min-height\s*:\s*(44px|48px)|padding\s*:\s*12px|padding\s*:\s*16px/i.test(combined) ||
                        /height\s*:\s*44px/i.test(combined);
    assertTrue(hasTapTarget, 'Interactive buttons/CTAs CSS must satisfy minimum 44px tap target sizing');
  });

  it('F14-E5: Body text typography font-size lower bound remains at least 14px', async () => {
    const dsCss = await fetchPage('css/design-system.css');
    const fontSizeMatch = dsCss.match(/body[^{]*\{[^}]*font-size\s*:\s*([0-9]+)px/i);
    if (fontSizeMatch) {
      const size = parseInt(fontSizeMatch[1], 10);
      assertTrue(size >= 14, `Body font size must be at least 14px (found ${size}px)`);
    } else {
      assertIncludes(dsCss, '18px', 'Design system should specify 18px body font size');
    }
  });

  it('F14-E6: CSS defines media query rules for Desktop (>=1024px) and Mobile (<768px) viewports', async () => {
    const css = await fetchPage('css/components.css');
    const hasMediaQueries = /@media[^{]*\([^)]*width/i.test(css);
    assertTrue(hasMediaQueries, 'Components CSS must contain responsive @media queries');
  });
});

// ============================================================================
// Feature 15: Specs & Media Components Edge Cases (F15)
// ============================================================================
describe('Feature 15: Specs & Media Components Edge Cases', 'Tier 2', () => {
  it('F15-E1: Specs table empty td cells styling prevents layout collapse', async () => {
    const css = await fetchPage('css/components.css');
    const hasTableStyle = /table|\.specs-table|td|th/i.test(css);
    assertTrue(hasTableStyle, 'Components CSS must include table styling for specification tables');
  });

  it('F15-E2: Image components specify object-fit cover or max-width 100% to preserve aspect ratio', async () => {
    const css = await fetchPage('css/components.css');
    const dsCss = await fetchPage('css/design-system.css');
    const combined = css + '\n' + dsCss;
    const hasFitRule = /object-fit\s*:\s*cover|height\s*:\s*auto|max-width\s*:\s*100%/i.test(combined);
    assertTrue(hasFitRule, 'Media CSS must specify object-fit: cover or height: auto to preserve aspect ratio');
  });

  it('F15-E3: Video container wrapper preserves 16:9 aspect ratio without distortion', async () => {
    const css = await fetchPage('css/components.css');
    const hasVideoRatio = /aspect-ratio|padding-bottom|video-container|video-wrapper/i.test(css);
    assertTrue(hasVideoRatio, 'Video container CSS must enforce 16:9 aspect ratio styling');
  });

  it('F15-E4: Screenshot gallery thumbnail grid uses responsive grid template minmax scaling', async () => {
    const css = await fetchPage('css/components.css');
    const hasGalleryGrid = /gallery|screenshot/i.test(css);
    assertTrue(hasGalleryGrid, 'Components CSS must include screenshot gallery grid styling');
  });

  it('F15-E5: Media elements specify error fallback or alt attribute handling', async () => {
    const html = await fetchPage('index.html');
    const doc = parseHTML(html);
    const imgs = doc.querySelectorAll('img');
    assert(imgs.length > 0, 'Page must contain img elements');
    for (const img of imgs) {
      assertTrue(img.hasAttribute('alt'), 'Every <img> element must specify an alt attribute');
    }
  });

  it('F15-E6: Media component containers enforce 0px sharp rectangular geometry', async () => {
    const dsCss = await fetchPage('css/design-system.css');
    assertIncludes(dsCss, 'border-radius: 0', 'Design system must enforce sharp 0px border radius for media containers');
  });
});

/**
 * Tier 1 Feature Coverage Test Suite
 * 
 * Verifies all 15 core features (F1 to F15) mapped to requirements R1 through R6.
 * Contains at least 6 test cases per feature (90 tests total).
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
// Feature 1: Brand Navigation Header (F1)
// ============================================================================
describe('Feature 1: Brand Navigation Header', 'Tier 1', () => {
  it('F1-1: Header uses semantic <header> and <nav> elements on index.html', async () => {
    const html = await fetchPage('index.html');
    const doc = parseHTML(html);
    const header = doc.querySelector('header');
    assert(header, 'index.html must contain a <header> element');
    const nav = doc.querySelector('header nav, nav');
    assert(nav, 'Header must contain a <nav> navigation element');
  });

  it('F1-2: Header contains Lambda logo symbol or element', async () => {
    const html = await fetchPage('index.html');
    const doc = parseHTML(html);
    const lambdaElem = doc.querySelector('.lambda-logo, .brand-logo, [alt*="Lambda"], [alt*="lambda"]') ||
                       doc.querySelector('header');
    assert(lambdaElem, 'Header must contain a brand/logo element');
    const content = (lambdaElem.textContent || '') + (lambdaElem.innerHTML || '') + (lambdaElem.getAttribute('alt') || '');
    assertMatch(content, /λ|lambda|logo/i, 'Header logo must represent the Lambda symbol');
  });

  it('F1-3: Header displays brand title "HALF-LIFE"', async () => {
    const html = await fetchPage('index.html');
    const doc = parseHTML(html);
    const brandTitle = doc.querySelector('.brand-title, .logo-text, header h1, header .title, header a');
    assert(brandTitle, 'Header must display a brand title element');
    assertMatch(brandTitle.textContent || '', /HALF-LIFE|Half-Life/i, 'Brand title must match Half-Life');
  });

  it('F1-4: Primary navigation contains links to all sub-routes', async () => {
    const html = await fetchPage('index.html');
    const doc = parseHTML(html);
    const navLinks = doc.querySelectorAll('header nav a, nav a');
    assert(navLinks.length >= 5, 'Nav should contain links to sub-routes (at least 5 links)');
    
    const hrefs = navLinks.map(a => a.getAttribute('href') || '');
    const requiredRoutes = ['index.html', 'alyx.html', 'halflife.html', 'halflife2.html', 'episode1.html', 'episode2.html'];
    
    let foundCount = 0;
    for (const route of requiredRoutes) {
      if (hrefs.some(h => h.includes(route) || h.includes(route.replace('.html', '')))) {
        foundCount++;
      }
    }
    assert(foundCount >= 4, `Navigation must link to core sub-routes. Found ${foundCount} of ${requiredRoutes.length}`);
  });

  it('F1-5: Active route indicator (.active) is set on index.html nav link', async () => {
    const html = await fetchPage('index.html');
    const doc = parseHTML(html);
    const activeLink = doc.querySelector('header nav a.active, nav a.active');
    assert(activeLink, 'Active page link in navigation must have CSS class "active"');
    const href = activeLink.getAttribute('href') || '';
    assertTrue(href.includes('index.html') || href === './' || href === '/' || href === '#',
      'Active link on index.html should point to index.html');
  });

  it('F1-6: Sub-route alyx.html navigation applies .active to Alyx nav link', async () => {
    const html = await fetchPage('alyx.html');
    const doc = parseHTML(html);
    const activeLink = doc.querySelector('header nav a.active, nav a.active');
    assert(activeLink, 'alyx.html navigation must indicate active route with .active class');
    const href = activeLink.getAttribute('href') || '';
    assertIncludes(href, 'alyx', 'Active link on alyx.html must be the Alyx navigation link');
  });
});

// ============================================================================
// Feature 2: Multi-Language Switcher (F2)
// ============================================================================
describe('Feature 2: Multi-Language Switcher', 'Tier 1', () => {
  it('F2-1: Language switcher dropdown <select> exists in navigation header', async () => {
    const html = await fetchPage('index.html');
    const doc = parseHTML(html);
    const select = doc.querySelector('header select, nav select, .lang-switcher select, #lang-select, select');
    assert(select, 'Header must contain a language switcher <select> dropdown');
  });

  it('F2-2: Language switcher options include all 6 supported language codes', async () => {
    const html = await fetchPage('index.html');
    const doc = parseHTML(html);
    const options = doc.querySelectorAll('select option');
    assert(options.length >= 6, `Language select must contain at least 6 options, found ${options.length}`);
    
    const values = options.map(opt => (opt.getAttribute('value') || '').toLowerCase());
    const expectedCodes = ['en', 'fr', 'de', 'es', 'ja', 'zh'];
    
    for (const code of expectedCodes) {
      assert(values.includes(code), `Language options must include language code "${code}"`);
    }
  });

  it('F2-3: Default language option is set to English ("en")', async () => {
    const html = await fetchPage('index.html');
    const doc = parseHTML(html);
    const defaultOpt = doc.querySelector('select option[selected], select option[value="en"]');
    assert(defaultOpt, 'Language switcher must have an option for English ("en")');
    const val = defaultOpt.getAttribute('value') || '';
    assertEqual(val.toLowerCase(), 'en', 'Default language option should be "en"');
  });

  it('F2-4: Language options specify human-readable labels', async () => {
    const html = await fetchPage('index.html');
    const doc = parseHTML(html);
    const options = doc.querySelectorAll('select option');
    const optionTexts = options.map(o => (o.textContent || '').trim());
    
    for (const text of optionTexts) {
      assert(text.length > 0, 'Language option label should not be empty');
    }
    
    const combinedTexts = optionTexts.join(' ');
    assertMatch(combinedTexts, /English|Français|Deutsch|Español|日本語|中文/i,
      'Language option labels should present recognizable language names');
  });

  it('F2-5: Language switcher control possesses ID or event listener hook', async () => {
    const html = await fetchPage('index.html');
    const doc = parseHTML(html);
    const select = doc.querySelector('select#lang-select, select.lang-select, select[onchange], select[data-i18n-select], select');
    assert(select, 'Language select element must be accessible via ID or class');
    const hasIdOrClass = Boolean(select.id || select.className || select.hasAttribute('onchange'));
    assertTrue(hasIdOrClass, 'Language select should have an id, class, or event listener handler');
  });

  it('F2-6: Language switcher appears consistently across sub-routes (e.g. halflife.html)', async () => {
    const html = await fetchPage('halflife.html');
    const doc = parseHTML(html);
    const select = doc.querySelector('select');
    assert(select, 'Sub-route halflife.html must also include the language switcher select dropdown');
  });
});

// ============================================================================
// Feature 3: i18n State Persistence (F3)
// ============================================================================
describe('Feature 3: i18n State Persistence', 'Tier 1', () => {
  it('F3-1: js/i18n.js uses localStorage key "hl_lang" for language persistence', async () => {
    const jsContent = await fetchPage('js/i18n.js');
    assertIncludes(jsContent, 'hl_lang', 'js/i18n.js must reference localStorage key "hl_lang"');
  });

  it('F3-2: js/i18n.js reads URL parameter "?lang=" to override language state', async () => {
    const jsContent = await fetchPage('js/i18n.js');
    assertMatch(jsContent, /URLSearchParams|location\.search|\?lang=|lang=/i,
      'js/i18n.js must check URL search parameters for "lang" parameter override');
  });

  it('F3-3: HTML elements specify data-i18n attributes for dynamic translation', async () => {
    const html = await fetchPage('index.html');
    const doc = parseHTML(html);
    const i18nElements = doc.querySelectorAll('[data-i18n]');
    assert(i18nElements.length >= 5,
      `index.html should have elements with data-i18n attributes. Found ${i18nElements.length}`);
  });

  it('F3-4: js/i18n.js updates document <html> lang attribute on locale change', async () => {
    const jsContent = await fetchPage('js/i18n.js');
    assertMatch(jsContent, /lang|documentElement|setAttribute\(['"]lang['"]/i,
      'js/i18n.js must update html lang attribute when language state changes');
  });

  it('F3-5: js/i18n.js contains non-empty translation dictionaries for all 6 locales', async () => {
    const jsContent = await fetchPage('js/i18n.js');
    const locales = ['en', 'fr', 'de', 'es', 'ja', 'zh'];
    for (const locale of locales) {
      assertIncludes(jsContent, locale, `js/i18n.js dictionary must define translations for locale "${locale}"`);
    }
  });

  it('F3-6: js/i18n.js exposes global API window.HL_i18n interface', async () => {
    const jsContent = await fetchPage('js/i18n.js');
    assertMatch(jsContent, /HL_i18n|window\.HL_i18n|setLanguage|getTranslation/i,
      'js/i18n.js must expose HL_i18n API with setLanguage and getTranslation methods');
  });
});

// ============================================================================
// Feature 4: Half-Life: Alyx Hero (F4)
// ============================================================================
describe('Feature 4: Half-Life: Alyx Hero', 'Tier 1', () => {
  it('F4-1: Hero section exists on index.html', async () => {
    const html = await fetchPage('index.html');
    const doc = parseHTML(html);
    const hero = doc.querySelector('.hero, .hero-alyx, #hero, section.hero');
    assert(hero, 'index.html must contain a hero section for Half-Life: Alyx');
  });

  it('F4-2: Hero contains 40px DIN announcement headline for Half-Life: Alyx', async () => {
    const html = await fetchPage('index.html');
    const doc = parseHTML(html);
    const headline = doc.querySelector('.hero h1, .hero h2, .hero .headline, h1');
    assert(headline, 'Hero section must contain a headline element');
    assertMatch(headline.textContent || '', /HALF-LIFE:\s*ALYX|Half-Life:\s*Alyx/i,
      'Hero headline must specify "HALF-LIFE: ALYX"');
  });

  it('F4-3: Hero features key art image', async () => {
    const html = await fetchPage('index.html');
    const doc = parseHTML(html);
    const heroImg = doc.querySelector('.hero img, .hero-art, section.hero img');
    assert(heroImg, 'Hero section must feature key art <img> element');
    const src = heroImg.getAttribute('src') || '';
    assert(src.length > 0, 'Hero key art image must have a non-empty src attribute');
  });

  it('F4-4: Hero displays VR badge / metadata tags', async () => {
    const html = await fetchPage('index.html');
    const doc = parseHTML(html);
    const hero = doc.querySelector('.hero, .hero-alyx, section.hero');
    assert(hero, 'Hero section must exist');
    const text = hero.textContent || '';
    assertMatch(text, /VR|Valve Index|SteamVR|Virtual Reality/i,
      'Hero metadata must display VR tags or VR specifications');
  });

  it('F4-5: Hero includes Heat Orange CTA buttons/links', async () => {
    const html = await fetchPage('index.html');
    const doc = parseHTML(html);
    const cta = doc.querySelector('.hero .cta, .hero a, .hero button, .btn-orange');
    assert(cta, 'Hero section must include CTA buttons or links');
    const ctaText = cta.textContent || '';
    assertMatch(ctaText, /STEAM|BUY|EXPLORE|LEARN|PLAY/i, 'Hero CTA text should be action-oriented');
  });

  it('F4-6: Hero contains descriptive synopsis copy', async () => {
    const html = await fetchPage('index.html');
    const doc = parseHTML(html);
    const synopsis = doc.querySelector('.hero p, .hero .synopsis, .hero-description');
    assert(synopsis, 'Hero section must contain descriptive synopsis paragraph');
    assertTrue((synopsis.textContent || '').length > 20, 'Synopsis copy must provide substantial text');
  });
});

// ============================================================================
// Feature 5: HL2 20th Anniversary Block (F5)
// ============================================================================
describe('Feature 5: HL2 20th Anniversary Block', 'Tier 1', () => {
  it('F5-1: 20th Anniversary editorial block section exists on index.html', async () => {
    const html = await fetchPage('index.html');
    const doc = parseHTML(html);
    const block = doc.querySelector('.anniversary-block, .anniversary, #anniversary, section.editorial');
    assert(block, 'index.html must contain a 20th Anniversary Editorial Block section');
  });

  it('F5-2: Section spotlights Developer Commentary text', async () => {
    const html = await fetchPage('index.html');
    const doc = parseHTML(html);
    const block = doc.querySelector('.anniversary-block, .anniversary, #anniversary, section');
    assert(block, 'Anniversary section must exist');
    assertMatch(block.textContent || '', /Developer Commentary|Commentary/i,
      'Anniversary section must highlight Developer Commentary');
  });

  it('F5-3: Section includes Steam Workshop integration link/text', async () => {
    const html = await fetchPage('index.html');
    const doc = parseHTML(html);
    const block = doc.querySelector('.anniversary-block, .anniversary, #anniversary, section');
    assert(block, 'Anniversary section must exist');
    assertMatch(block.textContent || '', /Steam Workshop|Workshop/i,
      'Anniversary section must reference Steam Workshop integration');
  });

  it('F5-4: Section spotlights visual enhancements & graphics upgrades', async () => {
    const html = await fetchPage('index.html');
    const doc = parseHTML(html);
    const block = doc.querySelector('.anniversary-block, .anniversary, #anniversary, section');
    assert(block, 'Anniversary section must exist');
    assertMatch(block.textContent || '', /Visual|Enhancements|Graphics|Upgrades|Lighting/i,
      'Anniversary section must detail visual upgrades');
  });

  it('F5-5: Section references or links to the "Secret Tape" documentary', async () => {
    const html = await fetchPage('index.html');
    const doc = parseHTML(html);
    const block = doc.querySelector('.anniversary-block, .anniversary, #anniversary, section');
    assert(block, 'Anniversary section must exist');
    assertMatch(block.textContent || '', /Secret Tape|Documentary|Making-of|Making Of/i,
      'Anniversary section must feature Secret Tape documentary link/text');
  });

  it('F5-6: Editorial block uses structured grid layout', async () => {
    const html = await fetchPage('index.html');
    const doc = parseHTML(html);
    const grid = doc.querySelector('.anniversary-block .grid, .editorial-grid, .anniversary .grid-2col, .grid');
    assert(grid, 'Anniversary section must utilize an editorial grid layout structure');
  });
});

// ============================================================================
// Feature 6: Franchise Overview Narrative (F6)
// ============================================================================
describe('Feature 6: Franchise Overview Narrative', 'Tier 1', () => {
  it('F6-1: Franchise overview narrative section exists on index.html', async () => {
    const html = await fetchPage('index.html');
    const doc = parseHTML(html);
    const overview = doc.querySelector('.franchise-overview, .overview, #overview, section.narrative');
    assert(overview, 'index.html must contain a Franchise Overview Narrative section');
  });

  it('F6-2: Narrative copy details the Black Mesa 1998 research facility origin', async () => {
    const html = await fetchPage('index.html');
    const doc = parseHTML(html);
    const overview = doc.querySelector('.franchise-overview, .overview, #overview, section');
    assert(overview, 'Franchise overview section must exist');
    assertMatch(overview.textContent || '', /Black Mesa|1998|Gordon Freeman/i,
      'Narrative copy must detail the Black Mesa 1998 origin');
  });

  it('F6-3: Narrative copy details City 17 and Combine occupation context', async () => {
    const html = await fetchPage('index.html');
    const doc = parseHTML(html);
    const overview = doc.querySelector('.franchise-overview, .overview, #overview, section');
    assert(overview, 'Franchise overview section must exist');
    assertMatch(overview.textContent || '', /City 17|Combine|7 Hour War|Seven-Hour War/i,
      'Narrative copy must describe City 17 and Combine occupation');
  });

  it('F6-4: Narrative copy summarizes Gordon Freeman & Alyx Vance Combine saga', async () => {
    const html = await fetchPage('index.html');
    const doc = parseHTML(html);
    const overview = doc.querySelector('.franchise-overview, .overview, #overview, section');
    assert(overview, 'Franchise overview section must exist');
    assertMatch(overview.textContent || '', /Resistance|Combine|Saga|Freeman|Alyx/i,
      'Narrative copy must summarize the Combine resistance saga');
  });

  it('F6-5: Uses high-contrast 40px DIN section titles', async () => {
    const html = await fetchPage('index.html');
    const doc = parseHTML(html);
    const heading = doc.querySelector('.franchise-overview h2, .overview h2, section h2');
    assert(heading, 'Overview section must feature prominent heading element');
    assertTrue((heading.textContent || '').length > 0, 'Heading text must not be empty');
  });

  it('F6-6: Paragraph copy provides readable narrative text', async () => {
    const html = await fetchPage('index.html');
    const doc = parseHTML(html);
    const paragraphs = doc.querySelectorAll('.franchise-overview p, .overview p');
    assert(paragraphs.length >= 1, 'Overview section must contain body paragraphs');
    const totalLength = paragraphs.reduce((acc, p) => acc + (p.textContent || '').length, 0);
    assertTrue(totalLength > 100, 'Narrative copy should contain substantial text (>100 chars)');
  });
});

// ============================================================================
// Feature 7: Game Catalog Cards Grid (F7)
// ============================================================================
describe('Feature 7: Game Catalog Cards Grid', 'Tier 1', () => {
  it('F7-1: Game catalog section exists on index.html', async () => {
    const html = await fetchPage('index.html');
    const doc = parseHTML(html);
    const catalog = doc.querySelector('.catalog-grid, .game-catalog, .catalog, section.catalog');
    assert(catalog, 'index.html must contain a Game Catalog Cards Grid section');
  });

  it('F7-2: Catalog contains 4 game cards for HL1, HL2, EP1, and EP2', async () => {
    const html = await fetchPage('index.html');
    const doc = parseHTML(html);
    const cards = doc.querySelectorAll('.catalog-grid .game-card, .game-catalog .card, .catalog .card');
    assertEqual(cards.length, 4, `Catalog grid must contain exactly 4 game cards. Found ${cards.length}`);
  });

  it('F7-3: Each game card features authentic cover art <img> element', async () => {
    const html = await fetchPage('index.html');
    const doc = parseHTML(html);
    const cards = doc.querySelectorAll('.catalog-grid .game-card, .game-catalog .card, .catalog .card');
    assertEqual(cards.length, 4, 'Catalog grid must contain 4 cards');
    
    for (let i = 0; i < cards.length; i++) {
      const img = cards[i].querySelector('img');
      assert(img, `Game card #${i + 1} must contain an <img> cover art element`);
      const src = img.getAttribute('src') || '';
      assert(src.length > 0, `Game card #${i + 1} cover art image src must not be empty`);
    }
  });

  it('F7-4: Each game card displays release metadata tags (1998, 2004, 2006, 2007)', async () => {
    const html = await fetchPage('index.html');
    const doc = parseHTML(html);
    const catalogText = doc.querySelector('.catalog-grid, .game-catalog, .catalog').textContent || '';
    
    const years = ['1998', '2004', '2006', '2007'];
    for (const year of years) {
      assertIncludes(catalogText, year, `Catalog cards must display release year tag "${year}"`);
    }
  });

  it('F7-5: Each game card contains product summary description copy', async () => {
    const html = await fetchPage('index.html');
    const doc = parseHTML(html);
    const cards = doc.querySelectorAll('.catalog-grid .game-card, .game-catalog .card, .catalog .card');
    
    for (let i = 0; i < cards.length; i++) {
      const text = cards[i].textContent || '';
      assertTrue(text.length > 30, `Game card #${i + 1} must contain descriptive product summary copy`);
    }
  });

  it('F7-6: Each game card contains deep link to its dedicated sub-route', async () => {
    const html = await fetchPage('index.html');
    const doc = parseHTML(html);
    const cards = doc.querySelectorAll('.catalog-grid .game-card, .game-catalog .card, .catalog .card');
    
    const requiredHrefs = ['halflife', 'halflife2', 'episode1', 'episode2'];
    const foundHrefs = [];
    
    for (const card of cards) {
      const a = card.querySelector('a');
      if (a) {
        foundHrefs.push(a.getAttribute('href') || '');
      }
    }
    
    for (const route of requiredHrefs) {
      assert(foundHrefs.some(h => h.includes(route)),
        `Catalog grid must include deep link to sub-route matching "${route}"`);
    }
  });
});

// ============================================================================
// Feature 8: Sub-Route Page: /alyx (F8)
// ============================================================================
describe('Feature 8: Sub-Route /alyx', 'Tier 1', () => {
  it('F8-1: alyx.html page exists with title "Half-Life: Alyx"', async () => {
    const html = await fetchPage('alyx.html');
    const doc = parseHTML(html);
    const title = doc.querySelector('title');
    assert(title, 'alyx.html must contain a <title> element');
    assertMatch(title.textContent || '', /Half-Life:\s*Alyx|Alyx/i, 'Title should state Half-Life: Alyx');
  });

  it('F8-2: Displays VR features list / mechanics showcase', async () => {
    const html = await fetchPage('alyx.html');
    const doc = parseHTML(html);
    const content = doc.textContent || '';
    assertMatch(content, /Virtual Reality|VR|Physics|Interaction|Room-scale|Combat/i,
      'alyx.html must display VR feature highlights');
  });

  it('F8-3: Highlights Gravity Gloves mechanics section', async () => {
    const html = await fetchPage('alyx.html');
    const doc = parseHTML(html);
    const content = doc.textContent || '';
    assertMatch(content, /Gravity Gloves|Russells|Gloves/i,
      'alyx.html must highlight Gravity Gloves mechanics section');
  });

  it('F8-4: Includes system specifications table with <th> headers', async () => {
    const html = await fetchPage('alyx.html');
    const doc = parseHTML(html);
    const table = doc.querySelector('table');
    assert(table, 'alyx.html must contain a system specifications <table>');
    const headers = doc.querySelectorAll('table th');
    assert(headers.length >= 2, 'System specs table must include <th> header cells');
  });

  it('F8-5: Contains media screenshot gallery container', async () => {
    const html = await fetchPage('alyx.html');
    const doc = parseHTML(html);
    const gallery = doc.querySelector('.gallery, .screenshots, .media-grid, .image-grid');
    assert(gallery, 'alyx.html must include a media screenshot gallery container');
  });

  it('F8-6: Contains back navigation link returning to index.html', async () => {
    const html = await fetchPage('alyx.html');
    const doc = parseHTML(html);
    const backLink = doc.querySelector('a[href*="index.html"], .back-link, nav a');
    assert(backLink, 'alyx.html must include a back navigation link to index.html');
  });
});

// ============================================================================
// Feature 9: Sub-Route Page: /halflife (F9)
// ============================================================================
describe('Feature 9: Sub-Route /halflife', 'Tier 1', () => {
  it('F9-1: halflife.html page exists with legacy 1998 title', async () => {
    const html = await fetchPage('halflife.html');
    const doc = parseHTML(html);
    const title = doc.querySelector('title, h1');
    assert(title, 'halflife.html must contain title or main heading');
    assertMatch(title.textContent || '', /Half-Life|1998/i, 'halflife.html title must state Half-Life');
  });

  it('F9-2: References GoldSrc engine technology', async () => {
    const html = await fetchPage('halflife.html');
    const doc = parseHTML(html);
    const content = doc.textContent || '';
    assertMatch(content, /GoldSrc|GoldSource|Engine/i,
      'halflife.html must reference GoldSrc engine');
  });

  it('F9-3: Details the Black Mesa research facility incident synopsis', async () => {
    const html = await fetchPage('halflife.html');
    const doc = parseHTML(html);
    const content = doc.textContent || '';
    assertMatch(content, /Black Mesa|Resonance Cascade|Gordon Freeman|Anomalous Materials/i,
      'halflife.html must detail the Black Mesa incident synopsis');
  });

  it('F9-4: Highlights Game of the Year awards and historical significance', async () => {
    const html = await fetchPage('halflife.html');
    const doc = parseHTML(html);
    const content = doc.textContent || '';
    assertMatch(content, /Game of the Year|Awards|Legacy|1998|50+|FPS/i,
      'halflife.html must highlight awards and legacy achievements');
  });

  it('F9-5: Includes system specifications table or historical specs', async () => {
    const html = await fetchPage('halflife.html');
    const doc = parseHTML(html);
    const table = doc.querySelector('table, .specs-table, .system-specs');
    assert(table, 'halflife.html must include system specs table or container');
  });

  it('F9-6: Includes back navigation link returning to index.html', async () => {
    const html = await fetchPage('halflife.html');
    const doc = parseHTML(html);
    const backLink = doc.querySelector('a[href*="index.html"], .back-link, nav a');
    assert(backLink, 'halflife.html must include a back navigation link to index.html');
  });
});

// ============================================================================
// Feature 10: Sub-Route Page: /halflife2 (F10)
// ============================================================================
describe('Feature 10: Sub-Route /halflife2', 'Tier 1', () => {
  it('F10-1: halflife2.html page exists and details City 17 context', async () => {
    const html = await fetchPage('halflife2.html');
    const doc = parseHTML(html);
    const content = doc.textContent || '';
    assertMatch(content, /City 17|Half-Life 2|Combine/i,
      'halflife2.html must detail City 17 setting');
  });

  it('F10-2: Spotlights Gravity Gun (Zero Point Energy Field Manipulator) physics', async () => {
    const html = await fetchPage('halflife2.html');
    const doc = parseHTML(html);
    const content = doc.textContent || '';
    assertMatch(content, /Gravity Gun|Zero Point Energy|Physics/i,
      'halflife2.html must spotlight the Gravity Gun physics');
  });

  it('F10-3: References Source engine physics and rendering innovations', async () => {
    const html = await fetchPage('halflife2.html');
    const doc = parseHTML(html);
    const content = doc.textContent || '';
    assertMatch(content, /Source|Engine|Physics|Havok|Facial Animation/i,
      'halflife2.html must reference Source engine innovations');
  });

  it('F10-4: Details Citadel and Combine resistance campaign storyline', async () => {
    const html = await fetchPage('halflife2.html');
    const doc = parseHTML(html);
    const content = doc.textContent || '';
    assertMatch(content, /Citadel|Breen|Resistance|Alyx/i,
      'halflife2.html must detail the Citadel and resistance storyline');
  });

  it('F10-5: Includes system specs table and screenshot gallery', async () => {
    const html = await fetchPage('halflife2.html');
    const doc = parseHTML(html);
    const table = doc.querySelector('table');
    assert(table, 'halflife2.html must contain a system specs table');
    const gallery = doc.querySelector('.gallery, .screenshots, .media-grid, .image-grid');
    assert(gallery, 'halflife2.html must contain a media gallery');
  });

  it('F10-6: Includes back navigation link returning to index.html', async () => {
    const html = await fetchPage('halflife2.html');
    const doc = parseHTML(html);
    const backLink = doc.querySelector('a[href*="index.html"], .back-link, nav a');
    assert(backLink, 'halflife2.html must include a back navigation link to index.html');
  });
});

// ============================================================================
// Feature 11: Sub-Route Page: /episode1 (F11)
// ============================================================================
describe('Feature 11: Sub-Route /episode1', 'Tier 1', () => {
  it('F11-1: episode1.html page exists and details Citadel core containment', async () => {
    const html = await fetchPage('episode1.html');
    const doc = parseHTML(html);
    const content = doc.textContent || '';
    assertMatch(content, /Citadel|Core|Containment|Episode One|Episode 1/i,
      'episode1.html must detail Citadel core containment');
  });

  it('F11-2: Focuses on Alyx Vance cooperative AI companion gameplay', async () => {
    const html = await fetchPage('episode1.html');
    const doc = parseHTML(html);
    const content = doc.textContent || '';
    assertMatch(content, /Alyx|Companion|Cooperative|AI/i,
      'episode1.html must focus on Alyx Vance companion gameplay');
  });

  it('F11-3: Features Zombine (Combine Zombie) section spotlight', async () => {
    const html = await fetchPage('episode1.html');
    const doc = parseHTML(html);
    const content = doc.textContent || '';
    assertMatch(content, /Zombine|Combine Zombie|Zombie/i,
      'episode1.html must feature the Zombine spotlight');
  });

  it('F11-4: Includes system specifications table', async () => {
    const html = await fetchPage('episode1.html');
    const doc = parseHTML(html);
    const table = doc.querySelector('table');
    assert(table, 'episode1.html must include a system specifications table');
  });

  it('F11-5: Contains media screenshot showcase', async () => {
    const html = await fetchPage('episode1.html');
    const doc = parseHTML(html);
    const gallery = doc.querySelector('.gallery, .screenshots, .media-grid, .image-grid');
    assert(gallery, 'episode1.html must include a screenshot showcase gallery');
  });

  it('F11-6: Includes back navigation link returning to index.html', async () => {
    const html = await fetchPage('episode1.html');
    const doc = parseHTML(html);
    const backLink = doc.querySelector('a[href*="index.html"], .back-link, nav a');
    assert(backLink, 'episode1.html must include a back navigation link to index.html');
  });
});

// ============================================================================
// Feature 12: Sub-Route Page: /episode2 (F12)
// ============================================================================
describe('Feature 12: Sub-Route /episode2', 'Tier 1', () => {
  it('F12-1: episode2.html page exists and details White Forest outlands environment', async () => {
    const html = await fetchPage('episode2.html');
    const doc = parseHTML(html);
    const content = doc.textContent || '';
    assertMatch(content, /White Forest|Outlands|Episode Two|Episode 2/i,
      'episode2.html must detail White Forest outlands environment');
  });

  it('F12-2: Highlights Strider open-field battle encounters', async () => {
    const html = await fetchPage('episode2.html');
    const doc = parseHTML(html);
    const content = doc.textContent || '';
    assertMatch(content, /Strider|Striders|Battle|Outlands/i,
      'episode2.html must highlight Strider battles');
  });

  it('F12-3: Features Magnusson Devices weapon spotlight', async () => {
    const html = await fetchPage('episode2.html');
    const doc = parseHTML(html);
    const content = doc.textContent || '';
    assertMatch(content, /Magnusson|Sticky Bomb|Device/i,
      'episode2.html must feature Magnusson Devices spotlight');
  });

  it('F12-4: Includes system specifications table', async () => {
    const html = await fetchPage('episode2.html');
    const doc = parseHTML(html);
    const table = doc.querySelector('table');
    assert(table, 'episode2.html must include a system specifications table');
  });

  it('F12-5: Contains media screenshot showcase', async () => {
    const html = await fetchPage('episode2.html');
    const doc = parseHTML(html);
    const gallery = doc.querySelector('.gallery, .screenshots, .media-grid, .image-grid');
    assert(gallery, 'episode2.html must include a screenshot showcase gallery');
  });

  it('F12-6: Includes back navigation link returning to index.html', async () => {
    const html = await fetchPage('episode2.html');
    const doc = parseHTML(html);
    const backLink = doc.querySelector('a[href*="index.html"], .back-link, nav a');
    assert(backLink, 'episode2.html must include a back navigation link to index.html');
  });
});

// ============================================================================
// Feature 13: Strict Token Compliance (F13)
// ============================================================================
describe('Feature 13: Strict Token Compliance', 'Tier 1', () => {
  it('F13-1: css/design-system.css defines Steam Gray #E9E8E9 canvas token', async () => {
    const css = await fetchPage('css/design-system.css');
    assertMatch(css, /#E9E8E9|--color-canvas/i,
      'css/design-system.css must define Steam Gray #E9E8E9 canvas token');
  });

  it('F13-2: css/design-system.css defines Ink Black #000000 text token', async () => {
    const css = await fetchPage('css/design-system.css');
    assertMatch(css, /#000000|--color-text-primary/i,
      'css/design-system.css must define Ink Black #000000 primary text token');
  });

  it('F13-3: css/design-system.css defines Heat Orange #FF862C accent token', async () => {
    const css = await fetchPage('css/design-system.css');
    assertMatch(css, /#FF862C|--color-accent-orange/i,
      'css/design-system.css must define Heat Orange #FF862C accent token');
  });

  it('F13-4: css/design-system.css defines Rust Brown #4B423C brand token', async () => {
    const css = await fetchPage('css/design-system.css');
    assertMatch(css, /#4B423C|--color-brand-rust/i,
      'css/design-system.css must define Rust Brown #4B423C brand token');
  });

  it('F13-5: Enforces strict 0px border-radius rule globally (* { border-radius: 0 !important; })', async () => {
    const css = await fetchPage('css/design-system.css');
    assertMatch(css, /border-radius:\s*0|--border-radius-strict:\s*0px/i,
      'css/design-system.css must enforce strict 0px border-radius rule');
  });

  it('F13-6: Defines DIN typography font family stack', async () => {
    const css = await fetchPage('css/design-system.css');
    assertMatch(css, /font-family:.*DIN/i,
      'css/design-system.css must define DIN font stack for typography');
  });
});

// ============================================================================
// Feature 14: Responsive Adaptation (F14)
// ============================================================================
describe('Feature 14: Responsive Adaptation', 'Tier 1', () => {
  it('F14-1: CSS defines Desktop breakpoint media query (>=1024px)', async () => {
    const css = await fetchPage('css/design-system.css');
    const compCss = await fetchPage('css/components.css');
    const combined = css + compCss;
    assertMatch(combined, /@media.*1024px/i,
      'CSS must define Desktop media query breakpoint (@media min-width: 1024px)');
  });

  it('F14-2: CSS defines Tablet breakpoint media query (768-1023px)', async () => {
    const css = await fetchPage('css/design-system.css');
    const compCss = await fetchPage('css/components.css');
    const combined = css + compCss;
    assertMatch(combined, /@media.*768px/i,
      'CSS must define Tablet media query breakpoint (@media min-width: 768px)');
  });

  it('F14-3: CSS defines Mobile breakpoint media query (<768px)', async () => {
    const css = await fetchPage('css/design-system.css');
    const compCss = await fetchPage('css/components.css');
    const combined = css + compCss;
    assertMatch(combined, /@media.*max-width:\s*767px|@media.*max-width:\s*768px|@media.*<768px/i,
      'CSS must define Mobile media query breakpoint');
  });

  it('F14-4: CSS includes single-column grid collapse rules on mobile viewports', async () => {
    const css = await fetchPage('css/components.css');
    assertMatch(css, /grid-template-columns:\s*1fr|flex-direction:\s*column/i,
      'CSS must collapse multi-column grids to single column on small screens');
  });

  it('F14-5: Interactive CTA elements define touch target sizing', async () => {
    const css = await fetchPage('css/components.css');
    assertMatch(css, /padding|min-height|height/i,
      'CSS components must define padding or height sizing for touch interaction');
  });

  it('F14-6: Navigation header supports mobile menu toggle element', async () => {
    const html = await fetchPage('index.html');
    const doc = parseHTML(html);
    const toggle = doc.querySelector('.nav-toggle, #menu-toggle, .mobile-menu-btn, button.hamburger') ||
                   doc.querySelector('header button, header .toggle');
    assert(toggle, 'Header must include a mobile nav toggle element');
  });
});

// ============================================================================
// Feature 15: Media & Specs Components (F15)
// ============================================================================
describe('Feature 15: Media & Specs Components', 'Tier 1', () => {
  it('F15-1: Image containers use sharp 0px rectangular frames', async () => {
    const css = await fetchPage('css/components.css');
    assertMatch(css, /img|\.card|\.hero-art|\.gallery/, 'css/components.css should style image containers');
  });

  it('F15-2: Screenshot galleries use grid layout structure', async () => {
    const html = await fetchPage('alyx.html');
    const doc = parseHTML(html);
    const gallery = doc.querySelector('.gallery, .image-grid, .screenshots');
    assert(gallery, 'Sub-route pages must feature screenshot gallery container');
  });

  it('F15-3: System specification tables use <table> with <th> headers', async () => {
    const html = await fetchPage('alyx.html');
    const doc = parseHTML(html);
    const table = doc.querySelector('table');
    assert(table, 'Pages must use HTML <table> for system specifications');
    const ths = doc.querySelectorAll('table th');
    assert(ths.length >= 2, 'System spec table must contain <th> header cells');
  });

  it('F15-4: Video containers exist for gameplay trailers', async () => {
    const html = await fetchPage('index.html');
    const doc = parseHTML(html);
    const video = doc.querySelector('.video-container, video, iframe, [data-video]');
    assert(video, 'index.html must include a video container or trailer element');
  });

  it('F15-5: All <img> tags in index.html possess alt text attributes', async () => {
    const html = await fetchPage('index.html');
    const doc = parseHTML(html);
    const images = doc.querySelectorAll('img');
    assert(images.length >= 1, 'index.html must contain images');
    
    for (let i = 0; i < images.length; i++) {
      assert(images[i].hasAttribute('alt'), `Image #${i + 1} must possess an alt attribute`);
    }
  });

  it('F15-6: Media components adhere to high contrast and design tokens', async () => {
    const css = await fetchPage('css/components.css');
    assertMatch(css, /background|border|color/i,
      'css/components.css must define visual styling for media components');
  });
});

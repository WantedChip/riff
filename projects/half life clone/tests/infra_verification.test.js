const {
  describe,
  it,
  assert,
  assertEqual,
  assertIncludes,
  assertMatch,
  assertTrue,
  parseHTML,
  fetchPage
} = require('./utils/test_harness');

describe('Test Infrastructure Verification - Core DOM Parsing', 'Tier 1', () => {
  it('should parse HTML element hierarchy, classes, and IDs correctly', () => {
    const sampleHtml = `
      <header id="main-header" class="site-header nav-bar">
        <div class="logo">λ</div>
        <nav>
          <a href="index.html" class="nav-link active" data-i18n="nav.home">Home</a>
          <a href="alyx.html" class="nav-link" data-i18n="nav.alyx">Alyx</a>
        </nav>
      </header>
    `;
    const doc = parseHTML(sampleHtml);

    const header = doc.getElementById('main-header');
    assert(header !== null, 'Header element should be found by ID');
    assertEqual(header.tagName, 'HEADER');
    assertTrue(header.classList.contains('site-header'));
    assertTrue(header.classList.contains('nav-bar'));

    const activeLink = doc.querySelector('nav a.active');
    assert(activeLink !== null, 'Active link should be matched');
    assertEqual(activeLink.textContent, 'Home');
    assertEqual(activeLink.getAttribute('href'), 'index.html');
    assertEqual(activeLink.getAttribute('data-i18n'), 'nav.home');

    const navLinks = doc.querySelectorAll('a.nav-link');
    assertEqual(navLinks.length, 2, 'Should find 2 nav links');
  });

  it('should support attribute operator queries', () => {
    const sampleHtml = `
      <div id="catalog">
        <article class="game-card" data-game="halflife1">HL1</article>
        <article class="game-card" data-game="halflife2">HL2</article>
      </div>
    `;
    const doc = parseHTML(sampleHtml);
    const card = doc.querySelector('[data-game="halflife2"]');
    assert(card !== null, 'Card with data-game="halflife2" should be found');
    assertEqual(card.textContent, 'HL2');
  });
});

describe('Test Infrastructure Verification - Fallback & Error Resilience', 'Tier 2', () => {
  it('should handle missing elements gracefully', () => {
    const doc = parseHTML('<section><h1>Title</h1></section>');
    const missing = doc.querySelector('.non-existent');
    assertEqual(missing, null, 'Non-existent selector should return null');
  });
});

describe('Test Infrastructure Verification - Combination Queries', 'Tier 3', () => {
  it('should support complex combinator queries', () => {
    const html = `
      <main>
        <section class="hero">
          <div class="content">
            <h1>Half-Life: Alyx</h1>
          </div>
        </section>
      </main>
    `;
    const doc = parseHTML(html);
    const h1 = doc.querySelector('main section.hero .content h1');
    assert(h1 !== null, 'Deep nested descendant selector should match');
    assertEqual(h1.textContent, 'Half-Life: Alyx');
  });
});

describe('Test Infrastructure Verification - Harness API Integrity', 'Tier 4', () => {
  it('should execute assertions without errors when valid', () => {
    assertIncludes('Half-Life Franchise', 'Half-Life', 'String inclusion check');
    assertMatch('Steam Gray #E9E8E9', /#E9E8E9/, 'Regex match check');
  });
});

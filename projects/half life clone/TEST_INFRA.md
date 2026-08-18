# Test Infrastructure & Opaque-Box Test Architecture

## 1. Overview & Architecture

This document defines the automated test architecture and verification strategy for the **Half-Life Franchise Website**.

The testing paradigm is **opaque-box testing**. Tests execute without internal coupling to implementation details beyond standard Web / HTML5 DOM contracts and design system CSS token definitions. The test runner operates as a pure CLI test tool executing in Node.js.

### Core Architectural Components

1. **Main Test Runner (`tests/run_e2e_tests.js`)**:
   - CLI entry point executed via `node tests/run_e2e_tests.js`.
   - Dynamically scans `tests/` directory for `*.test.js` files.
   - Executes registered test suites across 4 distinct testing tiers.
   - Aggregates pass/fail statistics, execution timing, and detailed error trace reports.
   - Exits with `code 0` on 100% pass rate or `code 1` on any failure.

2. **Test Harness & DOM Environment (`tests/utils/test_harness.js`)**:
   - Provides HTTP fetcher and local filesystem fallback loader to inspect static pages (`index.html`, `alyx.html`, `halflife.html`, `halflife2.html`, `episode1.html`, `episode2.html`), CSS files (`css/design-system.css`, `css/components.css`), and JavaScript modules (`js/i18n.js`, `js/main.js`).
   - Integrates JSDOM (when available) or a built-in Node.js HTML/DOM parser providing a browser-like DOM query API (`querySelector`, `querySelectorAll`, `getAttribute`, `textContent`, `classList`, `hasAttribute`, `children`, etc.).
   - Standardized assertions (`assert`, `assertEqual`, `assertIncludes`, `assertMatch`, `assertNotEqual`, `assertTrue`, `assertFalse`).
   - Suite and test registration interface with tier tagging (`Tier 1`, `Tier 2`, `Tier 3`, `Tier 4`).

---

## 2. Feature Inventory & Requirement Mapping

The test infrastructure covers all 15 core features (F1–F15) linked to project requirements (R1–R6):

| Feature ID | Feature Name | Description | Related Requirement | Milestone |
|------------|--------------|-------------|---------------------|-----------|
| **F1** | Brand Navigation Header | Top industrial header featuring Lambda logo (`λ`), brand title, primary nav links, active route highlight. | R1 | M1 |
| **F2** | Multi-Language Switcher | Interactive language switcher with 6 languages (`en`, `fr`, `de`, `es`, `ja`, `zh`). | R1 | M1 |
| **F3** | i18n State Persistence | Persistence via `localStorage` (`hl_lang`), URL parameter (`?lang=`), dynamic DOM update (`data-i18n`). | R1 | M1 |
| **F4** | Half-Life: Alyx Hero | Prominent VR hero with key art, 40px DIN headline, VR specs badges, Steam CTAs. | R2 | M2 |
| **F5** | HL2 20th Anniversary Block | Editorial promo block highlighting dev commentary, Steam Workshop, visual upgrades, Secret Tape doc. | R3 | M2 |
| **F6** | Franchise Overview Narrative | Historical narrative tracing saga from Black Mesa (1998) to City 17 and Resistance. | R4 | M2 |
| **F7** | Game Catalog Cards Grid | 4 sharp 0px rectangular cards for HL1, HL2, EP1, EP2 with cover art, release tags, deep links. | R4 | M2 |
| **F8** | Sub-Route Page: `/alyx` | Detailed *Half-Life: Alyx* page with Gravity Gloves highlights, VR mechanics, specs table, gallery. | R5 | M3 |
| **F9** | Sub-Route Page: `/halflife` | Legacy *Half-Life (1998)* page, Black Mesa incident, GoldSrc engine, awards. | R5 | M3 |
| **F10** | Sub-Route Page: `/halflife2` | *Half-Life 2 (2004)* page, City 17, Gravity Gun, Source engine physics, Citadel. | R5 | M3 |
| **F11** | Sub-Route Page: `/episode1` | *Episode One* page, Citadel core containment, Alyx AI companion, Zombine. | R5 | M3 |
| **F12** | Sub-Route Page: `/episode2` | *Episode Two* page, White Forest outlands, Strider battles, Magnusson Devices. | R5 | M3 |
| **F13** | Strict Token Compliance | Canvas `#E9E8E9`, Text `#000000`, Heat Orange `#FF862C`, Rust Brown `#4B423C`, strict `0px` border-radius reset (`* { border-radius: 0 !important; box-shadow: none !important; }`). | R6 | M1 |
| **F14** | Responsive Adaptation | Adapts across Desktop (≥1024px), Tablet (768-1023px), Mobile (<768px) breakpoints without horizontal overflow. | Acceptance Criteria | M1-M3 |
| **F15** | Media & Specs Components | Sharp 0px image frames, screenshot galleries, system specification tables, video containers. | half-life-com-design.md | M1-M3 |

---

## 3. 4-Tier Test Breakdown & Coverage Goals

### Tier 1: Feature Coverage (Unit & Component Level Verification)
- **Goal**: 100% verification of discrete HTML structural requirements, CSS token declarations, and JS i18n dictionary completeness.
- **Scope**:
  - HTML structure verification across all 6 pages (`index.html`, `alyx.html`, `halflife.html`, `halflife2.html`, `episode1.html`, `episode2.html`).
  - Presence of semantic elements: `<header>`, `<nav>`, `<main>`, `<section>`, `<footer>`, `<article>`, `<table>`.
  - CSS custom property declarations in `css/design-system.css` (`--color-canvas: #E9E8E9`, `--color-accent-orange: #FF862C`, `--color-text-primary: #000000`, `--color-brand-rust: #4B423C`, `--border-radius-strict: 0px`).
  - Presence of strict `0px` border-radius reset (`* { border-radius: 0 !important; }`).
  - JS `i18n.js` key completeness across all 6 supported locales (`en`, `fr`, `de`, `es`, `ja`, `zh`).

### Tier 2: Boundary & Corner Cases (Edge Cases & Resilience)
- **Goal**: Ensure robustness when encountering unusual user states, missing/invalid parameters, or fallback conditions.
- **Scope**:
  - Unsupported locale code in URL (e.g. `?lang=invalid` or `?lang=123`) falls back gracefully to `en`.
  - Missing `localStorage` or restricted storage permissions handles errors without crashing execution.
  - Links without sub-route extensions or relative navigation paths resolve cleanly.
  - Image fallback and `alt` attribute presence on all image frames.
  - Empty or unexpected `data-i18n` keys fail safely without breaking page rendering.

### Tier 3: Cross-Feature Combinations (Integration Verification)
- **Goal**: Verify multi-feature interactions, such as language state persistence across page navigation, design token application on interactive states, and active link indication.
- **Scope**:
  - Language switching in navigation header updates page text across Hero, Franchise Overview, Catalog, and Footer simultaneously.
  - Persistence test: Setting language on `index.html` preserves language when navigating to `/alyx` or `/halflife2`.
  - Active route highlighting: Active nav link has CSS class `active` and Heat Orange styling on matching route URL.
  - Responsive media containers maintain 0px sharp geometry while scaling inside card grids.

### Tier 4: Real-World Scenarios (End-to-End User Journeys)
- **Goal**: Validate complete end-to-end user navigation flows and full site experience.
- **Scope**:
  - User Journey 1: User lands on `index.html`, switches language to French (`fr`), views Alyx hero section, clicks Alyx CTA link, lands on `alyx.html` with French content preserved and back link returning to `index.html`.
  - User Journey 2: User explores game catalog, clicks Half-Life 2 card, reads City 17 and Source engine specs on `halflife2.html`, switches language to German (`de`), verifies spec table headers are translated, and navigates to `episode1.html`.
  - User Journey 3: User accesses site on mobile viewport, opens mobile nav toggle, selects Spanish (`es`), browses 20th Anniversary editorial block and Secret Tape documentary section.

---

## 4. Test Harness API (`tests/utils/test_harness.js`)

The test harness exposes a clean, modular API:

```javascript
const {
  describe,
  it,
  assert,
  assertEqual,
  assertIncludes,
  assertMatch,
  assertNotEqual,
  assertTrue,
  assertFalse,
  parseHTML,
  fetchPage,
  runSuites
} = require('./utils/test_harness');
```

- **`parseHTML(htmlString)`**: Returns a DOM document interface with `querySelector`, `querySelectorAll`, `getElementById`, `getElementsByClassName`, `textContent`, `getAttribute`, `classList`, etc.
- **`fetchPage(pathOrUrl)`**: Asynchronously fetches or loads a local file/page, returning HTML text.
- **`describe(suiteName, tier, fn)`**: Registers a test suite tagged with a tier (e.g. `Tier 1`, `Tier 2`, `Tier 3`, `Tier 4`).
- **`it(testName, async () => { ... })`**: Registers a test case within a suite.
- **Assertions**: Standardized assertions with detailed error messages on mismatch.

---

## 5. Execution Command & CLI Standards

To execute the test suite:
```bash
node tests/run_e2e_tests.js
```

### CLI Output Format
```
======================================================================
 HALF-LIFE FRANCHISE WEBSITE - E2E TEST RUNNER
======================================================================

[Tier 1: Feature Coverage]
  ✓ Navigation Header - Contains Lambda logo and primary links
  ✓ Alyx Hero Section - Displays DIN headline and VR CTAs
  ✓ Design System Tokens - Canvas #E9E8E9 and Strict 0px Reset

[Tier 2: Boundary & Corner Cases]
  ✓ i18n Fallback - Invalid language defaults to English
  ✓ Image Attributes - All images have non-empty alt attributes

...

----------------------------------------------------------------------
 SUMMARY:
  Total Suites : 8
  Total Tests  : 35
  Passed       : 35
  Failed       : 0
  Duration     : 42ms
======================================================================
 Status: PASSED (100% Pass Rate)
```

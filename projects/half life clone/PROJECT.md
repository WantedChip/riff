# Project: Half-Life Franchise Website

## Architecture
- **Tech Stack**: Pure Static HTML5, CSS3 (CSS Custom Properties), Vanilla ES6 JavaScript (Zero external runtime dependencies).
- **Page Structure**:
  - `index.html`: Main franchise landing portal (Header, Alyx Hero, 20th Anniversary Feature, Franchise Overview, Catalog Grid, Footer).
  - `alyx.html`: Dedicated *Half-Life: Alyx* product page.
  - `halflife.html`: Dedicated *Half-Life (1998)* legacy product page.
  - `halflife2.html`: Dedicated *Half-Life 2 (2004)* product page.
  - `episode1.html`: Dedicated *Half-Life 2: Episode One* product page.
  - `episode2.html`: Dedicated *Half-Life 2: Episode Two* product page.
- **Styling Architecture**:
  - `css/design-system.css`: Core design tokens (Steam Gray `#E9E8E9`, Ink Black `#000000`, Heat Orange `#FF862C`, Rust Brown `#4B423C`, Soft Pink `#F0A2A3`), DIN typography hierarchy, 4px grid spacing, global strict `0px` border-radius reset (`* { border-radius: 0 !important; box-shadow: none !important; }`).
  - `css/components.css`: Header navigation, brand logo, hero blocks, editorial grids, catalog cards, specs tables, media containers, and footer styles.
- **Internationalization (i18n)**:
  - `js/i18n.js`: Central dictionary for 6 languages (EN, FR, DE, ES, JA, ZH) mapping `data-i18n` keys to translated strings, URL parameter `?lang=` reading, and `localStorage` key `hl_lang` persistence across sub-routes.
  - `js/main.js`: Mobile nav toggle, active route highlighting, video modal triggers.
- **Serving & Testing**:
  - Served via `python -m http.server 8000` or native browser loading.
  - Opaque-box automated verification via Node.js fetch runner.

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | Brand Navigation Header | Industrial top header with Lambda logo (`λ`), brand title, primary nav links, and active indicator. | M1 | ORIGINAL_REQUEST R1 |
| 2 | Multi-Language Switcher | Custom 0px dropdown selector with support for 6 languages (EN, FR, DE, ES, JA, ZH). | M1 | ORIGINAL_REQUEST R1 |
| 3 | i18n State Persistence | Saves language choice in `localStorage` (`hl_lang`) & applies dynamically to DOM (`data-i18n`) across all pages. | M1 | ORIGINAL_REQUEST R1 |
| 4 | Half-Life: Alyx Hero | Prominent VR flagship showcase with key art, 40px DIN headline, VR specs badges, and Steam CTAs. | M2 | ORIGINAL_REQUEST R2 |
| 5 | HL2 20th Anniversary Block | Editorial promo block highlighting dev commentary, Steam Workshop, visual upgrades, and Secret Tape doc. | M2 | ORIGINAL_REQUEST R3 |
| 6 | Franchise Overview Narrative | Comprehensive historical narrative tracing the saga from Black Mesa (1998) to City 17 and Resistance. | M2 | ORIGINAL_REQUEST R4 |
| 7 | Game Catalog Cards Grid | 4 sharp 0px rectangular cards for HL1, HL2, EP1, EP2 with cover art, release tags, and deep links. | M2 | ORIGINAL_REQUEST R4 |
| 8 | Sub-Route Page: `/alyx` | Detailed product page for Half-Life: Alyx with Gravity Gloves features, VR mechanics, specs table, and gallery. | M3 | ORIGINAL_REQUEST R5 |
| 9 | Sub-Route Page: `/halflife` | Legacy product page for Half-Life (1998) detailing Black Mesa incident, GoldSrc engine, and awards. | M3 | ORIGINAL_REQUEST R5 |
| 10 | Sub-Route Page: `/halflife2` | Product page for Half-Life 2 (2004) detailing City 17, Gravity Gun, Source engine physics, and Citadel. | M3 | ORIGINAL_REQUEST R5 |
| 11 | Sub-Route Page: `/episode1` | Product page for Episode One detailing Citadel core containment, Alyx AI companion, Zombine. | M3 | ORIGINAL_REQUEST R5 |
| 12 | Sub-Route Page: `/episode2` | Product page for Episode Two detailing White Forest outlands, Strider battles, Magnusson Devices. | M3 | ORIGINAL_REQUEST R5 |
| 13 | Strict Token Compliance | Enforces Steam Gray canvas `#E9E8E9`, Ink Black `#000000`, Heat Orange `#FF862C`, DIN font stack, 4px grid, and strict `0px` radius. | M1 | ORIGINAL_REQUEST R6 |
| 14 | Responsive Adaptation | Adapts cleanly across Desktop (≥1024px), Tablet (768px-1023px), and Mobile (<768px) breakpoints. | M1, M2, M3 | ORIGINAL_REQUEST Acceptance Criteria |
| 15 | Media & Specs Components | Sharp 0px image frames, screenshot galleries, system specification tables, and interactive video containers. | M1, M2, M3 | half-life-com-design.md |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Core Foundation & Design System | Design tokens CSS (`css/design-system.css`), components CSS (`css/components.css`), i18n engine (`js/i18n.js`), main JS (`js/main.js`), header navigation, language switcher, assets (SVG icons & placeholders). | None | DONE |
| M2 | Homepage Core Sections | Main homepage (`index.html`) integrating Alyx Hero, 20th Anniversary Editorial Block, Franchise Overview, and 4 Catalog Cards. | M1 | IN_PROGRESS |
| M3 | Sub-Routes Product Pages | Dedicated pages for `/alyx` (`alyx.html`), `/halflife` (`halflife.html`), `/halflife2` (`halflife2.html`), `/episode1` (`episode1.html`), `/episode2` (`episode2.html`). | M1 | IN_PROGRESS |
| M4 | Final Integration & E2E Validation | Pass 100% E2E test suite (Tiers 1-4) published in `TEST_READY.md`, followed by Tier 5 adversarial coverage hardening. | M1, M2, M3, E2E Track | PLANNED |

## Interface Contracts

### 1. i18n Data Contract (`js/i18n.js`)
- **Key Attribute**: Elements requiring dynamic translation must specify `data-i18n="section.key"`.
- **Global API**: `window.HL_i18n = { currentLang: 'en', setLanguage(langCode), getTranslation(key), init() }`.
- **Supported Languages**: `['en', 'fr', 'de', 'es', 'ja', 'zh']`.
- **Storage Key**: `localStorage.getItem('hl_lang')` and `localStorage.setItem('hl_lang', code)`.
- **URL Parameter**: `?lang=code` overrides storage on load.
- **HTML Element**: Sets `<html lang="code">` on update.

### 2. Navigation Contract
- Top header nav links point to relative URLs: `index.html`, `alyx.html`, `halflife.html`, `halflife2.html`, `episode1.html`, `episode2.html`.
- Active route element has class `active` with solid Heat Orange `#FF862C` indicator bar.
- Back navigation links on sub-routes point to `index.html`.

### 3. Visual Tokens Contract (`css/design-system.css`)
- `--color-canvas`: `#E9E8E9`
- `--color-text-primary`: `#000000`
- `--color-accent-orange`: `#FF862C`
- `--color-brand-rust`: `#4B423C`
- `--color-border-pink`: `#F0A2A3`
- `--border-radius-strict`: `0px`
- Global Rule: `* { border-radius: 0 !important; box-shadow: none !important; }`

## Code Layout
```
c:/Users/Dev3/Documents/workspace/mockup site/
├── PROJECT.md
├── index.html            [M2]
├── alyx.html             [M3]
├── halflife.html         [M3]
├── halflife2.html        [M3]
├── episode1.html         [M3]
├── episode2.html        [M3]
├── css/
│   ├── design-system.css [M1]
│   └── components.css    [M1]
├── js/
│   ├── i18n.js           [M1]
│   └── main.js           [M1]
└── assets/
    ├── icons/            [M1]
    └── images/           [M1]
```

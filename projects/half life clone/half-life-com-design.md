# Design System: Half-Life

## 1. Visual Theme & Atmosphere

The Half-Life site presents a bold, game-forward promotional aesthetic with a restrained retro-industrial edge. It feels like a high-energy franchise landing page rather than a soft marketing site: large imagery, strong contrast, minimal ornament, and a practical layout built around game announcements and key links.

- Overall feeling: dramatic, promotional, and franchise-driven
- Visual density: medium; content is stacked and text-heavy, but broken up by large hero art and game cards
- Brand posture: confident, legacy-heavy, and gamer-oriented
- Signature motifs: stark typographic hierarchy, cover art tiles, orange link accents, and a light neutral canvas

### Key Characteristics

- Large headline-led sections with strong editorial weight
- Simple, flat surfaces with almost no rounding
- Orange as the primary interactive and emphasis color
- Franchise cover art and hero imagery as the main visual anchors

## 2. Color Palette & Roles

| Role | Semantic Name | Value | Usage |
| --- | --- | --- | --- |
| Primary action | Rust Brown | #4B423C | Primary brand tone, likely used for strong brand elements or dark UI accents |
| Accent | Heat Orange | #FF862C | Links, calls to action, and interactive emphasis |
| Surface | Steam Gray | #E9E8E9 | Main page background and neutral content surface |
| Text | Ink Black | #000000 | Primary body and heading text |
| Border | Soft Pink | #F0A2A3 | Secondary accent/border-like color, likely used sparingly or as a thematic highlight |

### Primary

- Rust Brown (#4B423C) as the main brand anchor color
- Heat Orange (#FF862C) as the dominant action and link color

### Interactive

- Links use Heat Orange (#FF862C)
- Hover states are likely subtle and high-contrast rather than decorative; evidence suggests a utilitarian, direct interaction model
- Focus states should remain visible and simple, consistent with the site’s flat visual language

### Neutral Scale

- Steam Gray (#E9E8E9) is the principal neutral background
- Ink Black (#000000) provides maximum contrast for copy
- No full neutral ramp is provided in the evidence; additional neutrals should be inferred conservatively if needed

### Surface & Overlay

- Surface token: Steam Gray (#E9E8E9)
- Overlay token: No explicit overlay color is evidenced; use translucent black or dark neutral overlays only if required by implementation, and treat as an inference

### Theme Modes

The site is documented as **light mode only** in the available branding evidence.

#### Light Mode

- Background: #E9E8E9
- Surface: #E9E8E9
- Text: #000000
- Accent: #FF862C
- Notes: The palette is bright but muted, with a nostalgic industrial feel rather than a glossy game-launch look

#### Dark Mode

- Background: Not evidenced
- Surface: Not evidenced
- Text: Not evidenced
- Accent: Not evidenced
- Notes: No dark theme is supported by the provided evidence

### Shadows & Depth

- Border/ring treatment: minimal; the design appears mostly flat with little reliance on borders
- Card shadow stack: not evidenced; cards likely depend on image framing and spacing instead of elevation
- Focus treatment: should be obvious and functional, but not ornamental; use a clear ring or outline in an accent or dark neutral

## 3. Typography Rules

The site uses DIN across body and heading roles, creating a unified, functional, slightly technical tone.

### Font Family

- Primary: DIN
- Monospace: Not evidenced
- OpenType Features: Not evidenced; assume standard sans-serif behavior unless live CSS suggests otherwise

### Hierarchy

| Role | Font | Size | Weight | Line Height | Letter Spacing | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| Hero headline | DIN | 40px | Not evidenced | Not evidenced | Not evidenced | Used for major announcements and top-level franchise messaging |
| Section heading | DIN | 40px | Not evidenced | Not evidenced | Not evidenced | Section titles appear to share the same prominent scale as hero headlines |
| Body | DIN | 18px | Not evidenced | Not evidenced | Not evidenced | Core descriptive copy and game summaries |
| Label / Eyebrow | DIN | Not evidenced | Not evidenced | Not evidenced | Not evidenced | Use for small navigational or supporting labels if needed |
| Caption / Meta | DIN | Not evidenced | Not evidenced | Not evidenced | Not evidenced | Likely small helper text or metadata, but not explicitly evidenced |

### Principles

- Keep typography bold and direct, with little stylistic flourish
- Use large, statement-like headings to support franchise marketing
- Maintain strong readability and minimal typographic complexity

## 4. Component Stylings

### Buttons and Links

- Primary CTA: orange text or orange-linked action, likely with minimal chrome
- Secondary CTA: not explicitly evidenced; if needed, use neutral text or outline treatment
- Text links: Heat Orange (#FF862C), visually prominent and likely underlined only when needed for clarity
- Hover and active feel: direct and high-contrast, with no evidence of heavy animation

### Cards and Containers

- Surface style: flat image-and-text cards for game entries
- Radius: 0px, based on branding data
- Border: minimal or absent
- Shadow or elevation: not evidenced; the layout likely relies on spacing and strong imagery
- Internal spacing: moderate, with clear separation between cover art and descriptive copy

### Inputs and Interactive Controls

- Input treatment: not evidenced from page content
- Focus behavior: should be visible and functional, likely via outline or ring
- Selection states: not evidenced; keep states simple and high-contrast

### Navigation

- Structure: lightweight top-level navigation with language switching and homepage branding
- Background treatment: flat light background
- Link style: text-forward, utilitarian, and likely orange for interactive items
- Sticky or scroll behavior: not evidenced

### Image Treatment

- Screenshot treatment: wide hero imagery and rectangular cover art tiles
- Photography or illustration style: game art and key art dominate; no lifestyle photography evidence
- Border and radius treatment: squared edges, matching the 0px radius system

### Distinctive Components

- Franchise announcement hero with game art and strong headline
- Game catalog cards pairing cover art with summary text
- Anniversary update feature blocks that function like editorial promos

## 5. Layout Principles

### Spacing System

- Base unit: 4px
- Repeated spacing values: multiples of 4px, likely 8px, 16px, 24px, 32px, and beyond

### Grid & Container

- Grid logic: content is arranged in a stacked editorial flow with card-based sections
- Max content width: not evidenced
- Section spacing: generous enough to separate major announcements, but not airy or minimalist

### Whitespace Philosophy

- Whitespace philosophy: functional rather than decorative
- Alignment tendencies: left-aligned, content-first, and straightforward
- Content width behavior: text blocks are readable but not overly narrow; layout prioritizes scannability

### Border Radius Scale

- Micro: 0px
- Standard: 0px
- Large: 0px
- Pill: not evidenced; if used, it would be an exception rather than the default

## 6. Depth & Elevation

| Level | Treatment | Use |
| --- | --- | --- |
| Flat | Plain light surface with no visible elevation | Default page and section background |
| Ring | Minimal or no border; use subtle outline only if needed | Separation in forms or accessibility focus |
| Card | Flat rectangular tile with image and text | Game listings and feature promos |
| Focus | High-contrast outline or ring | Keyboard navigation and inputs |

### Depth Principles

- Surface hierarchy: shallow and mostly flat
- Shadow language: shadows are not a defining feature in the evidence
- Blur, glass, or overlay behavior: not evidenced
- When depth is used versus avoided: depth is avoided unless it supports content separation or accessibility

## 7. Do's and Don'ts

### Do

- Use DIN for both headings and body to preserve the brand’s unified voice
- Keep layouts flat, rectangular, and image-led
- Use Heat Orange (#FF862C) for links and interactive emphasis

### Don't

- Don’t introduce rounded corners or soft card styling
- Don’t overuse shadows, gradients, or glossy effects
- Don’t dilute the bold editorial hierarchy with too many type styles

## 8. Responsive Behavior

### Breakpoints

| Name | Width | Key Changes |
| --- | --- | --- |
| Mobile | Not evidenced | Stack content vertically, preserve readable type, and keep tap targets large |
| Tablet | Not evidenced | Maintain card stacks with moderate column expansion where appropriate |
| Desktop | Not evidenced | Use wider promotional imagery and fuller content blocks |

### Touch Targets

- Keep interactive targets large enough for gaming-site browsing on mobile and tablet
- Ensure links and language controls remain easy to tap despite the minimal visual treatment

### Collapsing Strategy

- Desktop behavior: likely multi-section promotional layout with wide imagery and side-by-side content where possible
- Tablet behavior: reduce columns before shrinking typography too aggressively
- Mobile behavior: collapse to a single column and preserve image prominence
- Breakpoint-driven component changes: promote stacked cards and maintain headline clarity
- Touch target and spacing adjustments: expand vertical spacing around links and controls on smaller screens

## 9. Agent Prompt Guide

### Quick Color Reference

- Primary CTA: #FF862C
- Background: #E9E8E9
- Heading text: #000000
- Body text: #000000
- Border or ring: #F0A2A3
- Accent: #FF862C

### Quick Summary

Half-Life uses a light, flat, game-promotional design system built on DIN typography, squared geometry, and a minimal industrial palette.  
The core surface is a muted gray background with black text and orange interactive accents.  
Headlines are large and direct, with a strong editorial hierarchy.  
Cards and promotional blocks rely on cover art rather than shadows or decorative effects.  
Corners are square, spacing is measured in 4px increments, and depth is intentionally restrained.  
The overall tone is bold, energetic, and franchise-focused.

### Example Component Prompts

- Hero: Create a full-width game announcement hero on a light gray background with a large DIN headline, short supporting copy, and a prominent orange text CTA.
- Card: Design a rectangular game card with square corners, a cover-art image on top, and a black text description underneath.
- Navigation: Build a minimal top navigation with a homepage logo and simple text links, using orange for active or hover states.
- Button or badge: Use a flat, text-forward orange action label with no rounding and no heavy shadow.

### Ready-to-Use Prompt

Design a Half-Life-style landing page using a light gray background, black DIN typography, orange link accents, square-edged cards, and a bold editorial layout centered on franchise announcements and game cover art.

### Iteration Guide

1. Keep the layout flat, functional, and image-led.
2. Preserve the orange accent only for emphasis and interaction.
3. Avoid rounded corners, shadows, and overly decorative UI treatments.

## Optional Appendix: Interaction Patterns

- Scroll behavior: not evidenced
- Hover behavior: likely subtle, mostly color-based
- Click behavior: direct navigation to game pages and promotional content
- Animation tone: not evidenced; assume minimal and restrained

## Optional Appendix: Content & Messaging Patterns

- Headline pattern: announcement-style headlines with franchise authority
- CTA language: action-oriented and concise
- Trust signal pattern: anniversary updates, legacy references, and original developer mentions
- Voice and tone: bold, factual, and celebratory

## Optional Appendix: Observed Pages

- Home page: Featured Alyx promo, Half-Life 2 20th Anniversary Update, Half-Life saga overview, and game entry cards
- /en/alyx: Full-length VR entry promotion and synopsis
- /en/halflife: Original Half-Life product summary
- /en/halflife2: Half-Life 2 product summary
- /en/episode1: Half-Life 2: Episode 1 product summary
- /en/episode2: Half-Life 2: Episode 2 product summary
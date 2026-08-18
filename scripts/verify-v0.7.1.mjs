#!/usr/bin/env node

/**
 * ==============================================================================
 * Sub-phase v0.7.1 Verification Script: Engineering Footer Component
 * ==============================================================================
 *
 * Verifies:
 * 1. File Integrity & Build Pipeline:
 *    - landing/index.html, landing/404.html, and landing/style.css exist
 *    - landing/LICENSE and dist/LICENSE exist with valid MIT license text
 *    - Monorepo compiler produces up-to-date dist/ artifacts
 * 2. Footer Semantic HTML Structure & Accessibility:
 *    - <footer role="contentinfo" class="site-footer">
 *    - Brand copyright: "© 2026 Riff by sohamlabs"
 *    - MIT License link targeting "./LICENSE" or "/LICENSE"
 *    - Edge hosting notice: "Hosted on Cloudflare Workers Static Assets"
 *    - Trademark disclaimer: "No attribution implied or given. All trademarks and original designs belong to their respective owners."
 *    - Checked across landing/index.html, dist/index.html, landing/404.html, dist/404.html
 * 3. CSS Tokens & Precision Styling:
 *    - Border-top: 1px solid var(--border-subtle)
 *    - Typography: 13px (0.8125rem), var(--text-muted: #68738B)
 *    - Links: color transition, hover state with var(--text-primary) & underline
 *    - Edge hosting indicator badge with emerald status dot
 *    - Responsive flex layout and mobile stacking breakpoints (768px & 480px)
 * 4. Live Dev Server HTTP & Asset Verification:
 *    - Dev server serves / with complete footer markup
 *    - Dev server serves /404.html with complete footer markup
 *    - Dev server serves /LICENSE with MIT license text
 * ==============================================================================
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import http from 'node:http';
import { startServer, build } from './script.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

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

async function runTests() {
  console.log('\n============================================================');
  console.log('  v0.7.1 Engineering Footer Component Verification');
  console.log('============================================================\n');

  // 1. Monorepo Compilation
  console.log('1. Compiling Monorepo Build Pipeline via build()...');
  const buildResult = await build();
  assert(Boolean(buildResult && buildResult.projectManifests), 'Monorepo compiles cleanly with project manifests');

  // 2. File Existence & Integrity Check
  console.log('\n2. Verifying File Existence & Structure...');
  const files = [
    ['landing/index.html', path.join(ROOT_DIR, 'landing', 'index.html')],
    ['dist/index.html', path.join(ROOT_DIR, 'dist', 'index.html')],
    ['landing/404.html', path.join(ROOT_DIR, 'landing', '404.html')],
    ['dist/404.html', path.join(ROOT_DIR, 'dist', '404.html')],
    ['landing/style.css', path.join(ROOT_DIR, 'landing', 'style.css')],
    ['dist/style.css', path.join(ROOT_DIR, 'dist', 'style.css')],
    ['landing/LICENSE', path.join(ROOT_DIR, 'landing', 'LICENSE')],
    ['dist/LICENSE', path.join(ROOT_DIR, 'dist', 'LICENSE')],
  ];

  for (const [name, p] of files) {
    assert(fs.existsSync(p), `${name} exists`);
  }

  const landingIndexHtml = fs.readFileSync(path.join(ROOT_DIR, 'landing', 'index.html'), 'utf-8');
  const distIndexHtml = fs.readFileSync(path.join(ROOT_DIR, 'dist', 'index.html'), 'utf-8');
  const landing404Html = fs.readFileSync(path.join(ROOT_DIR, 'landing', '404.html'), 'utf-8');
  const dist404Html = fs.readFileSync(path.join(ROOT_DIR, 'dist', '404.html'), 'utf-8');
  const landingCss = fs.readFileSync(path.join(ROOT_DIR, 'landing', 'style.css'), 'utf-8');
  const distCss = fs.readFileSync(path.join(ROOT_DIR, 'dist', 'style.css'), 'utf-8');
  const distLicense = fs.readFileSync(path.join(ROOT_DIR, 'dist', 'LICENSE'), 'utf-8');

  assert(distLicense.includes('MIT License') && distLicense.includes('Copyright (c) 2026 WantedChip'), 'dist/LICENSE contains valid MIT License text');

  // 3. Footer HTML Structure & WCAG 2.2 AA Accessibility
  console.log('\n3. Auditing Footer HTML Structure across Landing & 404 Pages...');
  const htmlPages = [
    ['landing/index.html', landingIndexHtml],
    ['dist/index.html', distIndexHtml],
    ['landing/404.html', landing404Html],
    ['dist/404.html', dist404Html]
  ];

  for (const [name, html] of htmlPages) {
    console.log(`  Auditing ${name}:`);

    // Landmark
    assert(html.includes('<footer') && html.includes('role="contentinfo"') && html.includes('class="site-footer"'), `${name} contains <footer role="contentinfo" class="site-footer">`);
    assert(html.includes('class="footer-container"'), `${name} contains .footer-container layout wrapper`);

    // Copyright & Brand
    assert(html.includes('2026') && (html.includes('Riff') || html.includes('riff')) && html.includes('sohamlabs'), `${name} contains Brand copyright (© 2026 Riff by sohamlabs)`);

    // MIT License Link
    assert(html.includes('href="./LICENSE"') || html.includes('href="/LICENSE"'), `${name} links to ./LICENSE or /LICENSE`);
    assert(html.includes('MIT License'), `${name} contains "MIT License" anchor text`);

    // Edge Hosting Notice
    assert(html.includes('Hosted on Cloudflare Workers Static Assets'), `${name} contains "Hosted on Cloudflare Workers Static Assets" notice`);
    assert(html.includes('footer-hosting-badge') || html.includes('footer-badge'), `${name} contains hosting indicator badge element`);

    // Trademark Disclaimer
    assert(html.includes('No attribution implied or given. All trademarks and original designs belong to their respective owners.'), `${name} contains exact trademark disclaimer text`);
  }

  // 4. CSS Style Verification
  console.log('\n4. Verifying Engineering Footer CSS Styles & Design Tokens...');
  const cssFiles = [
    ['landing/style.css', landingCss],
    ['dist/style.css', distCss]
  ];

  for (const [name, css] of cssFiles) {
    console.log(`  Auditing ${name}:`);

    // Structural Divider
    assert(css.includes('.site-footer') && css.includes('border-top: 1px solid var(--border-subtle)'), `${name} sets border-top: 1px solid var(--border-subtle) on .site-footer`);

    // Typography & Muted Text
    assert(css.includes('.site-footer') && (css.includes('var(--text-muted)') || css.includes('#68738B')), `${name} applies var(--text-muted) to footer typography`);
    assert(css.includes('0.8125rem') || css.includes('13px'), `${name} sets 13px (0.8125rem) font-size scale`);

    // Links & Hover State
    assert(css.includes('.footer-link') || css.includes('.footer-copy a'), `${name} styles footer link classes`);
    assert(css.includes('var(--text-primary)') && (css.includes('text-decoration: underline') || css.includes('text-decoration-color')), `${name} specifies hover state with --text-primary and underline`);

    // Hosting Indicator Badge
    assert(css.includes('.footer-hosting-badge'), `${name} styles .footer-hosting-badge container`);
    assert(css.includes('.footer-badge-dot') || css.includes('.footer-hosting-dot'), `${name} styles edge status dot`);
    assert(css.includes('var(--accent-emerald)') || css.includes('#10B981'), `${name} uses emerald active accent for hosting status dot`);

    // Disclaimer
    assert(css.includes('.footer-disclaimer'), `${name} styles .footer-disclaimer with readable caption scale`);

    // Responsive Breakpoints
    assert(css.includes('@media (max-width: 768px)'), `${name} includes 768px tablet breakpoint for footer`);
    assert(css.includes('@media (max-width: 480px)'), `${name} includes 480px mobile stacking breakpoint for footer`);
  }

  // 5. Live Dev Server HTTP & LICENSE Route Delivery
  console.log('\n5. Testing Dev Server HTTP Delivery for Landing, 404, and /LICENSE...');
  const testPort = 8792;
  const server = startServer(testPort);

  await new Promise((resolve) => setTimeout(resolve, 300));

  try {
    // Test 1: Fetch Landing Page /
    const responseRoot = await new Promise((resolve, reject) => {
      http.get(`http://localhost:${testPort}/`, (res) => {
        let body = '';
        res.on('data', chunk => { body += chunk; });
        res.on('end', () => {
          resolve({ status: res.statusCode, headers: res.headers, body });
        });
      }).on('error', reject);
    });

    assert(responseRoot.status === 200, `Dev server returns HTTP 200 for / (received ${responseRoot.status})`);
    assert(responseRoot.body.includes('Hosted on Cloudflare Workers Static Assets'), 'Root page serves footer with Cloudflare Workers notice');
    assert(responseRoot.body.includes('MIT License'), 'Root page serves footer with MIT License link');
    assert(responseRoot.body.includes('No attribution implied or given'), 'Root page serves footer with trademark disclaimer');

    // Test 2: Fetch 404 Page /404.html
    const response404 = await new Promise((resolve, reject) => {
      http.get(`http://localhost:${testPort}/404.html`, (res) => {
        let body = '';
        res.on('data', chunk => { body += chunk; });
        res.on('end', () => {
          resolve({ status: res.statusCode, headers: res.headers, body });
        });
      }).on('error', reject);
    });

    assert(response404.status === 200, `Dev server returns HTTP 200 for /404.html direct request (received ${response404.status})`);
    assert(response404.body.includes('Hosted on Cloudflare Workers Static Assets'), '404 page serves footer with Cloudflare Workers notice');
    assert(response404.body.includes('MIT License'), '404 page serves footer with MIT License link');

    // Test 3: Fetch /LICENSE
    const responseLicense = await new Promise((resolve, reject) => {
      http.get(`http://localhost:${testPort}/LICENSE`, (res) => {
        let body = '';
        res.on('data', chunk => { body += chunk; });
        res.on('end', () => {
          resolve({ status: res.statusCode, headers: res.headers, body });
        });
      }).on('error', reject);
    });

    assert(responseLicense.status === 200, `Dev server returns HTTP 200 for /LICENSE (received ${responseLicense.status})`);
    assert(responseLicense.body.includes('MIT License') && responseLicense.body.includes('Permission is hereby granted'), 'Dev server serves valid MIT License content at /LICENSE');

  } finally {
    server.close();
  }

  // 6. Final Summary
  console.log('\n============================================================');
  console.log(`  Tests Passed: ${passedTests}/${totalTests}`);
  console.log(`  Tests Failed: ${failedTests}`);
  console.log('============================================================\n');

  if (failedTests > 0) {
    console.error(`\x1b[31m✖ Sub-phase v0.7.1 verification failed with ${failedTests} error(s).\x1b[0m\n`);
    process.exit(1);
  } else {
    console.log(`\x1b[32m✔ Sub-phase v0.7.1 Engineering Footer Component fully verified.\x1b[0m\n`);
  }
}

runTests().catch(err => {
  console.error('Fatal verification error:', err);
  process.exit(1);
});

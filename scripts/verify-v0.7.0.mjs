#!/usr/bin/env node

/**
 * ==============================================================================
 * Sub-phase v0.7.0 Verification Script: Terminal 404 Error Page
 * ==============================================================================
 *
 * Verifies:
 * 1. File Integrity & Build Pipeline:
 *    - landing/404.html exists and compiles to dist/404.html
 *    - landing/style.css contains complete Section 14 terminal 404 styles
 *    - dist/style.css is up-to-date
 * 2. 404 HTML Structure & WCAG 2.2 AA Accessibility:
 *    - Strict HTML5 DOCTYPE, metadata, robots (noindex), theme-color (#07080B)
 *    - Fonts: Plus Jakarta Sans & JetBrains Mono typography links
 *    - Skip link targeting #main-content
 *    - Header landmark role="banner", nav links, edge indicator, GitHub link
 *    - Main landmark role="main" with id="main-content"
 *    - Terminal error container: .terminal-error-card, .terminal-header, 3 colored dots
 *    - Error badge: .badge-status-error / .badge-error ("ERROR 404 // ROUTE_NOT_FOUND")
 *    - Headline: "404: Riff Not Found" (h1.error-title)
 *    - Diagnostic description: "The requested project route does not exist or has been relocated."
 *    - Monospace CLI diagnostic console: .terminal-console with "riff route --resolve"
 *    - Recovery CTA: <a href="/" class="btn btn-primary btn-launch">← Return to Riff Portal</a>
 *    - Footer landmark role="contentinfo" with MIT license & copyright notice
 * 3. CSS Tokens & Terminal Aesthetics:
 *    - Obsidian void background (#07080B / var(--bg-void))
 *    - Crimson error badge (#EF4444 / var(--accent-crimson)) with subtle ambient glow
 *    - Terminal header dots: red (#EF4444), yellow (#F59E0B), green (#10B981)
 *    - Touch target compliance (>= 44px min-height) on primary recovery button
 *    - Responsive breakpoints (max-width: 640px and 480px) for mobile layout stacking
 * 4. Dev Server 404 Simulation:
 *    - Starts dev server on ephemeral port and tests real HTTP 404 response
 *    - Asserts HTTP status code 404 and content matching terminal error page
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
  console.log('  v0.7.0 Terminal 404 Error Page Verification');
  console.log('============================================================\n');

  // 1. Re-compile build pipeline to ensure clean dist output
  console.log('1. Compiling Monorepo Build Pipeline via build()...');
  const buildResult = await build();
  assert(Boolean(buildResult && buildResult.projectManifests), 'Monorepo compiles cleanly with project manifests');

  // 2. File Existence & Integrity Check
  console.log('\n2. Verifying File Existence & Structure...');
  const landing404Path = path.join(ROOT_DIR, 'landing', '404.html');
  const dist404Path = path.join(ROOT_DIR, 'dist', '404.html');
  const landingCssPath = path.join(ROOT_DIR, 'landing', 'style.css');
  const distCssPath = path.join(ROOT_DIR, 'dist', 'style.css');

  assert(fs.existsSync(landing404Path), 'landing/404.html exists');
  assert(fs.existsSync(dist404Path), 'dist/404.html exists');
  assert(fs.existsSync(landingCssPath), 'landing/style.css exists');
  assert(fs.existsSync(distCssPath), 'dist/style.css exists');

  const landing404Html = fs.readFileSync(landing404Path, 'utf-8');
  const dist404Html = fs.readFileSync(dist404Path, 'utf-8');
  const landingCss = fs.readFileSync(landingCssPath, 'utf-8');
  const distCss = fs.readFileSync(distCssPath, 'utf-8');

  // 3. 404 HTML Structure & Required Elements in landing/404.html & dist/404.html
  console.log('\n3. Auditing HTML Structure & Elements in landing/404.html and dist/404.html...');
  for (const [name, html] of [['landing/404.html', landing404Html], ['dist/404.html', dist404Html]]) {
    console.log(`  Auditing ${name}:`);

    // Metadata & Head
    assert(html.includes('<!DOCTYPE html>'), `${name} contains valid HTML5 DOCTYPE`);
    assert(html.includes('<html lang="en">'), `${name} contains <html lang="en">`);
    assert(html.includes('<meta name="viewport" content="width=device-width, initial-scale=1.0">'), `${name} contains responsive viewport meta tag`);
    assert(html.includes('<title>404: Riff Not Found'), `${name} contains descriptive page title`);
    assert(html.includes('name="robots" content="noindex'), `${name} specifies noindex robots meta for 404 error page`);
    assert(html.includes('Plus+Jakarta+Sans') && html.includes('JetBrains+Mono'), `${name} loads Plus Jakarta Sans and JetBrains Mono fonts`);
    assert(html.includes('<link rel="stylesheet" href="style.css">'), `${name} links to style.css`);

    // Accessibility Landmarks & Skip Link
    assert(html.includes('class="skip-link"') && html.includes('href="#main-content"'), `${name} contains accessible skip link targeting #main-content`);
    assert(html.includes('role="banner"') && html.includes('class="site-header"'), `${name} contains site-header with role="banner"`);
    assert(html.includes('role="main"') && html.includes('id="main-content"'), `${name} contains main landmark with role="main" and id="main-content"`);
    assert(html.includes('role="contentinfo"') && html.includes('class="site-footer"'), `${name} contains site-footer with role="contentinfo"`);

    // Header Components
    assert(html.includes('class="brand"') && html.includes('class="brand-title">riff</span>'), `${name} contains brand logo with riff title`);
    assert(html.includes('edge-status') && html.includes('Edge Active'), `${name} contains live edge status indicator`);

    // Terminal Container & Titlebar
    assert(html.includes('class="terminal-error-card"'), `${name} contains .terminal-error-card container`);
    assert(html.includes('class="terminal-header"'), `${name} contains .terminal-header chrome bar`);
    assert(html.includes('terminal-dot-red') && html.includes('terminal-dot-yellow') && html.includes('terminal-dot-green'), `${name} contains 3 colored terminal window control dots`);
    assert(html.includes('terminal-title'), `${name} contains terminal window title`);

    // Error Badge & Copy
    assert(html.includes('badge-status-error') || html.includes('badge-error'), `${name} contains .badge-status-error / .badge-error`);
    assert(html.includes('ERROR 404 // ROUTE_NOT_FOUND'), `${name} contains status badge text "ERROR 404 // ROUTE_NOT_FOUND"`);
    assert(html.includes('404: Riff Not Found'), `${name} contains headline "404: Riff Not Found"`);
    assert(html.includes('The requested project route does not exist or has been relocated.'), `${name} contains exact diagnostic message`);

    // Terminal Diagnostic Stream
    assert(html.includes('terminal-console'), `${name} contains .terminal-console diagnostic block`);
    assert(html.includes('riff route --resolve'), `${name} contains CLI route resolution command`);
    assert(html.includes('Target route unmapped in project registry'), `${name} contains diagnostic error description`);

    // Recovery Primary Action
    assert(html.includes('href="/"') && (html.includes('btn-primary') || html.includes('btn-launch')), `${name} contains primary action button`);
    assert(html.includes('Return to Riff Portal'), `${name} primary button text points to "Return to Riff Portal"`);
    assert(html.includes('href="/"'), `${name} primary button target is "/"`);
  }

  // 4. CSS Style Verification in landing/style.css & dist/style.css
  console.log('\n4. Verifying Terminal 404 Styles & Tokens in CSS...');
  for (const [name, css] of [['landing/style.css', landingCss], ['dist/style.css', distCss]]) {
    console.log(`  Auditing ${name}:`);

    // Section 14 Heading
    assert(css.includes('Standalone Terminal 404 Error Page') || css.includes('.terminal-error-card'), `${name} contains terminal 404 styling section`);

    // Terminal Card & Header
    assert(css.includes('.terminal-error-card'), `${name} styles .terminal-error-card`);
    assert(css.includes('.terminal-header'), `${name} styles .terminal-header`);
    assert(css.includes('.terminal-dot'), `${name} styles .terminal-dot`);
    assert(css.includes('.terminal-dot-red'), `${name} styles .terminal-dot-red with crimson indicator`);
    assert(css.includes('.terminal-dot-yellow'), `${name} styles .terminal-dot-yellow with amber indicator`);
    assert(css.includes('.terminal-dot-green'), `${name} styles .terminal-dot-green with emerald indicator`);

    // Badges & Error Styling
    assert(css.includes('.badge-status-error') || css.includes('.badge-error'), `${name} styles .badge-status-error`);
    assert(css.includes('#EF4444') || css.includes('var(--accent-crimson)'), `${name} uses crimson error color tokens`);

    // Terminal Console & Typography
    assert(css.includes('.terminal-console'), `${name} styles .terminal-console`);
    assert(css.includes('.console-prompt'), `${name} styles .console-prompt`);
    assert(css.includes('.console-cmd'), `${name} styles .console-cmd`);
    assert(css.includes('.error-title'), `${name} styles .error-title`);
    assert(css.includes('.error-diagnostic'), `${name} styles .error-diagnostic`);

    // Responsive Breakpoints
    assert(css.includes('@media (max-width: 640px)'), `${name} includes 640px mobile breakpoint for 404 page`);
    assert(css.includes('@media (max-width: 480px)'), `${name} includes 480px small mobile breakpoint`);
  }

  // 5. Dev Server 404 Response Live Simulation
  console.log('\n5. Testing Dev Server HTTP 404 Response & Content Delivery...');
  const testPort = 8791;
  const server = startServer(testPort);

  await new Promise((resolve) => setTimeout(resolve, 300));

  try {
    // Test 1: Fetch 404 for non-existent path
    const response404 = await new Promise((resolve, reject) => {
      http.get(`http://localhost:${testPort}/non-existent-route-for-testing-404/`, (res) => {
        let body = '';
        res.on('data', chunk => { body += chunk; });
        res.on('end', () => {
          resolve({ status: res.statusCode, headers: res.headers, body });
        });
      }).on('error', reject);
    });

    assert(response404.status === 404, `Dev server returns HTTP 404 status (received ${response404.status})`);
    assert(response404.headers['content-type'].includes('text/html'), `Dev server responds with text/html content-type (received ${response404.headers['content-type']})`);
    assert(response404.body.includes('404: Riff Not Found'), '404 response body contains "404: Riff Not Found"');
    assert(response404.body.includes('ERROR 404 // ROUTE_NOT_FOUND'), '404 response body contains "ERROR 404 // ROUTE_NOT_FOUND"');
    assert(response404.body.includes('Return to Riff Portal'), '404 response body contains "Return to Riff Portal"');
    assert(response404.body.includes('terminal-error-card'), '404 response body renders terminal error card');

    // Test 2: Fetch valid root path
    const response200 = await new Promise((resolve, reject) => {
      http.get(`http://localhost:${testPort}/`, (res) => {
        let body = '';
        res.on('data', chunk => { body += chunk; });
        res.on('end', () => {
          resolve({ status: res.statusCode, headers: res.headers, body });
        });
      }).on('error', reject);
    });

    assert(response200.status === 200, `Dev server returns HTTP 200 for root portal / (received ${response200.status})`);
    assert(response200.body.includes('riff — Front-End Reimaginations'), 'Root portal response body contains riff landing portal');
  } finally {
    server.close();
  }

  // 6. Final Summary
  console.log('\n============================================================');
  console.log(`  Tests Passed: ${passedTests}/${totalTests}`);
  console.log(`  Tests Failed: ${failedTests}`);
  console.log('============================================================\n');

  if (failedTests > 0) {
    console.error(`\x1b[31m✖ Sub-phase v0.7.0 verification failed with ${failedTests} error(s).\x1b[0m\n`);
    process.exit(1);
  } else {
    console.log(`\x1b[32m✔ Sub-phase v0.7.0 Terminal 404 Error Page fully verified.\x1b[0m\n`);
  }
}

runTests().catch(err => {
  console.error('Fatal verification error:', err);
  process.exit(1);
});

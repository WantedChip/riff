#!/usr/bin/env node

/**
 * ==============================================================================
 * Sub-phase v0.7.2 Verification Script: Project-Level Return Breadcrumb
 * ==============================================================================
 *
 * Verifies:
 * 1. Monorepo Build Pipeline & Dual Route Artifacts:
 *    - Compilation builds dist/ cleanly
 *    - Dual routes (dist/half-life-clone/ & dist/projects/half-life-clone/) exist
 *    - Source and compiled HTML files are up-to-date
 * 2. Return Breadcrumb Markup & Accessibility:
 *    - Valid markup: <a href="/" class="riff-back-pill" aria-label="Return to Riff Showcase">← Back to Riff</a>
 *    - Href targets root portal ("/")
 *    - Semantic aria-label for screen reader clarity
 *    - Verified across index.html, alyx.html, halflife.html, halflife2.html, episode1.html, episode2.html
 * 3. CSS Tokens, Tactile Motion & Accessibility Styling:
 *    - Fixed floating positioning (top: 18px, left: 16px, z-index: 9999)
 *    - Obsidian dark backdrop (rgba(7, 8, 11, 0.85) with backdrop-filter: blur(8px))
 *    - Pill border-radius: 9999px !important overriding universal strict resets
 *    - Spring physics hover lift (translateY(-2px), cubic-bezier(0.16, 1, 0.3, 1), border illumination)
 *    - Accessible focus indicator (outline: 2px solid #FF5E3A, outline-offset: 2px)
 *    - prefers-reduced-motion spatial motion suppression
 * 4. UI Non-Interference & Responsive Breakpoints:
 *    - Header offset padding prevents collision with Half-Life brand logo and navigation
 *    - Responsive compact sizing for mobile viewports (<= 576px)
 * 5. Live HTTP Dev Server Dual Route Verification:
 *    - Serves /half-life-clone/ with 200 OK and valid breadcrumb
 *    - Serves /projects/half-life-clone/ with 200 OK and valid breadcrumb
 *    - Serves /half-life-clone/alyx.html with 200 OK and valid breadcrumb
 *    - Serves /projects/half-life-clone/css/components.css with 200 OK and valid .riff-back-pill styles
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
  console.log('  v0.7.2 Project-Level Return Breadcrumb Verification');
  console.log('============================================================\n');

  // 1. Monorepo Build Compilation
  console.log('1. Compiling Monorepo Build Pipeline via build()...');
  const buildResult = await build();
  assert(Boolean(buildResult && buildResult.projectManifests), 'Monorepo builds cleanly with project manifests');

  // 2. File Existence & Dual Route Directory Verification
  console.log('\n2. Verifying Dual Routing Directories & Artifact Integrity...');
  const htmlFiles = ['index.html', 'alyx.html', 'halflife.html', 'halflife2.html', 'episode1.html', 'episode2.html'];
  const srcProjectDir = path.join(ROOT_DIR, 'projects', 'half life clone');
  const distPrimaryDir = path.join(ROOT_DIR, 'dist', 'half-life-clone');
  const distAliasDir = path.join(ROOT_DIR, 'dist', 'projects', 'half-life-clone');

  assert(fs.existsSync(srcProjectDir), 'Source projects/half life clone/ directory exists');
  assert(fs.existsSync(distPrimaryDir), 'Compiled primary route dist/half-life-clone/ directory exists');
  assert(fs.existsSync(distAliasDir), 'Compiled alias route dist/projects/half-life-clone/ directory exists');

  for (const file of htmlFiles) {
    assert(fs.existsSync(path.join(srcProjectDir, file)), `Source file projects/half life clone/${file} exists`);
    assert(fs.existsSync(path.join(distPrimaryDir, file)), `Primary route dist/half-life-clone/${file} exists`);
    assert(fs.existsSync(path.join(distAliasDir, file)), `Alias route dist/projects/half-life-clone/${file} exists`);
  }

  assert(fs.existsSync(path.join(srcProjectDir, 'css', 'components.css')), 'Source css/components.css exists');
  assert(fs.existsSync(path.join(distPrimaryDir, 'css', 'components.css')), 'Primary route css/components.css exists');
  assert(fs.existsSync(path.join(distAliasDir, 'css', 'components.css')), 'Alias route css/components.css exists');

  // 3. HTML Markup & Breadcrumb Semantic Structure
  console.log('\n3. Auditing Return Breadcrumb HTML Markup across Project Pages...');
  const expectedPillRegex = /<a\s+href="\/"\s+class="riff-back-pill"\s+aria-label="Return to Riff Showcase">←\s*Back to Riff<\/a>/i;

  for (const file of htmlFiles) {
    const srcHtml = fs.readFileSync(path.join(srcProjectDir, file), 'utf-8');
    const primaryHtml = fs.readFileSync(path.join(distPrimaryDir, file), 'utf-8');
    const aliasHtml = fs.readFileSync(path.join(distAliasDir, file), 'utf-8');

    assert(expectedPillRegex.test(srcHtml), `Source ${file} contains exact .riff-back-pill markup targeting '/'`);
    assert(expectedPillRegex.test(primaryHtml), `Primary ${file} contains exact .riff-back-pill markup targeting '/'`);
    assert(expectedPillRegex.test(aliasHtml), `Alias ${file} contains exact .riff-back-pill markup targeting '/'`);

    assert(srcHtml.includes('Plus+Jakarta+Sans'), `Source ${file} imports Plus Jakarta Sans font in <head>`);
    assert(primaryHtml.includes('Plus+Jakarta+Sans'), `Primary ${file} imports Plus Jakarta Sans font in <head>`);
  }

  // 4. CSS Styling, Tokens & Motion Rules
  console.log('\n4. Auditing CSS Styling, Design Tokens, and Spring Hover Physics...');
  const compCss = fs.readFileSync(path.join(srcProjectDir, 'css', 'components.css'), 'utf-8');

  assert(compCss.includes('.riff-back-pill'), 'components.css defines .riff-back-pill selector');
  assert(/position:\s*fixed;/i.test(compCss), '.riff-back-pill specifies position: fixed');
  assert(/top:\s*18px;/i.test(compCss) && /left:\s*16px;/i.test(compCss), '.riff-back-pill specifies top-left floating coordinates (top: 18px, left: 16px)');
  assert(/z-index:\s*9999;/i.test(compCss), '.riff-back-pill specifies high z-index (9999)');
  assert(/rgba\(7,\s*8,\s*11,\s*0\.85\)/i.test(compCss), '.riff-back-pill uses obsidian dark backdrop rgba(7, 8, 11, 0.85)');
  assert(/backdrop-filter:\s*blur\(8px\)/i.test(compCss), '.riff-back-pill applies backdrop-filter: blur(8px)');
  assert(/border-radius:\s*9999px\s*!important/i.test(compCss), '.riff-back-pill enforces rounded pill shape with border-radius: 9999px !important');
  assert(/cubic-bezier\(0\.16,\s*1,\s*0\.3,\s*1\)/i.test(compCss), '.riff-back-pill uses tactile spring transition curve cubic-bezier(0.16, 1, 0.3, 1)');
  assert(/\.riff-back-pill:hover\s*{[^}]*transform:\s*translateY\(-2px\)/s.test(compCss), '.riff-back-pill:hover triggers tactile spring translateY(-2px) lift');
  assert(/\.riff-back-pill:hover\s*{[^}]*rgba\(255,\s*94,\s*58/s.test(compCss), '.riff-back-pill:hover illuminates border with flame accent');
  assert(/outline:\s*2px\s+solid\s+#FF5E3A\s*!important/i.test(compCss), '.riff-back-pill defines WCAG compliant flame focus ring (outline: 2px solid #FF5E3A !important)');
  assert(/outline-offset:\s*2px/i.test(compCss), '.riff-back-pill sets outline-offset: 2px for clear visual separation');
  assert(/@media\s*\(max-width:\s*576px\)/i.test(compCss), 'components.css contains mobile responsive adjustments for .riff-back-pill');
  assert(/@media\s*\(prefers-reduced-motion:\s*reduce\)[^{]*{[^}]*\.riff-back-pill/s.test(compCss), 'components.css suppresses hover motion under prefers-reduced-motion');

  // 5. Header Collision Prevention
  console.log('\n5. Verifying Header Spacing & Layout Non-Interference...');
  assert(/padding-left:\s*130px;/i.test(compCss), 'Header inner container specifies padding-left: 130px offset for floating breadcrumb');
  assert(/padding-left:\s*106px;/i.test(compCss), 'Header inner container specifies mobile padding-left: 106px offset');

  // 6. Live HTTP Dev Server Dual Route & Asset Verification
  console.log('\n6. Testing Live HTTP Dev Server Project Endpoints...');
  const testPort = 9876;
  const server = await startServer(testPort);

  function fetchUrl(pathname) {
    return new Promise((resolve, reject) => {
      const req = http.get(`http://localhost:${testPort}${pathname}`, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body }));
      });
      req.on('error', reject);
    });
  }

  try {
    // Primary project route
    const resPrimary = await fetchUrl('/half-life-clone/');
    assert(resPrimary.status === 200, 'HTTP GET /half-life-clone/ returns 200 OK');
    assert(expectedPillRegex.test(resPrimary.body), 'HTTP GET /half-life-clone/ response contains .riff-back-pill return markup');

    // Alias project route
    const resAlias = await fetchUrl('/projects/half-life-clone/');
    assert(resAlias.status === 200, 'HTTP GET /projects/half-life-clone/ returns 200 OK');
    assert(expectedPillRegex.test(resAlias.body), 'HTTP GET /projects/half-life-clone/ response contains .riff-back-pill return markup');

    // Sub-page route on primary
    const resSubPrimary = await fetchUrl('/half-life-clone/alyx.html');
    assert(resSubPrimary.status === 200, 'HTTP GET /half-life-clone/alyx.html returns 200 OK');
    assert(expectedPillRegex.test(resSubPrimary.body), 'HTTP GET /half-life-clone/alyx.html response contains .riff-back-pill return markup');

    // Sub-page route on alias
    const resSubAlias = await fetchUrl('/projects/half-life-clone/alyx.html');
    assert(resSubAlias.status === 200, 'HTTP GET /projects/half-life-clone/alyx.html returns 200 OK');
    assert(expectedPillRegex.test(resSubAlias.body), 'HTTP GET /projects/half-life-clone/alyx.html response contains .riff-back-pill return markup');

    // CSS asset on primary
    const resCssPrimary = await fetchUrl('/half-life-clone/css/components.css');
    assert(resCssPrimary.status === 200, 'HTTP GET /half-life-clone/css/components.css returns 200 OK');
    assert(resCssPrimary.body.includes('.riff-back-pill'), 'Primary CSS response contains .riff-back-pill styles');

    // CSS asset on alias
    const resCssAlias = await fetchUrl('/projects/half-life-clone/css/components.css');
    assert(resCssAlias.status === 200, 'HTTP GET /projects/half-life-clone/css/components.css returns 200 OK');
    assert(resCssAlias.body.includes('.riff-back-pill'), 'Alias CSS response contains .riff-back-pill styles');

    // Root portal
    const resRoot = await fetchUrl('/');
    assert(resRoot.status === 200, 'HTTP GET / (root showcase) returns 200 OK');
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }

  // 7. Results Summary
  console.log('\n============================================================');
  console.log(`  Tests Completed: ${totalTests}`);
  console.log(`  Passed: \x1b[32m${passedTests}\x1b[0m`);
  console.log(`  Failed: ${failedTests > 0 ? `\x1b[31m${failedTests}\x1b[0m` : '\x1b[32m0\x1b[0m'}`);
  console.log('============================================================\n');

  if (failedTests > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});

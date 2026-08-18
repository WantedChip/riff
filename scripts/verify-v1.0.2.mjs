#!/usr/bin/env node

/**
 * ==============================================================================
 * Sub-phase v1.0.2 Automated Verification Suite
 * Cloudflare Workers Static Assets Edge Deployment Configuration
 * ==============================================================================
 *
 * This test suite verifies:
 * 1. `wrangler.toml` syntax and TOML schema validity for Cloudflare Workers Static Assets:
 *    - Valid TOML format (parse keys/tables without error)
 *    - `name = "riff"`
 *    - `compatibility_date = "2026-08-18"`
 *    - `[assets]` table: `directory = "./dist"` and `not_found_handling = "404-page"`
 *    - Informative documentation comments present
 * 2. `package.json` deployment scripts verification:
 *    - `build` = `"node scripts/script.mjs"`
 *    - `serve` = `"node scripts/script.mjs --serve"`
 *    - `clean` = `"node scripts/script.mjs --clean"`
 *    - `deploy` = `"wrangler deploy"`
 * 3. Production directory `dist/` readiness & file structure verification:
 *    - Full production compilation via `scripts/script.mjs`
 *    - Existence of `index.html`, `404.html`, `style.css`, `app.js`, `projects.json`,
 *      `riffs.json`, `robots.txt`, `sitemap.xml`, `LICENSE`, assets
 *    - Existence of primary routes (`dist/half-life-clone/`) and alias routes (`dist/projects/half-life-clone/`)
 *    - 100% SHA256 checksum parity between primary and alias route trees
 *    - Return navigation breadcrumb (`.riff-back-pill`) on all project HTML files
 *    - Schema and array parity for `projects.json` and `riffs.json`
 *    - `robots.txt` and `sitemap.xml` pointing to `https://riff.sohamlabs.workers.dev`
 * 4. Static assets routing rules and dual path resolution matching Cloudflare Workers directory index and 404-page contracts:
 *    - Root landing `/` (HTTP 200, text/html)
 *    - Static assets `/style.css`, `/app.js`, `/robots.txt`, `/sitemap.xml`, `/LICENSE`
 *    - Primary route `/half-life-clone/` (HTTP 200) and directory redirect `/half-life-clone` (HTTP 301)
 *    - Alias route `/projects/half-life-clone/` (HTTP 200) and directory redirect `/projects/half-life-clone` (HTTP 301)
 *    - Sub-page dual routing (`alyx.html`)
 *    - Unmapped routes resolving to terminal 404 error page (`dist/404.html`) with HTTP 404 status
 *    - HEAD request handling and directory traversal security
 * ==============================================================================
 */

import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import http from 'node:http';
import { fileURLToPath } from 'node:url';
import { clean, build, startServer } from './script.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const DIST_DIR = path.join(ROOT_DIR, 'dist');
const WRANGLER_TOML_PATH = path.join(ROOT_DIR, 'wrangler.toml');
const PACKAGE_JSON_PATH = path.join(ROOT_DIR, 'package.json');

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

function fetchUrl(url, method = 'GET') {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const req = http.request({
      hostname: parsed.hostname,
      port: parsed.port,
      path: parsed.pathname + parsed.search,
      method: method
    }, res => {
      let data = [];
      res.on('data', chunk => data.push(chunk));
      res.on('end', () => {
        const buffer = Buffer.concat(data);
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: buffer.toString('utf8'),
          raw: buffer
        });
      });
    });
    req.on('error', reject);
    req.end();
  });
}

function calculateSha256(filePath) {
  const fileBuffer = fs.readFileSync(filePath);
  const hashSum = crypto.createHash('sha256');
  hashSum.update(fileBuffer);
  return hashSum.digest('hex');
}

function getFilesRecursively(dir, baseDir = dir) {
  let results = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results = results.concat(getFilesRecursively(fullPath, baseDir));
    } else {
      const relPath = path.relative(baseDir, fullPath).replace(/\\/g, '/');
      results.push({ relPath, fullPath });
    }
  }
  return results;
}

/**
 * Basic TOML Parser for Cloudflare wrangler.toml configuration
 */
function parseToml(content) {
  const result = {};
  let currentTable = result;
  const lines = content.split(/\r?\n/);

  for (let line of lines) {
    line = line.trim();
    if (!line || line.startsWith('#')) continue;

    // Check for table header [table_name]
    const tableMatch = line.match(/^\[([a-zA-Z0-9_\.-]+)\]$/);
    if (tableMatch) {
      const tableName = tableMatch[1];
      result[tableName] = result[tableName] || {};
      currentTable = result[tableName];
      continue;
    }

    // Check for key = value
    const kvMatch = line.match(/^([a-zA-Z0-9_\.-]+)\s*=\s*(.+)$/);
    if (kvMatch) {
      const key = kvMatch[1].trim();
      let value = kvMatch[2].trim();

      // Remove inline comments
      if (value.includes('#') && !value.startsWith('"') && !value.startsWith("'")) {
        value = value.split('#')[0].trim();
      }

      // Parse string literal
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      } else if (value === 'true') {
        value = true;
      } else if (value === 'false') {
        value = false;
      } else if (!isNaN(Number(value))) {
        value = Number(value);
      }

      currentTable[key] = value;
    }
  }

  return result;
}

// ============================================================================
// MAIN VERIFICATION EXECUTION
// ============================================================================
async function runVerification() {
  console.log('\n================================================================');
  console.log('  v1.0.2 Cloudflare Workers Static Assets Edge Verification');
  console.log('================================================================\n');

  // --------------------------------------------------------------------------
  // SECTION 1: wrangler.toml Configuration & Cloudflare Schema Validity
  // --------------------------------------------------------------------------
  console.log('1. Verifying wrangler.toml Cloudflare Workers Static Assets Schema...');
  assert(fs.existsSync(WRANGLER_TOML_PATH), 'wrangler.toml exists in repository root');

  const wranglerContent = await fsp.readFile(WRANGLER_TOML_PATH, 'utf8');
  assert(wranglerContent.length > 0, 'wrangler.toml is non-empty');

  const tomlConfig = parseToml(wranglerContent);
  assert(tomlConfig !== null && typeof tomlConfig === 'object', 'wrangler.toml parsed as valid TOML');

  // Verify Worker Name
  assert(tomlConfig.name === 'riff', `Worker name is "riff" (actual: "${tomlConfig.name}")`);

  // Verify Compatibility Date
  assert(tomlConfig.compatibility_date === '2026-08-18', `Compatibility date is "2026-08-18" (actual: "${tomlConfig.compatibility_date}")`);

  // Verify [assets] table
  assert(Boolean(tomlConfig.assets), '[assets] table exists in wrangler.toml');
  assert(tomlConfig.assets?.directory === './dist', `[assets] directory is "./dist" (actual: "${tomlConfig.assets?.directory}")`);
  assert(tomlConfig.assets?.not_found_handling === '404-page', `[assets] not_found_handling is "404-page" (actual: "${tomlConfig.assets?.not_found_handling}")`);

  // Verify Documentation Comments
  assert(wranglerContent.includes('Cloudflare Workers Static Assets'), 'wrangler.toml contains Cloudflare Workers Static Assets commentary');
  assert(wranglerContent.includes('404-page'), 'wrangler.toml documents 404-page error handling contract');
  assert(wranglerContent.includes('https://riff.sohamlabs.workers.dev'), 'wrangler.toml references target production edge deployment URL');

  // --------------------------------------------------------------------------
  // SECTION 2: package.json Build & Deployment Scripts
  // --------------------------------------------------------------------------
  console.log('\n2. Verifying package.json Deployment Scripts & Metadata...');
  assert(fs.existsSync(PACKAGE_JSON_PATH), 'package.json exists in repository root');

  const pkgContent = await fsp.readFile(PACKAGE_JSON_PATH, 'utf8');
  const pkg = JSON.parse(pkgContent);

  assert(pkg.name === 'riff-monorepo', 'package.json name is "riff-monorepo"');
  assert(pkg.type === 'module', 'package.json type is "module"');
  assert(pkg.license === 'MIT', 'package.json license is "MIT"');
  assert(Boolean(pkg.scripts), 'package.json contains scripts object');

  // Check required script commands
  assert(pkg.scripts.build === 'node scripts/script.mjs', `npm run build script is "node scripts/script.mjs" (actual: "${pkg.scripts.build}")`);
  assert(pkg.scripts.serve === 'node scripts/script.mjs --serve', `npm run serve script is "node scripts/script.mjs --serve" (actual: "${pkg.scripts.serve}")`);
  assert(pkg.scripts.clean === 'node scripts/script.mjs --clean', `npm run clean script is "node scripts/script.mjs --clean" (actual: "${pkg.scripts.clean}")`);
  assert(pkg.scripts.deploy === 'wrangler deploy', `npm run deploy script is "wrangler deploy" (actual: "${pkg.scripts.deploy}")`);

  // --------------------------------------------------------------------------
  // SECTION 3: Production Directory dist/ Readiness & Compilation Verification
  // --------------------------------------------------------------------------
  console.log('\n3. Executing Clean Production Build & Verifying dist/ Structure...');
  
  // Clean first
  await clean();
  assert(!fs.existsSync(DIST_DIR), 'dist/ directory cleaned before compilation');

  // Run full compilation
  const buildStartTime = Date.now();
  const buildResult = await build();
  const buildDuration = (Date.now() - buildStartTime) / 1000;

  assert(buildResult && buildResult.projectManifests, 'Build completed successfully');
  assert(buildDuration < 2.0, `Build executed in ${buildDuration.toFixed(2)}s (< 2.0s benchmark requirement)`);
  assert(fs.existsSync(DIST_DIR), 'dist/ directory created');

  // Verify Root Distribution Files
  const requiredDistFiles = [
    'index.html',
    '404.html',
    'style.css',
    'app.js',
    'projects.json',
    'riffs.json',
    'robots.txt',
    'sitemap.xml',
    'LICENSE',
    'assets/icons/brandmark.svg',
    'assets/images/og-cover.png'
  ];

  for (const file of requiredDistFiles) {
    const filePath = path.join(DIST_DIR, file);
    assert(fs.existsSync(filePath), `dist/${file} exists`);
    if (fs.existsSync(filePath)) {
      const stats = fs.statSync(filePath);
      assert(stats.size > 0, `dist/${file} is non-empty (${stats.size} bytes)`);
    }
  }

  // Verify Pre-rendered index.html
  const distIndexHtml = await fsp.readFile(path.join(DIST_DIR, 'index.html'), 'utf8');
  assert(distIndexHtml.includes('<!DOCTYPE html>'), 'dist/index.html has valid DOCTYPE');
  assert(distIndexHtml.includes('Front-End Riffs'), 'dist/index.html contains hero title');
  assert(distIndexHtml.includes('id="project-grid"'), 'dist/index.html contains #project-grid container');
  assert(distIndexHtml.includes('Half-Life Franchise Website'), 'dist/index.html contains pre-rendered Half-Life project card');
  assert(distIndexHtml.includes('data-slug="half-life-clone"'), 'dist/index.html contains data-slug="half-life-clone"');
  assert(distIndexHtml.includes('id="empty-state"'), 'dist/index.html contains #empty-state container');
  assert(distIndexHtml.includes('id="preview-modal"'), 'dist/index.html contains #preview-modal container');
  assert(distIndexHtml.includes('Hosted on Cloudflare Workers Static Assets'), 'dist/index.html includes Cloudflare Workers hosting badge');

  // Verify Terminal 404.html
  const dist404Html = await fsp.readFile(path.join(DIST_DIR, '404.html'), 'utf8');
  assert(dist404Html.includes('404: Riff Not Found'), 'dist/404.html contains "404: Riff Not Found" headline');
  assert(dist404Html.includes('ERROR 404 // ROUTE_NOT_FOUND'), 'dist/404.html contains error badge');
  assert(dist404Html.includes('terminal-error-card'), 'dist/404.html contains terminal window chrome');
  assert(dist404Html.includes('href="/"'), 'dist/404.html contains return launcher linking to "/"');

  // Verify Manifests Parity & Schema
  const projectsJsonContent = await fsp.readFile(path.join(DIST_DIR, 'projects.json'), 'utf8');
  const riffsJsonContent = await fsp.readFile(path.join(DIST_DIR, 'riffs.json'), 'utf8');
  assert(projectsJsonContent === riffsJsonContent, 'dist/projects.json and dist/riffs.json are byte-for-byte identical');

  const parsedProjects = JSON.parse(projectsJsonContent);
  assert(Array.isArray(parsedProjects) && parsedProjects.length > 0, 'projects.json is a valid non-empty JSON array');
  const hlProject = parsedProjects.find(p => p.slug === 'half-life-clone');
  assert(Boolean(hlProject), 'half-life-clone entry found in manifest');
  assert(hlProject.route === '/half-life-clone/', 'Manifest route is "/half-life-clone/"');
  assert(hlProject.aliasRoute === '/projects/half-life-clone/', 'Manifest aliasRoute is "/projects/half-life-clone/"');
  assert(hlProject.thumbnail.includes('.webp') || hlProject.thumbnail.includes('.png') || hlProject.thumbnail.includes('.jpg'), 'Manifest includes thumbnail image');

  // Verify SEO Directives
  const robotsContent = await fsp.readFile(path.join(DIST_DIR, 'robots.txt'), 'utf8');
  assert(robotsContent.includes('Sitemap: https://riff.sohamlabs.workers.dev/sitemap.xml'), 'dist/robots.txt contains production sitemap link');

  const sitemapContent = await fsp.readFile(path.join(DIST_DIR, 'sitemap.xml'), 'utf8');
  assert(sitemapContent.includes('<loc>https://riff.sohamlabs.workers.dev/</loc>'), 'dist/sitemap.xml contains root URL');
  assert(sitemapContent.includes('<loc>https://riff.sohamlabs.workers.dev/half-life-clone/</loc>'), 'dist/sitemap.xml contains primary route URL');
  assert(sitemapContent.includes('<loc>https://riff.sohamlabs.workers.dev/projects/half-life-clone/</loc>'), 'dist/sitemap.xml contains alias route URL');

  // --------------------------------------------------------------------------
  // SECTION 4: Dual Routing Parity & Return Breadcrumb Verification
  // --------------------------------------------------------------------------
  console.log('\n4. Verifying Dual Routing Parity & Return Navigation Breadcrumbs...');
  const primaryDir = path.join(DIST_DIR, 'half-life-clone');
  const aliasDir = path.join(DIST_DIR, 'projects', 'half-life-clone');

  assert(fs.existsSync(primaryDir), 'Primary route directory dist/half-life-clone/ exists');
  assert(fs.existsSync(aliasDir), 'Alias route directory dist/projects/half-life-clone/ exists');

  const primaryFiles = getFilesRecursively(primaryDir);
  const aliasFiles = getFilesRecursively(aliasDir);

  assert(primaryFiles.length > 0, `Primary route directory has ${primaryFiles.length} files`);
  assert(primaryFiles.length === aliasFiles.length, `Primary and Alias directories have identical file count (${primaryFiles.length})`);

  let parityMismatches = 0;
  for (const pFile of primaryFiles) {
    const matchingAlias = aliasFiles.find(a => a.relPath === pFile.relPath);
    if (!matchingAlias) {
      console.error(`  Missing alias file for: ${pFile.relPath}`);
      parityMismatches++;
      continue;
    }
    const pHash = calculateSha256(pFile.fullPath);
    const aHash = calculateSha256(matchingAlias.fullPath);
    if (pHash !== aHash) {
      console.error(`  Hash mismatch for: ${pFile.relPath} (Primary: ${pHash} vs Alias: ${aHash})`);
      parityMismatches++;
    }
  }
  assert(parityMismatches === 0, '100% SHA256 checksum parity across all files in primary and alias directories');

  // Verify Floating Return Breadcrumbs in all Project HTML Pages
  const projectHtmlFiles = primaryFiles.filter(f => f.relPath.endsWith('.html'));
  assert(projectHtmlFiles.length >= 6, `Found ${projectHtmlFiles.length} project HTML sub-pages (index, alyx, halflife, halflife2, episode1, episode2)`);

  let breadcrumbsFound = 0;
  for (const htmlFile of projectHtmlFiles) {
    const html = await fsp.readFile(htmlFile.fullPath, 'utf8');
    if (html.includes('class="riff-back-pill"') && html.includes('href="/"')) {
      breadcrumbsFound++;
    } else {
      console.error(`  Missing .riff-back-pill in: ${htmlFile.relPath}`);
    }
  }
  assert(breadcrumbsFound === projectHtmlFiles.length, `All ${breadcrumbsFound}/${projectHtmlFiles.length} project HTML pages include .riff-back-pill linking to "/"`);

  // --------------------------------------------------------------------------
  // SECTION 5: Cloudflare Workers Static Assets HTTP Routing Simulation
  // --------------------------------------------------------------------------
  console.log('\n5. Testing Static Assets Routing & 404 Contract via Live Preview Server...');
  const TEST_PORT = 8092;
  const server = startServer(TEST_PORT);
  const BASE_URL = `http://localhost:${TEST_PORT}`;

  try {
    // Wait briefly for server to bind
    await new Promise(r => setTimeout(r, 150));

    // Test 5.1: Root Landing
    const rootRes = await fetchUrl(`${BASE_URL}/`);
    assert(rootRes.statusCode === 200, 'GET / returns HTTP 200 OK');
    assert(rootRes.headers['content-type']?.includes('text/html'), 'GET / returns Content-Type text/html');
    assert(rootRes.body.includes('Front-End Riffs'), 'GET / body contains hero title');

    // Test 5.2: Static Core Assets
    const styleRes = await fetchUrl(`${BASE_URL}/style.css`);
    assert(styleRes.statusCode === 200 && styleRes.headers['content-type']?.includes('text/css'), 'GET /style.css returns HTTP 200 text/css');

    const appJsRes = await fetchUrl(`${BASE_URL}/app.js`);
    assert(appJsRes.statusCode === 200 && appJsRes.headers['content-type']?.includes('javascript'), 'GET /app.js returns HTTP 200 javascript');

    const licenseRes = await fetchUrl(`${BASE_URL}/LICENSE`);
    assert(licenseRes.statusCode === 200, 'GET /LICENSE returns HTTP 200 OK');

    const brandmarkRes = await fetchUrl(`${BASE_URL}/assets/icons/brandmark.svg`);
    assert(brandmarkRes.statusCode === 200 && brandmarkRes.headers['content-type']?.includes('svg'), 'GET /assets/icons/brandmark.svg returns HTTP 200 image/svg+xml');

    // Test 5.3: Primary Route /half-life-clone/
    const primaryRes = await fetchUrl(`${BASE_URL}/half-life-clone/`);
    assert(primaryRes.statusCode === 200, 'GET /half-life-clone/ returns HTTP 200 OK');
    assert(primaryRes.headers['content-type']?.includes('text/html'), 'GET /half-life-clone/ returns Content-Type text/html');

    // Test 5.4: Directory Trailing-Slash Redirect for Primary Route
    const primaryRedirect = await fetchUrl(`${BASE_URL}/half-life-clone`);
    assert(primaryRedirect.statusCode === 301, 'GET /half-life-clone returns HTTP 301 Redirect');
    assert(primaryRedirect.headers.location === '/half-life-clone/', 'GET /half-life-clone redirects to /half-life-clone/');

    // Test 5.5: Alias Route /projects/half-life-clone/
    const aliasRes = await fetchUrl(`${BASE_URL}/projects/half-life-clone/`);
    assert(aliasRes.statusCode === 200, 'GET /projects/half-life-clone/ returns HTTP 200 OK');
    assert(aliasRes.headers['content-type']?.includes('text/html'), 'GET /projects/half-life-clone/ returns Content-Type text/html');
    assert(primaryRes.body === aliasRes.body, 'Primary and Alias routes return identical content');

    // Test 5.6: Directory Trailing-Slash Redirect for Alias Route
    const aliasRedirect = await fetchUrl(`${BASE_URL}/projects/half-life-clone`);
    assert(aliasRedirect.statusCode === 301, 'GET /projects/half-life-clone returns HTTP 301 Redirect');
    assert(aliasRedirect.headers.location === '/projects/half-life-clone/', 'GET /projects/half-life-clone redirects to /projects/half-life-clone/');

    // Test 5.7: Sub-page Dual Routing
    const primaryAlyxRes = await fetchUrl(`${BASE_URL}/half-life-clone/alyx.html`);
    const aliasAlyxRes = await fetchUrl(`${BASE_URL}/projects/half-life-clone/alyx.html`);
    assert(primaryAlyxRes.statusCode === 200, 'GET /half-life-clone/alyx.html returns HTTP 200 OK');
    assert(aliasAlyxRes.statusCode === 200, 'GET /projects/half-life-clone/alyx.html returns HTTP 200 OK');
    assert(primaryAlyxRes.body === aliasAlyxRes.body, 'Sub-page primary and alias bodies match identically');

    // Test 5.8: Cloudflare Workers not_found_handling = "404-page" Contract
    const notFoundRoot = await fetchUrl(`${BASE_URL}/unmapped-route-xyz`);
    assert(notFoundRoot.statusCode === 404, 'GET /unmapped-route-xyz returns HTTP 404');
    assert(notFoundRoot.headers['content-type']?.includes('text/html'), '404 response has Content-Type text/html');
    assert(notFoundRoot.body.includes('404: Riff Not Found'), '404 response serves terminal 404 error page');
    assert(notFoundRoot.body.includes('ERROR 404 // ROUTE_NOT_FOUND'), '404 response contains diagnostic terminal badge');

    const notFoundProject = await fetchUrl(`${BASE_URL}/projects/unmapped-project`);
    assert(notFoundProject.statusCode === 404, 'GET /projects/unmapped-project returns HTTP 404');
    assert(notFoundProject.body.includes('404: Riff Not Found'), '404 response on project path serves terminal 404 error page');

    // Test 5.9: HEAD Requests
    const headRes = await fetchUrl(`${BASE_URL}/`, 'HEAD');
    assert(headRes.statusCode === 200, 'HEAD / returns HTTP 200 OK');
    assert(headRes.headers['content-type']?.includes('text/html'), 'HEAD / includes Content-Type text/html');
    assert(headRes.body === '', 'HEAD / response body is empty');

    const head404Res = await fetchUrl(`${BASE_URL}/nonexistent-head`, 'HEAD');
    assert(head404Res.statusCode === 404, 'HEAD /nonexistent-head returns HTTP 404');
    assert(head404Res.body === '', 'HEAD 404 response body is empty');

    // Test 5.10: Security - Directory Traversal Prevention
    const traversalAttempt1 = await fetchUrl(`${BASE_URL}/../package.json`);
    assert(traversalAttempt1.statusCode === 403 || traversalAttempt1.statusCode === 404, 'Traversal /../package.json is rejected (HTTP 403 / 404)');

    const traversalAttempt2 = await fetchUrl(`${BASE_URL}/%2e%2e%2fpackage.json`);
    assert(traversalAttempt2.statusCode === 403 || traversalAttempt2.statusCode === 404, 'Encoded traversal /%2e%2e%2fpackage.json is rejected (HTTP 403 / 404)');

  } finally {
    await new Promise(r => server.close(r));
  }

  // --------------------------------------------------------------------------
  // SUMMARY
  // --------------------------------------------------------------------------
  console.log('\n================================================================');
  console.log(`  v1.0.2 Verification Results: ${passedTests}/${totalTests} Passed (${failedTests} Failed)`);
  console.log('================================================================\n');

  if (failedTests > 0) {
    process.exit(1);
  }
}

runVerification().catch(err => {
  console.error('\n\x1b[31mVerification crashed:\x1b[0m', err);
  process.exit(1);
});

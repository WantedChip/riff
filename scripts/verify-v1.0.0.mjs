/**
 * ==============================================================================
 * Sub-phase v1.0.0 Automated Verification Suite
 * Monorepo Build Compilation & Dual Routing Test
 * ==============================================================================
 *
 * This test suite thoroughly verifies:
 * 1. Clean & Build Pipeline Execution & Latency:
 *    - `clean()` wipes dist/ and temporary artifacts cleanly
 *    - `build()` compiles from scratch in < 2.0s with zero errors
 *    - Multi-run benchmark latency verification
 * 2. Static Output File & Schema Integrity:
 *    - `dist/index.html` (Landing portal with pre-baked project cards)
 *    - `dist/404.html` (Standalone terminal error page)
 *    - `dist/style.css` and `dist/app.js` (Compiled, minified, non-empty)
 *    - `dist/projects.json` and `dist/riffs.json` (Strict schema contract validation)
 *    - `dist/robots.txt` and `dist/sitemap.xml` (Search engine directives & URL set)
 * 3. Primary & Subpath Alias Dual Routing Mirroring:
 *    - Primary route: `dist/half-life-clone/`
 *    - Alias route: `dist/projects/half-life-clone/`
 *    - Recursive directory structure & SHA256 file content mirroring
 *    - Verification of return breadcrumb on all project HTML documents
 * 4. Zero-Dependency HTTP Server & Live Dual Routing Simulation:
 *    - Live HTTP 200 checks for root landing, manifests, assets, primary and alias routes
 *    - HTTP 301 trailing-slash directory redirects mirroring Cloudflare Workers Static Assets
 *    - HTTP 404 fallback routing
 *    - HEAD request handling
 *    - Directory traversal protection (403 Forbidden)
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

function computeFileHash(filePath) {
  const content = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(content).digest('hex');
}

function getAllFilesRecursively(dir, baseDir = dir) {
  let results = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relPath = path.relative(baseDir, fullPath).replace(/\\/g, '/');
    if (entry.isDirectory()) {
      results = results.concat(getAllFilesRecursively(fullPath, baseDir));
    } else {
      results.push({ relPath, fullPath, size: fs.statSync(fullPath).size });
    }
  }
  return results;
}

async function runSuite() {
  console.log('\n\x1b[1m\x1b[36m==============================================================================\x1b[0m');
  console.log('\x1b[1m\x1b[36m SUB-PHASE v1.0.0 — MONOREPO BUILD COMPILATION & DUAL ROUTING VERIFICATION\x1b[0m');
  console.log('\x1b[1m\x1b[36m==============================================================================\x1b[0m\n');

  // ============================================================================
  // Suite 1: Clean & Build Pipeline Execution & Latency Benchmarking
  // ============================================================================
  console.log('\x1b[1m[Suite 1: Clean & Build Pipeline Execution & Latency]\x1b[0m');

  await clean();
  assert(!fs.existsSync(DIST_DIR), 'clean() removes dist/ directory completely');

  const buildResult = await build();
  assert(fs.existsSync(DIST_DIR), 'build() generates dist/ directory');
  assert(typeof buildResult.duration === 'number', `build() returns duration benchmark: ${buildResult.duration}s`);
  assert(buildResult.duration < 2.0, `build() execution latency is well under 2.0s (measured: ${buildResult.duration}s)`);
  assert(Array.isArray(buildResult.projectManifests), 'build() returns array of project manifests');
  assert(buildResult.projectManifests.length >= 1, `build() compiled at least 1 project (found: ${buildResult.projectManifests.length})`);

  // Run 3 additional build benchmark runs to ensure latency stability
  const latencies = [buildResult.duration];
  for (let i = 1; i <= 3; i++) {
    const res = await build();
    latencies.push(res.duration);
  }
  const avgLatency = (latencies.reduce((a, b) => a + b, 0) / latencies.length).toFixed(3);
  const maxLatency = Math.max(...latencies).toFixed(3);
  console.log(`  \x1b[90m(Benchmark latencies: [${latencies.map(l => l + 's').join(', ')}], avg: ${avgLatency}s, max: ${maxLatency}s)\x1b[0m`);
  assert(parseFloat(maxLatency) < 2.0, `All build benchmark runs stay under 2.0s limit (max: ${maxLatency}s, avg: ${avgLatency}s)`);

  // ============================================================================
  // Suite 2: Compiled Root Artifacts & Asset Validation
  // ============================================================================
  console.log('\n\x1b[1m[Suite 2: Compiled Root Artifacts & Asset Validation]\x1b[0m');

  const indexHtmlPath = path.join(DIST_DIR, 'index.html');
  assert(fs.existsSync(indexHtmlPath), 'dist/index.html exists');
  const indexHtml = await fsp.readFile(indexHtmlPath, 'utf8');
  assert(indexHtml.includes('<!DOCTYPE html>') || indexHtml.includes('<!doctype html>'), 'dist/index.html has valid DOCTYPE');
  assert(indexHtml.includes('Front-End Riffs &amp; <span class="hero-title-accent">Design Crafts</span>'), 'dist/index.html contains semantic editorial hero title');
  assert(indexHtml.includes('id="project-grid"'), 'dist/index.html contains #project-grid showcase matrix');
  assert(indexHtml.includes('data-slug="half-life-clone"'), 'dist/index.html pre-renders half-life-clone card');
  assert(indexHtml.includes('href="/half-life-clone/"'), 'dist/index.html pre-renders primary launch route /half-life-clone/');
  assert(indexHtml.includes('id="empty-state"'), 'dist/index.html includes static #empty-state recovery container');
  assert(indexHtml.includes('id="preview-modal"'), 'dist/index.html includes in-situ quick view modal shell');

  const errorHtmlPath = path.join(DIST_DIR, '404.html');
  assert(fs.existsSync(errorHtmlPath), 'dist/404.html exists');
  const errorHtml = await fsp.readFile(errorHtmlPath, 'utf8');
  assert(errorHtml.includes('404: Riff Not Found'), 'dist/404.html contains terminal 404 error headline');
  assert(errorHtml.includes('ERROR 404 // ROUTE_NOT_FOUND'), 'dist/404.html contains technical error badge');
  assert(errorHtml.includes('href="/"'), 'dist/404.html contains primary recovery link to /');

  const styleCssPath = path.join(DIST_DIR, 'style.css');
  assert(fs.existsSync(styleCssPath), 'dist/style.css exists');
  const styleCss = await fsp.readFile(styleCssPath, 'utf8');
  assert(styleCss.length > 5000, `dist/style.css is compiled and non-empty (${styleCss.length} bytes)`);
  assert(styleCss.includes('--bg-void') && styleCss.includes('--accent-flame'), 'dist/style.css includes Obsidian design tokens');

  const appJsPath = path.join(DIST_DIR, 'app.js');
  assert(fs.existsSync(appJsPath), 'dist/app.js exists');
  const appJs = await fsp.readFile(appJsPath, 'utf8');
  assert(appJs.length > 3000, `dist/app.js is compiled and non-empty (${appJs.length} bytes)`);
  assert(appJs.includes('openPreview') && appJs.includes('applyFilters'), 'dist/app.js contains core client interaction handlers');

  // ============================================================================
  // Suite 3: Manifest Contracts (dist/projects.json & dist/riffs.json)
  // ============================================================================
  console.log('\n\x1b[1m[Suite 3: Public Manifest JSON Schema Contracts]\x1b[0m');

  const projectsJsonPath = path.join(DIST_DIR, 'projects.json');
  const riffsJsonPath = path.join(DIST_DIR, 'riffs.json');
  assert(fs.existsSync(projectsJsonPath), 'dist/projects.json exists');
  assert(fs.existsSync(riffsJsonPath), 'dist/riffs.json exists');

  const rawProjects = await fsp.readFile(projectsJsonPath, 'utf8');
  const rawRiffs = await fsp.readFile(riffsJsonPath, 'utf8');
  assert(rawProjects === rawRiffs, 'dist/projects.json and dist/riffs.json have identical content');

  let projectsData;
  try {
    projectsData = JSON.parse(rawProjects);
    assert(Array.isArray(projectsData), 'dist/projects.json parses to a valid JSON array');
  } catch (err) {
    assert(false, `dist/projects.json failed JSON parse: ${err.message}`);
  }

  assert(projectsData.length === 1, `dist/projects.json contains exactly 1 project entry (found: ${projectsData.length})`);
  const hlProject = projectsData[0];

  assert(hlProject.id === 'half-life-clone', `Project id is 'half-life-clone' (got: ${hlProject.id})`);
  assert(hlProject.slug === 'half-life-clone', `Project slug is 'half-life-clone' (got: ${hlProject.slug})`);
  assert(hlProject.name === 'Half-Life Franchise Website', `Project name is 'Half-Life Franchise Website' (got: ${hlProject.name})`);
  assert(hlProject.title === 'Half-Life Franchise Website', `Project title is 'Half-Life Franchise Website' (got: ${hlProject.title})`);
  assert(typeof hlProject.description === 'string' && hlProject.description.length > 20, 'Project has rich description');
  assert(hlProject.category === 'Clone', `Project category is 'Clone' (got: ${hlProject.category})`);
  assert(Array.isArray(hlProject.tags) && hlProject.tags.length >= 3, `Project has valid tags array (tags: ${hlProject.tags.join(', ')})`);
  assert(hlProject.folder === 'half life clone', `Project folder matches source 'half life clone'`);
  assert(hlProject.thumbnail === '/half-life-clone/assets/images/hero-alyx.webp', `Project thumbnail uses compressed webp path: ${hlProject.thumbnail}`);
  assert(hlProject.author === 'sohamlabs', `Project author is 'sohamlabs'`);
  assert(hlProject.version === '1.0.0', `Project version is '1.0.0'`);
  assert(/^\d{4}-\d{2}-\d{2}$/.test(hlProject.created), `Project created date matches YYYY-MM-DD format (got: ${hlProject.created})`);
  assert(hlProject.buildType === 'static', `Project buildType is 'static'`);
  assert(hlProject.route === '/half-life-clone/', `Project primary route contract: '${hlProject.route}'`);
  assert(hlProject.aliasRoute === '/projects/half-life-clone/', `Project alias route contract: '${hlProject.aliasRoute}'`);

  // ============================================================================
  // Suite 4: SEO Directives (robots.txt & sitemap.xml)
  // ============================================================================
  console.log('\n\x1b[1m[Suite 4: Search Engine Directives & Sitemaps]\x1b[0m');

  const robotsPath = path.join(DIST_DIR, 'robots.txt');
  assert(fs.existsSync(robotsPath), 'dist/robots.txt exists');
  const robotsContent = await fsp.readFile(robotsPath, 'utf8');
  assert(robotsContent.includes('User-agent: *'), 'dist/robots.txt has User-agent: *');
  assert(robotsContent.includes('Allow: /'), 'dist/robots.txt has Allow: /');
  assert(robotsContent.includes('Sitemap: https://riff.sohamlabs.workers.dev/sitemap.xml'), 'dist/robots.txt points to canonical sitemap.xml');

  const sitemapPath = path.join(DIST_DIR, 'sitemap.xml');
  assert(fs.existsSync(sitemapPath), 'dist/sitemap.xml exists');
  const sitemapContent = await fsp.readFile(sitemapPath, 'utf8');
  assert(sitemapContent.includes('<?xml version="1.0" encoding="UTF-8"?>'), 'dist/sitemap.xml has XML header');
  assert(sitemapContent.includes('<loc>https://riff.sohamlabs.workers.dev/</loc>'), 'dist/sitemap.xml includes root URL');
  assert(sitemapContent.includes('<loc>https://riff.sohamlabs.workers.dev/half-life-clone/</loc>'), 'dist/sitemap.xml includes primary project route');
  assert(sitemapContent.includes('<loc>https://riff.sohamlabs.workers.dev/projects/half-life-clone/</loc>'), 'dist/sitemap.xml includes alias project route');

  // ============================================================================
  // Suite 5: Dual Routing Mirroring & Breadcrumb Verification
  // ============================================================================
  console.log('\n\x1b[1m[Suite 5: Dual Routing Mirroring & Breadcrumb Verification]\x1b[0m');

  const primaryDir = path.join(DIST_DIR, 'half-life-clone');
  const aliasDir = path.join(DIST_DIR, 'projects', 'half-life-clone');
  assert(fs.existsSync(primaryDir), 'Primary route directory dist/half-life-clone/ exists');
  assert(fs.existsSync(aliasDir), 'Alias route directory dist/projects/half-life-clone/ exists');

  const primaryFiles = getAllFilesRecursively(primaryDir);
  const aliasFiles = getAllFilesRecursively(aliasDir);
  assert(primaryFiles.length > 0, `Primary route contains ${primaryFiles.length} files`);
  assert(primaryFiles.length === aliasFiles.length, `File counts match between primary (${primaryFiles.length}) and alias (${aliasFiles.length})`);

  let allFilesMatch = true;
  let mismatchedFile = null;
  for (const pFile of primaryFiles) {
    const correspondingAliasPath = path.join(aliasDir, pFile.relPath);
    if (!fs.existsSync(correspondingAliasPath)) {
      allFilesMatch = false;
      mismatchedFile = `Missing in alias: ${pFile.relPath}`;
      break;
    }
    const pHash = computeFileHash(pFile.fullPath);
    const aHash = computeFileHash(correspondingAliasPath);
    if (pHash !== aHash) {
      allFilesMatch = false;
      mismatchedFile = `Hash mismatch on: ${pFile.relPath}`;
      break;
    }
  }
  assert(allFilesMatch, mismatchedFile || 'All files and SHA256 checksums match 100% identically across primary and alias routes');

  // Check required sub-pages in both primary and alias
  const requiredSubPages = ['index.html', 'alyx.html', 'halflife.html', 'halflife2.html', 'episode1.html', 'episode2.html'];
  for (const page of requiredSubPages) {
    const pPath = path.join(primaryDir, page);
    const aPath = path.join(aliasDir, page);
    assert(fs.existsSync(pPath) && fs.existsSync(aPath), `Required sub-page '${page}' exists in both primary and alias routes`);
    
    if (fs.existsSync(pPath)) {
      const pageHtml = fs.readFileSync(pPath, 'utf8');
      assert(pageHtml.includes('class="riff-back-pill"'), `Page '${page}' contains standalone return breadcrumb .riff-back-pill`);
      assert(pageHtml.includes('href="/"'), `Page '${page}' return breadcrumb links to root '/'`);
    }
  }

  // ============================================================================
  // Suite 6: Live Zero-Dependency HTTP Server Simulation
  // ============================================================================
  console.log('\n\x1b[1m[Suite 6: Live Zero-Dependency HTTP Server Simulation]\x1b[0m');

  const testPort = 8899;
  const server = startServer({ port: testPort });

  await new Promise(r => setTimeout(r, 200));

  try {
    const baseUrl = `http://localhost:${testPort}`;

    // Test root landing
    const rootRes = await fetchUrl(`${baseUrl}/`);
    assert(rootRes.statusCode === 200, `GET / returns HTTP 200 (got: ${rootRes.statusCode})`);
    assert(rootRes.headers['content-type'].includes('text/html'), 'GET / Content-Type is text/html');
    assert(rootRes.body.includes('Front-End Riffs &amp; <span class="hero-title-accent">Design Crafts</span>'), 'GET / response body contains landing title');

    // Test explicit index.html
    const indexRes = await fetchUrl(`${baseUrl}/index.html`);
    assert(indexRes.statusCode === 200, `GET /index.html returns HTTP 200`);

    // Test 404 page directly
    const direct404Res = await fetchUrl(`${baseUrl}/404.html`);
    assert(direct404Res.statusCode === 200, `GET /404.html returns HTTP 200`);

    // Test unknown route fallback
    const unknownRes = await fetchUrl(`${baseUrl}/unknown-nonexistent-route-xyz`);
    assert(unknownRes.statusCode === 404, `GET /unknown-nonexistent-route-xyz returns HTTP 404 (got: ${unknownRes.statusCode})`);
    assert(unknownRes.body.includes('404: Riff Not Found'), '404 response serves terminal diagnostics 404.html');

    // Test CSS & JS assets
    const cssRes = await fetchUrl(`${baseUrl}/style.css`);
    assert(cssRes.statusCode === 200 && cssRes.headers['content-type'].includes('text/css'), 'GET /style.css returns HTTP 200 with text/css');

    const jsRes = await fetchUrl(`${baseUrl}/app.js`);
    assert(jsRes.statusCode === 200 && jsRes.headers['content-type'].includes('application/javascript'), 'GET /app.js returns HTTP 200 with application/javascript');

    // Test manifests
    const projRes = await fetchUrl(`${baseUrl}/projects.json`);
    assert(projRes.statusCode === 200 && projRes.headers['content-type'].includes('application/json'), 'GET /projects.json returns HTTP 200 with application/json');

    const riffRes = await fetchUrl(`${baseUrl}/riffs.json`);
    assert(riffRes.statusCode === 200 && riffRes.headers['content-type'].includes('application/json'), 'GET /riffs.json returns HTTP 200 with application/json');

    // Test robots.txt & sitemap.xml
    const robotsRes = await fetchUrl(`${baseUrl}/robots.txt`);
    assert(robotsRes.statusCode === 200 && robotsRes.headers['content-type'].includes('text/plain'), 'GET /robots.txt returns HTTP 200 with text/plain');

    const sitemapRes = await fetchUrl(`${baseUrl}/sitemap.xml`);
    assert(sitemapRes.statusCode === 200 && sitemapRes.headers['content-type'].includes('application/xml'), 'GET /sitemap.xml returns HTTP 200 with application/xml');

    // Test primary route trailing slash redirect
    const primNoSlash = await fetchUrl(`${baseUrl}/half-life-clone`);
    assert(primNoSlash.statusCode === 301, `GET /half-life-clone returns 301 redirect without trailing slash`);
    assert(primNoSlash.headers['location'] === '/half-life-clone/', `301 redirect target is '/half-life-clone/'`);

    // Test primary route with trailing slash
    const primSlash = await fetchUrl(`${baseUrl}/half-life-clone/`);
    assert(primSlash.statusCode === 200, `GET /half-life-clone/ returns HTTP 200`);
    assert(primSlash.body.includes('class="riff-back-pill"'), 'GET /half-life-clone/ body contains return breadcrumb');

    // Test alias route trailing slash redirect
    const aliasNoSlash = await fetchUrl(`${baseUrl}/projects/half-life-clone`);
    assert(aliasNoSlash.statusCode === 301, `GET /projects/half-life-clone returns 301 redirect without trailing slash`);
    assert(aliasNoSlash.headers['location'] === '/projects/half-life-clone/', `301 redirect target is '/projects/half-life-clone/'`);

    // Test alias route with trailing slash
    const aliasSlash = await fetchUrl(`${baseUrl}/projects/half-life-clone/`);
    assert(aliasSlash.statusCode === 200, `GET /projects/half-life-clone/ returns HTTP 200`);
    assert(aliasSlash.body.includes('class="riff-back-pill"'), 'GET /projects/half-life-clone/ body contains return breadcrumb');

    // Test primary and alias sub-pages
    const primAlyx = await fetchUrl(`${baseUrl}/half-life-clone/alyx.html`);
    assert(primAlyx.statusCode === 200, `GET /half-life-clone/alyx.html returns HTTP 200`);

    const aliasAlyx = await fetchUrl(`${baseUrl}/projects/half-life-clone/alyx.html`);
    assert(aliasAlyx.statusCode === 200, `GET /projects/half-life-clone/alyx.html returns HTTP 200`);

    // Test webp image asset serving
    const webpRes = await fetchUrl(`${baseUrl}/half-life-clone/assets/images/hero-alyx.webp`);
    assert(webpRes.statusCode === 200 && webpRes.headers['content-type'].includes('image/webp'), 'GET /half-life-clone/assets/images/hero-alyx.webp returns HTTP 200 image/webp');

    // Test HEAD request
    const headRes = await fetchUrl(`${baseUrl}/`, 'HEAD');
    assert(headRes.statusCode === 200, 'HEAD / returns HTTP 200');
    assert(headRes.body.length === 0, 'HEAD / body is empty');

    // Test traversal protection
    const traversalRes = await fetchUrl(`${baseUrl}/../package.json`);
    assert(traversalRes.statusCode === 403 || traversalRes.statusCode === 404, `Directory traversal attempt blocked with status ${traversalRes.statusCode}`);

  } finally {
    server.close();
  }

  // ============================================================================
  // Summary
  // ============================================================================
  console.log('\n\x1b[1m\x1b[36m==============================================================================\x1b[0m');
  console.log(`\x1b[1mVERIFICATION SUMMARY: ${passedTests} / ${totalTests} assertions passed (${failedTests} failed)\x1b[0m`);
  console.log('\x1b[1m\x1b[36m==============================================================================\x1b[0m\n');

  if (failedTests > 0) {
    process.exit(1);
  }
}

runSuite().catch(err => {
  console.error('\x1b[31mVerification test suite failed with unexpected exception:\x1b[0m', err);
  process.exit(1);
});

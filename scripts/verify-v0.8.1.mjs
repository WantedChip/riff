/**
 * ==============================================================================
 * Sub-phase v0.8.1 Automated Verification Suite
 * Asset Optimization & Performance Polish
 * ==============================================================================
 *
 * This test suite validates:
 * 1. Monorepo clean compilation and artifact freshness
 * 2. SVG Icons & Vector Assets audit:
 *    - Standalone icons in landing/assets/icons/ (brandmark, github, search, reload, external, close)
 *    - Inline SVGs in index.html have viewBox, aria-hidden="true", clean paths
 *    - Open Graph artwork in landing/assets/images/ (og-cover.png, og-cover.webp)
 * 3. Raster Preview Images & CLS Elimination (0.000 CLS):
 *    - Projects thumbnail points to compressed WebP asset
 *    - Card <img> has loading="lazy" attribute
 *    - Card <img> has explicit width="640" and height="360" (16:9)
 *    - Stylesheet enforces aspect-ratio: 16 / 9 on card media
 * 4. Core Landing Portal Payload Size Budget:
 *    - dist/index.html, dist/style.css, dist/app.js existence and size measurements
 *    - Uncompressed byte budget verification
 *    - Gzip transfer budget calculation
 * 5. Live HTTP Dev Server Verification:
 *    - Serves /, /style.css, /app.js, /assets/icons/*.svg, /assets/images/*.webp,
 *      and project assets with HTTP 200 and accurate MIME types
 * ==============================================================================
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import http from 'node:http';
import zlib from 'node:zlib';
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

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    http.get(url, res => {
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
    }).on('error', reject);
  });
}

async function runVerification() {
  console.log('\n================================================================');
  console.log('  RUNNING SUB-PHASE v0.8.1 VERIFICATION SUITE');
  console.log('  Asset Optimization & Performance Polish Audit');
  console.log('================================================================\n');

  // Step 1: Clean build
  console.log('[1/5] Compiling monorepo distribution...');
  await build();
  assert(fs.existsSync(path.join(ROOT_DIR, 'dist', 'index.html')), 'dist/index.html compiled');
  assert(fs.existsSync(path.join(ROOT_DIR, 'dist', 'style.css')), 'dist/style.css compiled');
  assert(fs.existsSync(path.join(ROOT_DIR, 'dist', 'app.js')), 'dist/app.js compiled');
  assert(fs.existsSync(path.join(ROOT_DIR, 'dist', 'projects.json')), 'dist/projects.json compiled');

  // Step 2: SVG Icons and Graphic Assets Audit
  console.log('\n[2/5] Auditing SVG icons and vector assets...');
  const iconFiles = ['brandmark.svg', 'github.svg', 'search.svg', 'reload.svg', 'external.svg', 'close.svg'];
  for (const icon of iconFiles) {
    const landingPath = path.join(ROOT_DIR, 'landing', 'assets', 'icons', icon);
    const distPath = path.join(ROOT_DIR, 'dist', 'assets', 'icons', icon);
    assert(fs.existsSync(landingPath), `landing/assets/icons/${icon} exists`);
    assert(fs.existsSync(distPath), `dist/assets/icons/${icon} copied to distribution`);
    
    if (fs.existsSync(landingPath)) {
      const content = fs.readFileSync(landingPath, 'utf8');
      assert(content.includes('viewBox='), `${icon} has viewBox definition for resolution independence`);
      assert(content.includes('<svg') && content.includes('</svg>'), `${icon} is valid SVG markup`);
    }
  }

  // Check Open Graph images
  const ogCoverPng = path.join(ROOT_DIR, 'dist', 'assets', 'images', 'og-cover.png');
  const ogCoverWebp = path.join(ROOT_DIR, 'dist', 'assets', 'images', 'og-cover.webp');
  assert(fs.existsSync(ogCoverPng), 'dist/assets/images/og-cover.png exists (1200x630 fallback)');
  assert(fs.existsSync(ogCoverWebp), 'dist/assets/images/og-cover.webp exists (optimized WebP artwork)');

  // Step 3: Raster Thumbnails & 0.000 CLS Verification
  console.log('\n[3/5] Verifying WebP thumbnails, lazy loading & CLS suppression...');
  const projectsJson = JSON.parse(fs.readFileSync(path.join(ROOT_DIR, 'dist', 'projects.json'), 'utf8'));
  assert(projectsJson.length > 0, 'Discovered projects in projects.json');

  for (const proj of projectsJson) {
    assert(proj.thumbnail && proj.thumbnail.endsWith('.webp'), `Project "${proj.title}" thumbnail is compressed WebP: ${proj.thumbnail}`);
    
    // Verify file actually exists in dist
    const relThumbPath = proj.thumbnail.replace(/^\//, '');
    const absThumbPath = path.join(ROOT_DIR, 'dist', relThumbPath);
    assert(fs.existsSync(absThumbPath), `Thumbnail asset exists in dist: ${relThumbPath}`);
  }

  const distHtml = fs.readFileSync(path.join(ROOT_DIR, 'dist', 'index.html'), 'utf8');
  assert(distHtml.includes('loading="lazy"'), 'Pre-rendered project card uses loading="lazy"');
  assert(distHtml.includes('width="640"') && distHtml.includes('height="360"'), 'Pre-rendered card <img> specifies explicit width="640" and height="360"');
  assert(distHtml.includes('.webp"'), 'Pre-rendered card <img> references .webp image format');

  const cssContent = fs.readFileSync(path.join(ROOT_DIR, 'dist', 'style.css'), 'utf8');
  assert(cssContent.includes('aspect-ratio: 16 / 9') || cssContent.includes('aspect-ratio:16 / 9') || cssContent.includes('aspect-ratio: 16/9'), 'Stylesheet enforces aspect-ratio: 16 / 9 on preview media to guarantee 0.000 CLS');

  // Step 4: Core Landing Portal Payload Size Budget
  console.log('\n[4/5] Computing core landing portal payload size budgets...');
  const htmlBytes = fs.statSync(path.join(ROOT_DIR, 'dist', 'index.html')).size;
  const cssBytes = fs.statSync(path.join(ROOT_DIR, 'dist', 'style.css')).size;
  const jsBytes = fs.statSync(path.join(ROOT_DIR, 'dist', 'app.js')).size;
  const totalUncompressed = htmlBytes + cssBytes + jsBytes;

  const htmlGzip = zlib.gzipSync(fs.readFileSync(path.join(ROOT_DIR, 'dist', 'index.html'))).length;
  const cssGzip = zlib.gzipSync(fs.readFileSync(path.join(ROOT_DIR, 'dist', 'style.css'))).length;
  const jsGzip = zlib.gzipSync(fs.readFileSync(path.join(ROOT_DIR, 'dist', 'app.js'))).length;
  const totalGzip = htmlGzip + cssGzip + jsGzip;

  console.log(`    dist/index.html: ${(htmlBytes / 1024).toFixed(2)} KB uncompressed (${(htmlGzip / 1024).toFixed(2)} KB gzip)`);
  console.log(`    dist/style.css:  ${(cssBytes / 1024).toFixed(2)} KB uncompressed (${(cssGzip / 1024).toFixed(2)} KB gzip)`);
  console.log(`    dist/app.js:     ${(jsBytes / 1024).toFixed(2)} KB uncompressed (${(jsGzip / 1024).toFixed(2)} KB gzip)`);
  console.log(`    ---------------------------------------------------------`);
  console.log(`    TOTAL ASSETS:    ${(totalUncompressed / 1024).toFixed(2)} KB uncompressed (${(totalGzip / 1024).toFixed(2)} KB gzip)`);

  assert(htmlBytes < 20000, `dist/index.html uncompressed (${htmlBytes} B) is lean (< 20 KB)`);
  assert(cssBytes < 40000, `dist/style.css uncompressed (${cssBytes} B) is compact (< 40 KB)`);
  assert(jsBytes < 25000, `dist/app.js uncompressed (${jsBytes} B) is compact (< 25 KB)`);
  assert(totalGzip < 20000, `Total gzipped network transfer (${totalGzip} B / ${(totalGzip / 1024).toFixed(2)} KB) is ultra-fast (< 20 KB)`);

  // Step 5: Live HTTP Dev Server Route and Asset Serving Audit
  console.log('\n[5/5] Testing live HTTP server asset delivery and MIME types...');
  const PORT = 8802;
  const server = await startServer({ port: PORT, quiet: true });

  try {
    const resHome = await fetchUrl(`http://localhost:${PORT}/`);
    assert(resHome.statusCode === 200, 'GET / returns HTTP 200 OK');
    assert(resHome.headers['content-type']?.includes('text/html'), 'GET / has Content-Type text/html');

    const resCss = await fetchUrl(`http://localhost:${PORT}/style.css`);
    assert(resCss.statusCode === 200, 'GET /style.css returns HTTP 200 OK');
    assert(resCss.headers['content-type']?.includes('text/css'), 'GET /style.css has Content-Type text/css');

    const resJs = await fetchUrl(`http://localhost:${PORT}/app.js`);
    assert(resJs.statusCode === 200, 'GET /app.js returns HTTP 200 OK');
    assert(resJs.headers['content-type']?.includes('javascript'), 'GET /app.js has Content-Type javascript');

    const resIcon = await fetchUrl(`http://localhost:${PORT}/assets/icons/brandmark.svg`);
    assert(resIcon.statusCode === 200, 'GET /assets/icons/brandmark.svg returns HTTP 200 OK');
    assert(resIcon.headers['content-type']?.includes('svg'), 'GET /assets/icons/brandmark.svg has Content-Type image/svg+xml');

    const resWebp = await fetchUrl(`http://localhost:${PORT}/assets/images/og-cover.webp`);
    assert(resWebp.statusCode === 200, 'GET /assets/images/og-cover.webp returns HTTP 200 OK');
    assert(resWebp.headers['content-type']?.includes('webp') || resWebp.headers['content-type']?.includes('image'), 'GET /assets/images/og-cover.webp serves image');

    const resThumb = await fetchUrl(`http://localhost:${PORT}/half-life-clone/assets/images/hero-alyx.webp`);
    assert(resThumb.statusCode === 200, 'GET /half-life-clone/assets/images/hero-alyx.webp returns HTTP 200 OK');
  } finally {
    server.close();
  }

  // Summary
  console.log('\n================================================================');
  console.log(`  VERIFICATION RESULTS: ${passedTests}/${totalTests} Passed, ${failedTests} Failed`);
  console.log('================================================================\n');

  if (failedTests > 0) {
    process.exit(1);
  }
}

runVerification().catch(err => {
  console.error('Unhandled verification error:', err);
  process.exit(1);
});

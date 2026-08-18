#!/usr/bin/env node

/**
 * ==============================================================================
 * RIFF MONOREPO COMPILATION & AGGREGATION SCRIPT
 * ==============================================================================
 *
 * Compiles all projects under `projects/` and the main `landing/` portal into
 * a unified distribution directory (`dist/`) for Cloudflare Workers deployment.
 *
 * Capabilities:
 * - Scans and auto-discovers all projects under `projects/`.
 * - Handles both Pure Static assets and Framework-based builds (Vite, Astro, etc.).
 * - Slugifies and normalizes directory routes (e.g., "half life clone" -> "/half-life-clone").
 * - Establishes dual routing: primary route at `/<slug>/` and alias route at `/projects/<slug>/`.
 * - Extracts and aggregates rich metadata into `dist/projects.json`.
 * - Compiles the main `landing/` site to `dist/`.
 * - Generates fallback 404, sitemap.xml, and robots.txt.
 * - Built-in zero-dependency local preview server via `--serve`.
 * ==============================================================================
 */

import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';
import http from 'node:http';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const PROJECTS_DIR = path.join(ROOT_DIR, 'projects');
const LANDING_DIR = path.join(ROOT_DIR, 'landing');
const DIST_DIR = path.join(ROOT_DIR, 'dist');

// Global ignore patterns for file copying
const IGNORE_PATTERNS = [
  '.git',
  '.agents',
  '.gemini',
  '.antigravity',
  '.claude',
  '.cursor',
  '.aider',
  'node_modules',
  '.wrangler',
  '.dev.vars',
  'coverage',
  '.nyc_output',
  'test-results',
  'playwright-report',
  'blob-report',
  'tests',
  'TEST_INFRA.md',
  'TEST_READY.md',
  '.DS_Store',
  'Thumbs.db',
  'desktop.ini',
  '*.log',
  'npm-debug.log*',
  'yarn-debug.log*',
  'pnpm-debug.log*'
];

// ANSI Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  magenta: '\x1b[35m',
  blue: '\x1b[34m',
  gray: '\x1b[90m'
};

function log(msg) {
  console.log(`${colors.cyan}[riff]${colors.reset} ${msg}`);
}

function logSuccess(msg) {
  console.log(`${colors.green}✔${colors.reset} ${msg}`);
}

function logWarn(msg) {
  console.log(`${colors.yellow}⚠${colors.reset} ${msg}`);
}

function logError(msg) {
  console.log(`${colors.red}✖${colors.reset} ${msg}`);
}

/**
 * Slugify a directory name or title into a URL-friendly slug
 */
function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

/**
 * Check if a file or directory matches ignore rules
 */
function shouldIgnore(name) {
  for (const pattern of IGNORE_PATTERNS) {
    if (pattern.startsWith('*.')) {
      const ext = pattern.slice(1);
      if (name.endsWith(ext)) return true;
    } else if (name === pattern || name.startsWith(pattern + '/')) {
      return true;
    }
  }
  return false;
}

/**
 * Recursively copy directory while filtering ignored files
 */
async function copyDir(src, dest) {
  await fsp.mkdir(dest, { recursive: true });
  const entries = await fsp.readdir(src, { withFileTypes: true });

  for (const entry of entries) {
    if (shouldIgnore(entry.name)) continue;

    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      await copyDir(srcPath, destPath);
    } else {
      await fsp.copyFile(srcPath, destPath);
    }
  }
}

/**
 * Parse project metadata from config files or heuristics
 */
async function extractProjectMetadata(projectDir, folderName, slug) {
  let meta = {
    id: slug,
    slug: slug,
    name: folderName
      .replace(/[-_]/g, ' ')
      .replace(/\b\w/g, c => c.toUpperCase()),
    title: '',
    description: 'A front-end interface riff and reimagining.',
    category: 'Clone',
    tags: ['Static', 'HTML/CSS', 'JavaScript'],
    route: `/${slug}`,
    aliasRoute: `/projects/${slug}`,
    folder: folderName,
    thumbnail: '',
    author: 'sohamlabs',
    version: '1.0.0',
    created: new Date().toISOString().split('T')[0],
    buildType: 'static'
  };

  // 1. Check for explicit riff.json or project.json
  const riffJsonPath = path.join(projectDir, 'riff.json');
  const projectJsonPath = path.join(projectDir, 'project.json');
  const configPath = fs.existsSync(riffJsonPath) ? riffJsonPath : (fs.existsSync(projectJsonPath) ? projectJsonPath : null);

  if (configPath) {
    try {
      const customConfig = JSON.parse(await fsp.readFile(configPath, 'utf8'));
      meta = { ...meta, ...customConfig };
      if (customConfig.slug) meta.slug = slugify(customConfig.slug);
      meta.route = `/${meta.slug}`;
      meta.aliasRoute = `/projects/${meta.slug}`;
      return meta;
    } catch (e) {
      logWarn(`Failed to parse config at ${configPath}: ${e.message}`);
    }
  }

  // 2. Check PROJECT.md if available
  const projectMdPath = path.join(projectDir, 'PROJECT.md');
  if (fs.existsSync(projectMdPath)) {
    try {
      const content = await fsp.readFile(projectMdPath, 'utf8');
      const titleMatch = content.match(/^#\s+(?:Project:\s*)?(.+)$/m);
      if (titleMatch) {
        meta.name = titleMatch[1].trim();
        meta.title = titleMatch[1].trim();
      }

      // Check tech stack from architecture
      const techMatch = content.match(/Tech Stack\*\*:\s*([^\n\r]+)/i);
      if (techMatch) {
        const stackItems = techMatch[1]
          .split(/[,()\/]/)
          .map(s => s.replace(/^[.\s*#-]+|[.\s*#-]+$/g, '').trim())
          .filter(s => s && s.length > 1 && !s.toLowerCase().includes('zero') && !s.toLowerCase().includes('dependencies'));
        if (stackItems.length > 0) {
          meta.tags = stackItems.slice(0, 5);
        }
      }

      // Check description
      const descMatch = content.match(/##\s+Overview\s+([\s\S]*?)(?=##|$)/i);
      if (descMatch) {
        const cleanDesc = descMatch[1].trim().split('\n')[0].replace(/^[#\s*-]+/, '').trim();
        if (cleanDesc) meta.description = cleanDesc;
      }
    } catch (e) {
      logWarn(`Could not read ${projectMdPath}: ${e.message}`);
    }
  }

  // 3. Check package.json if available
  const pkgJsonPath = path.join(projectDir, 'package.json');
  if (fs.existsSync(pkgJsonPath)) {
    try {
      const pkg = JSON.parse(await fsp.readFile(pkgJsonPath, 'utf8'));
      if (pkg.name && !meta.title) meta.name = pkg.name;
      if (pkg.description) meta.description = pkg.description;
      if (pkg.scripts && pkg.scripts.build) {
        meta.buildType = 'npm-build';
      }
      if (Array.isArray(pkg.keywords) && pkg.keywords.length > 0) {
        meta.tags = pkg.keywords;
      }
    } catch (e) {
      // Ignore
    }
  }

  // 4. Check index.html for title and meta description
  const indexPath = path.join(projectDir, 'index.html');
  if (fs.existsSync(indexPath)) {
    try {
      const html = await fsp.readFile(indexPath, 'utf8');
      const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
      if (titleMatch && !meta.title) {
        meta.name = titleMatch[1].replace(/\|.*/, '').trim();
        meta.title = titleMatch[1].trim();
      }
      const descMatch = html.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i);
      if (descMatch && (!meta.description || meta.description.startsWith('A front-end'))) {
        meta.description = descMatch[1].trim();
      }
    } catch (e) {
      // Ignore
    }
  }

  // 5. Look for cover/hero/thumbnail images
  const assetPaths = [
    `assets/images/hero-alyx.jpg`,
    `assets/images/cover.jpg`,
    `assets/images/cover.png`,
    `assets/images/thumbnail.jpg`,
    `assets/images/thumbnail.png`,
    `cover.png`,
    `thumbnail.jpg`
  ];

  for (const relPath of assetPaths) {
    if (fs.existsSync(path.join(projectDir, relPath))) {
      meta.thumbnail = `/${meta.slug}/${relPath}`;
      break;
    }
  }

  return meta;
}

/**
 * Build or copy a single project into dist/
 */
async function compileProject(projectFolder) {
  const projectDir = path.join(PROJECTS_DIR, projectFolder);
  const rawSlug = slugify(projectFolder);
  const meta = await extractProjectMetadata(projectDir, projectFolder, rawSlug);
  const slug = meta.slug;

  const targetPrimary = path.join(DIST_DIR, slug);
  const targetAlias = path.join(DIST_DIR, 'projects', slug);

  // Check if project requires npm build
  const pkgPath = path.join(projectDir, 'package.json');
  let hasBuildScript = false;

  if (fs.existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(await fsp.readFile(pkgPath, 'utf8'));
      if (pkg.scripts && pkg.scripts.build) {
        hasBuildScript = true;
      }
    } catch (e) {
      // Ignore
    }
  }

  if (hasBuildScript) {
    log(`Building npm project: ${colors.bright}${meta.name}${colors.reset} (${projectFolder})...`);
    // Ensure node_modules exists
    if (!fs.existsSync(path.join(projectDir, 'node_modules'))) {
      log(`  Installing dependencies for ${projectFolder}...`);
      execSync('npm install', { cwd: projectDir, stdio: 'inherit' });
    }
    execSync('npm run build', { cwd: projectDir, stdio: 'inherit' });

    // Find output directory
    const candidates = ['dist', 'build', 'out', 'public'];
    let outDir = null;
    for (const c of candidates) {
      const p = path.join(projectDir, c);
      if (fs.existsSync(p) && fs.statSync(p).isDirectory()) {
        outDir = p;
        break;
      }
    }

    if (outDir) {
      await copyDir(outDir, targetPrimary);
      await copyDir(outDir, targetAlias);
    } else {
      await copyDir(projectDir, targetPrimary);
      await copyDir(projectDir, targetAlias);
    }
  } else {
    // Pure static copy
    await copyDir(projectDir, targetPrimary);
    await copyDir(projectDir, targetAlias);
  }

  return meta;
}

/**
 * Generate standard modern 404 page
 */
function get404Html() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>404 — Not Found | riff</title>
  <style>
    :root {
      --bg: #090A0F;
      --card: rgba(255, 255, 255, 0.04);
      --border: rgba(255, 255, 255, 0.1);
      --text: #F1F3F9;
      --muted: #8E95A5;
      --accent: #FF5E3A;
      --accent-glow: rgba(255, 94, 58, 0.3);
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background-color: var(--bg);
      color: var(--text);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
    }
    .card {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 16px;
      padding: 48px 36px;
      max-width: 480px;
      width: 100%;
      text-align: center;
      backdrop-filter: blur(12px);
      box-shadow: 0 20px 40px rgba(0,0,0,0.5);
    }
    .badge {
      display: inline-block;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      font-weight: 700;
      color: var(--accent);
      background: rgba(255, 94, 58, 0.12);
      border: 1px solid rgba(255, 94, 58, 0.25);
      padding: 4px 12px;
      border-radius: 999px;
      margin-bottom: 20px;
    }
    h1 { font-size: 64px; font-weight: 800; line-height: 1; margin-bottom: 12px; }
    p { color: var(--muted); font-size: 15px; line-height: 1.6; margin-bottom: 28px; }
    .btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: var(--accent);
      color: #fff;
      text-decoration: none;
      font-weight: 600;
      font-size: 14px;
      padding: 12px 24px;
      border-radius: 10px;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    .btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 20px var(--accent-glow);
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="badge">Error 404</div>
    <h1>404</h1>
    <p>The requested riff or page could not be found. It may have moved or doesn't exist.</p>
    <a href="/" class="btn">← Back to Riff Showcase</a>
  </div>
</body>
</html>`;
}

/**
 * Generate default Landing Portal HTML (modern dark aesthetic with dynamic project cards)
 */
function getDefaultLandingHtml(projects) {
  const projectsJson = JSON.stringify(projects, null, 2);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>riff — Front-End Reimaginations & Design Labs</title>
  <meta name="description" content="A curated collection of front-end design riffs, practice builds, and interactive interface reimaginings by sohamlabs.">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg-dark: #07080B;
      --bg-surface: #0E1017;
      --bg-card: rgba(18, 21, 30, 0.75);
      --bg-card-hover: rgba(26, 30, 44, 0.9);
      --border: rgba(255, 255, 255, 0.08);
      --border-focus: rgba(255, 94, 58, 0.5);
      --text-primary: #F4F6FB;
      --text-secondary: #949EB2;
      --text-muted: #5F687D;
      --accent: #FF5E3A;
      --accent-glow: rgba(255, 94, 58, 0.35);
      --accent-secondary: #7928CA;
      --font-main: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
      --font-mono: 'JetBrains Mono', monospace;
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      background-color: var(--bg-dark);
      color: var(--text-primary);
      font-family: var(--font-main);
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      overflow-x: hidden;
      background-image: 
        radial-gradient(ellipse at 50% -20%, rgba(121, 40, 202, 0.15), transparent 70%),
        radial-gradient(ellipse at 80% 60%, rgba(255, 94, 58, 0.08), transparent 60%);
      background-attachment: fixed;
    }

    /* Top Navigation */
    header {
      position: sticky;
      top: 0;
      z-index: 100;
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      background: rgba(7, 8, 11, 0.8);
      border-bottom: 1px solid var(--border);
    }
    .header-inner {
      max-width: 1280px;
      margin: 0 auto;
      padding: 16px 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 12px;
      text-decoration: none;
      color: var(--text-primary);
    }
    .brand-icon {
      width: 32px;
      height: 32px;
      background: linear-gradient(135deg, var(--accent), var(--accent-secondary));
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 800;
      font-size: 16px;
      color: white;
      box-shadow: 0 4px 12px var(--accent-glow);
    }
    .brand-title {
      font-size: 18px;
      font-weight: 700;
      letter-spacing: -0.02em;
    }
    .brand-badge {
      font-size: 11px;
      font-family: var(--font-mono);
      background: rgba(255, 255, 255, 0.06);
      border: 1px solid var(--border);
      padding: 2px 8px;
      border-radius: 6px;
      color: var(--text-secondary);
    }
    .nav-links {
      display: flex;
      align-items: center;
      gap: 20px;
    }
    .nav-link {
      color: var(--text-secondary);
      text-decoration: none;
      font-size: 14px;
      font-weight: 500;
      transition: color 0.2s;
    }
    .nav-link:hover { color: var(--text-primary); }

    /* Hero Section */
    .hero {
      max-width: 1280px;
      margin: 0 auto;
      padding: 64px 24px 40px;
      text-align: center;
    }
    .hero-badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: rgba(255, 94, 58, 0.1);
      border: 1px solid rgba(255, 94, 58, 0.25);
      padding: 6px 14px;
      border-radius: 999px;
      font-size: 12px;
      font-weight: 600;
      color: var(--accent);
      margin-bottom: 24px;
    }
    .hero-title {
      font-size: clamp(32px, 5vw, 56px);
      font-weight: 800;
      letter-spacing: -0.03em;
      line-height: 1.15;
      margin-bottom: 16px;
    }
    .hero-title span {
      background: linear-gradient(135deg, #FFF 30%, var(--accent) 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .hero-desc {
      max-width: 640px;
      margin: 0 auto 36px;
      font-size: 17px;
      color: var(--text-secondary);
      line-height: 1.6;
    }

    /* Controls: Search & Filters */
    .controls-wrapper {
      max-width: 1280px;
      margin: 0 auto 32px;
      padding: 0 24px;
      display: flex;
      flex-wrap: wrap;
      gap: 16px;
      align-items: center;
      justify-content: space-between;
    }
    .search-box {
      position: relative;
      flex: 1;
      min-width: 260px;
      max-width: 400px;
    }
    .search-box input {
      width: 100%;
      background: var(--bg-surface);
      border: 1px solid var(--border);
      padding: 10px 16px 10px 40px;
      border-radius: 10px;
      color: var(--text-primary);
      font-size: 14px;
      font-family: var(--font-main);
      outline: none;
      transition: border-color 0.2s, box-shadow 0.2s;
    }
    .search-box input:focus {
      border-color: var(--accent);
      box-shadow: 0 0 0 3px rgba(255, 94, 58, 0.15);
    }
    .search-icon {
      position: absolute;
      left: 14px;
      top: 50%;
      transform: translateY(-50%);
      color: var(--text-muted);
      font-size: 14px;
      pointer-events: none;
    }
    .filter-pills {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
    .filter-pill {
      background: var(--bg-surface);
      border: 1px solid var(--border);
      color: var(--text-secondary);
      padding: 8px 14px;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
      user-select: none;
    }
    .filter-pill.active, .filter-pill:hover {
      background: rgba(255, 255, 255, 0.1);
      border-color: rgba(255, 255, 255, 0.3);
      color: var(--text-primary);
    }

    /* Projects Grid */
    main {
      flex: 1;
      max-width: 1280px;
      width: 100%;
      margin: 0 auto;
      padding: 0 24px 64px;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
      gap: 28px;
    }

    /* Project Card */
    .card {
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: 14px;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.25s, box-shadow 0.25s;
      position: relative;
    }
    .card:hover {
      transform: translateY(-4px);
      border-color: rgba(255, 255, 255, 0.25);
      background: var(--bg-card-hover);
      box-shadow: 0 16px 32px rgba(0, 0, 0, 0.4);
    }
    .card-preview {
      width: 100%;
      height: 200px;
      background: #000;
      position: relative;
      overflow: hidden;
      border-bottom: 1px solid var(--border);
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .card-preview img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.3s ease;
    }
    .card:hover .card-preview img {
      transform: scale(1.04);
    }
    .card-preview-placeholder {
      width: 100%;
      height: 100%;
      background: linear-gradient(135deg, #181c28, #0e111a);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: var(--text-muted);
      font-size: 13px;
      gap: 8px;
    }
    .card-category-badge {
      position: absolute;
      top: 12px;
      left: 12px;
      background: rgba(0, 0, 0, 0.75);
      backdrop-filter: blur(8px);
      border: 1px solid rgba(255, 255, 255, 0.15);
      color: #fff;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      padding: 4px 10px;
      border-radius: 6px;
    }
    .card-body {
      padding: 22px;
      flex: 1;
      display: flex;
      flex-direction: column;
    }
    .card-title {
      font-size: 20px;
      font-weight: 700;
      margin-bottom: 8px;
      color: var(--text-primary);
      letter-spacing: -0.01em;
    }
    .card-desc {
      font-size: 14px;
      color: var(--text-secondary);
      line-height: 1.5;
      margin-bottom: 16px;
      flex: 1;
    }
    .card-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-bottom: 20px;
    }
    .tag {
      font-family: var(--font-mono);
      font-size: 11px;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid var(--border);
      color: var(--text-secondary);
      padding: 2px 8px;
      border-radius: 4px;
    }
    .card-actions {
      display: flex;
      align-items: center;
      gap: 10px;
      padding-top: 14px;
      border-top: 1px solid var(--border);
    }
    .btn-launch {
      flex: 1;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      background: var(--accent);
      color: #fff;
      text-decoration: none;
      font-weight: 600;
      font-size: 13px;
      padding: 10px 16px;
      border-radius: 8px;
      transition: opacity 0.2s, transform 0.2s;
    }
    .btn-launch:hover {
      opacity: 0.92;
      transform: translateY(-1px);
    }
    .btn-preview {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      background: rgba(255, 255, 255, 0.06);
      border: 1px solid var(--border);
      color: var(--text-primary);
      font-size: 13px;
      font-weight: 500;
      padding: 10px 14px;
      border-radius: 8px;
      cursor: pointer;
      transition: background 0.2s;
    }
    .btn-preview:hover {
      background: rgba(255, 255, 255, 0.12);
    }

    /* Modal for Quick Preview */
    .modal-backdrop {
      display: none;
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.85);
      backdrop-filter: blur(12px);
      z-index: 999;
      align-items: center;
      justify-content: center;
      padding: 24px;
    }
    .modal-backdrop.open {
      display: flex;
    }
    .modal-window {
      width: 100%;
      max-width: 1200px;
      height: 85vh;
      background: var(--bg-surface);
      border: 1px solid var(--border);
      border-radius: 16px;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      box-shadow: 0 30px 60px rgba(0, 0, 0, 0.8);
    }
    .modal-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 14px 20px;
      border-bottom: 1px solid var(--border);
      background: rgba(255, 255, 255, 0.02);
    }
    .modal-title {
      font-size: 16px;
      font-weight: 700;
    }
    .modal-close {
      background: transparent;
      border: none;
      color: var(--text-secondary);
      font-size: 20px;
      cursor: pointer;
      padding: 4px 8px;
      border-radius: 6px;
    }
    .modal-close:hover { color: #fff; background: rgba(255, 255, 255, 0.1); }
    .modal-frame {
      flex: 1;
      width: 100%;
      border: none;
      background: #000;
    }

    /* Footer */
    footer {
      border-top: 1px solid var(--border);
      padding: 32px 24px;
      text-align: center;
      color: var(--text-muted);
      font-size: 13px;
      line-height: 1.6;
    }
    footer a { color: var(--text-secondary); text-decoration: none; }
    footer a:hover { color: var(--text-primary); }

    @media (max-width: 768px) {
      .grid { grid-template-columns: 1fr; }
      .hero-title { font-size: 32px; }
      .controls-wrapper { flex-direction: column; align-items: stretch; }
      .search-box { max-width: 100%; }
    }
  </style>
</head>
<body>

  <!-- Top Navigation -->
  <header>
    <div class="header-inner">
      <a href="/" class="brand">
        <div class="brand-icon">r</div>
        <span class="brand-title">riff</span>
        <span class="brand-badge">sohamlabs</span>
      </a>
      <div class="nav-links">
        <a href="https://riff.sohamlabs.workers.dev" class="nav-link">Live Edge</a>
        <a href="https://github.com" target="_blank" class="nav-link">GitHub</a>
      </div>
    </div>
  </header>

  <!-- Hero Section -->
  <section class="hero">
    <div class="hero-badge">⚡ Interface Laboratory</div>
    <h1 class="hero-title">Front-End Riffs & <span>Design Crafts</span></h1>
    <p class="hero-desc">
      A collection of front-end design riffs — practice builds and reimaginings of interfaces I find interesting.
      Each one is my own code and assets: names, images, and design all changed, nothing copied wholesale.
    </p>
  </section>

  <!-- Controls -->
  <div class="controls-wrapper">
    <div class="search-box">
      <span class="search-icon">🔍</span>
      <input type="text" id="searchInput" placeholder="Search riffs by name, stack, or tag..." oninput="handleSearch()">
    </div>
    <div class="filter-pills" id="categoryFilters">
      <button class="filter-pill active" onclick="setFilter('all', this)">All Riffs</button>
      <button class="filter-pill" onclick="setFilter('Clone', this)">Clones</button>
      <button class="filter-pill" onclick="setFilter('Design Riff', this)">Design Riffs</button>
      <button class="filter-pill" onclick="setFilter('Animation', this)">Animations</button>
    </div>
  </div>

  <!-- Projects Grid -->
  <main>
    <div class="grid" id="projectsGrid"></div>
  </main>

  <!-- Quick Preview Modal -->
  <div class="modal-backdrop" id="previewModal" onclick="closePreview(event)">
    <div class="modal-window">
      <div class="modal-header">
        <span class="modal-title" id="modalTitle">Project Preview</span>
        <button class="modal-close" onclick="forceClosePreview()">✕</button>
      </div>
      <iframe id="previewIframe" class="modal-frame" src="about:blank"></iframe>
    </div>
  </div>

  <!-- Footer -->
  <footer>
    <p>
      MIT License &copy; ${new Date().getFullYear()} riff by sohamlabs. Hosted on Cloudflare Workers.
      <br>
      No attribution implied or given. All trademarks and original designs belong to their respective owners.
    </p>
  </footer>

  <script>
    const PROJECTS = ${projectsJson};
    let currentFilter = 'all';
    let searchQuery = '';

    function renderProjects() {
      const grid = document.getElementById('projectsGrid');
      const filtered = PROJECTS.filter(p => {
        const matchesCat = currentFilter === 'all' || p.category === currentFilter;
        const q = searchQuery.toLowerCase();
        const matchesSearch = !q || 
          p.name.toLowerCase().includes(q) || 
          p.description.toLowerCase().includes(q) || 
          (p.tags && p.tags.some(t => t.toLowerCase().includes(q)));
        return matchesCat && matchesSearch;
      });

      if (filtered.length === 0) {
        grid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 60px 20px; color: var(--text-muted); font-size: 16px;">No matching riffs found.</div>';
        return;
      }

      grid.innerHTML = filtered.map(p => {
        const previewHtml = p.thumbnail 
          ? \`<img src="\${p.thumbnail}" alt="\${p.name}" loading="lazy">\`
          : \`<div class="card-preview-placeholder"><span>✨</span><span>Interactive Demo</span></div>\`;

        const tagsHtml = (p.tags || []).map(t => \`<span class="tag">\${t}</span>\`).join('');

        return \`
          <div class="card">
            <div class="card-preview">
              \${previewHtml}
              <div class="card-category-badge">\${p.category || 'Riff'}</div>
            </div>
            <div class="card-body">
              <h2 class="card-title">\${p.name}</h2>
              <p class="card-desc">\${p.description}</p>
              <div class="card-tags">\${tagsHtml}</div>
              <div class="card-actions">
                <a href="\${p.route}/" class="btn-launch">Launch Riff →</a>
                <button class="btn-preview" onclick="openPreview('\${p.name}', '\${p.route}/')">Quick View</button>
              </div>
            </div>
          </div>
        \`;
      }).join('');
    }

    function handleSearch() {
      searchQuery = document.getElementById('searchInput').value;
      renderProjects();
    }

    function setFilter(cat, btn) {
      currentFilter = cat;
      document.querySelectorAll('.filter-pill').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderProjects();
    }

    function openPreview(title, route) {
      document.getElementById('modalTitle').textContent = title;
      document.getElementById('previewIframe').src = route;
      document.getElementById('previewModal').classList.add('open');
      document.body.style.overflow = 'hidden';
    }

    function closePreview(e) {
      if (e.target.id === 'previewModal') {
        forceClosePreview();
      }
    }

    function forceClosePreview() {
      document.getElementById('previewModal').classList.remove('open');
      document.getElementById('previewIframe').src = 'about:blank';
      document.body.style.overflow = 'auto';
    }

    // Initial render
    renderProjects();
  </script>
</body>
</html>`;
}

/**
 * Main build and aggregation process
 */
async function build(options = {}) {
  const startTime = Date.now();
  console.log(`\n${colors.bright}${colors.magenta}┌──────────────────────────────────────────────────────────┐${colors.reset}`);
  console.log(`${colors.bright}${colors.magenta}│             RIFF MONOREPO COMPILATION PIPELINE           │${colors.reset}`);
  console.log(`${colors.bright}${colors.magenta}└──────────────────────────────────────────────────────────┘${colors.reset}\n`);

  // 1. Clean dist directory
  log('Cleaning output directory: dist/...');
  if (fs.existsSync(DIST_DIR)) {
    await fsp.rm(DIST_DIR, { recursive: true, force: true });
  }
  await fsp.mkdir(DIST_DIR, { recursive: true });
  await fsp.mkdir(path.join(DIST_DIR, 'projects'), { recursive: true });

  if (options.cleanOnly) {
    logSuccess('Clean completed successfully.');
    return;
  }

  // 2. Scan projects
  log(`Scanning projects directory: ${PROJECTS_DIR}...`);
  if (!fs.existsSync(PROJECTS_DIR)) {
    await fsp.mkdir(PROJECTS_DIR, { recursive: true });
  }

  const projectEntries = await fsp.readdir(PROJECTS_DIR, { withFileTypes: true });
  const projectFolders = projectEntries
    .filter(e => e.isDirectory() && !shouldIgnore(e.name))
    .map(e => e.name);

  log(`Discovered ${colors.bright}${projectFolders.length}${colors.reset} project(s): [${projectFolders.join(', ')}]`);

  // 3. Compile each project
  const projectManifests = [];
  for (const folder of projectFolders) {
    try {
      const meta = await compileProject(folder);
      projectManifests.push(meta);
      logSuccess(`Compiled: ${colors.bright}${meta.name}${colors.reset} -> ${colors.cyan}${meta.route}/${colors.reset} & ${colors.cyan}${meta.aliasRoute}/${colors.reset}`);
    } catch (err) {
      logError(`Failed to compile project '${folder}': ${err.message}`);
      console.error(err);
    }
  }

  // 4. Compile Landing Page
  log('Compiling landing portal...');
  const hasLandingFiles = fs.existsSync(LANDING_DIR) && 
    (await fsp.readdir(LANDING_DIR)).filter(f => f !== 'riff.md' && !shouldIgnore(f)).length > 0;

  if (hasLandingFiles) {
    // Check if landing has package.json build
    const landingPkg = path.join(LANDING_DIR, 'package.json');
    if (fs.existsSync(landingPkg)) {
      const pkg = JSON.parse(await fsp.readFile(landingPkg, 'utf8'));
      if (pkg.scripts && pkg.scripts.build) {
        log('  Running landing build script...');
        if (!fs.existsSync(path.join(LANDING_DIR, 'node_modules'))) {
          execSync('npm install', { cwd: LANDING_DIR, stdio: 'inherit' });
        }
        execSync('npm run build', { cwd: LANDING_DIR, stdio: 'inherit' });
        const outDir = path.join(LANDING_DIR, 'dist');
        if (fs.existsSync(outDir)) {
          await copyDir(outDir, DIST_DIR);
        }
      }
    } else {
      await copyDir(LANDING_DIR, DIST_DIR);
    }
  } else {
    // Generate default ultra-modern landing page in dist/index.html
    const landingHtml = getDefaultLandingHtml(projectManifests);
    await fsp.writeFile(path.join(DIST_DIR, 'index.html'), landingHtml, 'utf8');
    logSuccess('Generated landing portal index.html with interactive showcase.');
  }

  // 5. Generate Manifests
  log('Generating metadata manifests...');
  await fsp.writeFile(
    path.join(DIST_DIR, 'projects.json'),
    JSON.stringify(projectManifests, null, 2),
    'utf8'
  );
  await fsp.writeFile(
    path.join(DIST_DIR, 'riffs.json'),
    JSON.stringify(projectManifests, null, 2),
    'utf8'
  );

  // 6. Generate 404.html if not present
  const dist404 = path.join(DIST_DIR, '404.html');
  if (!fs.existsSync(dist404)) {
    await fsp.writeFile(dist404, get404Html(), 'utf8');
    logSuccess('Generated 404.html error handler.');
  }

  // 7. Generate robots.txt & sitemap.xml
  const robotsTxt = `User-agent: *\nAllow: /\nSitemap: https://riff.sohamlabs.workers.dev/sitemap.xml\n`;
  await fsp.writeFile(path.join(DIST_DIR, 'robots.txt'), robotsTxt, 'utf8');

  const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://riff.sohamlabs.workers.dev/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
${projectManifests.map(p => `  <url>
    <loc>https://riff.sohamlabs.workers.dev${p.route}/</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`).join('\n')}
</urlset>`;
  await fsp.writeFile(path.join(DIST_DIR, 'sitemap.xml'), sitemapXml, 'utf8');

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`\n${colors.bright}${colors.green}✔ Build completed in ${duration}s!${colors.reset}`);
  console.log(`  ${colors.dim}Target directory:${colors.reset} ${DIST_DIR}`);
  console.log(`  ${colors.dim}Total projects:${colors.reset}   ${projectManifests.length}`);
  console.log(`  ${colors.dim}Deployment ready for:${colors.reset} Cloudflare Workers Static Assets\n`);
}

/**
 * Local Static File HTTP Server (Zero Dependencies)
 */
function startServer(port = 3000) {
  const MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.mjs': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.webp': 'image/webp',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf',
    '.xml': 'application/xml',
    '.txt': 'text/plain'
  };

  const server = http.createServer(async (req, res) => {
    try {
      const url = new URL(req.url, `http://localhost:${port}`);
      let pathname = decodeURIComponent(url.pathname);

      if (pathname.endsWith('/')) {
        pathname += 'index.html';
      }

      let filePath = path.join(DIST_DIR, pathname);

      // Check if path is a directory without trailing slash
      if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
        res.writeHead(301, { Location: `${url.pathname}/${url.search}` });
        res.end();
        return;
      }

      // Check if file exists, or try appending .html
      if (!fs.existsSync(filePath)) {
        if (fs.existsSync(`${filePath}.html`)) {
          filePath = `${filePath}.html`;
        } else if (fs.existsSync(path.join(filePath, 'index.html'))) {
          filePath = path.join(filePath, 'index.html');
        } else {
          // Serve 404
          const notFoundPath = path.join(DIST_DIR, '404.html');
          if (fs.existsSync(notFoundPath)) {
            const data = await fsp.readFile(notFoundPath);
            res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end(data);
            return;
          }
          res.writeHead(404, { 'Content-Type': 'text/plain' });
          res.end('404 Not Found');
          return;
        }
      }

      const ext = path.extname(filePath).toLowerCase();
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';
      const data = await fsp.readFile(filePath);

      res.writeHead(200, { 'Content-Type': contentType });
      res.end(data);
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end(`Internal Server Error: ${err.message}`);
    }
  });

  server.listen(port, () => {
    console.log(`${colors.bright}${colors.green}🚀 Local Riff Dev Server running:${colors.reset}`);
    console.log(`   ➜ Local:   ${colors.cyan}http://localhost:${port}/${colors.reset}`);
    console.log(`   ➜ Press ${colors.dim}Ctrl+C${colors.reset} to stop\n`);
  });
}

// CLI Execution Entrypoint
const args = process.argv.slice(2);
const isServe = args.includes('--serve') || args.includes('-s');
const isClean = args.includes('--clean');
const portArgIdx = args.indexOf('--port');
const port = portArgIdx !== -1 && args[portArgIdx + 1] ? parseInt(args[portArgIdx + 1], 10) : 3000;

(async () => {
  try {
    if (isClean) {
      await build({ cleanOnly: true });
      process.exit(0);
    }

    await build();

    if (isServe) {
      startServer(port);
    }
  } catch (err) {
    logError(`Build failed: ${err.message}`);
    console.error(err);
    process.exit(1);
  }
})();

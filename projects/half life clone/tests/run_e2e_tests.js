const fs = require('fs');
const path = require('path');
const harness = require('./utils/test_harness');

// ============================================================================
// CLI Formatting Utilities
// ============================================================================

const isTTY = Boolean(process.stdout.isTTY);

const c = {
  reset: isTTY ? '\x1b[0m' : '',
  bold: isTTY ? '\x1b[1m' : '',
  dim: isTTY ? '\x1b[2m' : '',
  green: isTTY ? '\x1b[32m' : '',
  red: isTTY ? '\x1b[31m' : '',
  yellow: isTTY ? '\x1b[33m' : '',
  cyan: isTTY ? '\x1b[36m' : '',
  magenta: isTTY ? '\x1b[35m' : ''
};

// ============================================================================
// Dynamic Test Discovery
// ============================================================================

function findTestFiles(dir, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;
  const items = fs.readdirSync(dir, { withFileTypes: true });
  for (const item of items) {
    const fullPath = path.join(dir, item.name);
    if (item.isDirectory()) {
      if (item.name !== 'node_modules') {
        findTestFiles(fullPath, fileList);
      }
    } else if (item.isFile() && item.name.endsWith('.test.js')) {
      fileList.push(fullPath);
    }
  }
  return fileList;
}

// ============================================================================
// Main Execution Entry Point
// ============================================================================

async function main() {
  console.log(`\n${c.cyan}${c.bold}======================================================================${c.reset}`);
  console.log(`${c.cyan}${c.bold} HALF-LIFE FRANCHISE WEBSITE - OPAQUE-BOX E2E TEST RUNNER${c.reset}`);
  console.log(`${c.cyan}${c.bold}======================================================================${c.reset}\n`);

  const testsDir = path.join(__dirname);
  const testFiles = findTestFiles(testsDir);

  console.log(`${c.dim}Discovered ${testFiles.length} test file(s) in ${testsDir}${c.reset}\n`);

  harness.clearSuites();

  let requireErrors = 0;
  for (const file of testFiles) {
    const relativePath = path.relative(process.cwd(), file);
    try {
      require(path.resolve(file));
      console.log(`  ${c.dim}Loaded:${c.reset} ${relativePath}`);
    } catch (err) {
      requireErrors++;
      console.error(`  ${c.red}${c.bold}FAIL loading file:${c.reset} ${relativePath}`);
      console.error(`    ${c.red}${err.stack || err.message}${c.reset}`);
    }
  }

  if (testFiles.length > 0) console.log('');

  const summary = await harness.runSuites();

  // Group suite results by Tier
  const tierMap = {
    'Tier 1': [],
    'Tier 2': [],
    'Tier 3': [],
    'Tier 4': [],
    'Other': []
  };

  for (const suiteRes of summary.suiteResults) {
    const t = tierMap[suiteRes.tier] ? suiteRes.tier : 'Other';
    tierMap[t].push(suiteRes);
  }

  // Print Tier by Tier test results
  for (const [tierName, suites] of Object.entries(tierMap)) {
    if (suites.length === 0) continue;

    console.log(`${c.bold}${c.magenta}[${tierName}]${c.reset}`);
    for (const suite of suites) {
      console.log(`  ${c.bold}${suite.name}${c.reset}`);
      for (const test of suite.tests) {
        if (test.passed) {
          console.log(`    ${c.green}✓${c.reset} ${test.name} ${c.dim}(${test.duration}ms)${c.reset}`);
        } else {
          console.log(`    ${c.red}✗ ${test.name}${c.reset} ${c.dim}(${test.duration}ms)${c.reset}`);
          const errStack = test.error ? (test.error.stack || test.error.message || String(test.error)) : 'Unknown error';
          const indentedStack = errStack.split('\n').map(l => `      ${l}`).join('\n');
          console.log(`${c.red}${indentedStack}${c.reset}`);
        }
      }
    }
    console.log('');
  }

  // Print Summary Table & Breakdown
  console.log(`${c.cyan}${c.bold}----------------------------------------------------------------------${c.reset}`);
  console.log(`${c.bold} TEST EXECUTION SUMMARY${c.reset}`);
  console.log(`${c.cyan}${c.bold}----------------------------------------------------------------------${c.reset}`);
  console.log(`  Total Test Suites : ${c.bold}${summary.totalSuites}${c.reset}`);
  console.log(`  Total Tests       : ${c.bold}${summary.totalTests}${c.reset}`);
  console.log(`  Passed            : ${c.green}${c.bold}${summary.passed}${c.reset}`);
  console.log(`  Failed            : ${summary.failed > 0 ? c.red + c.bold + summary.failed : c.green + '0'}${c.reset}`);
  console.log(`  Duration          : ${c.dim}${summary.durationMs}ms${c.reset}`);
  console.log('');

  console.log(`${c.bold} TIER COVERAGE BREAKDOWN:${c.reset}`);
  for (const [tName, tData] of Object.entries(summary.tiers)) {
    const statusStr = tData.failed > 0
      ? `${c.red}${tData.passed}/${tData.total} Passed (${tData.failed} Failed)${c.reset}`
      : `${c.green}${tData.passed}/${tData.total} Passed${c.reset}`;
    console.log(`  - ${tName.padEnd(8)}: ${statusStr}`);
  }

  console.log(`${c.cyan}${c.bold}======================================================================${c.reset}`);

  const hasFailures = summary.failed > 0 || requireErrors > 0;
  if (hasFailures) {
    console.log(` Status: ${c.red}${c.bold}FAILED${c.reset}\n`);
    process.exit(1);
  } else {
    console.log(` Status: ${c.green}${c.bold}PASSED (100% Pass Rate)${c.reset}\n`);
    process.exit(0);
  }
}

main().catch(err => {
  console.error(`${c.red}${c.bold}Fatal Error in Test Runner:${c.reset}`, err);
  process.exit(1);
});

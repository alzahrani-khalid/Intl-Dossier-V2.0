#!/usr/bin/env node

/**
 * Compare Bundle Sizes
 *
 * Compares current bundle stats against baseline (main branch).
 * Outputs comparison results and fails if increase exceeds threshold.
 */

import { readFileSync, existsSync } from 'fs'
import { join } from 'path'

const CURRENT_STATS_PATH = join(process.cwd(), 'frontend/dist/bundle-stats.json')
const BASELINE_STATS_PATH = join(process.cwd(), 'baseline-stats/bundle-stats.json')

// Maximum allowed increase in bytes (50KB)
const MAX_INCREASE = 50 * 1024

// ANSI colors
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m',
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

function formatDiff(diff) {
  const sign = diff >= 0 ? '+' : ''
  return `${sign}${formatBytes(diff)}`
}

function compare() {
  // Check if current stats exist
  if (!existsSync(CURRENT_STATS_PATH)) {
    console.error(
      `${colors.red}Error: Current bundle stats not found at ${CURRENT_STATS_PATH}${colors.reset}`,
    )
    process.exit(1)
  }

  const currentStats = JSON.parse(readFileSync(CURRENT_STATS_PATH, 'utf8'))

  // Check if baseline exists
  if (!existsSync(BASELINE_STATS_PATH)) {
    console.log(
      `${colors.yellow}No baseline found at ${BASELINE_STATS_PATH}. Skipping comparison.${colors.reset}`,
    )
    console.log('This is expected for the first run or when baseline is unavailable.')
    process.exit(0)
  }

  const baselineStats = JSON.parse(readFileSync(BASELINE_STATS_PATH, 'utf8'))

  console.log('\n' + colors.bold + '=== Bundle Size Comparison ===' + colors.reset + '\n')

  // Compare JavaScript totals
  const currentJs = currentStats.totals.js.gzip
  const baselineJs = baselineStats.totals.js.gzip
  const jsDiff = currentJs - baselineJs
  const jsPercent = ((jsDiff / baselineJs) * 100).toFixed(1)

  console.log(colors.blue + 'JavaScript:' + colors.reset)
  console.log(`  Current:  ${formatBytes(currentJs)}`)
  console.log(`  Baseline: ${formatBytes(baselineJs)}`)
  const jsColor = jsDiff > MAX_INCREASE ? colors.red : jsDiff > 0 ? colors.yellow : colors.green
  console.log(
    `  Diff:     ${jsColor}${formatDiff(jsDiff)} (${jsDiff >= 0 ? '+' : ''}${jsPercent}%)${colors.reset}`,
  )

  // Compare CSS totals
  const currentCss = currentStats.totals.css.gzip
  const baselineCss = baselineStats.totals.css.gzip
  const cssDiff = currentCss - baselineCss
  const cssPercent = ((cssDiff / baselineCss) * 100).toFixed(1)

  console.log('\n' + colors.blue + 'CSS:' + colors.reset)
  console.log(`  Current:  ${formatBytes(currentCss)}`)
  console.log(`  Baseline: ${formatBytes(baselineCss)}`)
  const cssColor = cssDiff > MAX_INCREASE ? colors.red : cssDiff > 0 ? colors.yellow : colors.green
  console.log(
    `  Diff:     ${cssColor}${formatDiff(cssDiff)} (${cssDiff >= 0 ? '+' : ''}${cssPercent}%)${colors.reset}`,
  )

  // Total comparison
  const totalDiff = jsDiff + cssDiff
  console.log('\n' + colors.blue + 'Total change:' + colors.reset)
  const totalColor =
    totalDiff > MAX_INCREASE ? colors.red : totalDiff > 0 ? colors.yellow : colors.green
  console.log(`  ${totalColor}${formatDiff(totalDiff)}${colors.reset}`)

  // Check if we exceeded the limit
  if (totalDiff > MAX_INCREASE) {
    console.log(
      `\n${colors.red}${colors.bold}Bundle size increased by ${formatBytes(totalDiff)}, exceeding the ${formatBytes(MAX_INCREASE)} limit!${colors.reset}`,
    )
    console.log('\nConsider:')
    console.log('  - Using dynamic imports for code splitting')
    console.log('  - Removing unused dependencies')
    console.log('  - Using lighter alternatives')
    console.log('  - Run `pnpm analyze` to visualize the bundle')
    process.exit(1)
  }

  console.log(
    `\n${colors.green}${colors.bold}Bundle size is within acceptable limits.${colors.reset}\n`,
  )
}

compare()

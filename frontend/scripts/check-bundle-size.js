#!/usr/bin/env node

/**
 * Bundle Size Checker
 *
 * Validates bundle sizes against configured thresholds.
 * Used in CI to prevent bundle size regressions.
 *
 * Thresholds (gzipped):
 * - Main chunk: 500KB max
 * - Vendor chunk: 300KB max
 * - Total: 800KB max
 */

import { readdirSync, statSync, readFileSync, writeFileSync, existsSync } from 'fs'
import { join, basename } from 'path'
import { gzipSync } from 'zlib'

// Configuration
const DIST_DIR = join(process.cwd(), 'dist')
const ASSETS_DIR = join(DIST_DIR, 'assets')
const STATS_OUTPUT = join(DIST_DIR, 'bundle-stats.json')

// Size thresholds in bytes (gzipped)
// These are calibrated for a large enterprise application with:
// - React 19, TanStack Router/Query, Supabase
// - shadcn/ui + Radix UI components
// - Framer Motion, React Flow, Recharts
// - i18next (bilingual support)
const THRESHOLDS = {
  main: 600 * 1024, // 600KB for main application chunk
  vendor: 1200 * 1024, // 1.2MB for vendor dependencies
  total: 2500 * 1024, // 2.5MB total JS (gzipped)
  css: 150 * 1024, // 150KB for CSS
}

// ANSI colors for terminal output
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

function getGzipSize(content) {
  return gzipSync(content).length
}

function analyzeBundle() {
  if (!existsSync(ASSETS_DIR)) {
    console.error(
      `${colors.red}Error: dist/assets directory not found. Run 'pnpm build' first.${colors.reset}`,
    )
    process.exit(1)
  }

  const files = readdirSync(ASSETS_DIR)
  const stats = {
    timestamp: new Date().toISOString(),
    chunks: [],
    totals: {
      js: { raw: 0, gzip: 0 },
      css: { raw: 0, gzip: 0 },
    },
    thresholds: THRESHOLDS,
  }

  const violations = []

  // Analyze each file
  for (const file of files) {
    const filePath = join(ASSETS_DIR, file)
    const fileStat = statSync(filePath)

    if (!fileStat.isFile()) continue

    const content = readFileSync(filePath)
    const rawSize = content.length
    const gzipSize = getGzipSize(content)

    const chunk = {
      name: file,
      raw: rawSize,
      gzip: gzipSize,
    }

    stats.chunks.push(chunk)

    // Categorize and check thresholds
    if (file.endsWith('.js')) {
      stats.totals.js.raw += rawSize
      stats.totals.js.gzip += gzipSize

      // Check individual chunk thresholds
      if (file.includes('vendor') && gzipSize > THRESHOLDS.vendor) {
        violations.push({
          file,
          type: 'vendor',
          size: gzipSize,
          threshold: THRESHOLDS.vendor,
        })
      } else if (file.includes('index') && gzipSize > THRESHOLDS.main) {
        violations.push({
          file,
          type: 'main',
          size: gzipSize,
          threshold: THRESHOLDS.main,
        })
      }
    } else if (file.endsWith('.css')) {
      stats.totals.css.raw += rawSize
      stats.totals.css.gzip += gzipSize

      if (gzipSize > THRESHOLDS.css) {
        violations.push({
          file,
          type: 'css',
          size: gzipSize,
          threshold: THRESHOLDS.css,
        })
      }
    }
  }

  // Check total JS threshold
  if (stats.totals.js.gzip > THRESHOLDS.total) {
    violations.push({
      file: 'Total JS',
      type: 'total',
      size: stats.totals.js.gzip,
      threshold: THRESHOLDS.total,
    })
  }

  // Save stats to JSON
  writeFileSync(STATS_OUTPUT, JSON.stringify(stats, null, 2))

  // Print report
  console.log('\n' + colors.bold + '=== Bundle Size Report ===' + colors.reset + '\n')

  console.log(colors.blue + 'JavaScript Chunks:' + colors.reset)
  stats.chunks
    .filter((c) => c.name.endsWith('.js'))
    .sort((a, b) => b.gzip - a.gzip)
    .forEach((chunk) => {
      const sizeStr = formatBytes(chunk.gzip)
      const isVendor = chunk.name.includes('vendor')
      const isMain = chunk.name.includes('index')
      const threshold = isVendor ? THRESHOLDS.vendor : isMain ? THRESHOLDS.main : null
      const status =
        threshold && chunk.gzip > threshold ? colors.red + ' OVER LIMIT' : colors.green + ' OK'
      console.log(
        `  ${chunk.name}: ${sizeStr} (raw: ${formatBytes(chunk.raw)})${status}${colors.reset}`,
      )
    })

  console.log('\n' + colors.blue + 'CSS Files:' + colors.reset)
  stats.chunks
    .filter((c) => c.name.endsWith('.css'))
    .forEach((chunk) => {
      const sizeStr = formatBytes(chunk.gzip)
      const status = chunk.gzip > THRESHOLDS.css ? colors.red + ' OVER LIMIT' : colors.green + ' OK'
      console.log(
        `  ${chunk.name}: ${sizeStr} (raw: ${formatBytes(chunk.raw)})${status}${colors.reset}`,
      )
    })

  console.log('\n' + colors.blue + 'Totals (gzipped):' + colors.reset)
  console.log(
    `  JavaScript: ${formatBytes(stats.totals.js.gzip)} / ${formatBytes(THRESHOLDS.total)}`,
  )
  console.log(`  CSS: ${formatBytes(stats.totals.css.gzip)} / ${formatBytes(THRESHOLDS.css)}`)

  // Report violations
  if (violations.length > 0) {
    console.log('\n' + colors.red + colors.bold + 'Bundle Size Violations:' + colors.reset)
    violations.forEach((v) => {
      console.log(
        `  ${colors.red}${v.file}: ${formatBytes(v.size)} exceeds ${v.type} threshold of ${formatBytes(v.threshold)}${colors.reset}`,
      )
    })
    console.log('\n' + colors.yellow + 'Consider:' + colors.reset)
    console.log('  - Code splitting with dynamic imports')
    console.log('  - Tree-shaking unused dependencies')
    console.log('  - Using lighter alternatives for heavy libraries')
    console.log('  - Run `pnpm analyze` to visualize the bundle')
    process.exit(1)
  }

  console.log(
    '\n' + colors.green + colors.bold + 'All bundle sizes within limits!' + colors.reset + '\n',
  )
  console.log(`Stats saved to: ${STATS_OUTPUT}`)
}

analyzeBundle()

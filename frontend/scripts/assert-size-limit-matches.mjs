/* global console, process */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptPath = fileURLToPath(import.meta.url)
const frontendRoot = path.resolve(path.dirname(scriptPath), '..')
const configPath = path.join(frontendRoot, '.size-limit.json')
const distRoot = path.join(frontendRoot, 'dist')

function escapeRegExp(value) {
  return value.replace(/[|\\{}()[\]^$+?.]/g, '\\$&')
}

function globToRegExp(pattern) {
  const parts = pattern.split('*').map(escapeRegExp)
  return new RegExp(`^${parts.join('[^/]*')}$`)
}

function walkFiles(root, dir = root) {
  if (!fs.existsSync(root)) {
    return []
  }

  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const absolute = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      return walkFiles(root, absolute)
    }

    return path.relative(root, absolute).split(path.sep).join('/')
  })
}

function normalizePattern(pattern) {
  return pattern.split(path.sep).join('/')
}

const checks = JSON.parse(fs.readFileSync(configPath, 'utf8'))
const files = walkFiles(distRoot).map((file) => `dist/${file}`)
let hasMissingMatch = false
const expectedMatchCounts = new Map([
  ['Initial JS (entry point)', 1],
  ['React vendor', 1],
  ['TanStack vendor', 1],
  ['HeroUI vendor', 1],
  ['Sentry vendor', 1],
  ['DnD vendor', 1],
  ['signature-visuals/d3-geospatial', 1],
  ['signature-visuals/static-primitives', 1],
])

for (const check of checks) {
  const patterns = Array.isArray(check.path) ? check.path : [check.path]
  const matches = new Set()

  for (const pattern of patterns.filter(Boolean)) {
    const matcher = globToRegExp(normalizePattern(pattern))
    for (const file of files) {
      if (matcher.test(file)) {
        matches.add(file)
      }
    }
  }

  const expectedMatchCount = expectedMatchCounts.get(check.name)
  const expectedLabel =
    expectedMatchCount === undefined ? 'at least 1' : String(expectedMatchCount)

  console.log(`${check.name}: ${matches.size} file(s)`)

  if (matches.size === 0 || (expectedMatchCount !== undefined && matches.size !== expectedMatchCount)) {
    hasMissingMatch = true
    console.error(`${check.name}: expected ${expectedLabel} match(es), got ${matches.size}`)
  }
}

if (hasMissingMatch) {
  process.exit(1)
}

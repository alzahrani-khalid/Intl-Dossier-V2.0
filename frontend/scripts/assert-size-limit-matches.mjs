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

  console.log(`${check.name}: ${matches.size} file(s)`)

  if (matches.size === 0) {
    hasMissingMatch = true
  }
}

if (hasMissingMatch) {
  process.exit(1)
}

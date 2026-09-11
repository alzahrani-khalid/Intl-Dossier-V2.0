#!/usr/bin/env node

import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { basename, dirname, join } from 'node:path'

const [configPath, phasesDir] = process.argv.slice(2)

if (!configPath || !phasesDir) {
  console.error('usage: config-step-artifacts.mjs <config.json> <phases-dir>')
  process.exit(2)
}

let config
try {
  config = JSON.parse(readFileSync(configPath, 'utf8'))
} catch (error) {
  console.error(`cannot read config ${configPath}: ${error.message}`)
  process.exit(1)
}

if (!config.workflow || typeof config.workflow !== 'object' || Array.isArray(config.workflow)) {
  console.error(`config ${configPath} has no workflow object`)
  process.exit(1)
}

const enabled = []
const disabled = []
const nonBoolean = []

for (const [key, value] of Object.entries(config.workflow)) {
  if (typeof value !== 'boolean') {
    nonBoolean.push(`${key}=${JSON.stringify(value)}`)
    continue
  }

  const isEnabled = key.startsWith('skip_') ? value === false : value === true
  ;(isEnabled ? enabled : disabled).push(`${key}=${value}`)
}

console.log(`enabled=${enabled.length}`)
console.log(`enabled_steps=${enabled.join(',')}`)
console.log(`disabled=${disabled.join(',')}`)
console.log(`non_boolean=${nonBoolean.join(',')}`)

function researchFiles(root) {
  const found = []
  for (const entry of readdirSync(root, { withFileTypes: true })) {
    const path = join(root, entry.name)
    if (entry.isDirectory()) found.push(...researchFiles(path))
    else if (/^\d+-RESEARCH\.md$/.test(entry.name)) found.push(path)
  }
  return found
}

let validationRecords
try {
  validationRecords = researchFiles(phasesDir)
    .filter((path) => /^## Validation Architecture\b/m.test(readFileSync(path, 'utf8')))
    .map((researchPath) => {
      const phase = basename(researchPath).match(/^(\d+)-RESEARCH\.md$/)[1]
      const phaseDir = dirname(researchPath)
      const validation = existsSync(join(phaseDir, `${phase}-VALIDATION.md`))
      const waiver = existsSync(join(phaseDir, `${phase}-VALIDATION-WAIVER.md`))
      return { phase, validation, waiver }
    })
    .sort((a, b) => Number(a.phase) - Number(b.phase))
} catch (error) {
  console.error(`cannot inspect phases dir ${phasesDir}: ${error.message}`)
  process.exit(1)
}

// Keep the filed Phase 93 disposition as the final verdict line for command consumers.
validationRecords.sort((a, b) => (a.phase === '93' ? 1 : b.phase === '93' ? -1 : 0))

for (const record of validationRecords) {
  if (record.validation) console.log(`P${record.phase} validation=present`)
  else if (record.waiver) console.log(`P${record.phase} waiver=present`)
  else console.log(`P${record.phase} validation=MISSING`)
}

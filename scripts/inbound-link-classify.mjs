#!/usr/bin/env node
// Phase 97 / NAV-04 (D-09) — the INBOUND-LINK classifier.
//
// Lineage, because it is the point: P94's trigger sweep matched one form and saw 15% of its class;
// P96 built `scripts/trigsweep-classify.mjs` to end that, and this script copies its four structural
// moves onto a different subject. "This route has no inbound link" is a ZERO CLAIM, and a zero from
// a syntactic sweep is worth nothing unless the same run proves the sweep can still see a link.
//
//   (a) the POPULATION is enumerated mechanically from `FileRoutesByFullPath` in routeTree.gen.ts
//       (closed, not guessed) and re-derived on every run — this phase DELETES routes by design
//       (D-08), so no count is ever frozen here;
//   (b) each reference is classified by the UNION of the ten known link/navigation forms named in
//       97-RESEARCH §INBOUND-LINK, each a named regex, so the output says WHICH form matched;
//   (c) every route-shaped reference that matches NO known form is PRINTED as
//       `RESIDUAL — hand-classify`. The residual is part of the deliverable, never silently assumed
//       to be a non-link. A residual later found to be a link is a classifier bug: add its form here
//       and re-run;
//   (d) pinned controls fail the run (exit 1) rather than quietly reporting a smaller number.
//
// It reads source text with node:fs and matches in JS on purpose: `grep` on this machine is a ugrep
// wrapper honoring .gitignore, so shelling out to it would silently skip ignored trees.
//
// Exit codes:  0 classified; the residual was listed
//              1 a pinned invariant broke (a known-linked control went missing → regression)
//              2 UNABLE TO MEASURE — an input is absent or unparseable (fail closed, never a silent
//                zero; GATE-STANDARD C2: a labelled state, not a red)
//
// Usage:
//   node scripts/inbound-link-classify.mjs [--paths /a,/b] [--dead <file,...>] [--route-tree <path>]
//
//   --paths       restrict the report to named route paths (default: the whole route population)
//   --dead        files whose hits classify `NON-RENDERED (dead module)`
//   --route-tree  override the routeTree.gen.ts input (exists so the fail-closed path is drivable)

import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')

const unableToMeasure = (reason) => {
  console.log(`UNABLE TO MEASURE — ${reason}`)
  process.exit(2)
}

// ---- arguments -----------------------------------------------------------------------------------
// Read each flag's value by index off the flag itself. (trigsweep's header records what the clever
// form costs: `args[idx + 1]` is `args[0]` when the flag is absent, so the value silently becomes
// whatever came first.)
const args = process.argv.slice(2)
const flagValue = (name) => {
  const idx = args.indexOf(name)
  if (idx === -1) return undefined
  const value = args[idx + 1]
  if (value === undefined || value.startsWith('--')) unableToMeasure(`${name} given with no value`)
  return value
}
const splitList = (value) =>
  value === undefined ? [] : value.split(',').map((s) => s.trim()).filter((s) => s !== '')

const requestedPaths = splitList(flagValue('--paths'))
const deadArgs = splitList(flagValue('--dead'))
const routeTreePath = resolve(
  flagValue('--route-tree') ?? join(REPO_ROOT, 'frontend/src/routeTree.gen.ts'),
)
const SEARCH_ROOT = join(REPO_ROOT, 'frontend/src')

// ---- (a) the ROUTE population, enumerated mechanically, re-derived every run (D-08) --------------
if (!existsSync(routeTreePath)) unableToMeasure(`route tree absent: ${routeTreePath}`)
if (!existsSync(SEARCH_ROOT)) unableToMeasure(`search root absent: ${SEARCH_ROOT}`)

let routeTreeSrc
try {
  routeTreeSrc = readFileSync(routeTreePath, 'utf8')
} catch (err) {
  unableToMeasure(`route tree unreadable (${routeTreePath}): ${err.message}`)
}

const ifaceMatch = routeTreeSrc.match(/interface FileRoutesByFullPath \{([\s\S]*?)\n\}/)
if (ifaceMatch === null) {
  unableToMeasure(`no FileRoutesByFullPath interface in ${routeTreePath} — cannot derive population`)
}
const rawRoutes = [...ifaceMatch[1].matchAll(/^\s*'([^']*)':/gm)].map((m) => m[1])
if (rawRoutes.length === 0) unableToMeasure(`FileRoutesByFullPath in ${routeTreePath} holds 0 paths`)

// The generated tree writes index routes with a trailing slash (`/approvals/`, `/admin/`). Normalise
// it away so a caller may query either spelling; keep the root `/` intact.
const normalise = (p) => (p !== '/' && p.endsWith('/') ? p.slice(0, -1) : p)
const ROUTES = [...new Set(rawRoutes.map(normalise))].sort()

for (const p of requestedPaths) {
  if (!ROUTES.includes(normalise(p))) {
    unableToMeasure(
      `requested path is not in the route population: ${p} — it may have been deleted; ` +
        're-derive the population rather than reading its absence as a zero',
    )
  }
}
const reported = requestedPaths.length > 0 ? requestedPaths.map(normalise) : ROUTES

// ---- --dead inputs must exist, or their "no hits" is a silent zero -------------------------------
const DEAD = new Set()
for (const d of deadArgs) {
  const candidates = [resolve(d), join(REPO_ROOT, d), join(SEARCH_ROOT, d)]
  const hit = candidates.find((c) => existsSync(c))
  if (hit === undefined) unableToMeasure(`--dead file absent: ${d} (tried ${candidates.join(', ')})`)
  DEAD.add(relative(REPO_ROOT, hit))
}

// ---- (b) the UNION of the ten known forms, each named ---------------------------------------------
// Seeded from 97-RESEARCH §INBOUND-LINK instrument. Each regex is tested against a CONTEXT window
// (the referencing line plus the three lines above it) so multi-line JSX and multi-line option
// objects are not invisible. First match wins, so the output names one form per reference.
const FORMS = [
  { class: 'link (<Link to=)', re: /<Link\b[^<]*\bto\s*=/ },
  { class: 'anchor (<a href)', re: /<a\b[^<]*\bhref\s*=/ },
  { class: 'navigate ({ to: })', re: /\bnavigate\s*\(\s*\{[^})]*\bto\s*:/ },
  { class: 'redirect ({ to: })', re: /\bredirect\s*\(\s*\{[^})]*\bto\s*:/ },
  { class: 'router.navigate', re: /\brouter\.navigate\s*\(/ },
  { class: 'palette/shortcut navigateTo(', re: /\bnavigateTo\s*\(/ },
  { class: 'window.location', re: /\bwindow\.location\b/ },
  { class: 'window.open', re: /\bwindow\.open\s*\(/ },
  { class: 'history.replaceState', re: /\bhistory\.replaceState\s*\(/ },
  { class: 'nav data (path:)', re: /\bpath\s*:\s*['"`]\// },
]
const RESIDUAL = 'RESIDUAL — hand-classify'

// ---- (c) full-path matching WITH A BOUNDARY, longest match wins -----------------------------------
// `/admin/approvals` must not be satisfied by `/approvals` (a substring sweep reports it as linked
// when it is not — navigation-config.ts's item id `admin-approvals` points at the TOP-LEVEL route),
// and `/dossiers/persons` must not be satisfied by `/dossiers/persons/$id`, which is a DIFFERENT
// route in the same population. Both fall out of one rule: a reference matches a route when it
// EQUALS that route or continues it at a path boundary, and it is attributed to the LONGEST route it
// matches — so a deeper route claims its own references instead of leaking them to its parent.
const BOUNDARY = ['/', '?', '#']
const resolveRoute = (ref) => {
  let best = null
  for (const route of ROUTES) {
    const isMatch = ref === route || BOUNDARY.some((b) => ref.startsWith(route + b))
    if (isMatch && (best === null || route.length > best.length)) best = route
  }
  return best
}

// ---- the sweep ------------------------------------------------------------------------------------
const NAV_CONFIG = 'frontend/src/components/layout/navigation-config.ts'
const SOURCE_EXT = /\.(ts|tsx)$/
const QUOTED_PATH = /(['"`])(\/[^'"`\n]*)\1/g

const walk = (dir) => {
  const out = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) {
      if (entry.name === '__tests__' || entry.name === 'node_modules') continue
      out.push(...walk(full))
    } else if (entry.isFile() && SOURCE_EXT.test(entry.name) && entry.name !== 'routeTree.gen.ts') {
      out.push(full)
    }
  }
  return out
}

const files = walk(SEARCH_ROOT)
if (files.length === 0) unableToMeasure(`search root holds 0 source files: ${SEARCH_ROOT}`)

const renderedClassOf = (rel) => {
  if (DEAD.has(rel)) return 'NON-RENDERED (dead module)'
  if (rel.includes('/components/modern-nav/')) return 'NON-RENDERED (demo-only)'
  if (rel.endsWith('/routes/modern-nav-standalone.tsx')) return 'NON-RENDERED (demo-only)'
  return 'LIVE'
}

const refs = []
for (const file of files) {
  const rel = relative(REPO_ROOT, file)
  const rendered = renderedClassOf(rel)
  const lines = readFileSync(file, 'utf8').split('\n')
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i]
    const quoted = [...line.matchAll(QUOTED_PATH)].map((m) => m[2])
    if (quoted.length === 0) continue
    const context = lines.slice(Math.max(0, i - 3), i + 1).join('\n')
    const form = FORMS.find((f) => f.re.test(context))
    for (const ref of new Set(quoted)) {
      const route = resolveRoute(ref)
      if (route === null) continue
      refs.push({
        route,
        ref,
        file: rel,
        line: i + 1,
        form: form === undefined ? RESIDUAL : form.class,
        rendered,
        raw: line.trim(),
      })
    }
  }
}

const isKnownForm = (r) => r.form !== RESIDUAL
const liveLinksFor = (route) =>
  refs.filter((r) => r.route === route && r.rendered === 'LIVE' && isKnownForm(r))

// ---- output ----------------------------------------------------------------------------------------
const reportedSet = new Set(reported)
const inReport = refs.filter((r) => reportedSet.has(r.route))
const residual = inReport.filter((r) => !isKnownForm(r))
const nonRendered = inReport.filter((r) => r.rendered !== 'LIVE' && isKnownForm(r))

console.log('INBOUND-LINK CLASSIFICATION')
console.log(`route tree:  ${routeTreePath}`)
console.log(`search root: ${SEARCH_ROOT} (${files.length} .ts/.tsx files)`)
console.log(
  `ROUTE population: ${rawRoutes.length} full paths in FileRoutesByFullPath ` +
    `(${ROUTES.length} distinct after trailing-slash normalisation) — derived at run time, ` +
    'never frozen: this phase deletes routes by design (D-08).',
)
console.log(`reported: ${reported.length} path(s)`)
console.log('')
console.log(
  'POPULATION DEFINITION: quoted route-shaped strings in frontend/src *.ts/*.tsx, excluding ' +
    'routeTree.gen.ts and **/__tests__/**, resolved to a route in the population by full-path ' +
    'boundary match. OUTSIDE IT: computed paths via getDossierDetailPath / getDossierRouteSegment ' +
    '(33 files), template-literal to={} props whose path is assembled at runtime, runtime-built ' +
    'strings passed through variables, redirects held in server data, useRecentNavigation (a replay ' +
    'of visited paths — derivative, not an origin), e2e page.goto (not a product link), and ' +
    'UNQUOTED route-shaped text — regex literals over paths (CommandPalette.tsx:283 ' +
    'pattern: /^\\/admin/) and JSDoc "Route: /x" banners are invisible to the quoted-string ' +
    'extractor, which is correct for both but is a stated blind spot, not a proof of absence.',
)
console.log(
  'FLOOR: every inbound-link count below is a FLOOR, never a total — a syntactic sweep ' +
    'under-counts behaviour classes (TRIGSWEEP-01), and the forms above are a union of the KNOWN ' +
    'ten plus a printed residual, not a proof of completeness.',
)
console.log(
  'CEILING: an inbound-link count is a FLOOR for the ABSENCE claim and a CEILING for the PRESENCE ' +
    'claim. A zero may under-count (a link form was missed); a non-zero may over-count (the linking ' +
    'file may itself never be mounted). /monitoring is the in-repo proof of the second half — its ' +
    'only link lives in a tree mounted by one demo route — and it is why --dead exists.',
)
console.log(
  'LIVE means "in the rendered tree by file location, and not classified otherwise". It does NOT ' +
    'mean "proven to be mounted": a link inside a component that nothing renders is LIVE under this ' +
    'instrument. The closed set of RENDERED classes is LIVE / NON-RENDERED (demo-only) / ' +
    'NON-RENDERED (dead module).',
)
console.log('')

console.log('route                                    LIVE  forms')
console.log('---------------------------------------- ----  -----')
for (const route of reported) {
  const live = liveLinksFor(route)
  const byForm = new Map()
  for (const r of live) byForm.set(r.form, (byForm.get(r.form) ?? 0) + 1)
  const forms =
    byForm.size === 0
      ? '(none)'
      : [...byForm.entries()].map(([f, n]) => `${f}×${n}`).join(', ')
  console.log(`${route.padEnd(40)} ${String(live.length).padStart(4)}  ${forms}`)
}
console.log('')

console.log('LIVE inbound links, one line each:')
if (inReport.filter((r) => r.rendered === 'LIVE' && isKnownForm(r)).length === 0) {
  console.log('  (none)')
} else {
  for (const r of inReport.filter((x) => x.rendered === 'LIVE' && isKnownForm(x))) {
    console.log(`  ${r.route.padEnd(28)} ${r.file}:${r.line}  [${r.form}]  ${r.ref}`)
  }
}
console.log('')

console.log(`NON-RENDERED hits (${nonRendered.length}) — NOT counted as inbound links:`)
if (nonRendered.length === 0) {
  console.log('  (none)')
} else {
  for (const r of nonRendered) {
    console.log(`  ${r.route.padEnd(28)} ${r.rendered}  ${r.file}:${r.line}  [${r.form}]`)
  }
}
console.log('')

// (h) LIVE NAV STATE — 97-09 consumes exactly this to tell ALREADY REACHABLE from NEEDS AN ENTRY.
for (const route of reported) {
  const navHits = liveLinksFor(route).filter((r) => r.file === NAV_CONFIG)
  if (navHits.length === 0) {
    console.log(`NAV-CONFIG ENTRY: ${route} NONE`)
  } else {
    console.log(`NAV-CONFIG ENTRY: ${route} ${navHits.map((r) => `${r.file}:${r.line}`).join(' ')}`)
  }
}
console.log('')

console.log(
  `RESIDUAL (${residual.length}) — hand-classify each; every one is listed and none is assumed to ` +
    'be a non-link:',
)
if (residual.length === 0) {
  console.log('  (none — and this is the run that shows it)')
} else {
  for (const r of residual) {
    console.log(`  ${r.file}:${r.line}  [${r.rendered}]  ${r.route}  <- ${r.ref}`)
    console.log(`      ${r.raw}`)
  }
}
console.log('')

// ---- (d) PINS — a broken pin is exit 1, never a smaller number quietly reported --------------------
const controlHits = liveLinksFor('/admin/ai-settings')
// RULING-P97-16: this pin compared COUNTS as a proxy for "the boundary matcher discriminates".
// P97-10 gave /admin/approvals its own nav entry, so both counts became 1 and the proxy expired —
// while the PROPERTY it stood for is unchanged and still worth testing. An expired EXAMPLE is not
// an expired REQUIREMENT, so the pin now asserts the property DIRECTLY: the two paths must resolve
// to DIFFERENT LOCATION SETS. That is what non-conflation means, it is strictly stronger than the
// count comparison, and it does not expire when the counts happen to coincide.
const adminApprovalsHits = liveLinksFor('/admin/approvals')
const topApprovalsHits = liveLinksFor('/approvals')
const locSet = (hits) => hits.map((r) => `${r.file}:${r.line}`).sort().join(',')
const adminApprovals = locSet(adminApprovalsHits)
const topApprovals = locSet(topApprovalsHits)
const monitoringDemo = refs.filter(
  (r) =>
    r.route === '/monitoring' &&
    r.file.includes('/components/modern-nav/') &&
    r.rendered === 'NON-RENDERED (demo-only)',
)

const pins = [
  {
    name: 'control  /admin/ai-settings is known-linked (navigation-config.ts)',
    ok: controlHits.length > 0,
    detail:
      controlHits.length > 0
        ? `${controlHits.length} LIVE inbound link(s): ` +
          controlHits.map((r) => `${r.file}:${r.line}`).join(', ')
        : 'ZERO — the sweep can no longer see a link it is KNOWN to see, so every zero in this ' +
          'run is uninterpretable. Fix the classifier; do not read the zeros.',
  },
  {
    name: 'boundary /admin/approvals vs /approvals resolve to DIFFERENT location sets',
    ok:
      adminApprovals !== topApprovals &&
      adminApprovalsHits.length > 0 &&
      topApprovalsHits.length > 0,
    detail:
      adminApprovalsHits.length === 0 || topApprovalsHits.length === 0
        ? `UNABLE TO MEASURE — one side resolved to nothing (/admin/approvals=${adminApprovalsHits.length}, ` +
          `/approvals=${topApprovalsHits.length}). A pin cannot prove non-conflation when a side is empty; ` +
          'both sides must be non-empty for the comparison to mean anything.'
        : adminApprovals !== topApprovals
          ? `/admin/approvals=[${adminApprovals}] vs /approvals=[${topApprovals}] — DIFFERENT locations, ` +
            'so the boundary matcher is doing work (counts may coincide; locations must not)'
          : `both resolve to [${adminApprovals}]. The matcher is CONFLATING the two paths — a substring ` +
            'match is treating /approvals as if it were /admin/approvals. Fix the matcher; do NOT ' +
            'loosen this pin to make it pass.',
  },
  {
    name: 'demo     navigationData.ts /monitoring entry is NON-RENDERED (demo-only)',
    ok: monitoringDemo.length > 0,
    detail:
      monitoringDemo.length > 0
        ? monitoringDemo.map((r) => `${r.file}:${r.line} [${r.form}]`).join(', ')
        : 'ZERO — the demo-only classifier stopped seeing the modern-nav tree, so its hits would ' +
          'now be counted as live inbound links.',
  },
]

console.log('PINS (a broken pin is exit 1, never a smaller number quietly reported):')
for (const p of pins) console.log(`  ${p.ok ? 'ok      ' : 'BROKEN  '} ${p.name}\n      ${p.detail}`)

const broken = pins.filter((p) => !p.ok)
if (broken.length > 0) {
  console.log('')
  console.log(`INVARIANT BROKE — ${broken.length} pin(s): ${broken.map((p) => p.name).join('; ')}`)
  process.exit(1)
}
process.exit(0)

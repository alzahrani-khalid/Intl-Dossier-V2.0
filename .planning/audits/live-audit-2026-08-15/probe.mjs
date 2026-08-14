// ponytail: one shared probe for all consultants. Usage:
//   node probe.mjs --route /dashboard [--lang en|ar] [--w 1440] [--h 900] [--out DIR] [--wait 2500] [--click "selector"]
// Emits: <out>/<slug>.png  + a JSON report on stdout (console errors, failed requests,
//        raw-i18n-key leaks, visible headings, links, counts).
import { chromium } from '@playwright/test'
import * as fs from 'node:fs'
import * as path from 'node:path'

const arg = (n, d) => {
  const i = process.argv.indexOf('--' + n)
  return i === -1 ? d : process.argv[i + 1]
}
const SCRATCH = '/private/tmp/claude-501/-Users-khalidalzahrani-Desktop-CodingSpace-Intl-Dossier-V2-0/65c21b7e-d183-44bc-b184-de0a48e80b8c/scratchpad'
const route = arg('route', '/dashboard')
const lang = arg('lang', 'en')
const width = Number(arg('w', 1440))
const height = Number(arg('h', 900))
const outDir = arg('out', path.join(SCRATCH, 'shots'))
const settle = Number(arg('wait', 2500))
const clickSel = arg('click', '')
fs.mkdirSync(outDir, { recursive: true })

const slug = (lang + route.replace(/[/?=&]/g, '_') + `_${width}`).replace(/^_/, '')
const browser = await chromium.launch()
const context = await browser.newContext({
  baseURL: 'http://localhost:5173',
  storageState: path.join(SCRATCH, 'storageState.json'),
  viewport: { width, height },
  locale: lang === 'ar' ? 'ar-SA' : 'en-US',
})
// App persists language under localStorage `id.locale` (not i18nextLng).
await context.addInitScript((l) => {
  localStorage.setItem('id.locale', l)
  localStorage.setItem('intl-dossier-tours-enabled', 'false')
}, lang)

const consoleErrors = []
const pageErrors = []
const badRequests = []
const page = await context.newPage()
page.on('console', (m) => {
  if (m.type() === 'error' || m.type() === 'warning')
    consoleErrors.push(`[${m.type()}] ${m.text()}`.slice(0, 400))
})
page.on('pageerror', (e) => pageErrors.push(String(e).slice(0, 400)))
page.on('response', (r) => {
  if (r.status() >= 400) badRequests.push(`${r.status()} ${r.request().method()} ${r.url().slice(0, 220)}`)
})
page.on('requestfailed', (r) => badRequests.push(`FAILED ${r.method()} ${r.url().slice(0, 220)} ${r.failure()?.errorText ?? ''}`))

let navError = null
try {
  await page.goto(route, { waitUntil: 'domcontentloaded', timeout: 30_000 })
  await page.waitForTimeout(settle)
  if (clickSel) {
    await page.click(clickSel, { timeout: 8000 })
    await page.waitForTimeout(settle)
  }
} catch (e) {
  navError = String(e).slice(0, 300)
}

const info = await page.evaluate(() => {
  const txt = (document.body.innerText || '').replace(/\s+\n/g, '\n')
  const vis = (el) => {
    const r = el.getBoundingClientRect()
    return r.width > 0 && r.height > 0
  }
  // Raw i18n keys that leaked into the UI, e.g. "dossiers:list.title" or "common.save"
  const keyRe = /(^|\s)([a-zA-Z][\w-]*[:.][\w.-]{3,}\b)/g
  const leaks = new Set()
  document.querySelectorAll('body *').forEach((el) => {
    if (el.children.length) return
    const t = (el.textContent || '').trim()
    if (!t || t.length > 120) return
    if (/^https?:|@|\.(png|svg|com|sa)$/i.test(t)) return
    let m
    while ((m = keyRe.exec(t))) if (/^[a-z][\w-]*[:.]/.test(m[2])) leaks.add(m[2])
  })
  const headings = [...document.querySelectorAll('h1,h2,h3')].filter(vis).map((h) => h.textContent.trim()).slice(0, 25)
  const links = [...new Set([...document.querySelectorAll('a[href]')].map((a) => a.getAttribute('href')))]
    .filter((h) => h && h.startsWith('/'))
    .slice(0, 60)
  const buttons = [...document.querySelectorAll('button')].filter(vis)
  return {
    dir: document.documentElement.dir,
    htmlLang: document.documentElement.lang,
    title: document.title,
    url: location.pathname + location.search,
    bodyFont: getComputedStyle(document.body).fontFamily,
    charCount: txt.length,
    headings,
    i18nKeyLeaks: [...leaks].slice(0, 30),
    links,
    buttonCount: buttons.length,
    unlabeledButtons: buttons.filter((b) => !b.textContent.trim() && !b.getAttribute('aria-label') && !b.getAttribute('title')).length,
    imgNoAlt: [...document.querySelectorAll('img')].filter((i) => !i.hasAttribute('alt')).length,
    alerts: [...document.querySelectorAll('[role="alert"]')].map((a) => a.textContent.trim().slice(0, 160)),
    skeletons: document.querySelectorAll('[class*="skeleton"],[class*="animate-pulse"]').length,
    emptyStateHint: /no .{0,24}(found|yet|data|results|items)|empty|nothing/i.test(txt),
    hScroll: document.documentElement.scrollWidth > document.documentElement.clientWidth + 2,
    scrollW: document.documentElement.scrollWidth,
    // Design-system violations: raw hex / tailwind color literals shipped in class attrs
    rawColorClasses: [...new Set([...document.querySelectorAll('[class]')].flatMap((el) =>
      String(el.className.baseVal ?? el.className).split(/\s+/).filter((c) =>
        /^(text|bg|border)-(slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\d{2,3}$/.test(c))))].slice(0, 20),
    text: txt.slice(0, 2600),
  }
})

const shot = path.join(outDir, slug + '.png')
await page.screenshot({ path: shot, fullPage: false })
console.log(JSON.stringify({
  route, lang, viewport: `${width}x${height}`, screenshot: shot, navError,
  ...info,
  pageErrors, consoleErrors: consoleErrors.slice(0, 25), badRequests: [...new Set(badRequests)].slice(0, 25),
}, null, 1))
await browser.close()

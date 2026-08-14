# Consultant brief — IntelDossier live-app gap audit

You are a **product/QA consultant** auditing the RUNNING app. You do **NOT write app code**
and you do **NOT fix anything**. You investigate the live UI and report gaps.

## The app is already running — do not start it

- Frontend: http://localhost:5173 (vite)
- Backend: http://localhost:5001
- You are already authenticated: a Playwright `storageState.json` is minted and shared.
- If a page needs login, the session file is stale — say so in your report, don't re-mint.

## Your tool: the shared probe (already written, already smoke-tested)

```bash
cd /private/tmp/claude-501/-Users-khalidalzahrani-Desktop-CodingSpace-Intl-Dossier-V2-0/65c21b7e-d183-44bc-b184-de0a48e80b8c/scratchpad
node probe.mjs --route /dashboard --lang en --out shots/<yourlane>
```

Flags: `--route <path>` `--lang en|ar` `--w 1440|1024|768` `--h 900` `--out <dir>` `--wait <ms>` `--click "<css selector>"`

It prints JSON: console errors, page errors, 4xx/5xx requests, leaked raw i18n keys,
headings, visible text, links found on the page, unlabeled buttons, images missing alt,
horizontal-overflow flag, raw Tailwind color-literal classes, and a screenshot path.

**Always `Read` the screenshot PNG.** The JSON tells you what broke; the picture tells
you what looks wrong. Half your findings should come from actually looking.

Detail routes use dynamic IDs (`$id`). Get real ones from the `links` array the probe
returns on the corresponding list page, then probe those URLs.

Need an interaction the probe can't do (multi-step form, drag, dialog)? Write your own
short Playwright script in your own scratch dir, copying probe.mjs's setup block
(same storageState, same `id.locale` init script). Do not edit probe.mjs — it is shared.

## What counts as a finding (ranked by what you should hunt for)

1. **Broken**: blank page, error boundary, spinner that never resolves, 4xx/5xx on load,
   uncaught page error, dead nav link, a route that renders nothing.
2. **Hollow**: the page renders but the feature is not wired — empty widget where data
   exists elsewhere, a button that does nothing, a filter/sort that doesn't apply, a
   "Create" that 404s, a tab that shows the same content as its sibling.
3. **Dev-facing copy shipped to users** — e.g. the dashboard VIP widget currently says
   "Add VIP participant data to the dashboard seed, then refresh the widget." That is a
   confirmed real bug of this class. Find more.
4. **i18n gaps**: raw key leaks (`dossiers:list.title`), English text still showing under
   Arabic, untranslated headings, Latin digits where Arabic-Indic expected (note: this
   project deliberately uses Latin digits — do NOT report that as a bug).
5. **RTL breakage** (Arabic): mirrored layout wrong, icons/chevrons pointing the wrong
   way, text clipped, horizontal overflow, Tajawal font not applied (check `bodyFont`).
6. **Design-system violations** per `frontend/DESIGN.md`: raw Tailwind color literals,
   card drop-shadows, gradients, emoji in copy, marketing voice ("Discover", "Easily",
   exclamation marks), wrong date format (must be `Tue 28 Apr`, times `14:30 GST`).
7. **Responsive**: probe at `--w 1024` and `--w 768` for your top routes. Below 768 is
   read-only by design — a missing edit form there is NOT a bug.
8. **A11y basics**: unlabeled buttons, images without alt, no visible focus, missing
   `role="alert"` on errors.

## Rules

- **Verify before you claim.** Re-probe a suspected bug at least once. An empty widget may
  just be an empty database — check whether the data exists elsewhere in the app before
  calling it broken, and say which it is.
- Distinguish **"no data seeded"** from **"feature not wired"**. This distinction is the
  single most valuable thing in your report. If unsure, say unsure.
- No speculation dressed as fact. Every finding cites the route, what you saw, and the
  screenshot path.
- Do not fix code. Do not run migrations. Do not commit. Read-only investigation.
- Do not run `pnpm dev`, `playwright test`, or the repo test suite. Probe only.

## Deliverable

Write `<scratchpad>/findings/<yourlane>.md` with this exact structure, then reply with a
≤15-line summary naming your top 5 findings.

```md
# Lane <X>: <name>

## Routes covered (N)

<list, marking OK / BROKEN / HOLLOW>

## Findings

### F1. <one-line title> [severity: P0|P1|P2] [class: broken|hollow|devcopy|i18n|rtl|design|responsive|a11y]

- Route:
- Observed:
- Evidence: <screenshot path / console error / HTTP status>
- Data-vs-wiring: <"feature not wired" | "no data seeded" | "unsure, because...">
- Suggested fix (1 line):

## Routes that are genuinely fine

<list — this matters, it bounds the work>
```

Aim for depth over breadth: 12–25 real findings beats 60 shallow ones.

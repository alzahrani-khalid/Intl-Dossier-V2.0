# Phase 70 — UI Review

**Audited:** 2026-06-16
**Baseline:** 70-UI-SPEC.md (approved 2026-06-15, 6/6 PASS)
**Screenshots:** Not captured — dev server at localhost:3000 returned HTTP 307 (redirect); no stable HTML response; code-only audit conducted.

---

## Pillar Scores

| Pillar               | Score | Key Finding                                                                                                                                                                                                                                                      |
| -------------------- | ----- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1. Copywriting       | 3/4   | Exact spec copy present in i18n; one label drift: `action.save = "Save"` (generic) in alerts; `digest.back` renders as "Digests" (arrow-less fallback)                                                                                                           |
| 2. Visuals           | 2/4   | Tab strip is `Button variant="default"/"outline"` toggles, not the `.tab` / accent-underline strip specified; HITL is inline card not 720px drawer; per-dossier subscribe affordance absent from dossier header                                                  |
| 3. Color             | 3/4   | P70 new components clean (0 raw hex, 0 Tailwind color literals); `bg-accent/10` opacity shorthand used in pre-existing Reports section of `IntelligencePage.tsx`; `text-warning` (non-token alias) used in DigestReader severity badge                           |
| 4. Typography        | 2/4   | Extensive `text-sm` / `text-xs` raw Tailwind classes throughout new P70 components instead of `[font-size:var(--t-body)]` / `[font-size:var(--t-meta)]`; spec declares 4 mapped tokens and requires their use                                                    |
| 5. Spacing           | 3/4   | All logical properties (`ps-*`, `pe-*`, `ms-*`, `me-*`) — no directional violations; `pt-0.5` / `pb-0.5` (2px) used for badge padding is outside the declared spacing scale; `pt-4 pb-3` asymmetric padding on DigestCard click target                           |
| 6. Experience Design | 3/4   | Loading skeletons, error banners with retry, empty states all present; `DigestReader` footer omits `Unsubscribe` ghost link required by spec; subscribe button in hub Digests tab is permanently disabled without a dossierContext (no self-service path in hub) |

**Overall: 16/24**

---

## Top 3 Priority Fixes

1. **Tab strip is button toggles, not an accent-underline tab strip** — users lose visual affordance for which section is active; the hub fails the focal-point hierarchy contract. Fix: replace the four `<Button variant=...>` toggles in `IntelligencePage.tsx` (lines 407-436) with the `.tabs` / `.tab` / `.tab.active` CSS pattern already established by `DossierTabNav` and `list-pages.css`.

2. **`DossierTabNav` BASE_DOSSIER_TABS does not include `digests`** — the per-dossier `/digests` child routes exist for all 8 types but no tab link is rendered in the dossier shell; the subscribe affordance (`DigestSubscribeDrawer`) is only reachable via the hub Digests tab with a `dossierId` prop, which is never passed in the hub context (subscribe button disabled). This blocks the D-12 "entry point = from the dossier" contract. Fix: add `{ key: 'digests', labelKey: 'tabs.digests', path: 'digests' }` to `BASE_DOSSIER_TABS` in `DossierTabNav.tsx` and add the corresponding i18n key `tabs.digests` in the `dossier-shell` namespace.

3. **Typography uses raw Tailwind size classes (`text-sm`, `text-xs`) throughout P70 components instead of design-token expressions** — e.g. `DigestsTab.tsx` line 84 (`text-sm text-ink-mute`), `AlertRuleForm.tsx` lines 241, 280, 290, 300, 312, 324 (`text-sm text-ink`), `DigestSubscribeDrawer.tsx` line 134 (`text-sm`). The spec declares `--t-body` (13px) and `--t-meta` (12px) as the only sizes for these contexts. Fix: replace `text-sm` with `[font-size:var(--t-body)]` and `text-xs` with `[font-size:var(--t-meta)]` throughout the eight new P70 component files.

---

## Detailed Findings

### Pillar 1: Copywriting (3/4)

**What passes:**

- All primary CTAs match the spec exactly: `"Subscribe to digest"`, `"Add alert"`, `"Generate digest now"`, `"Generate now"`, `"Publish digest"`, `"Edit frequency"` — confirmed in `en/intelligence-digests.json` and `en/intelligence-alerts.json`.
- Empty states match verbatim: `"No digest subscriptions yet"`, `"No digests published yet"`, `"No alert rules"` with correct body copy.
- Error states match: `"Couldn't load digests. Check your connection and retry."`, `"Couldn't generate digest. Check your connection and retry."`, `"Couldn't publish digest. Try again."`, `"Couldn't subscribe. Try again."`, `"Couldn't load alert rules. Check your connection and retry."`, `"Couldn't save alert rule. Try again."`.
- Destructive confirmations match: `"Unsubscribe from this digest?"` / `"You'll stop receiving the recurring rollup for this dossier."` / `"Keep subscription"`, and `"Delete this alert rule?"` / `"You'll no longer be notified of matching signals on this dossier."` / `"Keep alert"`.
- No marketing voice, no emoji, no exclamation marks detected in P70 components.
- Date formatting delegates to `formatDayFirst()` and `formatTime()` utilities with GST suffix confirmed (`format-date.ts` line 54).

**Findings:**

WARNING — `en/intelligence-alerts.json` `action.save` = `"Save"`. The spec does not list this key and the word "Save" alone is generic. In the `AlertRuleForm` this renders on the submit button for edit mode (`AlertRuleForm.tsx` line 362). The spec calls for "Add alert" in create mode and an equivalent specific label in edit mode. The current implementation uses the generic `"Save"`. Low user impact but a spec gap.

WARNING — `digest.back` (`en/intelligence-digests.json` line 72) = `"Digests"` without an arrow character. The spec says back link: `"← Digests"` with the IntelDossier back-arrow icon. The arrow icon is rendered separately by `DigestReader.tsx` (line 39 — `BackIcon = isRTL ? ArrowRight : ArrowLeft`) so this is split rendering, not missing, but the i18n copy omits the spec's `←` prefix.

WARNING — `chip.daily/weekly/monthly` in Arabic JSON (`ar/intelligence-digests.json`) outputs `"يومي"` / `"أسبوعي"` / `"شهري"` (lowercase Arabic), but the spec requires UPPERCASE label chips. Arabic does not have case, so these render correctly as Arabic labels. However, the EN chip values (`DAILY`, `WEEKLY`, `MONTHLY`) are `uppercase` by CSS class, not the `text-xs uppercase` token being applied to the Arabic strings which lack case transformation — minor, no user impact.

---

### Pillar 2: Visuals (2/4)

**Critical — Tab strip does not match spec.**

`IntelligencePage.tsx` lines 407-436 implements the four hub tabs (`Reports | Signals | Digests | Alerts`) as `<Button variant={activeTab === 'X' ? 'default' : 'outline'} size="sm">` toggles. The active button uses `variant="default"` which applies `bg-accent` background fill — this is the opposite of the spec's contract: `var(--accent)` underline (2px) on an otherwise `var(--surface)` background tab, with `var(--ink-mute)` inactive text. The button-group pattern creates a visually heavy toolbar look, not a tab strip. The correct `.tab` CSS pattern with `border-bottom-color: var(--accent)` and `font-weight: 600` already exists in `list-pages.css` and is used by `DossierTabNav`. The hub tab strip was not migrated to this pattern.

**BLOCKER — Per-dossier subscribe affordance missing from dossier header.**

Spec Surface 3a (D-12) requires `"Subscribe to digest"` as a persistent affordance "below dossier glyph and name, above tabs" on any dossier detail page. What is implemented: 8 per-dossier `/digests` child routes exist but the tab link to navigate to them is absent from `BASE_DOSSIER_TABS` in `DossierTabNav.tsx`. `DossierShell.tsx` has zero imports or references to `DigestSubscribeDrawer` or `GenerateDigestButton`. The subscribe affordance only exists inside `DigestsTab` when `dossierId` is passed — but the hub always calls `<DigestsTab />` without a prop (line 439), making the subscribe button always disabled in the hub context.

**WARNING — HITL preview is an inline card, not the spec's 720px drawer.**

Spec Surface 5 states: "Step 2 — Preview drawer (720px wide, `var(--shadow-lg)`)". The `GenerateDigestButton.tsx` implementation renders the HITL preview as an inline `<div>` with `max-w-[520px]` (line 131) within the same page flow, not a drawer. The 3-step HITL flow (period picker → preview drawer → publish confirmation) is collapsed to 2 steps (generate button → inline preview card with discard/publish). The period picker popover (Step 1 of the spec flow) is also absent; the period is passed as a prop directly. This deviates from the interaction contract.

**WARNING — Period picker (Step 1 of HITL) absent from GenerateDigestButton.**

The spec requires a "Period picker (inline popover)" with Daily/Weekly/Monthly radio chips as the first HITL step. `GenerateDigestButton` accepts `period` as a prop and calls `generate_digest` with it directly. The analyst cannot choose the period at generate time; it inherits the subscription frequency. This reduces self-service control.

**What passes:**

- Icon-only delete button has `aria-label` on `AlertRuleRow.tsx` line 136.
- Channel icons in `AlertRuleRow` carry individual `aria-label` attributes.
- Hover state on digest cards: `hover:bg-line-soft hover:shadow-sm` (120ms via `duration-[var(--dur-fast)]`) — matches spec.
- Alert rule rows: `hover:bg-line-soft` at `duration-[var(--dur-fast)] ease-out` — matches spec.
- Focus rings: `focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]` — correct.
- Active/inactive rule: `text-ink` vs `text-ink-faint` on `AlertRuleRow.tsx` line 93 — matches spec.
- Rollup KPI strip: 3-column flush grid with `border-s border-line` separators — matches spec.
- Drawers (`DigestSubscribeDrawer`, `AlertRuleForm`) use `boxShadow: 'var(--shadow-lg)'` and `insetInlineEnd: 0` — matches spec.

---

### Pillar 3: Color (3/4)

**P70 new components (8 files) — clean.**

Running `grep -rn "text-blue-500|text-red-500|text-green-500|#[0-9a-fA-F]" frontend/src/components/intelligence/` returns zero matches. All colors in the new components use `var(--*)` tokens or mapped Tailwind utilities (`text-ink`, `text-danger`, `bg-surface`, `border-line`, `bg-accent-soft`, `text-accent-ink`). No raw hex detected.

**Finding — `text-warning` used in `DigestReader.tsx` line 104 (severity badge).**

The severity badge for items uses `text-warning`. The IntelDossier token is `var(--warn)` (and `text-[var(--warn)]`). `text-warning` is a Tailwind utility alias — it resolves if mapped in the design system's `@theme` configuration but this alias is not declared in the design contract. The spec explicitly uses `var(--warn)` and `var(--warn-soft)`. `DigestCard.tsx` correctly uses `bg-[var(--warn-soft)] text-warning` (line 24 in `SEVERITY_CLASSES`). Severity classes in `DigestCard` are also inconsistent: `high`/`urgent` → `text-danger` (correct token utility); `low` → `text-[var(--ok)]` (wrapped var, not a utility). This mixing of token patterns is a quality issue.

**Finding — `IntelligencePage.tsx` (pre-existing, not P70) uses shadcn default tokens.**

`text-muted-foreground` (19 occurrences), `bg-accent/10` opacity shorthand (2 occurrences), `text-2xl font-bold` (4 occurrences) appear in the Reports section of `IntelligencePage.tsx`. These violate the no-raw-tailwind-color-literals rule. These are pre-existing and not introduced by P70, but as the file was modified to add the tab buttons, they are in scope for the overall surface audit.

**60/30/10 distribution:**

- 60% `var(--bg)` canvas: verified in `DigestsTab` outer div background (default), page background.
- 30% `var(--surface)` cards/panels: `bg-surface` on all digest cards, alert rows, drawers — correct.
- 10% accent: accent used on primary CTAs (`GenerateDigestButton` primary, `AlertsTab` "Add alert", subscribe confirm), frequency chips (`bg-accent-soft text-accent-ink`), focus rings — within spec reserved list. Hub tab active state uses `variant="default"` which fills with accent background — this is over-applying accent to all four tab states simultaneously (active tab). Per spec, only the active indicator should be accent. WARNING.

---

### Pillar 4: Typography (2/4)

**Finding — Raw Tailwind font-size classes throughout P70 components instead of design-token expressions.**

The spec declares 4 text sizes as `var(--t-*)` tokens and requires their use. The P70 components instead use raw Tailwind classes for a large proportion of their text:

- `text-sm` (maps approximately to `--t-body` 13px but is not the token): appears in `DigestsTab.tsx` lines 84, 143, 158, 163; `DigestSubscribeDrawer.tsx` lines 102, 134; `AlertRuleForm.tsx` lines 221, 241, 280, 290, 300, 312, 324; `AlertsTab.tsx` lines 104, 119, 121.
- `text-xs` (maps approximately to `--t-meta` 12px but is not the token): appears in `DigestCard.tsx` lines 145, 179; `DigestReader.tsx` lines 86, 89, 104; `AlertRuleRow.tsx` lines 101, 106; `AlertRuleForm.tsx` lines 233, 261, 264, 270, 294, 301, 313.

Counting distinct font-size expressions in the new P70 components:

1. `[font-size:var(--t-page-title)]` — page headings.
2. `[font-size:var(--t-body)]` — used for dossier name in DigestCard, signal titles.
3. `[font-size:var(--t-meta)]` — used for chips, period strings, footer.
4. `[font-size:var(--t-kpi-value)]` — rollup KPI numbers.
5. `[font-size:var(--t-mono-tiny)]` — HITL preview banner.
6. `[font-size:var(--t-card-title)]` — drawer headers.
7. `text-sm` — used in body copy, form labels, error text.
8. `text-xs` — used in chips, meta labels, form sub-labels.

That is 8 distinct font-size expressions, not the 4 declared in the spec. `text-sm` and `text-xs` are functionally equivalent to `--t-body` and `--t-meta` but are not token-bound — they will not respond to density or theme overrides.

Font weights: `font-medium` and `font-semibold` are the two weights used — within the 2-weight limit.

---

### Pillar 5: Spacing (3/4)

**What passes:**

- No `ml-*`, `mr-*`, `pl-*`, `pr-*`, `text-left`, `text-right` in any P70 component.
- All directional spacing uses logical properties: `ps-4 pe-4`, `ms-auto`, `me-2`, `gap-2`, `gap-3`, `gap-4`.
- Drawer `insetInlineEnd: 0` for RTL-aware slide direction.
- Row heights: `style={{ minHeight: 'var(--row-h)' }}` on subscription strip rows and alert rule rows — correct.

**Finding — `pt-0.5` / `pb-0.5` (2px) badge padding is outside the declared spacing scale.**

The spec's spacing scale starts at 4px (`xs = --space-1`). `pt-0.5` and `pb-0.5` (2px each) appear throughout badge chips across all P70 components: `DigestCard.tsx` lines 145, 179; `DigestsTab.tsx` line 100; `AlertRuleRow.tsx` lines 101, 106; `DigestSubscribeDrawer.tsx` line 110; `AlertRuleForm.tsx` line 264; `DigestReader.tsx` lines 89, 104. This is a systematic use of a 2px value below the declared minimum. The spec does include the exception `--space-1 = 4px` as minimum; 2px is not in the exceptions table. The visual effect is tight badge padding that may render inconsistently across density modes.

**Finding — `pt-4 pb-3` asymmetric vertical padding on `DigestCard` click target.**

`DigestCard.tsx` line 140: `pt-4 pb-3` — 16px top, 12px bottom. This is asymmetric without justification. The spec states card inner padding is 16px (md). The footer row separately uses `pt-3 pb-3` (12px). The 12px bottom inside the click zone creates visual tightness between the signal list and the footer border.

**Finding — `space-y-2`, `space-y-3`, `space-y-4`, `space-y-5` all used.**

`AlertRuleForm.tsx` uses `space-y-5` (20px) for the main form fields, alongside `space-y-2` and `space-y-3`. The spec's declared exception for 20px is `--pad` (comfortable density card padding) used for card inner padding. Using `space-y-5` for inter-field spacing is a non-declared value per the scale — though it is a multiple of 4 (20px), it is not in the main table or the exceptions.

---

### Pillar 6: Experience Design (3/4)

**What passes:**

- Loading skeletons: `DigestsTab.tsx` lines 124-136 (pulse skeleton for 3 digest cards); `AlertsTab.tsx` lines 85-97 (pulse skeleton for 3 alert rows).
- Error states with `role="alert"`: `DigestsTab.tsx` line 139; `AlertsTab.tsx` line 99; `GenerateDigestButton.tsx` line 121 and line 160 (generate and publish errors).
- Retry buttons with correct copy on all error states.
- Disabled states: subscribe button disabled when no dossierId; form submit disabled while submitting; generate/publish buttons disabled while busy.
- Destructive confirmation dialogs: unsubscribe (2-step) and delete alert rule (2-step) both implemented with `AlertDialog`.
- In-app channel is always-enabled and non-unchecked-able in `AlertRuleForm` (Checkbox line 298, `checked disabled`).
- Success publish: HITL `GenerateDigestButton` invalidates `digestKeys.all` on success (line 100), causing list to refresh.

**Finding — `DigestReader` footer omits `Unsubscribe` ghost link.**

Spec Surface 2 states: "Footer: 'Published Mon 15 Jun at 14:30 GST' (12px, `var(--ink-faint)`) + 'Unsubscribe' ghost link (end-aligned)". The `DigestReader.tsx` footer (lines 121-128) renders only the published timestamp — no Unsubscribe affordance. An analyst reading a digest in the reader view cannot unsubscribe without navigating back to the card list.

**Finding — `DigestsTab` in hub renders with `dossierId={undefined}`, permanently disabling subscribe.**

When `<DigestsTab />` is rendered from `IntelligencePage.tsx` (line 439) without `dossierId`, the `canSubscribeFromContext` flag is `false` (line 39) and the "Subscribe to digest" button is permanently `disabled`. The spec requires that the hub Digests tab show existing subscriptions and allow subscribing to new dossiers from the hub (Surface 3b: "compact 'Your subscriptions' strip" with manage links). The current hub offers no path to initiate a new subscription — it is a read-only view for the hub context.

**Finding — No `aria-label` on DrawerContent close button.**

`AlertRuleForm.tsx` and `DigestSubscribeDrawer.tsx` use `<DialogContent>` from the shadcn/ui Dialog primitive. The spec requires: close icon-button → `aria-label="Close"` (EN) / `"إغلاق"` (AR). The shadcn `DialogContent` renders a close button automatically but its `aria-label` depends on the library's i18n setup, not the spec's bilingual contract. No explicit `aria-label` override is applied in either drawer.

---

## Registry Safety

shadcn initialized (`frontend/components.json` confirmed). `@aceternity-pro` registry is declared in `components.json`. Zero Aceternity imports detected in any P70 component file. Per the spec's own declaration: "ZERO blocks used in this phase." No third-party registry blocks to audit.

Registry audit: 0 third-party blocks used, 0 flags.

---

## Files Audited

**New P70 components (primary audit scope):**

- `frontend/src/components/intelligence/DigestsTab.tsx`
- `frontend/src/components/intelligence/DigestCard.tsx`
- `frontend/src/components/intelligence/DigestReader.tsx`
- `frontend/src/components/intelligence/DigestSubscribeDrawer.tsx`
- `frontend/src/components/intelligence/GenerateDigestButton.tsx`
- `frontend/src/components/intelligence/AlertsTab.tsx`
- `frontend/src/components/intelligence/AlertRuleRow.tsx`
- `frontend/src/components/intelligence/AlertRuleForm.tsx`

**Modified files:**

- `frontend/src/pages/intelligence/IntelligencePage.tsx`
- `frontend/src/components/dossier/DossierTabNav.tsx`
- `frontend/src/components/dossier/DossierShell.tsx`
- `frontend/src/i18n/index.ts`

**i18n files:**

- `frontend/src/i18n/en/intelligence-digests.json`
- `frontend/src/i18n/ar/intelligence-digests.json`
- `frontend/src/i18n/en/intelligence-alerts.json`
- `frontend/src/i18n/ar/intelligence-alerts.json`

**Reference files:**

- `frontend/src/styles/list-pages.css` (`.tab` / `.tabs` CSS)
- `.planning/phases/70-digests-alerts/70-UI-SPEC.md`
- `frontend/components.json`
- Per-dossier digest routes (sample: `frontend/src/routes/_protected/dossiers/countries/$id/digests.tsx`)

# 97-POPULATIONS — the two closing derivations criterion 4 rests on

**Written by plan `97-03` (Wave 1), 2026-08-17, at HEAD `4cf27100e`. Single writer.**

This file DECIDES NOTHING. It is the evidence base `97-09`'s `97-NAV04-DECISIONS.md` cites per row.
Two populations rule Phase 97 (D-09), and both are derived here by instrument, with what falls
OUTSIDE each stated rather than assumed:

- **§1 the ROUTE population** — mechanical from `frontend/src/routeTree.gen.ts`.
- **§2 the INBOUND-LINK population** — `scripts/inbound-link-classify.mjs`, union of ten known
  forms plus a printed residual, every zero control-tested in the same run.

The lesson this document exists to obey is **population-definition blindness**: a correct command
returns a correct number about the wrong set. So each section says what is inside it, what is
outside it, and how its zeros were instrument-tested.

---

## §1 — the ROUTE population

### The command and its number

P95's instrument (`95-RESEARCH.md:679`), re-run this session:

```
$ sed -n '/interface FileRoutesByFullPath {/,/^}/p' frontend/src/routeTree.gen.ts | command grep -c "':"
203
```

**203 is today's reading, not a constant.** P95 pinned 202; `/calendar` landed in P96. The
classifier additionally reports `186 distinct after trailing-slash normalisation` — the generated
tree writes index routes twice-spelled (`/approvals/` and `/admin/`, `/dossiers/persons/` beside
`/dossiers/persons/$id/`), so the raw 203 counts spellings and the 186 counts destinations. Both
numbers are true; they answer different questions, and a consumer that swaps one for the other has
made the population error this document is about.

### D-08 stated explicitly

**This number moves this phase by design.** `97-11` deletes routes and the tree regenerates. No gate
anywhere in Phase 97 freezes 203 or 186. Every consumer either **re-derives it at run time** or
**states an expected delta**. `scripts/inbound-link-classify.mjs` re-derives it on every invocation
and prints it with that sentence attached; a caller that names a path no longer in the population
gets **exit 2 `UNABLE TO MEASURE`**, never a silent zero that reads as "no inbound links".

### INSIDE this population

Full route paths registered in the `FileRoutesByFullPath` interface of the generated route tree.

### OUTSIDE this population — the blind spots, stated

It reads `FileRoutesByFullPath` and therefore counts registered full paths and **NOT**:

- lazy children invisible to that interface;
- redirect targets that have no file of their own;
- routes reachable only through search-param state (`?dossier=<id>&dossierType=<type>` is a
  `validateSearch` whitelist on `_protected.tsx`, not a route path);
- anything outside `frontend/src` — the Express API surface is a different population entirely.

### The ADMIN sub-population, and the delta

```
$ sed -n '/interface FileRoutesByFullPath {/,/^}/p' frontend/src/routeTree.gen.ts \
    | command grep -o "'/admin[^']*'" | sort -u
'/admin/'
'/admin/ai-settings'
'/admin/ai-usage'
'/admin/approvals'
'/admin/data-retention'
'/admin/field-permissions'
'/admin/preview-layouts'
'/admin/system'
```

**Eight.** `REQUIREMENTS.md:135` says _"9 admin routes plus `/monitoring`"_.

> **delta −1 versus the register's 9, stated not absorbed.**

The eighth member is **`/admin/`** — the redirect-only index at
`frontend/src/routes/_protected/admin/index.tsx:6`, which `redirect({ to: '/admin/ai-settings' })`
and renders no page of its own. Naming it is the point: a reader counting "admin pages" would say
**seven**, a reader counting registered paths says **eight**, and the register says **nine**. One
plausible origin of the nine is that it counted the eight admin paths _plus_ `/monitoring` and then
wrote "plus `/monitoring`" as well — but that is a **hypothesis, not a derivation**, and this
document does not resolve it. `97-09`'s table records the delta on its own row rather than picking a
number.

**The candidate set criterion 4 operates on is therefore NINE:** the eight admin paths above plus
`/monitoring`.

---

## §2 — the INBOUND-LINK population

### The command and its full output

```
$ node scripts/inbound-link-classify.mjs --paths /admin/,/admin/ai-settings,/admin/ai-usage,\
/admin/approvals,/admin/data-retention,/admin/field-permissions,/admin/preview-layouts,\
/admin/system,/monitoring
```

Exit code **0**. Full output, pasted, nothing elided:

```
INBOUND-LINK CLASSIFICATION
route tree:  /Users/khalidalzahrani/Desktop/CodingSpace/Intl-Dossier-V2.0/frontend/src/routeTree.gen.ts
search root: /Users/khalidalzahrani/Desktop/CodingSpace/Intl-Dossier-V2.0/frontend/src (1554 .ts/.tsx files)
ROUTE population: 203 full paths in FileRoutesByFullPath (186 distinct after trailing-slash normalisation) — derived at run time, never frozen: this phase deletes routes by design (D-08).
reported: 9 path(s)

POPULATION DEFINITION: quoted route-shaped strings in frontend/src *.ts/*.tsx, excluding routeTree.gen.ts and **/__tests__/**, resolved to a route in the population by full-path boundary match. OUTSIDE IT: computed paths via getDossierDetailPath / getDossierRouteSegment (33 files), template-literal to={} props whose path is assembled at runtime, runtime-built strings passed through variables, redirects held in server data, useRecentNavigation (a replay of visited paths — derivative, not an origin), e2e page.goto (not a product link), and UNQUOTED route-shaped text — regex literals over paths (CommandPalette.tsx:283 pattern: /^\/admin/) and JSDoc "Route: /x" banners are invisible to the quoted-string extractor, which is correct for both but is a stated blind spot, not a proof of absence.
FLOOR: every inbound-link count below is a FLOOR, never a total — a syntactic sweep under-counts behaviour classes (TRIGSWEEP-01), and the forms above are a union of the KNOWN ten plus a printed residual, not a proof of completeness.
CEILING: an inbound-link count is a FLOOR for the ABSENCE claim and a CEILING for the PRESENCE claim. A zero may under-count (a link form was missed); a non-zero may over-count (the linking file may itself never be mounted). /monitoring is the in-repo proof of the second half — its only link lives in a tree mounted by one demo route — and it is why --dead exists.
LIVE means "in the rendered tree by file location, and not classified otherwise". It does NOT mean "proven to be mounted": a link inside a component that nothing renders is LIVE under this instrument. The closed set of RENDERED classes is LIVE / NON-RENDERED (demo-only) / NON-RENDERED (dead module).

route                                    LIVE  forms
---------------------------------------- ----  -----
/admin                                      0  (none)
/admin/ai-settings                          2  nav data (path:)×1, redirect ({ to: })×1
/admin/ai-usage                             0  (none)
/admin/approvals                            0  (none)
/admin/data-retention                       1  nav data (path:)×1
/admin/field-permissions                    1  nav data (path:)×1
/admin/preview-layouts                      0  (none)
/admin/system                               1  nav data (path:)×1
/monitoring                                 0  (none)

LIVE inbound links, one line each:
  /admin/ai-settings           frontend/src/components/layout/navigation-config.ts:178  [nav data (path:)]  /admin/ai-settings
  /admin/system                frontend/src/components/layout/navigation-config.ts:184  [nav data (path:)]  /admin/system
  /admin/field-permissions     frontend/src/components/layout/navigation-config.ts:196  [nav data (path:)]  /admin/field-permissions
  /admin/data-retention        frontend/src/components/layout/navigation-config.ts:208  [nav data (path:)]  /admin/data-retention
  /admin/ai-settings           frontend/src/routes/_protected/admin/index.tsx:6  [redirect ({ to: })]  /admin/ai-settings

NON-RENDERED hits (2) — NOT counted as inbound links:
  /monitoring                  NON-RENDERED (demo-only)  frontend/src/components/modern-nav/navigationData.ts:262  [nav data (path:)]
  /admin                       NON-RENDERED (demo-only)  frontend/src/components/modern-nav/navigationData.ts:314  [nav data (path:)]

NAV-CONFIG ENTRY: /admin NONE
NAV-CONFIG ENTRY: /admin/ai-settings frontend/src/components/layout/navigation-config.ts:178
NAV-CONFIG ENTRY: /admin/ai-usage NONE
NAV-CONFIG ENTRY: /admin/approvals NONE
NAV-CONFIG ENTRY: /admin/data-retention frontend/src/components/layout/navigation-config.ts:208
NAV-CONFIG ENTRY: /admin/field-permissions frontend/src/components/layout/navigation-config.ts:196
NAV-CONFIG ENTRY: /admin/preview-layouts NONE
NAV-CONFIG ENTRY: /admin/system frontend/src/components/layout/navigation-config.ts:184
NAV-CONFIG ENTRY: /monitoring NONE

RESIDUAL (0) — hand-classify each; every one is listed and none is assumed to be a non-link:
  (none — and this is the run that shows it)

PINS (a broken pin is exit 1, never a smaller number quietly reported):
  ok       control  /admin/ai-settings is known-linked (navigation-config.ts)
      2 LIVE inbound link(s): frontend/src/components/layout/navigation-config.ts:178, frontend/src/routes/_protected/admin/index.tsx:6
  ok       boundary /admin/approvals vs /approvals resolve to DIFFERENT counts
      /admin/approvals=0 vs /approvals=1 — the boundary matcher is doing work
  ok       demo     navigationData.ts /monitoring entry is NON-RENDERED (demo-only)
      frontend/src/components/modern-nav/navigationData.ts:262 [nav data (path:)]
```

Note `/admin/` is reported as `/admin`: the instrument normalises the generated tree's trailing
slash so a caller may query either spelling.

### The residual, hand-classified — every line, none assumed

The nine-candidate run printed **RESIDUAL (0)**. That is a real zero and not an unrun instrument:
the same binary printed **RESIDUAL (1)** on the three-path control query in the same session, which
is the proof the residual channel emits when there is something to emit.

```
$ node scripts/inbound-link-classify.mjs --paths /admin/ai-settings,/admin/approvals,/approvals
RESIDUAL (1) — hand-classify each; every one is listed and none is assumed to be a non-link:
  frontend/src/routes/_protected/positions/$id.tsx:49  [LIVE]  /approvals  <- /approvals
      const activeTab = childMatches.some((match) => match.routeId.endsWith('/approvals'))
```

Hand-classification, one line each:

| #   | file:line                                             | verdict          | why                                                                                                                                                                                                                                            |
| --- | ----------------------------------------------------- | ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R1  | `frontend/src/routes/_protected/positions/$id.tsx:49` | **`not-a-link`** | A `routeId.endsWith('/approvals')` tab-state predicate over the CURRENT match, matching `/positions/$id/approvals`. It reads location, it does not originate navigation, and its subject is a different route from the top-level `/approvals`. |

The two `NON-RENDERED` hits printed by the nine-candidate run are hand-classified on the same terms
— they were classified by the instrument, so no verdict is being invented here, only recorded:

| #   | file:line                                                  | verdict            | why                                                                                                                                                                      |
| --- | ---------------------------------------------------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| N1  | `frontend/src/components/modern-nav/navigationData.ts:262` | **`non-rendered`** | The `/monitoring` entry. Mounted only by `routes/modern-nav-standalone.tsx`; P95 left it deliberately as P97 scope (`95-DEAD-04-DECISION.md` §"what Phase 97 inherits"). |
| N2  | `frontend/src/components/modern-nav/navigationData.ts:314` | **`non-rendered`** | The `/admin` entry, same demo-only tree.                                                                                                                                 |

**Closed-vocabulary check on the residual verdicts** — `link` / `not-a-link` / `non-rendered` /
`needs-execution-recheck`: **complete for this instrument's population.** The search root excludes
`**/__tests__/**` and everything outside `frontend/src`, so an e2e `page.goto` can never surface as
a residual needing an "out-of-population" term, and a link inside an unmounted file is covered by
`non-rendered`. No residual in this run needed a fifth term. **No candidate is
`needs-execution-recheck`** — every one of the nine resolved statically.

### The blind spots, verbatim from the instrument's own POPULATION DEFINITION line

Quoted from the run above so the document and the tool cannot drift:

> OUTSIDE IT: computed paths via getDossierDetailPath / getDossierRouteSegment (33 files),
> template-literal to={} props whose path is assembled at runtime, runtime-built strings passed
> through variables, redirects held in server data, useRecentNavigation (a replay of visited paths —
> derivative, not an origin), e2e page.goto (not a product link), and UNQUOTED route-shaped text —
> regex literals over paths (CommandPalette.tsx:283 pattern: /^\/admin/) and JSDoc "Route: /x"
> banners are invisible to the quoted-string extractor, which is correct for both but is a stated
> blind spot, not a proof of absence.

### FLOOR and CEILING, both restated

- **FLOOR** — every count above is a floor, never a total. A syntactic sweep under-counts behaviour
  classes (TRIGSWEEP-01); the ten forms are a union of the KNOWN, plus a printed residual, not a
  proof of completeness.
- **CEILING** — an inbound-link count is a FLOOR for the ABSENCE claim and a **CEILING for the
  PRESENCE claim**. A zero may under-count (a link form was missed); a non-zero may over-count (the
  linking file may itself never be mounted).
- **`LIVE` means "in the rendered tree by file location, and not classified otherwise" — never
  "proven to be mounted".** A link inside a component that nothing renders is `LIVE` under this
  instrument. `/monitoring` is the in-repo proof of the second half: its only link lives in a tree
  mounted by one demo route, which is why `--dead` exists and why `97-09` may not read a `LIVE`
  non-zero as a reachability guarantee without a click-through (D-10).

### The control result, recorded explicitly

> **`/admin/ai-settings` resolved 2 LIVE inbound links in the SAME RUN as every zero reported
> above** — `components/layout/navigation-config.ts:178` (nav data) and
> `routes/_protected/admin/index.tsx:6` (redirect). The instrument fails with **exit 1** if that
> control ever resolves zero, so a zero in this table can never be cited without its control having
> passed.

The boundary pin passed in the same run: `/admin/approvals=0` vs `/approvals=1`. The two are
different routes and the matcher proves it — `navigation-config.ts:212-217` carries an item whose
**id** is `admin-approvals` but whose **path** is the TOP-LEVEL `/approvals`. A substring sweep
would have reported `/admin/approvals` as linked when it is not.

### §2c — second, independent instrument test of the five zeros

The pinned control proves the classifier still sees links. A raw substring sweep (separate code
path: plain `String.includes`, no forms, no boundary rule) proves the classifier is not _hiding_
one. Run over the same file set with `/admin/ai-settings` as its own control:

| path                               | raw hits | what they are                                                                                                                                                                                                                                                                                                                            | zero real? |
| ---------------------------------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| `/admin/ai-usage`                  | 2        | `ai-usage.tsx:2` JSDoc banner + `:44` `createFileRoute` — both self-declarations                                                                                                                                                                                                                                                         | **yes**    |
| `/admin/approvals`                 | 2        | `approvals.tsx:2` JSDoc + `:39` `createFileRoute`                                                                                                                                                                                                                                                                                        | **yes**    |
| `/admin/preview-layouts`           | 2        | `preview-layouts.tsx:2` JSDoc + `:95` `createFileRoute`                                                                                                                                                                                                                                                                                  | **yes**    |
| `/monitoring`                      | 8        | `navigationData.ts:262` (demo-only), `pages/monitoring/Dashboard.tsx` ×5 (prose + two `/api/monitoring/*` calls — a different population), `routes/_protected/monitoring.tsx` ×2 (self-declaration)                                                                                                                                      | **yes**    |
| `/admin`                           | 29       | `CommandPalette.tsx:283` `pattern: /^\/admin/` (a section predicate, not a link), `navigationData.ts:314` (demo-only), four `navigation-config.ts` entries for _deeper_ admin paths, `i18n/index.ts` ×2 (`./en/admin.json`, not a route), `services/auth.ts` ×3 (`/api/admin/users`, a different population), the rest self-declarations | **yes**    |
| `/admin/ai-settings` **(CONTROL)** | 4        | includes `navigation-config.ts:178` — **the sweep sees links**                                                                                                                                                                                                                                                                           | n/a        |

No hit in any zero row is an inbound link the classifier missed. The zeros survive both instrument
tests.

---

## §2b — LIVE NAV STATE, per candidate

**Measured at HEAD `4cf27100e`, re-derived — not copied forward from the plan's line numbers.**

```
NAV-CONFIG ENTRY: /admin NONE
NAV-CONFIG ENTRY: /admin/ai-settings frontend/src/components/layout/navigation-config.ts:178
NAV-CONFIG ENTRY: /admin/ai-usage NONE
NAV-CONFIG ENTRY: /admin/approvals NONE
NAV-CONFIG ENTRY: /admin/data-retention frontend/src/components/layout/navigation-config.ts:208
NAV-CONFIG ENTRY: /admin/field-permissions frontend/src/components/layout/navigation-config.ts:196
NAV-CONFIG ENTRY: /admin/preview-layouts NONE
NAV-CONFIG ENTRY: /admin/system frontend/src/components/layout/navigation-config.ts:184
NAV-CONFIG ENTRY: /monitoring NONE
```

| candidate                  | live sidebar row? | `navigation-config.ts` |
| -------------------------- | ----------------- | ---------------------- |
| `/admin/ai-settings`       | **yes**           | `:178`                 |
| `/admin/system`            | **yes**           | `:184`                 |
| `/admin/field-permissions` | **yes**           | `:196`                 |
| `/admin/data-retention`    | **yes**           | `:208`                 |
| `/admin/` (→ `/admin`)     | no                | NONE                   |
| `/admin/ai-usage`          | no                | NONE                   |
| `/admin/approvals`         | no                | NONE                   |
| `/admin/preview-layouts`   | no                | NONE                   |
| `/monitoring`              | no                | NONE                   |

**FOUR of the nine candidates ALREADY have a live sidebar row. Five do not.**

> **"Candidate" here means "named by criterion 4" — it does NOT mean "measured to have no inbound
> link".** The two sets differ by exactly those four rows. Reading the first as the second is the
> population-definition error this whole document exists to prevent, and its concrete cost would be
> `97-10` adding four duplicate sidebar entries for routes that already have one.

Note also that `/admin/ai-settings`'s second inbound link is the `/admin/` index redirect. So
`/admin` is reachable _through_ its own redirect target's row, and the nav-config `NONE` on the
`/admin` row is not by itself an argument for adding an entry — `97-09` decides, not this file.

---

## §3 — what this document does NOT decide

**No route is disposed of here.** `97-09`'s `97-NAV04-DECISIONS.md` is the single writer of every
per-route decision (nav entry / delete / owned-elsewhere-untouched / NOT-CHECKED, with the why and
the named owner). This file is only the evidence those rows cite. Nothing here should be read as a
recommendation; a zero is a measurement, and the disposal of a zero is a judgement `97-09` makes.

**Intended-broken exclusions, named so nobody reads them into the evidence**
(`ACCEPTANCE-P97-PLAN.md` condition 8):

- **`/delegations` — OWNED ELSEWHERE (Phase 102), untouched.** Not a candidate, not swept, not
  decided here.
- **The legal-holds region — OWNED ELSEWHERE (Phase 100), untouched.** A nav or deletion decision
  that repairs, removes, or re-homes any legal-hold surface is a REJECT.
- **The `/engagements` double-mount is intentional** — a reachability sweep must not "fix" it.
- **`scenario-sandbox` and `responsive-demo` are kept deliberately** — route-namespace hygiene
  already ruled on them; they are not unowned routes.

Also outside this file's own scope, stated so a reader does not expect it here: the
`services/auth.ts` and `QuickNavigationMenu.tsx` **zero-importer** derivations. Those are
module-import zeros, a different instrument from this link sweep, and `97-11` re-runs them against a
known-imported control at execution (D-07).

POPULATIONS-RECORD-END

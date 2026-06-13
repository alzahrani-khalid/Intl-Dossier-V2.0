# Phase 67: Per-Type Engagement Contracts & Legacy Detail Cleanup - Research

**Researched:** 2026-06-13
**Domain:** React 19 + TanStack Query frontend contracts over Supabase (PostgREST + RPC + RLS); dead-code elimination with import-graph verification
**Confidence:** HIGH (all claims verified against repo source, migrations, and orchestrator-provided live staging facts)

## Summary

Phase 67 closes the last v6.6 backlog slice: making the org/person/EO Engagements tabs honest about what they show (PERENG-01/02), and deleting the dead legacy `*DossierDetail` plane (PERENG-03).

**The data-plane finding that shapes everything:** there are TWO candidate per-type engagement linkages, and they are not equal. `person_engagements` is **legacy-dead** — its FK points at the legacy `engagements` table (not `engagement_dossiers`), it has 0 rows, zero writers anywhere in the stack, and exactly one reader (`get_person_full.recent_engagements`, whose output renders only on the live `/persons/$personId` page and is always empty). `engagement_participants` is **canonical** — FK → `engagement_dossiers(id)`, `participant_dossier_id` → `dossiers.id` covering person/organization/country, permissive SELECT RLS, a full CRUD edge API (`/engagement-dossiers/:id/participants`), a live renderer (engagement workspace OverviewTab), and a live writer (the engagement wizard's participants step) — except the wizard's client-side insert **omits `created_by` and is silently RLS-denied** (a latent bug this phase should fix as part of "wiring"). `host_organization_id` exists on `engagement_dossiers`, is accepted by the `engagement-dossiers` edge create, is already KPI-tallied by `useOrganizations`, but has **no UI write path** (the wizard schema has no host field) and is NULL on all 3 staging rows.

**The cleanup finding:** the legacy detail plane is a fully closed dead graph — 6 `*DossierDetail` components + 6 `*DossierPage` wrappers + `EngagementDetailPage.tsx` (812 lines) + the entire `components/dossier/sections/` directory (19 files) + 7 transitively-orphaned leaf components — with zero external importers, zero test references, and zero barrel exports (except `DossierDetailLayout`, which is barrel API). Deleting it kills the raw-key i18n debt with it; every surviving surface uses registered namespaces.

**Primary recommendation:** Adopt the **canonical participation contract**: extend `DossierEngagementsTab` with (a) an `engagement_participants` reverse-lookup branch (serves person, EO, org, country) and (b) a `host_organization_id` branch for orgs; fix the wizard participants RLS bug; repoint `get_person_full.recent_engagements` to the canonical plane via migration; delete the dead chain leaf-first with grep gates. Never read or write `person_engagements` from new code (mirrors the ENGPOS-01 legacy-plane precedent).

<phase_requirements>

## Phase Requirements

| ID        | Description                                                                                                                     | Research Support                                                                                                                                                                                                                                                                          |
| --------- | ------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| PERENG-01 | Organization dossiers' Engagements tab honors `engagement_dossiers.host_organization_id` (or documented generic history-only)   | §PERENG-01 Decision Space — host column verified readable under permissive SELECT RLS; KPI tally already exists in `useOrganizations.ts`; tab read branch + orchestrator seed = verifiable; no UI writer exists (wizard schema has no host field)                                         |
| PERENG-02 | Person/EO Engagements tab shows engagement participation per chosen contract, incl. `get_person_full.recent_engagements` wiring | §PERENG-02 Decision Space — `person_engagements` proven legacy-dead (FK→legacy `engagements`, 0 rows, 0 writers); canonical replacement `engagement_participants` has live API + renderer; RPC repoint sketch provided preserving the `{link, engagement}` shape PersonDetailPage renders |
| PERENG-03 | Legacy unrouted `*DossierDetail` components routed or deleted; raw-key i18n debt cleared on survivors                           | §PERENG-03 Inventory — complete import-graph census: 13 root files + 19 sections + 7 transitive orphans, all with zero external importers; per-component disposition table with deletion order                                                                                            |

</phase_requirements>

## Verified Live Staging Facts (orchestrator ground truth, 2026-06-13 — do NOT re-derive)

- `engagement_dossiers`: 3 rows total; `host_organization_id` NULL on ALL rows; `host_country_id` NULL on ALL rows [VERIFIED: orchestrator live SQL]
- `person_engagements`: 0 rows [VERIFIED: orchestrator live SQL]
- `dossiers`: 12 person, 0 elected_official, 4 organization [VERIFIED: orchestrator live SQL]
- EO = `person_subtype` on `persons` (merge migration `20260202000001`), NOT a dossiers.type value [VERIFIED: migration + ground truth]
- `organizations/index.tsx` host_organization_id gap: **already fixed** — `useOrganizations.ts` L71-96 tallies `engagement_dossiers.host_organization_id` (reads 0 today because all NULL) [VERIFIED: codebase read]
- `v_country_engagement_metrics` keys the LEGACY country system — unusable [VERIFIED: orchestrator note + project memory]

## Project Constraints (from CLAUDE.md)

- Stay within current stack (React 19, TanStack, Supabase, Tailwind v4) — no new frameworks; component primitives via HeroUI v3/Radix only; Aceternity/Kibo/shadcn-defaults banned
- All colors via design tokens; borders `1px solid var(--line)`; no card shadows; row heights `var(--row-h)`; radii from `--radius-*`
- Logical properties only (`ms-*`, `ps-*`, `text-start`); `dir={isRTL ? 'rtl' : 'ltr'}`; no emoji in copy; no marketing voice; dates `formatDayFirst` (day-first)
- ESLint: explicit return types, no `any`, no floating promises, strict-boolean-expressions, `--max-warnings 0` whole-repo in CI; per-directory filename case (components/\*\* = PascalCase)
- Prettier: no semicolons, single quotes, 100 print width
- Migrations via Supabase MCP (orchestrator action — executors have no MCP)
- Backwards compatibility: no regressions; AR + EN must both work after every change
- Work through GSD commands; testing per repo Vitest/Playwright stack; 80% coverage target on new logic
- Bundle Size Check is a REQUIRED CI gate (`frontend/.size-limit.json`); deletions help, additions must stay within budgets

## Architectural Responsibility Map

| Capability                                   | Primary Tier                                         | Secondary Tier                                                                                      | Rationale                                                                    |
| -------------------------------------------- | ---------------------------------------------------- | --------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| Per-type Engagements tab read contract       | Frontend (tab component + per-tab query)             | Database (permissive SELECT RLS verified)                                                           | Client-side PostgREST reads, same pattern as `fetchDossierOverview` sections |
| Host/participation branch queries            | Frontend service layer                               | Database (indexes exist: `idx_engagement_dossiers_host_org`, `idx_engagement_participants_dossier`) | Two extra `.eq()/.in()` PostgREST queries; no RPC needed                     |
| `get_person_full.recent_engagements` repoint | Database (RPC migration, SECURITY DEFINER preserved) | Edge (`persons` fn — NO redeploy needed; calls RPC by name)                                         | SQL-only change; consumer shape preserved                                    |
| Wizard participants write fix                | Frontend (`engagement.config.ts` postCreate)         | Database RLS (`created_by = auth.uid()` WITH CHECK)                                                 | One-line insert payload fix                                                  |
| Legacy component deletion                    | Frontend only                                        | —                                                                                                   | No runtime state; pure dead code                                             |
| Live verification (seeds + browser)          | Orchestrator (Supabase MCP + agent-browser)          | Executor (service-role REST probes via `.env.test`, per 65-03 precedent)                            | Executors lack MCP/browser; REST probes are executor-runnable                |

## Standard Stack

### Core (no new packages — everything needed is in the repo)

| Library                         | Version        | Purpose                          | Why Standard                                                                         |
| ------------------------------- | -------------- | -------------------------------- | ------------------------------------------------------------------------------------ |
| @tanstack/react-query           | v5 (installed) | Per-tab query keys, invalidation | Existing pattern (`['dossier-tab', 'engagements', dossierId]`)                       |
| @supabase/supabase-js           | installed      | Client PostgREST reads           | All overview/tab fetchers use it                                                     |
| react-i18next                   | installed      | EN/AR strings                    | Registered namespaces: `dossier-shell`, `dossier-overview`, `engagements`, `persons` |
| vitest + @testing-library/react | installed      | Unit tests                       | `DossierEngagementsTab.test.tsx` already exists to extend                            |

**Installation:** none — this phase adds zero dependencies.

## Package Legitimacy Audit

No external packages are installed by this phase. Audit not applicable.

**Packages removed due to slopcheck [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** none

## Current State Inventory (what each surface reads TODAY)

### The three per-type Engagements tab routes (all identical, all generic)

`routes/_protected/dossiers/{organizations,persons,elected-officials}/$id/engagements.tsx` each lazy+Suspense-mount the shared `components/dossier/tabs/DossierEngagementsTab.tsx` (the canonical tab pattern from quick 260605-s32, mirrored by 65-01). The tab is registered in `DossierTabNav.tsx` `BASE_DOSSIER_TABS` for every dossier type. [VERIFIED: codebase read]

### What `DossierEngagementsTab` reads

`fetchDossierOverview({ include_sections: ['related_dossiers', 'calendar_events'] })`:

- `related_dossiers` = `dossier_relationships` both directions, bucketed `by_dossier_type.engagement` — only shows engagements explicitly linked via relationship rows
- `calendar_events.past` = `calendar_entries WHERE dossier_id = <this dossier>` windowed **-7/+30 days by default** — so "past events" is only the trailing 7 days
- **OVRERR-01 gap:** the tab destructures `{ data, isLoading }` without `isError` — a failed query renders the trustworthy-looking "No engagements yet" empty state, the exact anti-pattern Phase 66 eliminated from overview cards. New work must add the Phase 66 section-error contract (role="alert", bilingual copy). [VERIFIED: codebase read]

It reads **neither** `host_organization_id` **nor** any participation table. An org hosting an engagement, or a person participating in one, shows nothing here today.

### The two data planes

|                 | `engagement_participants` (CANONICAL)                                                                                                                                                     | `person_engagements` (LEGACY-DEAD)                      |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| FK target       | `engagement_dossiers(id)` ✓ canonical plane                                                                                                                                               | `engagements(id)` ✗ legacy table                        |
| Participant ref | `participant_dossier_id → dossiers.id` (person/org/country/external)                                                                                                                      | `person_id → persons.id` only                           |
| SELECT RLS      | Permissive (any non-archived engagement)                                                                                                                                                  | Permissive (non-archived person)                        |
| INSERT RLS      | `WITH CHECK (created_by = auth.uid())`                                                                                                                                                    | same                                                    |
| Writers         | Wizard postCreate (`engagement.config.ts` — **RLS-broken, see Pitfall 1**); edge `addParticipant` (sets `created_by` correctly — but `useAddEngagementParticipant` has ZERO UI consumers) | **none anywhere** (frontend, edge, backend all grepped) |
| Readers         | Workspace OverviewTab + ContextTab via `/engagement-dossiers/:id/participants`; `get_engagement_full.participants`                                                                        | `get_person_full.recent_engagements` only               |
| Staging rows    | unknown — Open Question Q1                                                                                                                                                                | 0 [VERIFIED: orchestrator]                              |

### `get_person_full.recent_engagements` chain

`supabase/migrations/20260202000001` L512-521: joins `person_engagements pe JOIN engagements e ON e.id = pe.engagement_id` → emits `[{ link: <pe row>, engagement: <e row> }]`. Consumed by the `persons` edge fn (no redeploy needed on RPC change) → `domains/persons` repository (`apiGet('/persons/${id}')`, edge base) → rendered ONLY by the live routed `pages/persons/PersonDetailPage.tsx` (route `/_protected/persons/$personId`) L673-697, which reads `eng.engagement.name_en/name_ar`, `eng.engagement.engagement_type`, `eng.link.role`. With 0 rows and no writer, this section has never rendered. The dossier-plane person routes (`/dossiers/persons/$id/*`) do NOT use `get_person_full` — they use `DossierShell` + shared tabs. [VERIFIED: codebase read]

### EO route resolution

`/dossiers/elected-officials/$id` mounts `DossierShell dossierType="elected_official"` (routing label only — "The underlying dossier record has type='person' in the database", per the route file comment) with one extra tab (`committees`). Its Engagements tab is the same generic `DossierEngagementsTab`. The Express backend `elected-officials.ts` also resolves via `get_person_full`. **Any person-branch fix automatically covers EO.** [VERIFIED: codebase read]

### Engagement create paths (who could write `host_organization_id`)

1. **Wizard** (`dossiers-create` edge): `engagement.config.ts filterExtensionData` sends only `engagement_type`, `engagement_category`, `location_en/ar`, `start_date`, `end_date`. **No host fields exist anywhere in the wizard schema/steps** (grep for "host" in `wizard/` matches only "ghost" button variants). Participants go to `engagement_participants` via `postCreate`. [VERIFIED]
2. **`engagement-dossiers` edge create** accepts `ext.host_organization_id`/`host_country_id` — but `createEngagement` from `domains/engagements` has **zero UI callers** (only a docstring example). [VERIFIED]
3. **Intake promotion** path inserts extension without host fields. [VERIFIED]

Conclusion: `host_organization_id` is write-reachable only via API, never via UI.

## PERENG-01 Decision Space — Recommendation: WIRE THE READ, with evidence

| Option                                                       | Honesty                                                                                                                                       | Cost                                                    | Verdict                                   |
| ------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------- | ----------------------------------------- |
| A. Document "generic history-only"                           | Honest but perpetuates the KPI-vs-tab inconsistency flagged in 260607-j2e (org list KPI counts host rows; tab ignores them)                   | ~0                                                      | Acceptable fallback                       |
| B. Tab reads `host_organization_id` (+ participation branch) | Honest AND consistent: KPI tally (already shipped in `useOrganizations`) and tab read the same column; SELECT RLS is permissive; index exists | 1 PostgREST query + merge + i18n keys                   | **RECOMMENDED**                           |
| C. B + add host-org picker to wizard                         | Completes the write loop                                                                                                                      | Wizard schema/step/i18n changes + `filterExtensionData` | Optional scope — planner/discuss decision |

**Recommendation: Option B as the requirement floor, C at planner discretion.** Success criterion 1 ("an organization dossier with a host_organization_id engagement shows it on its Engagements tab") is satisfiable and live-verifiable via an orchestrator seed (one `UPDATE` on a staging row — exact SQL in §Live Verification Protocol). The criterion does not require a UI writer. If discuss-phase chooses Option A instead, the deliverable is a documented contract (code comment on the tab + tab description honesty) — also implementable.

What writes the column if C is chosen: add optional `host_organization_id` (and optionally `host_country_id`) to `engagement.schema.ts` + `EngagementDetailsStep` (a `DossierSelector` filtered to organization type) + `filterExtensionData`. The `dossiers-create` edge spreads `extensionData` generically (verified L313-318), so no edge change is needed.

## PERENG-02 Decision Space — Recommendation: CANONICAL PARTICIPATION + RPC REPOINT

**Do not wire `person_engagements`.** Evidence: FK → legacy `engagements` table (the plane the ENGPOS-01 decision deprecated: "never read or written by new code"), 0 rows, no writer in frontend/edge/backend, and seeding it for verification would require inserting into the legacy `engagements` table too. Wiring it would resurrect the legacy plane Phase 65 just fenced off.

**The chosen contract (recommended):** person/EO engagement participation = `engagement_participants WHERE participant_dossier_id = <person dossier id>`. Concretely, "wiring" means:

1. **Tab branch (shared with PERENG-01):** add a participation fetch to `DossierEngagementsTab` (or a small service helper next to `dossier-overview.service.ts`): reverse-lookup `engagement_participants` by `participant_dossier_id`, join engagement names via a second `.in('id', engagementIds)` query on `dossiers` (PostgREST embed `engagement:engagement_id(...)` resolves to `engagement_dossiers`, which has no names — names live on `dossiers`; mirror the `useCountries`/`useForums` extension-merge pattern). Render rows with `engagements:participantRoles.*` badges (keys exist en+ar, namespace registered).
2. **RPC repoint (the "get_person_full.recent_engagements wiring" named by the requirement):** migration replacing the `recent_engagements` sub-select to read `engagement_participants ep JOIN engagement_dossiers ed ON ed.id = ep.engagement_id JOIN dossiers d ON d.id = ed.id`, emitting the SAME `{link, engagement}` shape (`link` = ep row incl. `role`; `engagement` = `{id, name_en, name_ar, engagement_type: ed.engagement_type}`) so `PersonDetailPage` L673-697 renders unchanged. Preserve SECURITY DEFINER + existing grants (project memory: `get_person_full` is DEFINER — that is why person detail works under org-isolation RLS). Cast any varchar → `::text` if the RPC declares text returns (recurring 42804 class). Orchestrator applies via Supabase MCP; the `persons` edge fn needs **no redeploy** (calls the RPC by name).
3. **Write-path fix (Pitfall 1):** add `created_by` to the wizard `postCreate` insert so participation rows actually accrue. Without this, the contract is honest but permanently empty for wizard-created engagements.
4. **Leave `person_engagements` untouched** in the DB (no destructive migration this phase) but record it as legacy-dead; optionally add a source-comment deprecation in the persons entity migration is NOT possible (migrations are immutable) — record the decision in the SUMMARY instead, mirroring the 65-03 deprecation-record pattern.

**Success-criterion reinterpretation to surface at discuss/plan:** criterion 2 literally says "person/EO dossier with `person_engagements` rows" — under the recommended contract this becomes "with `engagement_participants` rows". The requirement text itself authorizes this ("per the chosen contract"). If the user insists on literal `person_engagements`, the implementation inverts: tab reads `person_engagements` joined to legacy `engagements`, and seeds must create legacy `engagements` rows — flag the architectural cost explicitly.

**EO specifics:** 0 EO dossiers at type level is expected (EO = `person_subtype`). The EO tab inherits the person branch automatically. Live verification needs a person dossier whose `persons.person_subtype = 'elected_official'` (count unknown — Open Question Q2); if none exists, the EO leg is verified code-identical to person (same component, same query) plus an optional orchestrator subtype flip on a seed person.

## PERENG-03 Inventory — Complete Census & Disposition

Import-graph verified by grep on 2026-06-13 (zero external importers means: not imported by any non-dead file, no `*.test.*` references — the lone test grep hit `TypeCardErrorStates.test.tsx` is a false positive on similarly-named overview CARDS — and no barrel exports unless noted).

### Root dead chain — DELETE (13 files, ~3,700 lines)

| File                                                                                   | Lines      | Only importer           | Notes                                                                            |
| -------------------------------------------------------------------------------------- | ---------- | ----------------------- | -------------------------------------------------------------------------------- |
| `components/dossier/CountryDossierDetail.tsx`                                          | 257        | CountryDossierPage      |                                                                                  |
| `components/dossier/ForumDossierDetail.tsx`                                            | 447        | ForumDossierPage        |                                                                                  |
| `components/dossier/OrganizationDossierDetail.tsx`                                     | 295        | OrganizationDossierPage |                                                                                  |
| `components/dossier/PersonDossierDetail.tsx`                                           | 240        | PersonDossierPage       | Contains the EO sections (raw-key i18n debt dies here)                           |
| `components/dossier/TopicDossierDetail.tsx`                                            | 527        | TopicDossierPage        |                                                                                  |
| `components/dossier/WorkingGroupDossierDetail.tsx`                                     | 110        | WorkingGroupDossierPage |                                                                                  |
| `pages/dossiers/{Country,Forum,Organization,Person,Topic,WorkingGroup}DossierPage.tsx` | 24-41 each | **nothing**             | Routed overview tabs import `*OverviewTab`, NOT these wrappers                   |
| `pages/engagements/EngagementDetailPage.tsx`                                           | 812        | **nothing**             | 65-03's recorded dead-code candidate; routed engagement surface is the workspace |

### `components/dossier/sections/` — DELETE ALL 19 files

Every section's only importers are the dead chain. Four (`EngagementInformation`, `FollowUpActions`, `OutcomesSummary`, `ParticipantsList`) are ALREADY fully orphaned (their importer `EngagementDossierDetail` was deleted in 65-03). The rest: `CommitteeAssignments`, `ContactPreferencesSection`, `DecisionLogs`, `DeliverablesTracker`, `ElectedOfficialProfile`, `InstitutionalProfile`, `InteractionHistory`, `MeetingSchedule`, `MemberOrganizations`, `OrgHierarchy`, `OrganizationAffiliations`, `PositionsHeld`, `ProfessionalProfile`, `StaffDirectory`, `TermHistory`. [VERIFIED: per-file importer grep]

### Transitive orphans created by the root deletion — DELETE (verify with execution-time grep first, per 65-03 discipline)

| File                                                 | Sole importer(s) (all dead)                             |
| ---------------------------------------------------- | ------------------------------------------------------- |
| `components/dossier/CollapsibleSection.tsx`          | Person/Topic/WorkingGroup details (NOT barrel-exported) |
| `components/timeline/CountryTimeline.tsx`            | CountryDossierDetail (not in timeline barrel)           |
| `components/timeline/OrganizationTimeline.tsx`       | OrganizationDossierDetail (not in barrel)               |
| `components/timeline/PersonTimeline.tsx`             | PersonDossierDetail (not in barrel)                     |
| `components/key-contacts-panel/KeyContactsPanel.tsx` | Country + Organization details                          |
| `components/engagements/ForumSessionCreator.tsx`     | ForumDossierDetail                                      |
| `components/engagements/EngagementBriefsSection.tsx` | EngagementDetailPage                                    |
| `components/dossier-timeline/DossierTimeline.tsx`    | ForumDossierDetail                                      |

### KEEP — live importers exist (do NOT delete)

| Component                                         | Live importers                                                                                           |
| ------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `RelationshipGraph` (components/dossiers/)        | `pages/contacts/ContactDetails.tsx`, `MiniRelationshipGraph`                                             |
| `DossierMoUsTab`                                  | `routes/.../organizations/$id/mous.tsx`                                                                  |
| `DossierPositionsTab`                             | countries/topics/engagement positions routes, `NewPositionDialog`                                        |
| `LifecycleStepperBar` / `LifecycleTimeline`       | workspace OverviewTab/AuditTab, `WorkspaceShell`                                                         |
| `pages/persons/PersonDetailPage.tsx`              | **ROUTED** at `/_protected/persons/$personId` — the `get_person_full` consumer; not part of this cleanup |
| `hooks/usePersons.ts` (deprecated re-export)      | live PersonDetailPage                                                                                    |
| `DossierActivityTimeline`, `ActivityTimelineItem` | routed timeline tabs + barrel                                                                            |

### Barrel-API edge cases — KEEP + record as follow-up (65-03 precedent: "barrel-exported domain API, not workspace UI")

| Component                                                        | Situation after deletion                                                                                                                                                                                                                                                                 |
| ---------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `DossierDetailLayout`                                            | Sole non-barrel importers are the 6 dead wrappers; exported from `components/dossier/index.ts`. Either delete + remove the barrel line (one-line edit, low risk) or keep + record. Planner's call; deleting is clean here because the barrel export is a single line with no dependents. |
| `InteractiveTimeline` (+ `CompactInteractiveTimeline`)           | Sole page importer is dead EngagementDetailPage; exported from `components/timeline/index.ts`. KEEP + record (timeline barrel is shared API).                                                                                                                                            |
| `components/stakeholder-timeline/` barrel                        | Sole consumer is dead PersonDossierDetail. KEEP + record.                                                                                                                                                                                                                                |
| `components/multilingual/` barrel (`MultiLanguageContentEditor`) | Sole consumer is dead CountryDossierDetail. KEEP + record.                                                                                                                                                                                                                               |
| `components/timeline/EngagementTimeline.tsx`                     | ALREADY zero importers (pre-existing dead code, not created by this deletion). Same-class candidate; deleting is in the spirit of PERENG-03 but optional — record if kept.                                                                                                               |

### Raw-key i18n debt resolution

The debt named by PERENG-03 lives inside the deleted components (round-13/14 inspection findings) — deletion clears it. Surviving phase surfaces all use **registered** namespaces (`dossier-shell`, `dossier-overview`, `engagements`, `persons` — verified in `i18n/index.ts`; remember the 260605-u2z failure class: unregistered ns breaks AR silently). New tab strings (e.g. "Hosted engagements", "Participating in", role badges) go in `dossier-shell` en+ar; role labels REUSE `engagements:participantRoles.*` (verified present en+ar) — use **colon** namespace form (`t('engagements:participantRoles.delegate')`), never dot-form (project memory: dot-form leaks raw keys). Orphaned i18n keys left behind by deleted components may be swept only if provably unused (grep per key) — optional, low value.

## Architecture Patterns

### System Architecture Diagram (target state)

```
Org/Person/EO dossier route (/dossiers/<type>/$id/engagements)
        │ lazy+Suspense (65-01/260605-s32 tab pattern)
        ▼
DossierEngagementsTab { dossierId, dossierType? }
        │ per-tab query key ['dossier-tab','engagements',dossierId]
        ├─► fetchDossierOverview(related_dossiers, calendar_events)   [existing generic branch]
        ├─► engagement_participants .eq(participant_dossier_id, id)   [NEW: participation branch — person/EO/org/country]
        │         └─► dossiers .in(id, engagementIds)  → names (extension-merge pattern)
        └─► engagement_dossiers .eq(host_organization_id, id)         [NEW: org-only hosted branch]
                  └─► dossiers .in(id, hostedIds)      → names
        │
        ▼ merge, de-dupe by engagement id, sort newest-first
   Rows: linked │ participating (role badge) │ hosted (host badge) │ past calendar events
   isError → role="alert" bilingual section error (Phase 66 contract)

get_person_full.recent_engagements (RPC, migration repoint)
   person_engagements→engagements  ══►  engagement_participants→engagement_dossiers→dossiers
   (shape preserved: { link, engagement{name_en,name_ar,engagement_type} })
        ▼
persons edge fn (unchanged) → PersonDetailPage /persons/$personId (unchanged)

Wizard postCreate fix: engagement_participants insert += created_by: user.id  (RLS WITH CHECK passes)
```

### Pattern 1: Per-tab lazy route (mirror exactly — routes already exist)

The three engagements.tsx routes already follow the canonical pattern; only the tab component changes. If the tab needs `dossierType` to gate the host branch, pass it from the route (each route knows its type statically).

### Pattern 2: Extension-merge (two-step fetch, no PostgREST GROUP BY)

```typescript
// Source: frontend/src/hooks/useOrganizations.ts L76-96 (shipped pattern)
const { data: parts } = await supabase
  .from('engagement_participants')
  .select('engagement_id, role, attendance_status')
  .eq('participant_dossier_id', dossierId)
const ids = [...new Set((parts ?? []).map((p) => p.engagement_id))]
const { data: engagements } = ids.length
  ? await supabase.from('dossiers').select('id, name_en, name_ar, created_at').in('id', ids)
  : { data: [] }
```

### Pattern 3: Section error contract (Phase 66 — MUST apply to the tab)

`const { data, isLoading, isError } = useQuery(...)`; on `isError` render the bilingual `role="alert"` line ("Failed to load this section. Check your connection and try again." / "تعذر تحميل هذا القسم. تحقق من اتصالك وحاول مرة أخرى.") — never the empty state. Reuse the Phase 66 guard/copy (see `66-*` plans / UI-SPEC for the exact component).

### Pattern 4: Deletion gated on execution-time re-grep (65-03 discipline)

Before each destructive commit: re-grep every module name for importers (the RESEARCH map can go stale); STOP if an unexpected importer appears. Delete leaf→root (sections before details, details before pages) or in one commit per closed sub-graph; run `pnpm type-check` + `pnpm build` per commit (pre-commit build does NOT block on failure — verify exit codes yourself, project memory).

### Anti-Patterns to Avoid

- **Reading/writing `person_engagements` or legacy `engagements` from new code** — ENGPOS-01 precedent; legacy plane is fenced
- **PostgREST embed for engagement names via `engagement_dossiers`** — names are on `dossiers`; embedding the extension table yields no names (same class as the `position:positions` embed bug, project memory)
- **Swallowing the new branch errors into `?? []`** — OVRERR-01 regression
- **Dot-form namespace `t('engagements.participantRoles.x')`** — leaks raw keys; use colon form
- **Editing migrations in place** — new migration file only, applied by orchestrator via MCP

## Don't Hand-Roll

| Problem                              | Don't Build                                   | Use Instead                                                                      | Why                                       |
| ------------------------------------ | --------------------------------------------- | -------------------------------------------------------------------------------- | ----------------------------------------- |
| Engagement names for id lists        | per-row fetches or embeds on extension tables | two-step `.in()` merge (Pattern 2)                                               | shipped, RLS-proven, no N+1               |
| Section error UI                     | new error component                           | Phase 66 section-error line + copy                                               | live-verified blast-radius contract       |
| Role labels                          | new i18n block                                | `engagements:participantRoles.*`                                                 | exists en+ar, registered                  |
| Date rendering                       | Intl/date-fns ad hoc                          | `formatDayFirst(date, i18n.language)`                                            | day-first contract + ar-SA digit handling |
| Tab skeleton/empty                   | custom                                        | `TabSkeleton`, `empty.engagements.*` (dossier-shell)                             | exists en+ar                              |
| Live emptiness/row probes (executor) | MCP assumptions                               | service-role PostgREST REST via `.env.test` (65-03 protocol, never echo secrets) | proven executor-runnable                  |

## Runtime State Inventory (data-plane half of this phase)

| Category            | Items Found                                                                                                                                     | Action Required                                                                                                                         |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| Stored data         | `engagement_participants` rows possibly silently missing for wizard-created engagements (RLS drop); 3 `engagement_dossiers` rows all-NULL hosts | Code edit (wizard `created_by`); orchestrator seed for verification only — no backfill is possible (the dropped rows were never stored) |
| Live service config | `get_person_full` RPC body on staging = the legacy join                                                                                         | New migration applied via Supabase MCP (orchestrator); `persons` edge fn unchanged, NO redeploy                                         |
| OS-registered state | None — verified: frontend-only deletions + one RPC migration                                                                                    | none                                                                                                                                    |
| Secrets/env vars    | `.env.test` service-role key used read-only for executor probes                                                                                 | none (never echo)                                                                                                                       |
| Build artifacts     | Vite chunks shrink after deletion; size-limit budgets re-checked                                                                                | run `pnpm exec size-limit`, grep ALL `exceeded` lines                                                                                   |

## Common Pitfalls

### Pitfall 1: Wizard participants are silently RLS-dropped TODAY

**What goes wrong:** `engagement.config.ts postCreate` inserts `engagement_participants` rows WITHOUT `created_by`; the column has no default; RLS `WITH CHECK (created_by = auth.uid())` rejects NULL; the error is `console.warn`-swallowed.
**Why it happens:** client-side insert written against a policy that the edge writer (`addParticipant`, which sets `created_by: user.id`) satisfies but the wizard does not.
**How to avoid:** include `created_by: user.id` (from `supabase.auth.getUser()`/session) in the insert; add a unit test pinning the payload; live-verify one wizard create→participants row on staging.
**Warning signs:** participation branch renders empty for engagements created via wizard while seeded rows render fine.

### Pitfall 2: Engagement display names are NOT on the extension table

`engagement_dossiers` has no `name_en/ar` — join `dossiers` (Pattern 2). An embed on the FK will type-check and return nameless rows.

### Pitfall 3: `get_person_full` shape and security must be preserved

The replacement must keep `{link, engagement}` keys (PersonDetailPage reads `eng.engagement.name_ar/name_en`, `eng.engagement.engagement_type`, `eng.link.role`), SECURITY DEFINER, and grants; cast varchar columns `::text` if declared text (recurring 42804). Verify with a live `SELECT get_person_full('<id>')` after applying.

### Pitfall 4: Deletion fallout classes

(a) ESLint whole-repo `--max-warnings 0` in CI vs staged-only pre-commit — orphaned imports your deletion creates in files you didn't touch WILL fail CI even if pre-commit passes; (b) pre-commit build does not block — check exit codes; (c) `components/**` PascalCase filename rule for any new file; (d) re-grep before every destructive commit (65-03 STOP rule).

### Pitfall 5: OVRERR-01 regression in the tab

The existing tab has no `isError` branch. Adding branches without the Phase 66 error contract re-introduces fake-empty-on-failure on a surface Phase 66's matrix never covered. Include a forced-error unit test (mock rejects → expect alert copy, expect empty-state copy ABSENT).

### Pitfall 6: KPI-vs-tab consistency

`useOrganizations` engagement_count counts ONLY `host_organization_id` rows. If the tab shows hosted + participating + related, counts will differ from the KPI. Decide and document: either extend the KPI tally to participation (extra query on the list page — weigh cost) or annotate the divergence in the SUMMARY. Do not silently leave both unexplained (this exact inconsistency was flagged in 260607-j2e).

### Pitfall 7: Calendar branch window

`calendar_events.past` covers only 7 days back by default. If the tab's history claim matters, pass a larger `calendar_days_behind` in the tab's `fetchDossierOverview` call (param exists) — or document the window.

## Code Examples

### RPC repoint sketch (new migration; orchestrator applies via MCP)

```sql
-- Replace ONLY the recent_engagements sub-select inside get_person_full
-- (CREATE OR REPLACE the whole function, preserving SECURITY DEFINER + grants)
'recent_engagements', (
  SELECT json_agg(json_build_object(
    'link', row_to_json(ep),
    'engagement', json_build_object(
      'id', d.id,
      'name_en', d.name_en,
      'name_ar', d.name_ar,
      'engagement_type', ed.engagement_type
    )
  ) ORDER BY ed.start_date DESC)
  FROM engagement_participants ep
  JOIN engagement_dossiers ed ON ed.id = ep.engagement_id
  JOIN dossiers d ON d.id = ed.id
  WHERE ep.participant_dossier_id = p_person_id
  LIMIT 10
),
```

(Note: `ep.role` rides inside `link` exactly as today's `pe.role` did.)

### Wizard write fix

```typescript
// engagement.config.ts postCreate — add created_by so RLS WITH CHECK passes
const { data: auth } = await supabase.auth.getUser()
const rows = buildParticipantRows(newDossierId, data).map((r) => ({
  ...r,
  created_by: auth.user?.id,
}))
```

### Hosted-engagements branch (org only)

```typescript
const { data: hosted, error } = await supabase
  .from('engagement_dossiers')
  .select('id, engagement_type, start_date')
  .eq('host_organization_id', dossierId)
if (error) throw error // Phase 66 contract — never swallow
// then names via dossiers .in('id', hosted.map(h => h.id))
```

## State of the Art (repo-local)

| Old Approach                                              | Current Approach                                                               | When Changed     | Impact                                                         |
| --------------------------------------------------------- | ------------------------------------------------------------------------------ | ---------------- | -------------------------------------------------------------- |
| Legacy `engagements` table + `engagement_positions` plane | `dossiers(type=engagement)` + `engagement_dossiers` + `position_dossier_links` | Phases 64-65     | `person_engagements` (FK→legacy) is stranded on the dead plane |
| Tab content via monolithic `*DossierDetail`               | `DossierShell` + lazy per-tab routes                                           | quick 260605-s32 | The entire legacy detail plane is unreachable                  |
| Sections swallow errors into empties                      | Fail-the-query + `role=alert` section errors                                   | Phase 66         | New tab branches must comply                                   |

**Deprecated/outdated:** `engagements-positions-*` edges (deprecated-in-source, 65-03); `person_engagements` (recommend recording as legacy-dead this phase); `v_country_engagement_metrics` (legacy-keyed).

## Assumptions Log

| #   | Claim                                                                                                                                   | Section     | Risk if Wrong                                                                                             |
| --- | --------------------------------------------------------------------------------------------------------------------------------------- | ----------- | --------------------------------------------------------------------------------------------------------- |
| A1  | `engagement_participants` staging row count unknown; assumed ~0 useful rows (wizard writer is RLS-broken; edge writer has no UI caller) | Data planes | If rows exist, the participation branch shows data on day one — only improves verifiability. Q1 resolves. |
| A2  | Live staging `get_person_full` matches migration `20260202000001` (no out-of-band edit)                                                 | PERENG-02   | Repoint migration must be written against the LIVE body — Q4 fetches it first                             |
| A3  | No external script/automation imports the dead components (only in-repo importers checked)                                              | PERENG-03   | Frontend components are not externally importable; risk ~nil                                              |
| A4  | RLS policies in migrations match live staging (the persons RLS drift precedent 20260609 shows ad-hoc policies happen)                   | Pitfalls    | Q5 verifies live `engagement_participants`/`engagement_dossiers` policies before relying on them          |
| A5  | The `persons` edge fn deployed on staging calls `get_person_full` (matches repo source)                                                 | PERENG-02   | If drifted, redeploy the edge — orchestrator CLI action                                                   |

## Open Questions (exact SQL for the orchestrator to pre-answer via Supabase MCP)

1. **Q1 — participation rows on staging:**
   `SELECT participant_type, COUNT(*) FROM engagement_participants GROUP BY participant_type;`
   and `SELECT id, engagement_id, participant_dossier_id, role, created_by FROM engagement_participants LIMIT 10;`
2. **Q2 — EO persons available for verification:**
   `SELECT COUNT(*) FROM persons WHERE person_subtype = 'elected_official';`
3. **Q3 — legacy plane size (confirms nothing to migrate):**
   `SELECT (SELECT COUNT(*) FROM engagements) AS legacy_engagements, (SELECT COUNT(*) FROM person_engagements) AS person_engagements;`
4. **Q4 — live RPC body (write the repoint against THIS, not the repo migration):**
   `SELECT pg_get_functiondef(oid) FROM pg_proc WHERE proname = 'get_person_full';`
5. **Q5 — live RLS on the two read tables (drift check):**
   `SELECT tablename, policyname, cmd, qual, with_check FROM pg_policies WHERE tablename IN ('engagement_participants','engagement_dossiers');`
6. **Q6 — seed candidates (capture IDs for the protocol below):**
   `SELECT id, name_en FROM dossiers WHERE type = 'organization' AND status = 'active' LIMIT 3;`
   `SELECT d.id, d.name_en, p.person_subtype FROM dossiers d JOIN persons p ON p.id = d.id WHERE d.type = 'person' AND d.status = 'active' LIMIT 5;`
   `SELECT id FROM engagement_dossiers LIMIT 3;`

## Live Verification Protocol (seeds + cleanup — orchestrator executes; executors lack MCP/browser)

Executors CAN run read-only service-role REST probes via `.env.test` (65-03 protocol). Seeds/migrations/browser passes are orchestrator actions (Supabase MCP + agent-browser), mirroring 66-08.

**PERENG-01 seed (host):**

```sql
-- seed (substitute IDs from Q6)
UPDATE engagement_dossiers SET host_organization_id = '<org_dossier_id>' WHERE id = '<engagement_id>';
-- verify in browser: /dossiers/organizations/<org_dossier_id>/engagements shows the engagement (EN + AR)
-- cleanup
UPDATE engagement_dossiers SET host_organization_id = NULL WHERE id = '<engagement_id>';
```

**PERENG-02 seed (participation, canonical contract):**

```sql
-- seed
INSERT INTO engagement_participants (engagement_id, participant_type, participant_dossier_id, role, created_by)
VALUES ('<engagement_id>', 'person', '<person_dossier_id>', 'delegate',
        (SELECT id FROM auth.users WHERE email = 'kazahrani@stats.gov.sa'));
-- verify: /dossiers/persons/<person_dossier_id>/engagements shows the row with the Delegate badge;
--         GET persons/<person_dossier_id> via the persons edge returns non-empty recent_engagements
-- cleanup
DELETE FROM engagement_participants
WHERE engagement_id = '<engagement_id>' AND participant_dossier_id = '<person_dossier_id>' AND role = 'delegate';
```

**Wizard write-fix verification:** create an engagement via the wizard with one participant → `SELECT * FROM engagement_participants WHERE engagement_id = '<new_id>';` must return the row → delete the test engagement dossier (cascades the extension + participants).

**EO leg:** if Q2 = 0, either flip one seed person (`UPDATE persons SET person_subtype = 'elected_official' WHERE id = '<person_dossier_id>';` + revert) or record code-identity (same component/query as person) as the evidence.

## Environment Availability

| Dependency                      | Required By                           | Available                       | Version                    | Fallback                                                      |
| ------------------------------- | ------------------------------------- | ------------------------------- | -------------------------- | ------------------------------------------------------------- |
| Node                            | build/test                            | ✓                               | v26.0.0                    | —                                                             |
| pnpm                            | all gates                             | ✓                               | 10.29.1 (matches prod pin) | —                                                             |
| Supabase CLI                    | edge deploys (none needed this phase) | ✓                               | 2.102.0                    | —                                                             |
| Supabase MCP                    | migration + seeds                     | orchestrator only               | —                          | executors: service-role REST (read), orchestrator does writes |
| agent-browser / browser-harness | live UI verify                        | orchestrator only               | —                          | DOM-assertion protocol per 66-08                              |
| `.env.test` service-role key    | executor REST probes                  | assumed present (used in 65-03) | —                          | orchestrator runs probes instead                              |

**Missing dependencies with no fallback:** none.

## Validation Architecture

### Test Framework

| Property           | Value                                                                                                 |
| ------------------ | ----------------------------------------------------------------------------------------------------- |
| Framework          | Vitest (frontend `"test": "vitest"`), @testing-library/react                                          |
| Config file        | `frontend/vitest.config.ts` (suite green at 1397 tests post-Phase 66)                                 |
| Quick run command  | `cd frontend && pnpm vitest run src/components/dossier/tabs/__tests__/DossierEngagementsTab.test.tsx` |
| Full suite command | `cd frontend && pnpm vitest run`                                                                      |

### Phase Requirements → Test Map

| Req ID    | Behavior                                                                           | Test Type           | Automated Command                                                                                                                                                                                                                 | File Exists?                                |
| --------- | ---------------------------------------------------------------------------------- | ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------- |
| PERENG-01 | Org tab renders hosted engagement from mocked branches; isError → alert, not empty | unit                | quick run above (extend existing test)                                                                                                                                                                                            | ✅ extend `DossierEngagementsTab.test.tsx`  |
| PERENG-02 | Person tab renders participation rows with role badge (EN+AR); RPC shape preserved | unit + live SQL     | unit: same file; RPC: orchestrator `SELECT get_person_full('<id>')` post-migration                                                                                                                                                | ✅ extend / live protocol                   |
| PERENG-02 | Wizard postCreate payload includes `created_by`                                    | unit                | `cd frontend && pnpm vitest run src/components/dossier/wizard/__tests__ -t participant`                                                                                                                                           | ❌ Wave 0 (new test in wizard `__tests__/`) |
| PERENG-03 | Zero surviving references to deleted module names                                  | automated grep gate | `cd frontend && grep -rn "CountryDossierDetail\|ForumDossierDetail\|OrganizationDossierDetail\|PersonDossierDetail\|TopicDossierDetail\|WorkingGroupDossierDetail\|EngagementDetailPage" src/ \| grep -v Binary; pnpm type-check` | gate, no file                               |
| All       | Type/build/lint/size gates                                                         | smoke               | `pnpm type-check && pnpm build && pnpm exec size-limit` (frontend)                                                                                                                                                                | gate                                        |

### Sampling Rate

- **Per task commit:** quick run + `pnpm type-check`
- **Per wave merge:** full Vitest suite + `pnpm build`
- **Phase gate:** full suite green + size-limit zero `exceeded` + live protocol (seeds → browser DOM assertions EN/AR → cleanup) before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `frontend/src/components/dossier/wizard/__tests__/engagement-participants-payload.test.ts` — pins `created_by` in the postCreate insert (PERENG-02 write fix)
- [ ] Forced-error case added to `DossierEngagementsTab.test.tsx` (OVRERR-01 contract on this tab — currently untested AND unimplemented)

## Security Domain

`security_enforcement` not disabled in config → included.

### Applicable ASVS Categories

| ASVS Category       | Applies              | Standard Control                                                                                                                                                                                                                                                                   |
| ------------------- | -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| V2 Authentication   | no (no auth changes) | —                                                                                                                                                                                                                                                                                  |
| V4 Access Control   | yes                  | All new reads ride existing permissive SELECT RLS (verified in `20260110000006`); the wizard write fix makes the insert SATISFY `WITH CHECK (created_by = auth.uid())` — never weaken the policy instead. RPC repoint preserves SECURITY DEFINER semantics + existing grants only. |
| V5 Input Validation | yes                  | Zod wizard schema unchanged (or extended with uuid-validated optional host field); no new user input surfaces otherwise                                                                                                                                                            |
| V6 Cryptography     | no                   | —                                                                                                                                                                                                                                                                                  |

### Known Threat Patterns for this stack

| Pattern                                      | STRIDE          | Standard Mitigation                                                                                                |
| -------------------------------------------- | --------------- | ------------------------------------------------------------------------------------------------------------------ |
| RLS-policy weakening to "fix" denied inserts | Elevation       | Fix the payload (`created_by`), not the policy                                                                     |
| SECURITY DEFINER RPC scope creep             | Elevation       | Repoint keeps the same person-scoped WHERE; no new tables exposed beyond participation (already SELECT-permissive) |
| Secret echo in REST probes                   | Info disclosure | 65-03 protocol: load from `.env.test`, never print values                                                          |

## Sources

### Primary (HIGH confidence — repo + orchestrator ground truth)

- Orchestrator live staging facts (2026-06-13) — row counts, NULL hosts
- `frontend/src/components/dossier/tabs/DossierEngagementsTab.tsx`; `routes/_protected/dossiers/{organizations,persons,elected-officials}/$id/engagements.tsx`; `DossierTabNav.tsx`
- `frontend/src/services/dossier-overview.service.ts` (related_dossiers/calendar fetchers, L336-473, L878-940)
- `frontend/src/components/dossier/wizard/{schemas/engagement.schema.ts,config/engagement.config.ts}` — no host fields; participants postCreate without `created_by`
- `supabase/migrations/20260110000006_create_engagement_dossiers.sql` — tables, RLS, `get_engagement_full`
- `supabase/migrations/{20260110000003,20260202000001}` — `person_engagements` (FK→legacy `engagements`), `get_person_full.recent_engagements`
- `supabase/functions/{engagement-dossiers,dossiers-create,persons}/index.ts` — write paths, participants CRUD (`created_by: user.id` at edge), RPC consumer
- Import-graph grep census (per-component importer lists, 2026-06-13)
- `.planning/phases/65-*/65-03-SUMMARY.md` (deletion-gate protocol, barrel-API precedent); `66-*/66-08-SUMMARY.md` (live protocol, CDP forced-error learning)
- `frontend/src/i18n/index.ts` + `en|ar/{dossier-shell,engagements}.json` — namespace registration, `participantRoles` keys
- `frontend/src/hooks/useOrganizations.ts` — shipped host tally
- Project memory: legacy-table precedents, RLS drift precedent, i18n colon-form rule, CI gate behaviors

### Secondary / Tertiary

None — no external research needed; phase is fully repo-internal.

## Metadata

**Confidence breakdown:**

- Data-plane contracts (PERENG-01/02): HIGH — every table/RPC/RLS/writer claim read from source; live unknowns isolated into Open Questions with exact SQL
- Deletion inventory (PERENG-03): HIGH — per-file importer grep, test grep, barrel grep; 65-03 re-grep discipline still mandated at execution time
- Pitfalls: HIGH — Pitfall 1 (RLS drop) verified by reading both the insert payload and the policy; others from shipped precedents

**Research date:** 2026-06-13
**Valid until:** 2026-07-13 (repo-internal; invalidated by any engagement-plane migration or tab refactor landing first)

## Open Question Answers (orchestrator, Supabase MCP, 2026-06-13 04:00)

1. **Q1 — engagement_participants:** 1 row total — person participant `b0000011-…-0001`, role `head_of_delegation`, engagement `b0000002-…-0003` (Indonesia BPS), `created_by` SET (the edge-writer path works). The canonical plane is live but nearly empty.
2. **Q2 — EO persons:** exactly 1 person with `person_subtype = 'elected_official'` (note: 0 dossiers of TYPE elected_official — EO lives as a person dossier with subtype, confirming the routing assumption).
3. **Q3 — legacy plane:** `engagements` = 4 rows, `person_engagements` = 0 rows. Nothing to migrate; never write to either.
4. **Q4 — LIVE get_person_full (CRITICAL DRIFT):** the deployed function returns ONLY `person` + `active_committees` + `key_staff` — **there is NO `recent_engagements` key in the live body** (repo migration drift, same class as prior incidents). The PERENG-02 repoint migration must be authored against the live body captured this session: add `recent_engagements` sourced from `engagement_participants ⋈ engagement_dossiers ⋈ dossiers` (participant_dossier_id = p_person_id), keeping SECURITY DEFINER + the existing three keys byte-compatible.
5. **Q5 — RLS:** `engagement_participants`: INSERT ("Users can create engagement participants"), DELETE (own), SELECT (view) — all present. `engagement_dossiers`: full INSERT/UPDATE/DELETE/SELECT set. No drift blocking reads; the INSERT WITH CHECK created_by predicate confirms the wizard-payload bug analysis.
6. **Q6 — seed candidates:** orgs `b0000001-…-0005` (OECD), `…-0006` (GCC Stat Centre), `b0000000-…-aaaa` (GASTAT); persons `a0000000-…-0501..0505` (all subtype standard); the 1 EO person id resolvable at seed time via `person_subtype='elected_official'`; engagements `b0000002-…-0001..0003`.

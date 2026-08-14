# Intl-DossierV2.0 Development Guidelines

Last updated: 2026-05-01

## Codebase Knowledge-Graph Dashboard (shared, all agents)

An Understand-Anything knowledge graph of `frontend/src` (3,202 nodes / 3,883
edges across 1,574 files) is served locally behind a token gate. The token is
**pinned** (via `UNDERSTAND_ACCESS_TOKEN`), so the URL is stable across restarts
and any agent can use it directly:

```
http://127.0.0.1:5174/?token=85763bd5b157b039536df19c556bd258
```

`curl` access, per-file queries, and the idempotent launcher are documented in
`frontend/src/.understand-anything/DASHBOARD.md`. To (re)start the dashboard:
`./frontend/src/.understand-anything/start-dashboard.sh`. That directory is
git-ignored (local only).

## Visual Design Source of Truth (READ BEFORE ANY UI WORK)

The canonical visual design is the **Linear design system**, specified in:

```
frontend/DESIGN.md   <-- the Linear spec: dark-canonical token tables
                         (dark verbatim + derived light), the accent + semantic
                         + status palettes, type stack, radii (6/8/12), the
                         recipe rules, and the engine contract
```

The runtime port lives at **`frontend/src/design-system/`**
(`DesignProvider.tsx`, `tokens/{directions,densities,buildTokens,applyTokens}.ts`,
hooks) and is documented in `frontend/src/design-system/CLAUDE.md`. The FOUC
bootstrap that paints first-frame tokens is at `frontend/public/bootstrap.js`.
The Linear palette/font literals exist in **three copies that must byte-match** —
`tokens/directions.ts` (`PALETTES.linear` / `FONTS.linear`), `public/bootstrap.js`
(the ES5 first-paint table), and the `frontend/src/index.css` `:root` fallback —
enforced on every build by `scripts/check-bootstrap-parity.mjs` (lint + CI). Change
all three in the same edit.

**Default: Linear, dark mode.** Linear is the only direction — the four legacy
directions (Bureau, Chancery, Situation, Ministerial) and the accent-hue axis were
collapsed away in Phase 77. Any persisted `id.dir` coerces to `linear`.

The **IntelDossier prototype** at
`frontend/design-system/inteldossier_handoff_design/` is **historical reference
(superseded 2026-07)** — it predates the Linear migration and is no longer a source
of truth. Do not point new work at it (see its `README.md` supersession banner).

### Required reading order before building or modifying any UI

1. `frontend/DESIGN.md` — the Linear spec: token tables, type, radii, recipes
2. `frontend/src/design-system/CLAUDE.md` — the runtime token engine
3. The closest matching existing component under `frontend/src/components/`

If you cannot identify a closest match, **ask before inventing**.

### Design rules — non-negotiable

- All colors via `var(--*)` tokens or the `@theme`-mapped Tailwind utilities
  (`bg-bg`, `bg-surface`, `text-ink`, `border-line`, `bg-accent`, etc.).
  **No raw hex. No Tailwind color literals** like `text-blue-500`.
- Borders are `1px solid var(--line)`, with `var(--line-strong)` for emphasis.
  **No drop-shadows on cards.** Shadow is reserved for drawers
  (`var(--shadow-drawer)` / `var(--shadow-lg)`) and hovered list rows.
- **No gradient backgrounds.** Surfaces are flat, layered via the surface ladder
  `--surface` / `--surface-raised` / `--surface-3` / `--surface-4` (cards on
  `--surface`, popovers/menus on `--surface-3`, drawers/modals on `--surface-4`).
- Buttons follow `.btn-primary` / `.btn-ghost` from the runtime recipes
  (`src/index.css` + `src/styles/list-pages.css`). Do not introduce new button
  variants without an explicit ask.
- Row heights use `var(--row-h)` (density-aware). Tables and lists must
  obey it.
- Corner radii come from `--radius-sm / --radius / --radius-lg` — Linear values
  are **6/8/12**. Do not hard-code px.
- **No emoji in user-visible copy.** Emoji is allowed only as data input
  (e.g. flag codepoints).
- **No marketing voice.** Banned: "Discover", "Easily", "Unleash",
  exclamation marks, "you're in!", first-person plural ("we"). Sentence
  case for titles and buttons; UPPERCASE only for classification ribbons,
  mono labels, and table-column headers.
- Dates: `Tue 28 Apr` (day-first, no comma). Times: `14:30 GST`.
  SLA windows: `T-3` / `T+2` (mono-formatted).

### Definition of Done — UI checklist

Before declaring any UI task complete:

- [ ] All colors resolve to design tokens (no raw hex; no `text-blue-500`)
- [ ] Borders are `1px solid var(--line)` (`--line-strong` for emphasis); no card shadows
- [ ] Surfaces use the ladder (`--surface`/`--surface-raised`/`--surface-3`/`--surface-4`); radii are token-driven (Linear 6/8/12)
- [ ] Row heights use `var(--row-h)`
- [ ] Buttons mirror the `.btn-primary` / `.btn-ghost` recipes
- [ ] Logical properties for spacing (`ms-*`, `ps-*`, `text-start`)
- [ ] No emoji in copy; no marketing voice
- [ ] Tested at 1024px and 1400px (the actual analyst-workstation widths)
- [ ] RTL: rendered with `dir="rtl"` and verified Tajawal applies

## Responsive Design

IntelDossier is a **desktop-primary analyst workstation**. The default
target is 1280–1400px. Mobile is a secondary surface for read-only
review.

### Breakpoints

| Width     | Treatment                                                  |
| --------- | ---------------------------------------------------------- |
| 1400px+   | Full layout (sidebar + 2:1 dashboard grid + dossier rail)  |
| 1024–1399 | Full layout, max-page-width 1400 enforced                  |
| 768–1023  | Collapse sidebar to icon rail; KPI strip 2×2               |
| 320–767   | Read-only mobile: stacked, no edit forms, no drag-and-drop |

### Rules

- Build for 1280px first, verify at 1024px, then degrade gracefully
  to 768. Below 768 is read-only.
- Touch targets at 44×44 only on `< 768px`. Above that, density tokens
  (`--row-h`) drive sizing.
- Use logical properties (`ms-*`, `ps-*`) so RTL works without re-styling.
- Never hide critical analyst content behind a mobile-toggle. If the
  feature can't fit at 768, omit it on mobile entirely.

## Arabic RTL Support Guidelines (MANDATORY)

### RTL Detection & Implementation

```tsx
import { useTranslation } from 'react-i18next'
const { i18n } = useTranslation()
const isRTL = i18n.language === 'ar'
```

### RTL-Safe Tailwind Classes (REQUIRED)

**NEVER** use `left`, `right`, `ml-*`, `mr-*`, `pl-*`, `pr-*`
**ALWAYS** use logical properties:

| ❌ Avoid      | ✅ Use Instead | Description         |
| ------------- | -------------- | ------------------- |
| `ml-*`        | `ms-*`         | Margin start        |
| `mr-*`        | `me-*`         | Margin end          |
| `pl-*`        | `ps-*`         | Padding start       |
| `pr-*`        | `pe-*`         | Padding end         |
| `left-*`      | `start-*`      | Position start      |
| `right-*`     | `end-*`        | Position end        |
| `text-left`   | `text-start`   | Text align start    |
| `text-right`  | `text-end`     | Text align end      |
| `rounded-l-*` | `rounded-s-*`  | Border radius start |
| `rounded-r-*` | `rounded-e-*`  | Border radius end   |

## Component Library Strategy

**The IntelDossier prototype is the visual source of truth.** The
component cascade below is for **interactive primitives only** —
unstyled or minimally-styled building blocks (focus management,
keyboard handling, ARIA). Visual styling, color, spacing, type,
borders, and shadows always come from the prototype tokens.

**Primitive cascade (in order):**

1. **HeroUI v3** — for accessible primitives (Modal, Popover, Combobox,
   etc.). Override its color/spacing/radius via the design tokens; never
   accept its default chrome.
2. **Radix UI** (already in via `@radix-ui/react-slot`) — for headless
   primitives HeroUI doesn't cover.
3. **Build it yourself**, mirroring a prototype component, if no
   primitive fits.

**Banned without explicit user request:**

- Aceternity UI — animation-heavy, marketing aesthetic. Conflicts with
  IntelDossier's restrained motion language. Do not install or import.
- Kibo UI — different visual system. Do not install or import.
- shadcn/ui defaults — the wrappers in `components/ui/heroui-*.tsx` exist
  for API compatibility, not visual fidelity. Re-skin them via tokens.

If a feature seems to require Aceternity-style motion or shadcn defaults,
**stop and ask** before installing anything.

### Component file locations

- **Token-bound primitives**: `frontend/src/components/ui/`
- **Design-system port**: `frontend/src/design-system/` (DesignProvider,
  tokens, hooks)
- **FOUC bootstrap**: `frontend/public/bootstrap.js` (palette + font literals
  must byte-match `tokens/directions.ts`)

## Work Management Terminology (MANDATORY)

Use consistent terminology across all work-related features. This glossary is the single source of truth.

### Unified Terms

| Term          | Definition                                                                  | Replaces                          |
| ------------- | --------------------------------------------------------------------------- | --------------------------------- |
| **Work Item** | Any trackable unit of work in the system                                    | Task, Assignment                  |
| **Assignee**  | Person responsible for completing work                                      | Owner, Assigned To, Assigned User |
| **Deadline**  | Target completion date/time                                                 | Due Date, SLA Deadline            |
| **Priority**  | Importance level: `low`, `medium`, `high`, `urgent`                         | `critical` (use `urgent` instead) |
| **Status**    | Current state: `pending`, `in_progress`, `review`, `completed`, `cancelled` | Workflow Stage (for display)      |

### Source Types

Work items originate from different sources, identified by the `source` field:

| Source         | Description                                    | Typical Use Case          |
| -------------- | ---------------------------------------------- | ------------------------- |
| **task**       | Internal operational work with Kanban workflow | Assignments, action items |
| **commitment** | Promises from after-action records             | Deliverables, follow-ups  |
| **intake**     | Service requests through intake system         | Support tickets, requests |

### Tracking Types

Work items are categorized by how they're tracked:

| Tracking Type | Description                | Typical Sources              |
| ------------- | -------------------------- | ---------------------------- |
| **delivery**  | Deliverable-based tracking | Internal commitments, tasks  |
| **follow_up** | External party follow-up   | External commitments         |
| **sla**       | SLA-driven with deadlines  | Intake tickets, urgent tasks |

### Workflow Stages (Tasks Only)

Kanban board positions for tasks:

| Stage         | Description              |
| ------------- | ------------------------ |
| `todo`        | Not started, in backlog  |
| `in_progress` | Actively being worked on |
| `review`      | Pending review/approval  |
| `done`        | Successfully completed   |
| `cancelled`   | Explicitly cancelled     |

### Database Column Naming

| Field           | Type        | Description                                        |
| --------------- | ----------- | -------------------------------------------------- |
| `assignee_id`   | UUID        | User responsible (NOT `owner_id`, `assigned_to`)   |
| `deadline`      | TIMESTAMPTZ | Target completion (NOT `due_date`, `sla_deadline`) |
| `priority`      | ENUM        | `low`, `medium`, `high`, `urgent`                  |
| `status`        | ENUM        | Current state                                      |
| `source`        | ENUM        | `commitment`, `task`, `intake`                     |
| `tracking_type` | ENUM        | `delivery`, `follow_up`, `sla`                     |

### Source-Specific Column Carve-Outs (verified against the DB — do NOT "normalize")

The unified glossary above governs the **unified work-item layer**. Some source
tables legitimately use their own columns and lifecycles that diverge from it.
These are intentional and verified against the live schema — do **not** rename
them to match the glossary (renaming breaks inserts; the forms correctly mirror
the DB):

- **Intake tickets** (`intake_tickets`) use their own `status` lifecycle
  (`draft`, `submitted`, `triaged`, `assigned`, `in_progress`, `converted`,
  `closed`, `merged`) and a distinct `urgency` enum (`low`, `medium`, `high`,
  `critical`) — `critical` is correct here; it is the `urgency_level` enum, NOT
  the work-item `priority` (which uses `urgent`).
- **Commitments** (`aa_commitments`) use `due_date` and `owner_type` /
  `owner_user_id` / `owner_contact_id` (not `deadline` / `assignee_id`).
- **Tasks** (`tasks`) use `sla_deadline` (not `deadline`) and `workflow_stage`
  (`todo`, `in_progress`, `review`, `done`, `cancelled`).

When building cross-source work-item queries, map these columns at the query
layer rather than renaming the underlying tables.

## Dossier-Centric Development Patterns (MANDATORY)

The system is built around **dossiers** as the central organizing concept. All features should connect to dossiers.

### Core Principle

**"Everything starts with a Dossier"** - When building new features:

1. Identify which dossier type(s) the feature relates to
2. Use `work_item_dossiers` for task/commitment/intake linking
3. Show dossier context via `DossierContextBadge` component
4. Include dossier in activity timelines

### Dossier Types (8 total)

| Type               | Description                                   |
| ------------------ | --------------------------------------------- |
| `country`          | Nation states with diplomatic relations       |
| `organization`     | International bodies, agencies, ministries    |
| `forum`            | Multi-party conferences and summits           |
| `engagement`       | Diplomatic meetings, consultations, visits    |
| `topic`            | Policy areas and strategic initiatives        |
| `working_group`    | Committees and task forces                    |
| `person`           | VIPs requiring tracking                       |
| `elected_official` | Government contacts with office/term metadata |

### Architecture Documentation

For comprehensive details, see:

- [Dossier-Centric Architecture](./docs/DOSSIER_CENTRIC_ARCHITECTURE.md) - Complete system design
- Section 2: Dossier Connections Map
- Section 5: 13 Improvement Recommendations with priority matrix

<!-- Recent changes: see git log. Key: HeroUI v3 migration (036), dossier context (035), UI polish (034), AI briefs (033) -->

<!-- MANUAL ADDITIONS START -->

## Deployment Configuration

### Staging Environment

- **Project Name**: Intl-Dossier
- **Project ID**: zkrcjzdemdmwhearhfgg
- **Region**: eu-west-2
- **Database**: PostgreSQL 17.6.1.008
- **Host**: db.zkrcjzdemdmwhearhfgg.supabase.co

### Deployment Commands

- Migrations: Use Supabase MCP to apply migrations
- Edge Functions: Deploy via Supabase CLI or MCP
- Realtime: Enable via Supabase dashboard or MCP

### DigitalOcean Droplet (Production)

- **IP Address**: 138.197.195.242
- **SSH Access**: `ssh root@138.197.195.242` (key pre-configured)
- **App Directory**: `/opt/intl-dossier/`
- **Port**: 80 (HTTP), 443 (HTTPS - not yet configured)
- **Full Instructions**: See `deploy/DROPLET_INSTRUCTIONS.md`

**Quick Deploy:**

```bash
git push && ssh root@138.197.195.242 "cd /opt/intl-dossier && git pull && cd deploy && docker compose -f docker-compose.prod.yml build frontend && docker compose -f docker-compose.prod.yml up -d frontend"
```

### Test Credentials for Browser/Chrome MCP

When testing the application using browser automation tools (Chrome MCP, Playwright, etc.), use credentials from environment variables:

- **Email**: `$TEST_USER_EMAIL` (see `.env.test.example`)
- **Password**: `$TEST_USER_PASSWORD` (see `.env.test.example`)

For local development, set these in `.env.test` (not committed to git).

## Browser Automation

Use `agent-browser` for web automation. Run `agent-browser --help` for all commands.

Core workflow:

1. `agent-browser open <url>` - Navigate to page
2. `agent-browser snapshot -i` - Get interactive elements with refs (@e1, @e2)
3. `agent-browser click @e1` / `fill @e2 "text"` - Interact using refs
4. Re-snapshot after page changes

<!-- MANUAL ADDITIONS END -->

<!-- GSD:project-start source:PROJECT.md -->

## Project

**Intl-Dossier v2.0 — Production Quality Milestone**

A diplomatic dossier management system for tracking countries, organizations, forums, engagements, topics, working groups, persons, and elected officials. Built with React 19 + TanStack Router/Query, Express backend, Supabase (PostgreSQL + Auth + Realtime), AI briefing generation, and bilingual Arabic/English support. Used by international affairs professionals to manage diplomatic relationships, work items, and intelligence signals.

**Core Value:** The codebase must be production-ready — clean, consistent, secure, performant, and fully responsive with proper RTL/LTR theming — before new features are built on top of it.

### Constraints

- **Tech stack**: Must stay within current stack (React 19, Express, Supabase, TanStack, Tailwind v4) — no framework migrations. The brand/component layer is the IntelDossier Design System at `frontend/design-system/inteldossier_handoff_design/`; component libraries below it are an implementation detail and may be swapped to serve the design system.
- **Backwards compatibility**: All existing features must continue working after cleanup — no regressions
- **Bilingual**: Arabic (RTL) and English (LTR) must both work correctly after every change
- **Database**: Supabase managed PostgreSQL — migrations via Supabase MCP, no direct DB access changes
- **Deployment**: DigitalOcean droplet with Docker Compose — changes must be deployable via existing pipeline
<!-- GSD:project-end -->

<!-- GSD:stack-start source:codebase/STACK.md -->

## Conventions

## Error Handling

- Use `try/catch` with specific error types
- Return discriminated union types: `{ success: boolean, data?: T, error?: Error }`
- Async operations should not use floating promises

## Logging

- **Backend**: Winston logger (configured in `src/utils/logger.ts`)
- **Frontend**: `console.warn()` and `console.error()` (production-safe)

## Module Design

- Named exports for functions/classes; default exports only for React components
- `src/types/index.ts` and `src/utils/index.ts` re-export all; avoid circular deps
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->

## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:

- `/gsd:quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd:debug` for investigation and bug fixing
- `/gsd:execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.

<!-- GSD:workflow-end -->

<!-- GSD:profile-start -->

## Developer Profile

> Profile not yet configured. Run `/gsd:profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.

<!-- GSD:profile-end -->

# graphify

This project has a graphify knowledge graph at graphify-out/.

Rules:

- Before answering architecture or codebase questions, read graphify-out/GRAPH_REPORT.md for god nodes and community structure
- If graphify-out/wiki/index.md exists, navigate it instead of reading raw files
- After modifying code files in this session, run `graphify update .` to keep the graph current (AST-only, no API cost)

<!-- tickmarkr:agent-docs begin -->

## tickmarkr

tickmarkr compiles repository specs into isolated, independently verified agent work.

### Invariants

- Never run two tickmarkr runs in the same repository concurrently.
- Never let tickmarkr merge work to main; new runs consolidate on `tickmarkr/<runId>`.
- Do not edit compiled graphs to force outcomes; fix source specs and recompile.
- Gates verify commits, diffs, acceptance criteria, and reviews independently — never trust a worker's completion claim.
- Treat missing or unparseable machine results and verdicts as failures.

### Commands

- `tickmarkr compile <spec>` — spec → RunGraph
- `tickmarkr plan` — routing table and human gates
- `tickmarkr run` — execute the graph
- `tickmarkr status <runId>` — run progress
- `tickmarkr resume <runId>` — continue a paused or failed run
- `tickmarkr approve <runId> <taskId>` — release a human gate
- `tickmarkr report <runId> --md` — execution record beside the spec
- `tickmarkr verify --base <ref>` — run the gate battery standalone against merge-base(base, HEAD)..HEAD: no daemon, no retries, one fail-closed verdict (`--criteria <file>` or `--task <id>` adds the semantic gates; `--no-review` for deterministic-only)

Loop: compile → plan → run → report. Watch the journal for run-end rather than polling workers.

### Role check (multi-agent environments)

- **Orchestrator:** run the loop in your session; do not start a second run.
- **Supervisor with a live orchestrator:** relay the mission via verified handoff (below), then supervise — do not duplicate the loop.
- **Primary session without an orchestrator:** spawn one child orchestration session, give it the mission and these rules, then supervise.

Outside multi-agent environments, run the loop directly.

### Version preflight

Before `tickmarkr compile` or `tickmarkr run`: run `tickmarkr version`, read `package.json` version, and if the binary is older on major.minor, stop and tell the operator to update. Never proceed on hope — stale binaries silently skip daemon gates. Also verify no run is live before starting one: `pgrep -f "tickmarkr (run|resume)"` must be empty — match the process, not one install path (`dist/cli/index.js` alone misses global and homebrew installs), and treat a held `.tickmarkr/graph.lock` as a live run until its holder pid is proven dead.

### Tip-verify-before-green

A run is green only when the run-end event exists in the journal AND tip verify is not "failed". Never report green to the operator, tab titles, or records until both hold.

### Verified handoffs

When relaying missions between agents, never use bare send-text (`herdr agent send` / pane send-text) — it omits Enter. Use `herdr pane run <pane> "<message>"` or `herdr notification show "<message>"`. Confirm delivery by reading the target pane afterward; never report "relayed" without read-back.

### Orient before you act — this block may be the ONLY guidance your host loaded

These same bytes are written into EVERY repository guidance file this project has, because hosts disagree
about which one they read: some load only `AGENTS.md`, some also load a repo-level guidance file, some load
a user-level one instead. **Anything stated in only one file is invisible to some agent.** So do not assume
you were handed the whole picture — list the repository root, open every guidance file present, and then:

- **Read your host's PROJECT MEMORY before starting.** Hosts that keep one store it under a per-project
  state directory keyed by the absolute working-directory path; find it and read its index plus every entry
  whose name concerns METHOD or DISCIPLINE. It holds rules that cost real defects to learn. Entries may
  predate a project rename, so **search by CONCEPT, not by the current product name.** A memory nobody opens
  is worse than none: every seat assumes the lesson is recorded somewhere and no seat looks.
- **The gates are the product.** Seven, defined in `src/graph/schema.ts`:
  `build test lint evidence scope acceptance review`. **That is DECLARATION order, not execution order** —
  the first five run as a battery that stops at its first red, then `acceptance` and `review` run
  CONCURRENTLY (`run-gates.ts:39`, _"judge ‖ review"_). The first five are MANDATORY; only `acceptance` and
  `review` may be omitted per task. Implementations are in `src/gates/` — `baseline.ts` (build/test/lint,
  diffed against a recorded baseline so pre-existing failures are forgiven), `evidence.ts`, `scope.ts`,
  `acceptance.ts` (its judge reads the DIFF and every criterion must cite a changed hunk), `review.ts`
  (cross-vendor). `run-gates.ts` drives them. **A declared gate is not a passed gate, and a gate that
  returned zero findings is not the same as a gate that ran.**
- **Spec-authoring law ships in the spec template** that `tickmarkr init` writes: the hard bounds and which
  direction each moves, what makes a criterion real, and why an absence or a source-text grep is never a
  criterion. Read it before authoring or repairing acceptance items.
- **Editing `src/gates/`, `src/compile/` or `src/graph/`?** Read `docs/codebase/ARCHITECTURE.md` first.
- **EVERY fix gets a ship/no-ship decision, recorded, at the moment it is made.** Ask one question of each
one: _does a user hit this defect?_ If yes, the fix belongs in `src/**` or `skills/**` — the only trees
the package carries (`files: [dist, schema, skills, fixtures]`). A script, overlay, config entry or
operator-side workaround that resolves the symptom **locally is not the fix; it is a decision to leave
every other user broken**, and it must say so in writing and name the condition that removes it.
**The default answer is SHIP.** A local remedy is the exception and carries the burden of proof.
Watch for the three shapes this hides in: a fix applied where you happened to be standing rather than
where the defect lives; an observation filed with a product fix named in its own text and queued
nowhere; and a local tool that quietly grows into a product feature nobody shipped. **A defect and its
fix must be recorded in the same place, or the queue silently becomes a list of things everyone assumed
someone else had shipped.**
<!-- tickmarkr:agent-docs end -->

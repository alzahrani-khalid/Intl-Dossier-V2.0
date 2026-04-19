# Phase 31: Creation Hub and Cleanup - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-18
**Phase:** 31-creation-hub-cleanup
**Areas discussed:** Hub page design, Context-aware routing, Step guidance (UX-02), Cleanup boundary

---

## Hub page design

### Q1: What's the hub's visual shape?

| Option                          | Description                                                                                   | Selected |
| ------------------------------- | --------------------------------------------------------------------------------------------- | -------- |
| Reuse DossierTypeSelector as-is | Drop existing type-selector grid onto a new page; fastest, zero design risk.                  |          |
| Rich card grid (Recommended)    | New `CreateDossierHub`: 2→3→4 col grid, icon + bilingual name + 1-line description + example. | ✓        |
| List with descriptions          | Single-column list with longer paragraphs. Text-heavy, less scannable on mobile.              |          |

**User's choice:** Rich card grid.

### Q2: How many dossier types show by default?

| Option                       | Description                                           | Selected |
| ---------------------------- | ----------------------------------------------------- | -------- |
| All 8 equal (Recommended)    | All types visible, equal prominence, fixed order.     | ✓        |
| Grouped by category          | Parties / Activities / Knowledge two-level hierarchy. |          |
| Common first, rest collapsed | Top 3–4 prominent; requires usage data to rank.       |          |

**User's choice:** All 8 equal.

### Q3: What does each hub card show?

| Option                             | Description                                                  | Selected |
| ---------------------------------- | ------------------------------------------------------------ | -------- |
| Icon + name only                   | Minimal: lucide icon + bilingual name.                       |          |
| Icon + name + 1-line (Recommended) | Icon + name + one-sentence description from `DOSSIER_TYPES`. | ✓        |
| Icon + name + line + example       | Adds an "e.g. Saudi Arabia" line; more authoring burden.     |          |

**User's choice:** Icon + name + 1-line.

### Q4: Should the hub search/filter types?

| Option                              | Description                                                    | Selected |
| ----------------------------------- | -------------------------------------------------------------- | -------- |
| No search — 8 is fine (Recommended) | 8 cards fit one mobile screen; search adds UI without benefit. | ✓        |
| Search by name                      | Top-of-page input filters cards.                               |          |

**User's choice:** No search.

---

## Context-aware routing

### Q1: What routing rule should call sites follow?

| Option                                     | Description                                                                                | Selected |
| ------------------------------------------ | ------------------------------------------------------------------------------------------ | -------- |
| Always hub                                 | Every CTA routes to `/dossiers/create`. Simplest, but extra click when context is obvious. |          |
| Context-direct, hub fallback (Recommended) | Typed call sites go direct; typeless go to hub.                                            | ✓        |
| Always direct with type argument           | Hub becomes a modal; every CTA carries a type.                                             |          |

**User's choice:** Context-direct, hub fallback.

### Q2: What about global FAB when on a non-typed page?

| Option                     | Description                                             | Selected |
| -------------------------- | ------------------------------------------------------- | -------- |
| Route to hub (Recommended) | Dashboard / tasks / notifications → `/dossiers/create`. | ✓        |
| Open modal type-picker     | FAB opens inline modal with DossierTypeSelector.        |          |

**User's choice:** Route to hub.

### Q3: Which specific call sites should become context-direct? (multiSelect)

| Option                              | Description                                                                         | Selected |
| ----------------------------------- | ----------------------------------------------------------------------------------- | -------- |
| Per-type list pages (Recommended)   | DossierListPage (filtered), EngagementsListPage, ElectedOfficialListTable → direct. | ✓        |
| Per-type empty states (Recommended) | ProgressiveEmptyState + TourableEmptyState on typed lists → direct.                 | ✓        |
| MeetingSchedule "create engagement" | MeetingSchedule section → engagements wizard direct.                                |          |
| Command Palette entries             | Per-type "Create X" commands go direct.                                             |          |

**User's choice:** Per-type list pages + per-type empty states only. MeetingSchedule and Command Palette stay hub.

### Q4: Should the hub's URL support a type preselection (?type=country)?

| Option                              | Description                                 | Selected |
| ----------------------------------- | ------------------------------------------- | -------- |
| No — hub is stateless (Recommended) | `/dossiers/create` always shows the picker. | ✓        |
| Yes — ?type=X preselects            | URL param highlights or auto-advances.      |          |

**User's choice:** No — hub is stateless.

---

## Step guidance (UX-02)

### Q1: Where does per-step guidance render?

| Option                           | Description                                                   | Selected |
| -------------------------------- | ------------------------------------------------------------- | -------- |
| Top-of-step banner (Recommended) | Dismissible HeroUI Alert at the top of each step.             | ✓        |
| Field-level tooltips             | Info icons beside labels; noisier, RTL positioning to manage. |          |
| Collapsible Tips accordion       | Always-visible accordion above form; risks being ignored.     |          |
| Banner + tooltips (hybrid)       | Both. Maximum flexibility, more surface to maintain.          |          |

**User's choice:** Top-of-step banner.

### Q2: What's the content depth for guidance copy?

| Option                         | Description                                                | Selected |
| ------------------------------ | ---------------------------------------------------------- | -------- |
| Step intent only (Recommended) | One sentence per step describing intent. Lowest cost.      | ✓        |
| Step intent + 2-3 key tips     | Intent + bulleted tips per step; ~24 bilingual bullets.    |          |
| Step intent + field examples   | Inline "e.g." examples on tricky fields; bilingual burden. |          |

**User's choice:** Step intent only.

### Q3: Should guidance be dismissible?

| Option                                  | Description                                            | Selected |
| --------------------------------------- | ------------------------------------------------------ | -------- |
| Yes — dismiss per-session (Recommended) | Close-per-session; localStorage keyed by step.         | ✓        |
| Yes — dismiss globally (per-user)       | Needs a "show help again" toggle.                      |          |
| No — always visible                     | Can't be dismissed; simpler state, more visual weight. |          |

**User's choice:** Dismiss per-session.

### Q4: Where does the guidance COPY live?

| Option                                 | Description                                         | Selected |
| -------------------------------------- | --------------------------------------------------- | -------- |
| Per-type i18n namespaces (Recommended) | Extend existing country/person/forum/… namespaces.  | ✓        |
| Wizard config (TypeScript)             | `guidanceKey`/`guidance` field in config files.     |          |
| New 'wizard-guidance' namespace        | Dedicated namespace; separates from wizard strings. |          |

**User's choice:** Per-type i18n namespaces.

---

## Cleanup boundary

### Q1: What's the file-deletion scope?

| Option                                 | Description                                                                                  | Selected |
| -------------------------------------- | -------------------------------------------------------------------------------------------- | -------- |
| Legacy wizard files only (Recommended) | Delete DossierCreateWizard + DossierCreatePage + wizard-steps/\*; leave DossierTypeSelector. | ✓        |
| Legacy + DossierTypeSelector           | Aggressive deletion; grep-verify first.                                                      |          |
| Keep old wizard, add hub alongside     | Feature-flag parallel; violates UX-03.                                                       |          |

**User's choice:** Legacy wizard files only.

### Q2: i18n keys tied to the old wizard?

| Option                                | Description                                              | Selected |
| ------------------------------------- | -------------------------------------------------------- | -------- |
| Audit and remove unused (Recommended) | Grep each key; if unused elsewhere, delete from EN + AR. | ✓        |
| Leave i18n keys alone                 | Stale keys accumulate.                                   |          |
| Move + deprecate                      | Move to deprecated section for one milestone.            |          |

**User's choice:** Audit and remove unused.

### Q3: Old wizard tests and Playwright specs?

| Option                                     | Description                                                         | Selected |
| ------------------------------------------ | ------------------------------------------------------------------- | -------- |
| Delete stale, repoint shared (Recommended) | Delete Playwright specs for the old flow; repoint shared utilities. | ✓        |
| Archive under /tests/legacy                | Move for reference; clutters repo.                                  |          |
| Delete only obviously broken               | Minimal surgery; leaves flakes.                                     |          |

**User's choice:** Delete stale, repoint shared.

### Q4: Should cleanup land as its own plan within Phase 31 (ordering)?

| Option                                   | Description                                       | Selected |
| ---------------------------------------- | ------------------------------------------------- | -------- |
| Hub → references → cleanup (Recommended) | 4 plans: hub, guidance, references, cleanup last. | ✓        |
| Cleanup first, then rebuild              | Delete old wizard first; leaves broken commits.   |          |
| Interleave per-site                      | Ref + orphan delete per commit; harder to review. |          |

**User's choice:** Hub → references → cleanup (4-plan sequence).

---

## Claude's Discretion

- Exact card visual treatment (elevation / hover / icon sizing) — follow HeroUI v3 `Card` conventions.
- Guidance Alert icon choice — non-directional (info / lightbulb) to stay RTL-safe.
- Vitest vs Playwright split for new code.
- Shape of the `useContextAwareFAB` list-route → wizard-route lookup (map vs switch).

## Deferred Ideas

- Field-level tooltips / examples inside wizard steps.
- Hub analytics.
- `DossierTypeSelector` removal (after Phase 31 verifies orphan status).
- Hub search / filter.
- Hub URL type-preselect.
- "Show help again" global toggle for guidance.

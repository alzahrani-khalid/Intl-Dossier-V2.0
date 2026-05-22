---
name: dossier-centric-link
description: >-
  Use when adding work items, API routes, or UI cards that touch dossiers.
  Enforces the dossier-centric architecture — work_item_dossiers junction,
  inheritance_source, DossierContextBadge, getDossierRouteSegment.
paths:
  - frontend/src/domains/**
  - backend/src/api/**
  - frontend/src/components/**
---

# Dossier-centric linking

Activates for work in domain code and API routes. Intl-Dossier is built around dossiers as the central organizing concept — every new feature must connect to them properly.

## The rules

1. **Every new work item links to its dossiers via the `work_item_dossiers` junction table** — never a foreign-key column directly on the work item.
2. **Always include `inheritance_source`** — one of `direct`, `engagement`, `after_action`, `position`, `mou`. Tracks how the work item came to be associated.
3. **URLs via `getDossierRouteSegment(type)`** — never hardcode `/countries/`, `/organizations/`, etc. The mapping is the only source of truth.
4. **Type validation via `isValidDossierType(type)`** before any cross-type operation.
5. **Show dossier context on work-item UI** with `<DossierContextBadge dossier={…} inheritanceSource="…" />`.
6. **Inheritance chains** resolve via `useResolveDossierContext(parentType, parentId)` — do not walk them by hand.

## When you need detail

- The 8 dossier types, the junction schema, full component usage, and worked SQL: [references/dossier-patterns.md](references/dossier-patterns.md)

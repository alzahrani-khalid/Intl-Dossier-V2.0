# Phase 28: Simple Type Wizards - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-16
**Phase:** 28-simple-type-wizards
**Areas discussed:** Type-specific fields, Reference data & auto-fill, Step structure variations, List page integration

---

## Type-Specific Fields

### Organization Details Fields

| Option            | Description                                     | Selected |
| ----------------- | ----------------------------------------------- | -------- |
| Spec only         | Keep to type, code, website                     |          |
| Add parent org    | Include parent org selector for hierarchies     |          |
| Add HQ + founding | Include headquarters location and founding date | ✓        |

**User's choice:** Add headquarters + founding — 5 fields total on Org Details step
**Notes:** User wants richer org profiles at creation time

### Person Title Input

| Option               | Description                          | Selected |
| -------------------- | ------------------------------------ | -------- |
| Free text            | Simple text input                    | ✓        |
| Dropdown with custom | Predefined titles plus custom option |          |
| You decide           | Claude's discretion                  |          |

**User's choice:** Free text — diplomatic titles are too varied for a fixed dropdown

### Topic Theme Category

| Option                   | Description                          | Selected |
| ------------------------ | ------------------------------------ | -------- |
| Dropdown from categories | Single-select from predefined themes |          |
| Tag multi-select         | Multiple theme tags per topic        |          |
| You decide               | Claude's discretion                  | ✓        |

**User's choice:** You decide — deferred to Claude's discretion
**Notes:** Recommendation: single-select dropdown from predefined categories

### Person Photo Upload

| Option               | Description                                    | Selected |
| -------------------- | ---------------------------------------------- | -------- |
| Simple file picker   | File input with thumbnail preview, no cropping | ✓        |
| File picker + crop   | Upload then crop to square/circle              |          |
| Skip photo in wizard | Add photo on detail page only                  |          |

**User's choice:** Simple file picker with thumbnail preview

---

## Reference Data & Auto-Fill

### Organization Auto-Fill

| Option                         | Description                           | Selected |
| ------------------------------ | ------------------------------------- | -------- |
| No auto-fill                   | Users enter all fields manually       | ✓        |
| Auto-fill from reference table | Look up known orgs to pre-fill fields |          |
| You decide                     | Claude's discretion                   |          |

**User's choice:** No auto-fill — organizations too diverse for a reference table

### Topic/Person Auto-Fill

| Option                         | Description                            | Selected |
| ------------------------------ | -------------------------------------- | -------- |
| No auto-fill for either        | All fields entered manually            |          |
| Topic: auto-suggest categories | Suggest theme categories from keywords |          |
| You decide                     | Claude's discretion                    | ✓        |

**User's choice:** You decide — Claude recommendation: skip auto-fill for both

---

## Step Structure Variations

### Topic Step Count

| Option       | Description                                    | Selected |
| ------------ | ---------------------------------------------- | -------- |
| Keep 2 steps | BasicInfo (theme inline) → Review              | ✓        |
| Add 3rd step | Add Topic Details between BasicInfo and Review |          |
| You decide   | Claude's discretion                            |          |

**User's choice:** Keep 2 steps — topic is genuinely simpler, no padding

### Organization Field Distribution

| Option               | Description                             | Selected |
| -------------------- | --------------------------------------- | -------- |
| One step for all 5   | All 5 fields on single Org Details step | ✓        |
| Split into two steps | Separate Identity and Profile steps     |          |

**User's choice:** One step for all 5 — manageable on a single step

---

## List Page Integration

### Create Button Pattern

| Option       | Description                                        | Selected |
| ------------ | -------------------------------------------------- | -------- |
| Same pattern | Reuse Countries list button placement and behavior | ✓        |
| Vary by type | Customize per type                                 |          |
| You decide   | Claude's discretion                                |          |

**User's choice:** Same pattern — consistency across all dossier lists

### Post-Creation Navigation

| Option       | Description                           | Selected |
| ------------ | ------------------------------------- | -------- |
| Detail page  | Navigate to new dossier's detail page | ✓        |
| Back to list | Return to list with success toast     |          |
| You decide   | Claude's discretion                   |          |

**User's choice:** Detail page — same as country wizard

---

## Claude's Discretion

- Topic theme category input type (recommendation: single-select dropdown)
- Topic/Person auto-fill (recommendation: skip)

## Deferred Ideas

None — discussion stayed within phase scope

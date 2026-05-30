# Follow-up: Replace after-action attendees comma-string with chip/tag input

Created: 2026-05-30
Origin: Wave 3 deferral (`.planning/quick/260530-w3-data-entry-per-surface-ux/PLAN.md`)
Branch context: `fix/data-entry-uiux-polish`
Priority: P2

## Problem

The after-action form stores attendees as a single comma-separated string in a
plain text input. This is brittle UX and bad data hygiene:

- No validation per attendee; a stray comma or trailing space silently creates an
  empty/garbage entry.
- No de-duplication, no per-attendee removal — the analyst must hand-edit the raw
  string.
- The value is not linkable to a real contact/person record, so attendees can't be
  resolved to dossiers or reused.

## Desired state

Replace the comma-string text input with a chip/tag input that:

1. Renders each attendee as a removable chip (token-bound `Badge`-style, per the
   IntelDossier prototype — no new variants).
2. Provides a typeahead backed by a contact/person source (e.g. the persons /
   elected-officials dossier records, or a contacts endpoint) so attendees resolve
   to known entities where possible, with a free-text fallback for ad-hoc names.
3. Stores attendees as a structured array (id + display name) rather than a single
   string, migrating the persisted shape.
4. Works in RTL (chips flow right-to-left; logical properties only) and meets the
   44x44 touch target on < 768px.

## Open questions / dependencies

- Which source backs the typeahead (persons dossiers vs. a dedicated contacts API)?
- Persisted-shape migration: how to read back existing comma-string records without
  data loss (parse-on-read shim vs. one-time backfill).

## Touch points

- After-action form component (attendees field) and its types
- Contact/person typeahead data source (hook + repository)
- Any read path that currently splits the attendees comma-string

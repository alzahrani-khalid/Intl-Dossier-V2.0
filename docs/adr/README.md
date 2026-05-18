# Architecture Decision Records

This directory holds Architecture Decision Records (ADRs) for cross-cutting
engineering decisions in the Intl-Dossier codebase. An ADR captures the
context, the decision, and the consequences of a non-obvious architectural
choice so future contributors can recover the reasoning without re-deriving
it from code or chat history.

ADRs in this directory are durable architectural rules. Phase-scoped
deviation-closure trails live under `.planning/phases/<phase>/` and link
back to the top-level ADR they implement.

## Numbering convention

Files are named `NNNN-kebab-case-slug.md`, where `NNNN` is a four-digit
zero-padded sequence starting at `0001`. Numbers are assigned in the order
ADRs land on `main`; gaps are not back-filled. The slug is a short,
lowercase, hyphen-separated summary of the decision (for example,
`0001-mobile-dnd-scope-out.md`).

## ADR template

Each ADR uses the Michael Nygard format
(https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions)
with the following section order:

1. `# NNNN — Title` (one-line, sentence case)
2. `## Status` — one of `Proposed`, `Accepted`, `Deprecated`,
   `Superseded by NNNN`, followed by the date in `YYYY-MM-DD` form
3. `## Context` — the forces in play, the existing constraints, and the
   problem being solved
4. `## Decision` — the choice that was made, in active voice
5. `## Consequences` — what becomes easier and what becomes harder; any
   reopen clause that specifies under what conditions the decision should
   be revisited
6. `## References` — links to phase plans, verification reports, source
   files, and any related ADRs

## Index

| Number | Title                             | Status                |
| ------ | --------------------------------- | --------------------- |
| 0001   | Mobile DnD scope-out for TasksTab | Accepted (2026-05-18) |

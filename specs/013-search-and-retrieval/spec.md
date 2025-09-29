# 013 — Search & Retrieval — Spec

Purpose: expand search coverage and add semantic suggestions.

## Goals

- Include dossiers, contacts/people, engagements, and positions in global search.
- Typeahead suggestions by entity type; filters.
- Optional semantic search (vector) for briefs/positions/documents.

## UX

- Global omnibox: entity filters, keyboard navigation, bilingual snippets.
- Results tabs: All, Dossiers, People, Engagements, Positions, MoUs, Documents.

## API

- Extend `/api/search` to return above entities; add `type` filter.
- `GET /api/search/suggest?type=...&q=...` unified endpoint.
- `/api/search/semantic` for vector queries (optional).

## AI

- Vector embeddings via existing vector.service for docs/briefs/positions.
- “People also looked for” co‑click suggestions.

## Acceptance

- Query returns mixed entities with correct counts; suggestions appear <200ms (cached).

# Phase 84: Copy / Marketing Voice - Context

**Gathered:** 2026-07-05
**Status:** Ready for planning
**Source:** Direct (requirement COPY-01 / finding F15 is crisp; trivial copy-edit phase — no discuss/research needed)

<domain>
## Phase Boundary

Copy-edit marketing voice out of the English i18n source strings, then mirror the corrected
tone into the Arabic strings (`en` drives `ar`). Scope is exactly four namespaces under
`frontend/src/i18n/en/` (+ their `frontend/src/i18n/ar/` mirrors):
`empty-states.json`, `guided-tours.json`, `relationships.json`, `progressive-disclosure.json`.

**Values only — never keys.** `frontend/src/i18n/label-parity.test.ts` asserts en/ar key
parity; edit string VALUES, do not add/remove/rename keys, and keep en↔ar key sets identical.

Out of scope: any other i18n namespace, component copy, non-`en`-driven translations, and the
F16–F21 taste calls (Phase 85).
</domain>

<decisions>
## Implementation Decisions (locked)

### D-84-01 — Exclamation marks → sentence-case (empty-states.json + guided-tours.json only)

Remove exclamation marks from user-visible copy in these two files (7 in empty-states, 14 in
guided-tours) and reword to calm sentence-case per CLAUDE.md voice rules (no marketing tone,
sentence case for titles/buttons). e.g. "You're all caught up!" → "You're all caught up.";
"Welcome to Dossiers!" → "Welcome to Dossiers"; "Let's Go!" → a calm CTA ("Get started" /
"Continue"). `relationships.json` and `progressive-disclosure.json` are NOT in the `!` sweep
(they carry only the "discover" issue below).

### D-84-02 — "Discover"/"discover" removed (guided-tours, relationships, progressive-disclosure)

Reword the banned "Discover"/"discover" occurrences to neutral verbs (e.g. "Explore",
"See", "Find", "View", "Browse") that keep meaning without marketing tone:

- `guided-tours.json`: L59 "…to discover hidden connections…", L101 "Discover how to create relationships…"
- `relationships.json`: L35 "Discover hidden patterns across your data."
- `progressive-disclosure.json`: L21 "Return later to discover advanced features"

### D-84-03 — "easily accessible" + "easy discovery" reworded (empty-states.json)

- L37 "…keep all your important files organized and easily accessible." → drop "easily"
  (e.g. "…organized and accessible.").
- L287 "Add tags and link to relevant dossiers for easy discovery." → reword off "easy
  discovery" (e.g. "…to make them easier to find." — note: "easier" is acceptable; the banned
  token is the marketing "Easily"/"discover" pairing — use judgment, keep it plain).

### D-84-04 — "Let us show you around" removed (guided-tours.json)

L17 "New here? Let us show you around!" → drop the "Let us show you around" marketing phrasing
AND the `!` (e.g. "New here? Start with a quick tour." or a plain equivalent).

### D-84-05 — en drives ar (mirror the corrected tone)

For every en value changed above, update the corresponding `frontend/src/i18n/ar/<file>.json`
value so the Arabic reads in the same calm register: remove Arabic exclamation marks where the
en `!` was dropped, and reword the Arabic marketing equivalents (e.g. Arabic "اكتشف" for
"Discover"). Keep Tajawal/RTL correctness. Do not touch ar keys.

### D-84-09 — False-positive carve-out (DO NOT TOUCH)

`frontend/src/i18n/en/duplicate-detection.json:52` — "This action cannot be **easily** undone…"
is a legitimate destructive-action warning, NOT marketing voice. Leave it byte-untouched. The
COPY-01 verification grep must whitelist it (it is the named false positive in the success
criterion). Any other legitimate `!`/"easily" in NON-target namespaces is likewise out of scope.

### Claude's Discretion

Exact replacement wording (as long as it is plain, sentence-case, no `!`, no banned tokens,
preserves meaning, and keeps en/ar key parity). Whether "easier"/"Explore"/"See" etc. is the
best neutral verb per string.
</decisions>

<canonical_refs>

## Canonical References

**Downstream agents MUST read these before planning or implementing.**

- `DESIGN-REFINEMENT-PLAN-260704.md` §4 (Phase 4 / F15) + §7 sign-off — the source of truth
- `CLAUDE.md` "No marketing voice" rules — banned: "Discover", "Easily", "Unleash", exclamation
  marks, "you're in!", first-person plural ("we"); sentence case for titles/buttons
- `frontend/src/i18n/label-parity.test.ts` — the en/ar key-parity gate (must stay green)
- `.planning/REQUIREMENTS.md` COPY-01 — the requirement text

</canonical_refs>

<specifics>
## Specific Ideas

Verification (COPY-01 success criteria):

1. `grep -rInE "discover|easily|unleash" frontend/src/i18n/en/` returns ONLY
   `duplicate-detection.json` ("cannot be easily undone") — the whitelisted false positive.
2. `empty-states.json` + `guided-tours.json` contain no user-visible `!` (grep the two files).
3. The `ar/` mirrors of all four files follow the corrected en (no orphaned `!`/marketing tone).
4. `label-parity.test.ts` passes (en/ar key sets unchanged); type-check + lint green.
   </specifics>

<deferred>
## Deferred Ideas

None — COPY-01 is fully covered. F16–F21 taste calls are Phase 85 (separate).
</deferred>

---

_Phase: 84-copy-marketing-voice_
_Context gathered: 2026-07-05 (direct — trivial copy-edit phase)_

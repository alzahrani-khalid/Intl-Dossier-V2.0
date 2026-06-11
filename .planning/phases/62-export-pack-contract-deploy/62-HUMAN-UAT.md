---
status: partial
phase: 62-export-pack-contract-deploy
source: [62-VERIFICATION.md]
started: 2026-06-11T13:35:00Z
updated: 2026-06-11T13:35:00Z
---

## Current Test

[awaiting human testing]

## Tests

### 1. Popup-blocker fallback delivers the pack as a download

expected: In Chrome with popups blocked for the staging origin, triggering Export from the dossier export dialog produces a `.html` blob download and shows the `popupBlocked` notice. After allowing popups and re-exporting, a new tab opens with the generating placeholder and then renders the briefing pack.
result: [pending]

### 2. Print pagination of an exported pack (Cmd+P)

expected: Opening any exported pack and printing (Cmd+P) shows the cover page on page 1, each section starting on its own page, table rows unsplit across page breaks, and the amber section-error block (if present) unsplit and legible in grayscale.
result: [pending]

## Summary

total: 2
passed: 0
issues: 0
pending: 2
skipped: 0
blocked: 0

## Gaps

---
phase: 84
phase_name: copy-marketing-voice
status: passed
verified_by: orchestrator-inline
date: 2026-07-05
requirements: [COPY-01]
---

# Phase 84 Verification — Copy / Marketing Voice

**Status:** passed
**Method:** goal-backward, fact-checked against the working tree (not summaries). The phase's
success criteria ARE grep/test gates, so verification was run inline rather than via a
subagent (proportionate to a trivial 8-file copy edit).

## Success criteria (COPY-01 / F15)

| #   | Criterion                                                                                             | Evidence                                                                                                                                                                                   | Result |
| --- | ----------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------ |
| 1   | Marketing voice removed from `i18n/en`; `grep discover\|easily\|unleash` returns only false positives | `grep -rliE "discover\|easily\|unleash" frontend/src/i18n/en/` → **only `duplicate-detection.json`** (the named destructive-warning false positive, D-84-09)                               | ✅     |
| 2   | `empty-states.json` + `guided-tours.json` read as sentence-case, no exclamation marks                 | `grep -c '!'` → **0** for both en AND both ar mirrors                                                                                                                                      | ✅     |
| 3   | The `ar` strings follow the corrected `en` source                                                     | ar mirrors edited on the same changed-en keys only (اكتشف/دعنا نعرفك/هيا بنا → للعثور/تعرف/لنبدأ); legitimate `ar` "اكتشاف التعارضات" (conflict detection, en not in scope) left untouched | ✅     |
| 4   | No key drift; parity gate green                                                                       | en↔ar leaf-key parity all 4 pairs: empty-states 318/318, guided-tours 157/157, relationships 210/210, progressive-disclosure 92/92 — **PARITY OK**; `label-parity.test.ts` 2/2 pass        | ✅     |
| 5   | Standing gates green                                                                                  | `(cd frontend && pnpm type-check)` exit 0; `pnpm lint` clean (eslint+i18n+duplicate-rtl+bootstrap-parity+date)                                                                             | ✅     |
| 6   | False-positive carve-out untouched                                                                    | `duplicate-detection.json` (en+ar) not in the 84-01 commit range — byte-untouched                                                                                                          | ✅     |

## Deviations

None. Plan 84-01 executed exactly as written.

## Commits

- `4613b67c` — copy-edit marketing voice out of four en i18n namespaces
- `92621dd7` — mirror calm register into four ar i18n namespaces
- `a24e7edb` — SUMMARY + STATE + ROADMAP + REQUIREMENTS (COPY-01 complete)

## Conclusion

COPY-01 met. Marketing voice ("Discover", "easily accessible", "Let us show you around",
exclamation marks) removed from the four `en` namespaces and mirrored into `ar`, with the
`duplicate-detection.json` destructive-warning false positive correctly preserved and en/ar
key parity intact. **Phase 84 complete.**

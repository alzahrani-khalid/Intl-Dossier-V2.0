# D-38 human checkpoint — the six surfaces the operator actually saw

Captured live under `?lng=ar` in a signed-in staging session on **2026-09-02 13:52 local**, and shown
to the operator as the D-38 Arabic sign-off gate for Phase 99.

**The operator's answer, verbatim:** `it reads as arabic`
— Khalid Alzahrani, 2026-09-02 (RULING-P99-544; carried into run
`run-20260902-182826-0000000000000073` as `task-approved P99-41` at 18:47:49.376Z).

| file | surface |
| --- | --- |
| `1-404.png` | 404 page |
| `2-intake-queue.png` | intake queue |
| `3-search-chips.png` | search chips |
| `4-dated-calendar.png` | dated calendar surface |
| `5-activity-relative.png` | `/activity` relative time |
| `6-position-banner.png` | published position banner |

**Why these are committed here.** They were produced into `.tickmarkr/overseer/`, which is gitignored
and survives no clone. `99-41-SUMMARY.md` and `99-VERIFICATION.md` cite a `claude.ai` artifact as where
they were published; **that link no longer resolves** (RULING-P99-555). The images are the surviving
primary record, so they are tracked here rather than left on one machine.

These are a record of what was shown, not evidence that anything passed. The gate's outcome is the
operator's sentence above; the rendered assertions live in the phase's own specs.

---

**If you re-add these files, you need `git add -f`.** `.gitignore:164` carries a global `*.png` rule,
so a plain `git add` on this directory silently stages the README and skips every image — which is
exactly how the first attempt at this commit produced a README describing six files that were not
there. The ignore rule was left in place deliberately (the repo does not want stray screenshots) and
these six are force-added as a scoped exception.

# Plan 19-02 — Live Self-Test

Manifest ↔ table parity sampled against three phases after `roadmap sync-progress`
ran twice against `.planning/ROADMAP.md`.

| Phase | Disk PLAN.md count | Disk SUMMARY.md count | Table cell | Status cell | Match |
| ----- | ------------------ | --------------------- | ---------- | ----------- | ----- |
| 14    | 3                  | 3                     | 3/3        | Complete    | ✓     |
| 16    | 4                  | 4                     | 4/4        | Complete    | ✓     |
| 18    | 4                  | 4                     | 4/4        | Complete    | ✓     |

## Idempotency

```
$ cp .planning/ROADMAP.md /tmp/r1.md
$ node bin/gsd-tools.cjs roadmap sync-progress
$ diff -q /tmp/r1.md .planning/ROADMAP.md
(silent — byte-identical)
```

## Marker count

```
$ grep -c "gsd:progress" .planning/ROADMAP.md
2
```

## Pre-`## Progress` byte-preservation

```
$ diff <(sed -n '1,166p' /tmp/r0-original.md) <(sed -n '1,166p' .planning/ROADMAP.md)
(silent — byte-identical)
```

## Notable disk-driven correction (DEBT-02 working as designed)

Phase 16 (Email & Push Channels) was previously hand-recorded as `3/3` in the
ROADMAP table; disk inventory shows `4/4`. `sync-progress` automatically
corrected the table during bootstrap, eliminating the drift the plan was
designed to prevent.

## Test suite

7/7 tests green:

```
ok   1. bootstrap: markers absent → inserted, outside content preserved
ok   2. replace: markers present, stale body → fresh table written
ok   3. idempotency: second run byte-equal to first
ok   4. byte-preservation: hash of pre/post-marker slices unchanged
ok   5. single-marker error: only start marker → throws
ok   6. manifest-derived rows: status vocabulary matches counts
ok   7. no checkbox parsing: `- [x]` in PLAN.md ignored
```

# P99-47 Summary — strict production/test population policy repaired

## Outcome

GREEN. The strict instrument now applies one production-source predicate before collecting files
for either the mask or raw-key class. It excludes every file whose basename contains `.test.` and
every file below a `__tests__` path, while continuing to include ordinary TypeScript production
sources. The repaired unscoped walk contains 1,532 production TypeScript files, independently
excludes a nonempty population of 182 test TypeScript files, and reports zero unresolved sites in
both classes and both locales with both audited totals nonzero.

The task started from `6cfe9e42e93a25e3df5cd75d0289f9f84293ec26`. At that baseline, before the
policy change, the unscoped instrument scanned 1,714 files and reported the remaining test-only
residue: 1 unresolved mask and 12 unresolved raw-key sites in each locale. This was the expected
RED test-population defect from `99-30-RED-HANDOFF.md` §4, not production repair work.

## Policy change and positive control

`scripts/i18n-audit-strict.mjs` now owns one `isProductionSourcePath` predicate. The recursive
walker uses that predicate for directories and TypeScript files, so a `__tests__` subtree is never
entered and a colocated `*.test.*` file is never collected. Both audit classes consume the same
already-filtered `sources` array; no resolver, namespace binding, matcher, or locale rule changed.

`--self-check` directly evaluates all three required path polarities. The relevant emitted fixture
and checks were:

```json
{
  "fixture": {
    "sourcePolicy": {
      "production": {
        "path": "self-check/FeaturePanel.tsx",
        "included": true
      },
      "colocatedTest": {
        "path": "self-check/FeaturePanel.test.tsx",
        "included": false
      },
      "testsDirectory": {
        "path": "self-check/__tests__/FeaturePanel.tsx",
        "included": false
      }
    }
  },
  "checks": {
    "productionSourceIncluded": true,
    "testFileExcluded": true,
    "testsDirectoryExcluded": true
  }
}
```

The complete self-check returned `"selfCheck": "PASS"`, `"passed": true`, and every pre-existing
binding/resolution check also remained `true`. Thus the exclusions are directly discriminated and
are not inferred from a clean live audit.

## Independent live census and exact scan equality

The plan oracle independently walked `frontend/src` with `fs.readdirSync`/`fs.statSync`, excluded
`node_modules` and `i18n`, counted files below `__tests__` separately, and classified remaining
`.tsx?` files by the independent `/\.test\./` basename rule. It then required a nonempty excluded
population, a nonempty production population, unscoped audit output, and exact equality between
the independent production count and `scannedFiles`.

Verbatim success output:

```text
P99-47-POLICY-OK production=1532 excludedTests=182
```

Therefore `1532 === scannedFiles`, and the 182 exclusions are live population evidence rather
than an assumption derived from zero unresolved sites.

## Unscoped nonempty zero proof

The unscoped command was:

```sh
node scripts/i18n-audit-strict.mjs "$PWD" --json
```

Its relevant top-level output was:

```json
{
  "scannedFiles": 1532,
  "scope": [],
  "locales": ["en", "ar"],
  "twoArgTotal": 2073,
  "literalTwoArgTotal": 1760,
  "optionsDefaultTotal": 313,
  "rawKeyTotal": 6490,
  "nonKeyTotal": 0,
  "twoArgUnresolved": 0,
  "rawKeyUnresolved": 0,
  "twoArgUnresolvedEn": 0,
  "rawKeyUnresolvedEn": 0,
  "twoArgUnresolvedAr": 0,
  "rawKeyUnresolvedAr": 0,
  "sites": 0
}
```

This proves the production audit is unscoped and nonempty in both independently reported classes,
and that English and Arabic are each zero-unresolved for masks and raw keys.

## Ownership and preservation boundary

- P99-45 owns and retains credit for repairing the 30 production mask misses across 18 files.
- P99-46 owns and retains credit for repairing the 35 production raw-key misses across 12 files.
- P99-47 changed only population classification. It authored no locale value, repaired no source
  binding, deleted no call/default, and receives no credit for either production repair.
- Relative to the task baseline, the only changed paths are
  `scripts/i18n-audit-strict.mjs` and this SUMMARY. The command below prints no path, so locale
  data and production/test source remain byte-untouched:

  ```sh
  git diff --name-only 6cfe9e42e93a25e3df5cd75d0289f9f84293ec26 -- frontend/src
  ```

- P99-30 remains the independent verification-only gatekeeper. This predecessor proves the strict
  instrument is ready for its fresh rerun; it does not itself approve P99-30 or open deletion
  lanes.

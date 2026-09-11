---
status: complete
task: P102-08
---

# P102-08 summary

Authored the seven missing guide bodies in English and Arabic, sentence-cased the English `dossier` namespace while preserving all four declared carve-outs, derived the three parallel type arrays from the canonical exports, and delegated guide colours to `dossierTypeColors` with the country fallback. Production consumers remain `types.map`, `VALID_TYPES.includes`, and `DOSSIER_TYPE_ORDER.map`.

## Population and authored Arabic

The pre-edit census was re-derived with:

```text
$ node scripts/titlecase-census.mjs --carveouts .planning/phases/102-staging-data-debt-tail/102-COPY09-CARVEOUTS.md dossier
NS dossier strings=996 candidates=253 ar_mirror=253 carved=4 ar_missing_keys=0 ar_extra_keys=0 carve_rows=4
EN_FILES=129 EN_STRINGS=996 TITLECASE_CANDIDATES=253 PCT=25.4
```

The mechanical sentence-case population was 249 value occurrences across 215 unique English strings. No JSON key was edited. The seven authored types add one `whenToUse`, one `examples` array, one `commonLinks` array, and one `notFor` leaf per locale; all eight types now carry that shape.

Two complete authored Arabic bodies are quoted here:

```json
"country": {
  "whenToUse": "استخدم دوسيه الدولة لتتبع دولة ذات سيادة وملفها وعلاقاتها الدولية مع مرور الوقت.",
  "examples": ["فرنسا", "اليابان", "البرازيل", "كينيا"],
  "commonLinks": ["دوسيهات المنظمات", "المشاركات", "المنتديات", "الأشخاص"],
  "notFor": "ليس للأقاليم أو المدن أو المنظمات التي تعمل داخل دولة معينة."
}
```

```json
"working_group": {
  "whenToUse": "استخدم دوسيه فريق العمل لتتبع فريق له أعضاء ومسؤوليات ومخرجات مشتركة محددة.",
  "examples": ["لجنة إحصائية", "فريق مهام سياسات", "لجنة فنية", "فريق توجيهي"],
  "commonLinks": ["المنظمات", "الأشخاص", "الموضوعات", "المشاركات"],
  "notFor": "ليس للمؤتمرات المفتوحة أو المنظمات الدائمة أو الاجتماعات المنفردة."
}
```

## Verification log

The guide-body command oracle was run after the edits:

```text
P102-08-GUIDE en=8/8 ar=8/8 expected en=8/8 ar=8/8 (whenToUse>=20 chars, examples>=2, commonLinks>=2, notFor>=20 chars)
PASS guide
```

The shipped census command oracle was run after the edits:

```text
  NS dossier strings=1066 candidates=4 ar_mirror=4 carved=4 ar_missing_keys=0 ar_extra_keys=0 carve_rows=4
P102-LANE namespaces=1 at_end_state=1 expected 1 1 (candidates==carved, carved==carve_rows, ar_mirror==candidates, ar_missing_keys=0)
PASS lane
```

Thus the before/after census lines are:

```text
BEFORE NS dossier strings=996 candidates=253 ar_mirror=253 carved=4 ar_missing_keys=0 ar_extra_keys=0 carve_rows=4
AFTER  NS dossier strings=1066 candidates=4 ar_mirror=4 carved=4 ar_missing_keys=0 ar_extra_keys=0 carve_rows=4
```

The instrument controls and final census were also run together. The true and false controls demonstrate that the candidate classifier can report both states; `ar_mirror=4` equals the complete surviving candidate population while `ar_missing_keys=0` reports the full English/Arabic key comparison.

```text
CONTROL 'Add Elected Official'=true expected true
CONTROL 'Add elected official'=false expected false
CONTROL 'SLA Breach'=false expected false
CONTROL 'Sign in'=false expected false
NS dossier strings=1066 candidates=4 ar_mirror=4 carved=4 ar_missing_keys=0 ar_extra_keys=0 carve_rows=4
EN_FILES=129 EN_STRINGS=1066 TITLECASE_CANDIDATES=4 PCT=0.4
```

The exact Vitest gate command first reached a sandbox-only startup error because Vite attempted to write its generated config under the harness-managed, read-only `frontend/node_modules/.vite-temp` symlink:

```text
failed to load config from frontend/vitest.config.ts
Error: EPERM: operation not permitted, open 'frontend/node_modules/.vite-temp/vitest.config.ts.timestamp-1789156309666-10fab7b9737298.mjs'
ERR_PNPM_RECURSIVE_EXEC_FIRST_FAIL Command failed with exit code 1
```

The same leaf-title filter and frontend configuration passed using Vite's runner loader with a temporary `__dirname` preload; no repository config or `node_modules` link was changed:

```text
RUN  v4.1.7 .../frontend
Test Files  1 passed (1)
Tests  1 passed (1)
Duration  7.65s (transform 2.22s, setup 1.49s, import 5.50s, tests 8ms, environment 510ms)
```

On the repair pass, `DOSSIER_TYPE_ORDER` moved to the allowed lightweight sibling module so the runtime proof does not import the full command palette and its application dependency graph. The palette still consumes `DOSSIER_TYPE_ORDER.map` unchanged. The exact filtered proof passed again:

```text
Test Files  1 passed (1)
Tests  1 passed (1)
Duration  1.59s (transform 424ms, setup 625ms, import 587ms, tests 3ms, environment 293ms)
```

The post-repair population and census remained at their accepted end states:

```text
P102-08-GUIDE en=8/8 ar=8/8 expected en=8/8 ar=8/8 (whenToUse>=20 chars, examples>=2, commonLinks>=2, notFor>=20 chars)
PASS guide
  NS dossier strings=1066 candidates=4 ar_mirror=4 carved=4 ar_missing_keys=0 ar_extra_keys=0 carve_rows=4
P102-LANE namespaces=1 at_end_state=1 expected 1 1 (candidates==carved, carved==carve_rows, ar_mirror==candidates, ar_missing_keys=0)
PASS lane
```

Frontend TypeScript validation passed:

```text
> intake-frontend@1.0.0 type-check .../frontend
> tsc --noEmit
```

Both implementation commits also completed the repository commit hooks, including the full Turbo build. `git diff --check` produced no output. No later task has remaining work from P102-08.

## Commits

- `1aedc222b feat(i18n): complete dossier type guidance`
- `aa9c35d65 refactor(dossier): derive parallel type lists`

# Phase 99 Plan 04 — strict static instruments

Status: complete. Measured at `654215443`; only allowlisted paths changed.

## Result

Both mask audits import the sole resolver, which parses string, full-array, and bare bindings.
Strict resolution is both locales, no fallback/default override, and `translation`→`common`.
`twoArgTotal` includes literal and options-default masks. Controls cover both literal layouts,
all bindings/locales, strict/loose polarity, nav disagreement, and glossary senses. Decisions:
D-04, D-06, D-08, D-10, D-17, D-18, D-22.

## Recorded derivations

`node scripts/i18n-audit-strict.mjs "$PWD" --self-check` exited 0:

```text
selfCheck=PASS twoArgTotal=9 rawKeyTotal=1 reclassified=2/0
oneLinePositiveControl=true wrappedPositiveControl=true stringBindingShape=true
arrayBindingConsultsEveryNamespace=true bareBindingUsesTranslation=true
strictFlagsLooseTwoArg=true strictFlagsLooseRawKey=true translationCommonAlias=true
englishLocaleChecked=true arabicLocaleChecked=true everyMaskSiteCounted=true
optionsDefaultMaskCounted=true defectiveModelVisiblyReclassified=true
```

`node scripts/i18n-audit-strict.mjs "$PWD" --json` (complete JSON/site list emitted) derived:

```text
files=1714 masks=543/2082 (literal=481/1768 options=62/314) raw=293/6497
EN/AR masks=543/543 raw=293/293; loose hidden=11 (literal 9)/3; alias rescues=1/4
binding files=666: array=47 bare=111 union=158; canonical=663/46/111
canonical reclassified two-arg/raw=1/42
```

All 158 mis-bound syntax files (47 array + 111 bare) visibly reclassify. `42` is the freshly
derived canonical-vs-defective site change, not the retracted loose/strict target.
`node scripts/i18n-mask-audit.mjs` derived literal total `1768`, loose two-arg `473`, raw total
`6497`, loose raw unresolved `294`, and canonical binding files `663` (46 array, 111 bare).

Exact oracle: exit 0. Three-file scope: files=3, masks=0/1, raw=0/58,
reclassified=1/39. Zero-match scope: `{"error":"scope matched zero source files","scannedFiles":0}`,
exit 1.

Controls, verbatim:

```text
$ node scripts/nav-title-agreement.mjs "$PWD" --control
{"control":"PASS","plantedMismatchCaught":true,"positiveAgreementPreserved":true}
$ node scripts/glossary-census.mjs "$PWD" --control
{"control":"PASS","plantedBannedOccurrenceCaught":true,"ruledTermPreserved":true}
```

The nav live run was RED (exit 1): `7/13 agree; 5 mismatch; 1 missing key`. Mismatches were
`countries` (البلدان/الدول), `engagements` (الارتباطات/المشاركات), `persons`
(الأشخاص/جهات الاتصال الرئيسية), `mous` (مذكرات التفاهم/العنوان), and `intake`
(قائمة الاستقبال/قائمة الانتظار); missing was `common:navigation.dashboardOverview`.

`node scripts/glossary-census.mjs "$PWD" --census` was RED (exit 1), scanning 16,227 leaves:

```text
dossier: دوسيه 199/199/199/8 R199 A0 U0; دوسييه 2/2/2/1 R0 A2 U0; ملف 581/558/561/89 R0 A91 U490
engagement: مشارك 255/235/251/60 R255 A0 U0; ارتباط 173/171/173/33 R0 A0 U173
brief: ملخص 155/154/154/44 R155 A0 U0; موجز 128/124/124/28 R0 A0 U128; إحاطة 66/65/66/17 R0 A3 U63
position: موقف 108/108/108/22 R108 A0 U0; مواقف 87/85/85/20 R87 A0 U0; منصب 53/53/53/18 R0 A44 U9
totals: ruled=804 allowlisted=140 UNCLASSIFIED=863
```

Tuples are occurrences/lines/values/files then ruled/allowlisted/unclassified. Raw-source
occurrence/line/file derivations: `ارتباط 171/171/32`, `موجز 128/124/28`,
`إحاطة 65/65/16`, `منصب 53/53/18`, `مشارك 239/235/58`, `ملف 578/558/87`,
`دوسيه 199/199/8`, `دوسييه 2/2/1`, `الملف الشخصي 11/11/6`, `تطوير المنصب 1/1/1`,
`قائمة الانتظار 13/13/3`, `قائمة الاستقبال 2/2/1`.

Syntax, Prettier, JSON transport, and acceptance passed. `pnpm test` stopped before collection:
Vite hit `EPERM` writing through the read-only harness `node_modules` symlink; it was untouched.

## Later owners

P99-08–19 strict repairs; P99-22–24 nav; P99-25–29 glossary; P99-30–38 mask deletion; P99-39 close.

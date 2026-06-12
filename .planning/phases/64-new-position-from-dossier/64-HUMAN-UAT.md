---
status: complete
phase: 64-new-position-from-dossier
source: [64-VERIFICATION.md]
started: 2026-06-12T15:10:00Z
updated: 2026-06-12T15:25:00Z
---

## Current Test

[complete — all items resolved during the 64-06 live UAT session]

## Tests

### 1. EN-locale form rendering (picker options, per-field direction, audience checkboxes, disabled-until-valid)

expected: Position-type picker shows real types with Standard Position default; title_ar renders dir=rtl with Tajawal even in EN locale; All Staff prechecked; submit disabled until both titles valid
result: passed — verified live on staging during 64-06 (same session that created both verification positions). Evidence: dialog-defaults screenshot (/tmp/uat64-2-dialog-defaults.png), computed-style probe (`title_ar` dir=rtl + Tajawal, `title_en` dir=ltr + Inter), submit observed `[disabled]` before fill and enabled after both titles were valid.

### 2. AR-locale labels, RTL layout, Arabic validation messages

expected: document dir=rtl with Tajawal; all dialog labels Arabic from positions.json ar; audience names show name_ar; title_en still dir=ltr; touched-empty required field shows Arabic validation message
result: passed — verified live during 64-06. Evidence: AR dialog screenshot (/tmp/uat64-9-ar-dialog.png), label dump (نوع الموقف / العنوان (إنجليزي|عربي) / المحتوى / مجموعات الجمهور / جميع الموظفين / الإدارة), submit = إنشاء موقف, `title_en` dir=ltr confirmed, validation message "العنوان العربي مطلوب" observed after touch-and-empty of title_ar.

## Summary

total: 2
passed: 2
issues: 0
pending: 0
skipped: 0
blocked: 0

## Gaps

(none)

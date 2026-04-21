#!/usr/bin/env bash
# Phase 34 deletion sweep CI gate.
# Exits 0 if ZERO stale references to deleted components / routes / shims.
# Exits 1 and prints matching lines if ANY reference remains.
set -euo pipefail

PATTERNS=(
  "from.*language-toggle/LanguageToggle"
  "from.*language-switcher/LanguageSwitcher"
  "from.*language-switcher/language-switcher"
  "from.*pages/Themes"
  "from.*hooks/useTheme"
  "from.*components/ui/theme-toggle"
  "from.*theme-provider/theme-provider"
  "from.*theme-provider/useTheme"
  "from.*theme-selector/ThemeSelector"
  "to=[\"']/themes[\"']"
  "navigate\\(['\"]/themes['\"]"
)

FAIL=0
for p in "${PATTERNS[@]}"; do
  if grep -rn --include="*.ts" --include="*.tsx" -E "$p" frontend/src 2>/dev/null; then
    echo "FAIL: stale reference matching /$p/" >&2
    FAIL=1
  fi
done

# Soft-reference check: navigationData.ts line containing /themes nav entry
if grep -n "path: '/themes'" frontend/src/components/modern-nav/navigationData.ts 2>/dev/null; then
  echo "FAIL: /themes nav entry still present in navigationData.ts" >&2
  FAIL=1
fi

if [ "$FAIL" -eq 0 ]; then
  echo "OK: zero references to deleted Phase 34 components/routes/shims"
fi
exit "$FAIL"

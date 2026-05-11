#!/usr/bin/env bash
# Phase 34 + 36 deletion sweep CI gate.
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
  # Phase 36 shell-chrome deletions (D-01, D-04, D-05)
  "from.*layout/MainLayout"
  "from.*layout/AppSidebar"
  "from.*layout/SiteHeader"
  "from.*layout/MobileBottomTabBar"
)

# Filesystem presence check — these legacy Phase-36 shell files MUST remain deleted
PHASE_36_DELETED_FILES=(
  "frontend/src/components/layout/MainLayout.tsx"
  "frontend/src/components/layout/AppSidebar.tsx"
  "frontend/src/components/layout/SiteHeader.tsx"
  "frontend/src/components/layout/MobileBottomTabBar.tsx"
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

for f in "${PHASE_36_DELETED_FILES[@]}"; do
  if [ -f "$f" ]; then
    echo "FAIL: Phase-36 deleted file reappeared: $f" >&2
    FAIL=1
  fi
done

if [ "$FAIL" -eq 0 ]; then
  echo "OK: zero references to deleted Phase 34 + 36 components/routes/shims"
fi

# ============================================================================
# Phase 39 kanban-calendar deletions (D-04) — activated 39-09
# ============================================================================
PHASE_39_PATTERNS=(
  "from.*components/unified-kanban/UnifiedKanbanBoard"
  "from.*components/unified-kanban/EnhancedKanbanBoard"
  "from.*components/unified-kanban/UnifiedKanbanCard"
  "from.*components/unified-kanban/UnifiedKanbanColumn"
  "from.*components/unified-kanban/UnifiedKanbanHeader"
  "from.*components/unified-kanban/utils/swimlane-utils"
  "from.*components/unified-kanban/utils/wip-limits"
  "from.*components/ui/kanban"
)
PHASE_39_DELETED_FILES=(
  "frontend/src/components/unified-kanban/UnifiedKanbanBoard.tsx"
  "frontend/src/components/unified-kanban/EnhancedKanbanBoard.tsx"
  "frontend/src/components/unified-kanban/UnifiedKanbanCard.tsx"
  "frontend/src/components/unified-kanban/UnifiedKanbanColumn.tsx"
  "frontend/src/components/unified-kanban/UnifiedKanbanHeader.tsx"
  "frontend/src/components/unified-kanban/utils/swimlane-utils.ts"
  "frontend/src/components/unified-kanban/utils/wip-limits.ts"
  "frontend/src/components/ui/kanban.tsx"
)
for p in "${PHASE_39_PATTERNS[@]}"; do
  MATCH=$(grep -rn --include="*.ts" --include="*.tsx" -E "$p" frontend/src 2>/dev/null || true)
  if [ -n "$MATCH" ]; then
    echo "FAIL: Phase-39 deleted import pattern reappeared: $p" >&2
    echo "$MATCH" >&2
    FAIL=1
  fi
done
for f in "${PHASE_39_DELETED_FILES[@]}"; do
  if [ -f "$f" ]; then
    echo "FAIL: Phase-39 deleted file reappeared: $f" >&2
    FAIL=1
  fi
done

# ============================================================================
# 39-07 .week-list mirror gate (T-39-09-CSS-DRIFT)
# shared-week-list.css must mirror dashboard.css source-of-truth.
# Extracts ONLY the .week-list { ... } rule body (selector line starts at column 1,
# excluding CSS comments). Stops at the closing brace of that block.
# ============================================================================
if [ -f frontend/src/components/calendar/shared-week-list.css ] && [ -f frontend/src/pages/Dashboard/widgets/dashboard.css ]; then
  WEEK_LIST_RULES_DASHBOARD=$(awk '/^\.week-list[[:space:]]*\{/{flag=1} flag{print} flag && /^\}/{flag=0}' frontend/src/pages/Dashboard/widgets/dashboard.css | tr -d '[:space:]')
  WEEK_LIST_RULES_MIRROR=$(awk '/^\.week-list[[:space:]]*\{/{flag=1} flag{print} flag && /^\}/{flag=0}' frontend/src/components/calendar/shared-week-list.css | tr -d '[:space:]')
  if [ "$WEEK_LIST_RULES_DASHBOARD" != "$WEEK_LIST_RULES_MIRROR" ]; then
    echo "FAIL: shared-week-list.css .week-list rules diverge from dashboard.css source-of-truth" >&2
    echo "DASHBOARD: $WEEK_LIST_RULES_DASHBOARD" >&2
    echo "MIRROR:    $WEEK_LIST_RULES_MIRROR" >&2
    FAIL=1
  fi
fi

exit "$FAIL"

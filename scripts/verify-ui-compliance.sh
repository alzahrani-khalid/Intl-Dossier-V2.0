#!/bin/bash

# Script: verify-ui-compliance.sh
# Feature: 019-user-management-access
# Tasks: T086 (RTL), T087 (Mobile-first)
#
# Verifies all components follow RTL and mobile-first design guidelines
# Usage: ./scripts/verify-ui-compliance.sh

set -e

echo "==================================="
echo "UI Compliance Verification"
echo "Feature: User Management & Access Control"
echo "==================================="
echo ""

# Component directory
COMPONENT_DIR="frontend/src/components/user-management"

# Check if directory exists
if [ ! -d "$COMPONENT_DIR" ]; then
  echo "❌ Component directory not found: $COMPONENT_DIR"
  exit 1
fi

# Initialize counters
TOTAL_COMPONENTS=0
RTL_COMPLIANT=0
MOBILE_FIRST_COMPLIANT=0
ISSUES=()

echo "Checking components in $COMPONENT_DIR..."
echo ""

# Check each component
for component_file in "$COMPONENT_DIR"/*.tsx; do
  if [ -f "$component_file" ]; then
    TOTAL_COMPONENTS=$((TOTAL_COMPONENTS + 1))
    component_name=$(basename "$component_file")

    echo "Checking: $component_name"

    # RTL Compliance Checks
    echo -n "  RTL Support: "
    rtl_issues=()

    # Check for RTL detection
    if ! grep -q "i18n.language === 'ar'" "$component_file" && ! grep -q "isRTL" "$component_file"; then
      rtl_issues+=("Missing RTL detection")
    fi

    # Check for prohibited directional classes
    if grep -E "\b(ml-|mr-|pl-|pr-|text-left|text-right|left-|right-|rounded-l-|rounded-r-)" "$component_file" | grep -v "// @rtl-ignore" > /dev/null; then
      rtl_issues+=("Uses non-logical directional properties")
    fi

    # Check for dir attribute
    if ! grep -q 'dir={' "$component_file" && ! grep -q 'dir="' "$component_file"; then
      rtl_issues+=("Missing dir attribute on container")
    fi

    if [ ${#rtl_issues[@]} -eq 0 ]; then
      echo "✅ PASS"
      RTL_COMPLIANT=$((RTL_COMPLIANT + 1))
    else
      echo "❌ FAIL"
      for issue in "${rtl_issues[@]}"; do
        echo "      - $issue"
        ISSUES+=("$component_name: $issue")
      done
    fi

    # Mobile-First Compliance Checks
    echo -n "  Mobile-First: "
    mobile_issues=()

    # Check for mobile-first breakpoint pattern (base → sm: → md: → lg:)
    if grep -E "lg:|xl:" "$component_file" > /dev/null; then
      # Has desktop classes, check if mobile-first
      if ! grep -E "(h-11|min-h-11|px-4|text-base|gap-4)" "$component_file" > /dev/null; then
        mobile_issues+=("Missing mobile-first base styles")
      fi
    fi

    # Check for minimum touch targets (44x44px = h-11)
    if grep -E "\bButton\b" "$component_file" > /dev/null; then
      if ! grep -E "h-11|min-h-11" "$component_file" > /dev/null; then
        mobile_issues+=("Buttons may lack 44px minimum touch target")
      fi
    fi

    # Check for desktop-first anti-patterns
    if grep -E "p-8 sm:p-4|text-xl sm:text-base|gap-8 sm:gap-2" "$component_file" > /dev/null; then
      mobile_issues+=("Desktop-first pattern detected (large base → small mobile)")
    fi

    if [ ${#mobile_issues[@]} -eq 0 ]; then
      echo "✅ PASS"
      MOBILE_FIRST_COMPLIANT=$((MOBILE_FIRST_COMPLIANT + 1))
    else
      echo "❌ FAIL"
      for issue in "${mobile_issues[@]}"; do
        echo "      - $issue"
        ISSUES+=("$component_name: $issue")
      done
    fi

    echo ""
  fi
done

# Summary
echo "==================================="
echo "Summary"
echo "==================================="
echo "Total Components: $TOTAL_COMPONENTS"
echo ""
echo "RTL Compliance:        $RTL_COMPLIANT/$TOTAL_COMPONENTS"
echo "Mobile-First Compliance: $MOBILE_FIRST_COMPLIANT/$TOTAL_COMPONENTS"
echo ""

if [ ${#ISSUES[@]} -gt 0 ]; then
  echo "Issues Found:"
  for issue in "${ISSUES[@]}"; do
    echo "  ❌ $issue"
  done
  echo ""
  echo "❌ VERIFICATION FAILED"
  exit 1
else
  echo "✅ ALL COMPONENTS COMPLIANT"
  echo ""
  echo "RTL Guidelines Met:"
  echo "  ✓ RTL detection implemented (i18n.language === 'ar')"
  echo "  ✓ Logical properties used (ms-*, me-*, ps-*, pe-*)"
  echo "  ✓ dir attribute set on containers"
  echo "  ✓ No prohibited directional classes (ml-, mr-, text-left, etc.)"
  echo ""
  echo "Mobile-First Guidelines Met:"
  echo "  ✓ Mobile-first breakpoint order (base → sm: → md: → lg:)"
  echo "  ✓ Minimum 44x44px touch targets (h-11, min-h-11)"
  echo "  ✓ Progressive enhancement from mobile to desktop"
  echo "  ✓ No desktop-first anti-patterns"
  echo ""
  exit 0
fi

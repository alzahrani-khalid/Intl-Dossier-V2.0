#!/bin/bash

# Aceternity UI Component Installer
# Follows component hierarchy: Aceternity → Kibo-UI → shadcn
# Usage: ./scripts/add-component.sh <component-name>

set -e

COMPONENT=$1
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

if [ -z "$COMPONENT" ]; then
  echo -e "${RED}❌ Error: No component name provided${NC}"
  echo ""
  echo "Usage: ./scripts/add-component.sh <component-name>"
  echo ""
  echo "Examples:"
  echo "  ./scripts/add-component.sh navbar"
  echo "  ./scripts/add-component.sh 3d-card"
  echo "  ./scripts/add-component.sh bento-grid"
  exit 1
fi

echo -e "${BLUE}🔍 Searching for '${COMPONENT}' in component hierarchy...${NC}"
echo ""

# Function to try installing component
try_install() {
  local command=$1
  local source=$2

  echo -e "${YELLOW}Trying ${source}...${NC}"
  if eval "$command"; then
    echo -e "${GREEN}✅ Successfully installed from ${source}!${NC}"
    return 0
  else
    echo -e "${RED}❌ Not found in ${source}${NC}"
    echo ""
    return 1
  fi
}

# 1. Try Aceternity UI (Free) - PRIMARY
echo -e "${BLUE}1️⃣  Aceternity UI (Primary - 130+ components)${NC}"
ACETERNITY_URL="https://ui.aceternity.com/registry/${COMPONENT}.json"
if try_install "npx shadcn@latest add ${ACETERNITY_URL} --yes" "Aceternity UI"; then
  echo ""
  echo -e "${GREEN}📦 Component installed to: src/components/ui/${COMPONENT}.tsx${NC}"
  echo -e "${BLUE}📖 Documentation: https://ui.aceternity.com/components${NC}"
  echo ""
  echo -e "${YELLOW}⚠️  Don't forget to:${NC}"
  echo "  1. Add RTL support (use ms-*, me-*, ps-*, pe-*)"
  echo "  2. Verify mobile-first breakpoints"
  echo "  3. Test on 375px viewport"
  echo "  4. Test in Arabic mode (i18n.language = 'ar')"
  exit 0
fi

# 2. Try Aceternity UI Pro - PRIMARY+
echo -e "${BLUE}2️⃣  Aceternity UI Pro (Primary+ - Premium components)${NC}"
echo -e "${YELLOW}ℹ️  Pro components require API key in .env.local${NC}"
echo -e "${YELLOW}ℹ️  Check Pro docs for exact installation command${NC}"
echo -e "${BLUE}📖 Visit: https://pro.aceternity.com/components${NC}"
echo ""
echo "To install Pro component manually:"
echo -e "${GREEN}  npx shadcn@latest add @aceternity-pro/${COMPONENT}${NC}"
echo ""
read -p "Would you like to try Pro installation? (y/N) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
  if try_install "npx shadcn@latest add @aceternity-pro/${COMPONENT}" "Aceternity UI Pro"; then
    echo ""
    echo -e "${GREEN}📦 Pro component installed successfully!${NC}"
    exit 0
  fi
fi

# 3. Try Kibo-UI - SECONDARY FALLBACK
echo -e "${BLUE}3️⃣  Kibo-UI (Secondary fallback)${NC}"
if try_install "npx shadcn@latest add @kibo-ui/${COMPONENT}" "Kibo-UI"; then
  echo ""
  echo -e "${GREEN}📦 Component installed from Kibo-UI${NC}"
  echo -e "${BLUE}📖 Documentation: https://www.kibo-ui.com${NC}"
  exit 0
fi

# 4. Try shadcn/ui - LAST RESORT
echo -e "${BLUE}4️⃣  shadcn/ui (Last resort fallback)${NC}"
echo -e "${YELLOW}⚠️  Using shadcn as last resort - Aceternity preferred${NC}"
if try_install "npx shadcn@latest add ${COMPONENT}" "shadcn/ui"; then
  echo ""
  echo -e "${GREEN}📦 Component installed from shadcn/ui${NC}"
  echo -e "${BLUE}📖 Documentation: https://ui.shadcn.com${NC}"
  echo ""
  echo -e "${YELLOW}⚠️  Consider migrating to Aceternity equivalent when available${NC}"
  exit 0
fi

# Component not found anywhere
echo ""
echo -e "${RED}❌ Component '${COMPONENT}' not found in any registry${NC}"
echo ""
echo -e "${BLUE}📖 Search manually at:${NC}"
echo "   • Aceternity UI: https://ui.aceternity.com/components"
echo "   • Aceternity Pro: https://pro.aceternity.com/components"
echo "   • Kibo-UI: https://www.kibo-ui.com"
echo "   • shadcn/ui: https://ui.shadcn.com"
echo ""
echo -e "${YELLOW}💡 Tip: Check component naming (use kebab-case)${NC}"
echo "   Examples: 'bento-grid', '3d-card', 'floating-navbar'"
echo ""
exit 1

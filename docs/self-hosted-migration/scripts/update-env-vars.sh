#!/bin/bash
# update-env-vars.sh
# Automated script to update Supabase URLs and keys across the codebase
# Usage: ./update-env-vars.sh [--dry-run]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration - UPDATE THESE VALUES
NEW_SUPABASE_URL="https://supabase.yourdomain.com"
NEW_ANON_KEY="your-new-anon-key-here"
NEW_SERVICE_ROLE_KEY="your-new-service-role-key-here"

# Old values to replace
OLD_PROJECT_REF="zkrcjzdemdmwhearhfgg"
OLD_SUPABASE_URL="https://${OLD_PROJECT_REF}.supabase.co"
OLD_REGION="supabase.co"

# Check if dry-run mode
DRY_RUN=false
if [[ "$1" == "--dry-run" ]]; then
  DRY_RUN=true
  echo -e "${YELLOW}Running in DRY-RUN mode - no files will be modified${NC}"
fi

# Project root
PROJECT_ROOT=$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)
cd "$PROJECT_ROOT"

echo -e "${GREEN}Updating Supabase environment configuration${NC}"
echo "Project root: $PROJECT_ROOT"
echo "Old URL: $OLD_SUPABASE_URL"
echo "New URL: $NEW_SUPABASE_URL"
echo ""

# Counter for changes
TOTAL_FILES=0
TOTAL_CHANGES=0

# Function to update file
update_file() {
  local file=$1
  local description=$2

  if [ ! -f "$file" ]; then
    echo -e "${YELLOW}  Skipping (not found): $file${NC}"
    return
  fi

  if $DRY_RUN; then
    echo -e "${YELLOW}  Would update: $file ($description)${NC}"
    grep -n "$OLD_PROJECT_REF\|$OLD_REGION" "$file" 2>/dev/null | head -3 || true
  else
    echo -e "${GREEN}  Updating: $file ($description)${NC}"

    # Backup original
    cp "$file" "${file}.backup"

    # Perform replacements
    sed -i.tmp "s|${OLD_SUPABASE_URL}|${NEW_SUPABASE_URL}|g" "$file"
    sed -i.tmp "s|${OLD_PROJECT_REF}\.supabase\.co|supabase.yourdomain.com|g" "$file"
    sed -i.tmp "s|wss://${OLD_PROJECT_REF}|wss://supabase.yourdomain.com|g" "$file"

    # Remove temp file
    rm -f "${file}.tmp"

    TOTAL_FILES=$((TOTAL_FILES + 1))
  fi
}

# Function to update environment file with keys
update_env_file() {
  local file=$1
  local description=$2

  if [ ! -f "$file" ]; then
    echo -e "${YELLOW}  Skipping (not found): $file${NC}"
    return
  fi

  if $DRY_RUN; then
    echo -e "${YELLOW}  Would update: $file ($description)${NC}"
  else
    echo -e "${GREEN}  Updating: $file ($description)${NC}"

    # Backup original
    cp "$file" "${file}.backup"

    # Update URL
    sed -i.tmp "s|${OLD_SUPABASE_URL}|${NEW_SUPABASE_URL}|g" "$file"
    sed -i.tmp "s|${OLD_PROJECT_REF}\.supabase\.co|supabase.yourdomain.com|g" "$file"

    # Note: We don't automatically update keys as they may need manual verification
    echo -e "${YELLOW}    NOTE: Please manually verify/update API keys in this file${NC}"

    rm -f "${file}.tmp"
    TOTAL_FILES=$((TOTAL_FILES + 1))
  fi
}

echo "Step 1: Updating environment files"
echo "===================================="

update_env_file ".env.example" "Root environment example"
update_env_file "frontend/.env.example" "Frontend environment example"
update_env_file "frontend/.env.local" "Frontend local environment"
update_env_file "backend/.env.example" "Backend environment example"
update_env_file "backend/.env.local" "Backend local environment"
update_env_file "mobile/.env.example" "Mobile environment example"
update_env_file "mobile/.env" "Mobile environment"
update_env_file "supabase/.env" "Supabase CLI environment"

echo ""
echo "Step 2: Updating configuration files"
echo "====================================="

update_file "mobile/app.config.js" "Mobile app configuration"
update_file "mobile/app.json" "Mobile app JSON config"
update_file "supabase/config.toml" "Supabase CLI config"

echo ""
echo "Step 3: Updating source files"
echo "=============================="

# Frontend
if [ -d "frontend/src" ]; then
  echo "Updating frontend source files..."
  while IFS= read -r -d '' file; do
    if grep -q "$OLD_PROJECT_REF\|$OLD_REGION" "$file" 2>/dev/null; then
      update_file "$file" "Frontend source"
    fi
  done < <(find frontend/src -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" \) -print0)
fi

# Backend
if [ -d "backend/src" ]; then
  echo "Updating backend source files..."
  while IFS= read -r -d '' file; do
    if grep -q "$OLD_PROJECT_REF\|$OLD_REGION" "$file" 2>/dev/null; then
      update_file "$file" "Backend source"
    fi
  done < <(find backend/src -type f \( -name "*.ts" -o -name "*.js" \) -print0)
fi

# Mobile
if [ -d "mobile/src" ]; then
  echo "Updating mobile source files..."
  while IFS= read -r -d '' file; do
    if grep -q "$OLD_PROJECT_REF\|$OLD_REGION" "$file" 2>/dev/null; then
      update_file "$file" "Mobile source"
    fi
  done < <(find mobile/src -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" \) -print0)
fi

echo ""
echo "Step 4: Updating test files"
echo "============================"

# Backend tests
if [ -d "backend/tests" ]; then
  echo "Updating backend test files..."
  while IFS= read -r -d '' file; do
    if grep -q "$OLD_PROJECT_REF\|$OLD_REGION" "$file" 2>/dev/null; then
      update_file "$file" "Backend test"
    fi
  done < <(find backend/tests -type f \( -name "*.ts" -o -name "*.js" \) -print0)
fi

# Frontend tests
if [ -d "frontend/tests" ]; then
  echo "Updating frontend test files..."
  while IFS= read -r -d '' file; do
    if grep -q "$OLD_PROJECT_REF\|$OLD_REGION" "$file" 2>/dev/null; then
      update_file "$file" "Frontend test"
    fi
  done < <(find frontend/tests -type f \( -name "*.ts" -o -name "*.tsx" \) -print0)
fi

echo ""
echo "Step 5: Updating documentation"
echo "==============================="

# Update README and CLAUDE.md
update_file "README.md" "Root README"
update_file "CLAUDE.md" "Project instructions"

# Update docs (excluding migration docs)
if [ -d "docs" ]; then
  while IFS= read -r -d '' file; do
    if [[ "$file" != *"self-hosted-migration"* ]] && grep -q "$OLD_PROJECT_REF" "$file" 2>/dev/null; then
      update_file "$file" "Documentation"
    fi
  done < <(find docs -type f -name "*.md" -print0)
fi

echo ""
echo "======================================"
echo "Update Summary"
echo "======================================"
echo -e "Files processed: ${GREEN}$TOTAL_FILES${NC}"

if $DRY_RUN; then
  echo -e "${YELLOW}DRY-RUN complete - no files were modified${NC}"
  echo "To apply changes, run: $0"
else
  echo -e "${GREEN}Updates complete!${NC}"
  echo ""
  echo "Next steps:"
  echo "1. Review changes: git diff"
  echo "2. Manually update API keys in .env files"
  echo "3. Test locally: npm run dev (in frontend, backend, mobile)"
  echo "4. Run validation: ./docs/self-hosted-migration/scripts/validate-migration.sh --env-check"
  echo ""
  echo "Backup files created with .backup extension"
  echo "To restore: find . -name '*.backup' -exec bash -c 'mv \"\$0\" \"\${0%.backup}\"' {} \\;"
fi

echo ""
echo "Files remaining with old references:"
REMAINING=$(grep -r "$OLD_PROJECT_REF" --exclude-dir={node_modules,.git,dist,build,.next} --exclude="*.backup" . 2>/dev/null | wc -l || echo "0")
echo "  $REMAINING references found"

if [ "$REMAINING" -gt "0" ]; then
  echo ""
  echo "Review these manually:"
  grep -r "$OLD_PROJECT_REF" --exclude-dir={node_modules,.git,dist,build,.next} --exclude="*.backup" . 2>/dev/null | head -10 || true
fi

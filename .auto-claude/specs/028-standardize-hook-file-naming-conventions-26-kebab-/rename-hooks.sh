#!/usr/bin/env bash
set -euo pipefail

# Script to rename kebab-case hooks to camelCase using git mv
# This preserves git history for all renamed files

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MAPPING_FILE="${SCRIPT_DIR}/hook-rename-mapping.json"
HOOKS_DIR="./frontend/src/hooks"

# Check if mapping file exists
if [[ ! -f "${MAPPING_FILE}" ]]; then
  echo "Error: Mapping file not found: ${MAPPING_FILE}"
  exit 1
fi

# Check if hooks directory exists
if [[ ! -d "${HOOKS_DIR}" ]]; then
  echo "Error: Hooks directory not found: ${HOOKS_DIR}"
  echo "Make sure to run this script from the repository root"
  exit 1
fi

# Parse dry-run flag
DRY_RUN=false
if [[ "${1:-}" == "--dry-run" ]]; then
  DRY_RUN=true
fi

# Count successful operations
count=0

# Read mapping file and process each rename
while IFS= read -r line; do
  # Skip lines that don't contain a mapping (like braces)
  if [[ ! "$line" =~ \"([^\"]+)\"[[:space:]]*:[[:space:]]*\"([^\"]+)\" ]]; then
    continue
  fi

  old_name="${BASH_REMATCH[1]}"
  new_name="${BASH_REMATCH[2]}"

  old_path="${HOOKS_DIR}/${old_name}"
  new_path="${HOOKS_DIR}/${new_name}"

  # Check if source file exists
  if [[ ! -f "${old_path}" ]]; then
    echo "Warning: Source file does not exist: ${old_path}"
    continue
  fi

  # Check if destination already exists
  if [[ -f "${new_path}" ]]; then
    echo "Warning: Destination file already exists: ${new_path}"
    continue
  fi

  if [[ "${DRY_RUN}" == true ]]; then
    echo "would rename: ${old_path} -> ${new_path}"
  else
    echo "Renaming: ${old_path} -> ${new_path}"
    git mv "${old_path}" "${new_path}"
  fi

  ((count++))
done < "${MAPPING_FILE}"

if [[ "${DRY_RUN}" == true ]]; then
  echo ""
  echo "Dry run complete. Would rename ${count} files."
  echo "Run without --dry-run to execute the renames."
else
  echo ""
  echo "Successfully renamed ${count} files."
  echo "Git history has been preserved."
fi

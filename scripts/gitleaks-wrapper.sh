#!/usr/bin/env bash
# Wrapper script to execute gitleaks
# This allows gitleaks to be called via bash

set -euo pipefail

GITLEAKS_BIN="$HOME/.local/bin/gitleaks"

# Check if gitleaks is installed
if [[ ! -f "$GITLEAKS_BIN" ]]; then
  echo "Error: gitleaks not found at $GITLEAKS_BIN"
  echo "Please install gitleaks first"
  exit 1
fi

# Execute gitleaks with all provided arguments
exec "$GITLEAKS_BIN" "$@"

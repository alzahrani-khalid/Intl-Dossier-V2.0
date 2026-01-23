#!/bin/bash

# Script to help identify and fix .select() queries
# Lists files with .select() grouped by table

echo "=== Files with .select() by table ==="
echo ""

# Extract table names and files
grep -rn "\.select()" --include="*.ts" . | while read -r line; do
  file=$(echo "$line" | cut -d: -f1)
  linenum=$(echo "$line" | cut -d: -f2)

  # Get the table name from 2 lines before
  table=$(sed -n "$((linenum-2)),$((linenum))p" "$file" | grep -o "\.from('[^']*')" | sed "s/\.from('\([^']*\)').*/\1/" | tail -1)

  if [ -n "$table" ]; then
    echo "$table|$file:$linenum"
  fi
done | sort | column -t -s'|'

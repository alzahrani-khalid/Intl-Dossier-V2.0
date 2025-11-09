#!/bin/bash

# Script to copy country flags from source to frontend public assets
# Uses circular flag variants (perfect for circular avatar containers)

SOURCE_DIR="/Users/khalidalzahrani/Library/CloudStorage/OneDrive-Personal/coding/flags"
DEST_DIR="/Users/khalidalzahrani/Library/CloudStorage/OneDrive-Personal/coding/Intl-DossierV2.0/frontend/public/assets/flags"

# Create destination directory if it doesn't exist
mkdir -p "$DEST_DIR"

# Counter for copied files
count=0

# Copy all circular flag variants
for file in "$SOURCE_DIR"/*_circular.svg; do
  [ -f "$file" ] || continue

  # Get the base filename
  filename=$(basename "$file")

  # Extract the ISO code (everything before _circular.svg)
  iso_code="${filename%_circular.svg}"

  # Copy file with new name (already lowercase)
  cp "$file" "$DEST_DIR/${iso_code}.svg"

  ((count++))
done

echo "✅ Copied $count circular flag files to $DEST_DIR"
echo "📁 Files are named as: sa.svg, us.svg, cn.svg, etc."
echo "🎨 Using circular flag variants (perfect for avatar-style display)"

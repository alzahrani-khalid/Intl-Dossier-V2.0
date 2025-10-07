/**
 * Convert HEX color to HSL format
 * Returns HSL values as space-separated string for CSS variables
 */
export function hexToHSL(hex: string): string {
  // Remove # if present
  hex = hex.replace(/^#/, '');

  // Parse hex values
  const r = parseInt(hex.substr(0, 2), 16) / 255;
  const g = parseInt(hex.substr(2, 2), 16) / 255;
  const b = parseInt(hex.substr(4, 2), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const diff = max - min;

  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (diff !== 0) {
    s = l > 0.5 ? diff / (2 - max - min) : diff / (max + min);

    switch (max) {
      case r:
        h = ((g - b) / diff + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / diff + 2) / 6;
        break;
      case b:
        h = ((r - g) / diff + 4) / 6;
        break;
    }
  }

  // Convert to degrees and percentages
  const hDeg = Math.round(h * 360);
  const sPercent = Math.round(s * 100);
  const lPercent = Math.round(l * 100);

  // Return as space-separated string for CSS variables
  return `${hDeg} ${sPercent}% ${lPercent}%`;
}

/**
 * Check if a color string is in HEX format
 */
export function isHexColor(color: string): boolean {
  return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color);
}

/**
 * Process color value for CSS variable
 * Converts HEX to HSL and leaves CSS-native color strings (HSL, OKLCH, etc.) untouched
 */
export function processColorForCSS(color: string): string {
  if (isHexColor(color)) {
    return hexToHSL(color);
  }
  // Assume it's already a CSS-native color string
  return color;
}

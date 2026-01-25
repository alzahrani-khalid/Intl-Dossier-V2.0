// Basic WCAG-oriented helpers: contrast and focus outlines

export function luminance(r: number, g: number, b: number): number {
  const a = [r, g, b].map((v) => {
    v /= 255
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
  }) as [number, number, number]
  return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2]
}

export function contrastRatio(
  rgb1: [number, number, number],
  rgb2: [number, number, number],
): number {
  const L1 = luminance(rgb1[0], rgb1[1], rgb1[2])
  const L2 = luminance(rgb2[0], rgb2[1], rgb2[2])
  const lighter = Math.max(L1, L2)
  const darker = Math.min(L1, L2)
  return (lighter + 0.05) / (darker + 0.05)
}

export function meetsAA(fontSizePx: number, ratio: number): boolean {
  const large = fontSizePx >= 24 || fontSizePx >= 18.66 // ~14pt bold approximation
  return large ? ratio >= 3 : ratio >= 4.5
}

export function applyFocusOutline(element: HTMLElement, color = '#3b82f6') {
  element.style.outline = `2px solid ${color}`
  element.style.outlineOffset = '2px'
}

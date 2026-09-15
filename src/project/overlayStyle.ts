import { Platform } from 'react-native';

import type { OverlayFont, OverlaySize } from './types';

/**
 * Stand-ins until the 3–4 overlay fonts are chosen and bundled (PRODUCT.md, Evidence on Hand).
 * These are Android system families.
 */
export const OVERLAY_FONTS: readonly { id: OverlayFont; label: string; family: string }[] = [
  { id: 'sans', label: 'Sans', family: Platform.select({ android: 'sans-serif-medium', default: 'System' }) },
  { id: 'serif', label: 'Serif', family: Platform.select({ android: 'serif', default: 'Georgia' }) },
  { id: 'mono', label: 'Mono', family: Platform.select({ android: 'monospace', default: 'Menlo' }) },
  { id: 'condensed', label: 'Condensed', family: Platform.select({ android: 'sans-serif-condensed', default: 'System' }) },
];

/** Text colours are the creator's content, not interface colour, so they sit outside the theme. */
export const OVERLAY_COLORS: readonly string[] = [
  '#FFFFFF',
  '#111111',
  '#FFD84D',
  '#FF5A5F',
  '#4ADE80',
  '#60A5FA',
  '#F0ABFC',
  '#FB923C',
];

export const OVERLAY_SIZES: readonly { id: OverlaySize; label: string; frameFraction: number }[] = [
  { id: 'small', label: 'Small', frameFraction: 0.05 },
  { id: 'medium', label: 'Medium', frameFraction: 0.075 },
  { id: 'large', label: 'Large', frameFraction: 0.11 },
];

export function overlayFontFamily(font: OverlayFont): string {
  return OVERLAY_FONTS.find((f) => f.id === font)?.family ?? OVERLAY_FONTS[0].family;
}

/** Font size in points for a size preset, given the frame's width on screen. */
export function overlayFontSize(size: OverlaySize, frameWidth: number): number {
  const fraction = OVERLAY_SIZES.find((s) => s.id === size)?.frameFraction ?? 0.075;
  return Math.max(8, frameWidth * fraction);
}

/**
 * A light box behind dark text, a dark box behind everything else. Opaque enough that the box reads over
 * busy, bright footage; at 0.6 it looked like a faint tint rather than a background.
 */
export function overlayBoxColor(textColor: string): string {
  return textColor === '#111111' ? 'rgba(255, 255, 255, 0.92)' : 'rgba(0, 0, 0, 0.8)';
}

/**
 * Design tokens. Plain values consumed by React Native StyleSheet.
 *
 * The ground is a low-chroma blue-black, not pure black. It is tinted just enough to
 * feel made, and neutral enough that a Filter's colour on the footage is judged
 * against something close to grey.
 */

import { Platform, type TextStyle } from 'react-native';

export const colors = {
  // Grounds, darkest to lightest.
  background: '#0C0E13',
  surface: '#14171D',
  surfaceRaised: '#1C2027',
  surfaceSheet: '#21252D',
  outline: '#333844',
  // Functional edges: slider tracks and trim handle edges. At least 3:1 on every ground (3.47 on surfaceSheet).
  outlineStrong: '#737882',
  // Top border of the docked tool row. A dark shadow doesn't read on this ground.
  toolRowBorder: 'rgba(255, 255, 255, 0.08)',

  // Text. Contrast on surfaceSheet: text 13.6, textSecondary 6.4.
  // textDisabled is for disabled controls only and is exempt from the 4.5 minimum.
  text: '#F0F1F4',
  textSecondary: '#A2A8B2',
  textDisabled: '#646A74',

  // Near-white, not the accent, so the playhead stays visible where it crosses a selected clip.
  playhead: '#F0F1F4',

  // The single accent: selection, trim handles, the active state and the primary action. Nothing else.
  accent: '#F5B83D',
  accentPressed: '#DDA22C',
  accentSubtle: 'rgba(245, 184, 61, 0.16)',
  onAccent: '#1A1406',

  // Laid over any control while it is pressed.
  pressedOverlay: 'rgba(240, 241, 244, 0.10)',
  // Focus ring for keyboard and switch access. Near-white, so it never reads as selection.
  focus: '#F0F1F4',

  // Status, not a second accent: destructive confirmations and import errors.
  danger: '#EF6F63',
  onDanger: '#1A0907',

  scrim: 'rgba(5, 6, 9, 0.72)',

  // The padding inside the 9:16 frame is part of the picture, so it stays true black.
  videoMatte: '#000000',
} as const;

export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

export const radius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 20,
  full: 999,
} as const;

export const stroke = {
  hairline: 1,
  playhead: 2,
  selection: 2,
} as const;

export const touchTarget = 48;

/** hitSlop that grows a smaller visual (a trim handle, an icon) to the minimum touch target. */
export function hitSlopFor(visualSize: number) {
  return Math.max(0, Math.ceil((touchTarget - visualSize) / 2));
}

/**
 * Font family slots. Replace these with @expo-google-fonts family names
 * (for example 'Manrope_600SemiBold') once the fonts are loaded.
 * Each Google Fonts weight is its own family, so when these become custom
 * families, remove fontWeight from the text styles below; on Android a custom
 * family plus fontWeight can fall back to synthetic bold.
 */
export const fontFamily = {
  regular: Platform.select({ android: 'sans-serif', default: 'System' }),
  medium: Platform.select({ android: 'sans-serif-medium', default: 'System' }),
  semibold: Platform.select({ android: 'sans-serif-medium', default: 'System' }),
  bold: Platform.select({ android: 'sans-serif', default: 'System' }),
} as const;

export const typography = {
  title: {
    fontFamily: fontFamily.semibold,
    fontWeight: '600',
    fontSize: 20,
    lineHeight: 26,
    letterSpacing: -0.2,
  },
  heading: {
    fontFamily: fontFamily.semibold,
    fontWeight: '600',
    fontSize: 17,
    lineHeight: 22,
    letterSpacing: -0.1,
  },
  body: {
    fontFamily: fontFamily.regular,
    fontWeight: '400',
    fontSize: 15,
    lineHeight: 20,
    letterSpacing: 0,
  },
  bodyStrong: {
    fontFamily: fontFamily.medium,
    fontWeight: '500',
    fontSize: 15,
    lineHeight: 20,
    letterSpacing: 0,
  },
  label: {
    fontFamily: fontFamily.medium,
    fontWeight: '500',
    fontSize: 13,
    lineHeight: 16,
    letterSpacing: 0.1,
  },
  caption: {
    fontFamily: fontFamily.regular,
    fontWeight: '400',
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.1,
  },
  // Current time and total duration: tabular figures, so the digits don't shift while playing.
  timecode: {
    fontFamily: fontFamily.medium,
    fontWeight: '500',
    fontSize: 13,
    lineHeight: 16,
    letterSpacing: 0,
    fontVariant: ['tabular-nums'],
  },
} satisfies Record<string, TextStyle>;

export const theme = { colors, spacing, radius, stroke, touchTarget, fontFamily, typography } as const;

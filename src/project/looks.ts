/**
 * Looks are data: a 3×3 RGB mix plus an offset per channel (docs/spec.md).
 * Offsets are in normalized 0–1 colour, which is what Skia's colour matrix expects.
 * The UI calls a look a Filter.
 */

export type Look = {
  id: string;
  name: string;
  mix: readonly number[];
  offset: readonly number[];
};

const IDENTITY_MIX = [1, 0, 0, 0, 1, 0, 0, 0, 1] as const;

export const LOOKS: readonly Look[] = [
  {
    id: 'warm',
    name: 'Warm',
    mix: [1.08, 0, 0, 0, 1.02, 0, 0, 0, 0.88],
    offset: [0.02, 0.01, -0.02],
  },
  {
    id: 'cool',
    name: 'Cool',
    mix: [0.92, 0, 0, 0, 1, 0, 0, 0, 1.1],
    offset: [-0.01, 0, 0.03],
  },
  {
    id: 'punch',
    name: 'Punch',
    mix: [1.3598, -0.2361, -0.0239, -0.0702, 1.1939, -0.0239, -0.0702, -0.2361, 1.4061],
    offset: [-0.05, -0.05, -0.05],
  },
  {
    id: 'fade',
    name: 'Fade',
    mix: [0.82, 0.04, 0.02, 0.03, 0.82, 0.03, 0.02, 0.04, 0.82],
    offset: [0.08, 0.08, 0.09],
  },
  {
    id: 'dusk',
    name: 'Dusk',
    mix: [1.05, 0.05, -0.05, 0, 0.98, 0.02, -0.05, 0.1, 0.95],
    offset: [0.02, 0, 0.03],
  },
  {
    id: 'mono',
    name: 'Mono',
    mix: [0.2126, 0.7152, 0.0722, 0.2126, 0.7152, 0.0722, 0.2126, 0.7152, 0.0722],
    offset: [0, 0, 0],
  },
];

/** The 4×5 colour matrix for a look at an intensity. Intensity blends from identity to the look. */
export function lookMatrix(lookId: string | null | undefined, intensity: number): number[] {
  const look = LOOKS.find((l) => l.id === lookId);
  const k = look ? Math.min(1, Math.max(0, intensity)) : 0;
  const mix = IDENTITY_MIX.map((v, i) => v + ((look?.mix[i] ?? v) - v) * k);
  const offset = [0, 1, 2].map((i) => (look?.offset[i] ?? 0) * k);
  return [
    mix[0], mix[1], mix[2], 0, offset[0],
    mix[3], mix[4], mix[5], 0, offset[1],
    mix[6], mix[7], mix[8], 0, offset[2],
    0, 0, 0, 1, 0,
  ];
}

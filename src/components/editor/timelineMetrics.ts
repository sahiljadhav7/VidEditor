import type { ResolvedOverlay } from '@/project/resolve';
import { spacing } from '@/theme';

export const RULER_HEIGHT = 20;
export const CLIP_LANE_HEIGHT = 56;
export const TEXT_ROW_HEIGHT = 24;
export const MAX_TEXT_ROWS = 3;
export const MUSIC_LANE_HEIGHT = 40;
export const LANE_GAP = spacing.xs;
export const BAND_PADDING = spacing.sm;
export const CLIP_GAP = 2;
export const HANDLE_WIDTH = 12;
export const TOOL_ROW_HEIGHT = 64;

/** Most tiles one clip strip draws; beyond this, tiles widen instead of multiplying. */
export const MAX_TILES_PER_CLIP = 40;

export const DEFAULT_PIXELS_PER_SECOND = 48;
export const MIN_PIXELS_PER_SECOND = 8;
export const MAX_PIXELS_PER_SECOND = 320;

export function laneLayout(textRows: number) {
  const clipTop = BAND_PADDING + RULER_HEIGHT + LANE_GAP;
  const textTop = clipTop + CLIP_LANE_HEIGHT + LANE_GAP;
  const musicTop = textTop + textRows * TEXT_ROW_HEIGHT + LANE_GAP;
  return { clipTop, textTop, musicTop, height: musicTop + MUSIC_LANE_HEIGHT + BAND_PADDING };
}

/** Packs overlapping texts into rows, earliest first. Rows past the limit share the last row. */
export function packTextRows(overlays: readonly ResolvedOverlay[]) {
  const rows = new Map<string, number>();
  const rowEnds: number[] = [];
  [...overlays]
    .sort((a, b) => a.start - b.start)
    .forEach((o) => {
      let row = rowEnds.findIndex((end) => end <= o.start);
      if (row === -1) {
        row = rowEnds.length;
        rowEnds.push(o.end);
      } else {
        rowEnds[row] = o.end;
      }
      rows.set(o.overlay.id, Math.min(row, MAX_TEXT_ROWS - 1));
    });
  return { rows, count: rowEnds.length };
}

/** Seconds between ruler labels, so labels stay at least 56dp apart. */
export function rulerStep(pixelsPerSecond: number): number {
  for (const step of [0.5, 1, 2, 5, 10, 15, 30, 60, 120]) {
    if (step * pixelsPerSecond >= 56) return step;
  }
  return 300;
}

/**
 * The resolve step: turns a project into exact start and end times in composition time.
 * Preview reads this, and nothing else.
 */

import { FRAME, MUSIC_FADE_OUT, MUSIC_MIN_DURATION } from './rules';
import type { Asset, Clip, Overlay, Project } from './types';

export type ResolvedClip = {
  clip: Clip;
  asset: Asset;
  index: number;
  start: number;
  end: number;
  /** Where in the asset the clip begins: the in-point for video, 0 for a photo. */
  sourceStart: number;
};

export type ResolvedOverlay = {
  overlay: Overlay;
  start: number;
  /** Cut short at the end of the composition. The stored duration is unchanged. */
  end: number;
};

export type ResolvedMusic = {
  songId: string;
  start: number;
  end: number;
  fadeOutStart: number;
  balance: number;
};

export type ResolvedComposition = {
  duration: number;
  clips: ResolvedClip[];
  overlays: ResolvedOverlay[];
  music: ResolvedMusic | null;
};

function durationOf(clip: Clip): number {
  return clip.kind === 'video' ? clip.outPoint - clip.inPoint : clip.duration;
}

export function resolve(project: Project): ResolvedComposition {
  const assets = new Map(project.assets.map((a) => [a.id, a]));
  const starts = new Map<string, number>();
  const clips: ResolvedClip[] = [];
  let time = 0;

  project.clips.forEach((clip, index) => {
    const asset = assets.get(clip.assetId);
    if (!asset) return;
    const length = durationOf(clip);
    starts.set(clip.id, time);
    clips.push({
      clip,
      asset,
      index,
      start: time,
      end: time + length,
      sourceStart: clip.kind === 'video' ? clip.inPoint : 0,
    });
    time += length;
  });

  const duration = time;

  const overlays = project.overlays.flatMap((overlay): ResolvedOverlay[] => {
    const clipStart = starts.get(overlay.anchorClipId);
    if (clipStart === undefined) return [];
    const start = clipStart + overlay.offset;
    if (start >= duration) return [];
    return [{ overlay, start, end: Math.min(duration, start + overlay.duration) }];
  });

  // A trimmed composition pulls the song's start back in rather than dropping the song.
  const musicStart = Math.min(project.music.start, Math.max(0, duration - MUSIC_MIN_DURATION));
  const musicEnd = Math.min(duration, project.music.end ?? duration);
  const music =
    project.music.songId && musicStart < musicEnd
      ? {
          songId: project.music.songId,
          start: musicStart,
          end: musicEnd,
          fadeOutStart: Math.max(musicStart, musicEnd - MUSIC_FADE_OUT),
          balance: project.music.balance,
        }
      : null;

  return { duration, clips, overlays, music };
}

/** The clip under `time`, and how far into that clip it is. Null for an empty main track. */
export function clipAtTime(project: Project, time: number): { clip: Clip; offset: number } | null {
  let start = 0;
  for (let i = 0; i < project.clips.length; i++) {
    const clip = project.clips[i];
    const end = start + durationOf(clip);
    if (time < end || i === project.clips.length - 1) {
      return { clip, offset: Math.min(Math.max(0, time - start), Math.max(0, end - start - FRAME)) };
    }
    start = end;
  }
  return null;
}

/** Index of the clip playing at `time`, given each clip's end time in order. -1 when there are none. */
export function clipIndexAt(ends: readonly number[], time: number): number {
  'worklet';
  if (ends.length === 0) return -1;
  for (let i = 0; i < ends.length; i++) {
    if (time < ends[i]) return i;
  }
  return ends.length - 1;
}

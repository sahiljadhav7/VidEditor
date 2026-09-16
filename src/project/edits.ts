/**
 * Edits are pure: each takes a project and returns a new one.
 * The rules live here, not in the UI (docs/spec.md, ADR 0002).
 */

import { createId } from './ids';
import { clipAtTime, resolve } from './resolve';
import {
  FRAME,
  MIN_CLIP_DURATION,
  MUSIC_MIN_DURATION,
  OVERLAY_DEFAULT_DURATION,
  OVERLAY_MIN_DURATION,
  PHOTO_DEFAULT_DURATION,
  PHOTO_MAX_DURATION,
} from './rules';
import type { Asset, Clip, ClipLook, Overlay, Project } from './types';

export type NewAsset = Omit<Asset, 'id'>;
export type OverlayPatch = Partial<Omit<Overlay, 'id' | 'anchorClipId'>>;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export function emptyProject(): Project {
  return { assets: [], clips: [], overlays: [], music: { songId: null, balance: 0.5, start: 0, end: null } };
}

export function clipDuration(clip: Clip): number {
  return clip.kind === 'video' ? clip.outPoint - clip.inPoint : clip.duration;
}

function clipForAsset(asset: Asset): Clip {
  if (asset.kind === 'video') {
    return {
      id: createId('clip'),
      kind: 'video',
      assetId: asset.id,
      inPoint: 0,
      outPoint: Math.max(MIN_CLIP_DURATION, asset.duration ?? MIN_CLIP_DURATION),
      look: null,
    };
  }
  return {
    id: createId('clip'),
    kind: 'photo',
    assetId: asset.id,
    duration: PHOTO_DEFAULT_DURATION,
    look: null,
  };
}

export function addAssets(project: Project, newAssets: NewAsset[]): Project {
  const assets = newAssets.map((asset) => ({ ...asset, id: createId('asset') }));
  return {
    ...project,
    assets: [...project.assets, ...assets],
    clips: [...project.clips, ...assets.map(clipForAsset)],
  };
}

export function addClipForAsset(project: Project, assetId: string): Project {
  const asset = project.assets.find((a) => a.id === assetId);
  if (!asset) return project;
  return { ...project, clips: [...project.clips, clipForAsset(asset)] };
}

export function removeClip(project: Project, clipId: string): Project {
  return {
    ...project,
    clips: project.clips.filter((c) => c.id !== clipId),
    overlays: project.overlays.filter((o) => o.anchorClipId !== clipId),
  };
}

export function moveClip(project: Project, clipId: string, toIndex: number): Project {
  const from = project.clips.findIndex((c) => c.id === clipId);
  if (from < 0) return project;
  const clips = [...project.clips];
  const [clip] = clips.splice(from, 1);
  clips.splice(clamp(toIndex, 0, clips.length), 0, clip);
  return { ...project, clips };
}

export function removeAsset(project: Project, assetId: string): Project {
  const removed = new Set(project.clips.filter((c) => c.assetId === assetId).map((c) => c.id));
  return {
    ...project,
    assets: project.assets.filter((a) => a.id !== assetId),
    clips: project.clips.filter((c) => !removed.has(c.id)),
    overlays: project.overlays.filter((o) => !removed.has(o.anchorClipId)),
  };
}

/** What removing an asset would take with it, for the confirmation. */
export function assetUsage(project: Project, assetId: string) {
  const clipIds = new Set(project.clips.filter((c) => c.assetId === assetId).map((c) => c.id));
  return {
    clips: clipIds.size,
    texts: project.overlays.filter((o) => clipIds.has(o.anchorClipId)).length,
  };
}

export function textsOnClip(project: Project, clipId: string): number {
  return project.overlays.filter((o) => o.anchorClipId === clipId).length;
}

/**
 * Keeps overlays on the same footage when their anchor clip's start moves by `shift` seconds,
 * then clamps each start back inside the clip. Durations never change (ADR 0002).
 */
function reanchor(overlays: Overlay[], clipId: string, shift: number, newDuration: number): Overlay[] {
  return overlays.map((o) =>
    o.anchorClipId !== clipId
      ? o
      : { ...o, offset: clamp(o.offset - shift, 0, Math.max(0, newDuration - FRAME)) },
  );
}

export function setSourceRange(
  project: Project,
  clipId: string,
  inPoint: number,
  outPoint: number,
): Project {
  const clip = project.clips.find((c) => c.id === clipId);
  if (!clip || clip.kind !== 'video') return project;
  const asset = project.assets.find((a) => a.id === clip.assetId);
  const assetDuration = asset?.duration ?? clip.outPoint;

  let nextIn: number;
  let nextOut: number;
  if (inPoint !== clip.inPoint) {
    nextOut = clamp(outPoint, MIN_CLIP_DURATION, assetDuration);
    nextIn = clamp(inPoint, 0, nextOut - MIN_CLIP_DURATION);
  } else {
    nextIn = clamp(inPoint, 0, Math.max(0, assetDuration - MIN_CLIP_DURATION));
    nextOut = clamp(outPoint, nextIn + MIN_CLIP_DURATION, assetDuration);
  }

  return {
    ...project,
    clips: project.clips.map((c) => (c.id === clipId ? { ...clip, inPoint: nextIn, outPoint: nextOut } : c)),
    overlays: reanchor(project.overlays, clipId, nextIn - clip.inPoint, nextOut - nextIn),
  };
}

export function setPhotoDuration(project: Project, clipId: string, duration: number): Project {
  const clip = project.clips.find((c) => c.id === clipId);
  if (!clip || clip.kind !== 'photo') return project;
  const next = clamp(duration, MIN_CLIP_DURATION, PHOTO_MAX_DURATION);
  return {
    ...project,
    clips: project.clips.map((c) => (c.id === clipId ? { ...clip, duration: next } : c)),
    overlays: reanchor(project.overlays, clipId, 0, next),
  };
}

/**
 * Adds text at `time`, backed off so it gets its full default duration: text added at the very end would
 * otherwise last one frame and never show. If the whole composition is shorter than the default, the text
 * starts at 0 and spans all of it. Refused, with the project unchanged, when there are no clips. `start` is
 * where the text actually begins, so the editor can move the playhead onto it.
 */
export function addOverlayAt(
  project: Project,
  time: number,
): { project: Project; overlayId: string | null; start: number } {
  const total = resolve(project).duration;
  const start = Math.max(0, Math.min(time, total - OVERLAY_DEFAULT_DURATION));
  const hit = clipAtTime(project, start);
  if (!hit) return { project, overlayId: null, start: time };
  const overlay: Overlay = {
    id: createId('text'),
    anchorClipId: hit.clip.id,
    offset: hit.offset,
    duration: OVERLAY_DEFAULT_DURATION,
    text: '',
    font: 'sans',
    color: '#FFFFFF',
    box: false,
    size: 'medium',
    x: 0.5,
    y: 0.5,
  };
  const next = { ...project, overlays: [...project.overlays, overlay] };
  // clipAtTime keeps the offset a frame inside the clip, so read the real start back rather than assume it.
  const placed = resolve(next).overlays.find((o) => o.overlay.id === overlay.id);
  return { project: next, overlayId: overlay.id, start: placed?.start ?? start };
}

export function updateOverlay(project: Project, overlayId: string, patch: OverlayPatch): Project {
  return {
    ...project,
    overlays: project.overlays.map((o) => (o.id === overlayId ? { ...o, ...patch } : o)),
  };
}

/**
 * Sets when a text starts and ends, in composition time. The text re-anchors to the clip under its new
 * start, so it still travels with that footage when clips are trimmed or moved (ADR 0002).
 */
export function setOverlayRange(project: Project, overlayId: string, start: number, end: number): Project {
  const resolved = resolve(project);
  const total = resolved.duration;
  if (!project.overlays.some((o) => o.id === overlayId) || total <= 0) return project;
  const nextStart = clamp(start, 0, Math.max(0, total - OVERLAY_MIN_DURATION));
  const nextEnd = clamp(end, nextStart + OVERLAY_MIN_DURATION, Math.max(total, nextStart + OVERLAY_MIN_DURATION));
  const hit = clipAtTime(project, nextStart);
  if (!hit) return project;
  // clipAtTime can pull the start a frame back inside the clip, so measure the length from where it landed.
  const clipStart = resolved.clips.find((c) => c.clip.id === hit.clip.id)?.start ?? 0;
  const placedStart = clipStart + hit.offset;
  return {
    ...project,
    overlays: project.overlays.map((o) =>
      o.id === overlayId ? { ...o, anchorClipId: hit.clip.id, offset: hit.offset, duration: nextEnd - placedStart } : o,
    ),
  };
}

export function removeOverlay(project: Project, overlayId: string): Project {
  return { ...project, overlays: project.overlays.filter((o) => o.id !== overlayId) };
}

export function setLook(project: Project, clipId: string, look: ClipLook | null): Project {
  const next = look ? { ...look, intensity: clamp(look.intensity, 0, 1) } : null;
  return {
    ...project,
    clips: project.clips.map((c) => (c.id === clipId ? { ...c, look: next } : c)),
  };
}

export function setSong(project: Project, songId: string | null): Project {
  // Removing the song forgets its range, so the next song covers the whole composition again.
  const range = songId ? {} : { start: 0, end: null };
  return { ...project, music: { ...project.music, songId, ...range } };
}

/** Sets when the song starts and stops, in composition time. An end at the composition's end stays there. */
export function setMusicRange(project: Project, start: number, end: number): Project {
  const total = resolve(project).duration;
  if (total <= 0) return project;
  const nextStart = clamp(start, 0, Math.max(0, total - MUSIC_MIN_DURATION));
  const nextEnd = clamp(end, Math.min(total, nextStart + MUSIC_MIN_DURATION), total);
  // Kept open-ended at the end, so adding clips later extends the music with them.
  return { ...project, music: { ...project.music, start: nextStart, end: nextEnd >= total - FRAME ? null : nextEnd } };
}

export function setBalance(project: Project, balance: number): Project {
  return { ...project, music: { ...project.music, balance: clamp(balance, 0, 1) } };
}

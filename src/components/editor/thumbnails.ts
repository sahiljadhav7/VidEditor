/**
 * Video frames for clip strips, Media tiles and filter previews.
 * Frames come from the platform's own frame extractor. The first frame is taken on its own
 * first, so a strip can show one stretched frame while the rest arrive.
 */

import * as VideoThumbnails from 'expo-video-thumbnails';
import { useEffect, useState, useSyncExternalStore } from 'react';

import type { Asset } from '@/project/types';

export type Thumbnail = { time: number; uri: string };
export type ThumbnailState = { status: 'loading' | 'ready' | 'failed'; frames: readonly Thumbnail[] };

const SECONDS_PER_FRAME = 2;
const MAX_FRAMES = 12;
const QUALITY = 0.4;

type Entry = { state: ThumbnailState; listeners: Set<() => void> };

const entries = new Map<string, Entry>();
const LOADING: ThumbnailState = { status: 'loading', frames: [] };

async function frameAt(uri: string, seconds: number): Promise<string | null> {
  try {
    const result = await VideoThumbnails.getThumbnailAsync(uri, { time: Math.round(seconds * 1000), quality: QUALITY });
    return result.uri;
  } catch {
    return null;
  }
}

function publish(entry: Entry, state: ThumbnailState) {
  entry.state = state;
  entry.listeners.forEach((listener) => listener());
}

function ensureEntry(asset: Asset): Entry {
  const existing = entries.get(asset.id);
  if (existing) return existing;

  const entry: Entry = { state: LOADING, listeners: new Set() };
  entries.set(asset.id, entry);

  const duration = asset.duration ?? 0;
  const count = Math.max(1, Math.min(MAX_FRAMES, Math.ceil(duration / SECONDS_PER_FRAME)));
  const times = Array.from({ length: count }, (_, i) => (duration * (i + 0.5)) / count);

  (async () => {
    const frames: Thumbnail[] = [];
    for (const time of times) {
      const uri = await frameAt(asset.uri, time);
      if (!uri) continue;
      frames.push({ time, uri });
      publish(entry, { status: 'loading', frames: [...frames] });
    }
    publish(entry, { status: frames.length > 0 ? 'ready' : 'failed', frames });
  })();

  return entry;
}

export function useVideoThumbnails(asset: Asset): ThumbnailState {
  const isVideo = asset.kind === 'video';
  const state = useSyncExternalStore(
    (listener) => {
      if (!isVideo) return () => {};
      const entry = ensureEntry(asset);
      entry.listeners.add(listener);
      return () => entry.listeners.delete(listener);
    },
    () => (isVideo ? (entries.get(asset.id)?.state ?? LOADING) : LOADING),
  );
  if (!isVideo) return { status: 'ready', frames: [{ time: 0, uri: asset.uri }] };
  return state;
}

export function nearestThumbnail(frames: readonly Thumbnail[], time: number): Thumbnail | undefined {
  let best: Thumbnail | undefined;
  for (const frame of frames) {
    if (!best || Math.abs(frame.time - time) < Math.abs(best.time - time)) best = frame;
  }
  return best;
}

const posters = new Map<string, Promise<string | null>>();

/** One frame at a moment in the asset: the photo itself, or an extracted video frame. */
export function useFrameAt(asset: Asset, time: number): string | null {
  const key = `${asset.id}@${Math.round(time * 10)}`;
  const [frame, setFrame] = useState<{ key: string; uri: string } | null>(null);

  useEffect(() => {
    if (asset.kind !== 'video') return;
    let live = true;
    let job = posters.get(key);
    if (!job) {
      job = frameAt(asset.uri, time);
      posters.set(key, job);
    }
    job.then((uri) => {
      if (live && uri) setFrame({ key, uri });
    });
    return () => {
      live = false;
    };
  }, [asset.kind, asset.uri, key, time]);

  if (asset.kind === 'photo') return asset.uri;
  return frame?.key === key ? frame.uri : null;
}

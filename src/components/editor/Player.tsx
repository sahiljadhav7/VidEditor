import {
  Canvas,
  ColorMatrix,
  Group,
  Image,
  Skia,
  rect,
  useImage,
  type SkImage,
  type Video,
} from '@shopify/react-native-skia';
import { Image as ExpoImage } from 'expo-image';
import { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useAnimatedReaction, useFrameCallback, useSharedValue } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { useEditor } from './EditorProvider';
import { OverlayLayer, type OverlaySizes } from './OverlayLayer';
import { scrubbing } from './scrubState';
import { nearestThumbnail, useVideoThumbnails } from './thumbnails';
import { lookMatrix } from '@/project/looks';
import { clipIndexAt, type ResolvedClip } from '@/project/resolve';
import { colors } from '@/theme';

export type FrameRect = { x: number; y: number; width: number; height: number };
export type PlayerMode = 'editor' | 'text' | 'preview';

/**
 * While paused, seek at most this often. Every seek flushes the hardware decoder, and it needs
 * a few samples after a flush before it outputs a frame; seeking every frame starves it.
 */
const SEEK_INTERVAL_MS = 250;
/** Frames to pull after a paused seek, so the decoder has time to produce the new frame. */
const FRAMES_TO_PULL_AFTER_SEEK = 45;
/** While playing, decode ahead of the clock by at most this much. */
const DECODE_LEAD_MS = 15;
/** How long a released video waits before disposal, so the UI thread has stopped using it. */
const DISPOSE_DELAY_MS = 250;
/**
 * A decoded frame this close to the seek target counts as fresh. Seeks land on the previous
 * keyframe, so the tolerance covers a typical phone keyframe interval.
 */
const FRESH_FRAME_TOLERANCE_MS = 2000;

function fitFrame(width: number, height: number): FrameRect {
  if (width <= 0 || height <= 0) return { x: 0, y: 0, width: 0, height: 0 };
  let frameWidth = width;
  let frameHeight = (width * 16) / 9;
  if (frameHeight > height) {
    frameHeight = height;
    frameWidth = (height * 9) / 16;
  }
  return { x: (width - frameWidth) / 2, y: (height - frameHeight) / 2, width: frameWidth, height: frameHeight };
}

/** 0 keeps only the clips' sound, 1 only the music, and the middle plays both at full volume. */
function clipVolumeFor(balance: number) {
  return balance <= 0.5 ? 1 : 2 * (1 - balance);
}

export function Player({ mode }: { mode: PlayerMode }) {
  const { resolved, project, time, select, finishTextEditing } = useEditor();
  const [layout, setLayout] = useState({ width: 0, height: 0 });
  const frame = fitFrame(layout.width, layout.height);
  const overlaySizes = useRef<OverlaySizes>(new Map());

  const ends = useMemo(() => resolved.clips.map((c) => c.end), [resolved.clips]);
  const [index, setIndex] = useState(-1);

  useAnimatedReaction(
    () => clipIndexAt(ends, time.value),
    (next, previous) => {
      if (next !== previous) scheduleOnRN(setIndex, next);
    },
    [ends],
  );

  const current = index >= 0 ? resolved.clips[index] : undefined;
  const clipVolume = clipVolumeFor(project.music.balance);

  const hitTestText = (x: number, y: number): string | null => {
    const now = time.get();
    for (let i = resolved.overlays.length - 1; i >= 0; i--) {
      const { overlay, start, end } = resolved.overlays[i];
      if (now < start || now >= end) continue;
      const size = overlaySizes.current.get(overlay.id);
      if (!size) continue;
      const cx = frame.x + overlay.x * frame.width;
      const cy = frame.y + overlay.y * frame.height;
      if (Math.abs(x - cx) <= size.width / 2 + 8 && Math.abs(y - cy) <= size.height / 2 + 8) return overlay.id;
    }
    return null;
  };

  const tap = Gesture.Tap()
    .runOnJS(true)
    .onEnd((event, success) => {
      if (!success || mode === 'preview') return;
      if (mode === 'text') {
        finishTextEditing();
        return;
      }
      // Tapping the player never plays or pauses: it selects the text under the finger, or deselects.
      const hit = hitTestText(event.x, event.y);
      select(hit ? { kind: 'text', id: hit } : null);
    });

  return (
    <GestureDetector gesture={tap}>
      <View
        style={styles.root}
        collapsable={false}
        onLayout={(e) => setLayout({ width: e.nativeEvent.layout.width, height: e.nativeEvent.layout.height })}>
        {frame.width > 0 && (
          <View
            style={[styles.matte, { left: frame.x, top: frame.y, width: frame.width, height: frame.height }]}
          />
        )}
        {frame.width > 0 && current?.asset.kind === 'video' && (
          <VideoLayer
            key={current.clip.id}
            clip={current}
            frame={frame}
            volume={current.asset.hasAudio ? clipVolume : 0}
          />
        )}
        {frame.width > 0 && current?.asset.kind === 'photo' && (
          <PhotoLayer key={current.clip.id} clip={current} frame={frame} />
        )}
        {frame.width > 0 && <OverlayLayer frame={frame} mode={mode} sizes={overlaySizes.current} />}
      </View>
    </GestureDetector>
  );
}

/**
 * Drives a Skia video directly rather than through Skia's useVideo hook. On Android, useVideo
 * disposes each frame in the same step it publishes it, so nothing it hands over can be drawn.
 * Here the newest frame is kept and only the frame it replaces is disposed.
 *
 * Decoding stays on the UI thread: Skia builds each frame as a GPU image bound to the thread that
 * decoded it, so frames decoded elsewhere can't be drawn here. Seeks block briefly, so while the
 * timeline is scrubbing nothing is decoded; the nearest extracted thumbnail stands in until the
 * timeline settles and the exact frame arrives.
 */
function VideoLayer({ clip, frame, volume }: { clip: ResolvedClip; frame: FrameRect; volume: number }) {
  const { time, playing } = useEditor();
  const video = useSharedValue<Video | null>(null);
  const [rotation, setRotation] = useState(0);
  const [ready, setReady] = useState(false);
  const image = useSharedValue<SkImage | null>(null);
  const lastSoughtMs = useSharedValue(-1);
  const lastSeekAt = useSharedValue(-1e9);
  const wasPlaying = useSharedValue(false);
  const pullsLeft = useSharedValue(0);
  /** True from a scrub until a frame near the new playhead has been decoded. */
  const stale = useSharedValue(false);

  const thumbnails = useVideoThumbnails(clip.asset);
  const [previewTenths, setPreviewTenths] = useState(-1);

  useAnimatedReaction(
    () => (scrubbing.value || stale.value ? Math.floor(time.value * 10) : -1),
    (next, previous) => {
      if (next !== previous) scheduleOnRN(setPreviewTenths, next);
    },
  );

  useEffect(() => {
    let cancelled = false;
    let instance: Video | null = null;
    Promise.resolve(Skia.Video(clip.asset.uri))
      .then((next) => {
        if (cancelled) {
          next.dispose();
          return;
        }
        instance = next;
        next.setLooping(false);
        next.pause();
        setRotation(next.rotation());
        video.set(next);
        setReady(true);
      })
      .catch(() => {
        // An unreadable video leaves the frame on the matte; import already vetted the file.
      });
    return () => {
      cancelled = true;
      setReady(false);
      video.set(null);
      const released = instance;
      if (released) {
        released.pause();
        setTimeout(() => released.dispose(), DISPOSE_DELAY_MS);
      }
    };
  }, [clip.asset.uri, video]);

  useEffect(() => {
    if (ready) video.get()?.setVolume(volume);
  }, [ready, volume, video]);

  // The Skia surface keeps the size this layer mounted at; later player sizes are reached with a view
  // transform. Resizing the surface loses a paused video frame on Android, and nothing decodes a new one
  // until the playhead moves. Entering text mode briefly makes the player taller (the text controls
  // replace the timeline before the keyboard padding arrives) and then shorter, so the surface must not
  // follow the frame in either direction.
  const [surface] = useState(() => ({ width: frame.width, height: frame.height }));

  const start = clip.start;
  const sourceStart = clip.sourceStart;

  useFrameCallback((info) => {
    const current = video.value;
    if (!current) return;
    const now = info.timestamp;
    const targetMs = (sourceStart + (time.value - start)) * 1000;
    const isPlaying = playing.value;

    if (isPlaying !== wasPlaying.value) {
      wasPlaying.value = isPlaying;
      if (isPlaying) {
        current.seek(targetMs);
        lastSoughtMs.value = targetMs;
        lastSeekAt.value = now;
        current.play();
      } else {
        current.pause();
      }
    }

    // Under a moving timeline, decode nothing; the thumbnail preview covers the frame.
    if (scrubbing.value) {
      stale.value = true;
      return;
    }

    // lastSeekAt starts far in the past, so the very first seek always happens, even at 0 ms.
    const neverSought = lastSeekAt.value < 0;
    if (
      !isPlaying &&
      (neverSought || Math.abs(targetMs - lastSoughtMs.value) > 1) &&
      now - lastSeekAt.value >= SEEK_INTERVAL_MS
    ) {
      current.seek(targetMs);
      lastSoughtMs.value = targetMs;
      lastSeekAt.value = now;
      pullsLeft.value = FRAMES_TO_PULL_AFTER_SEEK;
    }

    // Playing: decode only up to the editor's clock, so the picture doesn't run ahead of it.
    const shouldPull = isPlaying ? current.currentTime() <= targetMs + DECODE_LEAD_MS : pullsLeft.value > 0;
    if (!shouldPull) {
      if (stale.value && !isPlaying && pullsLeft.value <= 0) stale.value = false;
      return;
    }
    if (!isPlaying) pullsLeft.value -= 1;

    const next = current.nextImage();
    if (next) {
      const previous = image.value;
      image.value = next;
      if (previous && previous !== next) previous.dispose();
      if (stale.value && Math.abs(current.currentTime() - lastSoughtMs.value) <= FRESH_FRAME_TOLERANCE_MS) {
        stale.value = false;
      }
    }
  }, true);

  const matrix = useMemo(
    () => lookMatrix(clip.clip.look?.lookId, clip.clip.look?.intensity ?? 0),
    [clip.clip.look],
  );

  const previewUri =
    previewTenths >= 0
      ? nearestThumbnail(thumbnails.frames, clip.sourceStart + (previewTenths / 10 - clip.start))?.uri
      : undefined;

  const rotated = rotation === 90 || rotation === 270;
  const drawWidth = rotated ? surface.height : surface.width;
  const drawHeight = rotated ? surface.width : surface.height;
  const scale = surface.width > 0 ? frame.width / surface.width : 1;

  return (
    <>
      <Canvas
        style={{
          position: 'absolute',
          left: frame.x + frame.width / 2 - surface.width / 2,
          top: frame.y + frame.height / 2 - surface.height / 2,
          width: surface.width,
          height: surface.height,
          transform: [{ scale }],
        }}>
        <Group clip={rect(0, 0, surface.width, surface.height)}>
          <Group
            transform={[
              { translateX: surface.width / 2 },
              { translateY: surface.height / 2 },
              { rotate: (rotation * Math.PI) / 180 },
            ]}>
            <Image
              image={image}
              x={-drawWidth / 2}
              y={-drawHeight / 2}
              width={drawWidth}
              height={drawHeight}
              fit="contain">
              <ColorMatrix matrix={matrix} />
            </Image>
          </Group>
        </Group>
      </Canvas>
      {previewUri && (
        <View
          pointerEvents="none"
          style={[styles.preview, { left: frame.x, top: frame.y, width: frame.width, height: frame.height }]}>
          <ExpoImage source={{ uri: previewUri }} style={StyleSheet.absoluteFill} contentFit="contain" transition={0} />
        </View>
      )}
    </>
  );
}

function PhotoLayer({ clip, frame }: { clip: ResolvedClip; frame: FrameRect }) {
  const image = useImage(clip.asset.uri);
  const matrix = useMemo(
    () => lookMatrix(clip.clip.look?.lookId, clip.clip.look?.intensity ?? 0),
    [clip.clip.look],
  );

  return (
    <Canvas style={StyleSheet.absoluteFill}>
      <Group clip={rect(frame.x, frame.y, frame.width, frame.height)}>
        <Image image={image} x={frame.x} y={frame.y} width={frame.width} height={frame.height} fit="contain">
          <ColorMatrix matrix={matrix} />
        </Image>
      </Group>
    </Canvas>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  matte: {
    position: 'absolute',
    backgroundColor: colors.videoMatte,
  },
  preview: {
    position: 'absolute',
    backgroundColor: colors.videoMatte,
  },
});

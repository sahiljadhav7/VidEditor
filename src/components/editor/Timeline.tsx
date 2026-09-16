import { Image } from 'expo-image';
import { useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector, type GestureType } from 'react-native-gesture-handler';
import Animated, { cancelAnimation, useAnimatedStyle, useSharedValue, withDecay } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { Button } from './Button';
import { useEditor } from './EditorProvider';
import { Icon } from './Icon';
import { scrubToken, scrubbing } from './scrubState';
import { nearestThumbnail, useFrameAt, useVideoThumbnails } from './thumbnails';
import {
  BAND_PADDING,
  CLIP_GAP,
  CLIP_LANE_HEIGHT,
  DEFAULT_PIXELS_PER_SECOND,
  HANDLE_WIDTH,
  MAX_PIXELS_PER_SECOND,
  MAX_TEXT_ROWS,
  MAX_TILES_PER_CLIP,
  MIN_PIXELS_PER_SECOND,
  MUSIC_LANE_HEIGHT,
  RULER_HEIGHT,
  TEXT_ROW_HEIGHT,
  laneLayout,
  packTextRows,
  rulerStep,
} from './timelineMetrics';
import { findSong } from '@/project/catalogue';
import { moveClip, setMusicRange, setOverlayRange, setPhotoDuration, setSourceRange } from '@/project/edits';
import { formatLength, formatTimecode } from '@/project/format';
import { resolve, type ResolvedClip, type ResolvedOverlay } from '@/project/resolve';
import { MUSIC_MIN_DURATION, OVERLAY_MIN_DURATION } from '@/project/rules';
import type { Project } from '@/project/types';
import { colors, radius, spacing, stroke, typography } from '@/theme';

type Reorder = { clipId: string; x: number; target: number };

/**
 * The timeline band: a fixed centre playhead with the lanes scrolling underneath.
 * Drag scrubs, pinch zooms, tap selects, long-press drags a clip to a new place.
 */
export function Timeline({ onAddMedia }: { onAddMedia: () => void }) {
  const { resolved, time, playing, duration, pixelsPerSecond, selection, select, apply, setSheet } = useEditor();
  const [width, setWidth] = useState(0);
  const [pps, setPps] = useState(DEFAULT_PIXELS_PER_SECOND);
  const [reorder, setReorder] = useState<Reorder | null>(null);
  const reorderRef = useRef<Reorder | null>(null);
  const scrubFrom = useSharedValue(0);
  const pinchFrom = useSharedValue(0);

  const packed = packTextRows(resolved.overlays);
  const textRows = Math.max(1, Math.min(MAX_TEXT_ROWS, packed.count));
  const lanes = laneLayout(textRows);
  const centre = width / 2;

  const contentStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: width / 2 - time.value * pixelsPerSecond.value }],
  }));

  if (resolved.clips.length === 0) {
    return (
      <View style={[styles.band, { height: lanes.height }]}>
        <EmptyTimeline onAddMedia={onAddMedia} />
      </View>
    );
  }

  const timeAtX = (x: number) => time.get() + (x - centre) / pixelsPerSecond.get();

  const handleTap = (x: number, y: number) => {
    const t = timeAtX(x);
    if (y >= lanes.clipTop && y < lanes.clipTop + CLIP_LANE_HEIGHT) {
      const hit = resolved.clips.find((c) => t >= c.start && t < c.end);
      select(hit ? { kind: 'clip', id: hit.clip.id } : null);
      return;
    }
    if (y >= lanes.textTop && y < lanes.textTop + textRows * TEXT_ROW_HEIGHT) {
      const row = Math.floor((y - lanes.textTop) / TEXT_ROW_HEIGHT);
      const hit = [...resolved.overlays]
        .reverse()
        .find((o) => packed.rows.get(o.overlay.id) === row && t >= o.start && t < o.end);
      select(hit ? { kind: 'text', id: hit.overlay.id } : null);
      return;
    }
    if (y >= lanes.musicTop && y < lanes.musicTop + MUSIC_LANE_HEIGHT && t >= 0 && t <= resolved.duration) {
      // With a song, a tap selects it so its ends can be dragged; an empty lane opens the song picker.
      if (resolved.music) select({ kind: 'music' });
      else setSheet('music');
      return;
    }
    select(null);
  };

  const startReorder = (x: number, y: number) => {
    if (y < lanes.clipTop || y >= lanes.clipTop + CLIP_LANE_HEIGHT) return;
    const t = timeAtX(x);
    const hit = resolved.clips.find((c) => t >= c.start && t < c.end);
    if (!hit) return;
    const next = { clipId: hit.clip.id, x, target: hit.index };
    reorderRef.current = next;
    setReorder(next);
    select({ kind: 'clip', id: hit.clip.id });
  };

  const moveReorder = (x: number) => {
    const current = reorderRef.current;
    if (!current) return;
    const t = timeAtX(x);
    const target = resolved.clips.filter((c) => c.clip.id !== current.clipId && (c.start + c.end) / 2 < t).length;
    const next = { ...current, x, target };
    reorderRef.current = next;
    setReorder(next);
  };

  const endReorder = () => {
    const current = reorderRef.current;
    if (current) apply((p) => moveClip(p, current.clipId, current.target));
  };

  const clearReorder = () => {
    reorderRef.current = null;
    setReorder(null);
  };

  const pinch = Gesture.Pinch()
    .onStart(() => {
      pinchFrom.value = pixelsPerSecond.value;
    })
    .onUpdate((e) => {
      const next = Math.min(MAX_PIXELS_PER_SECOND, Math.max(MIN_PIXELS_PER_SECOND, pinchFrom.value * e.scale));
      pixelsPerSecond.value = next;
      scheduleOnRN(setPps, next);
    });

  // The scrubbing flag covers the drag and any coast after a fling, so the player decodes
  // nothing until the timeline is still. A newer scrub owns the flag through its token.
  const scrub = Gesture.Pan()
    .maxPointers(1)
    .minDistance(4)
    .onStart(() => {
      cancelAnimation(time);
      playing.value = false;
      scrubFrom.value = time.value;
      scrubToken.value += 1;
      scrubbing.value = true;
    })
    .onUpdate((e) => {
      time.value = Math.min(duration.value, Math.max(0, scrubFrom.value - e.translationX / pixelsPerSecond.value));
    })
    .onEnd((e) => {
      const token = scrubToken.value;
      if (duration.value <= 0) {
        scrubbing.value = false;
        return;
      }
      time.value = withDecay(
        {
          velocity: -e.velocityX / pixelsPerSecond.value,
          deceleration: 0.996,
          clamp: [0, duration.value],
        },
        () => {
          if (scrubToken.value === token) scrubbing.value = false;
        },
      );
    })
    .onFinalize((_e, success) => {
      if (!success) scrubbing.value = false;
    });

  const tap = Gesture.Tap()
    .runOnJS(true)
    .onEnd((e, success) => {
      if (success) handleTap(e.x, e.y);
    });

  const reorderPan = Gesture.Pan()
    .activateAfterLongPress(350)
    .runOnJS(true)
    .onStart((e) => startReorder(e.x, e.y))
    .onUpdate((e) => moveReorder(e.x))
    .onEnd(() => endReorder())
    .onFinalize(() => clearReorder());

  const gesture = Gesture.Simultaneous(pinch, Gesture.Race(reorderPan, scrub, tap));
  const blocks: GestureType[] = [scrub, reorderPan, tap];

  const selectedClip =
    selection?.kind === 'clip' ? resolved.clips.find((c) => c.clip.id === selection.id) : undefined;
  const selectedText =
    selection?.kind === 'text' ? resolved.overlays.find((o) => o.overlay.id === selection.id) : undefined;
  const draggedClip = reorder ? resolved.clips.find((c) => c.clip.id === reorder.clipId) : undefined;

  const insertionTime = reorder
    ? resolved.clips
        .filter((c) => c.clip.id !== reorder.clipId)
        .slice(0, reorder.target)
        .reduce((sum, c) => sum + (c.end - c.start), 0)
    : 0;

  return (
    <View
      style={[styles.band, { height: lanes.height }]}
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
      <GestureDetector gesture={gesture}>
        <View style={StyleSheet.absoluteFill} collapsable={false}>
          <Animated.View style={[styles.content, { width: Math.max(1, resolved.duration * pps) }, contentStyle]}>
            <Ruler duration={resolved.duration} pps={pps} />
            {resolved.clips.map((rc) => (
              <ClipStrip
                key={rc.clip.id}
                clip={rc}
                pps={pps}
                top={lanes.clipTop}
                dimmed={reorder?.clipId === rc.clip.id}
              />
            ))}
            {resolved.overlays.map((ro) => (
              <TextBar
                key={ro.overlay.id}
                overlay={ro}
                pps={pps}
                top={lanes.textTop + (packed.rows.get(ro.overlay.id) ?? 0) * TEXT_ROW_HEIGHT}
              />
            ))}
            <MusicLane top={lanes.musicTop} pps={pps} centre={centre} />
            {selectedClip && !reorder && (
              <ClipSelection key={selectedClip.clip.id} clip={selectedClip} pps={pps} top={lanes.clipTop} blocks={blocks} />
            )}
            {selectedText && (
              <TextSelection
                key={selectedText.overlay.id}
                overlay={selectedText}
                pps={pps}
                top={lanes.textTop + (packed.rows.get(selectedText.overlay.id) ?? 0) * TEXT_ROW_HEIGHT}
                blocks={blocks}
              />
            )}
            {selection?.kind === 'music' && resolved.music && (
              <MusicSelection music={resolved.music} pps={pps} top={lanes.musicTop} blocks={blocks} />
            )}
            {reorder && (
              <View
                pointerEvents="none"
                style={[
                  styles.insertion,
                  { left: insertionTime * pps - 1, top: lanes.clipTop - spacing.xs, height: CLIP_LANE_HEIGHT + spacing.sm },
                ]}
              />
            )}
          </Animated.View>
          {reorder && draggedClip && <DragGhost clip={draggedClip} x={reorder.x} top={lanes.clipTop} />}
          <View
            pointerEvents="none"
            style={[styles.playhead, { left: centre - stroke.playhead / 2, top: BAND_PADDING, bottom: BAND_PADDING }]}>
            <View style={styles.playheadCap} />
          </View>
        </View>
      </GestureDetector>
    </View>
  );
}

function EmptyTimeline({ onAddMedia }: { onAddMedia: () => void }) {
  return (
    <View style={styles.empty}>
      <Text style={[typography.bodyStrong, styles.text]}>Add videos and photos to start</Text>
      <Text style={[typography.body, styles.secondary, styles.centred]}>
        They go on the timeline in the order you pick them.
      </Text>
      <Button variant="tonal" icon="add_photo_alternate" label="Add media" onPress={onAddMedia} />
    </View>
  );
}

function Ruler({ duration, pps }: { duration: number; pps: number }) {
  const step = rulerStep(pps);
  const count = Math.min(400, Math.floor(duration / step) + 1);
  return (
    <View pointerEvents="none" style={styles.ruler}>
      {Array.from({ length: count }, (_, i) => {
        const t = i * step;
        const label = step < 1 ? formatTimecode(t) : formatTimecode(t).slice(0, -2);
        return (
          <View key={i} style={[styles.tick, { left: t * pps }]}>
            <View style={styles.tickMark} />
            <Text style={[typography.caption, styles.tickLabel]}>{label}</Text>
          </View>
        );
      })}
    </View>
  );
}

/** The creator's footage, tiled across the clip's trimmed length. */
function ClipStrip({ clip, pps, top, dimmed }: { clip: ResolvedClip; pps: number; top: number; dimmed: boolean }) {
  const thumbnails = useVideoThumbnails(clip.asset);
  const width = Math.max(2, (clip.end - clip.start) * pps - CLIP_GAP);
  const aspect = clip.asset.height > 0 ? clip.asset.width / clip.asset.height : 1;
  const tileWidth = Math.max(Math.min(100, Math.max(32, CLIP_LANE_HEIGHT * aspect)), width / MAX_TILES_PER_CLIP);
  const frames = thumbnails.frames;
  // One frame only (slow extraction): stretch it across the clip rather than repeat it.
  const stretched = clip.asset.kind === 'video' && frames.length === 1;
  const tileCount = stretched ? 1 : Math.max(1, Math.ceil(width / tileWidth));

  return (
    <View style={[styles.clip, { left: clip.start * pps + CLIP_GAP / 2, top, width, opacity: dimmed ? 0.4 : 1 }]}>
      {frames.length > 0 &&
        Array.from({ length: tileCount }, (_, i) => {
          const sourceTime = clip.sourceStart + ((i + 0.5) * tileWidth) / pps;
          const uri =
            clip.asset.kind === 'photo' ? clip.asset.uri : (nearestThumbnail(frames, sourceTime)?.uri ?? frames[0].uri);
          return (
            <Image
              key={i}
              source={{ uri }}
              style={{ width: stretched ? width : tileWidth, height: CLIP_LANE_HEIGHT }}
              contentFit="cover"
              transition={0}
            />
          );
        })}
      {thumbnails.status === 'failed' && (
        <View style={styles.clipFailed}>
          <Icon name="movie" size={20} color={colors.textSecondary} />
        </View>
      )}
      <View style={styles.clipLength}>
        <Text style={[typography.caption, styles.text]}>{formatLength(clip.end - clip.start)}</Text>
      </View>
    </View>
  );
}

function TextBar({ overlay, pps, top }: { overlay: ResolvedOverlay; pps: number; top: number }) {
  return (
    <View
      pointerEvents="none"
      style={[styles.textBar, { left: overlay.start * pps, top: top + 2, width: Math.max(8, (overlay.end - overlay.start) * pps) }]}>
      <Icon name="text_fields" size={14} color={colors.textSecondary} />
      <Text numberOfLines={1} style={[typography.caption, styles.text, styles.textBarLabel]}>
        {overlay.overlay.text || 'Text'}
      </Text>
    </View>
  );
}

function MusicLane({ top, pps, centre }: { top: number; pps: number; centre: number }) {
  const { project, resolved, time, pixelsPerSecond } = useEditor();
  const song = resolved.music ? findSong(project.music.songId) : undefined;
  const laneWidth = Math.max(1, resolved.duration * pps);
  const barStart = resolved.music?.start ?? 0;
  const barWidth = resolved.music ? Math.max(1, (resolved.music.end - resolved.music.start) * pps) : laneWidth;

  // Keeps the label in view while the lane scrolls under the playhead.
  const labelStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: Math.max(
          0,
          Math.min((time.value - barStart) * pixelsPerSecond.value - centre, barWidth - 200),
        ),
      },
    ],
  }));

  return (
    <>
      {song && <View pointerEvents="none" style={[styles.musicEmpty, { top, width: laneWidth }]} />}
      <View pointerEvents="none" style={[styles.music, { top, left: barStart * pps, width: barWidth }]}>
        <Animated.View style={[styles.musicLabel, labelStyle]}>
          <Icon name={song ? 'graphic_eq' : 'music_note'} size={18} color={song ? colors.text : colors.textSecondary} />
          <Text numberOfLines={1} style={[typography.label, { color: song ? colors.text : colors.textSecondary }]}>
            {song ? `${song.title} · ${song.artist}` : 'Add music'}
          </Text>
        </Animated.View>
      </View>
    </>
  );
}

function ClipSelection({ clip, pps, top, blocks }: { clip: ResolvedClip; pps: number; top: number; blocks: GestureType[] }) {
  const { project, apply, pixelsPerSecond } = useEditor();
  const [draft, setDraft] = useState<{ start: number; end: number } | null>(null);
  const commit = useRef<(() => void) | null>(null);
  const source = clip.clip;
  const start = draft?.start ?? clip.start;
  const end = draft?.end ?? clip.end;

  // The edit rules clamp the draft, so handles stop at the limits instead of passing them.
  const dragStart = (translationX: number) => {
    if (source.kind !== 'video') return;
    const next = setSourceRange(
      project,
      source.id,
      source.inPoint + translationX / pixelsPerSecond.get(),
      source.outPoint,
    ).clips.find((c) => c.id === source.id);
    if (next?.kind !== 'video') return;
    setDraft({ start: clip.start + (next.inPoint - source.inPoint), end: clip.end });
    commit.current = () => apply((p) => setSourceRange(p, source.id, next.inPoint, next.outPoint));
  };

  const dragEnd = (translationX: number) => {
    const delta = translationX / pixelsPerSecond.get();
    if (source.kind === 'video') {
      const next = setSourceRange(project, source.id, source.inPoint, source.outPoint + delta).clips.find(
        (c) => c.id === source.id,
      );
      if (next?.kind !== 'video') return;
      setDraft({ start: clip.start, end: clip.start + next.outPoint - next.inPoint });
      commit.current = () => apply((p) => setSourceRange(p, source.id, next.inPoint, next.outPoint));
    } else {
      const next = setPhotoDuration(project, source.id, source.duration + delta).clips.find((c) => c.id === source.id);
      if (next?.kind !== 'photo') return;
      setDraft({ start: clip.start, end: clip.start + next.duration });
      commit.current = () => apply((p) => setPhotoDuration(p, source.id, next.duration));
    }
  };

  // The project changes once, when the drag is released (ADR 0001).
  // The handle must activate on touch-down. The timeline's scrub pan activates after 4px, and the
  // cross-detector blocksExternalGesture relation doesn't hold it back on Android, so a handle with the
  // default activation slop always lost the race and the drag scrubbed the timeline instead.
  const handlePan = (onDrag: (translationX: number) => void) =>
    Gesture.Pan()
      .runOnJS(true)
      .minDistance(0)
      .hitSlop({ horizontal: 18 })
      .blocksExternalGesture(...blocks)
      .onUpdate((e) => onDrag(e.translationX))
      .onEnd(() => commit.current?.())
      .onFinalize(() => {
        commit.current = null;
        setDraft(null);
      });

  return (
    <>
      <View
        pointerEvents="none"
        style={[styles.selection, { top, left: start * pps, width: Math.max(stroke.selection * 2, (end - start) * pps) }]}
      />
      {source.kind === 'video' && (
        <GestureDetector gesture={handlePan(dragStart)}>
          <View
            accessibilityLabel="Trim start"
            style={[styles.handle, styles.handleStart, { top, left: start * pps - HANDLE_WIDTH }]}>
            <View style={styles.grip} />
          </View>
        </GestureDetector>
      )}
      <GestureDetector gesture={handlePan(dragEnd)}>
        <View
          accessibilityLabel={source.kind === 'video' ? 'Trim end' : 'Photo length'}
          style={[styles.handle, styles.handleEnd, { top, left: end * pps }]}>
          <View style={styles.grip} />
        </View>
      </GestureDetector>
      {draft && (
        <View pointerEvents="none" style={[styles.lengthTag, { left: start * pps, top: top - RULER_HEIGHT }]}>
          <Text style={[typography.caption, { color: colors.onAccent }]}>{formatLength(end - start)}</Text>
        </View>
      )}
    </>
  );
}

type Range = { start: number; end: number };

/**
 * A selected text or song on the timeline, with a handle at each end. `edit` is the project edit for the
 * new range; it clamps, so the draft is read back through it and the handles stop at the limits.
 */
function RangeSelection({
  range,
  pps,
  top,
  height,
  label,
  minLength,
  edit,
  readBack,
  blocks,
}: {
  range: Range;
  pps: number;
  top: number;
  height: number;
  label: string;
  minLength: number;
  edit: (project: Project, start: number, end: number) => Project;
  readBack: (project: Project) => Range | null;
  blocks: GestureType[];
}) {
  const { project, apply, pixelsPerSecond } = useEditor();
  const [draft, setDraft] = useState<Range | null>(null);
  const commit = useRef<(() => void) | null>(null);
  const { start, end } = draft ?? range;

  const drag = (side: 'start' | 'end', translationX: number) => {
    const delta = translationX / pixelsPerSecond.get();
    const asked =
      side === 'start'
        ? { start: Math.min(range.start + delta, range.end - minLength), end: range.end }
        : { start: range.start, end: Math.max(range.end + delta, range.start + minLength) };
    const next = readBack(edit(project, asked.start, asked.end));
    if (!next) return;
    setDraft(next);
    commit.current = () => apply((p) => edit(p, next.start, next.end));
  };

  // Active on touch-down, like the clip handles: otherwise the timeline's scrub wins on Android.
  const handlePan = (side: 'start' | 'end') =>
    Gesture.Pan()
      .runOnJS(true)
      .minDistance(0)
      .hitSlop({ horizontal: 18, vertical: 8 })
      .blocksExternalGesture(...blocks)
      .onUpdate((e) => drag(side, e.translationX))
      .onEnd(() => commit.current?.())
      .onFinalize(() => {
        commit.current = null;
        setDraft(null);
      });

  return (
    <>
      <View
        pointerEvents="none"
        style={[styles.rangeSelection, { top, height, left: start * pps, width: Math.max(stroke.selection * 2, (end - start) * pps) }]}
      />
      <GestureDetector gesture={handlePan('start')}>
        <View
          accessibilityLabel={`${label} start`}
          style={[styles.handle, styles.handleStart, { top, height, left: start * pps - HANDLE_WIDTH }]}>
          <View style={[styles.grip, { height: Math.min(16, height - 8) }]} />
        </View>
      </GestureDetector>
      <GestureDetector gesture={handlePan('end')}>
        <View accessibilityLabel={`${label} end`} style={[styles.handle, styles.handleEnd, { top, height, left: end * pps }]}>
          <View style={[styles.grip, { height: Math.min(16, height - 8) }]} />
        </View>
      </GestureDetector>
      {draft && (
        <View pointerEvents="none" style={[styles.lengthTag, { left: start * pps, top: top - 20 }]}>
          <Text style={[typography.caption, { color: colors.onAccent }]}>{formatLength(end - start)}</Text>
        </View>
      )}
    </>
  );
}

function TextSelection({ overlay, pps, top, blocks }: { overlay: ResolvedOverlay; pps: number; top: number; blocks: GestureType[] }) {
  const id = overlay.overlay.id;
  return (
    <RangeSelection
      range={overlay}
      pps={pps}
      top={top + 2}
      height={TEXT_ROW_HEIGHT - 4}
      label="Text"
      minLength={OVERLAY_MIN_DURATION}
      edit={(p, start, end) => setOverlayRange(p, id, start, end)}
      readBack={(p) => resolve(p).overlays.find((o) => o.overlay.id === id) ?? null}
      blocks={blocks}
    />
  );
}

function MusicSelection({ music, pps, top, blocks }: { music: Range; pps: number; top: number; blocks: GestureType[] }) {
  return (
    <RangeSelection
      range={music}
      pps={pps}
      top={top}
      height={MUSIC_LANE_HEIGHT}
      label="Music"
      minLength={MUSIC_MIN_DURATION}
      edit={setMusicRange}
      readBack={(p) => resolve(p).music}
      blocks={blocks}
    />
  );
}

function DragGhost({ clip, x, top }: { clip: ResolvedClip; x: number; top: number }) {
  const poster = useFrameAt(clip.asset, clip.sourceStart);
  return (
    <View pointerEvents="none" style={[styles.ghostShadow, { left: x - 32, top }]}>
      <View style={styles.ghost}>
        {poster && <Image source={{ uri: poster }} style={StyleSheet.absoluteFill} contentFit="cover" />}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  band: {
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  content: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
  },
  text: {
    color: colors.text,
  },
  secondary: {
    color: colors.textSecondary,
  },
  centred: {
    textAlign: 'center',
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
  },
  ruler: {
    position: 'absolute',
    top: BAND_PADDING,
    left: 0,
    right: 0,
    height: RULER_HEIGHT,
  },
  tick: {
    position: 'absolute',
    top: 0,
    height: RULER_HEIGHT,
    flexDirection: 'row',
    gap: spacing.xs,
  },
  tickMark: {
    width: stroke.hairline,
    height: 6,
    backgroundColor: colors.outlineStrong,
  },
  tickLabel: {
    color: colors.textSecondary,
    fontVariant: ['tabular-nums'],
  },
  clip: {
    position: 'absolute',
    height: CLIP_LANE_HEIGHT,
    flexDirection: 'row',
    borderRadius: radius.xs,
    overflow: 'hidden',
    backgroundColor: colors.surfaceRaised,
  },
  clipFailed: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clipLength: {
    position: 'absolute',
    left: spacing.xs,
    bottom: spacing.xs,
    paddingHorizontal: spacing.xs,
    borderRadius: radius.xs,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  selection: {
    position: 'absolute',
    height: CLIP_LANE_HEIGHT,
    borderWidth: stroke.selection,
    borderColor: colors.accent,
    borderRadius: radius.xs,
  },
  handle: {
    position: 'absolute',
    width: HANDLE_WIDTH,
    height: CLIP_LANE_HEIGHT,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  handleStart: {
    borderTopLeftRadius: radius.xs,
    borderBottomLeftRadius: radius.xs,
  },
  handleEnd: {
    borderTopRightRadius: radius.xs,
    borderBottomRightRadius: radius.xs,
  },
  grip: {
    width: stroke.selection,
    height: 16,
    borderRadius: radius.full,
    backgroundColor: colors.onAccent,
  },
  lengthTag: {
    position: 'absolute',
    height: 18,
    paddingHorizontal: spacing.xs,
    borderRadius: radius.xs,
    backgroundColor: colors.accent,
    justifyContent: 'center',
  },
  textBar: {
    position: 'absolute',
    height: TEXT_ROW_HEIGHT - 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
    paddingHorizontal: spacing.xs,
    borderRadius: radius.xs,
    backgroundColor: colors.surfaceRaised,
    overflow: 'hidden',
  },
  textBarLabel: {
    flexShrink: 1,
  },
  rangeSelection: {
    position: 'absolute',
    borderWidth: stroke.selection,
    borderColor: colors.accent,
    borderRadius: radius.xs,
  },
  musicEmpty: {
    position: 'absolute',
    left: 0,
    height: MUSIC_LANE_HEIGHT,
    borderRadius: radius.xs,
    borderWidth: stroke.hairline,
    borderColor: colors.outlineStrong,
    borderStyle: 'dashed',
  },
  music: {
    position: 'absolute',
    height: MUSIC_LANE_HEIGHT,
    borderRadius: radius.xs,
    backgroundColor: colors.surfaceRaised,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  musicLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    maxWidth: 200,
  },
  insertion: {
    position: 'absolute',
    width: stroke.selection,
    borderRadius: radius.full,
    backgroundColor: colors.accent,
  },
  ghostShadow: {
    position: 'absolute',
    width: 64,
    height: CLIP_LANE_HEIGHT,
    borderRadius: radius.xs,
    boxShadow: '0px 8px 16px rgba(0, 0, 0, 0.6)',
    transform: [{ scale: 1.04 }],
  },
  ghost: {
    flex: 1,
    borderRadius: radius.xs,
    borderWidth: stroke.selection,
    borderColor: colors.accent,
    backgroundColor: colors.surfaceRaised,
    overflow: 'hidden',
  },
  playhead: {
    position: 'absolute',
    width: stroke.playhead,
    borderRadius: radius.full,
    backgroundColor: colors.playhead,
  },
  playheadCap: {
    position: 'absolute',
    top: 0,
    left: -3,
    width: 8,
    height: 8,
    borderRadius: radius.full,
    backgroundColor: colors.playhead,
  },
});

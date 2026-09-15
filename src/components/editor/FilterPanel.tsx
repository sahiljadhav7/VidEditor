import { Canvas, ColorMatrix, Image, useImage } from '@shopify/react-native-skia';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useEditor } from './EditorProvider';
import { Slider } from './Slider';
import { useFrameAt } from './thumbnails';
import { LOOKS, lookMatrix } from '@/project/looks';
import { setLook } from '@/project/edits';
import type { ResolvedClip } from '@/project/resolve';
import { colors, radius, spacing, stroke, typography } from '@/theme';

const TILE_WIDTH = 56;
const TILE_HEIGHT = 72;

/** Takes the timeline's place. The player above stays full size, so colour is judged on the real frame. */
export function FilterPanel() {
  const { resolved, selection } = useEditor();
  const clip = selection?.kind === 'clip' ? resolved.clips.find((c) => c.clip.id === selection.id) : undefined;
  if (!clip) return <View style={styles.panel} />;
  return <FilterControls clip={clip} />;
}

function FilterControls({ clip }: { clip: ResolvedClip }) {
  const { apply } = useEditor();
  const frameUri = useFrameAt(clip.asset, clip.sourceStart);
  const image = useImage(frameUri);
  const look = clip.clip.look;
  const intensity = look?.intensity ?? 1;

  const choose = (lookId: string | null) =>
    apply((p) => setLook(p, clip.clip.id, lookId ? { lookId, intensity } : null));

  const tiles = [{ id: null, name: 'None' }, ...LOOKS.map((l) => ({ id: l.id, name: l.name }))];

  return (
    <View style={styles.panel}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tiles}>
        {tiles.map((tile) => {
          const selected = (look?.lookId ?? null) === tile.id;
          return (
            <Pressable
              key={tile.id ?? 'none'}
              accessibilityRole="button"
              accessibilityLabel={`Filter: ${tile.name}`}
              accessibilityState={{ selected }}
              onPress={() => choose(tile.id)}
              style={styles.tile}>
              <View style={[styles.thumb, selected && styles.thumbSelected]}>
                <Canvas style={styles.canvas}>
                  <Image image={image} x={0} y={0} width={TILE_WIDTH} height={TILE_HEIGHT} fit="cover">
                    <ColorMatrix matrix={lookMatrix(tile.id, 1)} />
                  </Image>
                </Canvas>
              </View>
              <Text style={[typography.caption, { color: selected ? colors.accent : colors.textSecondary }]}>
                {tile.name}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
      <View style={styles.intensity}>
        <Text style={[typography.label, { color: look ? colors.text : colors.textDisabled }]}>Intensity</Text>
        <Slider
          label="Filter intensity"
          value={intensity}
          disabled={!look}
          onChange={(value) =>
            look && apply((p) => setLook(p, clip.clip.id, { lookId: look.lookId, intensity: value }))
          }
        />
        <Text style={[typography.timecode, styles.percent, { color: look ? colors.text : colors.textDisabled }]}>
          {Math.round(intensity * 100)}%
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    minHeight: 168,
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
  },
  tiles: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  tile: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  thumb: {
    width: TILE_WIDTH + stroke.selection * 2,
    height: TILE_HEIGHT + stroke.selection * 2,
    borderRadius: radius.sm,
    borderWidth: stroke.selection,
    borderColor: 'transparent',
    overflow: 'hidden',
    backgroundColor: colors.surfaceRaised,
  },
  thumbSelected: {
    borderColor: colors.accent,
  },
  canvas: {
    width: TILE_WIDTH,
    height: TILE_HEIGHT,
  },
  intensity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  percent: {
    minWidth: 40,
    textAlign: 'right',
  },
});

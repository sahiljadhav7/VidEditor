import { Image } from 'expo-image';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button } from './Button';
import { removeMediaRequest } from './confirmations';
import { useEditor } from './EditorProvider';
import { IconButton } from './IconButton';
import { Sheet } from './Sheet';
import { useFrameAt } from './thumbnails';
import { addClipForAsset, assetUsage, removeAsset } from '@/project/edits';
import { formatLength } from '@/project/format';
import type { Asset } from '@/project/types';
import { colors, radius, spacing, typography } from '@/theme';

const COLUMNS = 3;

export function MediaSheet({ onAddFromGallery }: { onAddFromGallery: () => void }) {
  const { project, apply, askConfirm, showNotice, select, setSheet } = useEditor();
  const [gridWidth, setGridWidth] = useState(0);
  const tileSize = gridWidth > 0 ? (gridWidth - spacing.sm * (COLUMNS - 1)) / COLUMNS : 0;

  const removeMedia = (assetId: string) => {
    const usage = assetUsage(project, assetId);
    const remove = () => {
      apply((p) => removeAsset(p, assetId));
      select(null);
    };
    if (usage.clips === 0) remove();
    else askConfirm(removeMediaRequest(usage.clips, usage.texts, remove));
  };

  return (
    <Sheet title="Media" onClose={() => setSheet(null)}>
      <View style={styles.body}>
        <View style={styles.actions}>
          <Button variant="tonal" icon="add_photo_alternate" label="Add from gallery" onPress={onAddFromGallery} />
        </View>
        {project.assets.length === 0 ? (
          <Text style={[typography.body, styles.secondary]}>
            Nothing here yet. Media you add stays here, even after its clips are deleted.
          </Text>
        ) : (
          <ScrollView>
            <View style={styles.grid} onLayout={(e) => setGridWidth(e.nativeEvent.layout.width)}>
              {project.assets.map((asset) => (
                <AssetTile
                  key={asset.id}
                  asset={asset}
                  size={tileSize}
                  uses={project.clips.filter((c) => c.assetId === asset.id).length}
                  onAdd={() => {
                    apply((p) => addClipForAsset(p, asset.id));
                    showNotice('Added to the end of the timeline');
                  }}
                  onRemove={() => removeMedia(asset.id)}
                />
              ))}
            </View>
          </ScrollView>
        )}
      </View>
    </Sheet>
  );
}

type TileProps = {
  asset: Asset;
  size: number;
  uses: number;
  onAdd: () => void;
  onRemove: () => void;
};

function AssetTile({ asset, size, uses, onAdd, onRemove }: TileProps) {
  const poster = useFrameAt(asset, 0);
  if (size <= 0) return null;

  return (
    <View style={{ width: size, height: size }}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Add this ${asset.kind} to the timeline`}
        onPress={onAdd}
        android_ripple={{ color: colors.pressedOverlay }}
        style={styles.tile}>
        {poster && <Image source={{ uri: poster }} style={StyleSheet.absoluteFill} contentFit="cover" transition={0} />}
        {asset.kind === 'video' && asset.duration !== null && (
          <View style={[styles.badge, styles.lengthBadge]}>
            <Text style={[typography.caption, styles.text]}>{formatLength(asset.duration)}</Text>
          </View>
        )}
        {uses > 0 && (
          <View style={[styles.badge, styles.usesBadge]}>
            <Text style={[typography.caption, styles.text]}>×{uses}</Text>
          </View>
        )}
      </Pressable>
      <View style={styles.remove}>
        <View style={styles.removeBacking} />
        <IconButton icon="close" label="Remove media" onPress={onRemove} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  body: {
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  actions: {
    alignItems: 'flex-start',
  },
  text: {
    color: colors.text,
  },
  secondary: {
    color: colors.textSecondary,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  tile: {
    flex: 1,
    borderRadius: radius.sm,
    overflow: 'hidden',
    backgroundColor: colors.surfaceRaised,
  },
  badge: {
    position: 'absolute',
    paddingHorizontal: spacing.xs,
    borderRadius: radius.xs,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  lengthBadge: {
    left: spacing.xs,
    bottom: spacing.xs,
  },
  usesBadge: {
    left: spacing.xs,
    top: spacing.xs,
  },
  remove: {
    position: 'absolute',
    top: -spacing.sm,
    right: -spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeBacking: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderRadius: radius.full,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
});

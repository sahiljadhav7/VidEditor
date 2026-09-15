import { router } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useEditor } from '@/components/editor/EditorProvider';
import { IconButton } from '@/components/editor/IconButton';
import { Player } from '@/components/editor/Player';
import { Transport } from '@/components/editor/Transport';
import { findSong } from '@/project/catalogue';
import { colors, spacing, typography } from '@/theme';

/** The finished edit, full-screen. No file leaves the app (ADR 0005). */
export default function PreviewScreen() {
  const { time, play, pause, project } = useEditor();
  const insets = useSafeAreaInsets();
  const song = findSong(project.music.songId);

  useEffect(() => {
    time.set(0);
    play();
    return () => pause();
  }, [time, play, pause]);

  return (
    <View style={styles.screen}>
      <View style={[styles.player, { paddingTop: insets.top }]}>
        <Player mode="preview" />
      </View>
      <View style={[styles.bottom, { paddingBottom: insets.bottom }]}>
        {song && (
          <Text numberOfLines={2} style={[typography.caption, styles.credit]}>
            {song.creditLine}
          </Text>
        )}
        <Transport />
      </View>
      <View style={[styles.back, { top: insets.top }]}>
        <IconButton icon="arrow_back" label="Back to the editor" onPress={() => router.back()} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.videoMatte,
  },
  player: {
    flex: 1,
  },
  bottom: {
    backgroundColor: colors.background,
    paddingTop: spacing.xs,
  },
  credit: {
    color: colors.textSecondary,
    paddingHorizontal: spacing.lg,
  },
  back: {
    position: 'absolute',
    left: spacing.xs,
  },
});

import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useAnimatedReaction } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { useEditor } from './EditorProvider';
import { IconButton } from './IconButton';
import { formatTimecode } from '@/project/format';
import { colors, spacing, touchTarget, typography } from '@/theme';

/** Play/pause lives here and only here. */
export function Transport() {
  const { time, isPlaying, togglePlay, resolved } = useEditor();
  const empty = resolved.clips.length === 0;

  // The playhead time, in tenths of a second. React re-renders only when a tenth changes,
  // so the readout stays current while scrubbing or playing without rendering every frame.
  const [tenths, setTenths] = useState(0);
  useAnimatedReaction(
    () => Math.floor(time.value * 10),
    (next, previous) => {
      if (next !== previous) scheduleOnRN(setTenths, next);
    },
  );

  return (
    <View style={styles.row}>
      <IconButton
        icon={isPlaying ? 'pause' : 'play_arrow'}
        label={isPlaying ? 'Pause' : 'Play'}
        onPress={togglePlay}
        disabled={empty}
      />
      <View
        style={styles.times}
        accessible
        accessibilityLabel={`Playhead ${formatTimecode(tenths / 10)} of ${formatTimecode(resolved.duration)}`}>
        <Text style={[typography.timecode, styles.current]}>{formatTimecode(tenths / 10)}</Text>
        <Text style={[typography.timecode, styles.total]}>/ {formatTimecode(resolved.duration)}</Text>
      </View>
      <View style={styles.balance} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xs,
    backgroundColor: colors.background,
  },
  times: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  current: {
    color: colors.text,
    minWidth: 48,
    textAlign: 'right',
  },
  total: {
    color: colors.textSecondary,
  },
  balance: {
    width: touchTarget,
  },
});

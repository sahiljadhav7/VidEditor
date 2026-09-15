import { useEffect } from 'react';
import { StyleSheet, Text } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { useEditor } from './EditorProvider';
import { colors, radius, spacing, typography } from '@/theme';

const VISIBLE_MS = 4000;

export function Snackbar({ bottom }: { bottom: number }) {
  const { notice, clearNotice } = useEditor();

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(clearNotice, VISIBLE_MS);
    return () => clearTimeout(timer);
  }, [notice, clearNotice]);

  if (!notice) return null;

  return (
    <Animated.View
      entering={FadeIn.duration(150)}
      exiting={FadeOut.duration(150)}
      accessibilityLiveRegion="polite"
      style={[styles.snackbar, { bottom }]}>
      <Text style={[typography.body, styles.text]}>{notice}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  snackbar: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.sm,
    backgroundColor: colors.text,
  },
  text: {
    color: colors.background,
  },
});

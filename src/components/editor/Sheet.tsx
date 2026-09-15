import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeOut, SlideInDown, SlideOutDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { IconButton } from './IconButton';
import { colors, radius, spacing, stroke, typography } from '@/theme';

export function Sheet({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  const insets = useSafeAreaInsets();

  return (
    <View style={StyleSheet.absoluteFill}>
      <Animated.View entering={FadeIn.duration(200)} exiting={FadeOut.duration(150)} style={styles.scrim}>
        <Pressable style={styles.fill} onPress={onClose} accessibilityLabel={`Close ${title}`} />
      </Animated.View>
      <Animated.View
        entering={SlideInDown.duration(220)}
        exiting={SlideOutDown.duration(180)}
        accessibilityViewIsModal
        style={[styles.sheet, { paddingBottom: insets.bottom + spacing.lg }]}>
        <View style={styles.handle} />
        <View style={styles.header}>
          <Text style={[typography.title, styles.title]}>{title}</Text>
          <IconButton icon="close" label={`Close ${title}`} onPress={onClose} />
        </View>
        {children}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  scrim: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: colors.scrim,
  },
  fill: {
    flex: 1,
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    maxHeight: '80%',
    backgroundColor: colors.surfaceSheet,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    borderTopWidth: stroke.hairline,
    borderColor: colors.toolRowBorder,
  },
  handle: {
    alignSelf: 'center',
    width: 32,
    height: 4,
    marginTop: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: colors.outlineStrong,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: spacing.lg,
    paddingRight: spacing.xs,
  },
  title: {
    color: colors.text,
  },
});

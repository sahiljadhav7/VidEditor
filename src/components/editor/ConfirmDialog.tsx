import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { Button } from './Button';
import { useEditor } from './EditorProvider';
import { colors, radius, spacing, stroke, typography } from '@/theme';

/** For decisions that must interrupt: a change that takes something with it and can't be undone. */
export function ConfirmDialog() {
  const { confirm, dismissConfirm } = useEditor();
  if (!confirm) return null;

  return (
    <View style={StyleSheet.absoluteFill}>
      <Animated.View entering={FadeIn.duration(150)} style={styles.scrim}>
        <Pressable style={styles.fill} onPress={dismissConfirm} accessibilityLabel={confirm.cancelLabel} />
      </Animated.View>
      <View style={styles.centre} pointerEvents="box-none">
        <Animated.View entering={FadeIn.duration(150)} style={styles.dialog} accessibilityViewIsModal accessibilityRole="alert">
          <Text style={[typography.heading, styles.title]}>{confirm.title}</Text>
          {confirm.message && <Text style={[typography.body, styles.message]}>{confirm.message}</Text>}
          <View style={styles.actions}>
            <Button variant="text" label={confirm.cancelLabel} onPress={dismissConfirm} />
            <Button
              variant="danger"
              label={confirm.confirmLabel}
              onPress={() => {
                dismissConfirm();
                confirm.onConfirm();
              }}
            />
          </View>
        </Animated.View>
      </View>
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
  centre: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  dialog: {
    width: '100%',
    maxWidth: 360,
    gap: spacing.md,
    padding: spacing.xl,
    paddingBottom: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: stroke.hairline,
    borderColor: colors.toolRowBorder,
    backgroundColor: colors.surfaceSheet,
  },
  title: {
    color: colors.text,
  },
  message: {
    color: colors.textSecondary,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
});

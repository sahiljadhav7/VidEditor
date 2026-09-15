import { Pressable, StyleSheet, Text } from 'react-native';

import { Icon, type IconName } from './Icon';
import { colors, radius, spacing, typography } from '@/theme';

type Variant = 'primary' | 'tonal' | 'text' | 'danger';

type Props = {
  label: string;
  onPress: () => void;
  variant?: Variant;
  icon?: IconName;
  disabled?: boolean;
};

const palette: Record<Variant, { background: string; foreground: string; ripple: string }> = {
  primary: { background: colors.accent, foreground: colors.onAccent, ripple: 'rgba(26, 20, 6, 0.16)' },
  tonal: { background: colors.surfaceRaised, foreground: colors.text, ripple: colors.pressedOverlay },
  text: { background: 'transparent', foreground: colors.text, ripple: colors.pressedOverlay },
  danger: { background: 'transparent', foreground: colors.danger, ripple: colors.pressedOverlay },
};

export function Button({ label, onPress, variant = 'tonal', icon, disabled = false }: Props) {
  const tone = palette[variant];
  const filled = variant === 'primary' || variant === 'tonal';
  const background = disabled && filled ? colors.surfaceRaised : tone.background;
  const foreground = disabled ? colors.textDisabled : tone.foreground;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      hitSlop={4}
      android_ripple={{ color: tone.ripple }}
      style={[styles.base, filled ? styles.filled : styles.flat, { backgroundColor: background }]}>
      {icon && <Icon name={icon} size={18} color={foreground} />}
      <Text style={[typography.label, { color: foreground }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    height: 40,
    borderRadius: radius.full,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    overflow: 'hidden',
  },
  filled: {
    paddingHorizontal: spacing.lg,
  },
  flat: {
    paddingHorizontal: spacing.md,
  },
});

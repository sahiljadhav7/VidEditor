import { Pressable, StyleSheet } from 'react-native';

import { Icon, type IconName } from './Icon';
import { colors, touchTarget } from '@/theme';

type Props = {
  icon: IconName;
  label: string;
  onPress: () => void;
  disabled?: boolean;
  color?: string;
};

export function IconButton({ icon, label, onPress, disabled = false, color = colors.text }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      android_ripple={{ color: colors.pressedOverlay, borderless: true, radius: touchTarget / 2 }}
      style={styles.button}>
      <Icon name={icon} color={disabled ? colors.textDisabled : color} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: touchTarget,
    height: touchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { colors, radius, touchTarget } from '@/theme';

const THUMB = 20;
const TRACK = 4;

type Props = {
  value: number;
  onChange: (value: number) => void;
  label: string;
  disabled?: boolean;
};

export function Slider({ value, onChange, label, disabled = false }: Props) {
  const [width, setWidth] = useState(0);
  const progress = useSharedValue(value);

  useEffect(() => {
    progress.set(value);
  }, [value, progress]);

  const pan = Gesture.Pan()
    .enabled(!disabled)
    .minDistance(0)
    .onBegin((e) => {
      if (width <= 0) return;
      progress.value = Math.min(1, Math.max(0, e.x / width));
      scheduleOnRN(onChange, progress.value);
    })
    .onUpdate((e) => {
      if (width <= 0) return;
      progress.value = Math.min(1, Math.max(0, e.x / width));
      scheduleOnRN(onChange, progress.value);
    });

  const fillStyle = useAnimatedStyle(() => ({ width: progress.value * width }));
  const thumbStyle = useAnimatedStyle(() => ({ transform: [{ translateX: progress.value * width - THUMB / 2 }] }));

  const step = (delta: number) => onChange(Math.min(1, Math.max(0, value + delta)));

  return (
    <GestureDetector gesture={pan}>
      <View
        style={styles.touch}
        onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
        accessible
        accessibilityRole="adjustable"
        accessibilityLabel={label}
        accessibilityState={{ disabled }}
        accessibilityValue={{ min: 0, max: 100, now: Math.round(value * 100) }}
        accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
        onAccessibilityAction={(e) => step(e.nativeEvent.actionName === 'increment' ? 0.1 : -0.1)}>
        <View style={styles.track} />
        <Animated.View style={[styles.fill, disabled && styles.disabled, fillStyle]} />
        <Animated.View style={[styles.thumb, disabled && styles.disabled, thumbStyle]} />
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  touch: {
    flex: 1,
    height: touchTarget,
    justifyContent: 'center',
  },
  track: {
    height: TRACK,
    borderRadius: radius.full,
    backgroundColor: colors.outlineStrong,
  },
  fill: {
    position: 'absolute',
    left: 0,
    height: TRACK,
    borderRadius: radius.full,
    backgroundColor: colors.accent,
  },
  thumb: {
    position: 'absolute',
    left: 0,
    width: THUMB,
    height: THUMB,
    borderRadius: radius.full,
    backgroundColor: colors.accent,
  },
  disabled: {
    backgroundColor: colors.textDisabled,
  },
});

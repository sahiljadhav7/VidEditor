import { useEffect, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useAnimatedReaction, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { useEditor } from './EditorProvider';
import type { FrameRect, PlayerMode } from './Player';
import { updateOverlay } from '@/project/edits';
import { overlayBoxColor, overlayFontFamily, overlayFontSize } from '@/project/overlayStyle';
import type { Overlay } from '@/project/types';
import { colors, radius, stroke } from '@/theme';

export type OverlaySizes = Map<string, { width: number; height: number }>;

export function OverlayLayer({ frame, mode, sizes }: { frame: FrameRect; mode: PlayerMode; sizes: OverlaySizes }) {
  const { resolved, textDraft, selection } = useEditor();

  return (
    <View
      pointerEvents="box-none"
      style={[styles.layer, { left: frame.x, top: frame.y, width: frame.width, height: frame.height }]}>
      {resolved.overlays.map(({ overlay, start, end }) => {
        const editing = mode === 'text' && textDraft?.id === overlay.id;
        return (
          <OverlayItem
            key={overlay.id}
            overlay={editing && textDraft ? textDraft : overlay}
            start={start}
            end={end}
            frame={frame}
            editing={editing}
            selected={mode === 'editor' && selection?.kind === 'text' && selection.id === overlay.id}
            draggable={mode === 'editor'}
            hidden={mode === 'text' && !editing}
            sizes={sizes}
          />
        );
      })}
    </View>
  );
}

type ItemProps = {
  overlay: Overlay;
  start: number;
  end: number;
  frame: FrameRect;
  editing: boolean;
  selected: boolean;
  draggable: boolean;
  hidden: boolean;
  sizes: OverlaySizes;
};

function OverlayItem({ overlay, start, end, frame, editing, selected, draggable, hidden, sizes }: ItemProps) {
  const { time, apply, select, updateTextDraft } = useEditor();
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [visible, setVisible] = useState(false);
  const dragX = useSharedValue(0);
  const dragY = useSharedValue(0);

  useAnimatedReaction(
    () => time.value >= start && time.value < end,
    (now, previous) => {
      if (now !== previous) scheduleOnRN(setVisible, now);
    },
    [start, end],
  );

  // The drag offset is kept until the committed position arrives, so the text never jumps back.
  useEffect(() => {
    dragX.set(0);
    dragY.set(0);
  }, [overlay.x, overlay.y, dragX, dragY]);

  const shown = !hidden && (editing || visible);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: dragX.value }, { translateY: dragY.value }],
  }));

  const commitPosition = (translationX: number, translationY: number) => {
    const x = Math.min(1, Math.max(0, overlay.x + translationX / frame.width));
    const y = Math.min(1, Math.max(0, overlay.y + translationY / frame.height));
    apply((p) => updateOverlay(p, overlay.id, { x, y }));
  };

  const pan = Gesture.Pan()
    .enabled(draggable && shown)
    .onStart(() => {
      scheduleOnRN(select, { kind: 'text', id: overlay.id });
    })
    .onUpdate((e) => {
      dragX.value = e.translationX;
      dragY.value = e.translationY;
    })
    .onEnd((e) => {
      scheduleOnRN(commitPosition, e.translationX, e.translationY);
    });

  if (!shown) return null;

  const fontSize = overlayFontSize(overlay.size, frame.width);
  const textStyle = {
    fontFamily: overlayFontFamily(overlay.font),
    fontSize,
    lineHeight: fontSize * 1.2,
    color: overlay.color,
  };
  const boxStyle = overlay.box
    ? { backgroundColor: overlayBoxColor(overlay.color), paddingHorizontal: fontSize * 0.35, paddingVertical: fontSize * 0.1 }
    : null;

  return (
    <GestureDetector gesture={pan}>
      <Animated.View
        onLayout={(e) => {
          const next = { width: e.nativeEvent.layout.width, height: e.nativeEvent.layout.height };
          sizes.set(overlay.id, next);
          setSize(next);
        }}
        style={[
          styles.item,
          {
            left: overlay.x * frame.width - size.width / 2,
            top: overlay.y * frame.height - size.height / 2,
            maxWidth: frame.width * 0.9,
            borderColor: selected || editing ? colors.accent : 'transparent',
          },
          boxStyle,
          animatedStyle,
        ]}>
        {editing ? (
          <TextInput
            autoFocus
            multiline
            value={overlay.text}
            onChangeText={(text) => updateTextDraft({ text })}
            placeholder="Type your text"
            placeholderTextColor="rgba(255, 255, 255, 0.6)"
            selectionColor={colors.accent}
            cursorColor={colors.accent}
            style={[styles.text, textStyle]}
          />
        ) : (
          <Text style={[styles.text, textStyle]}>{overlay.text}</Text>
        )}
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  layer: {
    position: 'absolute',
    overflow: 'hidden',
  },
  item: {
    position: 'absolute',
    borderWidth: stroke.selection,
    borderRadius: radius.xs,
  },
  text: {
    textAlign: 'center',
    padding: 0,
    includeFontPadding: false,
  },
});

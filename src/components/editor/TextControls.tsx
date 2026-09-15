import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useEditor } from './EditorProvider';
import { Icon } from './Icon';
import { OVERLAY_COLORS, OVERLAY_FONTS, OVERLAY_SIZES } from '@/project/overlayStyle';
import { colors, radius, spacing, stroke, touchTarget, typography } from '@/theme';

type Tab = 'font' | 'size' | 'colour';

const TABS: { id: Tab; label: string }[] = [
  { id: 'font', label: 'Font' },
  { id: 'size', label: 'Size' },
  { id: 'colour', label: 'Colour' },
];

/** Rides directly above the keyboard: one tab row, and one control row that swaps with the tab. */
export function TextControls() {
  const { textDraft, updateTextDraft } = useEditor();
  const [tab, setTab] = useState<Tab>('font');
  if (!textDraft) return null;

  return (
    <View style={styles.container}>
      <View style={styles.tabRow}>
        {TABS.map((t) => {
          const active = tab === t.id;
          return (
            <Pressable
              key={t.id}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              onPress={() => setTab(t.id)}
              style={styles.tab}>
              <Text style={[typography.label, { color: active ? colors.accent : colors.textSecondary }]}>{t.label}</Text>
              <View style={[styles.tabIndicator, active && styles.tabIndicatorActive]} />
            </Pressable>
          );
        })}
        <View style={styles.spacer} />
        <Pressable
          accessibilityRole="switch"
          accessibilityLabel="Background box"
          accessibilityState={{ checked: textDraft.box }}
          onPress={() => updateTextDraft({ box: !textDraft.box })}
          style={styles.boxToggle}>
          <Icon
            name={textDraft.box ? 'check_box' : 'check_box_outline_blank'}
            size={20}
            color={textDraft.box ? colors.accent : colors.textSecondary}
          />
          <Text style={[typography.label, { color: textDraft.box ? colors.accent : colors.textSecondary }]}>Box</Text>
        </Pressable>
      </View>

      <ScrollView
        horizontal
        keyboardShouldPersistTaps="always"
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.controlRow}>
        {tab === 'font' &&
          OVERLAY_FONTS.map((font) => (
            <Chip
              key={font.id}
              label={font.label}
              fontFamily={font.family}
              selected={textDraft.font === font.id}
              onPress={() => updateTextDraft({ font: font.id })}
            />
          ))}
        {tab === 'size' &&
          OVERLAY_SIZES.map((size) => (
            <Chip
              key={size.id}
              label={size.label}
              selected={textDraft.size === size.id}
              onPress={() => updateTextDraft({ size: size.id })}
            />
          ))}
        {tab === 'colour' &&
          OVERLAY_COLORS.map((color) => {
            const selected = textDraft.color === color;
            return (
              <Pressable
                key={color}
                accessibilityRole="button"
                accessibilityLabel={`Text colour ${color}`}
                accessibilityState={{ selected }}
                onPress={() => updateTextDraft({ color })}
                style={styles.swatchTarget}>
                <View style={[styles.swatchRing, selected && styles.swatchRingSelected]}>
                  <View style={[styles.swatch, { backgroundColor: color }]} />
                </View>
              </Pressable>
            );
          })}
      </ScrollView>
    </View>
  );
}

function Chip({
  label,
  selected,
  onPress,
  fontFamily,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  fontFamily?: string;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      hitSlop={4}
      style={[styles.chip, selected && styles.chipSelected]}>
      <Text
        style={[
          typography.label,
          fontFamily ? [{ fontFamily, fontWeight: undefined }, styles.chipFontLabel] : null,
          { color: selected ? colors.accent : colors.text },
        ]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderTopWidth: stroke.hairline,
    borderTopColor: colors.toolRowBorder,
  },
  tabRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    height: touchTarget,
  },
  tab: {
    height: touchTarget,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    left: spacing.md,
    right: spacing.md,
    height: stroke.selection,
    borderRadius: radius.full,
  },
  tabIndicatorActive: {
    backgroundColor: colors.accent,
  },
  spacer: {
    flex: 1,
  },
  boxToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    height: touchTarget,
    paddingHorizontal: spacing.md,
  },
  controlRow: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    height: 56,
  },
  chip: {
    height: 36,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.full,
    borderWidth: stroke.hairline,
    borderColor: colors.outline,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipSelected: {
    borderWidth: stroke.selection,
    borderColor: colors.accent,
    backgroundColor: colors.accentSubtle,
  },
  // Android can measure a label in its own font family slightly narrower than it draws it, which
  // clipped the last glyph ("Seri"). A little room on each side keeps the whole word.
  chipFontLabel: {
    paddingHorizontal: spacing.xxs,
  },
  swatchTarget: {
    width: touchTarget,
    height: touchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  swatchRing: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    borderWidth: stroke.selection,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  swatchRingSelected: {
    borderColor: colors.accent,
  },
  swatch: {
    width: 26,
    height: 26,
    borderRadius: radius.full,
    borderWidth: stroke.hairline,
    borderColor: colors.outlineStrong,
  },
});

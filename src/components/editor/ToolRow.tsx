import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { deleteClipRequest } from './confirmations';
import { useEditor } from './EditorProvider';
import { Icon, type IconName } from './Icon';
import { TOOL_ROW_HEIGHT } from './timelineMetrics';
import { addOverlayAt, removeClip, removeOverlay, textsOnClip } from '@/project/edits';
import { colors, radius, spacing, stroke, typography } from '@/theme';

/**
 * The docked tool row. Its states are separate components so they can crossfade later.
 * Nothing selected: Media, Text, Music. A clip: Filter, Delete. A text: Edit, Delete.
 */
export function ToolRow() {
  const { selection, project } = useEditor();
  const insets = useSafeAreaInsets();

  const clipSelected = selection?.kind === 'clip' && project.clips.some((c) => c.id === selection.id);
  const textSelected = selection?.kind === 'text' && project.overlays.some((o) => o.id === selection.id);

  return (
    <View style={[styles.row, { paddingBottom: insets.bottom }]}>
      {clipSelected ? <ClipTools clipId={selection.id} /> : textSelected ? <TextTools textId={selection.id} /> : <MainTools />}
    </View>
  );
}

function MainTools() {
  const { project, time, apply, setSheet, startTextEditing } = useEditor();
  const empty = project.clips.length === 0;

  const addText = () => {
    const result = addOverlayAt(project, time.get());
    const overlay = result.project.overlays.find((o) => o.id === result.overlayId);
    if (!overlay) return;
    apply(() => result.project);
    // Near the end the text starts earlier than the playhead; move there so the new text is on screen.
    time.set(result.start);
    startTextEditing(overlay);
  };

  return (
    <>
      <ToolButton icon="photo_library" label="Media" onPress={() => setSheet('media')} />
      <ToolButton icon="text_fields" label="Text" onPress={addText} disabled={empty} />
      <ToolButton icon="music_note" label="Music" onPress={() => setSheet('music')} />
    </>
  );
}

function ClipTools({ clipId }: { clipId: string }) {
  const { project, panel, apply, select, setPanel, askConfirm } = useEditor();

  const deleteClip = () => {
    const remove = () => {
      apply((p) => removeClip(p, clipId));
      select(null);
      setPanel(null);
    };
    const texts = textsOnClip(project, clipId);
    // Deleting a clip with no text is recoverable from Media; with text it isn't, so only then ask.
    if (texts === 0) remove();
    else askConfirm(deleteClipRequest(texts, remove));
  };

  return (
    <>
      <ToolButton
        icon="filter_vintage"
        label="Filter"
        active={panel === 'filter'}
        onPress={() => setPanel(panel === 'filter' ? null : 'filter')}
      />
      <ToolButton icon="delete" label="Delete" onPress={deleteClip} />
      <View style={styles.slot} />
    </>
  );
}

function TextTools({ textId }: { textId: string }) {
  const { project, apply, select, startTextEditing } = useEditor();
  const overlay = project.overlays.find((o) => o.id === textId);

  return (
    <>
      <ToolButton icon="text_fields" label="Edit" onPress={() => overlay && startTextEditing(overlay)} />
      <ToolButton
        icon="delete"
        label="Delete"
        onPress={() => {
          apply((p) => removeOverlay(p, textId));
          select(null);
        }}
      />
      <View style={styles.slot} />
    </>
  );
}

type ToolButtonProps = {
  icon: IconName;
  label: string;
  onPress: () => void;
  active?: boolean;
  disabled?: boolean;
};

function ToolButton({ icon, label, onPress, active = false, disabled = false }: ToolButtonProps) {
  const tint = disabled ? colors.textDisabled : active ? colors.accent : colors.text;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled, selected: active }}
      disabled={disabled}
      onPress={onPress}
      android_ripple={{ color: colors.pressedOverlay, borderless: false }}
      style={styles.slot}>
      <View style={[styles.indicator, active && styles.indicatorActive]}>
        <Icon name={icon} color={tint} />
      </View>
      <Text style={[typography.label, { color: disabled ? colors.textDisabled : active ? colors.accent : colors.textSecondary }]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    backgroundColor: colors.background,
    borderTopWidth: stroke.hairline,
    borderTopColor: colors.toolRowBorder,
  },
  slot: {
    flex: 1,
    height: TOOL_ROW_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xxs,
  },
  indicator: {
    width: 56,
    height: 32,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  indicatorActive: {
    backgroundColor: colors.accentSubtle,
  },
});

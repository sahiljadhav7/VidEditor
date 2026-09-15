import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect } from 'react';
import { BackHandler, StyleSheet, View } from 'react-native';
import { useReanimatedKeyboardAnimation } from 'react-native-keyboard-controller';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ConfirmDialog } from '@/components/editor/ConfirmDialog';
import { discardEditRequest } from '@/components/editor/confirmations';
import { useEditor } from '@/components/editor/EditorProvider';
import { FilterPanel } from '@/components/editor/FilterPanel';
import { useAddMedia } from '@/components/editor/importMedia';
import { MediaSheet } from '@/components/editor/MediaSheet';
import { Player } from '@/components/editor/Player';
import { Snackbar } from '@/components/editor/Snackbar';
import { SongSheet } from '@/components/editor/SongSheet';
import { TextControls } from '@/components/editor/TextControls';
import { Timeline } from '@/components/editor/Timeline';
import { TOOL_ROW_HEIGHT } from '@/components/editor/timelineMetrics';
import { ToolRow } from '@/components/editor/ToolRow';
import { TopBar } from '@/components/editor/TopBar';
import { Transport } from '@/components/editor/Transport';
import { colors, spacing } from '@/theme';

export default function EditorScreen() {
  const {
    project,
    panel,
    sheet,
    confirm,
    selection,
    textDraft,
    setPanel,
    setSheet,
    dismissConfirm,
    finishTextEditing,
    askConfirm,
    resetProject,
  } = useEditor();
  const addMedia = useAddMedia();
  const insets = useSafeAreaInsets();
  const keyboard = useReanimatedKeyboardAnimation();
  const textMode = panel === 'text' && textDraft !== null;

  // The filter panel belongs to a selected clip; losing the selection closes it.
  useEffect(() => {
    if (panel === 'filter' && selection?.kind !== 'clip') setPanel(null);
  }, [panel, selection, setPanel]);

  // Back closes the topmost layer first, and only asks about the edit once nothing is open.
  useFocusEffect(
    useCallback(() => {
      const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
        if (confirm) {
          dismissConfirm();
          return true;
        }
        if (sheet) {
          setSheet(null);
          return true;
        }
        if (panel === 'text') {
          finishTextEditing();
          return true;
        }
        if (panel === 'filter') {
          setPanel(null);
          return true;
        }
        if (project.clips.length > 0) {
          askConfirm(
            discardEditRequest(() => {
              resetProject();
              BackHandler.exitApp();
            }),
          );
          return true;
        }
        return false;
      });
      return () => subscription.remove();
    }, [confirm, sheet, panel, project.clips.length, dismissConfirm, setSheet, finishTextEditing, setPanel, askConfirm, resetProject]),
  );

  // In text mode the whole column sits above the keyboard, so the player shrinks instead of being covered.
  const columnStyle = useAnimatedStyle(() => ({
    paddingBottom: textMode ? Math.max(insets.bottom, Math.abs(keyboard.height.value)) : 0,
  }));

  return (
    <View style={styles.screen}>
      <Animated.View style={[styles.column, columnStyle]}>
        <TopBar />
        <View style={styles.player}>
          <Player mode={textMode ? 'text' : 'editor'} />
        </View>
        {textMode ? (
          <TextControls />
        ) : (
          <>
            <Transport />
            {panel === 'filter' ? <FilterPanel /> : <Timeline onAddMedia={addMedia} />}
            <ToolRow />
          </>
        )}
      </Animated.View>
      {sheet === 'music' && <SongSheet />}
      {sheet === 'media' && <MediaSheet onAddFromGallery={addMedia} />}
      {!textMode && <Snackbar bottom={TOOL_ROW_HEIGHT + insets.bottom + spacing.sm} />}
      <ConfirmDialog />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  column: {
    flex: 1,
  },
  player: {
    flex: 1,
    minHeight: 160,
  },
});

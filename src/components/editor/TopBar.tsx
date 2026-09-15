import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from './Button';
import { discardEditRequest } from './confirmations';
import { useEditor } from './EditorProvider';
import { IconButton } from './IconButton';
import { colors, spacing, touchTarget } from '@/theme';

export function TopBar() {
  const { project, askConfirm, resetProject, pause } = useEditor();
  const insets = useSafeAreaInsets();
  const hasClips = project.clips.length > 0;

  return (
    <View style={[styles.bar, { paddingTop: insets.top }]}>
      <View style={styles.leading}>
        {hasClips && (
          <IconButton icon="close" label="Discard this edit" onPress={() => askConfirm(discardEditRequest(resetProject))} />
        )}
      </View>
      <Button
        variant="primary"
        label="Preview"
        disabled={!hasClips}
        onPress={() => {
          pause();
          router.push('/preview');
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 56,
    paddingLeft: spacing.xs,
    paddingRight: spacing.lg,
    backgroundColor: colors.background,
  },
  leading: {
    minWidth: touchTarget,
  },
});

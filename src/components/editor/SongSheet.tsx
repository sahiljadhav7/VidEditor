import { useAudioPlayer } from 'expo-audio';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button } from './Button';
import { useEditor } from './EditorProvider';
import { Icon } from './Icon';
import { IconButton } from './IconButton';
import { Sheet } from './Sheet';
import { Slider } from './Slider';
import { useLocalSong } from './useLocalSong';
import { SONGS, findSong } from '@/project/catalogue';
import { setBalance, setSong } from '@/project/edits';
import { formatTimecode } from '@/project/format';
import { colors, spacing, typography } from '@/theme';

export function SongSheet() {
  const { project, apply, setSheet, pause } = useEditor();
  const current = findSong(project.music.songId);

  // Listening is separate from the composition: its own player, from the top of the song.
  const [listeningId, setListeningId] = useState<string | null>(null);
  const listening = findSong(listeningId);
  const localListening = useLocalSong(listening);
  const audition = useAudioPlayer(localListening);

  useEffect(() => {
    if (!listening || !localListening) return;
    // Nothing else should be playing while the creator is listening to a song.
    pause();
    audition.seekTo(0).then(() => audition.play()).catch(() => setListeningId(null));
  }, [audition, listening, localListening, pause]);

  // Leaving the sheet stops the audition rather than leaving it playing under the editor.
  useEffect(() => () => setListeningId(null), []);

  return (
    <Sheet
      title="Music"
      onClose={() => {
        setListeningId(null);
        setSheet(null);
      }}>
      {SONGS.length === 0 ? (
        <View style={styles.empty}>
          <Icon name="library_music" size={32} color={colors.textSecondary} />
          <Text style={[typography.bodyStrong, styles.text]}>No songs yet</Text>
          <Text style={[typography.body, styles.secondary, styles.centred]}>
            Songs will show up here, each with its credit line.
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.list}>
          {SONGS.map((song) => {
            const selected = song.id === project.music.songId;
            return (
              <Pressable
                key={song.id}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                onPress={() => apply((p) => setSong(p, song.id))}
                android_ripple={{ color: colors.pressedOverlay }}
                style={[styles.row, selected && styles.rowSelected]}>
                <View style={styles.rowText}>
                  <Text numberOfLines={1} style={[typography.bodyStrong, styles.text]}>
                    {song.title}
                  </Text>
                  <Text numberOfLines={1} style={[typography.caption, styles.secondary]}>
                    {song.artist} · {song.mood} · {song.genre} · {formatTimecode(song.duration).slice(0, -2)}
                  </Text>
                  <Text style={[typography.caption, styles.secondary]}>{song.creditLine}</Text>
                </View>
                <IconButton
                  icon={song.id === listeningId ? 'stop' : 'play_arrow'}
                  label={song.id === listeningId ? `Stop ${song.title}` : `Listen to ${song.title}`}
                  onPress={() => setListeningId(song.id === listeningId ? null : song.id)}
                />
                {selected && <Icon name="check" color={colors.accent} />}
              </Pressable>
            );
          })}
        </ScrollView>
      )}

      {current && (
        <View style={styles.current}>
          <Text style={[typography.label, styles.text]}>Balance</Text>
          <View style={styles.balanceRow}>
            <Text style={[typography.label, styles.secondary]}>Clips</Text>
            <Slider
              label="Balance between the clips' sound and the music"
              value={project.music.balance}
              onChange={(value) => apply((p) => setBalance(p, value))}
            />
            <Text style={[typography.label, styles.secondary]}>Music</Text>
          </View>
          <View style={styles.removeRow}>
            <Button variant="text" label="Remove song" onPress={() => apply((p) => setSong(p, null))} />
          </View>
        </View>
      )}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  text: {
    color: colors.text,
  },
  secondary: {
    color: colors.textSecondary,
  },
  centred: {
    textAlign: 'center',
  },
  empty: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxl,
  },
  list: {
    paddingBottom: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: 64,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  rowSelected: {
    backgroundColor: colors.accentSubtle,
  },
  rowText: {
    flex: 1,
    gap: spacing.xxs,
  },
  current: {
    gap: spacing.xs,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  removeRow: {
    alignItems: 'flex-start',
  },
});

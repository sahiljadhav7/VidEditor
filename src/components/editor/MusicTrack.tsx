import { setAudioModeAsync, useAudioPlayer } from 'expo-audio';
import { useCallback, useEffect, useRef } from 'react';
import { useAnimatedReaction } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { useEditor } from './EditorProvider';
import { findSong } from '@/project/catalogue';
import { MUSIC_FADE_OUT } from '@/project/rules';

/**
 * How often the music is checked against the playhead. The editor's clock is the master: the
 * song is corrected towards it, never the other way round.
 */
const SYNC_INTERVAL_MS = 100;
/** Re-seek the song once it is this far from where the playhead says it should be. */
const DRIFT_TOLERANCE = 0.25;
/** Below this, a volume change isn't worth a call across to the native player. */
const VOLUME_EPSILON = 0.01;

/** 0 keeps only the clips' sound, 1 only the music, and the middle plays both at full volume. */
function musicVolumeFor(balance: number) {
  return balance >= 0.5 ? 1 : 2 * balance;
}

/**
 * The fade-out at the end of the composition. A composition shorter than the fade itself fades
 * across its whole length rather than starting part-way through at less than full volume.
 */
function fadeFactorAt(time: number, duration: number) {
  if (duration <= 0) return 0;
  const fade = Math.min(MUSIC_FADE_OUT, duration);
  const fadeStart = duration - fade;
  if (time <= fadeStart) return 1;
  return Math.max(0, (duration - time) / fade);
}

/**
 * Plays the chosen song under the composition, in step with the playhead.
 *
 * Mounted once inside the EditorProvider, so the Editor and the Preview screen share one player
 * and the song keeps its place when the creator moves between them.
 *
 * The song is not a second clock. `expo-audio` runs its own, so this only ever nudges the song
 * back towards the playhead: it seeks on play, on a scrub, and whenever the two have drifted.
 * Looping is left to the player, which covers a song shorter than the composition; a song longer
 * than the composition is simply cut short when the playhead reaches the end.
 */
export function MusicTrack() {
  const { project, resolved, time, playing, duration } = useEditor();
  const song = findSong(project.music.songId);
  const player = useAudioPlayer(song ? song.source : null);

  const balance = project.music.balance;
  const hasMusic = resolved.music !== null;
  /** Set whenever the song's position can no longer be trusted, so the next tick seeks. */
  const needsSeek = useRef(true);
  const lastVolume = useRef(-1);

  useEffect(() => {
    // A phone left on silent should still play the music the creator just chose.
    setAudioModeAsync({ playsInSilentMode: true, shouldPlayInBackground: false }).catch(() => {
      // Not fatal: the default mode still plays through the speaker.
    });
  }, []);

  useEffect(() => {
    player.loop = true;
  }, [player]);

  // A new song, or none, starts from the playhead rather than wherever the last one had reached.
  useEffect(() => {
    needsSeek.current = true;
  }, [song?.id]);

  const sync = useCallback(() => {
    if (!hasMusic) {
      if (player.playing) player.pause();
      needsSeek.current = true;
      return;
    }

    const now = time.get();
    const total = duration.get();

    const volume = musicVolumeFor(balance) * fadeFactorAt(now, total);
    if (Math.abs(volume - lastVolume.current) > VOLUME_EPSILON) {
      player.volume = volume;
      lastVolume.current = volume;
    }

    if (!playing.get()) {
      if (player.playing) player.pause();
      // The playhead can move while paused (scrubbing), so the next play must find its place again.
      needsSeek.current = true;
      return;
    }

    // Where the playhead falls inside the song, given the player is looping it.
    const songLength = player.duration > 0 ? player.duration : song?.duration ?? 0;
    const target = songLength > 0 ? now % songLength : now;

    if (needsSeek.current) {
      // Play only once the song is in position, so it can't blurt out the old one first.
      needsSeek.current = false;
      player
        .seekTo(target)
        .then(() => {
          if (playing.get()) player.play();
        })
        .catch(() => {
          // A failed seek leaves the song where it was; the next tick tries again.
          needsSeek.current = true;
        });
      return;
    }

    // Measured the short way round the song, so the wrap from the end back to the start reads as
    // a small step rather than a whole song's worth of drift and provokes a seek every loop.
    const gap = Math.abs(player.currentTime - target);
    const drift = songLength > 0 ? Math.min(gap, songLength - gap) : gap;
    if (drift > DRIFT_TOLERANCE) {
      player.seekTo(target).catch(() => {
        needsSeek.current = true;
      });
    }

    if (!player.playing) player.play();
  }, [balance, duration, hasMusic, player, playing, song?.duration, time]);

  // Play and pause are followed at once, so the music doesn't lag the picture by up to a tick.
  useAnimatedReaction(
    () => playing.value,
    (now, previous) => {
      if (now !== previous) scheduleOnRN(sync);
    },
    [sync],
  );

  useEffect(() => {
    sync();
    const timer = setInterval(sync, SYNC_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [sync]);

  // Nothing to draw: the music track is heard, not seen.
  return null;
}

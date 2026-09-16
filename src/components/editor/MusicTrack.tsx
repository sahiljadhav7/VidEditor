import { setAudioModeAsync, useAudioPlayer } from 'expo-audio';
import { useCallback, useEffect, useRef } from 'react';
import { useAnimatedReaction } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { useEditor } from './EditorProvider';
import { findSong } from '@/project/catalogue';
import { MUSIC_FADE_OUT } from '@/project/rules';
import { useLocalSong } from './useLocalSong';

/**
 * How often the music is checked against the playhead. The editor's clock is the master: the
 * song is corrected towards it, never the other way round.
 */
const SYNC_INTERVAL_MS = 100;
/** Re-seek the song once it is this far from where the playhead says it should be. */
const DRIFT_TOLERANCE = 0.25;
/**
 * After a seek, drift isn't measured again for this long. A seek takes a moment to land (and in development
 * each one is a new HTTP request to Metro), so checking sooner reads the old position and seeks again,
 * flooding the connection until a request times out and the player errors.
 */
const SEEK_SETTLE_MS = 1000;
/** How long to wait before reloading a song whose player has errored. */
const RELOAD_AFTER_ERROR_MS = 2000;
/** Below this, a volume change isn't worth a call across to the native player. */
const VOLUME_EPSILON = 0.01;

/** 0 keeps only the clips' sound, 1 only the music, and the middle plays both at full volume. */
function musicVolumeFor(balance: number) {
  return balance >= 0.5 ? 1 : 2 * balance;
}

/**
 * The fade-out at the end of the song's range. A range shorter than the fade itself fades across
 * its whole length rather than starting part-way through at less than full volume.
 */
function fadeFactorAt(time: number, start: number, end: number) {
  const length = end - start;
  if (length <= 0) return 0;
  const fade = Math.min(MUSIC_FADE_OUT, length);
  const fadeStart = end - fade;
  if (time <= fadeStart) return 1;
  return Math.max(0, (end - time) / fade);
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
  const { project, resolved, time, playing } = useEditor();
  const song = findSong(project.music.songId);
  const localSong = useLocalSong(song);
  const player = useAudioPlayer(localSong);

  const balance = project.music.balance;
  const hasMusic = resolved.music !== null;
  const musicStart = resolved.music?.start ?? 0;
  const musicEnd = resolved.music?.end ?? 0;
  /** Set whenever the song's position can no longer be trusted, so the next tick seeks. */
  const needsSeek = useRef(true);
  const lastVolume = useRef(-1);
  const lastSeekAt = useRef(0);
  const lastReloadAt = useRef(0);

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

    // An errored player never recovers by itself (a dropped connection leaves it silent for good), so reload it.
    // Android reports the error only as an event, never in currentStatus; the player just drops back to idle.
    const status = player.currentStatus;
    if (localSong && (status.error || status.playbackState === 'idle')) {
      const nowMs = Date.now();
      if (nowMs - lastReloadAt.current > RELOAD_AFTER_ERROR_MS) {
        lastReloadAt.current = nowMs;
        player.replace(localSong);
        player.loop = true;
        lastVolume.current = -1;
      }
      needsSeek.current = true;
      return;
    }

    const now = time.get();

    const volume = musicVolumeFor(balance) * fadeFactorAt(now, musicStart, musicEnd);
    if (Math.abs(volume - lastVolume.current) > VOLUME_EPSILON) {
      player.volume = volume;
      lastVolume.current = volume;
    }

    // Outside the song's range the playhead is in silence; re-entering it must find its place again.
    if (!playing.get() || now < musicStart || now >= musicEnd) {
      if (player.playing) player.pause();
      // The playhead can move while paused (scrubbing), so the next play must find its place again.
      needsSeek.current = true;
      return;
    }

    // Where the playhead falls inside the song, given the player is looping it.
    const songLength = player.duration > 0 ? player.duration : song?.duration ?? 0;
    const intoSong = now - musicStart;
    const target = songLength > 0 ? intoSong % songLength : intoSong;

    // Nothing to line up until the song has loaded; the next tick tries again.
    if (!player.isLoaded) {
      needsSeek.current = true;
      return;
    }

    if (needsSeek.current) {
      // Play only once the song is in position, so it can't blurt out the old one first.
      needsSeek.current = false;
      lastSeekAt.current = Date.now();
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
    const settling = player.isBuffering || Date.now() - lastSeekAt.current < SEEK_SETTLE_MS;
    if (drift > DRIFT_TOLERANCE && !settling) {
      lastSeekAt.current = Date.now();
      player.seekTo(target).catch(() => {
        needsSeek.current = true;
      });
    }

    if (!player.playing) player.play();
  }, [balance, hasMusic, localSong, musicEnd, musicStart, player, playing, song?.duration, time]);

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

import { Asset } from 'expo-asset';
import { useEffect, useMemo, useState } from 'react';

import type { Song } from '@/project/catalogue';

/**
 * The song as a file on the device, or null until it's there.
 *
 * In development a bundled song is served by Metro, and the audio player streams it with a new HTTP
 * request per seek; on a phone over Wi-Fi those requests time out and leave the player silent for good.
 * Downloading it once and playing the local file takes the network out of playback.
 */
export function useLocalSong(song: Song | null): { uri: string } | null {
  const [local, setLocal] = useState<{ id: string; uri: string } | null>(null);

  useEffect(() => {
    if (!song) return;
    let cancelled = false;
    Asset.fromModule(song.source)
      .downloadAsync()
      .then((asset) => {
        if (!cancelled && asset.localUri) setLocal({ id: song.id, uri: asset.localUri });
      })
      .catch(() => {
        // Left null: the song stays silent rather than half-playing from the network.
      });
    return () => {
      cancelled = true;
    };
  }, [song]);

  const uri = song && local?.id === song.id ? local.uri : null;
  // Stable per file, so players and effects keyed on it don't restart on every render.
  return useMemo(() => (uri ? { uri } : null), [uri]);
}

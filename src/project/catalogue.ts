export type Song = {
  id: string;
  title: string;
  artist: string;
  mood: string;
  genre: string;
  duration: number;
  creditLine: string;
  /** The bundled file, from require(). */
  source: number;
};

/**
 * Empty until songs whose licence allows bundling them in an app are picked.
 * That is a human task (docs/tickets/04-music.md). Never generate or scrape entries.
 */
export const SONGS: readonly Song[] = [];

export function findSong(songId: string | null): Song | null {
  return SONGS.find((s) => s.id === songId) ?? null;
}

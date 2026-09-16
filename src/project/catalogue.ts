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
 * The bundled catalogue.
 *
 * One curated track, not a finished catalogue: the shape is here and the picker reads it, but a
 * release needs the full 8–12 songs of docs/tickets/04-music.md. Picking them is a human task.
 *
 * Every entry must be checked against its own source page before it ships, because the credit
 * line is the one field a listener is asked to pass on. This one was:
 * https://pixabay.com/music/adventure-wonders-of-the-earth-550792/
 * — title, uploader and duration as displayed there, under the Pixabay Content License, which
 * allows bundling it in an app and does not require attribution.
 */
export const SONGS: readonly Song[] = [
  {
    id: 'wonders-of-the-earth',
    title: 'Wonders of the Earth',
    artist: 'Grand_Project',
    mood: 'Calm',
    genre: 'Cinematic',
    duration: 149.6,
    creditLine: 'Wonders of the Earth by Grand_Project — Pixabay',
    source: require('../../assets/music/grand_project-wonders-of-the-earth-550792.mp3'),
  },
];

export function findSong(songId: string | null): Song | null {
  return SONGS.find((s) => s.id === songId) ?? null;
}

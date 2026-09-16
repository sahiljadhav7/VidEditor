/**
 * The project: everything being edited in one sitting, as one serializable object (ADR 0001).
 * Vocabulary follows CONTEXT.md. All times are in seconds.
 */

export type AssetKind = 'video' | 'photo';

export type Asset = {
  id: string;
  kind: AssetKind;
  uri: string;
  width: number;
  height: number;
  /** Videos only. A photo has no length of its own. */
  duration: number | null;
  hasAudio: boolean;
  fileName: string | null;
};

export type ClipLook = {
  lookId: string;
  /** 0 is the original, 1 is the full look. */
  intensity: number;
};

type ClipBase = {
  id: string;
  assetId: string;
  look: ClipLook | null;
};

export type VideoClip = ClipBase & {
  kind: 'video';
  inPoint: number;
  outPoint: number;
};

export type PhotoClip = ClipBase & {
  kind: 'photo';
  duration: number;
};

export type Clip = VideoClip | PhotoClip;

export type OverlayFont = 'sans' | 'serif' | 'mono' | 'condensed';
export type OverlaySize = 'small' | 'medium' | 'large';

export type Overlay = {
  id: string;
  anchorClipId: string;
  /** Seconds from the start of the anchor clip. */
  offset: number;
  duration: number;
  text: string;
  font: OverlayFont;
  color: string;
  box: boolean;
  size: OverlaySize;
  /** Centre of the text as a fraction of the frame, 0–1. */
  x: number;
  y: number;
};

export type MusicSettings = {
  songId: string | null;
  /** 0 plays only the clips' own sound, 1 plays only the music. */
  balance: number;
  /** Where the song begins, in composition time. The song plays from its own beginning here. */
  start: number;
  /** Where the song stops, in composition time. Null runs it to the end of the composition. */
  end: number | null;
};

export type Project = {
  assets: Asset[];
  clips: Clip[];
  overlays: Overlay[];
  music: MusicSettings;
};

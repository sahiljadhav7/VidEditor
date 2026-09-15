import { makeMutable } from 'react-native-reanimated';

/**
 * True while the timeline is being dragged or is still coasting after a fling.
 * The player reads it to show extracted thumbnails instead of decoding video under a moving finger.
 */
export const scrubbing = makeMutable(false);

/** Bumped on every scrub start, so a fling that finishes late can't clear a newer scrub. */
export const scrubToken = makeMutable(0);

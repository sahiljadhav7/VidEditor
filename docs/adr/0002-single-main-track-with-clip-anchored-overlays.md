# One gapless main track, with overlays anchored to clips

The composition has one ordered, gapless main track of clips, plus overlays drawn on top of it. Overlays have their own timing and may run across clip boundaries, rather than belonging to a single clip.

An overlay's timing is stored as `{anchorClipId, offsetIntoClip, duration}`, not as composition-time start and end. It therefore moves with its anchor clip when earlier clips are trimmed, removed or reordered. Choosing an overlay layer only works if we also say what happens to overlays when the main track changes underneath them, so both decisions are recorded here.

## Considered Options

**Timeline shape**

- **Single track, text owned by a clip.** Rejected: a title cannot run across a cut.
- **One main track plus an overlay layer.** Chosen.
- **Multiple tracks** (picture-in-picture, gaps, overlapping clips). Rejected: roughly triples the work on the compositor, the timeline UI and hit-testing, for a feature nobody asked for.

**Overlay anchoring** (this choice only exists because of the overlay layer)

- **Absolute composition time.** Rejected: deleting an earlier clip leaves the text sitting on footage the user never chose. Users experience this as captions coming loose.
- **Anchored to a clip, re-anchored to a neighbour when that clip is deleted.** Rejected: it quietly moves text onto footage the user never chose.
- **Anchored to a clip, removed with it.** Chosen.

## Rules

- **Trimming the anchor clip:** if a trim moves the overlay's start out of the clip's range, the offset is clamped back into the range. The overlay keeps its duration; it is not collapsed to one frame.
- **Overlays past the end:** an overlay that runs past the end of the composition is cut short when it is drawn. This is a drawing rule only; the stored duration does not change.
- **Removing the anchor clip:** its overlays are removed too.
- **Empty main track:** adding text is disabled.
- **Split (future):** overlays anchored to the clip being split that start after the cut move to the new second clip, with their offsets rebased. This is not an exception to anchoring: the footage is the same, only the clip ID is new.

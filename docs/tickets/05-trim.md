# 05: Trim

**What to build:** trimming clips.

- The creator selects a clip and drags its handles. For a video clip, the handles set the source range. For a photo clip, a handle sets its duration.
- The original footage is kept, so a clip can be widened again later.
- Trims show in Preview straight away and in the saved file.
- Text anchored to a trimmed clip stays with its footage.

**Blocked by:** 03b.

**Status:** ready-for-agent

**Project model** (all Jest-tested)
- [ ] Setting a source range:
  - clamps to a minimum of 0.5 s
  - clamps the out-point to the asset's duration
  - clamps the in-point to 0 or more
- [ ] Setting a photo duration clamps between 0.5 s and 30 s.
- [ ] Overlay anchoring under trim (ADR 0002), with these cases:
  - Trimming the anchor clip's start past the overlay's offset clamps the offset back inside the clip.
  - Trimming the anchor clip's end before the overlay's offset clamps it too.
  - In both cases the overlay keeps its duration and is never collapsed to one frame.
  - Trimming an earlier clip moves later overlays in composition time along with their anchor clips.

**Editor**
- [ ] Selecting a clip on the main track shows trim handles.
  - A video clip gets start and end handles, showing the in-point and out-point times.
  - A photo clip gets a single duration handle.
- [ ] Handles stop at the limits instead of jumping past them.
- [ ] The project changes once, when the drag is released (one committed gesture, as in ADR 0001). The on-screen feedback can update while dragging.

**Preview and export**
- [ ] Preview reflects the trim straight away.
- [ ] The export snapshot tests are updated to include a trimmed video clip and a resized photo clip.

**Checked on the phone**
- [ ] Trim a clip that has text anchored to it, and trim the clip before it.
- [ ] The text stays on the same footage in Preview and in the saved file.

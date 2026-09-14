# 07: Text overlays

**What to build:** text over the video.

- The creator taps Text to add an overlay at the playhead. They type it, then choose a font, a colour, a size (small, medium or large) and whether it has a background box.
- They drag it to position it in the frame, and set how long it stays on screen, which may run across cuts.
- Overlays show in Preview and in the saved file.
- Several overlays can exist at once, and each can be edited or deleted.
- Text is disabled while the main track is empty.

**Blocked by:** 03b. Built before 05 and 06. How overlays behave under trim, removal and reordering is tested in those tickets.

**Status:** ready-for-agent

**Project model**
- [ ] Project model edits: add, update and remove an overlay.
  - A new overlay is anchored to the clip under the playhead, offset to the playhead's position within that clip.
  - Default duration is 3 s; default position is the centre of the frame.
  - Adding with no clips returns the project unchanged.
  - Jest tests cover these.
- [ ] Resolve step: an overlay's composition-time start and end come from its anchor clip's start plus its offset. An overlay running past the end of the composition is cut short when resolved; its stored duration doesn't change. Jest tests cover both.
- [ ] Moving an overlay is stored as a fraction of the frame, so it doesn't depend on screen size.

**Editor**
- [ ] The Text button is disabled while the main track is empty.
- [ ] The overlay editor offers: text input, 3–4 bundled fonts, a fixed colour palette, a background box on/off, and small/medium/large size. There is no pinch-to-scale or rotate.
- [ ] Dragging an overlay on the Preview positions it.
- [ ] Overlays appear as bars under the main track; dragging a bar's end changes the overlay's duration.
- [ ] Several overlays can exist, and any overlay can be selected, edited or deleted.

**Preview and export**
- [ ] Preview draws the active overlays with Skia, using the same font files as export.
- [ ] Export plan: overlays are drawn with their resolved timing, font file, colour, box, size and position. The snapshot tests are updated, including an overlay that runs across a cut.

**Checked on the phone**
- [ ] Two overlays, one running across a cut, appear at the same times and roughly the same positions in Preview and in the saved file.

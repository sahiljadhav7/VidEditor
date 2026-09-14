# 01: Export spike (4-hour timebox)

**What to build:** prove that the phone can export. A development build of the app, running on the real Android phone, exports a hardcoded project to an MP4 in the gallery. The project contains:

- two video clips
- one photo clip
- one text overlay that runs across a cut
- one song

This ticket also sets up the two pure seams that every later ticket uses: the project model with its resolve step, and the export-plan function. See `docs/spec.md` and ADR 0004.

**Blocked by:** None (can start immediately).

**Status:** ready-for-agent

**Timebox: 4 hours.**
- **If it succeeds:** 02 starts.
- **If there is no successful encode from a development build on the phone by then:** stop. Decide during the day whether to fall back to preview-only. Record that as a new ADR replacing the export parts of ADR 0003 and ADR 0004.

**Setup**
- [ ] Expo + TypeScript project created; runs as a development build (prebuilt and installed on the Android phone, not Expo Go).
- [ ] A community fork of FFmpeg-kit and React Native Skia both load in the development build. Which fork was chosen, and why, is noted in the README.
- [ ] The fork's build includes the `drawtext` filter (with its font library) and an H.264 encoder that works on this phone. Confirmed by running a command, not by reading docs.
- [ ] Jest runs the pure-TypeScript tests.

**The two pure seams**
- [ ] First version of the project model: one serializable project object holding assets, clips (video clips with a source range, photo clips with a duration), overlays (anchor clip, offset, duration, text, font, colour, box, size preset, position) and music settings. Plus the resolve step.
- [ ] Jest tests for the resolve step with the spike project:
  - clip start times
  - the photo's duration
  - the overlay's composition time as it runs across the cut
  - the music cut short to the composition's length, with the fade-out placed
- [ ] The export-plan function turns the resolved composition into FFmpeg arguments. It covers:
  - fitting clips into 1080×1920 with padding
  - turning the photo into video
  - silence for clips with no audio
  - joining the clips
  - drawing text with a bundled font
  - looping or cutting the song short and fading it out
  - mixing the music with the clips' own sound
  - H.264 + AAC output
- [ ] A Jest snapshot test of the export-plan function for the spike project.

**Checked on the phone**
- [ ] The test media (two short videos, one photo, one royalty-free song, one font) is bundled with the app and copied somewhere FFmpeg can read it.
- [ ] Tapping one button exports the project and saves the MP4 to the Android gallery.
- [ ] Opened from the gallery, the saved video:
  - is 9:16
  - plays both clips and then the photo
  - shows the text across the cut
  - has the song audible, fading out at the end

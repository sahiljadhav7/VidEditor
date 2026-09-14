# 03a: Preview playback of a single clip

**What to build:** the Preview player in the Editor, working for one video clip.

- Skia draws the clip fitted into a 9:16 frame.
- The creator can play and pause, see a playhead and the current and total time, scrub to any moment, and replay from the end.

**Blocked by:** 02.

**Status:** ready-for-agent

**Player**
- [ ] Preview uses Skia to draw the frame at the playhead for a project with one video clip, fitted into 9:16 with padding.
- [ ] The frame is drawn from the resolved composition, not from the raw project.
- [ ] Play and pause work. The playhead moves along the timeline strip while playing.
- [ ] The current time and total duration are shown.
- [ ] Scrubbing the timeline shows the frame under the finger. Letting go leaves playback paused at that point.
- [ ] Playback stops at the end, and pressing play again replays from the start.

**Audio**
- [ ] Find out whether Skia's video playback plays the clip's audio in sync. Note the finding in the README, because 03b depends on it.

**Tests**
- [ ] Jest tests cover the resolve step's answer to "which clip is at time t, and at what point in its source": start, middle, the exact end, and a time past the end.

**Checked on the phone**
- [ ] Portrait, landscape and 4K clips each play, pause and scrub without freezing.

# 03b: Preview across clip boundaries

**What to build:** Preview plays the whole composition as one video. It carries on across clip boundaries without stopping, shows photo clips for their duration, and plays each clip's own sound in step with the picture.

**Blocked by:** 03a.

**Status:** ready-for-agent

**Playback**
- [ ] Play continues from one clip into the next without stopping or needing another tap.
- [ ] Photo clips are drawn fitted into 9:16 for their duration.
- [ ] Scrubbing across a boundary shows the correct clip's frame on each side.
- [ ] Each video clip's own sound plays in step with its picture. Clips with no audio (photos, and videos with no sound) are silent.
- [ ] If Skia can't play audio (see 03a's finding), the sound is played by Expo's audio/video players, kept in step with the playhead. The approach used is noted in the README.
- [ ] A visible hitch at a clip boundary is acceptable as long as timing doesn't drift. Record how bad it is in the README.

**Tests**
- [ ] Jest tests cover the resolve step for mixed video and photo projects: boundary times, and the source time at points just before and just after each boundary.

**Checked on the phone**
- [ ] A project with 3 videos and 2 photos in alternating order plays end to end.
- [ ] Audio stays in step at the last clip.
- [ ] The Preview roughly matches the saved file from Save.

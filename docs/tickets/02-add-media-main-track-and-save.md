# 02: Add media, main track and Save

**What to build:** the first real flow, replacing the hardcoded spike project.

1. On the Add media screen, the creator picks several videos and photos from the gallery in one go.
2. The files become assets in the media bin and clips on the main track, in the order picked.
3. The Editor shows the clips as a strip.
4. The Save screen plays the finished video full-screen, exports it with a progress bar, saves it to the gallery, and offers to share it.

**Blocked by:** 01.

**Status:** ready-for-agent

**Adding media**
- [ ] The Add media screen opens the picker with multiple selection; videos and photos can be mixed.
- [ ] Each picked file is probed with the FFmpeg fork's `ffprobe` for kind, duration, pixel size and whether it has audio.
- [ ] A file that fails to probe is rejected with a clear message; the other files in the pick are still added.
- [ ] Project model edit: add assets and append clips. Photo clips default to 3 s; video clips cover the whole asset. Jest tests cover this.
- [ ] An empty project shows a prompt to add media rather than a blank editor.

**Editor and Save screen**
- [ ] The Editor shows the main track as an ordered strip of clips, each with a thumbnail and its duration.
- [ ] The Editor's Save button opens the Save screen.
- [ ] The Save screen plays the export or a full-screen preview, then exports using the export plan from 01, with a progress bar.
- [ ] The saved MP4 appears in the gallery. A share button opens the system share sheet with the file.
- [ ] Gallery permission is requested only when needed. If it's refused, a message explains what won't work.
- [ ] A failed export shows a message and returns to the Editor with the project intact.
- [ ] Back from Save returns to the Editor.
- [ ] All UI text uses the UI labels in `CONTEXT.md`. The word "Export" never appears in the UI.

**README**
- [ ] The README states that everything is in memory only (closing the app loses the project), that there is no undo, and lists the other ADR 0003 cuts.

**Checked on the phone**
- [ ] Pick 2 videos (including one 4K camera video) and 1 photo, then save.
- [ ] The saved file appears in the gallery and plays correctly.

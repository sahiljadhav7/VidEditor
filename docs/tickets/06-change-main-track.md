# 06: Change the main track

**What to build:** changing what's on the main track.

- The creator adds more media from inside the Editor; it goes at the end.
- They remove a clip; its media stays in the media bin, and text anchored to the clip goes with it.
- They long-press and drag to reorder clips; text moves with its clip.
- They place media from the media bin on the main track again.
- They remove media from the media bin, after a confirmation that says how many clips will go.

**Blocked by:** 02.

**Status:** ready-for-agent

**Project model** (all Jest-tested)
- [ ] Add a clip for an existing asset: it goes at the end, and the same asset can back several clips.
- [ ] Remove a clip: the asset stays in the media bin, and overlays anchored to the clip are removed.
- [ ] Move a clip to a new position: overlays anchored to it move with it in composition time; overlays on other clips stay on their clips.
- [ ] Remove an asset: every clip using it is removed, along with those clips' overlays.
- [ ] Round-trip: the project still serializes after each of these edits.

**Editor**
- [ ] An Add media button in the Editor opens the picker and appends clips, using the same probing and rejection as 02.
- [ ] The media bin shows all assets. Tapping one adds a clip for it at the end.
- [ ] A selected clip can be deleted.
- [ ] Long-press and drag reorders clips on the main track.
- [ ] Removing an asset that clips use asks for confirmation first, naming how many clips (and how many texts) will be removed. There is no undo, so this confirmation is the only safety net.
- [ ] Removing the last clip returns the Editor to its empty state, and Text becomes disabled.

**Checked on the phone**
- [ ] With text anchored to clip 2 of 3, move clip 2 to the front: the text moves with it. Remove clip 2: the text goes with it.
- [ ] Preview and the saved file agree after both steps.

# 08: Looks

**What to build:** looks for clips.

- The creator selects a clip and picks one of 6–10 named looks from a row of thumbnails showing each look on that clip.
- They adjust its intensity with a slider, or remove the look.
- Looks work on photo clips and video clips.
- The saved file's colours look visibly similar to Preview.

**Blocked by:** 03b.

**Status:** ready-for-agent

**Look data and project model**
- [ ] Each look is authored as data: a name plus a colour matrix (a 3×3 RGB mix and an offset per channel). There are no CSS filters or shader-only effects, so preview and export can both apply it.
- [ ] Project model edits: set a look with an intensity, and clear the look. Jest tests cover these.
- [ ] Intensity blends between the identity matrix and the look's matrix. Jest tests cover 0 (identity), 1 (the look itself) and a value in between.

**Editor and Preview**
- [ ] Selecting a clip shows a look row with a thumbnail per look, applied to that clip's frame. Each look's name uses the UI label "Filter" wherever the feature itself is named.
- [ ] Preview applies the clip's look as a Skia colour matrix at its intensity, on video clips and photo clips alike.

**Export**
- [ ] Export plan: each clip's look is turned into FFmpeg colour filters built from the same matrix and intensity. The snapshot tests are updated, including a photo clip with a look.

**Checked on the phone**
- [ ] For every look at full intensity, Preview and the saved file are **visibly similar** side by side: same direction of warmth, contrast and saturation.
- [ ] Exact pixel matches are not required.

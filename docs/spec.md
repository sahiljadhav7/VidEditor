# Spec: First release of the mobile video editor

**Status:** ready-for-agent

Vocabulary follows `CONTEXT.md`. Decisions follow ADRs 0001–0004. Build order and tickets are in `docs/tickets/`.

## Problem Statement

A creator has a handful of videos and photos on their phone and wants to turn them into one short video for Reels or Shorts, with some text on screen and a song underneath. The existing editors (CapCut, VN, InShot) do this, but this app must do it with its own interface.

The person building it has 48 hours. This is a take-home for Hoopr, a music licensing platform, so music is not a nice-to-have. A video that ends up as a real file in the gallery counts for more than a preview that only plays inside the app.

## Solution

A four-step mobile app built with React Native, Expo and TypeScript:

1. **Add media.** Pick several videos and photos from the gallery at once. They become assets in the media bin and clips on the main track, in the order they were picked.
2. **Editor.** A Preview player with playback controls, above a timeline.
   - Add more media, remove clips and reorder them.
   - Trim clips.
   - Put text overlays on screen.
   - Give a clip a look.
   - Choose a song from a bundled royalty-free catalogue, with a balance control between the music and the clips' own sound.
3. **Edit.** All of these edits happen on the Editor screen and show immediately in Preview.
4. **Save.** Watch the finished edit full-screen, then export it to a 1080×1920, 30 fps MP4 with audio. Save it to the gallery or share it.

Everything lives in memory. If the app is closed, the project is gone; the README says so.

## User Stories

### Adding media

1. As a creator, I want to pick several videos and photos from my gallery in one go, so that I don't add them one at a time.
2. As a creator, I want to mix videos and photos in the same pick, so that my edit can contain both.
3. As a creator, I want the clips to appear on the timeline in the order I picked them, so that I start from a sensible sequence.
4. As a creator, I want a clear message when a file can't be used (corrupt or unsupported), so that I know why it didn't appear.
5. As a creator, I want the other files in the same pick to still be added when one fails, so that one bad file doesn't cost me the rest.
6. As a creator, I want to add more media from inside the editor, so that forgetting one photo doesn't mean starting over.
7. As a creator, I want newly added media to go at the end of the timeline, so that my existing order is kept.
8. As a creator, I want a 4K video from my phone camera to import and play, so that I can use my best footage.

### Main track

9. As a creator, I want to see my clips as a strip in order, so that I understand the structure of my video.
10. As a creator, I want to remove a clip, so that I can drop footage I don't want.
11. As a creator, I want removing a clip to leave the media in the bin, so that I can place it again.
12. As a creator, I want to place the same media on the timeline more than once, so that I can reuse a shot.
13. As a creator, I want to reorder clips by long-pressing and dragging, so that I can change the story.
14. As a creator, I want to be warned how many clips will go when I remove media from the bin, so that I don't lose clips by surprise.
15. As a creator, I want an empty timeline to tell me to add media, so that I'm never stuck on a blank editor.

### Preview and playback

16. As a creator, I want to play and pause the composition, so that I can watch my edit.
17. As a creator, I want to see a playhead and the current time and total duration, so that I know where I am.
18. As a creator, I want to scrub the timeline and see the frame under my finger, so that I can find a moment quickly.
19. As a creator, I want playback to carry on across clip boundaries without stopping, so that the edit plays as one video.
20. As a creator, I want photo clips to show for their duration during playback, so that photos behave like part of the video.
21. As a creator, I want to hear each clip's own sound during playback, so that I know what the video will sound like.
22. As a creator, I want playback to stop at the end and let me replay, so that I can check the whole edit again.
23. As a creator, I want clips of any shape (portrait, landscape, square) fitted inside a 9:16 frame without being cut off, so that nothing I shot is lost.

### Trim

24. As a creator, I want to drag handles on a video clip to choose its start and end, so that I use only the part I want.
25. As a creator, I want trimming to keep the original footage, so that I can widen the clip again later.
26. As a creator, I want a clip to never become shorter than half a second, so that I can't accidentally make it vanish.
27. As a creator, I want a clip's end to stop at the real end of the video, so that I can't trim past the footage.
28. As a creator, I want to set how long a photo shows by dragging its handle, so that photos get the screen time I want.
29. As a creator, I want new photo clips to show for 3 seconds, so that they have a sensible default.
30. As a creator, I want a trim to show in Preview straight away, so that I can judge the cut.

### Text

31. As a creator, I want to add text over the video at the playhead, so that I can caption a moment.
32. As a creator, I want to have several pieces of text in one video, so that I can caption different moments.
33. As a creator, I want to type and edit text, so that I can fix mistakes.
34. As a creator, I want to choose from a few fonts, so that the text fits the mood.
35. As a creator, I want to choose a text colour from a palette, so that it reads against my footage.
36. As a creator, I want an optional background box behind the text, so that it stays readable over busy footage.
37. As a creator, I want to choose small, medium or large text, so that I can set emphasis without fiddly gestures.
38. As a creator, I want to drag text to position it in the frame, so that it doesn't cover what matters.
39. As a creator, I want to set how long text stays on screen, even across a cut, so that a title can run over several clips.
40. As a creator, I want text to stay with its footage when I trim, remove or reorder earlier clips, so that my captions don't come loose.
41. As a creator, I want text to go when I remove the clip it belongs to, so that I'm not left with captions for footage that isn't there.
42. As a creator, I want the text button disabled while the timeline is empty, so that I can't create text with nothing to attach it to.
43. As a creator, I want text that runs past the end of the video to simply stop at the end, so that the video never grows to fit it.
44. As a creator, I want to delete a piece of text, so that I can remove captions I don't want.

### Looks

45. As a creator, I want to give a clip one of a handful of named looks, so that I can change its mood in one tap.
46. As a creator, I want an intensity slider for the look, so that I can make it subtle.
47. As a creator, I want to see a thumbnail preview of each look on my clip, so that I can choose without trial and error.
48. As a creator, I want looks to work on photos as well as videos, so that my edit is consistent.
49. As a creator, I want to remove a look from a clip, so that I can go back to the original.
50. As a creator, I want the saved video's colours to look like what I saw in Preview, so that I'm not surprised by the result.

### Music

51. As a creator, I want to browse a small catalogue of songs labelled by mood and genre, so that I can find one that fits.
52. As a creator, I want to listen to a song before choosing it, so that I don't pick blindly.
53. As a creator, I want to see each song's credit line, so that I know how to credit the artist.
54. As a creator, I want the chosen song to play under my whole video during Preview, so that I can judge the fit.
55. As a creator, I want a short video to use just the start of the song, and a long video to loop it, so that the music always covers the video exactly.
56. As a creator, I want the music to fade out at the end, so that the video doesn't end on an abrupt cut.
57. As a creator, I want one slider balancing music against the clips' own sound, so that I can keep speech audible or drown out wind noise.
58. As a creator, I want to remove or change the song, so that I'm not locked into my first choice.
59. As a creator, I want the music in the saved file, so that what I post sounds like what I previewed.

### Save

60. As a creator, I want a Save screen that plays my finished video full-screen, so that I can check it before exporting.
61. As a creator, I want to see export progress, so that I know the app hasn't frozen.
62. As a creator, I want the saved video to appear in my gallery, so that I can post it from any app.
63. As a creator, I want to share the saved video straight away, so that I can post it without hunting for it.
64. As a creator, I want a clear message if saving fails, with my edit still intact, so that I can try again.
65. As a creator, I want the saved file to be 9:16 at 1080×1920, so that it fits Reels and Shorts without re-cropping.
66. As a creator, I want to go back to the editor from Save, so that I can fix something I noticed.
67. As a creator, I want to be asked for gallery permission only when needed, and told what happens if I refuse, so that I understand what the app can do.

### Reviewer (Hoopr)

68. As a Hoopr reviewer, I want a README that explains the architecture, decisions and known limitations (everything in memory, no undo), so that I can judge the trade-offs rather than guess at them.
69. As a Hoopr reviewer, I want to see tests on the editing rules, so that I can trust the core logic without clicking through every edge case.

## Implementation Decisions

### Platform (ADR 0004)

- React Native, Expo, TypeScript, run as a development build.
- **Export:** a community fork of FFmpeg-kit.
- **Preview:** React Native Skia.
- **Timebox:** ticket 01 is limited to 4 hours. If it fails, the app becomes preview-only, and that is decided on purpose and written down as an ADR.

### Project model: a pure TypeScript module and the main test seam

- **One serializable object** holds the whole project (ADR 0001): the media bin (assets), the main track (clips), the overlays, and the music settings (chosen song and balance). No editor state lives outside it, so undo and persistence can be added later.
- **Assets** record what import learned about the file: kind (video or photo), duration for videos, pixel size, whether it has audio, and a local file reference.
- **Clips** reference an asset by ID.
  - A video clip holds a source range: an in-point and an out-point.
  - A photo clip holds a duration.
- **Overlays** hold their anchor clip ID, offset into that clip, duration, text, font, colour, whether the background box is on, size preset (small, medium or large), and position as a fraction of the frame.
- **Edits are pure functions** that take a project and return a new project:
  - add assets and append clips
  - add a clip for an existing asset
  - remove a clip
  - move a clip
  - remove an asset
  - set a source range
  - set a photo duration
  - add, update and remove an overlay
  - set a look and its intensity
  - set and clear the song
  - set the balance
- **Rules are enforced by the edits themselves**, not by the UI. The UI also disables what can't be done.
  - The minimum clip length is 0.5 s. Trims are clamped to the minimum, not rejected.
  - A video out-point is clamped to the asset's duration.
  - A photo clip lasts between 0.5 s and 30 s, and defaults to 3 s.
  - Removing an asset removes every clip that uses it.
  - Removing a clip removes the overlays anchored to it.
  - Adding an overlay with no clips is refused: the project is returned unchanged.
  - A trim that moves an overlay's offset outside its anchor clip clamps the offset back inside the clip. The overlay's duration stays the same (ADR 0002).
- **The resolve step** turns a project into a **resolved composition**: exact start and end times in composition time for every clip, overlay and the music. Both preview and export read this, and nothing else.
  - An overlay that runs past the end is cut short here. That is a drawing rule only; the stored duration is not changed.
  - The music is looped or cut short to the composition's length here, and the fade-out is placed here.
- **Looks are data.** Each named look is a colour matrix (a 3×3 RGB mix plus an offset per channel). Intensity blends between the identity matrix and the look's matrix. The same numbers feed Skia in preview and FFmpeg in export, so the two are visibly similar, not guaranteed pixel-identical.
- **Fonts are data.** The 3–4 fonts are bundled files, with the same file used by Skia and by FFmpeg's text drawing.

### Export plan: a pure function, tested with snapshots

- A pure function takes a resolved composition and the export settings (1080×1920, 30 fps) and returns the FFmpeg argument list.
- The command it builds:
  - **Clips:** every clip is fitted, not cropped, into a 9:16 frame with padding. Video clips are cut to their source range. Photos are turned into video of their duration.
  - **Looks:** applied per clip.
  - **Joining:** clips are joined in order. Clips with no audio (photos, and videos with no sound) get silence, so joining never fails on missing audio.
  - **Text:** overlays are drawn with their resolved timing, font file, colour, box, size and position.
  - **Music:** the song is looped or cut short, faded out, and mixed with the clips' own sound according to the balance.
  - **Output:** an H.264 + AAC MP4.
- A thin native adapter around it runs the command on the device, reports progress, and hands the file to the gallery / share step. That adapter is not unit tested.

### Import

- **Picking:** uses the Expo image and video picker with multiple selection.
- **Reading each file:** each picked file is probed with the FFmpeg fork's `ffprobe` for duration, size and audio. A file that fails to probe is rejected with a message, and the rest of the pick continues. Using the same decoder that export uses means anything accepted at import can also be exported.

### Preview

- **Skia draws the frames.** It reads the resolved composition at the playhead and draws the current clip's frame, fitted to 9:16, with its look applied as a colour matrix and the active overlays on top.
- **Playback controls:** play, pause, a playhead, scrubbing, current and total time, and replay at the end.
- **Audio risk:** Skia's video support may not play audio, or may not stay in sync. If so, the clips' own sound and the music are played by Expo's audio/video players, kept in step with the playhead. Ticket 03b settles this.

### Music catalogue

- **Catalogue:** 8–12 royalty-free songs bundled in the app. Each has a title, artist, mood, genre, duration and credit line.
- **Sourcing:** finding songs whose licence allows bundling them in an app is a human task. The person building the app picks them; they are not generated or scraped.

### Screens

- **Four screens:** Add media, Editor, Save, plus the song picker shown as a sheet over the Editor.
- **Wording:** all UI text uses the UI label column of `CONTEXT.md`. The word "Export" never appears in the UI; the button says **Save**.

## Testing Decisions

- **What a good test is:** it calls the public interface (edits, the resolve step, the export-plan function) with a project and checks the project or resolved composition that comes back. It never reaches into internals, so the model can be refactored without rewriting tests.
- **Project model:** tested hard with Jest. That covers every rule listed under the project model:
  - The minimum clip length, and the out-point cap.
  - Photo duration: the default, the minimum and the maximum.
  - Cascading removal of an asset and of its clips' overlays.
  - Reordering with overlays attached.
  - Clamping an overlay's offset when its anchor clip is trimmed.
  - Cutting overlays short at the end.
  - Looping versus cutting the music short.
  - Placing the fade-out.
  - Refusing an overlay when there are no clips.
  - Empty and single-clip projects.
  - Blending looks by intensity.
  - Proving the project serializes and round-trips.
- **Export plan:** snapshot tests with Jest on a few representative resolved compositions:
  - one video only
  - video + photo
  - with an overlay running across a cut
  - with a look
  - with music that loops
  - with music cut short

  A snapshot change must be reviewed on purpose, not accepted blindly. There is deliberately no desktop FFmpeg / `ffprobe` harness: it costs too much setup for 48 hours and can pass while the phone fails.
- **On the device:** each ticket has a manual checklist run on the real Android phone. Preview drawing, gestures, import and saving to the gallery are checked there only.
- **Prior art:** none. This is a new repository; ticket 01 sets up Jest and the first tests of the model and the export plan.

## Out of Scope

Per ADR 0003:

- Keeping assets or the project between app launches
- Undo/redo
- Split
- Crop, aspect presets and Fit/Fill (the output is always fitted into 9:16)
- Beat sync
- A picker for where in the song to start
- "Apply look to all clips"

Also out:

- Pinching text to scale and rotate. Text uses a fixed size preset and is positioned by dragging.
- Text animation.
- Any backend, accounts or uploads.
- iOS testing. The target device is Android, though nothing deliberately excludes iOS.
- Beat markers, and AI music suggestions.

## Further Notes

- **Deadline:** 16 September 2026, 5 PM IST. The spec, tickets, ADRs and `CONTEXT.md` are part of the submission.
- **Build order:** 01 → 02 → 03a → 03b → 04 → 07 → 05 → 06 → 08. Text (07) comes before trim and main-track changes because it is a stated requirement. Its anchoring behaviour under trim, removal and reordering is tested when 05 and 06 land.
- **If ticket 01 fails:** the fallback is preview-only, recorded as a new ADR.

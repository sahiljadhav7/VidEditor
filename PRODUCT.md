# Product

<!-- impeccable:product-schema 1 -->

## Platform

android

## Users

**Primary: a creator on their phone.** They have a handful of videos and photos in their gallery and want to turn them into one short vertical video for Reels or Shorts, with some text on screen and a song underneath. They expect the job to be as quick as in CapCut, VN or InShot, but in this app's own interface.

**Secondary: a reviewer at Hoopr.** Hoopr is an Indian music licensing platform, and this app is a take-home assignment for them. The reviewer judges:

- the running app on an Android phone
- the README (architecture, decisions, known limitations)
- the tests on the editing rules
- the spec, ADRs and `CONTEXT.md`, which are part of the submission

## Product Purpose

A creator arranges videos and photos into one 9:16 edit, adds text overlays, a per-clip filter and a song, and watches the finished edit full-screen in the app.

Success means the whole flow works on a real Android phone:

1. add media
2. edit on the Editor screen
3. watch the result on the Preview screen

Every edit must show in Preview immediately. The first release is preview-only: no video file leaves the app (ADR 0005).

## Positioning

Music comes first. The app is built for a music licensing company, so choosing a song is a core step, not an afterthought:

- a bundled royalty-free catalogue, labelled by mood and genre
- each song can be listened to before it is chosen
- each song's credit line is shown wherever it is used
- the song loops or is cut short to fit the edit exactly, and fades out at the end
- one balance control sets the music against the clips' own sound

Editing is built on a single, fully serializable project model. Every editing rule lives in pure, tested functions, not in the UI.

## Operating Context

- Used one-handed or two-handed on an Android phone in portrait. The test device is a real Android phone running a development build, not Expo Go.
- Everything is held in memory. Closing the app loses the project, and the README says so.
- There is no undo, so confirmations are the only safety net for destructive edits. For example, removing media warns how many clips will go.
- It is built by one person against the take-home deadline: 16 September 2026, 5 PM IST (ADR 0003).

## Capabilities and Constraints

Vocabulary follows `CONTEXT.md`. The UI always shows the **UI label**, never the code term. For example, "Filter" not "Look", and "Text" not "Overlay".

**Screens:**

- Add media
- Editor: the Preview player above the timeline
- A song picker sheet over the Editor
- The Preview screen: full-screen playback of the finished edit, with a way back to the Editor

**In scope:**

- Pick several videos and photos at once. If one file fails, the rest of the pick is still added, and a clear message explains the failure.
- Timeline: add, remove, and reorder by long-press and drag. The same media can be placed more than once.
- Non-destructive trim, with a 0.5 s minimum clip length. Photo clips default to 3 s and can last 0.5–30 s.
- Text: several pieces; 3–4 fonts; a colour palette; an optional background box; small, medium or large size; positioned by dragging. Each piece is anchored to a clip, can run across cuts, and is removed with its clip (ADR 0002). Adding text is disabled while the timeline is empty.
- One filter per clip, from a handful of named looks, with an intensity slider and thumbnail previews. Filters work on photos too.
- Playback: play, pause, a playhead, scrubbing, current and total time, and replay at the end. Playback continues across clip boundaries, and every clip is fitted inside 9:16 without cropping.
- Music: one song from a bundled catalogue of 8–12, with a credit line. It can be listened to first, removed or changed, loops or is cut short, fades out, and has a balance control.

**Out of scope** (ADR 0003, ADR 0005):

- export, saving to the gallery, and sharing
- keeping the project between launches
- undo and redo
- split
- crop, aspect presets, and Fit/Fill
- beat sync
- picking where in the song to start
- "apply filter to all clips"
- pinch to scale or rotate text, and text animation
- any backend or accounts
- iOS testing: iOS isn't excluded, but it gets no design attention

**Technical constraints:**

- React Native 0.86, Expo SDK 57 (development build), TypeScript.
- React Native Skia draws the preview frames.
- The FFmpeg-kit fork cannot compile on this stack (ADR 0005).

**Open:**

- How import learns each file's duration, pixel size and whether it has audio. The fork's `ffprobe` is gone.
- Whether audio in Skia video stays in sync, or needs Expo's players kept in step with the playhead (ticket 03b).

## Brand Commitments

- The app has its own neutral identity. Its working name is "Video Editor" (`app.json`).
- Hoopr's name, logo and colours are **not** cleared for use. Don't brand the app as Hoopr.
- UI wording follows the UI label column of `CONTEXT.md`.
- No other voice or identity assets exist.

## Evidence on Hand

**On hand:**

- `docs/spec.md`, `docs/adr/0001`–`0005`, `docs/tickets/`, `CONTEXT.md`

**Not on hand yet.** Do not invent, generate or scrape substitutes:

- **Music:** the royalty-free songs and their credit lines. Choosing songs whose licence allows bundling is a human task.
- **Fonts:** the 3–4 overlay fonts.
- **Brand assets:** no logo, icon or brand artwork. `assets/images/` holds only Expo template images.
- **Visual design:** `src/` holds only the Expo starter template. There is no incumbent visual world to preserve.

## Product Principles

1. **The footage is the hero.** The composition is what the creator is looking at. Controls support it and never compete with it.
2. **Music is a first-class step.** Choosing, auditioning and balancing a song, and seeing its credit line, gets the same care as editing the picture.
3. **Nothing is lost by surprise.** With no undo and no persistence, destructive edits say what they will take with them, and the UI disables what can't be done.
4. **What you edit is what plays.** Every edit shows in Preview straight away, in the same 9:16 frame on the Editor and on the Preview screen.
5. **Plain words.** The interface speaks in UI labels, never code terms.

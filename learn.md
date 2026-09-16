# Video Editor — project walkthrough

A mobile video editor built in ~48 hours as a take-home for Hoopr (a music licensing platform). This document explains what it does, how it's built, why it's built that way, and what's next. It assumes no prior context.

---

## 1. What the app does (demo script)

Four screens: **Add media → Editor → Preview**, plus the **Music sheet** as an overlay on the Editor.

### Add media
Open the app, tap **Add media**, pick several videos and photos from the gallery in one go (mixed types, any order). They land on the timeline as clips in pick order. Pick a corrupt/unreadable file alongside good ones and the app names the bad one and keeps the pick from succeeding at all — see §4 for why that's a real limitation, not a bug.

### Editor
The screen creators live in. Top: a Skia-drawn player showing the composition at the playhead. Below: transport controls (play/pause, current/total time, scrub) and a timeline strip of clips. Three bottom tools:

- **Media** — reopens the picker; new clips append to the end. Long-press and drag a clip to reorder. Tap a clip to select it, remove it, or drag its trim handles (video: in/out point, min 0.5 s; photo: duration, 0.5–30 s, defaults to 3 s).
- **Text** — disabled with an empty timeline. Tap to drop a text overlay at the playhead: type it, pick one of four fonts, one of eight colours, small/medium/large size, toggle a background box, and drag it anywhere in frame. Overlays anchor to the clip they started on — trim, reorder or remove that clip and the text follows or disappears with it, never landing on footage the user didn't choose (ADR 0002).
- **Filter** — one of six named colour looks (Warm, Cool, Punch, Fade, Dusk, Mono) per clip, with an intensity slider from 0 (original) to 1 (full effect). Works on both video and photo clips.

Every edit is visible in the player immediately — there's no separate "apply" step.

### Music sheet
Tap **Music**. A sheet lists the bundled catalogue (currently one verified track: *Wonders of the Earth* by Grand_Project, Pixabay), each with mood, genre, duration and its credit line. Tap the play icon to audition a track before committing — auditioning pauses the main preview so two things are never playing at once. Pick a song, and a **Balance** slider appears: drag from "Clips" to "Music" to mix the song against the clips' own sound. Remove the song with one tap.

### Preview
Full-screen, no chrome but a back arrow. Plays the finished edit start to finish with the song's credit line burned into the bottom bar so the creator can copy it into their post caption. This is the "watch before you post" screen the spec asked for — it just doesn't write a file (see ADR 0005).

### What's *not* here
No export to a gallery file, no undo, no split, no crop/aspect presets, no project persistence across app restarts. All deliberate — see §3 and §4.

---

## 2. Tech stack and architecture

**Stack:** React Native + Expo (SDK 57, dev build — not Expo Go, since custom native modules are needed) + TypeScript throughout. React Native Skia draws the player. Reanimated + Worklets drive the playback clock and gesture-synced UI off the JS thread. Expo Router for navigation, Gesture Handler for trim/drag/scrub, `expo-image-picker` for media, `expo-audio` for the music track.

**Why a dev build and not Expo Go:** Expo Go can't load Skia or (later) audio native modules — see ADR 0004.

### The core idea: one project object, pure edit functions

Everything the creator has done lives in a single serializable object:

```ts
type Project = {
  assets: Asset[];      // media bin: what import learned about each file
  clips: Clip[];        // the ordered main track
  overlays: Overlay[];  // text, anchored to a clip
  music: MusicSettings; // chosen song + balance
};
```

No editor state lives outside it (ADR 0001). Every edit — trim, reorder, add text, set a look, pick a song — is a **pure function**: `(project, ...args) => project`. They live in `src/project/edits.ts`. The UI never mutates state directly; it calls `apply(p => someEdit(p, ...))` and gets a new project back. This is the same shape as a reducer, chosen specifically because it makes undo (a stack of snapshots) and autosave (listen for "edit committed") addable later without restructuring anything, even though both are cut from this release.

### The resolve step: the one seam preview reads

`src/project/resolve.ts` turns a `Project` into a `ResolvedComposition` — exact start/end times in composition-time for every clip, overlay and the music, with all the "what happens at the edges" rules baked in (an overlay running past the end gets cut short *for drawing only*; music is looped or cut short and its fade-out placed). The player, the timeline, and (originally) export all read *only* this resolved shape, never the raw project. This is the seam that made the code testable in principle: feed `resolve()` a project, assert on times, no rendering involved. (In practice, no Jest tests exist yet in this repo — see §4.)

```
Project (source of truth, edited by pure functions)
   │  resolve()
   ▼
ResolvedComposition (exact times; the only thing Preview reads)
   │
   ├─ Player.tsx      → Skia draws the frame at playhead time
   ├─ Timeline.tsx     → draws clip strip + playhead
   ├─ OverlayLayer.tsx → draws active text
   └─ MusicTrack.tsx   → keeps the song in step with playhead time
```

### Playback clock

`EditorProvider` owns a Reanimated `SharedValue<number>` called `time` — the single playhead clock, advanced by a `useFrameCallback` running on the UI thread. Everything that needs to know "where are we" reads this shared value directly in a worklet (no React re-render per frame). `Player.tsx` derives which clip is current from `time` via `clipIndexAt`, a worklet-safe binary-ish scan over resolved clip end times.

### Video decoding (the hardest part of this codebase)

`VideoLayer` in `Player.tsx` drives a Skia `Video` object directly rather than Skia's built-in `useVideo` hook, because on Android that hook disposes each decoded frame in the same step it publishes it — nothing it hands over survives long enough to draw. The custom loop:
- decodes only up to the editor's clock while playing (`DECODE_LEAD_MS` cap), so picture never runs ahead of audio/UI;
- while paused, throttles seeks to one per 250 ms and pulls a burst of frames after each seek, because every seek flushes the hardware decoder and it needs several frames to warm back up;
- while the timeline is actively being scrubbed, decodes nothing at all and shows the nearest pre-extracted thumbnail instead, swapping back to real decode once the finger lifts and a fresh frame near the target arrives.

This is the kind of workaround you only discover by running on a real device — a simulator wouldn't have surfaced the Android-specific frame-disposal bug in `useVideo`.

### Music sync (added last, see §5)

`MusicTrack.tsx` mounts once inside `EditorProvider`, so the Editor and Preview screens share one `expo-audio` player and never fight over it. It treats the Reanimated `time` clock as the single source of truth and only ever nudges the song toward it — seek-then-play on Play, pause on Pause, forced re-seek after any scrub, and a periodic drift check (100 ms) that re-seeks past 250 ms of drift, measured the short way around the loop so wrapping from the song's end back to its start doesn't look like a full song's worth of drift. It never drives the clock itself.

### Directory shape

```
src/
  app/                 expo-router screens (index, editor, preview, layout)
  components/editor/   Player, Timeline, sheets, panels, gesture logic
  project/             types, edits (pure functions), resolve, rules, catalogue, looks
```

`src/project/*` has no React or native imports — it's plain TypeScript, which is what makes it independently testable (in principle) and portable if the app ever needed a second host (e.g. a web preview).

---

## 3. Key decisions, and why

Recorded as ADRs in `docs/adr/`, summarized here:

- **Snapshot-based undo, not command-based** (ADR 0001) — chosen even though undo itself was cut, because deferring it later requires that *all* state already live in one object. Command-based undo needs a correct inverse per edit, and cascading edits (delete an asset → its clips → their overlays) make inverses easy to get subtly wrong. Snapshots get cascades right for free.
- **One gapless main track, overlays anchored to a clip by ID + offset, not by absolute time** (ADR 0002) — so a caption survives an earlier clip being trimmed, reordered, or deleted, rather than drifting onto footage the creator never chose. This was explicitly chosen over "re-anchor to a neighbour on delete," which was rejected for the same silent-drift reason.
- **48-hour scope cut** (ADR 0003) — undo, split, crop/aspect, beat sync, and persistence across launches are all out; a bundled music catalogue is *in* despite not being in the original brief, because music licensing is literally Hoopr's business.
- **Expo dev build, Skia for preview, FFmpeg-kit fork for export** (ADR 0004) — picked as the fastest route to a real video file in the time available, over a web/Canvas approach (encoding + memory risk on mid-range Android) and bare React Native (loses Expo's picker/permissions/gallery-save for no benefit). Explicitly timeboxed: "no successful encode from a real build by hour 4 → fall back to preview-only, decided on purpose."
- **No export; preview-only first release** (ADR 0005) — the timebox in ADR 0004 tripped. The vendored FFmpeg-kit fork ships only compiled JS with no New-Architecture codegen spec, so it can't compile against RN 0.86's New Architecture. This was caught, not discovered late — the ADR documents exactly which spec user stories (59, 61–65, 67) were dropped as a consequence, and what stayed (the project model, resolve step, and music are unaffected because they never depended on FFmpeg).
- **Looks and fonts are data, not code** (spec) — a look is a 3×3 colour-mix matrix plus a per-channel offset; the same numbers were meant to feed both Skia (preview) and FFmpeg (export) so they'd look alike without needing to be pixel-identical. ADR 0005 later scoped this down to Skia only.
- **Vocabulary discipline** (`CONTEXT.md`) — code terms (Asset, Clip, Overlay, Look, Song) are deliberately different from UI labels (Media, Clip, Text, Filter, Song), with an explicit table and "avoid" lists, so a reviewer (or a future contributor) never has to guess which word means what.

---

## 4. What I'd improve or build next

Roughly in the order I'd tackle them:

1. **Write the Jest tests the spec calls for.** `docs/spec.md`'s testing section is detailed and good (min clip length, out-point clamping, cascading removal, overlay clamping on trim, music loop-vs-cut, fade placement, empty/single-clip edge cases) — none of it is written yet. `src/project/*` was deliberately kept pure and React-free specifically so this would be cheap; it just hasn't been done. This is the single highest-value next step, since it's the part a reviewer is told to trust without clicking through every edge case.
2. **Fix the import-rejection UX.** Right now one unreadable file in a multi-pick drops the *entire* pick, including the good files, because `expo-image-picker` reads every file natively and rejects the whole result on the first failure before JS ever sees it. The honest message ("couldn't add these files") is shipped, but the actual fix — skip just the bad file — needs a native patch to the picker and a rebuild, which didn't fit in the time available.
3. **Grow the music catalogue to the spec's 8–12 songs**, each with mood/genre tags and a verified credit line checked against its actual Pixabay page — not filename-derived guesses. One verified track shipped over several unverified ones on purpose (see the music work in this session): a licensing company cares more about one correct credit than four plausible-looking ones.
4. **Revisit export.** ADR 0005 is a considered fallback, not a dead end. The two live options: (a) find or patch an FFmpeg-kit fork with a real New Architecture codegen spec, or (b) switch to platform-native encoders (Media3 Transformer on Android, AVFoundation on iOS) as ADR 0004 originally considered and rejected only for doubling the native surface area — which stops being a deal-breaker once there's more than 48 hours.
5. **Persistence.** Everything lives in memory by design (ADR 0003), and the README says so, but for anything past a demo, even a simple "restore last project on relaunch" would remove the single biggest way a creator can lose work.
6. **The music-sync artifact noted in the README:** after a scrub, the song settles ~0.15–0.20 s behind the playhead (vs. ~0.03–0.08 s from a standing start) — inside the sync loop's 0.25 s correction tolerance, so it never audibly re-seeks, but worth tightening if this becomes more than a preview feature.
7. **The pre-existing `app-tabs.web.tsx` typecheck error** (route typing, web-only fallback tab bar) — unrelated to any editor work, safe to fix in a separate pass.

---

## 5. On process — how this actually got built

Worth naming plainly, since it speaks to the engineering discipline as much as the code does:

- **The spec, ADRs, and `CONTEXT.md` were written before most of the code**, and treated as load-bearing: tickets reference ADR numbers, code comments reference ADR numbers, this document does too. When ADR 0004's own timebox tripped (FFmpeg wouldn't compile), the response was to write ADR 0005 on the spot, rather than quietly work around it or ship broken export.
- **Everything was checked on a real Android phone over wireless ADB**, not just in a simulator — the `useVideo`-frame-disposal bug in §2 is exactly the kind of thing that only shows up there. A recent device-testing pass (see `docs/handoff/2026-09-16-push-to-main.md`) fixed six issues found this way: trim-handle gesture conflicts, a black-screen bug in text mode, clipped UI chips, and others.
- **The most recent piece of work (music playback) was built and self-timeboxed live**: real MP3s picked, licence and credit verified against the actual Pixabay page rather than trusted from a filename, sync correctness verified by temporarily instrumenting the sync loop and reading logcat output against the Reanimated clock, then the instrumentation was removed before handing back. The unverified tracks that didn't fit the demo were cut rather than shipped with guessed credit lines — a small decision, but the kind that matters more at a music-licensing company than most places.

---

## Questions?

This file is a snapshot, not a source of truth — the code, `docs/spec.md`, `CONTEXT.md`, and `docs/adr/*` are canonical if anything here goes stale. If anything above is unclear or you want to go deeper on a specific piece (the resolve step, the video decode loop, a particular ADR's trade-off), just ask.

---
status: accepted (supersedes the export parts of ADR 0003 and ADR 0004)
---

# No export: the first release is preview-only

The first release does not produce a video file. The last screen plays the finished edit full-screen inside the app, and no file leaves the app. This is the preview-only fallback that ADR 0004 set out, and it is decided, not pending.

## Why

The FFmpeg-kit fork chosen in ADR 0004, `@nikhil-cephei/ffmpeg-kit-react-native@6.0.12` (vendored in `vendor/ffmpeg-kit/`), cannot compile under the New Architecture:

- Its `package.json` declares `codegenConfig`, but its `src` ships only compiled JavaScript. There is no `Native*.ts` spec file.
- With no spec, codegen generates no spec class, so the wrapper's New Architecture Android sources have nothing to compile against and the build fails.
- This was verified on Expo SDK 57, React Native 0.86 and JDK 21.

The fork was removed from the app in commit `958b47c`.

## Consequences

- **The last screen:** plays the finished edit full-screen, with its music and the clips' own sound. It has a way back to the Editor. Nothing is written to the gallery and nothing is shared.
- **Dropped with export:**
  - the 1080×1920, 30 fps MP4
  - export progress
  - saving to the gallery and sharing
  - the gallery-save permission prompt
  - the export-plan function and its snapshot tests
  - spec user stories 59, 61–65 and 67, as written
- **Kept:**
  - The project model and the resolve step. Preview reads the resolved composition exactly as before.
  - The music catalogue and credit lines. Music is still in scope because it is Hoopr's business. It is heard in the app only.
- **Looks and fonts:** they now feed only Skia. The rule that preview and export must look alike no longer applies.
- **Import:** the spec probed each picked file with the fork's `ffprobe`. That source is gone, so duration, pixel size and audio presence must come from somewhere else. That choice is not made here.
- **The 9:16 frame:** still the frame the edit is drawn in. It no longer describes an output file.
- **Licence:** the GPL-3.0 concern from the full-gpl build no longer applies.
- **Now stale:** ticket 01 (export spike), the Save parts of ticket 02 and of `docs/spec.md`, and ADR 0004's reasoning that FFmpeg is the fastest route to a file on the phone.
- **No longer used:** `expo-media-library` (and its save permission in `app.json`), `expo-sharing`, and the vendored tarball and AAR. Removing them is separate cleanup.

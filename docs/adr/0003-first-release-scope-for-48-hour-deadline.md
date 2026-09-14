# First-release scope, cut for a 48-hour take-home deadline

This is a take-home assignment for Hoopr, an Indian music licensing platform, due 16 September 2026 at 5 PM IST. About 48 hours remained when the design interview stopped. Music is Hoopr's business, so a bundled music catalogue is in scope even though the original brief never mentioned audio. Several features that had already been designed are cut.

**In:**
- Importing several videos and photos at once
- Main track: add, remove, reorder
- Non-destructive trim with a 0.5 s minimum clip length; photo clips start at 3 s
- A per-clip look
- Text overlays (ADR 0002)
- Playback controls
- One song from a bundled royalty-free catalogue, shown with its credit line. It loops or is cut short to the composition's length, fades out at the end, and has one control balancing music against the clips' own sound.
- Export to the device, including audio

**Out:**
- Keeping assets and the project between app launches. Everything is in memory only; this is noted in the README.
- Undo/redo
- Split
- Crop, aspect presets and Fit/Fill
- Beat sync
- A picker for where the song starts
- "Apply look to all clips"

All editor state still lives in one serializable object (ADR 0001), so undo and persistence can be added later without restructuring.

## Consequences

- **Frame format:** with crop cut, the output frame is fixed. It is 9:16 at 1080×1920, 30 fps, since Reels and Shorts are Hoopr's creators' main platforms. Each clip is fitted inside the frame, never cropped.
- **Deleting media:** removing an asset from the media bin also removes the clips that use it, after a confirmation. With no undo, that confirmation is the only safety net.

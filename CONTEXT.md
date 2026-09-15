# Video Editor

A mobile video editor: the user brings in videos and photos, arranges them into a composition with text and music, and watches the finished edit full-screen. No video file leaves the app (ADR 0005).

## Language

### Media

**Asset**:
A video or photo file the user has brought into the project. Every clip points at exactly one asset; one asset may back many clips.
_Avoid_: Upload, media file, source

**Media bin**:
The set of assets available to the project, including ones not placed on the main track.
_Avoid_: Library, gallery

**Project**:
Everything being edited in one sitting: the media bin, the composition, and the chosen song.
_Avoid_: Draft, session, document

### Timeline

**Composition**:
The main track, its overlays and its music track, as one playable thing.
_Avoid_: Video, sequence, edit

**Main track**:
The ordered, gapless sequence of clips that forms the picture of the composition.
_Avoid_: Timeline (for the sequence itself), video track

**Clip**:
An entry on the main track that plays one source range of one asset.
_Avoid_: Segment, item

**Source range**:
The part of an asset a video clip plays, bounded by an in-point and an out-point that never extend past the asset's real duration.
_Avoid_: Trim (as a noun), cut, region

**Photo clip**:
A clip backed by a photo asset. It has a duration instead of a source range.
_Avoid_: Still, image clip

**Overlay**:
A piece of text drawn over the composition, anchored to the clip it starts in and lasting for its own duration, which may run past that clip's end.
_Avoid_: Caption, title, sticker

**Anchor clip**:
The clip an overlay is anchored to; the overlay moves with it and is removed with it.
_Avoid_: Parent clip, owner

### Sound

**Song**:
One entry in the bundled music catalogue, with its credit line.
_Avoid_: Track (for a piece of music), audio, tune

**Credit line**:
The attribution text a song must carry wherever it is used.
_Avoid_: License, attribution

**Music track**:
The single lane beneath the main track that plays the chosen song for the length of the composition.
_Avoid_: Audio track, soundtrack, background music

### Appearance

**Look**:
A named colour treatment applied to one clip at an adjustable intensity. A clip has at most one look; clips have none by default.
_Avoid_: Filter (in code), preset, effect

### Playback

**Compositor**:
The thing that turns a composition at a given moment into a frame.
_Avoid_: Renderer, player, engine

**Preview**:
Playing the composition, either in the player on the Editor screen or full-screen on the Preview screen at the end of the flow. No file is produced (ADR 0005).
_Avoid_: Export, Save, Render, Playback screen

## UI labels

Code terms stay precise; the interface uses plain words. Never show a code term where its label belongs.

| Code term    | UI label        |
| ------------ | --------------- |
| Asset        | Media           |
| Media bin    | Media           |
| Clip         | Clip            |
| Source range | Trim            |
| Main track   | Timeline        |
| Overlay      | Text            |
| Look         | Filter          |
| Song         | Song            |
| Music track  | Music           |
| Credit line  | Credits         |
| Preview      | Preview         |
| Project      | *(not shown)*   |
| Composition  | *(not shown)*   |
| Compositor   | *(not shown)*   |

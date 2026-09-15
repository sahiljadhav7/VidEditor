---
version: 1
slug: "src-app-editor-tsx"
primary_target: "src/app/editor.tsx"
related_targets: ["src/components/editor"]
---

# Editor screen

## Scope and mode
The Editor route (`src/app/editor.tsx`) and its components. Mode: Operate. It builds on the incumbent token source `src/theme.ts`, and no DESIGN.md exists yet.

## Audience, job, constraints
- **Who and job:** a creator on an Android phone in portrait, often one-handed, turning picked clips into one 9:16 edit with text, a filter per clip and a song, then checking it in Preview.
- **Stack:** preview-only (ADR 0005), RN 0.86 with edge-to-edge, Skia for frames, 48dp targets.
- **Labels:** the UI label column of CONTEXT.md.
- **Predictive back:** stays disabled.

## Confirmed behaviour
- **Tool row states:** nothing selected: Media, Text, Music. A clip selected: Filter, Delete, with one slot left free. The two states are built so they can crossfade (150 ms, no bounce).
- **Tapping the player:** deselects, or selects the text overlay under the finger. It never plays or pauses; that lives on the transport button only.
- **Timeline:** a fixed centre playhead with lanes scrolling under it. Dragging scrubs and pinch zooms. Tapping an empty part of the timeline deselects.
- **Clips:** thumbnail strips with frames tiled across the clip's trimmed width. Photos show their own image. The fallback is one frame stretched across the clip, never a solid fill.
- **Selected clip:** an amber selection outline plus trim handles layered above the strip.
- **Delete:** instant, unless text is anchored to the clip. Then it confirms: "Delete clip and N text(s)?", with the destructive button in danger.
- **Filter panel:** replaces the timeline, the player stays full size, and Back closes it.
- **Text:** a keyboard-aware mode. The player shrinks and the overlay being edited stays visible. Above the keyboard: a tab row (Font / Size / Colour, plus a Box toggle) and one control row that swaps with the tab. Tapping outside commits and closes.
- **Music lane:** empty shows "Add music". Filled shows the title and artist. Tapping either opens the song picker, where the song can be changed or removed.
- **Back priority stack:** text editing, filter panel, song picker, media bin. Then, with nothing open, "Discard this edit?" if the timeline has clips (Discard in danger, Keep editing as the default); with an empty timeline it just leaves.

## Unresolved (do not invent)
- **Songs:** none bundled; the catalogue is a human task.
- **Overlay fonts:** not chosen, so Android system families stand in until they are.
- **Import metadata:** there is no ffprobe, so it comes from the picker, and whether a video has audio is assumed.

## Direction contract
THESIS: The creator's own footage is the interface. A continuous filmstrip runs under a fixed near-white playhead, and scrubbing is the thing you feel. It refuses the category default of flat coloured clip blocks, a floating toolbar over the timeline, and a modal editing sheet.

OWN-WORLD: A blue-black ground (#0C0E13) with a true-black 9:16 matte, and a timeline band on #14171D. Marigold #F5B83D appears only on the selection outline, trim handles, the active tool and the Preview button. The playhead is a 2dp near-white line. Controls are flat, with hairline edges and no shadows. Tabular timecode. Material Symbols icons in one weight, each with its label.

STORY: The creator sees their frame, where they are in time, and whether a song is on. They scrub, select a clip, trim it, add text or a filter, pick a song, and press Preview. Destructive changes say what they take with them.

FIRST VIEWPORT: The top bar has Back on the left and the amber Preview button on the right. The player fills the band below it. Under that, a transport row (play/pause, "0:04.2 / 0:31.0"). The timeline band holds a 56dp clip filmstrip, 24dp text bars and a 40dp music lane, crossed by the centre playhead. At the bottom, a docked tool row: Media · Text · Music, with a hairline top edge above the safe-area inset.

FORM: A stacked-band mobile editor with a fixed centre playhead, shaped with the user. This was a precisely specified request, so there was no concept roll. Seed key: none. Signature interaction: scrubbing the filmstrip with the frame updating live. Motion: 150–250 ms state transitions only.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

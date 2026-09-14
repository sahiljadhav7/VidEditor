# 04: Music

**What to build:** music for the composition.

- The creator opens the song picker, browses a bundled catalogue of royalty-free songs labelled by mood and genre, listens to one, sees its credit line, and chooses it.
- The song plays under the whole composition in Preview and in the saved file: looped or cut short to the composition's length, and fading out at the end.
- One slider balances the music against the clips' own sound.
- The song can be changed or removed.

**Blocked by:** 03b.

**Status:** ready-for-agent

**Before starting:** the creator (a human task) picks 8–12 songs whose licences allow bundling them in an app. Each song's licence and credit line is recorded next to it in the repository.

**Catalogue and picker**
- [ ] The catalogue is bundled data. Each song has a title, artist, mood, genre, duration and credit line.
- [ ] The song picker opens as a sheet over the Editor, with mood and genre filters and a listen button per song. Each song's credit line is visible.

**Project model**
- [ ] Project model edits: set a song, clear the song, set the balance. Jest tests cover these.
- [ ] Resolve step: music covering the composition exactly, looped when the song is shorter and cut short when it's longer, with the fade-out placed at the end. Jest tests cover:
  - a song shorter than the composition
  - a song longer than the composition
  - a composition shorter than the fade itself
  - an empty main track (no music is resolved)

**Preview and export**
- [ ] Preview plays the music in step with the playhead, including after scrubbing. The balance is applied live.
- [ ] Export plan: the song is looped or cut short, faded out, and mixed with the clips' own sound by the balance. The snapshot tests are updated, with each change reviewed on purpose.
- [ ] The Save screen shows the song's credit line so the creator can copy it into their post.

**Checked on the phone**
- [ ] A 10 s composition with a 60 s song, and a 90 s composition with a 30 s song, both sound right in Preview and in the saved file.
- [ ] The balance at both ends of the slider gives only music, or only the clips' own sound.

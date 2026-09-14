---
status: accepted (undo itself deferred — see ADR 0003)
---

# Snapshot-based undo over a single serializable editor state

Undo/redo stores whole-state snapshots rather than invertible commands. That makes the real requirement that **all editor state lives in one serializable object**. A snapshot is taken when a user gesture is committed: a whole drag, a whole text-editing session, one look applied. Autosave, if added, listens for the same "gesture committed" event, so undo and persistence can never disagree about what counts as a change. History depth is capped, and history does not survive an app restart.

Undo and autosave are cut from the first release (ADR 0003). The single-serializable-state rule still applies from day one, because that is the part that is expensive to add later.

## Considered Options

- **Command-based undo** (each edit carries an inverse). Rejected: every new feature needs a correct inverse, and cascading edits (removing an asset takes its clips with it) make inverses easy to get wrong. Snapshots get those cases right for free, at a memory cost that the depth cap bounds.
- **Persisted history across restarts.** Rejected: nobody misses it, and it makes the saved format far harder to evolve.

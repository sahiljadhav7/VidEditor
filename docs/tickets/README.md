# Tickets

Built from `docs/spec.md`. Each ticket is self-contained, so start each one in a fresh session.

**Build order:** 01 → 02 → 03a → 03b → 04 → 07 → 05 → 06 → 08

| Ticket | Title                                   | Blocked by |
| ------ | --------------------------------------- | ---------- |
| 01     | Export spike (4-hour timebox)           | —          |
| 02     | Add media, main track and Save          | 01         |
| 03a    | Preview playback of a single clip       | 02         |
| 03b    | Preview across clip boundaries          | 03a        |
| 04     | Music                                   | 03b        |
| 07     | Text overlays                           | 03b        |
| 05     | Trim                                    | 03b        |
| 06     | Change the main track                   | 02         |
| 08     | Looks                                   | 03b        |

Nothing starts until 01 passes.

Ticket numbers are IDs, not the build order: 07 is built before 05 and 06 on purpose, because text is a stated requirement and music is Hoopr's business. Overlay anchoring under trim, removal and reordering is tested in 05 and 06.

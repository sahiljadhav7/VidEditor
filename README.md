# Video Editor

A mobile video editor built with React Native, Expo (development build) and TypeScript. Pick videos and photos, arrange them on a timeline with text, a filter per clip and a song, and watch the finished edit full-screen.

The first release is preview-only: no video file leaves the app ([ADR 0005](docs/adr/0005-no-export-preview-only-first-release.md)). The spec is in [`docs/spec.md`](docs/spec.md), and the vocabulary is in [`CONTEXT.md`](CONTEXT.md).

## Known limitations

- **A corrupt file drops the whole pick.** If one file in a gallery pick can't be read, nothing from that pick is added, including the files that were fine. The app says a file couldn't be read and asks you to pick again without it. This happens because `expo-image-picker` reads every picked file's metadata in native code and rejects the entire result on the first failure, before the app sees any of it. Skipping only the bad file needs a native patch to the picker and a rebuild of the development build, which was descoped for this release.

- **The music catalogue holds one track.** The picker, the credit line and the balance all work against a real catalogue, but only one song is bundled: *Wonders of the Earth* by Grand_Project, from [Pixabay](https://pixabay.com/music/adventure-wonders-of-the-earth-550792/) under the Pixabay Content License, which permits bundling it in an app and does not require attribution. Its title, artist and duration were checked against that page. A release needs the 8–12 songs the spec asks for, and picking them is a human task — one verified credit is worth more than several guessed ones.

- **The music lags by about two tenths of a second after a scrub.** The song is seeked to the new playhead when playback resumes, but settles roughly 0.15–0.20 s behind it, against 0.03–0.08 s when playing from a standing start. Both are well inside the 0.25 s the sync loop tolerates before it corrects, so the music never audibly re-seeks; it simply sits a little further behind after a scrub than before one.

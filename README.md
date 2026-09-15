# Video Editor

A mobile video editor built with React Native, Expo (development build) and TypeScript. Pick videos and photos, arrange them on a timeline with text, a filter per clip and a song, and watch the finished edit full-screen.

The first release is preview-only: no video file leaves the app ([ADR 0005](docs/adr/0005-no-export-preview-only-first-release.md)). The spec is in [`docs/spec.md`](docs/spec.md), and the vocabulary is in [`CONTEXT.md`](CONTEXT.md).

## Known limitations

- **A corrupt file drops the whole pick.** If one file in a gallery pick can't be read, nothing from that pick is added, including the files that were fine. The app says a file couldn't be read and asks you to pick again without it. This happens because `expo-image-picker` reads every picked file's metadata in native code and rejects the entire result on the first failure, before the app sees any of it. Skipping only the bad file needs a native patch to the picker and a rebuild of the development build, which was descoped for this release.

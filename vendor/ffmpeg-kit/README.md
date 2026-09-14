# Vendored FFmpeg Kit (React Native wrapper + Android AAR)

`nikhil-cephei-ffmpeg-kit-react-native-6.0.12.tgz` is the npm package
`@nikhil-cephei/ffmpeg-kit-react-native@6.0.12` repacked with the Android binary it would otherwise download on
install, already in place at `android/libs/ffmpeg-kit-full-gpl.aar`. The package's `postinstall` script sees that
file and skips its download, so `npm install` needs no network access to GitHub and can't break if the upstream
file is moved or deleted before the deadline. See ADR 0004 for why this fork was chosen.

| Item | Value |
| --- | --- |
| Upstream package | https://www.npmjs.com/package/@nikhil-cephei/ffmpeg-kit-react-native (6.0.12) |
| Upstream repo | https://github.com/Nikhil-Cephei/ffmpeg-kit-rn-full-gpl |
| AAR source URL | https://raw.githubusercontent.com/Nikhil-Cephei/ffmpeg-kit-rn-full-gpl/main/android/ffmpeg-kit-full-gpl.aar |
| AAR SHA-256 | `87e37384ef5f8755d816212890775ba94d493a70d2eff4615a8d59780ac1fc5e` |
| Tarball SHA-256 | `8410c588a06cfe3f7402fcad31918e5d5d811420332f4d2edf31d44a81470e03` |
| Fetched | 2026-09-14 |

What was checked in the AAR's arm64 `.so` files before vendoring:

- FFmpeg `n6.0`, full-gpl build (`--enable-gpl`)
- `libx264`, plus the `h264_mediacodec` hardware encoder
- the `drawtext` filter, built with `libfreetype`, `libfontconfig` and `libfribidi`
- `colorchannelmixer`, `afade`, `amix` and the native `aac` encoder
- New Architecture (TurboModule) support in the wrapper, and an Expo config plugin
- 4 KB page alignment. This is fine for a dev build installed directly on a phone. A Play Store upload
  targeting 16 KB-page devices would need a 16 KB build.

Licence: the full-gpl build makes the app GPL-3.0 as distributed. That's acceptable for a take-home submission, but
it would need revisiting before shipping commercially.

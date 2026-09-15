import * as ImagePicker from 'expo-image-picker';
import { useCallback } from 'react';

import { useEditor } from './EditorProvider';
import { addAssets, type NewAsset } from '@/project/edits';

/**
 * Metadata comes from the picker. ffprobe went with the FFmpeg fork (ADR 0005), so whether a
 * video has sound can't be read; it is assumed to, and a silent video simply plays nothing.
 */
function toAsset(picked: ImagePicker.ImagePickerAsset): NewAsset | null {
  if (!picked.uri || !(picked.width > 0) || !(picked.height > 0)) return null;
  const fileName = picked.fileName ?? null;

  if (picked.type === 'video') {
    const milliseconds = picked.duration ?? 0;
    if (!(milliseconds > 0)) return null;
    return {
      kind: 'video',
      uri: picked.uri,
      width: picked.width,
      height: picked.height,
      duration: milliseconds / 1000,
      hasAudio: true,
      fileName,
    };
  }

  if (picked.type && picked.type !== 'image') return null;
  return { kind: 'photo', uri: picked.uri, width: picked.width, height: picked.height, duration: null, hasAudio: false, fileName };
}

/** Picker errors that mean the gallery itself never opened. */
const GALLERY_LAUNCH_FAILURES = new Set([
  'ERR_MISSING_ACTIVITY_TO_HANDLE_INTENT',
  'ERR_REACT_CONTEXT_LOST',
  'ERR_FAILED_TO_PICK_MEDIA',
]);

/**
 * On Android the picker reads every picked file natively and rejects the whole pick on the first
 * unreadable one (a corrupt video arrives as ERR_UNEXPECTED), so the good files in it are lost too.
 * Skipping only the bad file needs a native patch to expo-image-picker; see README, Known limitations.
 */
const UNREADABLE_PICK = 'Couldn’t add these files. One of them can’t be read, so nothing was added. Pick again without it.';

function rejectionMessage(names: (string | null)[]): string {
  if (names.length === 1) {
    return names[0] ? `Couldn’t add ${names[0]}. The file can’t be read.` : 'Couldn’t add one file. It can’t be read.';
  }
  return `Couldn’t add ${names.length} files. They can’t be read.`;
}

/** Opens the gallery for several videos and photos at once. Files that can't be used are named; the rest are still added. */
export function useAddMedia() {
  const { apply, showNotice } = useEditor();

  return useCallback(async () => {
    let result: ImagePicker.ImagePickerResult;
    try {
      result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images', 'videos'],
        allowsMultipleSelection: true,
        selectionLimit: 0,
        orderedSelection: true,
        quality: 1,
      });
    } catch (error) {
      const code = (error as { code?: string }).code;
      showNotice(GALLERY_LAUNCH_FAILURES.has(code ?? '') ? 'Couldn’t open your gallery. Try again.' : UNREADABLE_PICK);
      return;
    }
    if (result.canceled) return;

    const accepted: NewAsset[] = [];
    const rejected: (string | null)[] = [];
    for (const picked of result.assets) {
      const asset = toAsset(picked);
      if (asset) accepted.push(asset);
      else rejected.push(picked.fileName ?? null);
    }

    if (accepted.length > 0) apply((p) => addAssets(p, accepted));
    if (rejected.length > 0) showNotice(rejectionMessage(rejected));
  }, [apply, showNotice]);
}

import type { ConfirmRequest } from './EditorProvider';

const plural = (count: number, one: string, many: string) => `${count} ${count === 1 ? one : many}`;

export function discardEditRequest(onConfirm: () => void): ConfirmRequest {
  return {
    title: 'Discard this edit?',
    message: 'Your clips, text and music will be gone. There is no undo.',
    confirmLabel: 'Discard',
    cancelLabel: 'Keep editing',
    onConfirm,
  };
}

export function deleteClipRequest(texts: number, onConfirm: () => void): ConfirmRequest {
  return {
    title: `Delete clip and ${plural(texts, 'text', 'texts')}?`,
    message: 'The media stays in Media, but the text can’t be brought back.',
    confirmLabel: 'Delete',
    cancelLabel: 'Cancel',
    onConfirm,
  };
}

export function removeMediaRequest(clips: number, texts: number, onConfirm: () => void): ConfirmRequest {
  const also = texts > 0 ? ` and ${plural(texts, 'text', 'texts')}` : '';
  return {
    title: 'Remove this media?',
    message: `It’s used by ${plural(clips, 'clip', 'clips')}${also}. They’ll be removed from the timeline too.`,
    confirmLabel: 'Remove',
    cancelLabel: 'Cancel',
    onConfirm,
  };
}

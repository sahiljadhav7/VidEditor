import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Keyboard } from 'react-native';
import {
  useAnimatedReaction,
  useFrameCallback,
  useSharedValue,
  type SharedValue,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { MusicTrack } from './MusicTrack';
import { DEFAULT_PIXELS_PER_SECOND } from './timelineMetrics';
import { emptyProject, removeOverlay, updateOverlay, type OverlayPatch } from '@/project/edits';
import { resolve, type ResolvedComposition } from '@/project/resolve';
import type { Overlay, Project } from '@/project/types';

export type Selection = { kind: 'clip'; id: string } | { kind: 'text'; id: string } | { kind: 'music' } | null;
export type Panel = 'filter' | 'text' | null;
export type Sheet = 'music' | 'media' | null;

export type ConfirmRequest = {
  title: string;
  message?: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
};

type EditorContextValue = {
  project: Project;
  resolved: ResolvedComposition;
  apply: (edit: (project: Project) => Project) => void;
  resetProject: () => void;

  selection: Selection;
  select: (selection: Selection) => void;
  panel: Panel;
  setPanel: (panel: Panel) => void;
  sheet: Sheet;
  setSheet: (sheet: Sheet) => void;

  confirm: ConfirmRequest | null;
  askConfirm: (request: ConfirmRequest) => void;
  dismissConfirm: () => void;
  notice: string | null;
  showNotice: (message: string) => void;
  clearNotice: () => void;

  /** The text being edited. Committed to the project once, when editing ends (ADR 0001). */
  textDraft: Overlay | null;
  startTextEditing: (overlay: Overlay) => void;
  updateTextDraft: (patch: OverlayPatch) => void;
  finishTextEditing: () => void;

  /** Composition time at the playhead, in seconds. */
  time: SharedValue<number>;
  playing: SharedValue<boolean>;
  duration: SharedValue<number>;
  pixelsPerSecond: SharedValue<number>;
  isPlaying: boolean;
  play: () => void;
  pause: () => void;
  togglePlay: () => void;
};

const EditorContext = createContext<EditorContextValue | null>(null);

export function EditorProvider({ children }: { children: ReactNode }) {
  const [project, setProject] = useState<Project>(emptyProject);
  const resolved = useMemo(() => resolve(project), [project]);

  const [selection, setSelection] = useState<Selection>(null);
  const [panel, setPanel] = useState<Panel>(null);
  const [sheet, setSheet] = useState<Sheet>(null);
  const [confirm, setConfirm] = useState<ConfirmRequest | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [textDraft, setTextDraft] = useState<Overlay | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const time = useSharedValue(0);
  const playing = useSharedValue(false);
  const duration = useSharedValue(0);
  const pixelsPerSecond = useSharedValue(DEFAULT_PIXELS_PER_SECOND);

  useEffect(() => {
    duration.set(resolved.duration);
    if (time.get() > resolved.duration) time.set(resolved.duration);
  }, [resolved.duration, duration, time]);

  useFrameCallback((frame) => {
    if (!playing.value) return;
    const next = time.value + (frame.timeSincePreviousFrame ?? 0) / 1000;
    if (next >= duration.value) {
      time.value = duration.value;
      playing.value = false;
    } else {
      time.value = next;
    }
  });

  useAnimatedReaction(
    () => playing.value,
    (now, previous) => {
      if (now !== previous) scheduleOnRN(setIsPlaying, now);
    },
  );

  const apply = useCallback((edit: (project: Project) => Project) => setProject((p) => edit(p)), []);

  const play = useCallback(() => {
    if (duration.get() <= 0) return;
    // Pressing play at the end replays from the start.
    if (time.get() >= duration.get() - 0.05) time.set(0);
    playing.set(true);
  }, [duration, playing, time]);

  const pause = useCallback(() => playing.set(false), [playing]);
  const togglePlay = useCallback(() => (playing.get() ? pause() : play()), [pause, play, playing]);

  const resetProject = useCallback(() => {
    playing.set(false);
    time.set(0);
    setProject(emptyProject());
    setSelection(null);
    setPanel(null);
    setSheet(null);
    setTextDraft(null);
  }, [playing, time]);

  const startTextEditing = useCallback(
    (overlay: Overlay) => {
      playing.set(false);
      setTextDraft(overlay);
      setSelection({ kind: 'text', id: overlay.id });
      setPanel('text');
    },
    [playing],
  );

  const updateTextDraft = useCallback(
    (patch: OverlayPatch) => setTextDraft((draft) => (draft ? { ...draft, ...patch } : draft)),
    [],
  );

  const finishTextEditing = useCallback(() => {
    Keyboard.dismiss();
    setTextDraft((draft) => {
      if (draft) {
        const { id, anchorClipId: _anchor, ...patch } = draft;
        if (draft.text.trim() === '') {
          setProject((p) => removeOverlay(p, id));
          setSelection(null);
        } else {
          setProject((p) => updateOverlay(p, id, patch));
          setSelection({ kind: 'text', id });
        }
      }
      return null;
    });
    setPanel(null);
  }, []);

  const value: EditorContextValue = {
    project,
    resolved,
    apply,
    resetProject,
    selection,
    select: setSelection,
    panel,
    setPanel,
    sheet,
    setSheet,
    confirm,
    askConfirm: setConfirm,
    dismissConfirm: () => setConfirm(null),
    notice,
    showNotice: setNotice,
    clearNotice: () => setNotice(null),
    textDraft,
    startTextEditing,
    updateTextDraft,
    finishTextEditing,
    time,
    playing,
    duration,
    pixelsPerSecond,
    isPlaying,
    play,
    pause,
    togglePlay,
  };

  return (
    <EditorContext.Provider value={value}>
      {/* Inside the provider so the song follows the same clock on the Editor and on Preview. */}
      <MusicTrack />
      {children}
    </EditorContext.Provider>
  );
}

export function useEditor(): EditorContextValue {
  const context = useContext(EditorContext);
  if (!context) throw new Error('useEditor must be used inside EditorProvider');
  return context;
}

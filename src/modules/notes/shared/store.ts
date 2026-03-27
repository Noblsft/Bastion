import { create } from 'zustand';

interface NotesState {
  activeNoteId: string | null;
  setActiveNoteId: (id: string | null) => void;
  openFolderIds: Set<string>;
  toggleFolder: (id: string) => void;
}

export const useNotesStore = create<NotesState>()((set) => ({
  activeNoteId: null,
  setActiveNoteId: (id) => set({ activeNoteId: id }),
  openFolderIds: new Set<string>(),
  toggleFolder: (id) =>
    set((state) => {
      const next = new Set(state.openFolderIds);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return { openFolderIds: next };
    }),
}));

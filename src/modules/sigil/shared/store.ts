import { create } from 'zustand';

interface SigilState {
  activeSection: 'secrets' | 'settings';
  setActiveSection: (section: SigilState['activeSection']) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export const useSigilStore = create<SigilState>()((set) => ({
  activeSection: 'secrets',
  setActiveSection: (section) => set({ activeSection: section }),

  searchQuery: '',
  setSearchQuery: (query) => set({ searchQuery: query }),
}));

import { create } from 'zustand';

import type { ModuleNames } from '@/modules';
import type { VaultHandle } from '@/services/types';

interface AppState {
  /** Currently active module. */
  activeModule: ModuleNames;
  /** Set the active module. */
  setActiveModule: (module: ModuleNames) => void;
  /** Whether the right sidebar panel is open. */
  sidebarRightOpen: boolean;
  /** Toggle the right sidebar open/closed. */
  toggleSidebarRight: () => void;
  /** Metadata of the currently open vault, or null when no vault is loaded. */
  vault: VaultHandle | null;
  /** Set the open vault handle. Pass null to clear. */
  setVault: (vault: VaultHandle | null) => void;
}

/**
 * Global application store. Holds core state shared across all modules.
 */
export const useAppStore = create<AppState>()((set) => ({
  activeModule: 'sigil',
  setActiveModule: (module) => set({ activeModule: module }),
  sidebarRightOpen: true,
  toggleSidebarRight: () => set((s) => ({ sidebarRightOpen: !s.sidebarRightOpen })),
  vault: null,
  setVault: (vault) => set({ vault }),
}));

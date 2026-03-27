import { Module } from '@/modules/types';

import { Icon } from './desktop/Icon.tsx';
import { Sidebar } from './desktop/Sidebar.tsx';
import { Workspace } from './desktop/Workspace.tsx';
import { useNotesStore } from './shared/store.ts';

export const Notes: Module = {
  name: 'Notes',
  Icon,
  Sidebar,
  Workspace,
  useStore: useNotesStore,
};

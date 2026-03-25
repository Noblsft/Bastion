import { Module } from '@/modules/types';

import { Icon } from './desktop/Icon.tsx';
import { Sidebar } from './desktop/Sidebar.tsx';
import { Workspace } from './desktop/Workspace.tsx';
import { useSigilStore } from './shared/store.ts';

export const Sigil: Module = {
  name: 'Sigil',
  Icon,
  Sidebar,
  Workspace,
  useStore: useSigilStore,
};

import { App } from '@/apps/types';

import { Sidebar } from './desktop/Sidebar.tsx';
import { Workspace } from './desktop/Workspace.tsx';
import { Provider } from './shared/Provider.tsx';

export const Sigil: App = {
  name: 'Sigil',
  Sidebar,
  Workspace,
  Provider,
};

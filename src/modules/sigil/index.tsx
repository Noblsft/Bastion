import { App } from '@/modules/types';

import { Icon } from './desktop/Icon.tsx';
import { Sidebar } from './desktop/Sidebar.tsx';
import { Workspace } from './desktop/Workspace.tsx';
import { Provider } from './shared/Provider.tsx';

export const Sigil: App = {
  name: 'Sigil',
  Icon,
  Sidebar,
  Workspace,
  Provider,
};

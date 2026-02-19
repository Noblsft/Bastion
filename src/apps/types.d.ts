import { ReactNode, ComponentType } from 'react';

export interface App {
  name: string;
  Sidebar: ComponentType;
  Workspace: ComponentType;
  Provider: ComponentType<{ children: ReactNode }>;
}

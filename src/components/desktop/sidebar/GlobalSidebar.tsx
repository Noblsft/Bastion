import { ModuleSidebar } from './ModuleSidebar';
import { ModulesPanel } from './ModulesPanel';
import { VaultPanel } from './VaultPanel';

import type { App } from '@/apps/types';

type GlobalSidebarProps = {
  activeApp: string;
  onSelectApp: (appId: string) => void;
  app: App;
  sidebarRightOpen: boolean;
};

export function GlobalSidebar({
  activeApp,
  onSelectApp,
  app,
  sidebarRightOpen,
}: GlobalSidebarProps) {
  return (
    <aside className='h-full border-r bg-sidebar text-sidebar-foreground flex overflow-hidden'>
      {/* LEFT STRIP - Module Icons (~70px) */}
      <div className='w-16 border-r border-sidebar-border flex flex-col items-center py-3 gap-2 flex-shrink-0 overflow-y-auto'>
        <ModulesPanel activeApp={activeApp} onSelectApp={onSelectApp} />
      </div>

      {/* RIGHT PANEL - Module Sidebar + Vault Panel (togglable) */}
      {sidebarRightOpen && (
        <div className='flex-1 flex flex-col min-w-0'>
          {/* Module Sidebar - Middle (scrollable) */}
          <ModuleSidebar app={app} />

          {/* Vault Panel - Bottom */}
          <VaultPanel />
        </div>
      )}
    </aside>
  );
}

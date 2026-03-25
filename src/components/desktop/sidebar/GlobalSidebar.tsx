import { ModuleSidebar } from './ModuleSidebar';
import { ModulesPanel } from './ModulesPanel';
import { VaultPanel } from './VaultPanel';

import type { Module } from '@/modules/types';

type GlobalSidebarProps = {
  activeModule: string;
  onSelectModule: (moduleId: string) => void;
  module: Module;
  sidebarRightOpen: boolean;
};

export function GlobalSidebar({
  activeModule,
  onSelectModule,
  module,
  sidebarRightOpen,
}: GlobalSidebarProps) {
  return (
    <aside className='h-full border-r bg-sidebar text-sidebar-foreground flex overflow-hidden'>
      {/* LEFT STRIP - Module Icons (~70px) */}
      <div className='w-16 border-r border-sidebar-border flex flex-col items-center py-3 gap-2 flex-shrink-0 overflow-y-auto'>
        <ModulesPanel activeModule={activeModule} onSelectModule={onSelectModule} />
      </div>

      {/* RIGHT PANEL - Module Sidebar + Vault Panel (togglable) */}
      {sidebarRightOpen && (
        <div className='flex-1 flex flex-col min-w-0'>
          {/* Module Sidebar - Middle (scrollable) */}
          <ModuleSidebar module={module} />

          {/* Vault Panel - Bottom */}
          <VaultPanel />
        </div>
      )}
    </aside>
  );
}

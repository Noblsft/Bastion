import type { App } from '@/apps/types';

type ModuleSidebarProps = {
  app: App;
};

export function ModuleSidebar({ app }: ModuleSidebarProps) {
  return (
    <div className='flex-1 overflow-y-auto'>
      <app.Sidebar />
    </div>
  );
}

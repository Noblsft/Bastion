import type { Module } from '@/modules/types';

type ModuleSidebarProps = {
  module: Module;
};

export function ModuleSidebar({ module }: ModuleSidebarProps) {
  return (
    <div className='flex-1 overflow-y-auto'>
      <module.Sidebar />
    </div>
  );
}

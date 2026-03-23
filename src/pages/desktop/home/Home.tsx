import { Workspace } from '@/components';

import type { Module } from '@/modules/types';

export default function Home({ module }: { module: Module }) {
  return (
    <div className='flex-1 overflow-auto bg-background'>
      <Workspace module={module} />
    </div>
  );
}

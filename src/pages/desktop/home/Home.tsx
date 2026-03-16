import { Workspace } from '@/components';

import type { App } from '@/apps/types';

export default function Home({ app }: { app: App }) {
  return (
    <app.Provider>
      <div className='flex-1 overflow-auto bg-background'>
        <Workspace app={app} />
      </div>
    </app.Provider>
  );
}

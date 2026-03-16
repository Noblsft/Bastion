import { useState } from 'react';

import { appRegistry } from '@/apps';

type AppNames = keyof typeof appRegistry;

export default function Home() {
  const [activeApp] = useState<AppNames>('sigil');

  const app = appRegistry[activeApp];

  return (
    <app.Provider>
      <div>
        <h1>Home</h1>
      </div>
    </app.Provider>
  );
}

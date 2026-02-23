import { Box, Splitter } from '@chakra-ui/react';
import './home.css';
import { useState } from 'react';

import { appRegistry } from '@/apps';
import { AppsBar, Sidebar, Workspace } from '@/components';

type AppNames = keyof typeof appRegistry;

export default function Home() {
  const [activeApp] = useState<AppNames>('sigil');

  const app = appRegistry[activeApp];

  return (
    <app.Provider>
      <Box height='100%'>
        <AppsBar />
        <Box className='home' bg='bg.panel' p={2} borderWidth='1px'>
          <Splitter.Root
            panels={[
              { id: 'sidebar', collapsible: true, collapsedSize: 0, minSize: 10 },
              { id: 'workspace' },
            ]}
            defaultSize={[10, 90]}
            height='100%'
          >
            <Splitter.Panel id='sidebar'>
              <Sidebar app={app} />
            </Splitter.Panel>
            <Splitter.ResizeTrigger id='sidebar:workspace'>
              <Splitter.ResizeTriggerSeparator display='none' />
            </Splitter.ResizeTrigger>
            <Splitter.Panel id='workspace'>
              <Workspace app={app} />
            </Splitter.Panel>
          </Splitter.Root>
        </Box>
      </Box>
    </app.Provider>
  );
}

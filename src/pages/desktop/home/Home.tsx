import { Box, Splitter } from '@chakra-ui/react';
import './home.css';

import { Apps, Sidebar, Workspace } from '@/components';

export default function Home() {
  return (
    <Box height='100%'>
      <Apps />
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
            <Sidebar />
          </Splitter.Panel>
          <Splitter.ResizeTrigger id='sidebar:workspace'>
            <Splitter.ResizeTriggerSeparator display='none' />
          </Splitter.ResizeTrigger>
          <Splitter.Panel id='workspace'>
            <Workspace />
          </Splitter.Panel>
        </Splitter.Root>
      </Box>
    </Box>
  );
}

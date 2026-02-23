import { Box } from '@chakra-ui/react';

import type { App } from '@/apps/types';

export function Sidebar({ app }: { app: App }) {
  return (
    <Box p={1} minHeight='100vh' bg='bg.panel'>
      <app.Sidebar />
    </Box>
  );
}

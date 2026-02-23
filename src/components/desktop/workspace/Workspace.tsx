import { Box } from '@chakra-ui/react';

import type { App } from '@/apps/types';

export function Workspace({ app }: { app: App }) {
  return (
    <Box bg='bg.emphasized' p={1} height='100vh'>
      <app.Workspace />
    </Box>
  );
}

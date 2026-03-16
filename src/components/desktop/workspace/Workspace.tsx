import type { App } from '@/apps/types';

export function Workspace({ app }: { app: App }) {
  return (
    // <Box className='workspace' bg='bg.emphasized' p={1}>
    //   <app.Workspace />
    // </Box>
    <div>
      <app.Workspace />
    </div>
  );
}

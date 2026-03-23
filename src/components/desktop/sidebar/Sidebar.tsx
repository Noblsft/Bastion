import type { App } from '@/modules/types';

export function Sidebar({ app }: { app: App }) {
  return (
    // <Box p={1}>
    //   <app.Sidebar />
    // </Box>
    <>
      <app.Sidebar />
    </>
  );
}

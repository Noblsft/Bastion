import type { Module } from '@/modules/types';

export function Sidebar({ app }: { app: Module }) {
  return (
    // <Box p={1}>
    //   <app.Sidebar />
    // </Box>
    <>
      <app.Sidebar />
    </>
  );
}

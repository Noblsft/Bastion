import type { Module } from '@/modules/types';

export function Workspace({ module }: { module: Module }) {
  return (
    // <Box className='workspace' bg='bg.emphasized' p={1}>
    //   <module.Workspace />
    // </Box>
    <div>
      <module.Workspace />
    </div>
  );
}

import { Lock, Settings } from 'lucide-react';

import { Button } from '@/components/ui/button';

export function VaultPanel() {
  return (
    <div className='border-t border-sidebar-border bg-sidebar p-3 flex items-center gap-3 flex-shrink-0'>
      {/* Vault icon placeholder */}
      <div className='flex-shrink-0 w-10 h-10 rounded-lg bg-sidebar-accent flex items-center justify-center text-sidebar-accent-foreground'>
        <svg className='w-5 h-5' viewBox='0 0 24 24' fill='currentColor'>
          <path d='M11 1H7a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h4v6H5v2h14v-2h-8v-6h4a2 2 0 0 0 2-2V3a2 2 0 0 0-2-2h-4zm0 2v6h-4V3h4z' />
        </svg>
      </div>

      {/* Vault info */}
      <div className='flex-1 min-w-0'>
        <div className='text-xs font-semibold text-sidebar-foreground truncate'>My Vault</div>
        <div className='text-xs text-sidebar-foreground/70'>Unlocked</div>
      </div>

      {/* Actions */}
      <div className='flex-shrink-0 flex items-center gap-1'>
        <Button
          variant='ghost'
          size='icon'
          className='h-8 w-8 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors'
          title='Lock vault'
        >
          <Lock className='h-4 w-4' />
        </Button>
        <Button
          variant='ghost'
          size='icon'
          className='h-8 w-8 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors'
          title='Vault settings'
        >
          <Settings className='h-4 w-4' />
        </Button>
      </div>
    </div>
  );
}

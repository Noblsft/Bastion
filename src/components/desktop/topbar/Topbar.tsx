import { getCurrentWindow } from '@tauri-apps/api/window';
import { type } from '@tauri-apps/plugin-os';
import { LogOut, Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useServices } from '@/hooks/useServices.tsx';

type TopbarProps = {
  variant: 'start' | 'vault';
  sidebarOpen?: boolean;
  onToggleSidebar?: () => void;
};

export function Topbar({ variant, sidebarOpen, onToggleSidebar }: TopbarProps) {
  const [osType, setOsType] = useState<'macos' | 'windows' | 'linux' | 'unknown'>('unknown');
  const appWindow = getCurrentWindow();
  const navigate = useNavigate();
  const { vaultService } = useServices();

  useEffect(() => {
    const detectOS = async () => {
      try {
        const detectedType = await type();
        // type() in Tauri v2 returns 'macos', 'windows', or 'linux'
        setOsType(detectedType as 'macos' | 'windows' | 'linux');
      } catch {
        console.warn('Could not detect OS. Defaulting to standard layout.');
      }
    };
    detectOS();
  }, []);

  const handleMinimize = () => appWindow.minimize();
  const handleToggleMaximize = () => appWindow.toggleMaximize();
  const handleClose = () => appWindow.close();

  const handleLogout = async () => {
    try {
      if (vaultService.closeVault) {
        await vaultService.closeVault();
      }
    } catch (e) {
      console.error('Failed to close vault:', e);
    } finally {
      navigate('/');
    }
  };

  const MacControls = () => (
    <div className='flex items-center gap-[8px] px-4 h-full group' data-tauri-drag-region>
      <button
        onClick={handleClose}
        className='w-3 h-3 rounded-full bg-[#ff5f56] border border-[#e0443e] flex items-center justify-center overflow-hidden'
      >
        <span className='opacity-0 group-hover:opacity-100 text-[#4d0000] text-[8px] font-bold leading-none select-none'>
          ✕
        </span>
      </button>
      <button
        onClick={handleMinimize}
        className='w-3 h-3 rounded-full bg-[#ffbd2e] border border-[#dea123] flex items-center justify-center overflow-hidden'
      >
        <span className='opacity-0 group-hover:opacity-100 text-[#5a3000] text-[10px] font-bold leading-none select-none mb-[2px]'>
          -
        </span>
      </button>
      <button
        onClick={handleToggleMaximize}
        className='w-3 h-3 rounded-full bg-[#27c93f] border border-[#1aab29] flex items-center justify-center overflow-hidden'
      >
        <span className='opacity-0 group-hover:opacity-100 text-[#004d09] text-[8px] font-bold leading-none select-none'>
          +
        </span>
      </button>
    </div>
  );

  const WindowsControls = () => (
    <div className='flex h-full'>
      <button
        onClick={handleMinimize}
        className='h-full w-[46px] flex items-center justify-center hover:bg-muted transition-none text-muted-foreground hover:text-foreground'
      >
        <svg
          width='10'
          height='10'
          viewBox='0 0 10 10'
          fill='none'
          xmlns='http://www.w3.org/2000/svg'
        >
          <path d='M 0,5 H 10' stroke='currentColor' strokeWidth='1' />
        </svg>
      </button>
      <button
        onClick={handleToggleMaximize}
        className='h-full w-[46px] flex items-center justify-center hover:bg-muted transition-none text-muted-foreground hover:text-foreground'
      >
        <svg
          width='10'
          height='10'
          viewBox='0 0 10 10'
          fill='none'
          xmlns='http://www.w3.org/2000/svg'
        >
          <path d='M 1,1 H 9 V 9 H 1 Z' stroke='currentColor' strokeWidth='1' />
        </svg>
      </button>
      <button
        onClick={handleClose}
        className='h-full w-[46px] flex items-center justify-center hover:bg-[#e81123] hover:text-white transition-none text-muted-foreground'
      >
        <svg
          width='10'
          height='10'
          viewBox='0 0 10 10'
          fill='none'
          xmlns='http://www.w3.org/2000/svg'
        >
          <path d='M 0,0 L 10,10 M 10,0 L 0,10' stroke='currentColor' strokeWidth='1' />
        </svg>
      </button>
    </div>
  );

  const LinuxControls = () => (
    <div className='flex items-center gap-2 pr-3 h-full'>
      <button
        onClick={handleMinimize}
        className='w-6 h-6 rounded-full hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors'
      >
        <svg width='10' height='10'>
          <path d='M 1,5 H 9' stroke='currentColor' strokeWidth='1.5' strokeLinecap='round' />
        </svg>
      </button>
      <button
        onClick={handleToggleMaximize}
        className='w-6 h-6 rounded-full hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors'
      >
        <svg width='10' height='10' fill='none'>
          <rect
            x='1.5'
            y='1.5'
            width='7'
            height='7'
            stroke='currentColor'
            strokeWidth='1.5'
            rx='1'
          />
        </svg>
      </button>
      <button
        onClick={handleClose}
        className='w-6 h-6 rounded-full hover:bg-destructive/90 hover:text-destructive-foreground flex items-center justify-center text-muted-foreground transition-colors'
      >
        <svg width='10' height='10'>
          <path
            d='M 2,2 L 8,8 M 8,2 L 2,8'
            stroke='currentColor'
            strokeWidth='1.5'
            strokeLinecap='round'
          />
        </svg>
      </button>
    </div>
  );

  return (
    <div
      data-tauri-drag-region
      className='h-[48px] w-full flex items-center justify-between select-none border-b bg-background/95 backdrop-blur z-50 relative'
    >
      {/* LEFT SECTION */}
      <div className='flex items-center h-full min-w-[120px] gap-2' data-tauri-drag-region>
        {osType === 'macos' && <MacControls />}
        {variant === 'vault' && onToggleSidebar && (
          <Button
            variant='ghost'
            size='icon'
            className='h-7 w-7 rounded-md hover:bg-muted transition-colors'
            onClick={onToggleSidebar}
            title={sidebarOpen ? 'Hide Sidebar' : 'Show Sidebar'}
          >
            <svg
              className='h-5 w-5'
              viewBox='0 0 24 24'
              fill='none'
              stroke='currentColor'
              strokeWidth='2'
              strokeLinecap='round'
              strokeLinejoin='round'
            >
              {/* Left panel - filled when sidebar is open */}
              <rect
                x='3'
                y='3'
                width='7'
                height='18'
                rx='1'
                fill={sidebarOpen ? 'currentColor' : 'none'}
                stroke='currentColor'
                strokeWidth='2'
              />
              {/* Right content area - always outlined */}
              <rect
                x='10'
                y='3'
                width='11'
                height='18'
                rx='1'
                fill='none'
                stroke='currentColor'
                strokeWidth='2'
              />
            </svg>
          </Button>
        )}
      </div>

      <div
        className='absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center h-full w-[40%] max-w-sm'
        data-tauri-drag-region
      >
        {variant === 'vault' ? (
          <div className='relative w-full max-w-[300px] flex items-center'>
            <Search className='h-3.5 w-3.5 text-muted-foreground absolute ml-2.5 pointer-events-none' />
            <Input
              placeholder='Search secrets...'
              className='h-7 pl-8 pr-2 text-xs bg-muted/50 border-muted-foreground/20 placeholder:text-muted-foreground/60 focus-visible:ring-1 focus-visible:ring-primary w-full shadow-none'
            />
          </div>
        ) : (
          <div className='font-semibold tracking-tight pointer-events-none text-sm'>Bastion</div>
        )}
      </div>

      {/* RIGHT SECTION */}
      <div className='flex items-center justify-end h-full min-w-[120px]'>
        {variant === 'vault' && (
          <Button
            variant='ghost'
            size='icon'
            className='h-7 w-7 rounded-md hover:bg-muted mr-3 text-muted-foreground hover:text-foreground'
            onClick={handleLogout}
            title='Lock & Exit Vault'
          >
            <LogOut className='h-4 w-4' />
          </Button>
        )}

        {osType === 'windows' && <WindowsControls />}
        {osType === 'linux' && <LinuxControls />}
      </div>
    </div>
  );
}

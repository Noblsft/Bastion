export function Sidebar() {
  return (
    <div className='flex flex-col h-full p-4 space-y-4'>
      <h2 className='font-semibold text-sm text-sidebar-foreground'>Sigil</h2>
      <nav className='flex flex-col space-y-1'>
        <button className='px-3 py-2 text-sm rounded hover:bg-sidebar-accent text-sidebar-foreground hover:text-sidebar-accent-foreground transition-colors'>
          Vaults
        </button>
        <button className='px-3 py-2 text-sm rounded hover:bg-sidebar-accent text-sidebar-foreground hover:text-sidebar-accent-foreground transition-colors'>
          Secrets
        </button>
        <button className='px-3 py-2 text-sm rounded hover:bg-sidebar-accent text-sidebar-foreground hover:text-sidebar-accent-foreground transition-colors'>
          Settings
        </button>
      </nav>
    </div>
  );
}

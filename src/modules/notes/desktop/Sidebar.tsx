export function Sidebar() {
  return (
    <div className='flex flex-col h-full p-4 space-y-4'>
      <h2 className='font-semibold text-sm text-sidebar-foreground'>Notes</h2>
      <div className='flex-1 flex items-center justify-center'>
        <p className='text-sm text-muted-foreground'>No notes yet</p>
      </div>
    </div>
  );
}

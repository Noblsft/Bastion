import { appRegistry } from '@/apps';
import { Button } from '@/components/ui/button';

type ModulesPanelProps = {
  activeApp: string;
  onSelectApp: (appId: string) => void;
};

export function ModulesPanel({ activeApp, onSelectApp }: ModulesPanelProps) {
  return (
    <div className='flex flex-col gap-3 w-full'>
      {Object.entries(appRegistry).map(([appId, app]) => {
        const isActive = activeApp === appId;
        return (
          <Button
            key={appId}
            variant='ghost'
            size='icon'
            onClick={() => onSelectApp(appId)}
            className={`h-12 w-12 rounded-lg transition-colors flex-shrink-0 ${
              isActive
                ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                : 'text-sidebar-foreground hover:bg-sidebar-accent/70'
            }`}
            title={app.name}
          >
            {app.Icon ? (
              <app.Icon className='h-6 w-6' />
            ) : (
              <span className='text-xs font-semibold'>{app.name[0]}</span>
            )}
          </Button>
        );
      })}
    </div>
  );
}

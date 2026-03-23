import { Button } from '@/components/ui/button';
import { moduleRegistry } from '@/modules';

type ModulesPanelProps = {
  activeModule: string;
  onSelectModule: (moduleId: string) => void;
};

export function ModulesPanel({ activeModule, onSelectModule }: ModulesPanelProps) {
  return (
    <div className='flex flex-col gap-3 w-full'>
      {Object.entries(moduleRegistry).map(([moduleId, module]) => {
        const isActive = activeModule === moduleId;
        return (
          <Button
            key={moduleId}
            variant='ghost'
            size='icon'
            onClick={() => onSelectModule(moduleId)}
            className={`h-12 w-12 rounded-lg transition-colors flex-shrink-0 ${
              isActive
                ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                : 'text-sidebar-foreground hover:bg-sidebar-accent/70'
            }`}
            title={module.name}
          >
            {module.Icon ? (
              <module.Icon className='h-6 w-6' />
            ) : (
              <span className='text-xs font-semibold'>{module.name[0]}</span>
            )}
          </Button>
        );
      })}
    </div>
  );
}

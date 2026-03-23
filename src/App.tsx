import './App.css';
import { HashRouter, Routes, Route, useLocation } from 'react-router-dom';

import { Topbar, GlobalSidebar } from '@/components';
import { moduleRegistry } from '@/modules';
import { Start, Home } from '@/pages';
import { useAppStore } from '@/store/appStore';

function MainLayout() {
  const location = useLocation();
  const isVaultMode = location.pathname.includes('/home');

  const activeModule = useAppStore((s) => s.activeModule);
  const setActiveModule = useAppStore((s) => s.setActiveModule);
  const sidebarRightOpen = useAppStore((s) => s.sidebarRightOpen);
  const toggleSidebarRight = useAppStore((s) => s.toggleSidebarRight);

  const module = moduleRegistry[activeModule];

  return (
    // TODO: Move this to start page and make it a separate layout for vault mode only
    <main className='flex h-screen w-screen flex-col overflow-hidden bg-background text-foreground antialiased'>
      <Topbar
        variant={isVaultMode ? 'vault' : 'start'}
        sidebarOpen={isVaultMode ? sidebarRightOpen : undefined}
        onToggleSidebar={isVaultMode ? toggleSidebarRight : undefined}
      />

      <div className='flex flex-1 overflow-hidden relative w-full'>
        {/* Global Sidebar - visible in vault mode only */}
        {isVaultMode && (
          <GlobalSidebar
            activeModule={activeModule}
            onSelectModule={(moduleId) => setActiveModule(moduleId as typeof activeModule)}
            module={module}
            sidebarRightOpen={sidebarRightOpen}
          />
        )}

        {/* Content Area */}
        <div className='flex flex-1 flex-col items-center justify-center overflow-hidden relative w-full'>
          <Routes>
            <Route path='/' element={<Start />} />
            <Route path='/home' element={<Home module={module} />} />
          </Routes>
        </div>
      </div>
    </main>
  );
}

function App() {
  return (
    <HashRouter>
      <MainLayout />
    </HashRouter>
  );
}

export default App;

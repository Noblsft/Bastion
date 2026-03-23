import './App.css';
import { useState } from 'react';
import { HashRouter, Routes, Route, useLocation } from 'react-router-dom';

import { Topbar, GlobalSidebar } from '@/components';
import { appRegistry } from '@/modules';
import { Start, Home } from '@/pages';

type AppNames = keyof typeof appRegistry;

function MainLayout() {
  const location = useLocation();
  const isVaultMode = location.pathname.includes('/home');
  const [activeApp, setActiveApp] = useState<AppNames>('sigil');
  const [sidebarRightOpen, setSidebarRightOpen] = useState(true);

  const app = appRegistry[activeApp];

  return (
    <main className='flex h-screen w-screen flex-col overflow-hidden bg-background text-foreground antialiased'>
      <Topbar
        variant={isVaultMode ? 'vault' : 'start'}
        sidebarOpen={isVaultMode ? sidebarRightOpen : undefined}
        onToggleSidebar={isVaultMode ? () => setSidebarRightOpen((prev) => !prev) : undefined}
      />

      <div className='flex flex-1 overflow-hidden relative w-full'>
        {/* Global Sidebar - visible in vault mode only */}
        {isVaultMode && (
          <GlobalSidebar
            activeApp={activeApp}
            onSelectApp={(appId) => setActiveApp(appId as AppNames)}
            app={app}
            sidebarRightOpen={sidebarRightOpen}
          />
        )}

        {/* Content Area */}
        <div className='flex flex-1 flex-col items-center justify-center overflow-hidden relative w-full'>
          <Routes>
            <Route path='/' element={<Start />} />
            <Route path='/home' element={<Home app={app} />} />
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

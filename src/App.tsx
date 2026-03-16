import './App.css';
import { HashRouter, Routes, Route, useLocation } from 'react-router-dom';

import { Topbar } from '@/components';
import { Start, Home } from '@/pages';

function MainLayout() {
  const location = useLocation();
  const isVaultMode = location.pathname.includes('/home');

  return (
    <main className='flex h-screen w-screen flex-col overflow-hidden bg-background text-foreground antialiased'>
      <Topbar variant={isVaultMode ? 'vault' : 'start'} />

      <div className='flex flex-1 flex-col items-center justify-center overflow-hidden relative w-full'>
        <Routes>
          <Route path='/' element={<Start />} />
          <Route path='/home' element={<Home />} />
        </Routes>
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

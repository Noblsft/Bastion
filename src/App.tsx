import './App.css';
import { HashRouter, Routes, Route } from 'react-router-dom';

import { Topbar } from '@/components';
import { Start, Home } from '@/pages';

function App() {
  return (
    // Make the shell a full-screen, non-scrolling flex column
    <main className='flex h-screen w-screen flex-col overflow-hidden bg-background text-foreground antialiased'>
      <Topbar />

      <div className='flex flex-1 flex-col items-center justify-center overflow-hidden relative w-full'>
        {' '}
        <HashRouter>
          <Routes>
            <Route path='/' element={<Start />} />
            <Route path='/home' element={<Home />} />
          </Routes>
        </HashRouter>
      </div>
    </main>
  );
}

export default App;

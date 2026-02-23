import './App.css';
import { Box } from '@chakra-ui/react';
import { HashRouter, Routes, Route } from 'react-router-dom';

import { Topbar, Provider } from '@/components';
import { Start, Home } from '@/pages';

function App() {
  return (
    <Provider>
      <Box className='window-shell' bg='bg.canvas' colorPalette='brand'>
        <Topbar />
        <HashRouter>
          <Routes>
            <Route path='/' element={<Start />} />
            <Route path='/home' element={<Home />} />
          </Routes>
        </HashRouter>
      </Box>
    </Provider>
  );
}

export default App;

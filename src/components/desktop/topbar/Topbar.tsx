import { Box, Flex, HStack } from '@chakra-ui/react';
import { getCurrentWindow } from '@tauri-apps/api/window';

import { useColorModeValue } from '@/components';

export function Topbar() {
  const borderColor = useColorModeValue('rgba(0,0,0,0.06)', 'rgba(255,255,255,0.04)');
  const appWindow = getCurrentWindow();

  const onMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0) {
      if (e.detail === 2) {
        appWindow.toggleMaximize();
      } else {
        appWindow.startDragging();
      }
    }
  };

  return (
    <Box
      onMouseDown={(event) => {
        onMouseDown(event);
      }}
      as='header'
      position='sticky'
      top={0}
      zIndex={50}
      width='100%'
    >
      <Box mx={1} px={2} height='35px'>
        <Flex align='center' height='100%'>
          <HStack gap={2} align='center'>
            <Box
              as='button'
              onClick={() => appWindow.close()}
              aria-label='Close'
              width='12px'
              height='12px'
              minW='12px'
              p={0}
              borderRadius='full'
              bg='#ff605c'
              border={`1px solid ${borderColor}`}
              cursor='pointer'
              _hover={{ filter: 'brightness(1.05)' }}
              _focus={{ boxShadow: 'outline' }}
            />

            <Box
              as='button'
              onClick={() => appWindow.minimize()}
              aria-label='Minimize'
              width='12px'
              height='12px'
              minW='12px'
              p={0}
              borderRadius='full'
              bg='#ffbf2e'
              border={`1px solid ${borderColor}`}
              cursor='pointer'
              _hover={{ filter: 'brightness(1.05)' }}
              _focus={{ boxShadow: 'outline' }}
            />

            <Box
              as='button'
              onClick={() => appWindow.toggleMaximize()}
              aria-label='Maximize'
              width='12px'
              height='12px'
              minW='12px'
              p={0}
              borderRadius='full'
              bg='#2fd55a'
              border={`1px solid ${borderColor}`}
              cursor='pointer'
              _hover={{ filter: 'brightness(1.05)' }}
              _focus={{ boxShadow: 'outline' }}
            />
          </HStack>
        </Flex>
      </Box>
    </Box>
  );
}

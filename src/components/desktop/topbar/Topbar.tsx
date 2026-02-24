import { Box, Flex, HStack, Input } from '@chakra-ui/react';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { useState } from 'react';

import { useColorModeValue } from '@/components';

export function Topbar() {
  // TODO: make search bar visible when not on start screen
  const [isStartScreen] = useState(false);
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
      borderBottom='1px solid'
      borderColor='border'
    >
      <Box mx={1} px={2} height='5vh'>
        <Flex justify='space-between' align='center' height='100%' gap={4}>
          <HStack gap={2} align='center' flex='0 0 auto'>
            <Box
              as='button'
              onClick={() => appWindow.close()}
              aria-label='Close'
              width={3}
              height={3}
              minW={3}
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
              width={3}
              height={3}
              minW={3}
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
              width={3}
              height={3}
              minW={3}
              p={0}
              borderRadius='full'
              bg='#2fd55a'
              border={`1px solid ${borderColor}`}
              cursor='pointer'
              _hover={{ filter: 'brightness(1.05)' }}
              _focus={{ boxShadow: 'outline' }}
            />
          </HStack>
          <Input
            hidden={isStartScreen}
            placeholder='Search your files...'
            h='3vh'
            flex='1'
            maxW='40vw'
          />
          <Box flex='0 0 auto' />
        </Flex>
      </Box>
    </Box>
  );
}

import { Box, HStack, Separator, Dialog, Portal, CloseButton, Button } from '@chakra-ui/react';
import { FaPlus } from 'react-icons/fa6';

export function Apps() {
  return (
    <Box mx='10px' my='2px'>
      <Dialog.Root size='cover'>
        <HStack gap={4}>
          <Dialog.Trigger asChild>
            <Button aria-label='Open application library' variant='surface' size='md'>
              <FaPlus />
            </Button>
          </Dialog.Trigger>
          <Separator orientation='vertical' height='8' />
          <Portal>
            <Dialog.Backdrop />
            <Dialog.Positioner>
              <Dialog.Content>
                <Dialog.Header>
                  <Dialog.Title>Application library</Dialog.Title>
                </Dialog.Header>
                <Dialog.Body>
                  <p>
                    Here you can manage your applications. You can browse and install new
                    applications. You can also uninstall applications that you no longer need.
                  </p>
                </Dialog.Body>
                <Dialog.Footer>
                  <Dialog.ActionTrigger asChild>
                    <Button variant='outline'>Cancel</Button>
                  </Dialog.ActionTrigger>
                  <Button>Save</Button>
                </Dialog.Footer>
                <Dialog.CloseTrigger asChild>
                  <CloseButton size='sm' />
                </Dialog.CloseTrigger>
              </Dialog.Content>
            </Dialog.Positioner>
          </Portal>
        </HStack>
      </Dialog.Root>
    </Box>
  );
}

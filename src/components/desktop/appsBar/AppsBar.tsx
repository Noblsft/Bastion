import { Box, VStack, Dialog, Portal, CloseButton, Button } from '@chakra-ui/react';
import { FaPlus } from 'react-icons/fa6';

export function AppsBar() {
  return (
    <Box p={1} w='60px' alignSelf='flex-start'>
      <VStack gap={2} alignItems='center'>
        <Dialog.Root size='cover'>
          <Dialog.Trigger asChild>
            <Button aria-label='Open application library' variant='outline' size='sm'>
              <FaPlus />
            </Button>
          </Dialog.Trigger>
          <Portal>
            <Dialog.Backdrop borderRadius='14px' overflow='hidden' />
            <Dialog.Positioner>
              <Dialog.Content borderRadius='md'>
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
        </Dialog.Root>
      </VStack>
    </Box>
  );
}

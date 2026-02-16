import { VStack, Image, Button } from '@chakra-ui/react';
import { save, open } from '@tauri-apps/plugin-dialog';
import { useNavigate } from 'react-router-dom';

import logo from '@/assets/logo.png';
import { useServices } from '@/hooks/useServices.tsx';

export default function Start() {
  const { vaultService } = useServices();
  const navigate = useNavigate();

  const createNewVault = async () => {
    const path = await save({
      defaultPath: 'project.nobl',
      filters: [{ name: 'Nobl vault', extensions: ['nobl'] }],
    });

    if (!path) return;

    await vaultService.createVault(path);
    navigate('/home');
  };

  const loadExistingVault = async () => {
    const path = await open({
      defaultPath: 'project.nobl',
      filters: [{ name: 'Nobl vault', extensions: ['nobl'] }],
    });

    if (!path) return;

    await vaultService.loadVault(path);
    navigate('/home');
  };

  return (
    <VStack justifyContent='space-between' height='70%' p={4}>
      <Image src={logo} alt='logo' aspectRatio={4 / 3} width='350px' />
      <VStack gap={2} width='100%'>
        <Button
          width='30%'
          variant='surface'
          onClick={async () => {
            await createNewVault();
          }}
        >
          Create new nobl file
        </Button>
        <Button
          width='30%'
          variant='surface'
          onClick={async () => {
            await loadExistingVault();
          }}
        >
          Load existing nobl file
        </Button>
      </VStack>
    </VStack>
  );
}

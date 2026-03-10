import { VStack, HStack, Image, Button, Input, Text } from '@chakra-ui/react';
import { save, open } from '@tauri-apps/plugin-dialog';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import logo from '@/assets/logo.png';
import { useServices } from '@/hooks/useServices.tsx';

import type { Cipher } from '@/services/types';

type Step = { kind: 'idle' } | { kind: 'create'; path: string } | { kind: 'open'; path: string };

const CIPHERS: { value: Cipher; label: string }[] = [
  { value: 'aes256_gcm', label: 'AES-256-GCM' },
  { value: 'cha_cha20_poly1305', label: 'ChaCha20-Poly1305' },
];

export default function Start() {
  const { vaultService } = useServices();
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>({ kind: 'idle' });
  const [passphrase, setPassphrase] = useState('');
  const [cipher, setCipher] = useState<Cipher>('aes256_gcm');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const reset = () => {
    setStep({ kind: 'idle' });
    setPassphrase('');
    setError(null);
  };

  const pickNewPath = async () => {
    const path = await save({
      defaultPath: 'project.nobl',
      filters: [{ name: 'Nobl vault', extensions: ['nobl'] }],
    });
    if (!path) return;
    setStep({ kind: 'create', path });
    setPassphrase('');
    setError(null);
  };

  const pickExistingPath = async () => {
    const path = await open({
      filters: [{ name: 'Nobl vault', extensions: ['nobl'] }],
    });
    if (!path) return;
    setStep({ kind: 'open', path: path as string });
    setPassphrase('');
    setError(null);
  };

  const handleSubmit = async () => {
    if (step.kind === 'idle' || !passphrase) return;
    setLoading(true);
    setError(null);
    try {
      if (step.kind === 'create') {
        await vaultService.createVault(step.path, passphrase, cipher);
      } else {
        await vaultService.openVault(step.path, passphrase);
      }
      navigate('/home');
    } catch (e) {
      setError(typeof e === 'string' ? e : 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  if (step.kind === 'idle') {
    return (
      <VStack justifyContent='space-between' height='70%' p={4}>
        <Image src={logo} alt='logo' aspectRatio={4 / 3} width='350px' />
        <VStack gap={2} width='100%'>
          <Button width='30%' variant='surface' onClick={pickNewPath}>
            Create new nobl file
          </Button>
          <Button width='30%' variant='surface' onClick={pickExistingPath}>
            Load existing nobl file
          </Button>
        </VStack>
      </VStack>
    );
  }

  const isCreate = step.kind === 'create';

  return (
    <VStack justifyContent='space-between' height='70%' p={4}>
      <Image src={logo} alt='logo' aspectRatio={4 / 3} width='350px' />
      <VStack gap={4} width='30%'>
        <Text fontWeight='semibold' fontSize='sm' color='fg.muted' alignSelf='start'>
          {isCreate ? 'New vault' : 'Open vault'}
        </Text>

        <VStack gap={1} width='100%' alignItems='start'>
          <Text fontSize='xs' color='fg.muted'>
            Passphrase
          </Text>
          <Input
            type='password'
            placeholder='Enter passphrase'
            size='sm'
            value={passphrase}
            onChange={(e) => setPassphrase(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            autoFocus
          />
        </VStack>

        {isCreate && (
          <VStack gap={1} width='100%' alignItems='start'>
            <Text fontSize='xs' color='fg.muted'>
              Encryption
            </Text>
            <HStack gap={2} width='100%'>
              {CIPHERS.map(({ value, label }) => (
                <Button
                  key={value}
                  size='xs'
                  variant={cipher === value ? 'solid' : 'outline'}
                  onClick={() => setCipher(value)}
                  flex={1}
                >
                  {label}
                </Button>
              ))}
            </HStack>
          </VStack>
        )}

        {error && (
          <Text fontSize='xs' color='danger' alignSelf='start'>
            {error}
          </Text>
        )}

        <HStack gap={2} width='100%'>
          <Button variant='ghost' size='sm' flex={1} onClick={reset}>
            Back
          </Button>
          <Button
            variant='surface'
            size='sm'
            flex={1}
            disabled={!passphrase || loading}
            loading={loading}
            onClick={handleSubmit}
          >
            {isCreate ? 'Create vault' : 'Open vault'}
          </Button>
        </HStack>
      </VStack>
    </VStack>
  );
}

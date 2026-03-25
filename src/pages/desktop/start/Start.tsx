import { save, open } from '@tauri-apps/plugin-dialog';
import { Loader2, ShieldCheck, FolderOpen, ArrowLeft } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useServices } from '@/hooks/useServices.tsx';
import { useAppStore } from '@/store/appStore';

import type { Cipher } from '@/services/types';

type Step = { kind: 'idle' } | { kind: 'create'; path: string } | { kind: 'open'; path: string };

const CIPHERS: { value: Cipher; label: string }[] = [
  { value: 'aes256_gcm', label: 'AES-256-GCM' },
  { value: 'cha_cha20_poly1305', label: 'ChaCha20' },
];

export default function Start() {
  const { vaultService } = useServices();
  const navigate = useNavigate();
  const setVault = useAppStore((s) => s.setVault);

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
      const vault =
        step.kind === 'create'
          ? await vaultService.createVault(step.path, passphrase, cipher)
          : await vaultService.openVault(step.path, passphrase);
      setVault(vault);
      navigate('/home');
    } catch (e) {
      setError(typeof e === 'string' ? e : 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  if (step.kind === 'idle') {
    return (
      <div className='flex flex-col justify-center items-center h-full p-6 space-y-8'>
        <div className='text-center space-y-2'>
          <h1 className='text-3xl font-bold tracking-tight'>Bastion</h1>
          <p className='text-muted-foreground'>Secure your secrets with ease.</p>
        </div>
        <div className='flex flex-col gap-3 w-full max-w-xs'>
          <Button className='h-12 text-md' onClick={pickNewPath}>
            Create new vault
          </Button>
          <Button className='h-12 text-md' variant='outline' onClick={pickExistingPath}>
            Open existing vault
          </Button>
        </div>
      </div>
    );
  }

  const isCreate = step.kind === 'create';
  const fileName = step.path.split(/[/\\]/).pop();

  return (
    <div className='flex flex-col justify-center items-center h-full p-6'>
      <div className='w-full max-w-sm space-y-6'>
        {/* Header with Back Button */}
        <div className='flex items-center gap-4'>
          <Button variant='ghost' size='icon' onClick={reset} className='rounded-full'>
            <ArrowLeft className='h-5 w-5' />
          </Button>
          <div>
            <h2 className='text-xl font-semibold'>
              {isCreate ? 'Initialize Vault' : 'Unlock Vault'}
            </h2>
            <div className='flex items-center gap-1.5 text-xs text-muted-foreground'>
              <FolderOpen className='h-3 w-3' />
              <span className='truncate max-w-[200px]'>{fileName}</span>
            </div>
          </div>
        </div>

        {/* Form Container */}
        <div className='p-1 space-y-5'>
          <div className='space-y-2'>
            <label className='text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70'>
              Passphrase
            </label>
            <Input
              type='password'
              placeholder='••••••••••••'
              value={passphrase}
              onChange={(e) => setPassphrase(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              className='h-11'
              autoFocus
            />
          </div>

          {isCreate && (
            <div className='space-y-3'>
              <label className='text-xs font-semibold uppercase tracking-wider text-muted-foreground'>
                Encryption Algorithm
              </label>
              <div className='grid grid-cols-2 gap-2 p-1 bg-muted/50 rounded-lg'>
                {CIPHERS.map(({ value, label }) => (
                  <Button
                    key={value}
                    size='sm'
                    variant={cipher === value ? 'secondary' : 'ghost'}
                    onClick={() => setCipher(value)}
                    className={`text-xs shadow-none ${cipher === value ? 'bg-background shadow-sm' : ''}`}
                  >
                    {label}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {error && (
            <div className='p-3 rounded-md bg-destructive/10 border border-destructive/20'>
              <p className='text-xs text-destructive font-medium'>{error}</p>
            </div>
          )}

          <Button className='w-full h-11' disabled={!passphrase || loading} onClick={handleSubmit}>
            {loading ? (
              <Loader2 className='mr-2 h-4 w-4 animate-spin' />
            ) : (
              <ShieldCheck className='mr-2 h-4 w-4' />
            )}
            {isCreate ? 'Create & Encrypt' : 'Unlock Access'}
          </Button>
        </div>
      </div>
    </div>
  );
}

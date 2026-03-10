import { invoke } from '@tauri-apps/api/core';
jest.mock('@tauri-apps/api/core', () => ({ invoke: jest.fn() }));

import VaultService from '../../services/VaultService';

import type { VaultHandle, FileEntry, HistoryEntry, HistoryConfig } from '../../services/types';

const invokeMock = invoke as unknown as jest.Mock;
const service = new VaultService();

const mockHandle: VaultHandle = { path: '/vault', cipher: 'aes256_gcm' };
const mockFile: FileEntry = {
  id: 'uuid-1',
  name: 'test.txt',
  mime: 'text/plain',
  app_ids: [],
  size: 10,
  integrity_hash: 'abc123',
  compression: 'zstd',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};
const mockHistory: HistoryEntry = {
  version_id: 'ver-1',
  timestamp: '2024-01-01T00:00:00Z',
  change_type: { kind: 'content_updated' },
  metadata: {
    name: 'test.txt',
    mime: 'text/plain',
    app_ids: [],
    size: 10,
    integrity_hash: 'abc123',
    compression: null,
  },
};

beforeEach(() => {
  invokeMock.mockReset();
});

// ── Lifecycle ────────────────────────────────────────────────────────────────

describe('createVault', () => {
  test('calls create_vault with path, passphrase, and cipher', async () => {
    invokeMock.mockResolvedValue(mockHandle);
    const result = await service.createVault('/path', 'secret', 'aes256_gcm');
    expect(invokeMock).toHaveBeenCalledWith('create_vault', {
      path: '/path',
      passphrase: 'secret',
      cipher: 'aes256_gcm',
    });
    expect(result).toEqual(mockHandle);
  });

  test('propagates errors', async () => {
    invokeMock.mockRejectedValue(new Error('failed'));
    await expect(service.createVault('/path', 'secret', 'aes256_gcm')).rejects.toThrow('failed');
  });
});

describe('openVault', () => {
  test('calls open_vault with path and passphrase', async () => {
    invokeMock.mockResolvedValue(mockHandle);
    const result = await service.openVault('/path', 'secret');
    expect(invokeMock).toHaveBeenCalledWith('open_vault', { path: '/path', passphrase: 'secret' });
    expect(result).toEqual(mockHandle);
  });

  test('propagates errors', async () => {
    invokeMock.mockRejectedValue(new Error('Wrong passphrase or corrupted vault'));
    await expect(service.openVault('/path', 'wrong')).rejects.toThrow(
      'Wrong passphrase or corrupted vault',
    );
  });
});

describe('closeVault', () => {
  test('calls close_vault', async () => {
    invokeMock.mockResolvedValue(undefined);
    await service.closeVault();
    expect(invokeMock).toHaveBeenCalledWith('close_vault');
  });
});

// ── Files ────────────────────────────────────────────────────────────────────

describe('createFile', () => {
  test('calls vault_create_file with correct args', async () => {
    invokeMock.mockResolvedValue(mockFile);
    await service.createFile('test.txt', 'text/plain', ['app1'], [72, 101]);
    expect(invokeMock).toHaveBeenCalledWith('vault_create_file', {
      name: 'test.txt',
      mime: 'text/plain',
      app_ids: ['app1'],
      data: [72, 101],
    });
  });
});

describe('readFile', () => {
  test('calls vault_read_file with id', async () => {
    invokeMock.mockResolvedValue([1, 2, 3]);
    const result = await service.readFile('uuid-1');
    expect(invokeMock).toHaveBeenCalledWith('vault_read_file', { id: 'uuid-1' });
    expect(result).toEqual([1, 2, 3]);
  });
});

describe('updateFile', () => {
  test('calls vault_update_file', async () => {
    invokeMock.mockResolvedValue(mockFile);
    await service.updateFile('uuid-1', [1, 2]);
    expect(invokeMock).toHaveBeenCalledWith('vault_update_file', { id: 'uuid-1', data: [1, 2] });
  });
});

describe('updateFileMetadata', () => {
  test('calls vault_update_file_metadata', async () => {
    invokeMock.mockResolvedValue(mockFile);
    await service.updateFileMetadata('uuid-1', 'new.txt', 'text/plain', []);
    expect(invokeMock).toHaveBeenCalledWith('vault_update_file_metadata', {
      id: 'uuid-1',
      name: 'new.txt',
      mime: 'text/plain',
      app_ids: [],
    });
  });
});

describe('deleteFile', () => {
  test('calls vault_delete_file', async () => {
    invokeMock.mockResolvedValue(undefined);
    await service.deleteFile('uuid-1');
    expect(invokeMock).toHaveBeenCalledWith('vault_delete_file', { id: 'uuid-1' });
  });
});

describe('listFiles', () => {
  test('calls vault_list_files', async () => {
    invokeMock.mockResolvedValue([mockFile]);
    const result = await service.listFiles();
    expect(invokeMock).toHaveBeenCalledWith('vault_list_files');
    expect(result).toEqual([mockFile]);
  });
});

describe('searchFiles', () => {
  test('calls vault_search_files with query', async () => {
    invokeMock.mockResolvedValue([mockFile]);
    await service.searchFiles('hello');
    expect(invokeMock).toHaveBeenCalledWith('vault_search_files', { query: 'hello' });
  });
});

// ── Settings ──────────────────────────────────────────────────────────────────

describe('getSettings', () => {
  test('calls vault_get_settings with scope', async () => {
    invokeMock.mockResolvedValue({ theme: 'dark' });
    const result = await service.getSettings('global');
    expect(invokeMock).toHaveBeenCalledWith('vault_get_settings', { scope: 'global' });
    expect(result).toEqual({ theme: 'dark' });
  });
});

describe('setSettings', () => {
  test('calls vault_set_settings with scope and value', async () => {
    invokeMock.mockResolvedValue(undefined);
    await service.setSettings('sigil', { theme: 'light' });
    expect(invokeMock).toHaveBeenCalledWith('vault_set_settings', {
      scope: 'sigil',
      value: { theme: 'light' },
    });
  });
});

// ── History ───────────────────────────────────────────────────────────────────

describe('getHistory', () => {
  test('calls vault_get_history with file_id', async () => {
    invokeMock.mockResolvedValue([mockHistory]);
    const result = await service.getHistory('uuid-1');
    expect(invokeMock).toHaveBeenCalledWith('vault_get_history', { file_id: 'uuid-1' });
    expect(result).toEqual([mockHistory]);
  });
});

describe('saveVersion', () => {
  test('calls vault_save_version with file_id', async () => {
    invokeMock.mockResolvedValue(mockHistory);
    await service.saveVersion('uuid-1');
    expect(invokeMock).toHaveBeenCalledWith('vault_save_version', { file_id: 'uuid-1' });
  });
});

describe('revertFile', () => {
  test('calls vault_revert_file with file_id and version_id', async () => {
    invokeMock.mockResolvedValue(mockFile);
    await service.revertFile('uuid-1', 'ver-1');
    expect(invokeMock).toHaveBeenCalledWith('vault_revert_file', {
      file_id: 'uuid-1',
      version_id: 'ver-1',
    });
  });
});

describe('getHistoryConfig', () => {
  test('calls vault_get_history_config', async () => {
    const config: HistoryConfig = {
      tracking: { mode: 'every_update' },
      retention: { policy: 'forever' },
    };
    invokeMock.mockResolvedValue(config);
    const result = await service.getHistoryConfig();
    expect(invokeMock).toHaveBeenCalledWith('vault_get_history_config');
    expect(result).toEqual(config);
  });
});

describe('setHistoryConfig', () => {
  test('calls vault_set_history_config with config', async () => {
    invokeMock.mockResolvedValue(undefined);
    const config: HistoryConfig = {
      tracking: { mode: 'manual' },
      retention: { policy: 'keep_last', max: 10 },
    };
    await service.setHistoryConfig(config);
    expect(invokeMock).toHaveBeenCalledWith('vault_set_history_config', { config });
  });
});

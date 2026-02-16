import { invoke } from '@tauri-apps/api/core';

import { logger } from '@/utils';

export default class VaultService {
  public async createVault(path: string): Promise<void> {
    logger.info('Creating vault with path: ' + path);
    await invoke('create_vault', { path });
  }

  public async loadVault(path: string): Promise<void> {
    logger.info('Loading vault with path: ' + path);
    await invoke('load_vault', { path });
  }
}

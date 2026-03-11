import { invoke } from '@tauri-apps/api/core';

import { logger } from '@/utils';

import type { Cipher, FileEntry, HistoryConfig, HistoryEntry, VaultHandle } from '@/services/types';

export default class VaultService {
  // ── Lifecycle ──────────────────────────────────────────────────────────────

  async createVault(path: string, passphrase: string, cipher: Cipher): Promise<VaultHandle> {
    logger.info(`Creating vault at: ${path}`);
    return await invoke('create_vault', { path, passphrase, cipher });
  }

  async openVault(path: string, passphrase: string): Promise<VaultHandle> {
    logger.info(`Opening vault at: ${path}`);
    return await invoke('open_vault', { path, passphrase });
  }

  async closeVault(): Promise<void> {
    logger.info('Closing vault');
    await invoke('close_vault');
  }

  // ── Files ──────────────────────────────────────────────────────────────────

  async createFile(
    name: string,
    mime: string,
    appIds: string[],
    data: number[],
  ): Promise<FileEntry> {
    return await invoke('vault_create_file', { name, mime, app_ids: appIds, data });
  }

  async readFile(id: string): Promise<number[]> {
    return await invoke('vault_read_file', { id });
  }

  async updateFile(id: string, data: number[]): Promise<FileEntry> {
    return await invoke('vault_update_file', { id, data });
  }

  async updateFileMetadata(
    id: string,
    name: string,
    mime: string,
    appIds: string[],
  ): Promise<FileEntry> {
    return await invoke('vault_update_file_metadata', { id, name, mime, app_ids: appIds });
  }

  async deleteFile(id: string): Promise<void> {
    await invoke('vault_delete_file', { id });
  }

  async listFiles(): Promise<FileEntry[]> {
    return await invoke('vault_list_files');
  }

  async searchFiles(query: string): Promise<FileEntry[]> {
    return await invoke('vault_search_files', { query });
  }

  // ── Settings ───────────────────────────────────────────────────────────────

  async getSettings(scope: string): Promise<unknown> {
    return await invoke('vault_get_settings', { scope });
  }

  async setSettings(scope: string, value: unknown): Promise<void> {
    await invoke('vault_set_settings', { scope, value });
  }

  // ── History ────────────────────────────────────────────────────────────────

  async getHistory(fileId: string): Promise<HistoryEntry[]> {
    return await invoke('vault_get_history', { file_id: fileId });
  }

  async saveVersion(fileId: string): Promise<HistoryEntry> {
    return await invoke('vault_save_version', { file_id: fileId });
  }

  async revertFile(fileId: string, versionId: string): Promise<FileEntry> {
    return await invoke('vault_revert_file', { file_id: fileId, version_id: versionId });
  }

  async getHistoryConfig(): Promise<HistoryConfig> {
    return await invoke('vault_get_history_config');
  }

  async setHistoryConfig(config: HistoryConfig): Promise<void> {
    await invoke('vault_set_history_config', { config });
  }
}

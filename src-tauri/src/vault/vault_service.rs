use crate::vault::compression::{algorithm_for, compress, decompress};
use crate::vault::crypto::{decrypt, derive_key, encrypt, generate_salt};
use crate::vault::errors::VaultError;
use crate::vault::history::HistoryStore;
use crate::vault::index::IndexStore;
use crate::vault::search::{extract_text, SearchStore};
use crate::vault::settings::SettingsStore;
use crate::vault::types::{
    ChangeType, Cipher, FileEntry, FileEntrySnapshot, HistoryConfig, HistoryEntry, Manifest,
    MasterKey, OpenedVault, VaultHandle,
};

use serde_json::Value;
use sha2::{Digest, Sha256};
use std::collections::HashMap;
use std::fs;
use std::path::Path;
use std::sync::Mutex;
use time::OffsetDateTime;
use uuid::Uuid;

pub struct VaultService {
    schema_version: u32,
    opened: Mutex<Option<OpenedVault>>,
}

impl VaultService {
    pub fn new(schema_version: u32) -> Self {
        Self {
            schema_version,
            opened: Mutex::new(None),
        }
    }

    // ── Lifecycle ────────────────────────────────────────────────────────────

    /// Creates a new encrypted vault directory at `path`.
    pub fn create_vault(
        &self,
        path: impl AsRef<Path>,
        passphrase: &str,
        cipher: Cipher,
    ) -> Result<VaultHandle, VaultError> {
        let path = path.as_ref().to_path_buf();

        if path.exists() {
            return Err(VaultError::InvalidPath(
                "a vault already exists at this path".into(),
            ));
        }

        fs::create_dir_all(&path)?;
        fs::create_dir_all(path.join("objects"))?;
        fs::create_dir_all(path.join("settings/apps"))?;
        fs::create_dir_all(path.join("history"))?;
        fs::create_dir_all(path.join("snapshots"))?;

        let salt = generate_salt();
        let manifest = Manifest::new(self.schema_version, cipher, salt.clone());
        fs::write(
            path.join("manifest.json"),
            serde_json::to_vec_pretty(&manifest)?,
        )?;

        let raw_key = derive_key(
            passphrase,
            &salt,
            manifest.kdf_memory_kb,
            manifest.kdf_iterations,
            manifest.kdf_parallelism,
        )?;

        // Write empty index and search store so the vault is valid on first open.
        IndexStore::save(&path, cipher, &raw_key, &[])?;
        SearchStore::save(&path, cipher, &raw_key, &HashMap::new())?;

        let handle = VaultHandle {
            path: path.clone(),
            cipher,
        };

        *self.opened.lock().unwrap_or_else(|e| e.into_inner()) = Some(OpenedVault {
            path,
            cipher,
            key: MasterKey(raw_key),
        });

        Ok(handle)
    }

    /// Opens an existing vault and verifies the passphrase.
    pub fn open_vault(
        &self,
        path: impl AsRef<Path>,
        passphrase: &str,
    ) -> Result<VaultHandle, VaultError> {
        let path = path.as_ref().to_path_buf();

        if !path.exists() {
            return Err(VaultError::InvalidPath("vault does not exist".into()));
        }

        let manifest_bytes = fs::read(path.join("manifest.json"))?;
        let manifest: Manifest = serde_json::from_slice(&manifest_bytes)
            .map_err(|_| VaultError::InvalidFormat("cannot parse manifest.json".into()))?;

        let raw_key = derive_key(
            passphrase,
            &manifest.kdf_salt,
            manifest.kdf_memory_kb,
            manifest.kdf_iterations,
            manifest.kdf_parallelism,
        )?;

        // Decrypting the index is the passphrase verification step.
        // If the key is wrong the AEAD tag will not authenticate and
        // VaultError::WrongPassphrase is returned.
        IndexStore::load(&path, manifest.cipher, &raw_key)?;

        let handle = VaultHandle {
            path: path.clone(),
            cipher: manifest.cipher,
        };

        *self.opened.lock().unwrap_or_else(|e| e.into_inner()) = Some(OpenedVault {
            path,
            cipher: manifest.cipher,
            key: MasterKey(raw_key),
        });

        Ok(handle)
    }

    /// Closes the active vault, zeroing the master key in memory.
    pub fn close_vault(&self) -> Result<(), VaultError> {
        // MasterKey is ZeroizeOnDrop — key bytes are wiped when the Option is set to None.
        *self.opened.lock().unwrap_or_else(|e| e.into_inner()) = None;
        Ok(())
    }

    // ── Files ────────────────────────────────────────────────────────────────

    /// Stores a new file in the vault and returns its metadata entry.
    pub fn create_file(
        &self,
        name: &str,
        mime: &str,
        app_ids: Vec<String>,
        data: &[u8],
    ) -> Result<FileEntry, VaultError> {
        self.with_vault(|v| {
            let id = Uuid::new_v4().to_string();

            let compression = algorithm_for(mime);
            let payload = match compression {
                Some(algo) => compress(algo, data)?,
                None => data.to_vec(),
            };

            let encrypted = encrypt(v.cipher, &v.key.0, &payload)?;
            fs::write(
                v.path.join("objects").join(format!("{}.enc", id)),
                encrypted,
            )?;

            let entry = FileEntry {
                id: id.clone(),
                name: name.to_string(),
                mime: mime.to_string(),
                app_ids,
                size: data.len() as u64,
                integrity_hash: sha256_hex(data),
                compression,
                created_at: OffsetDateTime::now_utc(),
                updated_at: OffsetDateTime::now_utc(),
            };

            let mut index = IndexStore::load(&v.path, v.cipher, &v.key.0)?;
            index.push(entry.clone());
            IndexStore::save(&v.path, v.cipher, &v.key.0, &index)?;

            if let Some(text) = extract_text(mime, data) {
                let mut search = SearchStore::load(&v.path, v.cipher, &v.key.0)?;
                search.insert(id, text);
                SearchStore::save(&v.path, v.cipher, &v.key.0, &search)?;
            }

            Ok(entry)
        })
    }

    /// Decrypts and returns the raw bytes of a file.
    pub fn read_file(&self, id: &str) -> Result<Vec<u8>, VaultError> {
        self.with_vault(|v| {
            let path = v.path.join("objects").join(format!("{}.enc", id));
            if !path.exists() {
                return Err(VaultError::FileNotFound(id.to_string()));
            }

            let index = IndexStore::load(&v.path, v.cipher, &v.key.0)?;
            let entry = index
                .iter()
                .find(|e| e.id == id)
                .ok_or_else(|| VaultError::FileNotFound(id.to_string()))?;
            let compression = entry.compression;

            let data = fs::read(&path)?;
            let decrypted = decrypt(v.cipher, &v.key.0, &data)?;

            match compression {
                Some(algo) => decompress(algo, &decrypted),
                None => Ok(decrypted),
            }
        })
    }

    /// Replaces the contents of an existing file and updates its metadata.
    /// Automatically creates a history snapshot based on the vault's tracking mode.
    pub fn update_file(&self, id: &str, data: &[u8]) -> Result<FileEntry, VaultError> {
        self.with_vault(|v| {
            let obj_path = v.path.join("objects").join(format!("{}.enc", id));
            if !obj_path.exists() {
                return Err(VaultError::FileNotFound(id.to_string()));
            }

            let mut index = IndexStore::load(&v.path, v.cipher, &v.key.0)?;
            let entry = index
                .iter_mut()
                .find(|e| e.id == id)
                .ok_or_else(|| VaultError::FileNotFound(id.to_string()))?;

            // History: snapshot the current state before overwriting.
            let config = HistoryStore::load_config(&v.path, v.cipher, &v.key.0)?;
            if HistoryStore::should_snapshot(&v.path, v.cipher, &v.key.0, id, &config.tracking)? {
                HistoryStore::record_change(
                    &v.path,
                    v.cipher,
                    &v.key.0,
                    id,
                    ChangeType::ContentUpdated,
                    FileEntrySnapshot::from(&*entry),
                    &config.retention,
                )?;
            }

            let compression = algorithm_for(&entry.mime);
            let payload = match compression {
                Some(algo) => compress(algo, data)?,
                None => data.to_vec(),
            };

            let encrypted = encrypt(v.cipher, &v.key.0, &payload)?;
            fs::write(&obj_path, encrypted)?;

            entry.size = data.len() as u64;
            entry.integrity_hash = sha256_hex(data);
            entry.compression = compression;
            entry.updated_at = OffsetDateTime::now_utc();
            let updated = entry.clone();

            IndexStore::save(&v.path, v.cipher, &v.key.0, &index)?;

            let mut search = SearchStore::load(&v.path, v.cipher, &v.key.0)?;
            match extract_text(&updated.mime, data) {
                Some(text) => {
                    search.insert(id.to_string(), text);
                }
                None => {
                    search.remove(id);
                }
            }
            SearchStore::save(&v.path, v.cipher, &v.key.0, &search)?;

            Ok(updated)
        })
    }

    /// Updates only the metadata (name, mime, app_ids) of a file without
    /// touching its content. Creates a history snapshot based on the tracking mode.
    pub fn update_file_metadata(
        &self,
        id: &str,
        name: String,
        mime: String,
        app_ids: Vec<String>,
    ) -> Result<FileEntry, VaultError> {
        self.with_vault(|v| {
            let mut index = IndexStore::load(&v.path, v.cipher, &v.key.0)?;
            let entry = index
                .iter_mut()
                .find(|e| e.id == id)
                .ok_or_else(|| VaultError::FileNotFound(id.to_string()))?;

            let config = HistoryStore::load_config(&v.path, v.cipher, &v.key.0)?;
            if HistoryStore::should_snapshot(&v.path, v.cipher, &v.key.0, id, &config.tracking)? {
                HistoryStore::record_change(
                    &v.path,
                    v.cipher,
                    &v.key.0,
                    id,
                    ChangeType::MetadataUpdated,
                    FileEntrySnapshot::from(&*entry),
                    &config.retention,
                )?;
            }

            entry.name = name;
            entry.mime = mime;
            entry.app_ids = app_ids;
            entry.updated_at = OffsetDateTime::now_utc();
            let updated = entry.clone();

            IndexStore::save(&v.path, v.cipher, &v.key.0, &index)?;
            Ok(updated)
        })
    }

    /// Permanently removes a file, its search index entry, and all history/snapshots.
    pub fn delete_file(&self, id: &str) -> Result<(), VaultError> {
        self.with_vault(|v| {
            let obj_path = v.path.join("objects").join(format!("{}.enc", id));
            if obj_path.exists() {
                fs::remove_file(&obj_path)?;
            }

            let mut index = IndexStore::load(&v.path, v.cipher, &v.key.0)?;
            index.retain(|e| e.id != id);
            IndexStore::save(&v.path, v.cipher, &v.key.0, &index)?;

            let mut search = SearchStore::load(&v.path, v.cipher, &v.key.0)?;
            search.remove(id);
            SearchStore::save(&v.path, v.cipher, &v.key.0, &search)?;

            HistoryStore::delete_all(&v.path, id)?;

            Ok(())
        })
    }

    /// Returns metadata for all files in the vault.
    pub fn list_files(&self) -> Result<Vec<FileEntry>, VaultError> {
        self.with_vault(|v| IndexStore::load(&v.path, v.cipher, &v.key.0))
    }

    /// Returns metadata for files whose extracted text matches `query`
    /// (case-insensitive substring match).
    pub fn search_files(&self, query: &str) -> Result<Vec<FileEntry>, VaultError> {
        self.with_vault(|v| {
            let search = SearchStore::load(&v.path, v.cipher, &v.key.0)?;
            let matching_ids = SearchStore::query(&search, query);
            let index = IndexStore::load(&v.path, v.cipher, &v.key.0)?;
            Ok(index
                .into_iter()
                .filter(|e| matching_ids.contains(&e.id))
                .collect())
        })
    }

    // ── Settings ─────────────────────────────────────────────────────────────

    /// Reads settings for the given scope.
    /// Use `"global"` for vault-wide settings or an app ID for per-app settings.
    pub fn get_settings(&self, scope: &str) -> Result<Value, VaultError> {
        self.with_vault(|v| {
            if scope == "global" {
                SettingsStore::load_global(&v.path, v.cipher, &v.key.0)
            } else {
                SettingsStore::load_app(&v.path, v.cipher, &v.key.0, scope)
            }
        })
    }

    /// Writes settings for the given scope, replacing the previous value.
    pub fn set_settings(&self, scope: &str, value: Value) -> Result<(), VaultError> {
        self.with_vault(|v| {
            if scope == "global" {
                SettingsStore::save_global(&v.path, v.cipher, &v.key.0, value)
            } else {
                SettingsStore::save_app(&v.path, v.cipher, &v.key.0, scope, value)
            }
        })
    }

    // ── History ──────────────────────────────────────────────────────────────

    /// Returns the change history for a file, ordered oldest to newest.
    pub fn get_history(&self, file_id: &str) -> Result<Vec<HistoryEntry>, VaultError> {
        self.with_vault(|v| HistoryStore::load(&v.path, v.cipher, &v.key.0, file_id))
    }

    /// Manually creates a version snapshot of the current file state.
    /// Use this when the tracking mode is `Manual`.
    pub fn save_version(&self, file_id: &str) -> Result<HistoryEntry, VaultError> {
        self.with_vault(|v| {
            let index = IndexStore::load(&v.path, v.cipher, &v.key.0)?;
            let entry = index
                .iter()
                .find(|e| e.id == file_id)
                .ok_or_else(|| VaultError::FileNotFound(file_id.to_string()))?;

            let config = HistoryStore::load_config(&v.path, v.cipher, &v.key.0)?;

            HistoryStore::record_change(
                &v.path,
                v.cipher,
                &v.key.0,
                file_id,
                ChangeType::ContentUpdated,
                FileEntrySnapshot::from(entry),
                &config.retention,
            )
        })
    }

    /// Destructively reverts a file to a previous version.
    /// The current state is snapshotted before reverting so it appears in history.
    pub fn revert_file(&self, file_id: &str, version_id: &str) -> Result<FileEntry, VaultError> {
        self.with_vault(|v| {
            let mut index = IndexStore::load(&v.path, v.cipher, &v.key.0)?;
            let current = index
                .iter()
                .find(|e| e.id == file_id)
                .ok_or_else(|| VaultError::FileNotFound(file_id.to_string()))?;

            let history = HistoryStore::load(&v.path, v.cipher, &v.key.0, file_id)?;
            let target = history
                .iter()
                .find(|h| h.version_id == version_id)
                .ok_or_else(|| VaultError::VersionNotFound(version_id.to_string()))?;

            let config = HistoryStore::load_config(&v.path, v.cipher, &v.key.0)?;

            // Snapshot the current state before reverting.
            HistoryStore::record_change(
                &v.path,
                v.cipher,
                &v.key.0,
                file_id,
                ChangeType::Reverted {
                    to_version: version_id.to_string(),
                },
                FileEntrySnapshot::from(current),
                &config.retention,
            )?;

            // Restore the content snapshot (file copy, no decrypt/re-encrypt).
            HistoryStore::restore_content_snapshot(&v.path, file_id, version_id)?;

            // Restore the metadata from the history entry.
            let target_meta = &target.metadata;
            let entry = index.iter_mut().find(|e| e.id == file_id).unwrap();

            entry.name = target_meta.name.clone();
            entry.mime = target_meta.mime.clone();
            entry.app_ids = target_meta.app_ids.clone();
            entry.size = target_meta.size;
            entry.integrity_hash = target_meta.integrity_hash.clone();
            entry.compression = target_meta.compression;
            entry.updated_at = OffsetDateTime::now_utc();
            let reverted = entry.clone();

            IndexStore::save(&v.path, v.cipher, &v.key.0, &index)?;
            Ok(reverted)
        })
    }

    /// Returns the vault's history configuration.
    pub fn get_history_config(&self) -> Result<HistoryConfig, VaultError> {
        self.with_vault(|v| HistoryStore::load_config(&v.path, v.cipher, &v.key.0))
    }

    /// Replaces the vault's history configuration.
    pub fn set_history_config(&self, config: HistoryConfig) -> Result<(), VaultError> {
        self.with_vault(|v| HistoryStore::save_config(&v.path, v.cipher, &v.key.0, &config))
    }

    // ── Internal ─────────────────────────────────────────────────────────────

    /// Locks the opened vault and runs `f` with a reference to it.
    /// Returns `VaultError::NotOpen` if no vault is currently open.
    fn with_vault<T>(
        &self,
        f: impl FnOnce(&OpenedVault) -> Result<T, VaultError>,
    ) -> Result<T, VaultError> {
        let guard = self.opened.lock().unwrap_or_else(|e| e.into_inner());
        match guard.as_ref() {
            Some(v) => f(v),
            None => Err(VaultError::NotOpen),
        }
    }
}

fn sha256_hex(data: &[u8]) -> String {
    hex::encode(Sha256::digest(data))
}

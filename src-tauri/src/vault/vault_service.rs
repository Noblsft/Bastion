use crate::vault::compression::{algorithm_for, compress, decompress};
use crate::vault::crypto::{decrypt, derive_key, encrypt, generate_salt};
use crate::vault::errors::VaultError;
use crate::vault::index::IndexStore;
use crate::vault::search::{extract_text, SearchStore};
use crate::vault::settings::SettingsStore;
use crate::vault::types::{Cipher, FileEntry, Manifest, MasterKey, OpenedVault, VaultHandle};

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

    /// Permanently removes a file and its search index entry.
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

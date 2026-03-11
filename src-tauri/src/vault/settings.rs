use crate::vault::crypto::{decrypt, encrypt};
use crate::vault::errors::VaultError;
use crate::vault::types::Cipher;

use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::fs;
use std::path::Path;

#[derive(Serialize, Deserialize)]
struct SettingsFile {
    schema_version: u32,
    data: Value,
}

/// Manages encrypted settings files.
///
/// Scopes:
/// - `"global"` → `settings/global.enc`
/// - any other string (app ID) → `settings/apps/<id>.enc`
pub struct SettingsStore;

impl SettingsStore {
    pub fn load_global(
        vault_path: &Path,
        cipher: Cipher,
        key: &[u8; 32],
    ) -> Result<Value, VaultError> {
        Self::load(vault_path, cipher, key, "settings/global.enc")
    }

    pub fn save_global(
        vault_path: &Path,
        cipher: Cipher,
        key: &[u8; 32],
        value: Value,
    ) -> Result<(), VaultError> {
        Self::save(vault_path, cipher, key, "settings/global.enc", value)
    }

    pub fn load_app(
        vault_path: &Path,
        cipher: Cipher,
        key: &[u8; 32],
        app_id: &str,
    ) -> Result<Value, VaultError> {
        Self::load(
            vault_path,
            cipher,
            key,
            &format!("settings/apps/{}.enc", app_id),
        )
    }

    pub fn save_app(
        vault_path: &Path,
        cipher: Cipher,
        key: &[u8; 32],
        app_id: &str,
        value: Value,
    ) -> Result<(), VaultError> {
        Self::save(
            vault_path,
            cipher,
            key,
            &format!("settings/apps/{}.enc", app_id),
            value,
        )
    }

    fn load(
        vault_path: &Path,
        cipher: Cipher,
        key: &[u8; 32],
        rel_path: &str,
    ) -> Result<Value, VaultError> {
        let full_path = vault_path.join(rel_path);
        if !full_path.exists() {
            return Ok(Value::Object(Default::default()));
        }
        let data = fs::read(&full_path)?;
        let plaintext = decrypt(cipher, key, &data)?;
        let file: SettingsFile = serde_json::from_slice(&plaintext)?;
        Ok(file.data)
    }

    fn save(
        vault_path: &Path,
        cipher: Cipher,
        key: &[u8; 32],
        rel_path: &str,
        value: Value,
    ) -> Result<(), VaultError> {
        let full_path = vault_path.join(rel_path);
        if let Some(parent) = full_path.parent() {
            fs::create_dir_all(parent)?;
        }
        let file = SettingsFile {
            schema_version: 1,
            data: value,
        };
        let plaintext = serde_json::to_vec(&file)?;
        let encrypted = encrypt(cipher, key, &plaintext)?;
        fs::write(&full_path, encrypted)?;
        Ok(())
    }
}

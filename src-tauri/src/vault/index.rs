use crate::vault::crypto::{decrypt, encrypt};
use crate::vault::errors::VaultError;
use crate::vault::types::{Cipher, FileEntry};

use std::fs;
use std::path::Path;

const INDEX_FILE: &str = "index.enc";

/// Manages the encrypted file metadata index.
pub struct IndexStore;

impl IndexStore {
    /// Loads and decrypts the index from disk.
    /// Returns an empty list if the index file does not yet exist.
    pub fn load(
        vault_path: &Path,
        cipher: Cipher,
        key: &[u8; 32],
    ) -> Result<Vec<FileEntry>, VaultError> {
        let path = vault_path.join(INDEX_FILE);
        if !path.exists() {
            return Ok(Vec::new());
        }
        let data = fs::read(&path)?;
        let plaintext = decrypt(cipher, key, &data)?;
        Ok(serde_json::from_slice(&plaintext)?)
    }

    /// Encrypts and writes the index to disk.
    pub fn save(
        vault_path: &Path,
        cipher: Cipher,
        key: &[u8; 32],
        entries: &[FileEntry],
    ) -> Result<(), VaultError> {
        let plaintext = serde_json::to_vec(entries)?;
        let data = encrypt(cipher, key, &plaintext)?;
        fs::write(vault_path.join(INDEX_FILE), data)?;
        Ok(())
    }
}

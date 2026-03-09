use crate::vault::crypto::{decrypt, encrypt};
use crate::vault::errors::VaultError;
use crate::vault::types::Cipher;

use std::collections::{HashMap, HashSet};
use std::fs;
use std::path::Path;

const SEARCH_FILE: &str = "search.enc";

/// Manages the encrypted full-text search index.
///
/// Structure on disk: `{ "<uuid>": "<extracted text>", ... }`
///
/// Text extraction is MIME-type-gated. Unsupported types (images, PDFs, etc.)
/// are indexed by name only, via the caller's responsibility.
pub struct SearchStore;

impl SearchStore {
    /// Loads and decrypts the search index from disk.
    /// Returns an empty map if the file does not yet exist.
    pub fn load(
        vault_path: &Path,
        cipher: Cipher,
        key: &[u8; 32],
    ) -> Result<HashMap<String, String>, VaultError> {
        let path = vault_path.join(SEARCH_FILE);
        if !path.exists() {
            return Ok(HashMap::new());
        }
        let data = fs::read(&path)?;
        let plaintext = decrypt(cipher, key, &data)?;
        Ok(serde_json::from_slice(&plaintext)?)
    }

    /// Encrypts and writes the search index to disk.
    pub fn save(
        vault_path: &Path,
        cipher: Cipher,
        key: &[u8; 32],
        index: &HashMap<String, String>,
    ) -> Result<(), VaultError> {
        let plaintext = serde_json::to_vec(index)?;
        let data = encrypt(cipher, key, &plaintext)?;
        fs::write(vault_path.join(SEARCH_FILE), data)?;
        Ok(())
    }

    /// Returns the IDs of files whose extracted text contains `query`
    /// (case-insensitive substring match).
    pub fn query(index: &HashMap<String, String>, query: &str) -> HashSet<String> {
        let q = query.to_lowercase();
        index
            .iter()
            .filter(|(_, text)| text.to_lowercase().contains(&q))
            .map(|(id, _)| id.clone())
            .collect()
    }
}

/// Attempts to extract indexable text from file bytes given a MIME type.
/// Returns `None` for unsupported types — the file will still be stored,
/// just not full-text searchable.
pub fn extract_text(mime: &str, data: &[u8]) -> Option<String> {
    match mime {
        "text/plain" | "text/markdown" | "text/csv" | "text/html" => {
            String::from_utf8(data.to_vec()).ok()
        }
        _ => None,
    }
}

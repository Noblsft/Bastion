use crate::state::AppState;
use crate::vault::errors::VaultError;
use crate::vault::types::{Cipher, FileEntry, VaultHandle};

use serde_json::Value;
use tauri::State;

// ── Lifecycle ────────────────────────────────────────────────────────────────

/// Creates a new encrypted vault directory at `path`.
///
/// Initialises the directory structure, derives the master key from `passphrase`
/// using Argon2id, and writes an empty index and search store. The vault is
/// left open after creation — no second call to `open_vault` is needed.
///
/// # Errors
/// - `InvalidPath` if a vault already exists at `path`.
/// - `Crypto` if key derivation fails.
/// - `Io` / `Json` on filesystem or serialisation failures.
#[tauri::command]
pub fn create_vault(
    state: State<AppState>,
    path: String,
    passphrase: String,
    cipher: Cipher,
) -> Result<VaultHandle, VaultError> {
    state.vault.create_vault(&path, &passphrase, cipher)
}

/// Opens an existing vault and verifies the passphrase.
///
/// Reads `manifest.json` to obtain the KDF parameters and cipher, derives the
/// master key, then authenticates it by decrypting the index. If the passphrase
/// is wrong or the vault is corrupted the AEAD tag will not verify and
/// `WrongPassphrase` is returned.
///
/// # Errors
/// - `InvalidPath` if `path` does not exist.
/// - `InvalidFormat` if `manifest.json` cannot be parsed.
/// - `WrongPassphrase` if the passphrase is incorrect or the vault is corrupted.
/// - `Crypto` if key derivation fails.
#[tauri::command]
pub fn open_vault(
    state: State<AppState>,
    path: String,
    passphrase: String,
) -> Result<VaultHandle, VaultError> {
    state.vault.open_vault(&path, &passphrase)
}

/// Closes the active vault and zeroes the master key from memory.
///
/// Safe to call even if no vault is currently open — returns `Ok(())` in that case.
#[tauri::command]
pub fn close_vault(state: State<AppState>) -> Result<(), VaultError> {
    state.vault.close_vault()
}

// ── Files ────────────────────────────────────────────────────────────────────

/// Encrypts `data` and stores it as a new file in the vault.
///
/// Assigns a fresh UUID, writes the encrypted object to `objects/<uuid>.enc`,
/// appends the entry to the index, and — for supported MIME types — updates the
/// search index with extracted text.
///
/// `app_ids` is the list of apps that reference this file. A file can be shared
/// across multiple apps; pass an empty list if the file is app-agnostic.
///
/// Returns the complete `FileEntry` metadata on success.
///
/// # Errors
/// - `NotOpen` if no vault is currently open.
/// - `Io` / `Crypto` / `Json` on storage failures.
#[tauri::command]
pub fn vault_create_file(
    state: State<AppState>,
    name: String,
    mime: String,
    app_ids: Vec<String>,
    data: Vec<u8>,
) -> Result<FileEntry, VaultError> {
    state.vault.create_file(&name, &mime, app_ids, &data)
}

/// Decrypts and returns the raw bytes of the file identified by `id`.
///
/// # Errors
/// - `NotOpen` if no vault is currently open.
/// - `FileNotFound` if `id` does not correspond to any stored object.
/// - `WrongPassphrase` if the object data fails authentication (corruption).
#[tauri::command]
pub fn vault_read_file(state: State<AppState>, id: String) -> Result<Vec<u8>, VaultError> {
    state.vault.read_file(&id)
}

/// Replaces the content of an existing file and refreshes its metadata.
///
/// Overwrites `objects/<id>.enc` with newly encrypted `data`, then updates
/// `size`, `integrity_hash`, and `updated_at` in the index. The search index
/// is also refreshed: extracted text is updated for supported MIME types, or
/// removed if the type is no longer indexable.
///
/// Returns the updated `FileEntry` on success.
///
/// # Errors
/// - `NotOpen` if no vault is currently open.
/// - `FileNotFound` if `id` does not exist in the object store or index.
#[tauri::command]
pub fn vault_update_file(
    state: State<AppState>,
    id: String,
    data: Vec<u8>,
) -> Result<FileEntry, VaultError> {
    state.vault.update_file(&id, &data)
}

/// Permanently removes a file, its index entry, and its search index entry.
///
/// Silent no-op if the object file is already absent from disk; the index and
/// search entries are still cleaned up in that case.
///
/// # Errors
/// - `NotOpen` if no vault is currently open.
/// - `Io` on filesystem failures during removal.
#[tauri::command]
pub fn vault_delete_file(state: State<AppState>, id: String) -> Result<(), VaultError> {
    state.vault.delete_file(&id)
}

/// Returns the metadata for every file currently stored in the vault.
///
/// The returned list is ordered by insertion time (oldest first). File content
/// is not included — use `vault_read_file` to retrieve bytes for a specific entry.
///
/// # Errors
/// - `NotOpen` if no vault is currently open.
#[tauri::command]
pub fn vault_list_files(state: State<AppState>) -> Result<Vec<FileEntry>, VaultError> {
    state.vault.list_files()
}

/// Searches file content using a case-insensitive substring match against `query`.
///
/// Only files whose MIME type supports text extraction are full-text searchable.
/// Files with unsupported types (e.g. images, PDFs) will not appear in results
/// unless their content has been indexed by other means.
///
/// Returns matching `FileEntry` metadata — use `vault_read_file` to retrieve bytes.
///
/// # Errors
/// - `NotOpen` if no vault is currently open.
#[tauri::command]
pub fn vault_search_files(
    state: State<AppState>,
    query: String,
) -> Result<Vec<FileEntry>, VaultError> {
    state.vault.search_files(&query)
}

// ── Settings ─────────────────────────────────────────────────────────────────

/// Reads the settings for the given `scope`.
///
/// `scope` is either `"global"` for vault-wide settings, or an app ID (e.g.
/// `"sigil"`) to read that app's private settings. Returns an empty JSON object
/// if no settings have been saved for this scope yet.
///
/// # Errors
/// - `NotOpen` if no vault is currently open.
/// - `WrongPassphrase` if the settings file fails authentication (corruption).
#[tauri::command]
pub fn vault_get_settings(state: State<AppState>, scope: String) -> Result<Value, VaultError> {
    state.vault.get_settings(&scope)
}

/// Writes settings for the given `scope`, replacing the previous value entirely.
///
/// `scope` is either `"global"` for vault-wide settings, or an app ID (e.g.
/// `"sigil"`) for app-specific settings. `value` must be a valid JSON object.
/// The settings file is created if it does not yet exist.
///
/// # Errors
/// - `NotOpen` if no vault is currently open.
/// - `Io` / `Crypto` / `Json` on storage failures.
#[tauri::command]
pub fn vault_set_settings(
    state: State<AppState>,
    scope: String,
    value: Value,
) -> Result<(), VaultError> {
    state.vault.set_settings(&scope, value)
}

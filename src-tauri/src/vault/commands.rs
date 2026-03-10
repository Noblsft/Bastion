use crate::state::AppState;
use crate::vault::errors::VaultError;
use crate::vault::types::{Cipher, FileEntry, HistoryConfig, HistoryEntry, VaultHandle};

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
/// Before overwriting, a history snapshot of the current state is created
/// automatically based on the vault's tracking mode (`EveryUpdate`, `Interval`,
/// or `Manual`). In `Manual` mode no snapshot is created — call
/// `vault_save_version` beforehand if needed.
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

/// Updates only the metadata (name, mime, app_ids) of a file without touching
/// its content. A history snapshot is created based on the tracking mode.
///
/// Returns the updated `FileEntry` on success.
///
/// # Errors
/// - `NotOpen` if no vault is currently open.
/// - `FileNotFound` if `id` does not exist in the index.
#[tauri::command]
pub fn vault_update_file_metadata(
    state: State<AppState>,
    id: String,
    name: String,
    mime: String,
    app_ids: Vec<String>,
) -> Result<FileEntry, VaultError> {
    state.vault.update_file_metadata(&id, name, mime, app_ids)
}

/// Permanently removes a file, its index entry, search index entry, and all
/// history snapshots.
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

// ── History ─────────────────────────────────────────────────────────────────

/// Returns the change history for a specific file.
///
/// Each `HistoryEntry` includes a version ID, timestamp, the type of change
/// (content update, metadata update, or revert), and a snapshot of the file's
/// metadata at that point. Entries are ordered chronologically (oldest first).
///
/// A matching content snapshot exists at `snapshots/<file_id>/<version_id>.enc`
/// and can be restored via `vault_revert_file`.
///
/// # Errors
/// - `NotOpen` if no vault is currently open.
#[tauri::command]
pub fn vault_get_history(
    state: State<AppState>,
    file_id: String,
) -> Result<Vec<HistoryEntry>, VaultError> {
    state.vault.get_history(&file_id)
}

/// Manually creates a snapshot of the file's current state.
///
/// Useful when the vault's tracking mode is `Manual` — this command lets the
/// frontend trigger a save point on demand (e.g. via a "Save version" button).
/// In `EveryUpdate` or `Interval` modes this still works and adds an extra
/// snapshot outside the automatic schedule.
///
/// Returns the created `HistoryEntry`.
///
/// # Errors
/// - `NotOpen` if no vault is currently open.
/// - `FileNotFound` if `file_id` does not exist.
#[tauri::command]
pub fn vault_save_version(
    state: State<AppState>,
    file_id: String,
) -> Result<HistoryEntry, VaultError> {
    state.vault.save_version(&file_id)
}

/// Destructively reverts a file to a previous version.
///
/// Replaces the current encrypted object file with the snapshot identified by
/// `version_id`, updates the index metadata to match the snapshot, and appends
/// a `Reverted` history entry. The old content is **not** preserved unless a
/// snapshot was already taken (automatic or manual) before this call.
///
/// Returns the updated `FileEntry` reflecting the restored state.
///
/// # Errors
/// - `NotOpen` if no vault is currently open.
/// - `FileNotFound` if `file_id` does not exist.
/// - `VersionNotFound` if `version_id` does not correspond to a stored snapshot.
#[tauri::command]
pub fn vault_revert_file(
    state: State<AppState>,
    file_id: String,
    version_id: String,
) -> Result<FileEntry, VaultError> {
    state.vault.revert_file(&file_id, &version_id)
}

/// Returns the vault-wide history configuration.
///
/// The configuration controls two aspects:
/// - **Tracking mode**: when snapshots are created (`EveryUpdate`, `Interval`,
///   or `Manual`).
/// - **Retention policy**: how many snapshots are kept (`Forever` or
///   `KeepLast { max }`).
///
/// Returns the default configuration if none has been saved yet.
///
/// # Errors
/// - `NotOpen` if no vault is currently open.
#[tauri::command]
pub fn vault_get_history_config(state: State<AppState>) -> Result<HistoryConfig, VaultError> {
    state.vault.get_history_config()
}

/// Replaces the vault-wide history configuration.
///
/// Changes take effect immediately for subsequent file operations. Existing
/// snapshots are not retroactively pruned — the new retention policy applies
/// only when the next snapshot is recorded.
///
/// # Errors
/// - `NotOpen` if no vault is currently open.
/// - `Io` / `Crypto` / `Json` on storage failures.
#[tauri::command]
pub fn vault_set_history_config(
    state: State<AppState>,
    config: HistoryConfig,
) -> Result<(), VaultError> {
    state.vault.set_history_config(config)
}

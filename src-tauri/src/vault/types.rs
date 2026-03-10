use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use time::OffsetDateTime;
use zeroize::{Zeroize, ZeroizeOnDrop};

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum Cipher {
    Aes256Gcm,
    ChaCha20Poly1305,
}

/// Plaintext vault manifest stored at the vault root.
/// Contains only what is needed to derive the master key — nothing sensitive.
#[derive(Debug, Serialize, Deserialize)]
pub struct Manifest {
    pub format_version: u32,
    pub schema_version: u32,
    pub cipher: Cipher,
    /// Base64-encoded 32-byte Argon2id salt.
    pub kdf_salt: String,
    pub kdf_memory_kb: u32,
    pub kdf_iterations: u32,
    pub kdf_parallelism: u32,
    #[serde(with = "time::serde::rfc3339")]
    pub created_at: OffsetDateTime,
    #[serde(with = "time::serde::rfc3339")]
    pub updated_at: OffsetDateTime,
}

impl Manifest {
    pub fn new(schema_version: u32, cipher: Cipher, kdf_salt: String) -> Self {
        let now = OffsetDateTime::now_utc();
        Self {
            format_version: 1,
            schema_version,
            cipher,
            kdf_salt,
            // OWASP 2023 recommended Argon2id parameters
            kdf_memory_kb: 65536, // 64 MB
            kdf_iterations: 3,
            kdf_parallelism: 4,
            created_at: now,
            updated_at: now,
        }
    }
}

/// Compression algorithm applied to a file before encryption.
/// Stored in `FileEntry` so the correct decompressor is used on read.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum Compression {
    Zstd,
}

/// Metadata for a stored file.
/// Files are shared across apps — multiple apps can reference the same
/// underlying object via `app_ids`.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FileEntry {
    pub id: String,
    pub name: String,
    pub mime: String,
    /// Apps that reference this file.
    pub app_ids: Vec<String>,
    /// Original plaintext byte size, before compression.
    pub size: u64,
    /// SHA-256 hex of the original plaintext — used for integrity verification.
    pub integrity_hash: String,
    /// Compression applied before encryption, if any.
    /// `None` means the bytes were stored as-is.
    #[serde(default)]
    pub compression: Option<Compression>,
    #[serde(with = "time::serde::rfc3339")]
    pub created_at: OffsetDateTime,
    #[serde(with = "time::serde::rfc3339")]
    pub updated_at: OffsetDateTime,
}

// ── History ──────────────────────────────────────────────────────────────────

/// Controls when a history snapshot is created automatically.
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
#[serde(rename_all = "snake_case", tag = "mode")]
pub enum TrackingMode {
    /// Snapshot before every `update_file` / `update_file_metadata` call.
    #[default]
    EveryUpdate,
    /// Snapshot only if at least `seconds` have elapsed since the last snapshot.
    Interval { seconds: u64 },
    /// Never snapshot automatically — the frontend must call `save_version` explicitly.
    Manual,
}

/// Controls how many snapshots are retained per file.
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
#[serde(rename_all = "snake_case", tag = "policy")]
pub enum RetentionPolicy {
    /// Keep every snapshot forever.
    #[default]
    Forever,
    /// Keep only the most recent `max` snapshots; older ones are deleted.
    KeepLast { max: u32 },
}

/// Vault-wide history configuration.
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct HistoryConfig {
    #[serde(default)]
    pub tracking: TrackingMode,
    #[serde(default)]
    pub retention: RetentionPolicy,
}

/// Describes what kind of change produced a history entry.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case", tag = "kind")]
pub enum ChangeType {
    /// File content was replaced.
    ContentUpdated,
    /// Only metadata (name, mime, app_ids) changed — content unchanged.
    MetadataUpdated,
    /// The file was reverted to a previous version.
    Reverted { to_version: String },
}

/// A point-in-time snapshot of a `FileEntry`'s mutable fields.
/// Excludes `id` and `created_at` which never change.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FileEntrySnapshot {
    pub name: String,
    pub mime: String,
    pub app_ids: Vec<String>,
    pub size: u64,
    pub integrity_hash: String,
    pub compression: Option<Compression>,
}

impl From<&FileEntry> for FileEntrySnapshot {
    fn from(e: &FileEntry) -> Self {
        Self {
            name: e.name.clone(),
            mime: e.mime.clone(),
            app_ids: e.app_ids.clone(),
            size: e.size,
            integrity_hash: e.integrity_hash.clone(),
            compression: e.compression,
        }
    }
}

/// A single entry in a file's change history.
/// The `metadata` field captures the file's state **before** the change was applied,
/// and a matching content snapshot exists at `snapshots/<file_id>/<version_id>.enc`.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HistoryEntry {
    pub version_id: String,
    #[serde(with = "time::serde::rfc3339")]
    pub timestamp: OffsetDateTime,
    pub change_type: ChangeType,
    pub metadata: FileEntrySnapshot,
}

/// Sent to the Tauri frontend after a vault is opened.
/// Never contains key material.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VaultHandle {
    pub path: PathBuf,
    pub cipher: Cipher,
}

/// 256-bit master key. Zeroed in memory on drop.
#[derive(Zeroize, ZeroizeOnDrop)]
pub struct MasterKey(pub [u8; 32]);

impl std::fmt::Debug for MasterKey {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.write_str("MasterKey([REDACTED])")
    }
}

/// Full internal vault state held inside `VaultService`.
/// Never crosses the Tauri command boundary.
pub struct OpenedVault {
    pub path: PathBuf,
    pub cipher: Cipher,
    pub key: MasterKey,
}

impl std::fmt::Debug for OpenedVault {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.debug_struct("OpenedVault")
            .field("path", &self.path)
            .field("cipher", &self.cipher)
            .field("key", &"[REDACTED]")
            .finish()
    }
}

use crate::vault::crypto::{decrypt, encrypt};
use crate::vault::errors::VaultError;
use crate::vault::types::{
    ChangeType, Cipher, FileEntrySnapshot, HistoryConfig, HistoryEntry, RetentionPolicy,
    TrackingMode,
};

use std::fs;
use std::path::Path;
use time::OffsetDateTime;
use uuid::Uuid;

/// Manages encrypted per-file history and content snapshots.
///
/// History entries are stored at `history/<file_id>.enc` (encrypted JSON array).
/// Content snapshots are stored at `snapshots/<file_id>/<version_id>.enc` —
/// these are direct copies of the encrypted object file, so creating a snapshot
/// requires no decrypt/re-encrypt cycle.
pub struct HistoryStore;

impl HistoryStore {
    // ── Config ───────────────────────────────────────────────────────────────

    pub fn load_config(
        vault_path: &Path,
        cipher: Cipher,
        key: &[u8; 32],
    ) -> Result<HistoryConfig, VaultError> {
        let path = vault_path.join("history/config.enc");
        if !path.exists() {
            return Ok(HistoryConfig::default());
        }
        let data = fs::read(&path)?;
        let plaintext = decrypt(cipher, key, &data)?;
        Ok(serde_json::from_slice(&plaintext)?)
    }

    pub fn save_config(
        vault_path: &Path,
        cipher: Cipher,
        key: &[u8; 32],
        config: &HistoryConfig,
    ) -> Result<(), VaultError> {
        fs::create_dir_all(vault_path.join("history"))?;
        let plaintext = serde_json::to_vec(config)?;
        let data = encrypt(cipher, key, &plaintext)?;
        fs::write(vault_path.join("history/config.enc"), data)?;
        Ok(())
    }

    // ── Per-file history ─────────────────────────────────────────────────────

    pub fn load(
        vault_path: &Path,
        cipher: Cipher,
        key: &[u8; 32],
        file_id: &str,
    ) -> Result<Vec<HistoryEntry>, VaultError> {
        let path = vault_path.join("history").join(format!("{}.enc", file_id));
        if !path.exists() {
            return Ok(Vec::new());
        }
        let data = fs::read(&path)?;
        let plaintext = decrypt(cipher, key, &data)?;
        Ok(serde_json::from_slice(&plaintext)?)
    }

    fn save(
        vault_path: &Path,
        cipher: Cipher,
        key: &[u8; 32],
        file_id: &str,
        entries: &[HistoryEntry],
    ) -> Result<(), VaultError> {
        fs::create_dir_all(vault_path.join("history"))?;
        let plaintext = serde_json::to_vec(entries)?;
        let data = encrypt(cipher, key, &plaintext)?;
        fs::write(
            vault_path.join("history").join(format!("{}.enc", file_id)),
            data,
        )?;
        Ok(())
    }

    // ── Snapshots ────────────────────────────────────────────────────────────

    /// Copies the current encrypted object file into the snapshots directory.
    /// This is a plain file copy — no cryptographic work needed.
    fn save_content_snapshot(
        vault_path: &Path,
        file_id: &str,
        version_id: &str,
    ) -> Result<(), VaultError> {
        let src = vault_path.join("objects").join(format!("{}.enc", file_id));
        let dest_dir = vault_path.join("snapshots").join(file_id);
        fs::create_dir_all(&dest_dir)?;
        fs::copy(src, dest_dir.join(format!("{}.enc", version_id)))?;
        Ok(())
    }

    /// Restores a content snapshot as the current object file.
    /// Plain file copy — no cryptographic work needed.
    pub fn restore_content_snapshot(
        vault_path: &Path,
        file_id: &str,
        version_id: &str,
    ) -> Result<(), VaultError> {
        let src = vault_path
            .join("snapshots")
            .join(file_id)
            .join(format!("{}.enc", version_id));
        if !src.exists() {
            return Err(VaultError::VersionNotFound(version_id.to_string()));
        }
        let dest = vault_path.join("objects").join(format!("{}.enc", file_id));
        fs::copy(src, dest)?;
        Ok(())
    }

    fn delete_content_snapshot(
        vault_path: &Path,
        file_id: &str,
        version_id: &str,
    ) -> Result<(), VaultError> {
        let path = vault_path
            .join("snapshots")
            .join(file_id)
            .join(format!("{}.enc", version_id));
        if path.exists() {
            fs::remove_file(path)?;
        }
        Ok(())
    }

    /// Removes all history entries and content snapshots for a file.
    pub fn delete_all(vault_path: &Path, file_id: &str) -> Result<(), VaultError> {
        let history_file = vault_path.join("history").join(format!("{}.enc", file_id));
        if history_file.exists() {
            fs::remove_file(history_file)?;
        }
        let snapshots_dir = vault_path.join("snapshots").join(file_id);
        if snapshots_dir.exists() {
            fs::remove_dir_all(snapshots_dir)?;
        }
        Ok(())
    }

    // ── High-level operations ────────────────────────────────────────────────

    /// Determines whether a snapshot should be created based on the tracking mode.
    pub fn should_snapshot(
        vault_path: &Path,
        cipher: Cipher,
        key: &[u8; 32],
        file_id: &str,
        tracking: &TrackingMode,
    ) -> Result<bool, VaultError> {
        match tracking {
            TrackingMode::EveryUpdate => Ok(true),
            TrackingMode::Interval { seconds } => {
                let history = Self::load(vault_path, cipher, key, file_id)?;
                match history.last() {
                    Some(last) => {
                        let elapsed = (OffsetDateTime::now_utc() - last.timestamp).whole_seconds();
                        Ok(elapsed >= *seconds as i64)
                    }
                    None => Ok(true),
                }
            }
            TrackingMode::Manual => Ok(false),
        }
    }

    /// Snapshots the current file state and appends a history entry.
    /// Applies the retention policy afterwards.
    pub fn record_change(
        vault_path: &Path,
        cipher: Cipher,
        key: &[u8; 32],
        file_id: &str,
        change_type: ChangeType,
        metadata: FileEntrySnapshot,
        retention: &RetentionPolicy,
    ) -> Result<HistoryEntry, VaultError> {
        let version_id = Uuid::new_v4().to_string();

        Self::save_content_snapshot(vault_path, file_id, &version_id)?;

        let entry = HistoryEntry {
            version_id,
            timestamp: OffsetDateTime::now_utc(),
            change_type,
            metadata,
        };

        let mut history = Self::load(vault_path, cipher, key, file_id)?;
        history.push(entry.clone());
        Self::save(vault_path, cipher, key, file_id, &history)?;

        Self::apply_retention(vault_path, cipher, key, file_id, retention)?;

        Ok(entry)
    }

    /// Trims history to respect the retention policy, deleting excess snapshots.
    fn apply_retention(
        vault_path: &Path,
        cipher: Cipher,
        key: &[u8; 32],
        file_id: &str,
        policy: &RetentionPolicy,
    ) -> Result<(), VaultError> {
        let RetentionPolicy::KeepLast { max } = policy else {
            return Ok(());
        };

        let max = *max as usize;
        let mut entries = Self::load(vault_path, cipher, key, file_id)?;

        if entries.len() <= max {
            return Ok(());
        }

        let to_remove: Vec<_> = entries.drain(..entries.len() - max).collect();
        for removed in &to_remove {
            Self::delete_content_snapshot(vault_path, file_id, &removed.version_id)?;
        }
        Self::save(vault_path, cipher, key, file_id, &entries)?;

        Ok(())
    }
}

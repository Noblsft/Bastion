use crate::helpers::zip::extract_zip;
use crate::vault::errors::VaultError;
use crate::vault::types::{Manifest, VaultHandle};

use std::fs::{self, File};
use std::io::Write;
use std::path::{Path, PathBuf};
use std::sync::atomic::{AtomicU64, Ordering};
use std::sync::Mutex;

use zip::write::FileOptions;

pub struct VaultService {
    app_version: String,
    schema_version: u32,
    workspaces_root: PathBuf,
    opened_vault: Mutex<Option<VaultHandle>>,
}

impl VaultService {
    pub fn new(app_version: String, schema_version: u32, workspaces_root: PathBuf) -> Self {
        Self {
            app_version,
            schema_version,
            workspaces_root,
            opened_vault: Mutex::new(None),
        }
    }

    /// Creates an empty vault ZIP at `target`, replacing any existing file atomically.
    pub fn create_vault(&self, target: impl AsRef<Path>) -> Result<(), VaultError> {
        let target = target.as_ref().to_path_buf();
        let parent = target.parent().unwrap_or_else(|| Path::new("."));
        fs::create_dir_all(parent)?;

        let tmp = temp_path_next_to(&target)?;
        if tmp.exists() {
            fs::remove_file(&tmp)?;
        }

        let manifest = Manifest::new(&self.app_version, self.schema_version);
        let manifest_bytes = serde_json::to_vec_pretty(&manifest)?;

        {
            let f = File::create(&tmp)?;
            let mut zip = zip::ZipWriter::new(f);

            let opts: FileOptions<'_, zip::write::ExtendedFileOptions> = FileOptions::default()
                .compression_method(zip::CompressionMethod::Deflated)
                .unix_permissions(0o644);

            zip.add_directory("user-files/", opts.clone())?;
            zip.start_file("manifest.json", opts)?;
            zip.write_all(&manifest_bytes)?;
            zip.finish()?;
        }

        atomic_replace(&tmp, &target)?;
        Ok(())
    }

    /// Extracts the vault at `vault_path` into a new workspace and stores it as the active vault.
    pub fn load_vault(&self, vault_path: impl AsRef<Path>) -> Result<VaultHandle, VaultError> {
        let vault_path = vault_path.as_ref();

        if !vault_path.exists() {
            return Err(VaultError::InvalidPath("vault file does not exist".into()));
        }

        fs::create_dir_all(&self.workspaces_root)?;

        let workspace = self.workspaces_root.join(unique_workspace_id());
        fs::create_dir_all(&workspace)?;

        extract_zip(vault_path, &workspace)?;

        let manifest = workspace.join("manifest.json");
        if !manifest.exists() {
            return Err(VaultError::InvalidFormat("missing manifest.json".into()));
        }

        let objects_dir = workspace.join("user-files");
        if !objects_dir.exists() {
            fs::create_dir_all(&objects_dir)?;
        }

        let handle = VaultHandle {
            source: vault_path.to_path_buf(),
            workspace,
            manifest,
            objects_dir,
        };

        *self.opened_vault.lock().unwrap_or_else(|e| e.into_inner()) = Some(handle.clone());

        Ok(handle)
    }

    /// Removes the active vault's workspace directory and clears the opened state.
    /// Returns `Ok(())` if no vault is open (idempotent).
    pub fn close_vault(&self) -> Result<(), VaultError> {
        let maybe_handle = self
            .opened_vault
            .lock()
            .unwrap_or_else(|e| e.into_inner())
            .take();

        let Some(handle) = maybe_handle else {
            return Ok(());
        };

        let ws = &handle.workspace;

        if !ws.starts_with(&self.workspaces_root) {
            return Err(VaultError::InvalidPath(
                "workspace is outside the configured workspaces root".into(),
            ));
        }

        if ws.exists() {
            fs::remove_dir_all(ws)?;
        }

        Ok(())
    }
}

fn temp_path_next_to(path: &Path) -> Result<PathBuf, VaultError> {
    let parent = path.parent().unwrap_or_else(|| Path::new("."));
    let file_name = path
        .file_name()
        .ok_or_else(|| VaultError::InvalidPath("missing filename".into()))?
        .to_string_lossy();
    Ok(parent.join(format!(".{}.tmp", file_name)))
}

fn atomic_replace(tmp: &Path, target: &Path) -> Result<(), VaultError> {
    if target.exists() {
        fs::remove_file(target)?;
    }
    fs::rename(tmp, target)?;
    Ok(())
}

fn unique_workspace_id() -> String {
    static COUNTER: AtomicU64 = AtomicU64::new(0);
    let n = COUNTER.fetch_add(1, Ordering::Relaxed);

    use std::time::{SystemTime, UNIX_EPOCH};
    let ts = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_millis();

    format!("vault-{}-{}", ts, n)
}

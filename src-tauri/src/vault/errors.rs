use thiserror::Error;

#[derive(Debug, Error)]
pub enum VaultError {
    #[error("I/O error: {0}")]
    Io(#[from] std::io::Error),

    #[error("JSON error: {0}")]
    Json(#[from] serde_json::Error),

    #[error("Crypto error: {0}")]
    Crypto(String),

    #[error("Compression error: {0}")]
    Compression(String),

    #[error("Wrong passphrase or corrupted vault")]
    WrongPassphrase,

    #[error("No vault is currently open")]
    NotOpen,

    #[error("File not found: {0}")]
    FileNotFound(String),

    #[error("Invalid path: {0}")]
    InvalidPath(String),

    #[error("Invalid vault format: {0}")]
    InvalidFormat(String),

    #[error("Version not found: {0}")]
    VersionNotFound(String),
}

// Allows VaultError to be returned directly from #[tauri::command] fns.
impl serde::Serialize for VaultError {
    fn serialize<S: serde::Serializer>(&self, s: S) -> Result<S::Ok, S::Error> {
        s.serialize_str(&self.to_string())
    }
}

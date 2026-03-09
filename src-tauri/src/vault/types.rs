use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use time::OffsetDateTime;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VaultHandle {
    pub source: PathBuf,
    pub workspace: PathBuf,
    pub manifest: PathBuf,
    pub objects_dir: PathBuf,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Manifest {
    pub format_version: u32,
    pub created_by: String,
    pub schema_version: u32,
    #[serde(with = "time::serde::rfc3339")]
    pub created_at: OffsetDateTime,
    #[serde(with = "time::serde::rfc3339")]
    pub updated_at: OffsetDateTime,
}

impl Manifest {
    pub fn new(created_by: impl Into<String>, schema_version: u32) -> Self {
        let now = OffsetDateTime::now_utc();
        Self {
            format_version: 1,
            created_by: created_by.into(),
            schema_version,
            created_at: now,
            updated_at: now,
        }
    }
}

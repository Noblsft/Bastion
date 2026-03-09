use crate::vault::errors::VaultError;
use crate::vault::types::Compression;

/// Returns the compression algorithm to use for the given MIME type,
/// or `None` if the format should be stored as-is.
///
/// Files that are already compressed (images, video, audio, Office documents)
/// are skipped — compressing them again wastes CPU with no size benefit.
pub fn algorithm_for(mime: &str) -> Option<Compression> {
    let compressible = matches!(
        mime,
        "text/plain"
            | "text/markdown"
            | "text/csv"
            | "text/html"
            | "text/css"
            | "text/javascript"
            | "application/json"
            | "application/xml"
            | "application/javascript"
            | "application/x-yaml"
            | "application/x-ndjson"
    );

    if compressible {
        Some(Compression::Zstd)
    } else {
        None
    }
}

/// Compresses `data` with the given algorithm.
pub fn compress(algorithm: Compression, data: &[u8]) -> Result<Vec<u8>, VaultError> {
    match algorithm {
        Compression::Zstd => {
            zstd::encode_all(data, 3).map_err(|e| VaultError::Compression(e.to_string()))
        }
    }
}

/// Decompresses `data` with the given algorithm.
pub fn decompress(algorithm: Compression, data: &[u8]) -> Result<Vec<u8>, VaultError> {
    match algorithm {
        Compression::Zstd => {
            zstd::decode_all(data).map_err(|e| VaultError::Compression(e.to_string()))
        }
    }
}

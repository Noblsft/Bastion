use crate::vault::errors::VaultError;
use crate::vault::types::Cipher;

use argon2::{Algorithm, Argon2, Params, Version};
use base64::{engine::general_purpose::STANDARD as B64, Engine};
use rand::RngCore;

const NONCE_LEN: usize = 12;

/// Generates a cryptographically random 32-byte salt encoded as base64.
pub fn generate_salt() -> String {
    let mut salt = [0u8; 32];
    rand::rngs::OsRng.fill_bytes(&mut salt);
    B64.encode(salt)
}

/// Derives a 256-bit key from `passphrase` using Argon2id.
/// The salt must be the base64-encoded value stored in the manifest.
pub fn derive_key(
    passphrase: &str,
    salt_b64: &str,
    memory_kb: u32,
    iterations: u32,
    parallelism: u32,
) -> Result<[u8; 32], VaultError> {
    let salt = B64
        .decode(salt_b64)
        .map_err(|e| VaultError::Crypto(format!("invalid salt encoding: {}", e)))?;

    let params = Params::new(memory_kb, iterations, parallelism, Some(32))
        .map_err(|e| VaultError::Crypto(e.to_string()))?;

    let mut key = [0u8; 32];
    Argon2::new(Algorithm::Argon2id, Version::V0x13, params)
        .hash_password_into(passphrase.as_bytes(), &salt, &mut key)
        .map_err(|e| VaultError::Crypto(e.to_string()))?;

    Ok(key)
}

/// Encrypts `plaintext` with the given cipher and key.
/// Output format: `[nonce: 12B][ciphertext + auth tag]`.
pub fn encrypt(cipher: Cipher, key: &[u8; 32], plaintext: &[u8]) -> Result<Vec<u8>, VaultError> {
    let mut nonce = [0u8; NONCE_LEN];
    rand::rngs::OsRng.fill_bytes(&mut nonce);

    let ciphertext = seal(cipher, key, &nonce, plaintext)?;

    let mut out = Vec::with_capacity(NONCE_LEN + ciphertext.len());
    out.extend_from_slice(&nonce);
    out.extend_from_slice(&ciphertext);
    Ok(out)
}

/// Decrypts data previously produced by `encrypt`.
/// Returns `WrongPassphrase` if authentication fails (wrong key or corrupted data).
pub fn decrypt(cipher: Cipher, key: &[u8; 32], data: &[u8]) -> Result<Vec<u8>, VaultError> {
    if data.len() <= NONCE_LEN {
        return Err(VaultError::Crypto(
            "data too short to contain a nonce".into(),
        ));
    }
    let (nonce_bytes, ciphertext) = data.split_at(NONCE_LEN);
    let nonce: &[u8; 12] = nonce_bytes.try_into().unwrap();
    open(cipher, key, nonce, ciphertext)
}

fn seal(
    cipher: Cipher,
    key: &[u8; 32],
    nonce: &[u8; 12],
    plaintext: &[u8],
) -> Result<Vec<u8>, VaultError> {
    match cipher {
        Cipher::Aes256Gcm => {
            use aes_gcm::{aead::Aead, Aes256Gcm, KeyInit, Nonce};
            Aes256Gcm::new_from_slice(key)
                .unwrap()
                .encrypt(Nonce::from_slice(nonce), plaintext)
                .map_err(|e| VaultError::Crypto(e.to_string()))
        }
        Cipher::ChaCha20Poly1305 => {
            use chacha20poly1305::{aead::Aead, ChaCha20Poly1305, KeyInit, Nonce};
            ChaCha20Poly1305::new_from_slice(key)
                .unwrap()
                .encrypt(Nonce::from_slice(nonce), plaintext)
                .map_err(|e| VaultError::Crypto(e.to_string()))
        }
    }
}

fn open(
    cipher: Cipher,
    key: &[u8; 32],
    nonce: &[u8; 12],
    ciphertext: &[u8],
) -> Result<Vec<u8>, VaultError> {
    match cipher {
        Cipher::Aes256Gcm => {
            use aes_gcm::{aead::Aead, Aes256Gcm, KeyInit, Nonce};
            Aes256Gcm::new_from_slice(key)
                .unwrap()
                .decrypt(Nonce::from_slice(nonce), ciphertext)
                .map_err(|_| VaultError::WrongPassphrase)
        }
        Cipher::ChaCha20Poly1305 => {
            use chacha20poly1305::{aead::Aead, ChaCha20Poly1305, KeyInit, Nonce};
            ChaCha20Poly1305::new_from_slice(key)
                .unwrap()
                .decrypt(Nonce::from_slice(nonce), ciphertext)
                .map_err(|_| VaultError::WrongPassphrase)
        }
    }
}

# Vault Module

The vault is the core storage and security layer of the application. It provides encrypted, persistent storage for user files, application data, and settings. All data written to disk by any part of the application goes through this module.

---

## Table of Contents

- [Design Philosophy](#design-philosophy)
- [Vault Format](#vault-format)
- [Security Model](#security-model)
- [Encryption](#encryption)
- [Key Derivation](#key-derivation)
- [Compression](#compression)
- [File Storage](#file-storage)
- [Indexing](#indexing)
- [Search](#search)
- [Settings](#settings)
- [Lifecycle](#lifecycle)
- [Module Structure](#module-structure)
- [Error Handling](#error-handling)
- [Adding New Features](#adding-new-features)

---

## Design Philosophy

### No plaintext on disk

The central design decision of this module: **files are never decrypted to disk**. Every object stored in the vault remains encrypted at rest at all times. When the vault is open, the master key lives in memory and individual files are decrypted on demand into memory, used, and discarded. When the vault is closed the key is zeroed.

This is meaningfully different from an "extract to workspace" approach (where a ZIP is unpacked to a temp directory), which leaves all data as plaintext on disk for the duration of a session.

### Single encrypted directory

The vault is a plain directory on disk — not a database, not a ZIP archive. Every file inside it is independently encrypted. This gives:

- **Live updates**: writing a file is a single `fs::write` call, no repack needed
- **Transparency**: the directory can be inspected, backed up, or moved as a normal folder
- **Portability**: zip the directory for transport or backup; no special tooling required

### Shared file pool

Files are not owned by individual apps. Any app can reference any file via `app_ids`. This avoids duplication when multiple apps need access to the same data, and keeps the storage layer simple — one pool, one index.

---

## Vault Format

A vault is a directory with the following structure:

```
vault.noblsft/
  manifest.json          ← plaintext: cipher, KDF parameters, timestamps
  index.enc              ← encrypted: metadata for every stored file
  search.enc             ← encrypted: extracted text per file UUID
  objects/
    <uuid>.enc           ← encrypted: raw file bytes (one file per object)
    <uuid>.enc
    ...
  settings/
    global.enc           ← encrypted: vault-wide settings (nested JSON)
    apps/
      <app_id>.enc       ← encrypted: per-app settings (nested JSON)
```

### manifest.json

The only plaintext file in the vault. It contains everything needed to derive the master key and nothing else — no user data, no file names, no timestamps of user activity.

```json
{
  "format_version": 1,
  "schema_version": 1,
  "cipher": "aes256_gcm",
  "kdf_salt": "<base64-encoded 32 bytes>",
  "kdf_memory_kb": 65536,
  "kdf_iterations": 3,
  "kdf_parallelism": 4,
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z"
}
```

`format_version` identifies the vault layout itself (this document). `schema_version` identifies the application data schema inside the vault, used for migrations.

### Encrypted files (.enc)

Every `.enc` file uses the same binary format:

```
┌─────────────────┬──────────────────────────────────────────┐
│  Nonce (12 B)   │  Ciphertext + AEAD auth tag (16 B tail)  │
└─────────────────┴──────────────────────────────────────────┘
```

The nonce is generated fresh from the OS random source on every write. The auth tag is appended by the AEAD cipher automatically. This means every write of the same plaintext produces a different ciphertext — and any tampering with the ciphertext is detected on decrypt via the auth tag.

---

## Security Model

### Threat model

| Threat | Protection |
|---|---|
| Vault at rest (closed) | Fully encrypted — requires passphrase to open |
| Vault open, device seized | Files remain encrypted on disk — only the key is in memory |
| App crash leaves data exposed | No plaintext on disk to leave behind |
| Ciphertext tampering | AEAD authentication tag detects any modification |
| Passphrase brute force | Argon2id with 64 MB memory cost makes offline attacks expensive |

### What is not protected

- **Vault open, memory read**: if an attacker has arbitrary memory read access on a running process, the key can be extracted. This is outside the scope of a software-only vault — hardware security modules (HSMs) or OS-level secure enclaves address this.
- **Metadata at rest**: `manifest.json` is plaintext. It reveals the cipher algorithm, KDF parameters, and vault creation timestamp. It does not reveal file names, content, or user identity.

---

## Encryption

Two AEAD (Authenticated Encryption with Associated Data) ciphers are supported. The choice is made at vault creation time and stored in the manifest.

### AES-256-GCM (`Cipher::Aes256Gcm`)

- 256-bit key, 96-bit nonce, 128-bit authentication tag
- Hardware-accelerated on any modern x86/ARM processor via AES-NI / ARMv8 crypto extensions
- **Recommended default** for desktop hardware

### ChaCha20-Poly1305 (`Cipher::ChaCha20Poly1305`)

- 256-bit key, 96-bit nonce, 128-bit authentication tag
- Software implementation — consistent performance on any hardware, including devices without AES acceleration
- Preferred fallback for environments without AES hardware

Both ciphers provide equivalent security. The nonce format and key size are identical, so the `encrypt`/`decrypt` functions in `crypto.rs` share the same external API regardless of which cipher is active.

### Nonce management

A fresh 96-bit nonce is drawn from `OsRng` (the operating system's cryptographically secure random number generator) on every `encrypt` call. Nonces are not stored separately — they are prepended to the ciphertext output and parsed back out during decryption. This avoids any nonce-reuse risk.

---

## Key Derivation

The master key is derived from the user's passphrase using **Argon2id** — the winner of the Password Hashing Competition and the current OWASP recommendation for password-based key derivation.

### Parameters

| Parameter | Value | Reason |
|---|---|---|
| Algorithm | Argon2id | Resistant to both GPU and side-channel attacks |
| Memory | 64 MB | Makes parallel brute force expensive |
| Iterations | 3 | Time hardening on top of memory cost |
| Parallelism | 4 | Matches typical CPU core count |
| Output length | 32 bytes | Matches 256-bit key requirement of both ciphers |

Parameters are stored in `manifest.json` so they can be updated in future versions without breaking existing vaults.

### Salt

A 32-byte salt is generated from `OsRng` at vault creation time, base64-encoded, and stored in `manifest.json`. The salt is not secret — its purpose is to ensure that two vaults with the same passphrase produce different keys, defeating precomputed rainbow table attacks.

### Key lifetime

The derived `[u8; 32]` is immediately wrapped in a `MasterKey` struct, which implements `ZeroizeOnDrop`. When `close_vault` sets the `Mutex<Option<OpenedVault>>` to `None`, the `OpenedVault` is dropped and the key bytes are overwritten with zeros before the memory is released.

---

## Compression

Compression is applied automatically before encryption, driven by MIME type. The order is non-negotiable: **compress → encrypt → store** / **read → decrypt → decompress**. Encrypted output is statistically random and contains no redundancy for a compressor to exploit — compressing after encryption produces no size reduction.

### Algorithm: Zstd

[Zstandard](https://facebook.github.io/zstd/) (level 3) is used as the sole compression algorithm. It provides a strong ratio/speed balance and is well-suited for the mixed workloads a vault will see (short documents, structured text, JSON).

| Cipher | Speed | Ratio | Notes |
|---|---|---|---|
| `Compression::Zstd` | Fast | High | Default and only algorithm |

The algorithm used for a file is stored in its `FileEntry` as `compression: Option<Compression>`. `None` means the file was stored uncompressed. This field is necessary on read so the correct decompressor is applied after decryption.

### MIME-type gating

Compressing already-compressed formats wastes CPU with no storage benefit. Only formats whose bytes contain meaningful redundancy are compressed:

| Compresses | Does not compress |
|---|---|
| `text/plain`, `text/markdown`, `text/csv`, `text/html`, `text/css`, `text/javascript` | JPEG, PNG, WebP, AVIF (image formats) |
| `application/json`, `application/xml`, `application/javascript`, `application/x-yaml`, `application/x-ndjson` | MP4, MP3, AAC (media formats) |
| | DOCX, XLSX, PPTX (already ZIP-based) |
| | `application/pdf` (internally compressed) |

The gating logic lives entirely in `compression::algorithm_for(mime)`. Extending it to new MIME types requires adding a single `|` arm to the match expression.

### Integrity hash and size

`FileEntry.integrity_hash` is the SHA-256 of the **original plaintext**, computed before compression. `FileEntry.size` is likewise the original uncompressed byte count. After `read_file` returns decrypted and decompressed bytes, callers can verify the hash against what they received.

---

## File Storage

### Object identity

Each file is identified by a **UUID v4** generated at creation time. The UUID is stable — it does not change when the file content is updated. This means callers can hold a file reference indefinitely without it becoming stale.

### On-disk layout

Objects are stored at `objects/<uuid>.enc`. There is no subdirectory sharding because the filesystem handles flat directories with thousands of entries efficiently on all modern operating systems.

### Integrity verification

Every `FileEntry` in the index contains an `integrity_hash` — the SHA-256 hex digest of the plaintext bytes computed at write time. This allows the application to detect corruption independently of the AEAD authentication (which only detects tampering, not accidental bit rot prior to the encryption boundary).

### Write flow (`create_file`)

```
plaintext bytes
  → compute SHA-256                          (integrity_hash, before any transformation)
  → if MIME is compressible: compress(zstd)  (payload shrinks, hash unchanged)
  → encrypt(cipher, master_key, nonce)       (payload → ciphertext)
  → write to objects/<uuid>.enc
  → build FileEntry { id, name, mime, app_ids, size, integrity_hash, compression, ... }
  → load index.enc, append entry, re-encrypt, write
  → if MIME is text: load search.enc, insert extracted text, re-encrypt, write
```

### Read flow (`read_file`)

```
read objects/<uuid>.enc
  → load index.enc to retrieve FileEntry.compression
  → decrypt(cipher, master_key)
  → if compression is Some(Zstd): decompress
  → return original plaintext bytes
```

### Update flow (`update_file`)

Same as create, but the index is loaded first (to resolve the MIME type for compression), the existing `.enc` file is overwritten, and the existing `FileEntry` is mutated in place. The UUID does not change.

---

## Indexing

`index.enc` is an encrypted JSON array of `FileEntry` objects. It is the single source of truth for file metadata.

```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "quarterly-report.pdf",
    "mime": "application/pdf",
    "app_ids": ["sigil", "reports"],
    "size": 204800,
    "integrity_hash": "a3f1...",
    "compression": null,
    "created_at": "2024-01-01T10:00:00Z",
    "updated_at": "2024-01-15T14:32:00Z"
  },
  {
    "id": "6ba7b810-8dad-11d1-80b4-00c04fd430c8",
    "name": "notes.md",
    "mime": "text/markdown",
    "app_ids": ["sigil"],
    "size": 8192,
    "integrity_hash": "b9e2...",
    "compression": "zstd",
    "created_at": "2024-01-10T09:00:00Z",
    "updated_at": "2024-01-10T09:00:00Z"
  }
]
```

### Design rationale

The index is loaded from disk and decrypted on every operation that reads or writes metadata. This is intentional — it keeps the implementation stateless (no in-memory cache to invalidate), at the cost of one decrypt per operation. For a single-user desktop application operating on a local SSD, this overhead is negligible.

If this becomes a bottleneck at very large scale (tens of thousands of files), caching the index in an `Arc<Mutex<Vec<FileEntry>>>` inside `VaultService` is the straightforward upgrade path.

---

## Search

`search.enc` is an encrypted JSON object mapping file UUIDs to extracted text:

```json
{
  "550e8400-...": "quarterly revenue figures for Q3...",
  "6ba7b810-...": "meeting notes from project kickoff..."
}
```

### Text extraction

Text is extracted at write time for supported MIME types:

| MIME type | Extracted |
|---|---|
| `text/plain` | Full content |
| `text/markdown` | Full content |
| `text/csv` | Full content |
| `text/html` | Full content |
| Everything else | Not indexed |

Files with unsupported MIME types (PDFs, images, Office documents) are stored and retrievable but will not appear in full-text search results. Adding extraction support for additional types — e.g. PDF via `pdf-extract`, DOCX via `docx-rs` — requires only extending the `extract_text` function in `search.rs`.

### Query execution

Search is a case-insensitive substring scan across the in-memory map after decryption. For thousands of files this executes in milliseconds. The result is a `HashSet<String>` of matching UUIDs, which is then used to filter the index.

If search performance becomes a concern at larger scale, the `search.enc` map can be replaced with a proper inverted index or a Tantivy index stored as an additional encrypted file inside the vault.

---

## Settings

Settings are scoped either globally (vault-wide) or per-app:

| Scope string | File on disk |
|---|---|
| `"global"` | `settings/global.enc` |
| `"sigil"` | `settings/apps/sigil.enc` |
| `"<any app id>"` | `settings/apps/<id>.enc` |

Each settings file is an encrypted JSON document:

```json
{
  "schema_version": 1,
  "data": {
    "theme": "dark",
    "language": "en",
    "recentFiles": ["uuid-1", "uuid-2"]
  }
}
```

`schema_version` enables forward migration: when an app opens a settings file with an older `schema_version`, it can transform the `data` field to the current shape before use.

`set_settings` always replaces the entire `data` object for the given scope. Partial updates should be handled by the caller: read → merge → write.

---

## Lifecycle

### Creating a vault

```
create_vault(path, passphrase, cipher)
  1. Create directory structure on disk
  2. Generate 32-byte random salt → base64 encode
  3. Build Manifest with chosen cipher + KDF params → write manifest.json (plaintext)
  4. Derive master key via Argon2id(passphrase, salt, params)
  5. Write empty index.enc and search.enc with the derived key
  6. Store OpenedVault { path, cipher, key } in Mutex
  7. Return VaultHandle { path, cipher } to the frontend
```

### Opening an existing vault

```
open_vault(path, passphrase)
  1. Read and parse manifest.json
  2. Derive master key via Argon2id(passphrase, manifest.kdf_salt, manifest.kdf_params)
  3. Attempt to decrypt index.enc with the derived key
     → AEAD tag mismatch = wrong passphrase → return WrongPassphrase
     → success = passphrase is correct
  4. Store OpenedVault in Mutex
  5. Return VaultHandle to the frontend
```

Passphrase verification is implicit — there is no stored "correct passphrase" to compare against. The AEAD authentication tag on `index.enc` acts as the verifier. A wrong key produces garbled ciphertext that fails authentication.

### Closing a vault

```
close_vault()
  1. Lock the Mutex
  2. Set Option<OpenedVault> to None
     → OpenedVault drops → MasterKey drops → [u8; 32] zeroed by ZeroizeOnDrop
```

Close is also called automatically from the Tauri window event handler on `CloseRequested` and `Destroyed`, ensuring the key is wiped even if the user closes the window without an explicit logout.

---

## Module Structure

```
vault/
  mod.rs            — re-exports all submodules
  types.rs          — Cipher, Compression, Manifest, FileEntry, VaultHandle, MasterKey, OpenedVault
  errors.rs         — VaultError enum + serde::Serialize impl for Tauri commands
  crypto.rs         — encrypt, decrypt, derive_key, generate_salt
  compression.rs    — algorithm_for, compress, decompress
  index.rs          — IndexStore: load/save encrypted file metadata
  search.rs         — SearchStore: load/save/query encrypted text index; extract_text
  settings.rs       — SettingsStore: load/save encrypted global and per-app settings
  vault_service.rs  — VaultService: coordinates all submodules; holds Mutex<OpenedVault>
  commands.rs       — #[tauri::command] fns; the only public API surface for the frontend
```

### Dependency graph within the module

```
commands.rs
    └── vault_service.rs
            ├── crypto.rs
            ├── compression.rs
            ├── index.rs      ──→ crypto.rs
            ├── search.rs     ──→ crypto.rs
            └── settings.rs   ──→ crypto.rs
```

`types.rs` and `errors.rs` are imported by all layers. `crypto.rs` is a leaf — it imports nothing from within the vault module.

### `with_vault` pattern

All `VaultService` methods that require an open vault go through `with_vault`:

```rust
fn with_vault<T>(
    &self,
    f: impl FnOnce(&OpenedVault) -> Result<T, VaultError>,
) -> Result<T, VaultError> {
    let guard = self.opened.lock().unwrap_or_else(|e| e.into_inner());
    match guard.as_ref() {
        Some(v) => f(v),
        None => Err(VaultError::NotOpen),
    }
}
```

This enforces at compile time that key material is only accessed through the locked guard, and that every operation returns `NotOpen` consistently when no vault is loaded.

---

## Error Handling

`VaultError` variants and when they occur:

| Variant | When |
|---|---|
| `Io` | Any filesystem read/write failure |
| `Json` | Serialisation or deserialisation failure |
| `Crypto(String)` | Key derivation failure or nonce/param error |
| `Compression(String)` | zstd compress or decompress failure |
| `WrongPassphrase` | AEAD authentication tag mismatch on decrypt |
| `NotOpen` | Any file/settings operation with no vault loaded |
| `FileNotFound(String)` | Object `.enc` file or index entry does not exist |
| `InvalidPath(String)` | Vault directory missing or already exists |
| `InvalidFormat(String)` | `manifest.json` is malformed |

`VaultError` implements `serde::Serialize` so it can be returned directly from `#[tauri::command]` functions without any `.map_err(|e| e.to_string())` boilerplate. The frontend receives the error as a plain string.

---

## Adding New Features

### New file type with text extraction

Add a MIME type arm to `extract_text` in `search.rs`:

```rust
"application/pdf" => some_pdf_crate::extract_text(data).ok(),
```

No other changes needed — `create_file` and `update_file` call `extract_text` automatically.

### New file type with compression

Add a MIME type arm to `algorithm_for` in `compression.rs`:

```rust
| "application/x-new-format"
```

The write and read paths pick this up automatically through `algorithm_for`. The `compression` field on the resulting `FileEntry` will reflect the algorithm used, so older files without compression remain readable.

### New settings scope

No code changes needed. Any string other than `"global"` is treated as an app ID and routed to `settings/apps/<id>.enc`. The file is created on first write.

### New service (e.g. a note-taking app)

Create a new top-level module (`src/notes/`) and add it as a field on `AppState`. The new service writes its data by calling `VaultService` methods — it does not interact with `crypto.rs`, `index.rs`, or any vault internals directly. Register its commands in `lib.rs`.

### Schema migration

Increment `schema_version` in `VaultService::new`. On `open_vault`, compare the manifest's `schema_version` against the current one and run migration logic before returning the handle.

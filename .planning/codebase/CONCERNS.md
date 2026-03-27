# Concerns

## Security

### ✅ Strong Foundations

- Master key derived via Argon2id with OWASP 2023 parameters (64 MB, 3 iterations, 4 parallelism)
- 256-bit master key zeroed on drop (`Zeroize`, `ZeroizeOnDrop`)
- Key material never crosses IPC boundary (only `VaultHandle { path, cipher }` is sent to frontend)
- AEAD encryption (AES-256-GCM or ChaCha20-Poly1305) for all stored data
- SHA-256 integrity hashes on file content
- Passphrase verification via AEAD tag authentication (no separate password hash stored)
- Content snapshots are file copies (no re-encryption needed for history)

### ⚠️ Areas to Watch

- **CSP is null** in `tauri.conf.json` (`"csp": null`) — no Content Security Policy active
- **No rate limiting** on passphrase attempts — vault can be brute-forced if attacker has the vault files
- **Search index decrypted entirely into memory** — large vaults could leak search data via swap/crash dumps
- **Index and search index loaded fully per operation** — all metadata decrypted on every file CRUD call (discussed below in Performance)

## Performance

### Index Scalability

Every file operation (create, read, update, delete, list, search) loads and decrypts `index.enc` — the full file metadata array. For vaults with thousands of files:

- `IndexStore::load()` + `IndexStore::save()` on every write
- `SearchStore::load()` + `SearchStore::save()` on every content write
- O(n) scan for file lookups (no HashMap, just `iter().find()`)

### History I/O

- `HistoryStore::should_snapshot()` loads history on every update to check interval timing
- `HistoryStore::load_config()` called on every file update
- Content snapshots are full file copies (no delta/diff)

### Compression

- MIME-based heuristic only compresses text formats — binary files stored as-is (correct but not explicitly documented)

## Technical Debt

### Inline TODOs

- `src/App.tsx:21` — `// TODO: Move this to start page and make it a separate layout for vault mode only`
- `src/App.tsx:54` — `// FIXME: Lack of rounded corners on app window`
- `src/services/types.ts:162` — `// TODO: This needs a separate service` (Settings)
- `src/services/types.ts:176` — `// TODO: This needs a separate service` (History)

### Architecture Gaps

- **Only one module** (`Sigil`) is registered — the module system is designed for many but only one exists
- **Settings and History commands** are bundled into `VaultService` — the types file notes these should be separate services
- **No error boundary** — no React error boundaries for graceful failure handling
- **No loading states** — no observable loading/error state management pattern
- **Logger is basic** — `console.log` wrapper with no log levels, no persistence, no structured logging
- **`@emotion/react` is a dependency** but appears unused beyond being installed — potential dead dependency

### Frontend Incompleteness

- **Sigil module** has placeholder components (Workspace shows "Select an item from the sidebar", Sidebar has hardcoded buttons with no handlers)
- **No routing beyond 2 routes** — only `/` (Start) and `/home` (Home)
- **No form handling** — no form library (react-hook-form, formik) for vault creation/opening flows

## Fragile Areas

### Mutex Poisoning

`VaultService` uses `Mutex::lock().unwrap_or_else(|e| e.into_inner())` to recover from poisoned mutexes. This is intentional (prevents panic cascades) but suppresses errors silently — a poisoned mutex means something already panicked.

### Tauri Window Identifier

The `tauri.conf.json` uses `"productName": "noblsft"` and `"identifier": "com.noblsft.noblsft"` — may need updating to match the actual product name "Bastion".

### File Format Versioning

- `Manifest.format_version` is set to `1` but never checked on `open_vault`
- `schema_version` is passed in but also never validated during open — forward compatibility is not handled

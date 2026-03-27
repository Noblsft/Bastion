# External Integrations

## Tauri IPC (Frontend ↔ Backend)

The **only** integration boundary. All communication between the React frontend and Rust backend flows through Tauri's `invoke()` IPC mechanism.

### Registered Commands

| Group     | Command                                                                                                                                                  | Direction |
| --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- |
| Lifecycle | `create_vault`, `open_vault`, `close_vault`                                                                                                              | FE → BE   |
| Files     | `vault_create_file`, `vault_read_file`, `vault_update_file`, `vault_update_file_metadata`, `vault_delete_file`, `vault_list_files`, `vault_search_files` | FE → BE   |
| Settings  | `vault_get_settings`, `vault_set_settings`                                                                                                               | FE → BE   |
| History   | `vault_get_history`, `vault_save_version`, `vault_revert_file`, `vault_get_history_config`, `vault_set_history_config`                                   | FE → BE   |

All commands are registered in `src-tauri/src/lib.rs` via `tauri::generate_handler![]`.

### Frontend IPC Layer

- `src/services/VaultService.ts` — wraps every `invoke()` call in typed async methods
- `src/services/types.ts` — mirrors the Rust types (`Cipher`, `FileEntry`, `VaultHandle`, `HistoryEntry`, etc.)
- `src/hooks/useServices.tsx` — React Context provider; singleton `VaultService` instance

## Databases

**None.** All data is stored as encrypted files on the local filesystem. There is no SQLite, IndexedDB, or any external database.

### Vault On-Disk Format

```
<vault_root>/
├── manifest.json          (plaintext — KDF params, cipher, salt)
├── index.enc              (encrypted JSON — file metadata array)
├── search.enc             (encrypted JSON — full-text search index)
├── objects/<uuid>.enc     (encrypted file content)
├── settings/
│   ├── global.enc         (encrypted vault-wide settings)
│   └── apps/<id>.enc      (encrypted per-app settings)
├── history/
│   ├── config.enc         (encrypted history config)
│   └── <file_id>.enc      (encrypted history entries)
└── snapshots/
    └── <file_id>/
        └── <version_id>.enc  (content snapshot — raw copy)
```

## External APIs

**None.** Bastion is fully offline. No network calls, no cloud services, no analytics, no telemetry.

## Auth Providers

**None.** Authentication is local-only via passphrase → Argon2id key derivation → AEAD verification.

## Native Platform APIs

| Plugin                | Purpose                                             | Capability       |
| --------------------- | --------------------------------------------------- | ---------------- |
| `tauri-plugin-dialog` | Native file picker / save dialogs                   | `dialog:default` |
| `tauri-plugin-opener` | Open URLs and files in OS default apps              | `opener:default` |
| `tauri-plugin-os`     | Detect OS type (macOS, Windows, Linux)              | `os:default`     |
| Tauri core            | Window management (close, minimize, maximize, drag) | `core:window:*`  |

Capabilities defined in `src-tauri/capabilities/default.json`.

## CI/CD

GitHub Actions workflows exist in `.github/workflows/` (directory present, specific workflows not inspected).

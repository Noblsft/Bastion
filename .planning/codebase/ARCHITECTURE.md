# Architecture

## Pattern

**Desktop app — Tauri v2 (Rust backend + React frontend)**

The architecture follows a strict split:

- **Rust backend** (`src-tauri/`) — all security-critical logic: cryptography, key management, file storage, search indexing, versioning. No key material ever crosses the IPC boundary.
- **React frontend** (`src/`) — UI only. Communicates with the backend exclusively via Tauri `invoke()` commands.

## Layers

```
┌─────────────────────────────────────────────────┐
│  React Frontend (UI)                            │
│  ┌───────────┐ ┌──────────┐ ┌────────────────┐  │
│  │  Pages    │ │ Modules  │ │  Components    │  │
│  │ Start,   │ │ Sigil    │ │ Topbar,        │  │
│  │ Home     │ │ (+ more) │ │ Sidebar,       │  │
│  │          │ │          │ │ Workspace, UI  │  │
│  └────┬─────┘ └────┬─────┘ └───────┬────────┘  │
│       │             │               │            │
│  ┌────▼─────────────▼───────────────▼──────────┐ │
│  │  State Layer (Zustand)                      │ │
│  │  appStore (global) + per-module stores      │ │
│  └────────────────────┬────────────────────────┘ │
│                       │                          │
│  ┌────────────────────▼────────────────────────┐ │
│  │  Services Layer                             │ │
│  │  VaultService → invoke() IPC                │ │
│  └────────────────────┬────────────────────────┘ │
└───────────────────────┼──────────────────────────┘
                        │ Tauri IPC
┌───────────────────────┼──────────────────────────┐
│  Rust Backend         │                          │
│  ┌────────────────────▼────────────────────────┐ │
│  │  Commands (Tauri #[command])                │ │
│  │  Thin wrappers → AppState → VaultService    │ │
│  └────────────────────┬────────────────────────┘ │
│                       │                          │
│  ┌────────────────────▼────────────────────────┐ │
│  │  VaultService                               │ │
│  │  • Lifecycle (create/open/close)            │ │
│  │  • File CRUD + search                       │ │
│  │  • Settings (global + per-app)              │ │
│  │  • History + version snapshots              │ │
│  └────┬────────┬────────┬────────┬─────────────┘ │
│       │        │        │        │               │
│  ┌────▼──┐ ┌──▼────┐ ┌─▼─────┐ ┌▼──────────┐   │
│  │crypto │ │index  │ │search │ │history    │   │
│  │AES/CC │ │meta   │ │FTS    │ │snapshots  │   │
│  └───────┘ └───────┘ └───────┘ └───────────┘   │
│  ┌────────┐ ┌──────────┐ ┌──────────┐          │
│  │compress│ │settings  │ │errors    │          │
│  │Zstd    │ │scoped    │ │VaultError│          │
│  └────────┘ └──────────┘ └──────────┘          │
└──────────────────────────────────────────────────┘
```

## Data Flow

### Vault Creation

1. User selects path + passphrase + cipher in UI
2. `VaultService.createVault()` → `invoke('create_vault')` IPC
3. Rust: create directory structure, generate salt, derive key (Argon2id), write manifest, empty index, empty search
4. `OpenedVault { path, cipher, key }` stored in `Mutex<Option<>>` app state
5. `VaultHandle { path, cipher }` returned to frontend (no key material)

### File Write

1. Frontend calls `VaultService.createFile(name, mime, appIds, data)`
2. Rust: MIME-based Zstd compression → AEAD encryption → write `objects/<uuid>.enc`
3. Update encrypted `index.enc` (append entry) and `search.enc` (extract text for full-text search)
4. Return `FileEntry` metadata to frontend

### File Read

1. Frontend calls `VaultService.readFile(id)`
2. Rust: read `objects/<id>.enc` → AEAD decrypt → decompress if needed → return raw bytes

## Key Abstractions

### Module System (`src/modules/`)

- `Module` interface: `{ name, Icon?, Sidebar, Workspace, useStore }`
- Registry pattern: `moduleRegistry` maps string IDs to `Module` implementations
- Each module has `desktop/` (platform-specific components) and `shared/` (cross-platform store)
- Currently only `Sigil` module is registered

### Service Layer (`src/services/`)

- `createServices()` factory → `Services` typed object → injected via React Context
- `useServices()` hook for consuming components
- All Tauri IPC wrapped in `VaultService` class methods

### State Management

- **Global**: `appStore.ts` (Zustand) — `activeModule`, `sidebarRightOpen`, `vault` handle
- **Per-module**: Each module owns its Zustand store (e.g., `useSigilStore`)

## Entry Points

| Entry        | File                    | Purpose                                                          |
| ------------ | ----------------------- | ---------------------------------------------------------------- |
| Rust         | `src-tauri/src/main.rs` | `bastion_lib::run()`                                             |
| Rust lib     | `src-tauri/src/lib.rs`  | Tauri builder, plugin registration, command handlers             |
| Frontend     | `src/main.tsx`          | React root render, `ServicesProvider`                            |
| Frontend app | `src/App.tsx`           | `HashRouter`, routing, layout                                    |
| HTML         | `index.html`            | Tauri entry with `data-tauri-drag-region`, loads `/src/main.tsx` |

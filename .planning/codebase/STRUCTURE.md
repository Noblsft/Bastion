# Directory Structure

## Root Layout

```
Bastion/
├── src/                    # React frontend
├── src-tauri/              # Rust Tauri backend
├── scripts/                # Build/dev utilities
├── .github/workflows/      # CI/CD
├── .husky/                 # Git hooks (pre-commit, commit-msg)
├── index.html              # Tauri HTML entry point
├── package.json            # Node dependencies, scripts
├── vite.config.ts          # Vite + Tailwind + Tauri config
├── tsconfig.json           # TypeScript config (strict, path aliases)
├── jest.config.ts          # Jest test config
├── eslint.config.cjs       # ESLint flat config
├── components.json         # shadcn/ui configuration
├── commitlint.config.cjs   # Conventional commits
└── .prettierrc             # Prettier formatting rules
```

## Frontend (`src/`)

```
src/
├── main.tsx                # React root — ServicesProvider → App
├── App.tsx                 # Router + MainLayout (Topbar + Sidebar + Routes)
├── App.css                 # TailwindCSS entry, shadcn design tokens (OKLCH), themes
├── vite-env.d.ts           # Vite type declarations
│
├── components/             # Shared UI components
│   ├── index.ts            # Barrel exports
│   ├── desktop/            # Desktop-specific shell components
│   │   ├── topbar/
│   │   │   └── Topbar.tsx
│   │   ├── sidebar/
│   │   │   ├── GlobalSidebar.tsx    # Main sidebar container
│   │   │   ├── ModulesPanel.tsx     # Left icon strip (module switcher)
│   │   │   ├── ModuleSidebar.tsx    # Right panel per-module navigation
│   │   │   ├── VaultPanel.tsx       # Vault info display
│   │   │   ├── Sidebar.tsx          # Sidebar layout wrapper
│   │   │   └── index.ts
│   │   └── workspace/
│   │       └── Workspace.tsx
│   └── ui/                 # shadcn/ui primitives (auto-generated)
│       ├── button.tsx
│       └── input.tsx
│
├── modules/                # Feature modules (pluggable architecture)
│   ├── index.ts            # moduleRegistry + ModuleNames type
│   ├── types.d.ts          # Module interface definition
│   └── sigil/              # Password/secrets manager module
│       ├── index.tsx        # Module export (Sigil: Module)
│       ├── desktop/         # Desktop-specific components
│       │   ├── Icon.tsx
│       │   ├── Sidebar.tsx
│       │   └── Workspace.tsx
│       └── shared/          # Cross-platform state
│           └── store.ts     # useSigilStore (Zustand)
│
├── pages/                  # Route-level pages
│   ├── index.ts            # Barrel exports (Start, Home)
│   └── desktop/
│       ├── start/
│       │   └── Start.tsx    # Landing / vault picker
│       └── home/
│           └── Home.tsx     # Main vault workspace (module.Workspace)
│
├── services/               # Backend communication layer
│   ├── index.ts            # createServices() factory
│   ├── VaultService.ts     # Tauri invoke() wrapper class
│   └── types.ts            # Shared types (Cipher, FileEntry, VaultHandle, etc.)
│
├── store/                  # Global state
│   └── appStore.ts         # useAppStore (activeModule, vault, sidebar)
│
├── hooks/                  # React hooks
│   └── useServices.tsx     # ServicesProvider + useServices() context
│
├── lib/                    # Utility libraries
│   └── utils.ts            # cn() — clsx + tailwind-merge
│
├── utils/                  # Application utilities
│   ├── index.ts            # Barrel export
│   └── Logger.ts           # Simple console logger with timestamps
│
├── assets/                 # Static assets (images, fonts, etc.)
│
└── tests/                  # Test files
    ├── setupTests.ts        # Jest DOM setup
    ├── hooks/
    │   └── useServices.test.tsx
    └── services/
        └── VaultService.test.ts
```

## Backend (`src-tauri/`)

```
src-tauri/
├── Cargo.toml              # Rust dependencies and build profiles
├── Cargo.lock              # Locked dependency versions
├── tauri.conf.json         # Tauri app config (identity, window, bundle)
├── build.rs                # Tauri build script
├── rustfmt.toml            # Rust formatter config
│
├── src/
│   ├── main.rs             # Entry point → bastion_lib::run()
│   ├── lib.rs              # Tauri builder — plugins, state, commands
│   ├── state.rs            # AppState struct (vault: VaultService)
│   └── vault/              # Core vault module
│       ├── mod.rs           # Module declarations
│       ├── vault_service.rs # Main service — lifecycle, CRUD, settings, history (496 lines)
│       ├── commands.rs      # Tauri #[command] handlers (thin wrappers)
│       ├── types.rs         # Domain types (Cipher, FileEntry, Manifest, etc.)
│       ├── crypto.rs        # KDF, encrypt/decrypt (AES-GCM + ChaCha20-Poly1305)
│       ├── compression.rs   # MIME-aware Zstd compress/decompress
│       ├── index.rs         # Encrypted file metadata index store
│       ├── search.rs        # Encrypted full-text search index
│       ├── history.rs       # Version history + content snapshots
│       ├── settings.rs      # Scoped encrypted settings store
│       ├── errors.rs        # VaultError enum (thiserror)
│       └── README.md        # Vault module documentation
│
├── capabilities/
│   └── default.json        # Tauri capability permissions
│
├── icons/                  # App icons (various sizes)
└── gen/                    # Tauri auto-generated schemas
```

## Key Locations

| What               | Path                                   |
| ------------------ | -------------------------------------- |
| App entry (Rust)   | `src-tauri/src/main.rs`                |
| App entry (React)  | `src/main.tsx`                         |
| All Tauri commands | `src-tauri/src/vault/commands.rs`      |
| Core vault logic   | `src-tauri/src/vault/vault_service.rs` |
| Cryptography       | `src-tauri/src/vault/crypto.rs`        |
| Design tokens      | `src/App.css`                          |
| Module interface   | `src/modules/types.d.ts`               |
| Module registry    | `src/modules/index.ts`                 |
| IPC service        | `src/services/VaultService.ts`         |
| Global state       | `src/store/appStore.ts`                |
| Service DI         | `src/hooks/useServices.tsx`            |

## Naming Conventions

- **Files**: PascalCase for React components (`VaultService.ts`, `Topbar.tsx`), snake_case for Rust (`vault_service.rs`)
- **Directories**: lowercase (`modules/`, `services/`, `vault/`)
- **Barrel exports**: `index.ts` in each directory
- **Module structure**: `<module>/desktop/` + `<module>/shared/` pattern
- **Tests**: Co-located mirror under `src/tests/` (e.g., `tests/services/VaultService.test.ts`)

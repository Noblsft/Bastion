<!-- GSD:project-start source:PROJECT.md -->

## Project

**Bastion**

Bastion is a secure, offline-first desktop vault application built with Tauri (Rust + React). It encrypts all user data at rest using AES-256-GCM or ChaCha20-Poly1305 with Argon2id key derivation. The app is organized as a modular system where each module provides a different secure workspace — the current milestone adds a full-featured encrypted notes module.

**Core Value:** Every piece of user data — notes, files, metadata, search indexes — is encrypted at rest with zero key material exposure to the frontend. Security is non-negotiable.

### Constraints

- **Tech stack**: Must use existing Tauri v2 + Rust + React architecture — no framework changes
- **Security**: All note content must flow through existing AEAD encryption pipeline — no plaintext storage
- **Offline**: No network calls, no cloud dependencies
- **Module pattern**: Must follow existing Module interface (`{ name, Icon, Sidebar, Workspace, useStore }`)
- **Storage**: Notes stored as encrypted vault files (`.enc`) using existing `VaultService` — no separate database
<!-- GSD:project-end -->

<!-- GSD:stack-start source:codebase/STACK.md -->

## Technology Stack

## Runtime & Languages

| Layer           | Technology     | Version            |
| --------------- | -------------- | ------------------ |
| Desktop shell   | **Tauri**      | v2.10.1            |
| Backend         | **Rust**       | 2021 edition       |
| Frontend        | **React**      | v19.2.3            |
| Type system     | **TypeScript** | ~5.8.3             |
| Bundler         | **Vite**       | v8.0.2             |
| Package manager | **pnpm**       | (lockfile present) |

## Frontend Dependencies

### Core

- `react-router-dom` v7.13.0 — HashRouter-based routing
- `zustand` v5.0.12 — state management (one global store + per-module stores)
- `@emotion/react` v11.14.0 — CSS-in-JS (present but lightly used)

### UI & Styling

- `tailwindcss` v4.2.1 + `@tailwindcss/vite` v4.2.2 — utility-first CSS via Vite plugin
- `shadcn` v4.0.8 + `radix-ui` v1.4.3 — component library (radix-vega style)
- `class-variance-authority` v0.7.1 — variant-based component styling
- `clsx` v2.1.1 + `tailwind-merge` v3.5.0 — className utilities (`cn()` helper)
- `lucide-react` v0.577.0 + `react-icons` v5.5.0 — icon libraries
- `tw-animate-css` v1.4.0 — Tailwind animation utilities
- `@fontsource-variable/inter` v5.2.8 — Inter variable font
- `next-themes` v0.4.6 — dark/light theme toggle

### Tauri Plugins (Frontend)

- `@tauri-apps/api` v2.10.1 — core IPC (`invoke`)
- `@tauri-apps/plugin-dialog` v2.6.0 — native file/save dialogs
- `@tauri-apps/plugin-opener` v2.5.2 — URL/file opener
- `@tauri-apps/plugin-os` v2 — OS detection

## Backend Dependencies (Rust)

### Tauri & Plugins

- `tauri` v2 with `macos-private-api` feature (transparent window, decorationless)
- `tauri-plugin-opener`, `tauri-plugin-dialog`, `tauri-plugin-os` (all v2)

### Cryptography

- `aes-gcm` v0.10 — AES-256-GCM AEAD encryption
- `chacha20poly1305` v0.10 — ChaCha20-Poly1305 AEAD encryption
- `argon2` v0.5 — Argon2id key derivation (OWASP 2023 defaults)
- `sha2` v0.10 — SHA-256 integrity hashing
- `rand` v0.8 — cryptographic RNG (OsRng)
- `zeroize` v1 (with `derive` feature) — secure memory zeroing for keys
- `hex` v0.4 + `base64` v0.22 — encoding utilities

### Data

- `serde` v1 + `serde_json` v1 — serialization/deserialization
- `zstd` v0.13 — Zstandard compression for text content
- `uuid` v1 (v4 feature) — file/version ID generation
- `time` v0.3 (with `serde`, `formatting`) — timestamps

### Error Handling

- `thiserror` v1 — derive macro for `VaultError` enum

## Build Configuration

### TypeScript

- Target: ES2020, JSX: react-jsx, strict mode, `@/*` path alias → `./src/*`

### Vite

- Dev server on port 1420, HMR on 1421
- `@vitejs/plugin-react` + `@tailwindcss/vite`
- `src-tauri/` ignored in watch

### Rust

- Dev: incremental compilation
- Release: LTO, `opt-level = "s"`, `codegen-units = 1`, strip symbols, `panic = "abort"`

### shadcn/ui

- Style: `radix-vega`, base color: `neutral`, CSS variables enabled
- Icon library: lucide, aliases: `@/components`, `@/lib`, `@/hooks`, `@/components/ui`
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->

## Conventions

## Code Style & Formatting

### TypeScript/React

- **Prettier**: semi, singleQuote, jsxSingleQuote, trailingComma "all", printWidth 100, tabWidth 2
- **ESLint**: flat config (`eslint.config.cjs`), TS parser, React + Hooks plugins, Prettier integration
- **Import order**: enforced via `eslint-plugin-import` — builtin → external → internal → parent → sibling → index → type, alphabetized
- **Unused vars**: `@typescript-eslint/no-unused-vars` with `argsIgnorePattern: ^_`
- **shadcn/ui excluded** from linting: `src/components/ui/**` in ESLint ignores

### Rust

- `rustfmt.toml` present (custom formatting rules)
- `cargo clippy` with `-D warnings` — zero clippy warnings enforced
- `cargo fmt` run as part of precommit

## Naming Patterns

| Element          | Convention                       | Example                                  |
| ---------------- | -------------------------------- | ---------------------------------------- |
| React components | PascalCase filenames and exports | `Topbar.tsx`, `GlobalSidebar.tsx`        |
| TS services      | PascalCase class files           | `VaultService.ts`                        |
| TS types         | PascalCase, `.ts` extension      | `types.ts`, `types.d.ts`                 |
| Zustand stores   | camelCase with `use` prefix      | `useAppStore`, `useSigilStore`           |
| Hooks            | camelCase with `use` prefix      | `useServices`                            |
| Rust modules     | snake_case                       | `vault_service.rs`, `history.rs`         |
| Rust types       | PascalCase                       | `VaultService`, `FileEntry`, `MasterKey` |
| Rust commands    | snake*case with `vault*` prefix  | `vault_create_file`, `vault_read_file`   |
| CSS variables    | kebab-case                       | `--background`, `--sidebar-primary`      |

## Architecture Patterns

### Module System

### Service Layer

- Services are plain classes wrapping Tauri `invoke()` calls
- Instantiated via `createServices()` factory
- Injected via React Context (`ServicesProvider` at root)
- Consumed via `useServices()` hook — never imported directly

### State Management

- **Global state**: single `appStore.ts` with Zustand `create()`
- **Module state**: each module has its own Zustand store in `shared/store.ts`
- Module stores are referenced in the `Module` interface via `useStore` field

### Barrel Exports

## Error Handling

### Rust

- `VaultError` enum using `thiserror` with `#[derive(Error)]`
- Implements `serde::Serialize` for Tauri IPC (errors serialized as strings)
- Variants: `Io`, `Json`, `Crypto`, `Compression`, `WrongPassphrase`, `NotOpen`, `FileNotFound`, `InvalidPath`, `InvalidFormat`, `VersionNotFound`

### TypeScript

- Service methods return `Promise<T>` — errors propagate as rejected promises from `invoke()`
- `useServices()` throws if called outside `ServicesProvider`

## Git Practices

### Commits

- **Conventional Commits** enforced via commitlint (`@commitlint/config-conventional`)
- Git hooks managed by Husky v9
- `pre-commit`: runs `pnpm run precommit` → lint:fix + format + lint:rust + format:rust
- `commit-msg`: runs commitlint validation

### Lint-Staged

- `*.{js,cjs,mjs,ts,tsx}` → ESLint fix + Prettier
- `*.{json,md,yml,yaml}` → Prettier

## CSS & Theming

### Design Token System

- OKLCH color space for all design tokens (defined in `src/App.css`)
- Light and dark themes via `.dark` class (CSS custom properties)
- shadcn semantic tokens: `--background`, `--foreground`, `--primary`, `--secondary`, `--muted`, `--accent`, `--destructive`, `--border`, `--input`, `--ring`
- Sidebar-specific tokens: `--sidebar`, `--sidebar-foreground`, `--sidebar-primary`, etc.
- Custom `@theme inline` block maps CSS vars to Tailwind color tokens
- Font: Inter Variable (via `@fontsource-variable/inter`)
- Radius scale: `--radius` base with multiplied variants (sm through 4xl)
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->

## Architecture

## Pattern

- **Rust backend** (`src-tauri/`) — all security-critical logic: cryptography, key management, file storage, search indexing, versioning. No key material ever crosses the IPC boundary.
- **React frontend** (`src/`) — UI only. Communicates with the backend exclusively via Tauri `invoke()` commands.

## Layers

```

```

## Data Flow

### Vault Creation

### File Write

### File Read

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

<!-- GSD:architecture-end -->

<!-- GSD:workflow-start source:GSD defaults -->

## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:

- `/gsd-quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd-debug` for investigation and bug fixing
- `/gsd-execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.

<!-- GSD:workflow-end -->

<!-- GSD:profile-start -->

## Developer Profile

> Profile not yet configured. Run `/gsd-profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.

<!-- GSD:profile-end -->

# Technology Stack

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

# Conventions

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

Each module follows a strict structure:

```
modules/<name>/
├── index.tsx         # Module export implementing Module interface
├── desktop/          # Desktop-specific UI (Icon, Sidebar, Workspace)
│   ├── Icon.tsx
│   ├── Sidebar.tsx
│   └── Workspace.tsx
└── shared/           # Cross-platform logic
    └── store.ts      # Zustand store
```

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

Every directory uses `index.ts` barrel files for clean imports:

```typescript
import { Topbar, GlobalSidebar } from '@/components';
import { moduleRegistry } from '@/modules';
import { Start, Home } from '@/pages';
```

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

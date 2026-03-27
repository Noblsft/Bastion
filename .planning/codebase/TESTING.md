# Testing

## Framework & Configuration

| Aspect           | Value                                      |
| ---------------- | ------------------------------------------ |
| Framework        | Jest v30.2.0                               |
| Preset           | ts-jest (TypeScript support)               |
| Environment      | jsdom (DOM simulation)                     |
| Test match       | `**/?(*.)+(spec\|test).(ts\|tsx\|js\|jsx)` |
| Setup file       | `src/tests/setupTests.ts`                  |
| Path aliases     | `@/*` → `<rootDir>/src/*`                  |
| CSS mocking      | `identity-obj-proxy` for CSS imports       |
| Auto-clear mocks | Enabled (`clearMocks: true`)               |

### Additional Libraries

- `@testing-library/react` v16.3.1 — React component rendering and queries
- `@testing-library/jest-dom` v6.9.1 — custom matchers (`toBeInTheDocument`, etc.)

## Test Structure

Tests are organized under `src/tests/`, mirroring the source structure:

```
src/tests/
├── setupTests.ts                  # @testing-library/jest-dom import
├── hooks/
│   └── useServices.test.tsx       # Tests for the services context hook
└── services/
    └── VaultService.test.ts       # Tests for VaultService invoke() wrapper
```

## Commands

| Command        | Description                        |
| -------------- | ---------------------------------- |
| `pnpm test`    | Run all Jest tests                 |
| `pnpm test:ci` | Run tests in CI mode (`--ci` flag) |

## Current Coverage

### What's Tested

- **`useServices` hook**: context provider integration, error when used outside provider
- **`VaultService`**: Tauri `invoke()` call wrappers (likely mocking `@tauri-apps/api/core`)

### What's Not Tested

- **Rust backend**: no Rust unit tests found in `src-tauri/` (no `#[cfg(test)]` modules or `tests/` directory)
- **React components**: no component tests for Topbar, Sidebar, Workspace, pages
- **Module system**: no tests for the module registry or Sigil module
- **Integration tests**: no end-to-end tests

## Mocking Strategy

- CSS modules are mocked via `identity-obj-proxy` (returns class name strings)
- Tauri `invoke()` is likely mocked in service tests (standard pattern for Tauri apps)
- `clearMocks: true` ensures clean mock state between tests

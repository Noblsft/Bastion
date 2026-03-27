# Bastion

## What This Is

Bastion is a secure, offline-first desktop vault application built with Tauri (Rust + React). It encrypts all user data at rest using AES-256-GCM or ChaCha20-Poly1305 with Argon2id key derivation. The app is organized as a modular system where each module provides a different secure workspace — the current milestone adds a full-featured encrypted notes module.

## Core Value

Every piece of user data — notes, files, metadata, search indexes — is encrypted at rest with zero key material exposure to the frontend. Security is non-negotiable.

## Requirements

### Validated

<!-- Shipped and confirmed valuable. Inferred from existing codebase. -->

- ✓ Vault lifecycle (create, open, close with passphrase) — existing
- ✓ AES-256-GCM and ChaCha20-Poly1305 AEAD encryption — existing
- ✓ Argon2id key derivation (OWASP 2023 defaults) — existing
- ✓ Encrypted file CRUD (create, read, update, delete) — existing
- ✓ Encrypted full-text search index — existing
- ✓ File metadata index with encrypted storage — existing
- ✓ MIME-aware Zstd compression — existing
- ✓ Version history with content snapshots — existing
- ✓ Scoped settings (global + per-app) — existing
- ✓ Module system with registry pattern — existing
- ✓ Desktop shell (topbar, sidebar, workspace layout) — existing
- ✓ Notes module registered with Icon, Sidebar, Workspace — Validated in Phase 1
- ✓ React Error Boundary wrapping Notes workspace — Validated in Phase 1
- ✓ useNotesStore (Zustand) for Notes UI state — Validated in Phase 1
- ✓ Native file/save dialogs via Tauri plugins — existing
- ✓ Dark/light theme support — existing

### Active

<!-- Current scope — Notes Module (Milestone 1) -->

- [ ] WYSIWYG block-based note editor (Notion-style) with raw markdown toggle
- [ ] Tree-structured note organization (folders and documents in sidebar)
- [ ] "/" slash command system for inserting blocks
- [ ] Rich text formatting (bold, italic, underline, superscript, subscript)
- [ ] Extended markdown tables with cell merging
- [ ] Syntax-highlighted embedded code blocks
- [ ] Nested lists (ordered and unordered, multi-level)
- [ ] Media embeddings in notes (images, files) via slash commands
- [ ] Page breaks for print/export layout
- [ ] Export notes to PDF format
- [ ] Export notes to DOCX format
- [ ] Version history filtered to notes module (using vault's existing system)
- [ ] All note content encrypted through vault's existing crypto layer

### Out of Scope

- Drawing/pen input — deferred to future version (requires mobile/tablet platform support)
- Real-time collaboration — Bastion is offline-first, single-user
- Cloud sync — contradicts offline-first, zero-trust security model
- Mobile/tablet app — desktop-only for this milestone
- Nested sub-pages (Notion-style page-within-a-page) — tree structure with folders covers organization needs
- OAuth/external auth — local passphrase-only authentication

## Context

Bastion has a working foundation: Tauri v2 desktop shell, Rust backend with full cryptographic pipeline, React frontend with Zustand state management, and a module system designed for extensibility. Currently only one module (Sigil — a placeholder password manager) exists. The notes module will be the second registered module and the first fully-featured one.

The existing vault backend already handles encrypted file storage, versioning, and search. The notes module will leverage these capabilities — note documents are vault files with specific MIME types, their content flows through the same encrypt/decrypt/compress pipeline.

The editor needs to be block-based (Notion-style WYSIWYG) but must store content as markdown internally for portability and the raw-edit toggle. This implies a rich-text editor framework (e.g., Tiptap/ProseMirror or similar) that can serialize to/from markdown.

Key technical considerations from codebase analysis:

- Index currently does O(n) scans — may need optimization as note count grows
- Search index loaded entirely into memory — acceptable for notes but worth monitoring
- CSP is currently null — should be addressed for security hardening
- Notes module registered with Error Boundary — Phase 1 complete

## Constraints

- **Tech stack**: Must use existing Tauri v2 + Rust + React architecture — no framework changes
- **Security**: All note content must flow through existing AEAD encryption pipeline — no plaintext storage
- **Offline**: No network calls, no cloud dependencies
- **Module pattern**: Must follow existing Module interface (`{ name, Icon, Sidebar, Workspace, useStore }`)
- **Storage**: Notes stored as encrypted vault files (`.enc`) using existing `VaultService` — no separate database

## Key Decisions

| Decision                                    | Rationale                                                    | Outcome   |
| ------------------------------------------- | ------------------------------------------------------------ | --------- |
| WYSIWYG block editor with markdown toggle   | Best UX for most users, power-user escape hatch for markdown | — Pending |
| Drop drawing/pen for v1                     | Requires mobile/tablet platform; focus on core editor first  | — Pending |
| Use vault's existing file storage for notes | Consistent security model, no new storage layer needed       | — Pending |
| "/" slash command for block insertion       | Familiar Notion-like UX, discoverable                        | — Pending |
| Page breaks (not sub-pages)                 | Print/export fidelity; tree structure handles organization   | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):

1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):

1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---

_Last updated: 2026-03-27 after Phase 1 completion_

# Research Summary — Bastion Notes Module

## Stack Recommendation

**Tiptap v3** (ProseMirror-based, headless, React-first) is the clear choice for the block editor. It provides:

- WYSIWYG editing with JSON document model
- `@tiptap/markdown` for bidirectional markdown serialization
- Open-source extensions for tables (with cell merging), code blocks, slash commands
- Headless architecture matching Bastion's custom design system

**Export:** `@docen/export-docx` for DOCX (supports colspan/rowspan). PDF via Tauri webview print-to-PDF for best fidelity.

## Table Stakes

Users expect: rich text formatting, headings, lists (nested), code blocks, undo/redo, keyboard shortcuts, folder organization, search, auto-save, dark/light theme. All achievable with Tiptap's built-in extensions.

## Key Differentiators

What makes Bastion Notes stand out:

- **Everything encrypted** — same AEAD encryption as vault (AES-256-GCM / ChaCha20-Poly1305)
- **"/" slash commands** — Notion-style block insertion
- **Advanced tables** — cell merging via Tiptap's table extension
- **WYSIWYG + markdown toggle** — power-user flexibility
- **PDF/DOCX export** — from encrypted source, a unique capability
- **Offline-first, zero-cloud** — no network calls, ever

## Watch Out For

1. **Editor state ≠ React state** — let ProseMirror own document, Zustand owns UI only
2. **Markdown round-trip fidelity** — some features (cell merging, superscript) won't survive MD serialization. Store Tiptap JSON as canonical, markdown as export.
3. **PDF quality** — avoid html2canvas; use Tauri's print-to-PDF or Rust-side rendering
4. **Index scalability** — vault loads full index per operation; cache in memory during session
5. **Missing error boundaries** — wrap editor in React ErrorBoundary before anything else
6. **CSP is null** — security gap when rendering pasted/imported HTML content

## Architecture Summary

Notes module fits cleanly into existing Bastion architecture:

- Notes are vault files (MIME `text/markdown`, app_id `"notes"`)
- Folder structure stored as encrypted JSON metadata file
- No new storage layer — leverages existing `VaultService` entirely
- Editor lives in `NotesWorkspace`, tree in `NotesSidebar`
- `useNotesStore` (Zustand) manages UI state only

## Build Order (Dependencies-First)

1. Module skeleton + error boundaries
2. Note CRUD via VaultService
3. Folder tree sidebar
4. Tiptap editor core
5. Rich formatting + tables + code blocks
6. Slash commands + media embedding
7. Markdown toggle
8. Page breaks + export (PDF/DOCX)
9. Version history UI

---

_Research completed: 2026-03-27_

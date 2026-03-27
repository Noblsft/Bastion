# Roadmap: Bastion Notes Module

**Created:** 2026-03-27
**Milestone:** v1 — Encrypted Notes Module
**Granularity:** Standard (7 phases)

## Overview

| #   | Phase             | Goal                                                                 | Requirements                     | Success Criteria |
| --- | ----------------- | -------------------------------------------------------------------- | -------------------------------- | ---------------- |
| 1   | Module Foundation | Register notes module with shell components and error handling       | MOD-01, MOD-02, MOD-03           | 3                |
| 2   | Note CRUD         | Create, read, update, delete notes through vault's encrypted storage | NOTE-01–05, NOTE-09              | 4                |
| 3   | Folder Tree       | Hierarchical folder organization with drag-and-drop                  | NOTE-06, NOTE-07, NOTE-08        | 3                |
| 4   | Editor Core       | Tiptap WYSIWYG editor with rich text formatting and toolbar          | EDIT-01–06, EDIT-14–16           | 5                |
| 5   | Advanced Blocks   | Code blocks, tables, slash commands, and media embedding             | EDIT-07–11                       | 4                |
| 6   | Export & Markdown | PDF/DOCX export, page breaks, and markdown source toggle             | EDIT-12, EDIT-13, EXP-01, EXP-02 | 4                |
| 7   | Version History   | Note-specific history viewing, preview, and revert                   | HIST-01, HIST-02, HIST-03        | 3                |

---

## Phase Details

### Phase 1: Module Foundation

**Goal:** Register the Notes module in Bastion's module system with sidebar, workspace, icon, and error boundaries.
**Requirements:** MOD-01, MOD-02, MOD-03
**UI hint:** yes

**Success criteria:**

1. Notes module appears in sidebar module switcher with dedicated icon
2. Selecting Notes module renders NotesSidebar and NotesWorkspace
3. `useNotesStore` initializes and persists UI state (active note, open folders)
4. Editor crash is caught by Error Boundary and shows fallback UI

**Dependencies:** None (first phase)

---

### Phase 2: Note CRUD

**Goal:** Users can create, open, edit, save, rename, and delete notes — all encrypted through the vault.
**Requirements:** NOTE-01, NOTE-02, NOTE-03, NOTE-04, NOTE-05, NOTE-09
**UI hint:** yes

**Success criteria:**

1. User can create a new note from the sidebar (stored as encrypted vault file with MIME `text/markdown`, app_id `"notes"`)
2. User can open a note and see its content loaded/decrypted from vault
3. Note content auto-saves on debounced change (encrypt + write to vault)
4. User can rename and delete notes with confirmation

**Dependencies:** Phase 1

---

### Phase 3: Folder Tree

**Goal:** Users can organize notes in a tree structure with folders, including drag-and-drop reordering.
**Requirements:** NOTE-06, NOTE-07, NOTE-08
**UI hint:** yes

**Success criteria:**

1. Sidebar shows expandable/collapsible folder tree with notes nested inside
2. User can create, rename, and delete folders
3. User can drag notes between folders (tree state persisted as encrypted metadata)

**Dependencies:** Phase 2

---

### Phase 4: Editor Core

**Goal:** Full WYSIWYG block editor with Tiptap v3 — rich text formatting, headings, lists, blockquotes, and toolbar.
**Requirements:** EDIT-01, EDIT-02, EDIT-03, EDIT-04, EDIT-05, EDIT-06, EDIT-14, EDIT-15, EDIT-16
**UI hint:** yes

**Success criteria:**

1. Tiptap editor loads in workspace with clean, themed UI matching Bastion design
2. Toolbar provides controls for bold, italic, underline, super/subscript, headings, lists, blockquotes
3. Keyboard shortcuts work for all formatting options (Ctrl+B, Ctrl+I, etc.)
4. Undo/redo works via Ctrl+Z / Ctrl+Shift+Z
5. Editor content serializes to markdown for storage via `@tiptap/markdown`

**Dependencies:** Phase 2 (note loading/saving)

---

### Phase 5: Advanced Blocks

**Goal:** Code blocks with syntax highlighting, tables with cell merging, slash commands, and media embedding.
**Requirements:** EDIT-07, EDIT-08, EDIT-09, EDIT-10, EDIT-11
**UI hint:** yes

**Success criteria:**

1. Code blocks render with syntax highlighting (language selector dropdown)
2. Tables support adding/removing rows/columns and merging cells
3. "/" key opens a floating command menu with block options (paragraph, heading, code, table, image, file, etc.)
4. Images can be embedded in notes (stored as separate encrypted vault files, referenced by ID)

**Dependencies:** Phase 4

---

### Phase 6: Export & Markdown

**Goal:** Export notes to PDF and DOCX, page breaks for print layout, and toggle to raw markdown source view.
**Requirements:** EDIT-12, EDIT-13, EXP-01, EXP-02
**UI hint:** yes

**Success criteria:**

1. Page break blocks render as visual dividers and produce actual page breaks in export
2. User can toggle between WYSIWYG and raw markdown view (bidirectional)
3. PDF export produces a searchable, well-formatted document with correct page breaks
4. DOCX export preserves formatting, tables, and embedded images

**Dependencies:** Phase 5 (needs all block types for complete export)

---

### Phase 7: Version History

**Goal:** Users can view, preview, and revert to previous versions of their notes.
**Requirements:** HIST-01, HIST-02, HIST-03
**UI hint:** yes

**Success criteria:**

1. History panel shows version list filtered to the active note (from vault's existing history system)
2. User can preview any historical version in a read-only view
3. User can revert to a previous version (creates new snapshot of current before reverting)

**Dependencies:** Phase 2 (note storage), Phase 4 (editor for preview)

---

## Coverage

- **v1 requirements:** 33
- **Mapped to phases:** 33
- **Unmapped:** 0 ✓
- **All phases have success criteria:** ✓

# Architecture Research — Block Editor Notes Module

## Component Boundaries

```
┌─────────────────────────────────────────────────────────┐
│  Notes Module (React)                                    │
│                                                          │
│  ┌──────────────┐  ┌──────────────────────────────────┐ │
│  │  NotesSidebar│  │  NotesWorkspace                  │ │
│  │              │  │                                  │ │
│  │  ┌─────────┐ │  │  ┌────────────────────────────┐  │ │
│  │  │FolderTree│ │  │  │  TiptapEditor              │  │ │
│  │  │         │ │  │  │  ┌──────────────────────┐  │  │ │
│  │  │ Folders │ │  │  │  │  EditorToolbar       │  │  │ │
│  │  │ └ Notes │ │  │  │  ├──────────────────────┤  │  │ │
│  │  │         │ │  │  │  │  EditorContent       │  │  │ │
│  │  └─────────┘ │  │  │  │  (WYSIWYG blocks)    │  │  │ │
│  │              │  │  │  ├──────────────────────┤  │  │ │
│  │  ┌─────────┐ │  │  │  │  SlashCommandMenu   │  │  │ │
│  │  │Actions  │ │  │  │  │  (floating dropdown) │  │  │ │
│  │  │New Note │ │  │  │  └──────────────────────┘  │  │ │
│  │  │New Folder│ │  │  │                            │  │ │
│  │  └─────────┘ │  │  │  ┌────────────────────────┐│  │ │
│  └──────────────┘  │  │  │  MarkdownSourceView   ││  │ │
│                     │  │  │  (toggle, raw editor) ││  │ │
│                     │  │  └────────────────────────┘│  │ │
│                     │  └────────────────────────────┘  │ │
│                     └──────────────────────────────────┘ │
│                                                          │
│  ┌──────────────────────────────────────────────────────┐│
│  │  useNotesStore (Zustand)                             ││
│  │  - activeNoteId, folders, notes, editorMode          ││
│  │  - openFolders (expanded state)                      ││
│  │  - searchQuery, filteredNotes                        ││
│  └──────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────┘
          │
          │ VaultService.invoke()
          │
┌─────────┼──────────────────────────────────────────────┐
│  Rust Backend (existing)                                │
│         │                                               │
│  ┌──────▼──────────────────────────────────────────┐   │
│  │  VaultService                                    │   │
│  │  - createFile(name, "text/markdown", ...)       │   │
│  │  - readFile(id) → decrypt → raw markdown/JSON   │   │
│  │  - updateFile(id, content)                      │   │
│  │  - listFiles() → filter by appId "notes"       │   │
│  │  - searchFiles(query)                           │   │
│  │  - getHistory(fileId) → note history            │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

## Data Flow

### Note Creation

1. User clicks "New Note" in sidebar
2. `useNotesStore` → `VaultService.createFile(name, "text/markdown", ["notes"], emptyContent)`
3. Rust: compress → encrypt → write `objects/<uuid>.enc`
4. Return `FileEntry` → store adds to tree
5. Editor opens with empty Tiptap document

### Note Editing

1. User types in Tiptap editor
2. Tiptap maintains ProseMirror document (JSON) in memory
3. On debounced change (e.g., 1s idle):
   - Serialize Tiptap JSON → markdown string via `@tiptap/markdown`
   - `VaultService.updateFile(noteId, markdownBytes)`
   - Rust: compress → encrypt → overwrite `objects/<uuid>.enc`
   - Update search index with extracted text

### Markdown Toggle

1. User clicks "View Source" toggle
2. Current Tiptap JSON → serialize to markdown string
3. Switch view to CodeMirror/textarea showing raw markdown
4. On toggle back: parse markdown → Tiptap JSON → load into editor

### Export (PDF)

1. User triggers export from menu
2. Render Tiptap content to HTML with print styles
3. Use Tauri's webview print-to-PDF or Rust-side rendering
4. Save via native file dialog

### Export (DOCX)

1. User triggers export from menu
2. Convert Tiptap JSON → DOCX using `@docen/export-docx`
3. Generate `.docx` blob client-side
4. Save via native file dialog

## Storage Model

Notes are **vault files** with MIME type `text/markdown` and app ID `"notes"`. No new storage layer needed.

### File Metadata (in vault's encrypted index)

```json
{
  "id": "uuid",
  "name": "My Note.md",
  "mime_type": "text/markdown",
  "app_ids": ["notes"],
  "created_at": "2026-03-27T...",
  "updated_at": "2026-03-27T...",
  "size": 4096,
  "hash": "sha256hex"
}
```

### Folder Structure

Stored as a separate vault file (JSON, app ID `"notes-meta"`):

```json
{
  "tree": [
    { "id": "folder-1", "name": "Work", "children": ["note-uuid-1", "note-uuid-2"] },
    { "id": "folder-2", "name": "Personal", "children": ["note-uuid-3"] }
  ],
  "rootNotes": ["note-uuid-4"]
}
```

This metadata file is encrypted alongside everything else.

## Suggested Build Order

1. **Module skeleton** — register Notes module, sidebar + workspace shell
2. **Note CRUD** — create/read/update/delete via VaultService
3. **Folder tree** — sidebar tree component, folder structure metadata
4. **Editor core** — Tiptap integration, basic text editing
5. **Rich formatting** — bold, italic, underline, headings, lists
6. **Tables** — table extension with cell merging
7. **Code blocks** — syntax-highlighted code blocks
8. **Slash commands** — "/" menu for block insertion
9. **Media embedding** — image/file blocks stored in vault
10. **Markdown toggle** — bidirectional markdown ↔ WYSIWYG
11. **Page breaks** — custom node for print layout
12. **Export** — PDF and DOCX pipelines
13. **History** — filtered version history UI

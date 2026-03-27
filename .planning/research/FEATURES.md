# Features Research — Encrypted Notes Module

## Table Stakes (must-have or users leave)

Users of note-taking apps expect these. Missing any = feels broken.

| Feature                                        | Complexity | Notes                                   |
| ---------------------------------------------- | ---------- | --------------------------------------- |
| Rich text formatting (bold, italic, underline) | Low        | Standard marks in Tiptap                |
| Headings (H1–H6)                               | Low        | Built-in Tiptap node                    |
| Ordered and unordered lists                    | Low        | Built-in, needs nesting support         |
| Nested lists (multi-level)                     | Medium     | Requires `ListItem` + indent handling   |
| Code blocks with syntax highlighting           | Medium     | `code-block-lowlight` extension         |
| Block-level content (paragraphs, blockquotes)  | Low        | Built-in                                |
| Undo / Redo                                    | Low        | Built into ProseMirror                  |
| Keyboard shortcuts                             | Low        | Tiptap provides defaults                |
| Folder/tree organization                       | Medium     | Sidebar component + recursive file tree |
| Search within notes                            | Medium     | Leverage existing vault search index    |
| Auto-save                                      | Low        | Save on debounced content change        |
| Dark/light theme                               | Low        | Already in Bastion                      |

## Differentiators (competitive advantage)

| Feature                           | Complexity | Notes                                      |
| --------------------------------- | ---------- | ------------------------------------------ |
| "/" slash commands                | Medium     | `@tiptap/suggestion` extension             |
| Advanced tables with cell merging | High       | `@tiptap/extension-table` + merge commands |
| WYSIWYG with raw markdown toggle  | Medium     | Tiptap + `@tiptap/markdown` bidirectional  |
| Superscript / subscript           | Low        | Dedicated Tiptap extensions                |
| Media embedding (images, files)   | Medium     | Custom block nodes + vault file storage    |
| Page breaks for print/export      | Medium     | Custom node + CSS `page-break-after`       |
| PDF export                        | High       | Requires layout engine or print-to-PDF     |
| DOCX export                       | High       | ProseMirror JSON → DOCX pipeline           |
| Version history (per-note)        | Medium     | Integrate with vault's existing system     |
| Encryption at rest                | Low        | Already handled by vault — free for notes  |

## Anti-Features (deliberately NOT building)

| Feature                       | Reason                                |
| ----------------------------- | ------------------------------------- |
| Real-time collaboration       | Bastion is offline-first, single-user |
| Cloud sync                    | Contradicts security model            |
| AI-powered suggestions        | Out of scope for v1, privacy concerns |
| Database views (Notion-style) | Not a notes feature, separate module  |
| Kanban boards                 | Separate module territory             |
| Calendar/timeline views       | Separate module territory             |
| comments/annotations          | Single-user app, no audience          |
| Template gallery              | v2 feature, not core                  |

## Dependencies Between Features

```
Folder tree ──► Note CRUD ──► Editor core
                                 │
                    ┌────────────┼────────────┐
                    ▼            ▼            ▼
              Rich text    Code blocks    Tables
                    │            │            │
                    ▼            ▼            ▼
              Slash cmds   Syntax HL    Cell merging
                    │
                    ▼
              Media embeds ──► File storage (vault)
                    │
                    ▼
              Page breaks ──► Export (PDF/DOCX)

Version history ◄── Note CRUD (uses vault snapshots)
Markdown toggle ◄── Editor core + @tiptap/markdown
```

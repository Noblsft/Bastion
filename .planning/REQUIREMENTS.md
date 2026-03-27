# Requirements: Bastion Notes Module

**Defined:** 2026-03-27
**Core Value:** Every piece of user data — notes, files, metadata, search indexes — is encrypted at rest with zero key material exposure to the frontend.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Module Core

- [ ] **MOD-01**: Notes module registered in module system with Icon, Sidebar, Workspace
- [ ] **MOD-02**: React Error Boundary wrapping editor components
- [ ] **MOD-03**: `useNotesStore` (Zustand) for UI state management

### Note Management

- [ ] **NOTE-01**: User can create a new note
- [ ] **NOTE-02**: User can read/open an existing note
- [ ] **NOTE-03**: User can update note content (auto-save on debounced change)
- [ ] **NOTE-04**: User can delete a note
- [ ] **NOTE-05**: User can rename a note
- [ ] **NOTE-06**: User can organize notes in folders (tree structure)
- [ ] **NOTE-07**: User can create, rename, and delete folders
- [ ] **NOTE-08**: User can drag notes between folders
- [ ] **NOTE-09**: All note content encrypted via vault's existing crypto

### Editor

- [ ] **EDIT-01**: WYSIWYG block editor (Tiptap v3) with intuitive editing
- [ ] **EDIT-02**: Bold, italic, underline formatting
- [ ] **EDIT-03**: Superscript and subscript formatting
- [ ] **EDIT-04**: Headings (H1–H6)
- [ ] **EDIT-05**: Ordered and unordered nested lists
- [ ] **EDIT-06**: Blockquotes
- [ ] **EDIT-07**: Syntax-highlighted code blocks (lowlight)
- [ ] **EDIT-08**: Advanced tables with cell merging
- [ ] **EDIT-09**: "/" slash command menu for inserting blocks
- [ ] **EDIT-10**: Image embedding via slash command (stored in vault)
- [ ] **EDIT-11**: File embedding/attachment via slash command
- [ ] **EDIT-12**: Page breaks for print/export layout
- [ ] **EDIT-13**: Toggle to raw markdown source view
- [ ] **EDIT-14**: Toolbar with formatting controls
- [ ] **EDIT-15**: Undo / Redo
- [ ] **EDIT-16**: Keyboard shortcuts for formatting

### Export

- [ ] **EXP-01**: Export note to PDF format
- [ ] **EXP-02**: Export note to DOCX format

### History

- [ ] **HIST-01**: View version history for a note (filtered from vault history)
- [ ] **HIST-02**: Preview a historical version of a note
- [ ] **HIST-03**: Revert a note to a previous version

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Drawing

- **DRAW-01**: Drawing/pen input for handwritten notes

### Templates

- **TMPL-01**: Note templates (meeting notes, daily journal, etc.)

### Search & Organization

- **SRCH-01**: Advanced search with filters (date, folder, tags)
- **TAG-01**: Note tagging system
- **LINK-01**: Internal note linking (wiki-style [[links]])

### AI

- **AI-01**: AI-powered summarization / editing assistance

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature                       | Reason                                  |
| ----------------------------- | --------------------------------------- |
| Real-time collaboration       | Offline-first, single-user architecture |
| Cloud sync                    | Contradicts zero-trust security model   |
| Database views (Notion-style) | Separate module territory               |
| Kanban boards                 | Separate module territory               |
| Mobile/tablet app             | Desktop-only for this milestone         |
| OAuth/external auth           | Local passphrase-only authentication    |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase   | Status  |
| ----------- | ------- | ------- |
| MOD-01      | Phase 1 | Pending |
| MOD-02      | Phase 1 | Pending |
| MOD-03      | Phase 1 | Pending |
| NOTE-01     | Phase 2 | Pending |
| NOTE-02     | Phase 2 | Pending |
| NOTE-03     | Phase 2 | Pending |
| NOTE-04     | Phase 2 | Pending |
| NOTE-05     | Phase 2 | Pending |
| NOTE-09     | Phase 2 | Pending |
| NOTE-06     | Phase 3 | Pending |
| NOTE-07     | Phase 3 | Pending |
| NOTE-08     | Phase 3 | Pending |
| EDIT-01     | Phase 4 | Pending |
| EDIT-02     | Phase 4 | Pending |
| EDIT-03     | Phase 4 | Pending |
| EDIT-04     | Phase 4 | Pending |
| EDIT-05     | Phase 4 | Pending |
| EDIT-06     | Phase 4 | Pending |
| EDIT-14     | Phase 4 | Pending |
| EDIT-15     | Phase 4 | Pending |
| EDIT-16     | Phase 4 | Pending |
| EDIT-07     | Phase 5 | Pending |
| EDIT-08     | Phase 5 | Pending |
| EDIT-09     | Phase 5 | Pending |
| EDIT-10     | Phase 5 | Pending |
| EDIT-11     | Phase 5 | Pending |
| EDIT-12     | Phase 6 | Pending |
| EDIT-13     | Phase 6 | Pending |
| EXP-01      | Phase 6 | Pending |
| EXP-02      | Phase 6 | Pending |
| HIST-01     | Phase 7 | Pending |
| HIST-02     | Phase 7 | Pending |
| HIST-03     | Phase 7 | Pending |

**Coverage:**

- v1 requirements: 33 total
- Mapped to phases: 33
- Unmapped: 0 ✓

---

_Requirements defined: 2026-03-27_
_Last updated: 2026-03-27 after initial definition_

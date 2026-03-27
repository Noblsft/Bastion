# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-27)

**Core value:** Every piece of user data is encrypted at rest with zero key material exposure to the frontend.
**Current focus:** Phase 1 — Module Foundation

## Current Milestone

**v1 — Encrypted Notes Module**

| Phase | Name              | Status    | Requirements                     |
| ----- | ----------------- | --------- | -------------------------------- |
| 1     | Module Foundation | ○ Pending | MOD-01, MOD-02, MOD-03           |
| 2     | Note CRUD         | ○ Pending | NOTE-01–05, NOTE-09              |
| 3     | Folder Tree       | ○ Pending | NOTE-06, NOTE-07, NOTE-08        |
| 4     | Editor Core       | ○ Pending | EDIT-01–06, EDIT-14–16           |
| 5     | Advanced Blocks   | ○ Pending | EDIT-07–11                       |
| 6     | Export & Markdown | ○ Pending | EDIT-12, EDIT-13, EXP-01, EXP-02 |
| 7     | Version History   | ○ Pending | HIST-01, HIST-02, HIST-03        |

Progress: ░░░░░░░░░░ 0%

## Last Transition

Initialized — 2026-03-27

## Decisions Log

| Date       | Decision                          | Context                                                                  |
| ---------- | --------------------------------- | ------------------------------------------------------------------------ |
| 2026-03-27 | Tiptap v3 as editor framework     | Research: best ProseMirror wrapper for React, headless, markdown support |
| 2026-03-27 | Notes stored as vault files       | Consistent security model, no new storage layer                          |
| 2026-03-27 | WYSIWYG default + markdown toggle | Best UX for most users, power-user escape hatch                          |
| 2026-03-27 | Drawing/pen deferred to v2        | Requires mobile/tablet platform support                                  |

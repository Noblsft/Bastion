# Pitfalls Research — Block Editor Notes Module

## Critical Pitfalls

### 1. Editor State vs React State Conflict

**Risk:** ★★★★★ Critical
**Warning signs:** Excessive re-renders, typing lag, cursor jumping, lost edits
**Prevention:**

- Let Tiptap/ProseMirror own the document state — do NOT mirror it in React state
- Use Tiptap's `onUpdate` callback for side effects (autosave), not for state sync
- Keep `useNotesStore` for UI state (active note, folders, sidebar) — NOT editor content
- Never call `editor.getJSON()` on every keystroke — debounce heavily
  **Phase:** Editor core (Phase 3–4)

### 2. Markdown Serialization Fidelity Loss

**Risk:** ★★★★☆ High
**Warning signs:** Content looks different after toggle round-trip, nested lists broken, table formatting lost
**Prevention:**

- Test bidirectional conversion (JSON → MD → JSON) extensively for every supported block type
- Some features (cell merging, superscript, media embeds) may not survive a markdown round-trip — document which features are WYSIWYG-only
- Consider storing Tiptap JSON as canonical format, markdown as secondary export
- `@tiptap/markdown` handles standard markdown well but custom blocks need custom serializers
  **Phase:** Markdown toggle (Phase 5–6)

### 3. PDF Export Quality

**Risk:** ★★★★☆ High
**Warning signs:** Text not selectable in PDF, images pixelated, page breaks in wrong places, fonts missing
**Prevention:**

- Do NOT use `html2canvas` — it creates images, not searchable PDFs
- Leverage Tauri's webview print-to-PDF capability for best fidelity
- Apply `@media print` CSS rules for page breaks, margins, headers
- Test with tables, code blocks, and embedded images — these break most often
- Custom page break node must map to CSS `page-break-after: always`
  **Phase:** Export (late phase)

### 4. DOCX Export Formatting Gaps

**Risk:** ★★★☆☆ Medium
**Warning signs:** Tables lose merge structure, images missing, lists flatten, fonts differ
**Prevention:**

- Use `@docen/export-docx` which has explicit colspan/rowspan support
- Test with complex tables (merged cells, nested content) early
- Accept some formatting differences — perfect Word fidelity isn't possible client-side
- Provide clear UX expectations (export, not perfect clone)
  **Phase:** Export (late phase)

### 5. Performance with Large Notes

**Risk:** ★★★☆☆ Medium
**Warning signs:** Typing latency > 50ms, scroll jank, high memory usage
**Prevention:**

- Avoid traversing entire document state during transactions
- Use Tiptap's built-in performance best practices (lazy extension loading)
- For very large notes: consider virtualized rendering (advanced, v2 territory)
- Debounce autosave to prevent excessive encrypt-decrypt cycles
- Current vault index does O(n) scan — acceptable for hundreds, watch for thousands
  **Phase:** All phases, but critical during editor core

### 6. Index Scalability with Many Notes

**Risk:** ★★★☆☆ Medium
**Warning signs:** File list loading slowly, search becoming sluggish
**Prevention:**

- Current vault loads/decrypts full `index.enc` on every operation
- For hundreds of notes this is fine; for thousands, consider:
  - Caching decrypted index in memory during vault session
  - Only re-encrypting when dirty (change tracking)
- Monitor as note count grows — this is a known architecture concern
  **Phase:** Note CRUD (early phase)

### 7. Image/Media Storage Size

**Risk:** ★★☆☆☆ Low-Medium
**Warning signs:** Vault size growing fast, autosave slow with large embedded images
**Prevention:**

- Images stored as separate vault files, referenced by ID in note content
- Don't inline base64 images in markdown/JSON — vault can't deduplicate
- Consider compression for images (already have MIME-based Zstd, but images don't compress well)
- Show file size warnings when embedding large media
  **Phase:** Media embedding

### 8. Missing Error Boundaries

**Risk:** ★★★☆☆ Medium
**Warning signs:** Editor crash takes down entire app, white screen on malformed content
**Prevention:**

- Wrap TiptapEditor in React Error Boundary
- Graceful fallback: show raw markdown if editor fails to render
- Already noted in CONCERNS.md — no error boundaries exist in codebase
  **Phase:** Module skeleton (early)

## Non-Obvious Gotchas

- **Tiptap Pro extensions require license** — table cell merging is open source, but some advanced features (like the conversion extensions) are paid. Budget for open-source alternatives.
- **Clipboard paste from Word/web** — content comes in as complex HTML. Tiptap handles basic paste, but tables and formatting can break. Use Tiptap's `transformPasted` hook for cleanup.
- **CSP null** — the app has no Content Security Policy. When rendering user content (especially pasted HTML), this is a risk vector. Should be addressed.
- **Mixed content in vault** — Sigil module files and Notes module files share the same vault index. Filter by `app_ids` consistently.

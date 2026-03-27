# Stack Research — Block Editor for Encrypted Notes

## Recommended Stack

### Editor Framework

| Component             | Recommendation           | Version                 | Confidence |
| --------------------- | ------------------------ | ----------------------- | ---------- |
| **Core editor**       | Tiptap                   | v3.x (stable June 2025) | ★★★★★ High |
| **Underlying engine** | ProseMirror (via Tiptap) | Latest                  | ★★★★★ High |
| **Markdown support**  | `@tiptap/markdown`       | v3.x                    | ★★★★☆ High |

**Why Tiptap:**

- Built on ProseMirror — the most robust document editing engine available
- Headless architecture — full control over UI, matches Bastion's design system
- First-class React integration with hooks and components
- `@tiptap/markdown` extension provides bidirectional markdown serialization
- Mature extension ecosystem (tables, code blocks, lists, slash commands)
- Modular — pay for what you use, tree-shakeable
- Active development (Tiptap 3.0 stable released June 2025)

**Why NOT alternatives:**

- **Raw ProseMirror** — too low-level, massive learning curve for same result
- **Milkdown** — less ergonomic React integration, unconventional patterns
- **Lexical** — Meta's editor, powerful but less mature extension ecosystem for tables/export
- **Slate.js** — toolkit not framework, requires building everything from scratch
- **BlockNote** — simpler but less control over serialization and custom blocks

### Extensions (Tiptap v3)

| Extension                               | Purpose                                 | Type        |
| --------------------------------------- | --------------------------------------- | ----------- |
| `@tiptap/extension-table`               | Tables with cell merging, column resize | Open source |
| `@tiptap/extension-code-block-lowlight` | Syntax-highlighted code blocks          | Open source |
| `@tiptap/extension-superscript`         | Superscript formatting                  | Open source |
| `@tiptap/extension-subscript`           | Subscript formatting                    | Open source |
| `@tiptap/extension-underline`           | Underline formatting                    | Open source |
| `@tiptap/extension-placeholder`         | Placeholder text                        | Open source |
| `@tiptap/markdown`                      | Markdown serialization                  | Open source |
| `@tiptap/suggestion`                    | Slash command framework                 | Open source |

### Export

| Component       | Recommendation                                                   | Confidence   |
| --------------- | ---------------------------------------------------------------- | ------------ |
| **PDF export**  | `@tiptap-pro/extension-export-pdf` OR html-to-pdf via Tauri Rust | ★★★☆☆ Medium |
| **DOCX export** | `@docen/export-docx` or `prosemirror-docx`                       | ★★★☆☆ Medium |

**PDF strategy:** Since Bastion runs in Tauri, leverage Rust-side PDF generation from HTML/markdown. Client-side PDF from `html2canvas` produces poor quality. Consider `weasyprint` pattern or Tauri's webview print-to-PDF capability.

**DOCX strategy:** `@docen/export-docx` supports headings, tables with colspan/rowspan, images, lists, and text formatting — matches Bastion's requirements well. Works client-side directly from Tiptap JSON.

### Syntax Highlighting

| Component       | Recommendation                | Version | Confidence |
| --------------- | ----------------------------- | ------- | ---------- |
| **Highlighter** | lowlight (highlight.js-based) | Latest  | ★★★★★ High |

Used via `@tiptap/extension-code-block-lowlight`. Supports 190+ languages.

## What NOT to Use

- **CKEditor / TinyMCE** — heavy, opinionated, not suitable for embedded desktop apps
- **html2canvas for PDF** — produces images, not selectable text, poor quality
- **docx templating libraries** — designed for server-side batch generation, not interactive export
- **Quill** — deprecated/stale, limited extension API

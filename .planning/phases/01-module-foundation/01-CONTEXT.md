# Phase 1: Module Foundation - Context

**Gathered:** 2026-03-27
**Status:** Ready for planning

<domain>
## Phase Boundary

Register the Notes module in Bastion's module system with a sidebar component, workspace component, module icon, Zustand store (`useNotesStore`), and React Error Boundary wrapping the editor area. This phase delivers the structural skeleton — no note CRUD, no editor, no folder tree.

</domain>

<decisions>
## Implementation Decisions

### Agent's Discretion

All gray areas deferred to agent by user. Decisions below are grounded in existing codebase patterns and conventions.

- **D-01: Module icon** — Use `NotebookPen` from `lucide-react`. The app already imports `lucide-react` (v0.577.0). A lucide icon is consistent with the icon library used elsewhere and clearly communicates "notes/writing." Custom SVG (like Sigil) is unnecessary complexity for a well-represented concept.

- **D-02: Sidebar initial state** — Show the module title ("Notes") and a minimal empty-state message ("No notes yet"). Follow the same structural pattern as Sigil's sidebar (`flex flex-col h-full p-4 space-y-4`) with sidebar design tokens (`text-sidebar-foreground`, `hover:bg-sidebar-accent`). This will be replaced by the folder tree in Phase 3.

- **D-03: Workspace empty state** — Centered text with module name and a muted subtitle ("Select or create a note to get started"). Match the exact pattern from Sigil's `Workspace.tsx` — simple, clean, no illustrations. This will be replaced by the editor in Phase 4.

- **D-04: Error boundary behavior** — Styled fallback matching Bastion's design system. Show an error icon, a "Something went wrong" heading, the error message in muted text, and a "Try Again" button that resets the boundary. No detailed stack traces (security-conscious app). The boundary wraps the Workspace content area so the sidebar remains functional during a crash — users can navigate away and back.

</decisions>

<canonical_refs>

## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Module System

- `src/modules/types.d.ts` — Module interface definition (name, Icon, Sidebar, Workspace, useStore)
- `src/modules/index.ts` — moduleRegistry pattern and ModuleNames type union
- `src/modules/sigil/index.tsx` — Reference module export (follow this exact structure)

### Module Components (Reference Pattern)

- `src/modules/sigil/desktop/Icon.tsx` — Icon component pattern (accepts className prop)
- `src/modules/sigil/desktop/Sidebar.tsx` — Sidebar component pattern (Tailwind + sidebar design tokens)
- `src/modules/sigil/desktop/Workspace.tsx` — Workspace component pattern (centered empty state)
- `src/modules/sigil/shared/store.ts` — Zustand store pattern (create<State>() with actions)

### Integration Points

- `src/store/appStore.ts` — Global state (activeModule defaults to 'sigil', ModuleNames type)
- `src/components/desktop/sidebar/ModulesPanel.tsx` — Module switcher icon strip
- `src/components/desktop/sidebar/ModuleSidebar.tsx` — Per-module sidebar rendering

</canonical_refs>

<code_context>

## Existing Code Insights

### Reusable Assets

- `lucide-react` (v0.577.0) — Use `NotebookPen` icon for module identity
- Sigil module structure — Direct template for file layout: `desktop/Icon.tsx`, `desktop/Sidebar.tsx`, `desktop/Workspace.tsx`, `shared/store.ts`
- shadcn/ui primitives — `button.tsx`, `input.tsx` available for error boundary UI
- `cn()` utility — `clsx` + `tailwind-merge` for conditional classes

### Established Patterns

- Module interface is strict: `{ name, Icon?, Sidebar, Workspace, useStore }`
- Registry is a plain object with lowercase keys — add `notes: Notes` entry
- Zustand stores use `create<State>()((set) => ({...}))` pattern
- Sidebar uses `sidebar-*` design tokens (foreground, accent, accent-foreground)
- Components use Tailwind utility classes exclusively (no CSS-in-JS despite Emotion being installed)

### Integration Points

- `src/modules/index.ts` — Import Notes module and add to `moduleRegistry`
- `src/store/appStore.ts` — `ModuleNames` type auto-updates from registry keys (no manual change needed)
- No router changes needed — Home.tsx already renders `module.Workspace` dynamically

</code_context>

<specifics>
## Specific Ideas

No specific requirements — user deferred all decisions to agent. Standard approaches apply, following Sigil module as the exact template.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

_Phase: 01-module-foundation_
_Context gathered: 2026-03-27_

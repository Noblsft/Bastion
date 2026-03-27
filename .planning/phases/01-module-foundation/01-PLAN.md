---
phase: 01-module-foundation
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/modules/notes/index.tsx
  - src/modules/notes/desktop/Icon.tsx
  - src/modules/notes/desktop/Sidebar.tsx
  - src/modules/notes/desktop/Workspace.tsx
  - src/modules/notes/shared/store.ts
  - src/modules/index.ts
autonomous: true
requirements: [MOD-01, MOD-03]

must_haves:
  truths:
    - 'Notes module appears in sidebar module switcher with NotebookPen icon'
    - 'Selecting Notes module renders NotesSidebar and NotesWorkspace'
    - 'useNotesStore initializes with activeNoteId, openFolderIds, and setter actions'
  artifacts:
    - path: 'src/modules/notes/index.tsx'
      provides: 'Notes module export conforming to Module interface'
      contains: 'export const Notes: Module'
    - path: 'src/modules/notes/desktop/Icon.tsx'
      provides: 'NotebookPen icon wrapper component'
      contains: 'NotebookPen'
    - path: 'src/modules/notes/desktop/Sidebar.tsx'
      provides: 'Notes sidebar with empty state placeholder'
      contains: 'No notes yet'
    - path: 'src/modules/notes/desktop/Workspace.tsx'
      provides: 'Notes workspace with empty state'
      contains: 'Select or create a note'
    - path: 'src/modules/notes/shared/store.ts'
      provides: 'useNotesStore Zustand store'
      contains: 'export const useNotesStore'
    - path: 'src/modules/index.ts'
      provides: 'Notes registered in moduleRegistry'
      contains: 'notes: Notes'
  key_links:
    - from: 'src/modules/notes/index.tsx'
      to: 'src/modules/types.d.ts'
      via: 'implements Module interface'
      pattern: 'Module'
    - from: 'src/modules/index.ts'
      to: 'src/modules/notes/index.tsx'
      via: 'registry import'
      pattern: 'import.*Notes.*from.*notes'
---

<objective>
Create the Notes module structure and register it in the module system.

Purpose: Establish the Notes module as a first-class module in Bastion, visible in the sidebar module switcher, with placeholder Sidebar and Workspace components and a Zustand store for UI state.

Output: 6 files — module entry, icon, sidebar, workspace, store, and updated registry.
</objective>

<execution_context>
@~/.gemini/antigravity/get-shit-done/workflows/execute-plan.md
@~/.gemini/antigravity/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/phases/01-module-foundation/01-CONTEXT.md

<interfaces>
<!-- Key types and contracts the executor needs. Extracted from codebase. -->

From src/modules/types.d.ts:

```typescript
import { ComponentType } from 'react';
import { UseBoundStore, StoreApi } from 'zustand';

export interface Module {
  name: string;
  Icon?: ComponentType<{ className?: string }>;
  Sidebar: ComponentType;
  Workspace: ComponentType;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  useStore: UseBoundStore<StoreApi<any>>;
}
```

From src/modules/index.ts:

```typescript
import { Sigil } from '@/modules/sigil';

export const moduleRegistry = {
  sigil: Sigil,
};

export type ModuleNames = keyof typeof moduleRegistry;
```

From src/modules/sigil/index.tsx (reference pattern):

```typescript
import { Module } from '@/modules/types';
import { Icon } from './desktop/Icon.tsx';
import { Sidebar } from './desktop/Sidebar.tsx';
import { Workspace } from './desktop/Workspace.tsx';
import { useSigilStore } from './shared/store.ts';

export const Sigil: Module = {
  name: 'Sigil',
  Icon,
  Sidebar,
  Workspace,
  useStore: useSigilStore,
};
```

From src/modules/sigil/shared/store.ts (reference pattern):

```typescript
import { create } from 'zustand';

interface SigilState {
  activeSection: 'secrets' | 'settings';
  setActiveSection: (section: SigilState['activeSection']) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export const useSigilStore = create<SigilState>()((set) => ({
  activeSection: 'secrets',
  setActiveSection: (section) => set({ activeSection: section }),
  searchQuery: '',
  setSearchQuery: (query) => set({ searchQuery: query }),
}));
```

</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Create Notes module files (Icon, Sidebar, Workspace, Store, Entry)</name>
  <files>src/modules/notes/desktop/Icon.tsx, src/modules/notes/desktop/Sidebar.tsx, src/modules/notes/desktop/Workspace.tsx, src/modules/notes/shared/store.ts, src/modules/notes/index.tsx</files>
  <read_first>src/modules/sigil/index.tsx, src/modules/sigil/desktop/Icon.tsx, src/modules/sigil/desktop/Sidebar.tsx, src/modules/sigil/desktop/Workspace.tsx, src/modules/sigil/shared/store.ts</read_first>
  <action>
Create 5 files following the exact Sigil module pattern:

**1. `src/modules/notes/desktop/Icon.tsx`** (per D-01 — use NotebookPen from lucide-react):

```tsx
import { NotebookPen } from 'lucide-react';

export function Icon({ className = 'h-6 w-6' }: { className?: string }) {
  return <NotebookPen className={className} />;
}
```

**2. `src/modules/notes/desktop/Sidebar.tsx`** (per D-02 — title + empty-state message):

```tsx
export function Sidebar() {
  return (
    <div className='flex flex-col h-full p-4 space-y-4'>
      <h2 className='font-semibold text-sm text-sidebar-foreground'>Notes</h2>
      <div className='flex-1 flex items-center justify-center'>
        <p className='text-sm text-muted-foreground'>No notes yet</p>
      </div>
    </div>
  );
}
```

**3. `src/modules/notes/desktop/Workspace.tsx`** (per D-03 — centered text with muted subtitle):

```tsx
export function Workspace() {
  return (
    <div className='flex items-center justify-center h-full p-4'>
      <div className='text-center'>
        <h1 className='text-2xl font-semibold mb-2'>Notes</h1>
        <p className='text-muted-foreground'>Select or create a note to get started</p>
      </div>
    </div>
  );
}
```

**4. `src/modules/notes/shared/store.ts`** (per D-03 — Zustand store for UI state):

```typescript
import { create } from 'zustand';

interface NotesState {
  activeNoteId: string | null;
  setActiveNoteId: (id: string | null) => void;
  openFolderIds: Set<string>;
  toggleFolder: (id: string) => void;
}

export const useNotesStore = create<NotesState>()((set) => ({
  activeNoteId: null,
  setActiveNoteId: (id) => set({ activeNoteId: id }),
  openFolderIds: new Set<string>(),
  toggleFolder: (id) =>
    set((state) => {
      const next = new Set(state.openFolderIds);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return { openFolderIds: next };
    }),
}));
```

**5. `src/modules/notes/index.tsx`** (module entry — exact Sigil pattern):

```tsx
import { Module } from '@/modules/types';

import { Icon } from './desktop/Icon.tsx';
import { Sidebar } from './desktop/Sidebar.tsx';
import { Workspace } from './desktop/Workspace.tsx';
import { useNotesStore } from './shared/store.ts';

export const Notes: Module = {
  name: 'Notes',
  Icon,
  Sidebar,
  Workspace,
  useStore: useNotesStore,
};
```

  </action>
  <acceptance_criteria>
    - `src/modules/notes/desktop/Icon.tsx` exists and contains `NotebookPen`
    - `src/modules/notes/desktop/Sidebar.tsx` exists and contains `No notes yet`
    - `src/modules/notes/desktop/Workspace.tsx` exists and contains `Select or create a note to get started`
    - `src/modules/notes/shared/store.ts` exists and contains `export const useNotesStore`
    - `src/modules/notes/shared/store.ts` contains `activeNoteId` and `openFolderIds`
    - `src/modules/notes/index.tsx` exists and contains `export const Notes: Module`
  </acceptance_criteria>
  <verify>
    <automated>test -f src/modules/notes/index.tsx && grep -q "export const Notes: Module" src/modules/notes/index.tsx && grep -q "NotebookPen" src/modules/notes/desktop/Icon.tsx && grep -q "useNotesStore" src/modules/notes/shared/store.ts && echo "PASS" || echo "FAIL"</automated>
  </verify>
  <done>All 5 Notes module files created following Sigil pattern. Icon uses NotebookPen, Sidebar shows empty state, Workspace shows centered text, store has activeNoteId and openFolderIds.</done>
</task>

<task type="auto">
  <name>Task 2: Register Notes module in moduleRegistry</name>
  <files>src/modules/index.ts</files>
  <read_first>src/modules/index.ts</read_first>
  <action>
Update `src/modules/index.ts` to import and register the Notes module:

1. Add import: `import { Notes } from '@/modules/notes';`
2. Add to registry: `notes: Notes,` entry in `moduleRegistry` object

The `ModuleNames` type auto-derives from `keyof typeof moduleRegistry`, so adding the `notes` key automatically makes `'notes'` a valid module name throughout the app (including `appStore.activeModule`).

Final file should look like:

```typescript
import { Notes } from '@/modules/notes';
import { Sigil } from '@/modules/sigil';

export const moduleRegistry = {
  notes: Notes,
  sigil: Sigil,
};

export type ModuleNames = keyof typeof moduleRegistry;
```

Note: imports sorted alphabetically per project's ESLint import order rules.
</action>
<acceptance_criteria> - `src/modules/index.ts` contains `import { Notes } from '@/modules/notes'` - `src/modules/index.ts` contains `notes: Notes` in moduleRegistry - `ModuleNames` type now includes `'notes'` (automatic from keyof)
</acceptance_criteria>
<verify>
<automated>grep -q "notes: Notes" src/modules/index.ts && grep -q "import { Notes }" src/modules/index.ts && echo "PASS" || echo "FAIL"</automated>
</verify>
<done>Notes module registered in moduleRegistry. ModuleNames type automatically includes 'notes'.</done>
</task>

</tasks>

<verification>
1. `npx tsc --noEmit` — TypeScript compiles without errors
2. Notes module appears in sidebar module switcher when app is built
3. Module registration doesn't break existing Sigil module
</verification>

<success_criteria>

- Notes module appears in sidebar module switcher with NotebookPen icon
- Selecting Notes renders the NotesSidebar with "No notes yet" text
- Selecting Notes renders the NotesWorkspace with "Select or create a note to get started"
- useNotesStore tracks activeNoteId and openFolderIds
- Existing Sigil module is unaffected
- TypeScript compiles with no errors
  </success_criteria>

<output>
After completion, create `.planning/phases/01-module-foundation/01-01-SUMMARY.md`
</output>

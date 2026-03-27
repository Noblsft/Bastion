---
phase: 01-module-foundation
plan: 02
type: execute
wave: 1
depends_on: []
files_modified:
  - src/modules/notes/components/NotesErrorBoundary.tsx
autonomous: true
requirements: [MOD-02]

must_haves:
  truths:
    - 'Editor crash is caught by Error Boundary and shows fallback UI'
    - 'Sidebar remains functional when workspace crashes'
    - 'User can retry after a crash via Try Again button'
  artifacts:
    - path: 'src/modules/notes/components/NotesErrorBoundary.tsx'
      provides: 'React Error Boundary for Notes workspace'
      contains: 'class NotesErrorBoundary'
  key_links:
    - from: 'src/modules/notes/components/NotesErrorBoundary.tsx'
      to: 'src/modules/notes/desktop/Workspace.tsx'
      via: 'wraps workspace content'
      pattern: 'NotesErrorBoundary'
---

<objective>
Create a React Error Boundary component for the Notes module.

Purpose: Catch rendering errors in the Notes workspace (especially the future editor) and show a styled fallback UI with a retry button, preventing the entire app from crashing when the editor fails.

Output: 1 file — NotesErrorBoundary component, integrated into the Notes Workspace.
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
<!-- Error Boundary must be a class component (React limitation) -->
<!-- It wraps the workspace content area, NOT the sidebar -->

From src/modules/notes/desktop/Workspace.tsx (created by Plan 01):

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

From src/components/ui/button.tsx (shadcn button available):

```tsx
// shadcn/ui Button component is available for the retry button
```

</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Create NotesErrorBoundary and integrate into Workspace</name>
  <files>src/modules/notes/components/NotesErrorBoundary.tsx, src/modules/notes/desktop/Workspace.tsx</files>
  <read_first>src/modules/notes/desktop/Workspace.tsx, src/components/ui/button.tsx</read_first>
  <action>
**1. Create `src/modules/notes/components/NotesErrorBoundary.tsx`** (per D-04 — styled fallback with retry):

React Error Boundary as a class component (required by React — hooks can't catch render errors). Per D-04:

- Error icon (use `AlertTriangle` from lucide-react)
- "Something went wrong" heading
- Error message in muted text (no stack traces — security-conscious app)
- "Try Again" button using shadcn Button component that resets the boundary state
- Styled to match Bastion's design system (centered, Tailwind utility classes)

```tsx
import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class NotesErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[Notes] Error caught by boundary:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className='flex items-center justify-center h-full p-8'>
          <div className='text-center max-w-md space-y-4'>
            <AlertTriangle className='h-12 w-12 text-destructive mx-auto' />
            <h2 className='text-xl font-semibold'>Something went wrong</h2>
            <p className='text-sm text-muted-foreground'>
              {this.state.error?.message || 'An unexpected error occurred in the Notes editor.'}
            </p>
            <Button onClick={this.handleReset} variant='outline'>
              Try Again
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
```

**2. Update `src/modules/notes/desktop/Workspace.tsx`** to wrap content with the error boundary:

```tsx
import { NotesErrorBoundary } from '../components/NotesErrorBoundary';

export function Workspace() {
  return (
    <NotesErrorBoundary>
      <div className='flex items-center justify-center h-full p-4'>
        <div className='text-center'>
          <h1 className='text-2xl font-semibold mb-2'>Notes</h1>
          <p className='text-muted-foreground'>Select or create a note to get started</p>
        </div>
      </div>
    </NotesErrorBoundary>
  );
}
```

The boundary wraps the workspace content only — the sidebar is rendered separately by the shell, so it remains functional during a crash.
</action>
<acceptance_criteria> - `src/modules/notes/components/NotesErrorBoundary.tsx` exists - File contains `class NotesErrorBoundary extends Component` - File contains `getDerivedStateFromError` - File contains `AlertTriangle` import from lucide-react - File contains `Button` import from `@/components/ui/button` - File contains `Try Again` text - File does NOT contain stack trace rendering (no `error.stack`) - `src/modules/notes/desktop/Workspace.tsx` imports and wraps content with `NotesErrorBoundary`
</acceptance_criteria>
<verify>
<automated>grep -q "class NotesErrorBoundary" src/modules/notes/components/NotesErrorBoundary.tsx && grep -q "getDerivedStateFromError" src/modules/notes/components/NotesErrorBoundary.tsx && grep -q "Try Again" src/modules/notes/components/NotesErrorBoundary.tsx && grep -q "NotesErrorBoundary" src/modules/notes/desktop/Workspace.tsx && ! grep -q "error.stack" src/modules/notes/components/NotesErrorBoundary.tsx && echo "PASS" || echo "FAIL"</automated>
</verify>
<done>NotesErrorBoundary catches render errors, shows styled fallback with AlertTriangle icon and Try Again button. Workspace wraps its content with the boundary. No stack traces exposed.</done>
</task>

</tasks>

<verification>
1. `npx tsc --noEmit` — TypeScript compiles without errors
2. Error boundary catches thrown errors and shows fallback UI
3. Try Again button resets the boundary state
4. Sidebar remains functional during workspace crash
</verification>

<success_criteria>

- NotesErrorBoundary class component exists with getDerivedStateFromError
- Fallback UI shows AlertTriangle icon, "Something went wrong" heading, error message (no stack), Try Again button
- Workspace.tsx wraps content with NotesErrorBoundary
- TypeScript compiles with no errors
  </success_criteria>

<output>
After completion, create `.planning/phases/01-module-foundation/01-02-SUMMARY.md`
</output>

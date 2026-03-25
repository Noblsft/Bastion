import { ComponentType } from 'react';
import { UseBoundStore, StoreApi } from 'zustand';

/**
 * Represents a module in the Bastion app.
 *
 * Each module must implement this interface to be properly integrated into the app.
 * Modules can have platform-specific implementations (desktop, mobile) but must export
 * components that conform to this interface.
 *
 * @example
 * ```TypeScript
 * const myModule: Module = {
 *   name: 'MyModule',
 *   Icon: MyIconComponent,
 *   Sidebar: MySidebarComponent,
 *   Workspace: MyWorkspaceComponent,
 *   useStore: myModuleStore,
 * };
 * ```
 */
export interface Module {
  /**
   * The unique identifier and display name of the module.
   * Should be in PascalCase format (e.g., 'Vault', 'Sigil').
   * This name is used throughout the platform for identification and routing.
   */
  name: string;

  /**
   * Optional React component that renders the icon for this module.
   * This icon is displayed in the modules panel on the left sidebar.
   * Should be a simple icon component, typically 24x24 or 32x32 pixels.
   */
  Icon?: ComponentType<{ className?: string }>;

  /**
   * React component that renders the sidebar/navigation area of the module.
   * This component is displayed in the right panel of the application interface
   * and typically contains navigation links, menus, or quick actions.
   */
  Sidebar: ComponentType;

  /**
   * React component that renders the main workspace/content area of the module.
   * This is the primary content area where users interact with the module's features.
   * The workspace typically receives routing information and displays the main UI.
   */
  Workspace: ComponentType;

  /**
   * Zustand store hook for this module's state.
   * The store is initialized lazily — it is only created when the module is first used.
   * Define the full state shape and actions inside the module's `shared/store.ts` file.
   *
   * @example
   * ```typescript
   * // shared/store.ts
   * export const useMyModuleStore = create<MyModuleState>()((set) => ({ ... }));
   *
   * // index.tsx
   * export const MyModule: Module = { ..., useStore: useMyModuleStore };
   * ```
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  useStore: UseBoundStore<StoreApi<any>>;
}

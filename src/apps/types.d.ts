import { ReactNode, ComponentType } from 'react';

/**
 * Represents an application in the NoblSft platform.
 *
 * Each app must implement this interface to be properly integrated into the platform.
 * Apps can have platform-specific implementations (desktop, mobile) but must export
 * components that conform to this interface.
 *
 * @example
 * ```TypeScript
 * const myApp: App = {
 *   name: 'MyApp',
 *   Sidebar: MySidebarComponent,
 *   Workspace: MyWorkspaceComponent,
 *   Provider: MyProviderComponent,
 * };
 * ```
 */
export interface App {
  /**
   * The unique identifier and display name of the application.
   * Should be in PascalCase format (e.g., 'Vault', 'Sigil').
   * This name is used throughout the platform for identification and routing.
   */
  name: string;

  /**
   * React component that renders the sidebar/navigation area of the application.
   * This component is displayed in the left panel of the application interface
   * and typically contains navigation links, menus, or quick actions.
   */
  Sidebar: ComponentType;

  /**
   * React component that renders the main workspace/content area of the application.
   * This is the primary content area where users interact with the app's features.
   * The workspace typically receives routing information and displays the main UI.
   */
  Workspace: ComponentType;

  /**
   * React context provider component that manages the application's global state.
   * This component wraps the app's Sidebar and Workspace components.
   * Use it to provide shared state, configuration, and utilities to child components.
   *
   * @example
   * ```typescript
   * <Provider>
   *   <Sidebar />
   *   <Workspace />
   * </Provider>
   * ```
   */
  Provider: ComponentType<{ children: ReactNode }>;
}

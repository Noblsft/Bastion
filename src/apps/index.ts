import { Sigil } from '@/apps/sigil';

/**
 * Central registry of all available applications in the NoblSft platform.
 *
 * This object maps application identifiers (keys) to their App implementations (values).
 * Each app must implement the {@link App} interface to be included in the registry.
 *
 * The registry is used throughout the platform for:
 * - Application routing and navigation
 * - Dynamic app loading and instantiation
 * - App discovery and enumeration
 * - Type-safe app references
 *
 * @example
 * ```TypeScript
 * // Access an app from the registry
 * const sigilApp = appRegistry.sigil;
 *
 * // Iterate through all registered apps
 * Object.entries(appRegistry).forEach(([id, app]) => {
 *   console.log(`App: ${app.name} (${id})`);
 * });
 *
 * // Get all app IDs
 * const appIds = Object.keys(appRegistry);
 * ```
 *
 * @remarks
 * - Keys should be lowercase identifiers (e.g., 'sigil', 'vault')
 * - Values must conform to the {@link App} interface
 * - When adding a new app, import it and add an entry to this registry
 *
 * @see {@link App} - The interface that all apps must implement
 */
export const appRegistry = {
  sigil: Sigil,
};

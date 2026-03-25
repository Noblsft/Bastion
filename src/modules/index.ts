import { Sigil } from '@/modules/sigil';

/**
 * Central registry of all available modules in the NoblSft platform.
 *
 * This object maps module identifiers (keys) to their Module implementations (values).
 * Each module must implement the {@link Module} interface to be included in the registry.
 *
 * The registry is used throughout the platform for:
 * - Module routing and navigation
 * - Dynamic module loading and instantiation
 * - Module discovery and enumeration
 * - Type-safe module references
 *
 * @example
 * ```TypeScript
 * // Access a module from the registry
 * const sigilModule = moduleRegistry.sigil;
 *
 * // Iterate through all registered modules
 * Object.entries(moduleRegistry).forEach(([id, module]) => {
 *   console.log(`Module: ${module.name} (${id})`);
 * });
 *
 * // Get all module IDs
 * const moduleIds = Object.keys(moduleRegistry);
 * ```
 *
 * @remarks
 * - Keys should be lowercase identifiers (e.g., 'sigil', 'vault')
 * - Values must conform to the {@link Module} interface
 * - When adding a new module, import it and add an entry to this registry
 *
 * @see {@link Module} - The interface that all modules must implement
 */
export const moduleRegistry = {
  sigil: Sigil,
};

/** Union of all registered module IDs. */
export type ModuleNames = keyof typeof moduleRegistry;

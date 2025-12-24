/**
 * Harness Adapter Registry
 *
 * Central registry for all harness adapters. Provides discovery,
 * lookup, and batch operations across adapters.
 */

import type { AgentStory } from '@/lib/schemas/story';
import type {
  HarnessAdapter,
  HarnessAdapterInfo,
  AdapterCompatibilityMap,
  HarnessExportOptions,
  HarnessExportResult,
} from './types';

// ============================================================================
// Registry State
// ============================================================================

// Adapters are registered here. Each adapter module calls registerAdapter().
const ADAPTERS: Map<string, HarnessAdapter> = new Map();

// ============================================================================
// Registration
// ============================================================================

/**
 * Register a harness adapter with the registry.
 * Called by each adapter module during initialization.
 */
export function registerAdapter(adapter: HarnessAdapter): void {
  if (ADAPTERS.has(adapter.id)) {
    console.warn(`Harness adapter "${adapter.id}" is already registered. Overwriting.`);
  }
  ADAPTERS.set(adapter.id, adapter);
}

/**
 * Unregister an adapter (primarily for testing).
 */
export function unregisterAdapter(id: string): boolean {
  return ADAPTERS.delete(id);
}

// ============================================================================
// Discovery
// ============================================================================

/**
 * Get all registered adapters.
 */
export function getAdapters(): HarnessAdapter[] {
  return Array.from(ADAPTERS.values());
}

/**
 * Get adapter metadata for UI display.
 */
export function getAdapterInfoList(): HarnessAdapterInfo[] {
  return getAdapters().map((adapter) => ({
    id: adapter.id,
    name: adapter.name,
    description: adapter.description,
    icon: adapter.icon,
    url: adapter.url,
  }));
}

/**
 * Get a specific adapter by ID.
 */
export function getAdapter(id: string): HarnessAdapter | null {
  return ADAPTERS.get(id) || null;
}

/**
 * Check if an adapter is registered.
 */
export function hasAdapter(id: string): boolean {
  return ADAPTERS.has(id);
}

// ============================================================================
// Compatibility Checking
// ============================================================================

/**
 * Check compatibility of a story with all registered adapters.
 */
export function checkAllCompatibility(story: AgentStory): AdapterCompatibilityMap {
  const result: AdapterCompatibilityMap = {};

  for (const adapter of getAdapters()) {
    result[adapter.id] = adapter.canExport(story);
  }

  return result;
}

/**
 * Get adapters that are compatible with a story, sorted by compatibility.
 * Fully compatible adapters come first, then those with warnings.
 */
export function getCompatibleAdapters(story: AgentStory): HarnessAdapter[] {
  const adapters = getAdapters();
  const withCompatibility = adapters.map((adapter) => ({
    adapter,
    compat: adapter.canExport(story),
  }));

  // Filter to compatible only
  const compatible = withCompatibility.filter((x) => x.compat.compatible);

  // Sort: no warnings first, then by name
  compatible.sort((a, b) => {
    const aWarnings = a.compat.warnings.length;
    const bWarnings = b.compat.warnings.length;
    if (aWarnings !== bWarnings) return aWarnings - bWarnings;
    return a.adapter.name.localeCompare(b.adapter.name);
  });

  return compatible.map((x) => x.adapter);
}

// ============================================================================
// Export Operations
// ============================================================================

/**
 * Export a story to multiple harnesses.
 */
export function exportToHarnesses(
  story: AgentStory,
  options: HarnessExportOptions = {}
): HarnessExportResult {
  const { adapterIds, includeSource = false } = options;
  const allWarnings: string[] = [];
  const outputs: HarnessExportResult['outputs'] = {};

  // Determine which adapters to use
  const adaptersToUse = adapterIds
    ? adapterIds.map((id) => getAdapter(id)).filter((a): a is HarnessAdapter => a !== null)
    : getCompatibleAdapters(story);

  // Generate output for each adapter
  for (const adapter of adaptersToUse) {
    const compat = adapter.canExport(story);

    if (!compat.compatible) {
      allWarnings.push(`Skipping ${adapter.name}: not compatible`);
      continue;
    }

    if (compat.warnings.length > 0) {
      allWarnings.push(...compat.warnings.map((w) => `${adapter.name}: ${w}`));
    }

    const output = adapter.generate(story);
    outputs[adapter.id] = output;

    if (output.warnings.length > 0) {
      allWarnings.push(...output.warnings.map((w) => `${adapter.name}: ${w}`));
    }
  }

  // Include source JSON if requested
  const source = includeSource ? JSON.stringify(story, null, 2) : undefined;

  return { outputs, warnings: allWarnings, source };
}

/**
 * Export a story to a single harness by ID.
 */
export function exportToHarness(
  story: AgentStory,
  adapterId: string
): HarnessExportResult['outputs'][string] | null {
  const adapter = getAdapter(adapterId);
  if (!adapter) return null;

  const compat = adapter.canExport(story);
  if (!compat.compatible) return null;

  return adapter.generate(story);
}

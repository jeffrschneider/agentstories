/**
 * Harness Adapters Module
 *
 * Export framework-specific configurations from Agent Stories.
 * Import this module to get access to all registered adapters.
 */

// Types
export type {
  HarnessCompatibility,
  HarnessFile,
  HarnessOutput,
  TryItConfig,
  TryItUrlConfig,
  TryItCliConfig,
  TryItApiConfig,
  HarnessAdapter,
  HarnessAdapterInfo,
  AdapterCompatibilityMap,
  HarnessExportOptions,
  HarnessExportResult,
} from './types';

// Registry functions
export {
  registerAdapter,
  unregisterAdapter,
  getAdapters,
  getAdapterInfoList,
  getAdapter,
  hasAdapter,
  checkAllCompatibility,
  getCompatibleAdapters,
  exportToHarnesses,
  exportToHarness,
} from './registry';

// Import adapters to register them (side-effect imports)
// These must be imported AFTER the registry is available
import './adapters/claude';
import './adapters/letta';
import './adapters/langgraph';
import './adapters/crewai';

import { proxy, useSnapshot } from 'valtio';
import { createInitialState } from './hap-types';
import { createHAPActions } from './hap-actions';
import { createHAPSelectors } from './hap-selectors';

// Re-export types
export type {
  HAPDraft,
  HAPFilters,
  HAPSelection,
  HAPViewMode,
  HAPCache,
  HAPState,
} from './hap-types';

// Create the store
export const hapStore = proxy(createInitialState());

// Create actions bound to the store
export const hapActions = createHAPActions(hapStore);

// Create selectors bound to the store
export const hapSelectors = createHAPSelectors(hapStore);

// Hook for easy access
export function useHAP() {
  return useSnapshot(hapStore);
}

import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock crypto.randomUUID for consistent test results
vi.stubGlobal('crypto', {
  randomUUID: () => 'test-uuid-1234',
});

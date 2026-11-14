import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
      // See test/server-only-stub.ts for why this alias exists.
      'server-only': path.resolve(import.meta.dirname, './test/server-only-stub.ts'),
    },
  },
  test: {
    environment: 'node',
  },
});

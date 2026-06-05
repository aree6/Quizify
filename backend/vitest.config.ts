import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    env: {
      SUPABASE_URL: 'https://test.supabase.co',
      SUPABASE_SERVICE_ROLE_KEY: 'test-service-role-key',
    },
    include: ['src/**/*.test.ts'],
  },
});

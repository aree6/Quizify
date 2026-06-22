import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    env: {
      SUPABASE_URL: 'https://test.supabase.co',
      SUPABASE_SERVICE_ROLE_KEY: 'test-service-role-key',
      ADMIN_EMAILS: 'Mohammadareeb34@gmail.com',
      LECTURER_OVERRIDE_EMAILS: 'Mohammadareeb34@gmail.com,mohammadar336@gmail.com',
    },
    include: ['src/**/*.test.ts'],
  },
});

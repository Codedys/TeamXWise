import { config } from 'dotenv';
import { defineConfig } from 'drizzle-kit';

config({ path: '.env.local' });
config();

export default defineConfig({
  schema: './src/infrastructure/db/schema.ts',
  out: './src/infrastructure/db/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL ?? '',
  },
});

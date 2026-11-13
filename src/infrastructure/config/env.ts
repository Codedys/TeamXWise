import { z } from 'zod';

const envSchema = z
  .object({
    DATA_SOURCE: z.enum(['memory', 'postgres']).default('memory'),
    DATABASE_URL: z.string().url().optional(),
  })
  .refine(
    (env) => env.DATA_SOURCE !== 'postgres' || Boolean(env.DATABASE_URL),
    { message: 'DATABASE_URL is required when DATA_SOURCE=postgres', path: ['DATABASE_URL'] },
  );

export type Env = z.infer<typeof envSchema>;

export function loadEnv(): Env {
  return envSchema.parse({
    DATA_SOURCE: process.env.DATA_SOURCE,
    DATABASE_URL: process.env.DATABASE_URL,
  });
}

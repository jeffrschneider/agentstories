import { z } from 'zod';

const envSchema = z.object({
  ANTHROPIC_API_KEY: z
    .string()
    .min(1, 'ANTHROPIC_API_KEY is required')
    .startsWith('sk-ant-', 'ANTHROPIC_API_KEY must be a valid Anthropic API key'),
});

function validateEnv() {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    console.error('❌ Invalid environment variables:');
    console.error(result.error.flatten().fieldErrors);
    throw new Error('Invalid environment variables');
  }

  return result.data;
}

export const env = validateEnv();

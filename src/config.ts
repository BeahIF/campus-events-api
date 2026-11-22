import * as dotenv from 'dotenv';
import { z } from 'zod/v4';
import { makeLogger } from './logger';

export const Config = z.object({
  port: z.coerce.number().int().positive(),
  databaseUrl: z.string(),
});
export type Config = z.infer<typeof Config>;

function readFromEnv(name: string, prefix?: string): string | undefined {
  return process.env[`${prefix ?? ''}${name}`];
}

export function validateEnv(): void {
  if (!process.env.DATABASE_URL) {
    const logger = makeLogger();
    logger.error(
      'Erro de configuração: a variavel de ambiente DATABASE_URL é obrigatória e não foi definida.',
    );
    process.exit(1);
  }
}

export const getConfig = (prefix?: string): Config => {
  dotenv.config();
  return Config.parse({
    port: readFromEnv('PORT', prefix),
    databaseUrl: readFromEnv('DATABASE_URL', prefix),
  });
};

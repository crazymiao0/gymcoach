import { PrismaClient } from '@/prisma/generated/client';
import { PrismaPg } from '@prisma/adapter-pg';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Prisma 7 removed the bundled Rust query engine: the client now talks to the
// database through a JavaScript driver adapter. We pick the right adapter based
// on DATABASE_URL: PostgreSQL uses PrismaPg, SQLite uses PrismaLibSQL.

function createClient(): PrismaClient {
  const url = process.env.DATABASE_URL ?? '';
  if (url.startsWith('postgresql') || url.startsWith('postgres://')) {
    const adapter = new PrismaPg({ connectionString: url });
    return new PrismaClient({
      adapter,
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    });
  }
  // SQLite via libSQL adapter (Prisma 7 needs a driver adapter for all providers).
  // Use require() to avoid TypeScript type conflicts between Client and Config.
  /* eslint-disable @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires */
  const { createClient: createLibSql } = require('@libsql/client');
  const { PrismaLibSql: PgLibSql } = require('@prisma/adapter-libsql');
  /* eslint-enable @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires */
  const libsql = createLibSql({ url });
  const adapter = new PgLibSql(libsql);
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });
}

export const db = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = db;
}

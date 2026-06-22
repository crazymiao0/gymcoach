import { PrismaClient } from '@/prisma/generated/client';
import { existsSync, readFileSync } from 'node:fs';

// Fallback: ensure DATABASE_URL is loaded from .env even if Next.js didn't pick it up.
if (!process.env.DATABASE_URL && existsSync('.env')) {
  for (const line of readFileSync('.env', 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (trimmed.startsWith('DATABASE_URL=')) {
      const val = trimmed.slice('DATABASE_URL='.length);
      process.env.DATABASE_URL = val.replace(/^["']|["']$/g, '');
      break;
    }
  }
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Prisma 6 ships with a built-in Rust query engine that supports SQLite natively.
// No driver adapter needed - unlike Prisma 7 which removed the bundled engine.

function createClient(): PrismaClient {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  } as never);
}

export const db = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = db;
}

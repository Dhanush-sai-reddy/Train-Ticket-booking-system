/**
 * Prisma Client — Singleton Instance
 *
 * Ensures a single PrismaClient is reused across the application.
 * In development, the instance is cached on `globalThis` so that
 * hot-reloads don't create additional database connections.
 */

const { PrismaClient } = require('@prisma/client');

/** @type {PrismaClient} */
let prisma;

if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient({
    log: ['error'],
  });
} else {
  // Avoid exhausting DB connections during dev hot-reloads
  if (!globalThis.__prisma) {
    globalThis.__prisma = new PrismaClient({
      log: ['query', 'info', 'warn', 'error'],
    });
  }
  prisma = globalThis.__prisma;
}

module.exports = { prisma };

import { PrismaClient } from "@prisma/client";

// Singleton PrismaClient with hot-reload guard for `next dev`. Without this,
// every save spins up a new client and exhausts the connection pool.

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

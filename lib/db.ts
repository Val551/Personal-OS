import { Prisma, PrismaClient } from "@prisma/client";

// Singleton PrismaClient with hot-reload guard for `next dev`. Without this,
// every save spins up a new client and exhausts the connection pool.

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function makeClient() {
  const client = new PrismaClient({
    log: [
      { level: "error", emit: "event" },
      { level: "warn", emit: "event" },
    ],
  });

  // Neon's serverless pooler closes idle connections on its own schedule
  // (Postgres SQLSTATE 57P01 — "terminating connection due to administrator
  // command"). Prisma transparently reconnects on the next query, so these
  // are noise. Suppress them; let real errors through.
  client.$on("error", (e) => {
    if (
      e.message.includes("terminating connection due to administrator command") ||
      e.message.includes("57P01")
    ) {
      return;
    }
    console.error("prisma:error", e.message);
  });
  client.$on("warn", (e) => {
    console.warn("prisma:warn", e.message);
  });

  return client;
}

export const prisma = globalForPrisma.prisma ?? makeClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

// Re-export so callers can narrow on Prisma error codes when needed.
export { Prisma };

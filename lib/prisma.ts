// Prisma Client singleton loader — uses libSQL driver adapter for SQLite
let prismaInstance: any = null;

try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { PrismaClient } = require("@prisma/client");
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { PrismaLibSql } = require("@prisma/adapter-libsql");

  const globalForPrisma = globalThis as unknown as { prisma: any };

  if (!globalForPrisma.prisma) {
    const dbUrl = process.env.DATABASE_URL || "file:./prisma/dev.db";
    const adapter = new PrismaLibSql({ url: dbUrl });
    globalForPrisma.prisma = new PrismaClient({
      adapter,
      log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    });
  }

  prismaInstance = globalForPrisma.prisma;
} catch (e) {
  console.error("[prisma] Failed to initialise Prisma client:", e);
  prismaInstance = null;
}

export const prisma = prismaInstance;
export default prisma;

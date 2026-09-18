// Prisma Client singleton loader with fallback support
let prismaInstance: any = null;

try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { PrismaClient } = require("@prisma/client");
  const globalForPrisma = globalThis as unknown as {
    prisma: any;
  };
  prismaInstance =
    globalForPrisma.prisma ??
    new PrismaClient({
      log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    });
  if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prismaInstance;
} catch {
  // Standalone fallback when running in client or demo mode without pre-generated DB
  prismaInstance = null;
}

export const prisma = prismaInstance;
export default prisma;

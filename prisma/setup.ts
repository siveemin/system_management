// Runs after `prisma db push` — seeds only when the DB is empty (no users yet).
// Safe to run on every `npm install`.
import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import path from "path";

const dbPath = path.resolve(process.cwd(), "prisma", "dev.db");
const adapter = new PrismaLibSql({ url: `file:${dbPath}` });
const prisma = new PrismaClient({ adapter } as any);

async function main() {
  const count = await prisma.user.count();
  if (count > 0) {
    console.log(`[setup] DB already has ${count} users — skipping seed.`);
    return;
  }
  console.log("[setup] Empty database detected — seeding initial data…");
  // Dynamically import seed so this file stays lightweight
  await import("./seed");
}

main()
  .catch((e) => {
    console.error("[setup] Error:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

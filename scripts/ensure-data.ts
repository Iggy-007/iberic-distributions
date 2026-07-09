/**
 * Seed only when database is empty (non-destructive).
 * Run: npx tsx scripts/ensure-data.ts
 */
import { execSync } from "child_process";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const [users, products] = await Promise.all([
    prisma.user.count(),
    prisma.product.count(),
  ]);

  if (users >= 3 && products >= 2) {
    console.log("Datos OK:", users, "usuarios,", products, "productos");
    return;
  }

  console.log("Base de datos incompleta — ejecutando seed...");
  execSync("npx tsx prisma/seed.ts", { stdio: "inherit", cwd: process.cwd() });
  console.log("Seed completado.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

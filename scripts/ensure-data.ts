/**
 * Seed only when database is empty (non-destructive).
 * Run: npx tsx scripts/ensure-data.ts
 */
import { execSync } from "child_process";
import { PrismaClient } from "@prisma/client";
import { ensureDefaultShippingRates } from "../src/lib/shipping-rates";

const prisma = new PrismaClient();

async function ensureProductReferences() {
  const refs: Record<string, string> = {
    "Jamón Ibérico 75%": "GAL-JAM-75",
    "Lomito ibérico": "GAL-LOM-01",
  };

  for (const [name, galvanReference] of Object.entries(refs)) {
    await prisma.product.updateMany({
      where: { name, galvanReference: "" },
      data: { galvanReference },
    });
  }
}

async function main() {
  await ensureDefaultShippingRates();

  const [users, products] = await Promise.all([
    prisma.user.count(),
    prisma.product.count(),
  ]);

  if (users >= 3 && products >= 2) {
    await ensureProductReferences();
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

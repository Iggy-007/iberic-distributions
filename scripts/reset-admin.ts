/**
 * Ensures the default admin account exists and resets its password.
 * Production: npm run db:reset-admin:prod
 * Local: npx tsx scripts/reset-admin.ts
 */
import bcrypt from "bcryptjs";
import { OrganizationType, Role } from "@prisma/client";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const ADMIN_EMAIL = "admin@ibericdistributions.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "Admin123!";
const ADMIN_NAME = "Administrador";

async function main() {
  let adminOrg = await prisma.organization.findFirst({
    where: { type: OrganizationType.ADMIN },
  });

  if (!adminOrg) {
    adminOrg = await prisma.organization.create({
      data: {
        type: OrganizationType.ADMIN,
        name: "Iberic Distributions",
        city: "Málaga",
        country: "España",
      },
    });
    console.log("Created admin organization.");
  }

  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12);
  const existing = await prisma.user.findUnique({
    where: { email: ADMIN_EMAIL },
  });

  if (existing) {
    await prisma.user.update({
      where: { email: ADMIN_EMAIL },
      data: {
        passwordHash,
        name: ADMIN_NAME,
        role: Role.ADMIN,
        active: true,
        organizationId: adminOrg.id,
      },
    });
    console.log(`Admin password reset: ${ADMIN_EMAIL}`);
  } else {
    await prisma.user.create({
      data: {
        email: ADMIN_EMAIL,
        passwordHash,
        name: ADMIN_NAME,
        role: Role.ADMIN,
        active: true,
        organizationId: adminOrg.id,
      },
    });
    console.log(`Admin user created: ${ADMIN_EMAIL}`);
  }

  console.log(`Password: ${ADMIN_PASSWORD}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

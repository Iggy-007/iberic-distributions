/**
 * Full application sanity check.
 * Run: npx tsx scripts/sanity-check.ts
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();
const BASE = process.env.SANITY_BASE_URL ?? "http://localhost:3000";

type Check = { name: string; ok: boolean; detail?: string };

const checks: Check[] = [];

function pass(name: string, detail?: string) {
  checks.push({ name, ok: true, detail });
}
function fail(name: string, detail?: string) {
  checks.push({ name, ok: false, detail });
}

async function checkDb() {
  const users = await prisma.user.count();
  const products = await prisma.product.count();
  const variants = await prisma.productVariant.count();
  const orders = await prisma.order.count();

  if (users >= 3) pass("DB: users", `${users} usuarios`);
  else fail("DB: users", `solo ${users} — ejecutar npm run db:seed`);

  if (products >= 2) pass("DB: products", `${products} productos`);
  else fail("DB: products", `solo ${products}`);

  if (variants >= 5) pass("DB: variants", `${variants} variantes`);
  else fail("DB: variants", `solo ${variants}`);

  const loncheado = await prisma.productVariant.findFirst({
    where: { name: "Jamón loncheado" },
  });
  if (loncheado?.vatRate === 0.21) pass("DB: IVA loncheado", "21%");
  else fail("DB: IVA loncheado", `vatRate=${loncheado?.vatRate}`);

  const entero = await prisma.productVariant.findFirst({
    where: { name: "Jamón entero" },
  });
  if (entero?.vatRate === 0.1) pass("DB: IVA jamón entero", "10%");
  else fail("DB: IVA jamón entero", `vatRate=${entero?.vatRate}`);

  const admin = await prisma.user.findUnique({
    where: { email: "admin@ibericdistributions.com" },
  });
  if (admin && (await bcrypt.compare("Admin123!", admin.passwordHash))) {
    pass("DB: admin password", "Admin123! válido");
  } else {
    fail("DB: admin password", "no coincide — ejecutar db:seed");
  }

  if (orders >= 0) pass("DB: orders", `${orders} pedido(s)`);
}

async function checkHttp(path: string, expectedStatus: number | number[]) {
  const allowed = Array.isArray(expectedStatus) ? expectedStatus : [expectedStatus];
  try {
    const res = await fetch(`${BASE}${path}`, { redirect: "manual" });
    if (allowed.includes(res.status)) {
      pass(`HTTP ${path}`, `status ${res.status}`);
    } else {
      fail(`HTTP ${path}`, `status ${res.status}, esperado ${allowed.join("|")}`);
    }
  } catch (e) {
    fail(`HTTP ${path}`, `no responde — ¿servidor en ${BASE}?`);
  }
}

async function checkApiProducts() {
  try {
    const res = await fetch(`${BASE}/api/products`);
    if (!res.ok) {
      fail("API /api/products", `status ${res.status}`);
      return;
    }
    const data = await res.json();
    if (Array.isArray(data) && data.length >= 2) {
      pass("API /api/products", `${data.length} productos`);
    } else {
      fail("API /api/products", `vacío o inválido`);
    }
  } catch {
    fail("API /api/products", "error de red");
  }
}

async function checkTracking() {
  const token = await prisma.trackingToken.findFirst({
    include: { order: true },
  });
  if (!token) {
    fail("API tracking", "sin token en DB");
    return;
  }
  const res = await fetch(`${BASE}/api/tracking/${token.token}`);
  if (res.ok) pass("API /api/tracking/[token]", token.order.orderNumber);
  else fail("API /api/tracking/[token]", `status ${res.status}`);
}

const PUBLIC_ROUTES = [
  "/login",
  "/api/products",
];

const PROTECTED_REDIRECT_ROUTES = [
  "/",
  "/admin",
  "/admin/orders",
  "/admin/users",
  "/admin/products",
  "/client",
  "/client/orders",
  "/client/orders/new",
  "/client/catalog",
  "/provider",
  "/provider/orders",
  "/provider/catalog",
];

async function main() {
  console.log(`\n=== Iberic Distributions Sanity Check ===`);
  console.log(`Base URL: ${BASE}\n`);

  await checkDb();

  for (const path of PUBLIC_ROUTES) {
    if (path.startsWith("/api")) continue;
    await checkHttp(path, 200);
  }

  await checkApiProducts();
  await checkHttp("/api/health", 200);

  for (const path of PROTECTED_REDIRECT_ROUTES) {
    await checkHttp(path, [307, 308, 302, 303]);
  }

  await checkTracking();

  const failed = checks.filter((c) => !c.ok);
  const passed = checks.filter((c) => c.ok);

  console.log(`\n✓ ${passed.length} OK`);
  for (const c of passed) {
    console.log(`  ✓ ${c.name}${c.detail ? ` — ${c.detail}` : ""}`);
  }

  if (failed.length > 0) {
    console.log(`\n✗ ${failed.length} FALLOS`);
    for (const c of failed) {
      console.log(`  ✗ ${c.name}${c.detail ? ` — ${c.detail}` : ""}`);
    }
    process.exit(1);
  }

  console.log("\n=== Todo OK ===\n");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

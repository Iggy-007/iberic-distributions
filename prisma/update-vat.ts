import { PrismaClient } from "@prisma/client";
import { VAT_RATE } from "../src/lib/constants";
import { calcVatCents } from "../src/lib/pricing";

const prisma = new PrismaClient();

const VAT_RATE_STANDARD = 0.21;
const STANDARD_VAT_VARIANT_NAMES = [
  "Jamón loncheado",
  "Jamón plateado",
  "Lomito ibérico loncheado",
];

async function main() {
  const standardVat = await prisma.productVariant.updateMany({
    where: { name: { in: STANDARD_VAT_VARIANT_NAMES } },
    data: { vatRate: VAT_RATE_STANDARD },
  });
  const reducedVat = await prisma.productVariant.updateMany({
    where: { name: { notIn: STANDARD_VAT_VARIANT_NAMES } },
    data: { vatRate: VAT_RATE },
  });

  console.log(
    `IVA ${VAT_RATE_STANDARD * 100}% aplicado a ${standardVat.count} variante(s); ` +
      `IVA ${VAT_RATE * 100}% aplicado a ${reducedVat.count} variante(s).`
  );

  const orders = await prisma.order.findMany({
    include: { lines: { include: { variant: true } } },
  });

  for (const order of orders) {
    const vatCents = order.lines.reduce(
      (sum, line) =>
        sum + calcVatCents(line.lineTotalCents, line.variant.vatRate),
      0
    );
    const totalCents = order.subtotalCents + vatCents + order.shippingCostCents;
    await prisma.order.update({
      where: { id: order.id },
      data: { vatCents, totalCents },
    });
  }

  console.log(`IVA recalculado en ${orders.length} pedido(s).`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

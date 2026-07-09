import { PrismaClient } from "@prisma/client";
import { generateCancellationNumber } from "../src/lib/utils";

const prisma = new PrismaClient();

async function main() {
  const rows = await prisma.order.findMany({
    where: { status: "CANCELLED", cancellationNumber: null },
  });

  for (const order of rows) {
    await prisma.order.update({
      where: { id: order.id },
      data: { cancellationNumber: generateCancellationNumber() },
    });
  }

  console.log(`Backfilled ${rows.length} cancelled order(s)`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

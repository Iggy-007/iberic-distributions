import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const products = await prisma.product.findMany({
    where: { active: true },
    include: {
      variants: { where: { active: true }, orderBy: { name: "asc" } },
      documents: true,
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(products);
}

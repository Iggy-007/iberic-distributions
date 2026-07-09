import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const [users, products, orders] = await Promise.all([
      prisma.user.count(),
      prisma.product.count(),
      prisma.order.count(),
    ]);

    const ok = users >= 3 && products >= 2;

    return NextResponse.json({
      status: ok ? "ok" : "degraded",
      database: "connected",
      users,
      products,
      orders,
      hint: ok ? undefined : "Ejecuta: npm run db:seed",
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: "error",
        database: "disconnected",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 503 }
    );
  }
}

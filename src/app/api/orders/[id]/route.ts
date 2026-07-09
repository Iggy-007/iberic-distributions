import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getOrderById } from "@/lib/orders";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const order = await getOrderById(
    id,
    session.user.id,
    session.user.role,
    session.user.organizationId
  );

  if (!order) {
    return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });
  }

  return NextResponse.json(order);
}

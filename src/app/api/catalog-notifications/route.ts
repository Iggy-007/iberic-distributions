import { NextRequest, NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getSession();
  if (!session || session.user.role !== Role.ADMIN) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const notifications = await prisma.catalogNotification.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      actor: { select: { name: true, role: true } },
      product: { select: { id: true, name: true } },
    },
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  return NextResponse.json({ notifications, unreadCount });
}

export async function PATCH(request: NextRequest) {
  const session = await getSession();
  if (!session || session.user.role !== Role.ADMIN) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const markAll = body?.markAll === true;
  const id = typeof body?.id === "string" ? body.id : null;

  if (markAll) {
    await prisma.catalogNotification.updateMany({
      where: { read: false },
      data: { read: true },
    });
    return NextResponse.json({ ok: true });
  }

  if (id) {
    await prisma.catalogNotification.update({
      where: { id },
      data: { read: true },
    });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
}

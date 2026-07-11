import { NextRequest, NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logUserActivity } from "@/lib/user-activity";

const patchSchema = z.object({
  active: z.boolean().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || session.user.role !== Role.ADMIN) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
  }

  const user = await prisma.user.update({
    where: { id },
    data: parsed.data,
    include: { organization: true },
  });

  if (parsed.data.active !== undefined && parsed.data.active !== existing.active) {
    await logUserActivity({
      userId: id,
      action: parsed.data.active ? "USER_ACTIVATED" : "USER_DEACTIVATED",
      summary: parsed.data.active ? "Cuenta activada" : "Cuenta desactivada",
      detail: `Por ${session.user.name}`,
      entityType: "user",
      entityId: id,
    });
  }

  return NextResponse.json(user);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || session.user.role !== Role.ADMIN) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;

  if (id === session.user.id) {
    return NextResponse.json(
      { error: "No puede eliminar su propia cuenta" },
      { status: 400 }
    );
  }

  const user = await prisma.user.findUnique({
    where: { id },
    include: { _count: { select: { ordersCreated: true } } },
  });

  if (!user) {
    return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
  }

  if (user.role === Role.ADMIN) {
    const adminCount = await prisma.user.count({
      where: { role: Role.ADMIN, active: true },
    });
    if (adminCount <= 1) {
      return NextResponse.json(
        { error: "No puede eliminar el último administrador activo" },
        { status: 400 }
      );
    }
  }

  if (user._count.ordersCreated > 0) {
    return NextResponse.json(
      {
        error:
          "No se puede eliminar: tiene pedidos asociados. Desactívelo en su lugar.",
      },
      { status: 400 }
    );
  }

  await logUserActivity({
    userId: session.user.id,
    action: "USER_DELETED",
    summary: `Eliminó usuario ${user.name}`,
    detail: user.email,
    entityType: "user",
    entityId: user.id,
  });

  await prisma.user.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}

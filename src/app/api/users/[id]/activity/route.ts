import { NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getUserActivityTimeline } from "@/lib/user-activity";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || session.user.role !== Role.ADMIN) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await params;
    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true, name: true, email: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    const items = await getUserActivityTimeline(id);

    return NextResponse.json({ user, items });
  } catch (error) {
    console.error("[activity]", error);
    return NextResponse.json(
      { error: "No se pudo cargar la actividad del usuario" },
      { status: 500 }
    );
  }
}

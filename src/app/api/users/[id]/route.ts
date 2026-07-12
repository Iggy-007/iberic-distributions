import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { OrganizationType, Role } from "@prisma/client";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logUserActivity } from "@/lib/user-activity";

const patchSchema = z.object({
  active: z.boolean().optional(),
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional().nullable(),
  password: z.string().min(8).optional(),
  role: z.enum(["ADMIN", "CLIENT", "PROVIDER"]).optional(),
  organizationName: z.string().optional(),
  organizationType: z.enum(["CLIENT", "PROVIDER", "ADMIN"]).optional(),
  street: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  postalCode: z.string().optional().nullable(),
  country: z.string().optional(),
});

function roleToOrganizationType(role: Role): OrganizationType {
  if (role === Role.PROVIDER) return OrganizationType.PROVIDER;
  if (role === Role.ADMIN) return OrganizationType.ADMIN;
  return OrganizationType.CLIENT;
}

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

  const data = parsed.data;
  const existing = await prisma.user.findUnique({
    where: { id },
    include: { organization: true },
  });

  if (!existing) {
    return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
  }

  if (data.email) {
    const emailTaken = await prisma.user.findFirst({
      where: {
        email: data.email.toLowerCase(),
        NOT: { id },
      },
    });
    if (emailTaken) {
      return NextResponse.json({ error: "Email ya registrado" }, { status: 409 });
    }
  }

  if (data.role && data.role !== existing.role) {
    if (id === session.user.id) {
      return NextResponse.json(
        { error: "No puede cambiar su propio rol" },
        { status: 400 }
      );
    }

    if (existing.role === Role.ADMIN) {
      const adminCount = await prisma.user.count({
        where: { role: Role.ADMIN, active: true },
      });
      if (adminCount <= 1) {
        return NextResponse.json(
          { error: "No puede quitar el rol al último administrador activo" },
          { status: 400 }
        );
      }
    }
  }

  const nextRole = (data.role ?? existing.role) as Role;
  let organizationId = existing.organizationId;

  const orgName = data.organizationName?.trim();
  const hasOrgFields =
    orgName ||
    data.street !== undefined ||
    data.city !== undefined ||
    data.postalCode !== undefined ||
    data.country !== undefined;

  if (hasOrgFields) {
    const orgType =
      (data.organizationType as OrganizationType | undefined) ??
      roleToOrganizationType(nextRole);

    if (organizationId) {
      await prisma.organization.update({
        where: { id: organizationId },
        data: {
          ...(orgName ? { name: orgName } : {}),
          type: orgType,
          ...(data.street !== undefined ? { street: data.street } : {}),
          ...(data.city !== undefined ? { city: data.city } : {}),
          ...(data.postalCode !== undefined
            ? { postalCode: data.postalCode }
            : {}),
          ...(data.country !== undefined ? { country: data.country } : {}),
        },
      });
    } else if (orgName) {
      const org = await prisma.organization.create({
        data: {
          name: orgName,
          type: orgType,
          street: data.street ?? undefined,
          city: data.city ?? undefined,
          postalCode: data.postalCode ?? undefined,
          country: data.country ?? "España",
        },
      });
      organizationId = org.id;
    }
  } else if (data.role && existing.organizationId) {
    await prisma.organization.update({
      where: { id: existing.organizationId },
      data: { type: roleToOrganizationType(nextRole) },
    });
  }

  const user = await prisma.user.update({
    where: { id },
    data: {
      ...(data.active !== undefined ? { active: data.active } : {}),
      ...(data.name !== undefined ? { name: data.name } : {}),
      ...(data.email !== undefined ? { email: data.email.toLowerCase() } : {}),
      ...(data.phone !== undefined
        ? { phone: data.phone?.trim() || null }
        : {}),
      ...(data.role !== undefined ? { role: data.role as Role } : {}),
      ...(organizationId !== existing.organizationId ? { organizationId } : {}),
      ...(data.password
        ? { passwordHash: await bcrypt.hash(data.password, 12) }
        : {}),
    },
    include: { organization: true },
  });

  if (data.active !== undefined && data.active !== existing.active) {
    await logUserActivity({
      userId: id,
      action: data.active ? "USER_ACTIVATED" : "USER_DEACTIVATED",
      summary: data.active ? "Cuenta activada" : "Cuenta desactivada",
      detail: `Por ${session.user.name}`,
      entityType: "user",
      entityId: id,
    });
  }

  const profileChanged =
    data.name !== undefined ||
    data.email !== undefined ||
    data.phone !== undefined ||
    data.role !== undefined ||
    data.password !== undefined ||
    hasOrgFields;

  if (profileChanged) {
    const changes: string[] = [];
    if (data.name !== undefined && data.name !== existing.name) {
      changes.push("nombre");
    }
    if (data.email !== undefined && data.email !== existing.email) {
      changes.push("email");
    }
    if (data.phone !== undefined && data.phone !== existing.phone) {
      changes.push("teléfono");
    }
    if (data.role !== undefined && data.role !== existing.role) {
      changes.push(`rol → ${data.role}`);
    }
    if (data.password) changes.push("contraseña");
    if (hasOrgFields) changes.push("organización");

    await logUserActivity({
      userId: id,
      action: "USER_UPDATED",
      summary: "Perfil actualizado",
      detail: changes.length > 0 ? changes.join(", ") : "Datos modificados",
      entityType: "user",
      entityId: id,
    });

    await logUserActivity({
      userId: session.user.id,
      action: "USER_UPDATED",
      summary: `Actualizó usuario ${user.name}`,
      detail: changes.join(", ") || user.email,
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

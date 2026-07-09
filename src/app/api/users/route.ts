import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { Role, OrganizationType } from "@prisma/client";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1),
  role: z.enum(["ADMIN", "CLIENT", "PROVIDER"]),
  organizationName: z.string().optional(),
  organizationType: z.enum(["CLIENT", "PROVIDER", "ADMIN"]).optional(),
  street: z.string().optional(),
  city: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().default("España"),
  organizationId: z.string().optional(),
});

export async function GET() {
  const session = await getSession();
  if (!session || session.user.role !== Role.ADMIN) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const users = await prisma.user.findMany({
    include: { organization: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(users);
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session || session.user.role !== Role.ADMIN) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = createUserSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  const data = parsed.data;
  const existing = await prisma.user.findUnique({
    where: { email: data.email.toLowerCase() },
  });

  if (existing) {
    return NextResponse.json({ error: "Email ya registrado" }, { status: 409 });
  }

  let organizationId = data.organizationId;

  if (!organizationId && data.organizationName) {
    const org = await prisma.organization.create({
      data: {
        name: data.organizationName,
        type: (data.organizationType ?? "CLIENT") as OrganizationType,
        street: data.street,
        city: data.city,
        postalCode: data.postalCode,
        country: data.country,
      },
    });
    organizationId = org.id;
  }

  const user = await prisma.user.create({
    data: {
      email: data.email.toLowerCase(),
      passwordHash: await bcrypt.hash(data.password, 12),
      name: data.name,
      role: data.role as Role,
      organizationId,
    },
    include: { organization: true },
  });

  return NextResponse.json(user, { status: 201 });
}

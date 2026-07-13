import { ShippingType } from "@prisma/client";
import {
  INTERNATIONAL_SHIPPING_CENTS,
  NATIONAL_SHIPPING_CENTS,
} from "@/lib/constants";
import { shippingTypeLabel } from "@/lib/shipping";
import { prisma } from "@/lib/prisma";

export interface ShippingService {
  id: string;
  type: ShippingType;
  label: string;
  priceCents: number;
  supplier: string;
  isDefault: boolean;
  active: boolean;
  sortOrder: number;
}

const DEFAULT_NATIONAL_LABEL = "Envío nacional (España)";
const DEFAULT_INTERNATIONAL_LABEL = "Envío internacional";

function mapRow(row: {
  id: string;
  type: ShippingType;
  label: string;
  priceCents: number;
  supplier: string;
  isDefault: boolean;
  active: boolean;
  sortOrder: number;
}): ShippingService {
  return {
    id: row.id,
    type: row.type,
    label: row.label,
    priceCents: row.priceCents,
    supplier: row.supplier,
    isDefault: row.isDefault,
    active: row.active,
    sortOrder: row.sortOrder,
  };
}

export async function ensureDefaultShippingRates(): Promise<void> {
  const existing = await prisma.shippingRate.findMany();
  if (existing.length > 0) return;

  await prisma.shippingRate.createMany({
    data: [
      {
        type: ShippingType.NATIONAL,
        label: DEFAULT_NATIONAL_LABEL,
        priceCents: NATIONAL_SHIPPING_CENTS,
        supplier: "",
        isDefault: true,
        active: true,
        sortOrder: 0,
      },
      {
        type: ShippingType.INTERNATIONAL,
        label: DEFAULT_INTERNATIONAL_LABEL,
        priceCents: INTERNATIONAL_SHIPPING_CENTS,
        supplier: "",
        isDefault: true,
        active: true,
        sortOrder: 0,
      },
    ],
  });
}

export async function listShippingServices(options?: {
  activeOnly?: boolean;
  type?: ShippingType;
}): Promise<ShippingService[]> {
  try {
    await ensureDefaultShippingRates();

    const rows = await prisma.shippingRate.findMany({
      where: {
        ...(options?.activeOnly ? { active: true } : {}),
        ...(options?.type ? { type: options.type } : {}),
      },
      orderBy: [{ type: "asc" }, { sortOrder: "asc" }, { label: "asc" }],
    });

    return rows.map(mapRow);
  } catch {
    return [
      {
        id: "fallback-national",
        type: ShippingType.NATIONAL,
        label: DEFAULT_NATIONAL_LABEL,
        priceCents: NATIONAL_SHIPPING_CENTS,
        supplier: "",
        isDefault: true,
        active: true,
        sortOrder: 0,
      },
      {
        id: "fallback-international",
        type: ShippingType.INTERNATIONAL,
        label: DEFAULT_INTERNATIONAL_LABEL,
        priceCents: INTERNATIONAL_SHIPPING_CENTS,
        supplier: "",
        isDefault: true,
        active: true,
        sortOrder: 0,
      },
    ];
  }
}

export async function getDefaultShippingService(
  type: ShippingType
): Promise<ShippingService> {
  const services = await listShippingServices({ activeOnly: true, type });
  const chosen =
    services.find((s) => s.isDefault) ??
    services[0] ??
    ({
      id: "fallback",
      type,
      label:
        type === ShippingType.NATIONAL
          ? DEFAULT_NATIONAL_LABEL
          : DEFAULT_INTERNATIONAL_LABEL,
      priceCents:
        type === ShippingType.NATIONAL
          ? NATIONAL_SHIPPING_CENTS
          : INTERNATIONAL_SHIPPING_CENTS,
      supplier: "",
      isDefault: true,
      active: true,
      sortOrder: 0,
    } satisfies ShippingService);

  return chosen;
}

export async function resolveShippingService(
  serviceId: string | undefined,
  type: ShippingType
): Promise<ShippingService> {
  if (serviceId) {
    const row = await prisma.shippingRate.findFirst({
      where: { id: serviceId, type, active: true },
    });
    if (row) return mapRow(row);
  }

  return getDefaultShippingService(type);
}

export async function getShippingCostCentsFromDb(
  shippingType: ShippingType,
  shippingServiceId?: string
): Promise<number> {
  const service = await resolveShippingService(shippingServiceId, shippingType);
  return service.priceCents;
}

async function clearDefaultForType(type: ShippingType, exceptId?: string) {
  await prisma.shippingRate.updateMany({
    where: {
      type,
      ...(exceptId ? { id: { not: exceptId } } : {}),
    },
    data: { isDefault: false },
  });
}

export async function createShippingService(input: {
  type: ShippingType;
  label: string;
  priceCents: number;
  supplier?: string;
  isDefault?: boolean;
  active?: boolean;
}): Promise<ShippingService> {
  await ensureDefaultShippingRates();

  const label = input.label.trim();
  if (!label) throw new Error("El nombre del servicio es obligatorio");

  const existingOfType = await prisma.shippingRate.count({
    where: { type: input.type, active: true },
  });
  const isDefault = input.isDefault ?? existingOfType === 0;

  if (isDefault) {
    await clearDefaultForType(input.type);
  }

  const maxSort = await prisma.shippingRate.aggregate({
    where: { type: input.type },
    _max: { sortOrder: true },
  });

  const row = await prisma.shippingRate.create({
    data: {
      type: input.type,
      label,
      priceCents: input.priceCents,
      supplier: input.supplier?.trim() ?? "",
      isDefault,
      active: input.active ?? true,
      sortOrder: (maxSort._max.sortOrder ?? -1) + 1,
    },
  });

  return mapRow(row);
}

export async function updateShippingService(
  id: string,
  input: {
    label?: string;
    priceCents?: number;
    supplier?: string;
    isDefault?: boolean;
    active?: boolean;
    type?: ShippingType;
  }
): Promise<ShippingService> {
  const current = await prisma.shippingRate.findUnique({ where: { id } });
  if (!current) throw new Error("Servicio de envío no encontrado");

  const nextType = input.type ?? current.type;
  const label =
    input.label !== undefined ? input.label.trim() : current.label;
  if (!label) throw new Error("El nombre del servicio es obligatorio");

  if (input.isDefault) {
    await clearDefaultForType(nextType, id);
  }

  if (input.active === false && current.isDefault) {
    const others = await prisma.shippingRate.count({
      where: {
        type: nextType,
        active: true,
        id: { not: id },
      },
    });
    if (others === 0) {
      throw new Error("Debe haber al menos un servicio activo por ámbito");
    }
    const replacement = await prisma.shippingRate.findFirst({
      where: { type: nextType, active: true, id: { not: id } },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    });
    if (replacement) {
      await prisma.shippingRate.update({
        where: { id: replacement.id },
        data: { isDefault: true },
      });
    }
  }

  const row = await prisma.shippingRate.update({
    where: { id },
    data: {
      ...(input.label !== undefined ? { label } : {}),
      ...(input.priceCents !== undefined ? { priceCents: input.priceCents } : {}),
      ...(input.supplier !== undefined
        ? { supplier: input.supplier.trim() }
        : {}),
      ...(input.isDefault !== undefined ? { isDefault: input.isDefault } : {}),
      ...(input.active !== undefined ? { active: input.active } : {}),
      ...(input.type !== undefined ? { type: input.type } : {}),
    },
  });

  if (!row.isDefault) {
    const hasDefault = await prisma.shippingRate.findFirst({
      where: { type: row.type, active: true, isDefault: true },
    });
    if (!hasDefault) {
      await prisma.shippingRate.update({
        where: { id: row.id },
        data: { isDefault: true },
      });
      row.isDefault = true;
    }
  }

  return mapRow(row);
}

export async function deleteShippingService(id: string): Promise<void> {
  const current = await prisma.shippingRate.findUnique({ where: { id } });
  if (!current) throw new Error("Servicio de envío no encontrado");

  const activeCount = await prisma.shippingRate.count({
    where: { type: current.type, active: true },
  });
  if (activeCount <= 1 && current.active) {
    throw new Error("No se puede eliminar el último servicio activo de este ámbito");
  }

  const ordersUsing = await prisma.order.count({
    where: { shippingServiceId: id },
  });
  if (ordersUsing > 0) {
    await updateShippingService(id, { active: false });
    return;
  }

  if (current.isDefault) {
    const replacement = await prisma.shippingRate.findFirst({
      where: { type: current.type, active: true, id: { not: id } },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    });
    if (replacement) {
      await prisma.shippingRate.update({
        where: { id: replacement.id },
        data: { isDefault: true },
      });
    }
  }

  await prisma.shippingRate.delete({ where: { id } });
}

export function orderShippingLabel(order: {
  shippingLabel?: string | null;
  shippingType: ShippingType;
}): string {
  if (order.shippingLabel?.trim()) {
    return order.shippingLabel.trim();
  }
  return `Gastos de envío (${shippingTypeLabel(order.shippingType).toLowerCase()})`;
}

import { notFound } from "next/navigation";
import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { orderInclude } from "@/lib/orders";
import { OrderDetailView } from "@/components/OrderDetailView";

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const order = await prisma.order.findUnique({
    where: { id },
    include: orderInclude,
  });

  if (!order) notFound();

  return <OrderDetailView order={order} role={Role.ADMIN} />;
}

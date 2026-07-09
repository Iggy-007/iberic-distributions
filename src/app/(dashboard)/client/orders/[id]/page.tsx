import { notFound } from "next/navigation";
import { Role } from "@prisma/client";
import { getRequiredSession } from "@/lib/auth";
import { getOrderById } from "@/lib/orders";
import { OrderDetailView } from "@/components/OrderDetailView";

export default async function ClientOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getRequiredSession();
  const { id } = await params;
  const order = await getOrderById(
    id,
    session.user.id,
    session.user.role,
    session.user.organizationId
  );
  if (!order) notFound();

  return <OrderDetailView order={order} role={Role.CLIENT} />;
}

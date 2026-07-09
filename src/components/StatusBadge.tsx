import { OrderStatus } from "@prisma/client";
import { ORDER_STATUS_COLORS, ORDER_STATUS_LABELS } from "@/lib/constants";

export function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${ORDER_STATUS_COLORS[status]}`}
    >
      {ORDER_STATUS_LABELS[status]}
    </span>
  );
}

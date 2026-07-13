import { OrderStatus } from "@prisma/client";
import {
  ORDER_STATUS_COLORS,
  ORDER_STATUS_LABELS,
  ORDER_STATUS_SHORT_LABELS,
} from "@/lib/constants";

export function StatusBadge({ status }: { status: OrderStatus }) {
  const short = ORDER_STATUS_SHORT_LABELS[status];
  const full = ORDER_STATUS_LABELS[status];
  return (
    <span
      title={full}
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${ORDER_STATUS_COLORS[status]}`}
    >
      {short}
    </span>
  );
}

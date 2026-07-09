import { OrderStatus } from "@prisma/client";
import { ORDER_STATUS_LABELS } from "@/lib/constants";

interface StatusEvent {
  status: OrderStatus;
  createdAt: Date | string;
  note?: string | null;
  createdBy?: { name: string } | null;
}

const STATUS_ORDER: OrderStatus[] = [
  "SENT",
  "RECEIVED_BY_PROVIDER",
  "IN_PROCESS",
  "SHIPPED_TO_FINAL",
];

export function OrderTimeline({
  events,
  currentStatus,
}: {
  events: StatusEvent[];
  currentStatus?: OrderStatus;
}) {
  const eventMap = new Map(events.map((e) => [e.status, e]));
  const cancelledEvent = eventMap.get("CANCELLED");

  if (currentStatus === "CANCELLED" && cancelledEvent) {
    return (
      <div className="space-y-4">
        <div className="rounded-lg border border-stone-200 bg-stone-50 p-4">
          <p className="font-medium text-stone-700">
            {ORDER_STATUS_LABELS.CANCELLED}
          </p>
          <p className="text-sm text-stone-500 mt-1">
            {new Date(cancelledEvent.createdAt).toLocaleString("es-ES")}
            {cancelledEvent.createdBy &&
              ` — ${cancelledEvent.createdBy.name}`}
          </p>
        </div>
        <ol className="relative border-l border-stone-200 ml-3 space-y-6 opacity-60">
          {STATUS_ORDER.map((status) => {
            const event = eventMap.get(status);
            if (!event) return null;
            return (
              <li key={status} className="ml-6">
                <span className="absolute -left-1.5 flex h-3 w-3 items-center justify-center rounded-full ring-4 ring-cream bg-stone-400" />
                <h4 className="font-medium text-stone-600">
                  {ORDER_STATUS_LABELS[status]}
                </h4>
                <p className="text-sm text-stone-500">
                  {new Date(event.createdAt).toLocaleString("es-ES")}
                </p>
              </li>
            );
          })}
        </ol>
      </div>
    );
  }

  return (
    <ol className="relative border-l border-stone-200 ml-3 space-y-6">
      {STATUS_ORDER.map((status) => {
        const event = eventMap.get(status);
        const done = !!event;

        return (
          <li key={status} className="ml-6">
            <span
              className={`absolute -left-1.5 flex h-3 w-3 items-center justify-center rounded-full ring-4 ring-cream ${
                done ? "bg-wine" : "bg-stone-300"
              }`}
            />
            <h4
              className={`font-medium ${done ? "text-stone-900" : "text-stone-400"}`}
            >
              {ORDER_STATUS_LABELS[status]}
            </h4>
            {event && (
              <p className="text-sm text-stone-500">
                {new Date(event.createdAt).toLocaleString("es-ES")}
                {event.createdBy && ` — ${event.createdBy.name}`}
              </p>
            )}
            {event?.note && (
              <p className="text-sm text-stone-600 mt-1">{event.note}</p>
            )}
          </li>
        );
      })}
    </ol>
  );
}

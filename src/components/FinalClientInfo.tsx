import type { OrderWithDetails } from "@/lib/orders";

type FinalClientFields = Pick<
  OrderWithDetails,
  | "finalClientFirstName"
  | "finalClientLastName"
  | "finalClientStreet"
  | "finalClientCity"
  | "finalClientPostalCode"
  | "finalClientCountry"
  | "finalClientPhone"
  | "finalClientPhoneSecondary"
  | "finalClientEmail"
>;

export function getFinalClientFullName(order: FinalClientFields): string | null {
  const parts = [order.finalClientFirstName, order.finalClientLastName].filter(
    Boolean
  );
  return parts.length > 0 ? parts.join(" ") : null;
}

export function hasFinalClientData(order: FinalClientFields): boolean {
  return !!(
    order.finalClientFirstName ||
    order.finalClientLastName ||
    order.finalClientStreet
  );
}

export function FinalClientInfo({
  order,
  compact = false,
}: {
  order: FinalClientFields;
  compact?: boolean;
}) {
  if (!hasFinalClientData(order)) {
    return (
      <p className="text-sm text-stone-400">Sin datos de cliente final</p>
    );
  }

  const fullName = getFinalClientFullName(order);

  if (compact) {
    return (
      <p className="text-sm text-stone-600">
        <span className="font-medium">Cliente final:</span> {fullName}
        {order.finalClientCity && ` — ${order.finalClientCity}`}
      </p>
    );
  }

  return (
    <dl className="grid gap-2 text-sm text-stone-600">
      {fullName && (
        <div>
          <dt className="text-stone-500">Nombre</dt>
          <dd className="font-medium text-stone-900">{fullName}</dd>
        </div>
      )}
      {order.finalClientStreet && (
        <div>
          <dt className="text-stone-500">Dirección</dt>
          <dd>
            {order.finalClientStreet}
            <br />
            {order.finalClientPostalCode} {order.finalClientCity}
            <br />
            {order.finalClientCountry ?? "España"}
          </dd>
        </div>
      )}
      {order.finalClientPhone && (
        <div>
          <dt className="text-stone-500">Teléfono</dt>
          <dd>{order.finalClientPhone}</dd>
        </div>
      )}
      {order.finalClientPhoneSecondary && (
        <div>
          <dt className="text-stone-500">Teléfono de contacto 2</dt>
          <dd>{order.finalClientPhoneSecondary}</dd>
        </div>
      )}
      {order.finalClientEmail && (
        <div>
          <dt className="text-stone-500">Email</dt>
          <dd>{order.finalClientEmail}</dd>
        </div>
      )}
    </dl>
  );
}

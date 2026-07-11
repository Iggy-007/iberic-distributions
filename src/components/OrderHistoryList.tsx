"use client";

import { useState } from "react";
import { OrderCard } from "@/components/OrderCard";
import type { MonthOrderGroup } from "@/lib/order-list";

export function OrderHistoryList({
  groups,
  hrefPrefix,
}: {
  groups: MonthOrderGroup[];
  hrefPrefix: string;
}) {
  const [openMonths, setOpenMonths] = useState<Set<string>>(
    () => new Set(groups.slice(0, 2).map((g) => g.key))
  );

  function toggleMonth(key: string) {
    setOpenMonths((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  if (groups.length === 0) {
    return (
      <p className="text-stone-500">
        No hay pedidos en el historial con los filtros seleccionados.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {groups.map((group) => {
        const isOpen = openMonths.has(group.key);
        return (
          <section
            key={group.key}
            className="rounded-xl border border-stone-200 bg-white overflow-hidden"
          >
            <button
              type="button"
              onClick={() => toggleMonth(group.key)}
              className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-stone-50"
            >
              <span className="font-semibold text-stone-900">
                {group.label}
              </span>
              <span className="text-sm text-stone-500">
                {group.orders.length} pedido
                {group.orders.length !== 1 ? "s" : ""}{" "}
                <span className="ml-2">{isOpen ? "▾" : "▸"}</span>
              </span>
            </button>
            {isOpen && (
              <div className="space-y-3 border-t border-stone-100 p-4">
                {group.orders.map((order) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    href={`${hrefPrefix}/${order.id}`}
                  />
                ))}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}

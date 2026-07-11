"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { ORDER_STATUS_LABELS } from "@/lib/constants";
import {
  buildOrderListQuery,
  type OrderListParams,
} from "@/lib/order-list";
import type { OrderStatus } from "@prisma/client";

const STATUS_OPTIONS: OrderStatus[] = [
  "SENT",
  "RECEIVED_BY_PROVIDER",
  "IN_PROCESS",
  "SHIPPED_TO_FINAL",
  "CANCELLED",
];

export function OrderListToolbar({
  params,
  operationalCount,
  historyTotal,
}: {
  params: OrderListParams;
  operationalCount: number;
  historyTotal: number;
}) {
  const router = useRouter();
  const [q, setQ] = useState(params.q);
  const [status, setStatus] = useState(params.status);
  const [from, setFrom] = useState(params.from);
  const [to, setTo] = useState(params.to);

  function navigate(next: Partial<OrderListParams>) {
    router.push(buildOrderListQuery({ ...params, page: 1, ...next }));
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    navigate({ q, status, from, to });
  }

  function clearFilters() {
    setQ("");
    setStatus("");
    setFrom("");
    setTo("");
    navigate({ q: "", status: "", from: "", to: "" });
  }

  const hasFilters = params.q || params.status || params.from || params.to;

  return (
    <div className="space-y-4 rounded-xl border border-stone-200 bg-white p-4">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => navigate({ view: "operational", page: 1 })}
          className={`rounded-lg px-4 py-2 text-sm font-medium ${
            params.view === "operational"
              ? "bg-wine text-white"
              : "border border-stone-300 text-stone-700 hover:bg-stone-50"
          }`}
        >
          Operativa ({operationalCount})
        </button>
        <button
          type="button"
          onClick={() => navigate({ view: "history", page: 1 })}
          className={`rounded-lg px-4 py-2 text-sm font-medium ${
            params.view === "history"
              ? "bg-wine text-white"
              : "border border-stone-300 text-stone-700 hover:bg-stone-50"
          }`}
        >
          Historial ({historyTotal})
        </button>
      </div>

      <form onSubmit={onSubmit} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Nº pedido o cliente..."
          className="rounded-lg border border-stone-300 px-3 py-2 text-sm sm:col-span-2 lg:col-span-2"
        />
        <select
          value={status}
          onChange={(e) =>
            setStatus(e.target.value as OrderListParams["status"])
          }
          className="rounded-lg border border-stone-300 px-3 py-2 text-sm"
        >
          <option value="">Todos los estados</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {ORDER_STATUS_LABELS[s]}
            </option>
          ))}
        </select>
        <input
          type="date"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          className="rounded-lg border border-stone-300 px-3 py-2 text-sm"
          title="Desde"
        />
        <input
          type="date"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          className="rounded-lg border border-stone-300 px-3 py-2 text-sm"
          title="Hasta"
        />
        <div className="flex flex-wrap gap-2 sm:col-span-2 lg:col-span-5">
          <button
            type="submit"
            className="rounded-lg bg-wine px-4 py-2 text-sm font-medium text-white"
          >
            Buscar
          </button>
          {hasFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="rounded-lg border border-stone-300 px-4 py-2 text-sm text-stone-700 hover:bg-stone-50"
            >
              Limpiar filtros
            </button>
          )}
        </div>
      </form>

      {params.view === "history" && (
        <p className="text-xs text-stone-500">
          Pedidos enviados o cancelados con más de 14 días, agrupados por mes.
        </p>
      )}
      {params.view === "operational" && (
        <p className="text-xs text-stone-500">
          Pedidos pendientes, en curso y envíos o cancelaciones recientes (últimos
          14 días).
        </p>
      )}
    </div>
  );
}

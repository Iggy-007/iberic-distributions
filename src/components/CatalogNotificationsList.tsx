"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface CatalogNotificationItem {
  id: string;
  type: string;
  summary: string;
  detail: string | null;
  read: boolean;
  createdAt: string;
  actor: { name: string; role: string };
  product: { id: string; name: string } | null;
}

export function CatalogNotificationsList() {
  const [notifications, setNotifications] = useState<CatalogNotificationItem[]>(
    []
  );
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  async function load() {
    const res = await fetch("/api/catalog-notifications");
    if (!res.ok) {
      setLoading(false);
      return;
    }
    const data = await res.json();
    setNotifications(data.notifications);
    setUnreadCount(data.unreadCount);
    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, []);

  async function markAllRead() {
    await fetch("/api/catalog-notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ markAll: true }),
    });
    await load();
  }

  if (loading) return null;

  if (notifications.length === 0) return null;

  return (
    <section className="rounded-xl border border-amber-200 bg-amber-50/80 p-5 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-stone-900">
            Cambios en el catálogo
            {unreadCount > 0 && (
              <span className="ml-2 rounded-full bg-wine px-2 py-0.5 text-xs font-medium text-white">
                {unreadCount} nuevo{unreadCount !== 1 ? "s" : ""}
              </span>
            )}
          </h2>
          <p className="text-sm text-stone-600 mt-1">
            Avisos de creación o modificación de productos, documentos y envíos.
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            type="button"
            onClick={markAllRead}
            className="text-sm text-wine hover:underline"
          >
            Marcar todo como leído
          </button>
        )}
      </div>
      <ul className="space-y-2 max-h-64 overflow-y-auto">
        {notifications.slice(0, 8).map((n) => (
          <li
            key={n.id}
            className={`rounded-lg border px-3 py-2 text-sm ${
              n.read
                ? "border-stone-200 bg-white/60 text-stone-600"
                : "border-amber-300 bg-white text-stone-800"
            }`}
          >
            <p className="font-medium">{n.summary}</p>
            {n.detail && (
              <p className="text-xs text-stone-500 mt-1 whitespace-pre-line">
                {n.detail}
              </p>
            )}
            <p className="text-xs text-stone-400 mt-1">
              {new Date(n.createdAt).toLocaleString("es-ES")}
              {n.product && (
                <>
                  {" · "}
                  <Link
                    href="/admin/products"
                    className="text-wine hover:underline"
                  >
                    Ver catálogo
                  </Link>
                </>
              )}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}

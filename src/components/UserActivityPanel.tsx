"use client";

import Link from "next/link";
import type { ActivityTimelineItem } from "@/lib/user-activity";

interface ActivityUser {
  id: string;
  name: string;
  email: string;
}

export function UserActivityPanel({
  user,
  items,
  loading,
  error,
  onClose,
}: {
  user: ActivityUser;
  items: ActivityTimelineItem[];
  loading: boolean;
  error: string;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/30">
      <div className="absolute inset-0" onClick={onClose} aria-hidden />
      <aside className="relative flex h-full w-full max-w-lg flex-col bg-white shadow-xl">
        <header className="border-b border-stone-200 px-5 py-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-stone-900">
                Actividad de {user.name}
              </h2>
              <p className="text-sm text-stone-500">{user.email}</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-2 py-1 text-stone-500 hover:bg-stone-100"
            >
              ✕
            </button>
          </div>
          <p className="mt-2 text-xs text-stone-500">
            Pedidos, cambios de estado, datos reales y acciones en la plataforma.
          </p>
        </header>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {loading && (
            <p className="text-sm text-stone-500">Cargando actividad...</p>
          )}
          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}
          {!loading && !error && items.length === 0 && (
            <p className="text-sm text-stone-500">
              Este usuario aún no tiene actividad registrada.
            </p>
          )}
          {!loading && items.length > 0 && (
            <ol className="space-y-3">
              {items.map((item) => (
                <li
                  key={item.id}
                  className="rounded-lg border border-stone-200 bg-stone-50 p-3"
                >
                  <p className="text-sm font-medium text-stone-900">
                    {item.href ? (
                      <Link
                        href={item.href}
                        className="text-wine hover:underline"
                      >
                        {item.summary}
                      </Link>
                    ) : (
                      item.summary
                    )}
                  </p>
                  {item.detail && (
                    <p className="mt-1 text-sm text-stone-600">{item.detail}</p>
                  )}
                  <p className="mt-1 text-xs text-stone-500">
                    {new Date(item.at).toLocaleString("es-ES")}
                  </p>
                </li>
              ))}
            </ol>
          )}
        </div>
      </aside>
    </div>
  );
}

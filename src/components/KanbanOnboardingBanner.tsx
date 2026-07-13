"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { btnPrimary } from "@/lib/ui-classes";

const STORAGE_KEY = "iberic-provider-kanban-onboarding";

export function KanbanOnboardingBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setVisible(localStorage.getItem(STORAGE_KEY) !== "1");
  }, []);

  if (!visible) return null;

  function dismiss() {
    localStorage.setItem(STORAGE_KEY, "1");
    setVisible(false);
  }

  return (
    <div className="rounded-xl border border-gold/40 bg-gold/10 p-4 text-sm text-stone-800 space-y-2">
      <p className="font-semibold text-stone-900">Cómo usar el tablero</p>
      <ul className="list-disc pl-5 space-y-1 text-stone-700">
        <li>Arrastre cada pedido solo a la columna siguiente (un paso).</li>
        <li>Antes de avanzar, registre los datos reales de cada línea.</li>
        <li>Para «En envío» deberá indicar empresa, tracking y teléfono del transportista.</li>
        <li>Use «Ver detalle» o «Datos reales» en cada tarjeta; en móvil, el botón «Avanzar».</li>
      </ul>
      <div className="flex flex-wrap gap-2 pt-1">
        <button type="button" onClick={dismiss} className={btnPrimary}>
          Entendido
        </button>
        <Link href="/provider/catalog" className="text-wine hover:underline self-center text-sm">
          Ver catálogo
        </Link>
      </div>
    </div>
  );
}

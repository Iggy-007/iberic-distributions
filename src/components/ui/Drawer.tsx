"use client";

import { useEffect, useId, useRef } from "react";
import { btnGhost } from "@/lib/ui-classes";

export function Drawer({
  title,
  subtitle,
  onClose,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  const titleId = useId();
  const panelRef = useRef<HTMLElement>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button
        type="button"
        className="absolute inset-0 bg-black/30"
        onClick={onClose}
        aria-label="Cerrar panel"
      />
      <aside
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="relative flex h-full w-full max-w-lg flex-col bg-white shadow-xl outline-none"
      >
        <header className="border-b border-stone-200 px-5 py-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 id={titleId} className="text-lg font-semibold text-stone-900">
                {title}
              </h2>
              {subtitle && <p className="text-sm text-stone-500">{subtitle}</p>}
            </div>
            <button
              type="button"
              onClick={onClose}
              className={btnGhost}
              aria-label="Cerrar"
            >
              ✕
            </button>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer && (
          <footer className="border-t border-stone-200 px-5 py-4">{footer}</footer>
        )}
      </aside>
    </div>
  );
}

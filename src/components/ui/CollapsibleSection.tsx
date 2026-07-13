"use client";

import { useId, useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";

export function CollapsibleSection({
  title,
  subtitle,
  defaultOpen = false,
  children,
  className,
  headerClassName,
}: {
  title: string;
  subtitle?: string;
  defaultOpen?: boolean;
  children: ReactNode;
  className?: string;
  headerClassName?: string;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const panelId = useId();

  return (
    <section
      className={cn(
        "rounded-xl border border-stone-200 bg-white overflow-hidden",
        className
      )}
    >
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-controls={panelId}
        className={cn(
          "flex w-full items-center justify-between gap-3 px-5 py-4 text-left hover:bg-stone-50/80 transition-colors",
          headerClassName
        )}
      >
        <div className="min-w-0">
          <p className="font-semibold text-stone-900 truncate">{title}</p>
          {subtitle ? (
            <p className="text-sm text-stone-500 mt-0.5 truncate">{subtitle}</p>
          ) : null}
        </div>
        <span
          className={cn(
            "shrink-0 text-stone-400 transition-transform duration-200",
            open && "rotate-180"
          )}
          aria-hidden
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M5 7.5L10 12.5L15 7.5"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </button>
      {open ? (
        <div id={panelId} className="border-t border-stone-200 px-5 py-5">
          {children}
        </div>
      ) : null}
    </section>
  );
}

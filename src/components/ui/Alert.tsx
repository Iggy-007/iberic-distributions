import { cn } from "@/lib/cn";

type Variant = "error" | "warning" | "success" | "info";

const styles: Record<Variant, string> = {
  error: "border-red-200 bg-red-50 text-red-800",
  warning: "border-amber-200 bg-amber-50 text-amber-900",
  success: "border-green-200 bg-green-50 text-green-800",
  info: "border-blue-200 bg-blue-50 text-blue-900",
};

export function Alert({
  variant = "info",
  children,
  onDismiss,
  className,
}: {
  variant?: Variant;
  children: React.ReactNode;
  onDismiss?: () => void;
  className?: string;
}) {
  return (
    <div
      role="alert"
      className={cn(
        "flex items-start justify-between gap-3 rounded-lg border px-4 py-3 text-sm",
        styles[variant],
        className
      )}
    >
      <div className="flex-1">{children}</div>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="shrink-0 font-medium underline focus:outline-none"
          aria-label="Cerrar aviso"
        >
          Cerrar
        </button>
      )}
    </div>
  );
}

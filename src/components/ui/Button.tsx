import { cn } from "@/lib/cn";
import { btnGhost, btnPrimary, btnSecondary } from "@/lib/ui-classes";

type Variant = "primary" | "secondary" | "ghost" | "danger";

const variants: Record<Variant, string> = {
  primary: btnPrimary,
  secondary: btnSecondary,
  ghost: btnGhost,
  danger:
    "inline-flex items-center justify-center rounded-lg border border-red-200 bg-white px-4 py-2.5 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-60 min-h-[44px] focus:outline-none focus:ring-2 focus:ring-red-300 focus:ring-offset-2",
};

export function Button({
  variant = "primary",
  className,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button type="button" className={cn(variants[variant], className)} {...props}>
      {children}
    </button>
  );
}

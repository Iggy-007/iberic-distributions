import { cn } from "@/lib/cn";
import { inputClass, labelClass } from "@/lib/ui-classes";

export function Label({
  htmlFor,
  children,
  className,
}: {
  htmlFor?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label htmlFor={htmlFor} className={cn(labelClass, className)}>
      {children}
    </label>
  );
}

export function Input({
  id,
  label,
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
}) {
  if (label) {
    return (
      <div>
        <Label htmlFor={id}>{label}</Label>
        <input id={id} className={cn(inputClass, "mt-1", className)} {...props} />
      </div>
    );
  }
  return <input id={id} className={cn(inputClass, className)} {...props} />;
}

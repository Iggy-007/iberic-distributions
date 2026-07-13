import { cn } from "@/lib/cn";

export function Stepper({
  steps,
  current,
}: {
  steps: string[];
  current: number;
}) {
  return (
    <div className="mb-6 space-y-2">
      <p className="text-xs font-medium text-stone-500">
        Paso {current} de {steps.length}
      </p>
      <div className="flex gap-1">
        {steps.map((label, index) => {
          const stepNum = index + 1;
          const active = stepNum === current;
          const done = stepNum < current;
          return (
            <div key={label} className="flex-1 min-w-0">
              <div
                className={cn(
                  "h-1 rounded",
                  done || active ? "bg-wine" : "bg-stone-200"
                )}
                aria-hidden
              />
              <p
                className={cn(
                  "mt-1.5 truncate text-[10px] sm:text-xs font-medium",
                  active ? "text-wine" : done ? "text-stone-600" : "text-stone-400"
                )}
              >
                {label}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

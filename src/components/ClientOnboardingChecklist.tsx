import Link from "next/link";

export function ClientOnboardingChecklist({ hasOrders }: { hasOrders: boolean }) {
  if (hasOrders) return null;

  const steps = [
    { label: "Consultar catálogo y documentación", href: "/client/catalog", done: false },
    { label: "Crear su primer pedido", href: "/client/orders/new", done: false },
    { label: "Seguir el estado en Mis pedidos", href: "/client/orders", done: false },
  ];

  return (
    <section className="rounded-xl border border-gold/30 bg-gold/5 p-5">
      <h2 className="font-semibold text-stone-900">Primeros pasos</h2>
      <p className="text-sm text-stone-600 mt-1 mb-4">
        Guía rápida para empezar a pedir con Iberic Distributions.
      </p>
      <ol className="space-y-2">
        {steps.map((step, i) => (
          <li key={step.href}>
            <Link
              href={step.href}
              className="flex items-center gap-3 rounded-lg border border-stone-200 bg-white px-4 py-3 text-sm hover:border-wine/30 transition"
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-wine text-xs font-bold text-white">
                {i + 1}
              </span>
              <span className="font-medium text-stone-800">{step.label}</span>
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}

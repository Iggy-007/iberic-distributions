"use client";

import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { Logo } from "@/components/Logo";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError("Email o contraseña incorrectos");
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-cream px-4 py-10">
      <div className="w-full max-w-lg">
        <div className="mb-10 flex justify-center sm:mb-12">
          <Logo size="hero" linked={false} />
        </div>

        <div className="rounded-2xl border border-stone-200 bg-white p-6 sm:p-8 shadow-sm">
          <p className="mb-6 text-center text-sm text-stone-500">
            Distribución B2B de productos ibéricos
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-stone-700">
                Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-stone-300 px-3 py-2 text-stone-900 focus:border-wine focus:outline-none focus:ring-1 focus:ring-wine"
                placeholder="usuario@empresa.com"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-stone-700">
                Contraseña
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-stone-300 px-3 py-2 text-stone-900 focus:border-wine focus:outline-none focus:ring-1 focus:ring-wine"
              />
            </div>

            {error && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-wine px-4 py-2.5 font-medium text-white hover:bg-wine-dark disabled:opacity-60"
            >
              {loading ? "Entrando..." : "Iniciar sesión"}
            </button>
          </form>

          <div className="mt-6 rounded-lg bg-stone-50 p-4 text-xs text-stone-500">
            <p className="font-medium text-stone-700 mb-2">Usuarios de prueba:</p>
            <p>Admin: admin@ibericdistributions.com / Admin123!</p>
            <p>Cliente (Manolo): manolo@saketeamfood.com / Manolo123!</p>
            <p>Proveedor (Jose Juan): josejuan@galvan.es / Galvan123!</p>
          </div>
        </div>
      </div>
    </div>
  );
}

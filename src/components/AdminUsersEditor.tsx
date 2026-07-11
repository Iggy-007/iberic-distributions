"use client";

import { useState } from "react";
import { ROLE_LABELS } from "@/lib/constants";
import { UserActivityPanel } from "@/components/UserActivityPanel";
import type { ActivityTimelineItem } from "@/lib/user-activity";

interface User {
  id: string;
  email: string;
  name: string;
  role: keyof typeof ROLE_LABELS;
  active: boolean;
  organization?: { name: string } | null;
}

async function parseJsonResponse(res: Response): Promise<{ error?: string }> {
  try {
    return await res.json();
  } catch {
    return {};
  }
}

export function AdminUsersEditor({
  initialUsers,
  currentUserId,
}: {
  initialUsers: User[];
  currentUserId: string;
}) {
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    email: "",
    password: "",
    name: "",
    role: "CLIENT",
    organizationName: "",
    city: "",
    street: "",
    postalCode: "",
    country: "España",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [activityUser, setActivityUser] = useState<User | null>(null);
  const [activityItems, setActivityItems] = useState<ActivityTimelineItem[]>(
    []
  );
  const [activityLoading, setActivityLoading] = useState(false);
  const [activityError, setActivityError] = useState("");
  const [deleteError, setDeleteError] = useState("");

  async function loadUsers() {
    const res = await fetch("/api/users");
    if (res.ok) setUsers(await res.json());
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        organizationType: form.role === "PROVIDER" ? "PROVIDER" : "CLIENT",
      }),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Error al crear usuario");
      return;
    }

    setShowForm(false);
    setForm({
      email: "",
      password: "",
      name: "",
      role: "CLIENT",
      organizationName: "",
      city: "",
      street: "",
      postalCode: "",
      country: "España",
    });
    loadUsers();
  }

  async function toggleActive(id: string, active: boolean) {
    await fetch(`/api/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !active }),
    });
    loadUsers();
  }

  async function openActivity(user: User) {
    setActivityUser(user);
    setActivityItems([]);
    setActivityError("");
    setActivityLoading(true);

    const res = await fetch(`/api/users/${user.id}/activity`);
    setActivityLoading(false);

    if (!res.ok) {
      const data = await parseJsonResponse(res);
      setActivityError(data.error ?? "No se pudo cargar la actividad");
      return;
    }

    const data = await res.json();
    setActivityItems(data.items);
  }

  async function deleteUser(user: User) {
    setDeleteError("");
    const confirmed = window.confirm(
      `¿Eliminar a ${user.name} (${user.email})? Esta acción no se puede deshacer.`
    );
    if (!confirmed) return;

    const res = await fetch(`/api/users/${user.id}`, { method: "DELETE" });

    if (!res.ok) {
      const data = await parseJsonResponse(res);
      setDeleteError(data.error ?? "No se pudo eliminar el usuario");
      return;
    }

    if (activityUser?.id === user.id) {
      setActivityUser(null);
    }
    loadUsers();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Usuarios</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="rounded-lg bg-wine px-4 py-2 text-sm font-medium text-white"
        >
          {showForm ? "Cancelar" : "Crear usuario"}
        </button>
      </div>

      {deleteError && (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {deleteError}
        </p>
      )}

      {showForm && (
        <form
          onSubmit={handleCreate}
          className="rounded-xl border border-stone-200 bg-white p-5 grid gap-3 sm:grid-cols-2"
        >
          <input
            required
            placeholder="Nombre"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="rounded-lg border border-stone-300 px-3 py-2"
          />
          <input
            required
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="rounded-lg border border-stone-300 px-3 py-2"
          />
          <input
            required
            type="password"
            placeholder="Contraseña (mín. 8 caracteres)"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            className="rounded-lg border border-stone-300 px-3 py-2"
          />
          <select
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
            className="rounded-lg border border-stone-300 px-3 py-2"
          >
            <option value="CLIENT">Cliente</option>
            <option value="PROVIDER">Proveedor</option>
            <option value="ADMIN">Administrador</option>
          </select>
          <input
            placeholder="Organización"
            value={form.organizationName}
            onChange={(e) =>
              setForm({ ...form, organizationName: e.target.value })
            }
            className="rounded-lg border border-stone-300 px-3 py-2 sm:col-span-2"
          />
          {(form.role === "CLIENT" || form.role === "PROVIDER") && (
            <>
              <p className="text-sm font-medium text-stone-700 sm:col-span-2">
                Dirección postal
              </p>
              <input
                placeholder="Calle y número"
                value={form.street}
                onChange={(e) => setForm({ ...form, street: e.target.value })}
                className="rounded-lg border border-stone-300 px-3 py-2 sm:col-span-2"
              />
              <input
                placeholder="Código postal"
                value={form.postalCode}
                onChange={(e) =>
                  setForm({ ...form, postalCode: e.target.value })
                }
                className="rounded-lg border border-stone-300 px-3 py-2"
              />
              <input
                placeholder="Ciudad"
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                className="rounded-lg border border-stone-300 px-3 py-2"
              />
              <input
                placeholder="País"
                value={form.country}
                onChange={(e) => setForm({ ...form, country: e.target.value })}
                className="rounded-lg border border-stone-300 px-3 py-2 sm:col-span-2"
              />
            </>
          )}
          {error && (
            <p className="text-sm text-red-600 sm:col-span-2">{error}</p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-wine px-4 py-2 text-white sm:col-span-2 disabled:opacity-60"
          >
            {loading ? "Creando..." : "Crear usuario"}
          </button>
        </form>
      )}

      {users.length === 0 ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          No hay usuarios. Ejecuta <code className="font-mono">npm run db:seed</code>{" "}
          para restaurar los usuarios de prueba.
        </p>
      ) : (
        <div className="rounded-xl border border-stone-200 bg-white overflow-x-auto">
          <table className="w-full text-sm min-w-[48rem]">
            <thead className="bg-stone-50 text-left">
              <tr>
                <th className="px-4 py-3">Nombre</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Rol</th>
                <th className="px-4 py-3">Organización</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-t border-stone-100">
                  <td className="px-4 py-3">{u.name}</td>
                  <td className="px-4 py-3">{u.email}</td>
                  <td className="px-4 py-3">{ROLE_LABELS[u.role]}</td>
                  <td className="px-4 py-3">{u.organization?.name ?? "—"}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleActive(u.id, u.active)}
                      className={`text-xs rounded-full px-2 py-0.5 ${
                        u.active
                          ? "bg-green-100 text-green-800"
                          : "bg-stone-100 text-stone-600"
                      }`}
                    >
                      {u.active ? "Activo" : "Inactivo"}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => openActivity(u)}
                        className="text-xs text-wine hover:underline"
                      >
                        Actividad
                      </button>
                      {u.id !== currentUserId && (
                        <button
                          type="button"
                          onClick={() => deleteUser(u)}
                          className="text-xs text-red-600 hover:underline"
                        >
                          Eliminar
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activityUser && (
        <UserActivityPanel
          user={activityUser}
          items={activityItems}
          loading={activityLoading}
          error={activityError}
          onClose={() => setActivityUser(null)}
        />
      )}
    </div>
  );
}

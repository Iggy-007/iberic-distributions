"use client";

import { useState } from "react";
import type { Role } from "@prisma/client";
import { ROLE_LABELS } from "@/lib/constants";
import { UserActivityPanel } from "@/components/UserActivityPanel";
import type { ActivityTimelineItem } from "@/lib/user-activity";

interface UserOrganization {
  id: string;
  name: string;
  street?: string | null;
  city?: string | null;
  postalCode?: string | null;
  country?: string;
}

interface User {
  id: string;
  email: string;
  name: string;
  phone?: string | null;
  role: keyof typeof ROLE_LABELS;
  active: boolean;
  organization?: UserOrganization | null;
}

type UserFormState = {
  email: string;
  password: string;
  name: string;
  phone: string;
  role: Role;
  organizationName: string;
  city: string;
  street: string;
  postalCode: string;
  country: string;
};

const emptyForm = (): UserFormState => ({
  email: "",
  password: "",
  name: "",
  phone: "",
  role: "CLIENT",
  organizationName: "",
  city: "",
  street: "",
  postalCode: "",
  country: "España",
});

function organizationTypeForRole(role: Role) {
  if (role === "PROVIDER") return "PROVIDER";
  if (role === "ADMIN") return "ADMIN";
  return "CLIENT";
}

async function parseJsonResponse(res: Response): Promise<{ error?: string }> {
  try {
    return await res.json();
  } catch {
    return {};
  }
}

function UserFormFields({
  form,
  setForm,
  mode,
}: {
  form: UserFormState;
  setForm: (form: UserFormState) => void;
  mode: "create" | "edit";
}) {
  return (
    <>
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
        type="tel"
        placeholder="Teléfono"
        value={form.phone}
        onChange={(e) => setForm({ ...form, phone: e.target.value })}
        className="rounded-lg border border-stone-300 px-3 py-2"
      />
      <input
        required={mode === "create"}
        type="password"
        placeholder={
          mode === "create"
            ? "Contraseña (mín. 8 caracteres)"
            : "Nueva contraseña (opcional)"
        }
        value={form.password}
        onChange={(e) => setForm({ ...form, password: e.target.value })}
        className="rounded-lg border border-stone-300 px-3 py-2"
      />
      <fieldset className="sm:col-span-2 rounded-lg border border-stone-200 p-3">
        <legend className="px-1 text-sm font-medium text-stone-700">
          Rol del usuario
        </legend>
        <div className="mt-2 flex flex-wrap gap-4">
          {(["CLIENT", "PROVIDER", "ADMIN"] as const).map((role) => (
            <label
              key={role}
              className="flex cursor-pointer items-center gap-2 text-sm text-stone-800"
            >
              <input
                type="radio"
                name={mode === "create" ? "userRoleCreate" : "userRoleEdit"}
                value={role}
                checked={form.role === role}
                onChange={() => setForm({ ...form, role })}
                className="text-wine focus:ring-wine"
              />
              {ROLE_LABELS[role]}
            </label>
          ))}
        </div>
      </fieldset>
      <input
        placeholder={
          form.role === "ADMIN"
            ? "Organización (opcional)"
            : "Organización"
        }
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
    </>
  );
}

export function AdminUsersEditor({
  initialUsers,
  currentUserId,
}: {
  initialUsers: User[];
  currentUserId: string;
}) {
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [form, setForm] = useState<UserFormState>(emptyForm);
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

  function resetForms() {
    setForm(emptyForm());
    setError("");
    setShowCreateForm(false);
    setEditingUserId(null);
  }

  function startEdit(user: User) {
    setShowCreateForm(false);
    setEditingUserId(user.id);
    setError("");
    setForm({
      email: user.email,
      password: "",
      name: user.name,
      phone: user.phone ?? "",
      role: user.role,
      organizationName: user.organization?.name ?? "",
      street: user.organization?.street ?? "",
      postalCode: user.organization?.postalCode ?? "",
      city: user.organization?.city ?? "",
      country: user.organization?.country ?? "España",
    });
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
        organizationType: organizationTypeForRole(form.role),
      }),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Error al crear usuario");
      return;
    }

    resetForms();
    loadUsers();
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!editingUserId) return;

    setLoading(true);
    setError("");

    const payload: Record<string, unknown> = {
      name: form.name,
      email: form.email,
      phone: form.phone.trim() || null,
      role: form.role,
      organizationName: form.organizationName,
      organizationType: organizationTypeForRole(form.role),
      street: form.street,
      city: form.city,
      postalCode: form.postalCode,
      country: form.country,
    };

    if (form.password.trim()) {
      payload.password = form.password;
    }

    const res = await fetch(`/api/users/${editingUserId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Error al actualizar usuario");
      return;
    }

    resetForms();
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
    if (editingUserId === user.id) {
      resetForms();
    }
    loadUsers();
  }

  const editingUser = users.find((u) => u.id === editingUserId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Usuarios</h1>
        <button
          onClick={() => {
            if (showCreateForm) {
              resetForms();
            } else {
              setEditingUserId(null);
              setForm(emptyForm());
              setError("");
              setShowCreateForm(true);
            }
          }}
          className="rounded-lg bg-wine px-4 py-2 text-sm font-medium text-white"
        >
          {showCreateForm ? "Cancelar" : "Crear usuario"}
        </button>
      </div>

      {deleteError && (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {deleteError}
        </p>
      )}

      {showCreateForm && (
        <form
          onSubmit={handleCreate}
          className="rounded-xl border border-stone-200 bg-white p-5 grid gap-3 sm:grid-cols-2"
        >
          <h2 className="sm:col-span-2 text-lg font-semibold text-stone-900">
            Nuevo usuario
          </h2>
          <UserFormFields form={form} setForm={setForm} mode="create" />
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

      {editingUser && (
        <form
          onSubmit={handleUpdate}
          className="rounded-xl border border-wine/20 bg-wine/5 p-5 grid gap-3 sm:grid-cols-2"
        >
          <div className="sm:col-span-2 flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-stone-900">
              Editar usuario: {editingUser.name}
            </h2>
            <button
              type="button"
              onClick={resetForms}
              className="text-sm text-stone-600 hover:underline"
            >
              Cancelar edición
            </button>
          </div>
          <UserFormFields form={form} setForm={setForm} mode="edit" />
          {error && (
            <p className="text-sm text-red-600 sm:col-span-2">{error}</p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-wine px-4 py-2 text-white sm:col-span-2 disabled:opacity-60"
          >
            {loading ? "Guardando..." : "Guardar cambios"}
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
          <table className="w-full text-sm min-w-[32rem] md:min-w-[48rem]">
            <thead className="bg-stone-50 text-left">
              <tr>
                <th className="px-4 py-3">Nombre</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3 hidden md:table-cell">Teléfono</th>
                <th className="px-4 py-3">Rol</th>
                <th className="px-4 py-3 hidden lg:table-cell">Organización</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr
                  key={u.id}
                  className={`border-t border-stone-100 ${
                    editingUserId === u.id ? "bg-wine/5" : ""
                  }`}
                >
                  <td className="px-4 py-3">{u.name}</td>
                  <td className="px-4 py-3">{u.email}</td>
                  <td className="px-4 py-3 hidden md:table-cell">{u.phone ?? "—"}</td>
                  <td className="px-4 py-3">{ROLE_LABELS[u.role]}</td>
                  <td className="px-4 py-3 hidden lg:table-cell">{u.organization?.name ?? "—"}</td>
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
                        onClick={() => startEdit(u)}
                        className="text-xs text-wine hover:underline"
                      >
                        Editar
                      </button>
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

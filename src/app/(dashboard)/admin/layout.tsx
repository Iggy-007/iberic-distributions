import { redirect } from "next/navigation";
import { Role } from "@prisma/client";
import { getSession } from "@/lib/auth";
import { DashboardShell } from "@/components/DashboardShell";

const adminNav = [
  { href: "/admin", label: "Panel" },
  { href: "/admin/orders", label: "Pedidos" },
  { href: "/admin/products", label: "Catálogo" },
];

const adminNavEnd = [{ href: "/admin/users", label: "Usuarios" }];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.user.role !== Role.ADMIN) redirect("/");

  return (
    <DashboardShell nav={adminNav} navEnd={adminNavEnd} session={session}>
      {children}
    </DashboardShell>
  );
}

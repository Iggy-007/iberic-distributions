import { redirect } from "next/navigation";
import { Role } from "@prisma/client";
import { getSession } from "@/lib/auth";
import { DashboardShell } from "@/components/DashboardShell";

const clientNav = [
  { href: "/client", label: "Inicio" },
  { href: "/client/orders/new", label: "Nuevo pedido" },
  { href: "/client/orders", label: "Mis pedidos" },
  { href: "/client/catalog", label: "Catálogo" },
];

export default async function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.user.role !== Role.CLIENT) redirect("/");

  return <DashboardShell nav={clientNav} session={session}>{children}</DashboardShell>;
}

import { redirect } from "next/navigation";
import { Role } from "@prisma/client";
import { getSession } from "@/lib/auth";
import { DashboardShell } from "@/components/DashboardShell";

const providerNav = [
  { href: "/provider", label: "Panel" },
  { href: "/provider/orders", label: "Pedidos" },
  { href: "/provider/catalog", label: "Catálogo" },
];

export default async function ProviderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.user.role !== Role.PROVIDER) redirect("/");

  return <DashboardShell nav={providerNav} session={session}>{children}</DashboardShell>;
}

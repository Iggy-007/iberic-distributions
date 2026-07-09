import { prisma } from "@/lib/prisma";
import { AdminUsersEditor } from "@/components/AdminUsersEditor";

export default async function AdminUsersPage() {
  const users = await prisma.user.findMany({
    include: { organization: true },
    orderBy: { createdAt: "desc" },
  });

  return <AdminUsersEditor initialUsers={users} />;
}

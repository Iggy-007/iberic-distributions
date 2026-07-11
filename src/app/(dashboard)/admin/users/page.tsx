import { prisma } from "@/lib/prisma";
import { getRequiredSession } from "@/lib/auth";
import { AdminUsersEditor } from "@/components/AdminUsersEditor";

export default async function AdminUsersPage() {
  const session = await getRequiredSession();
  const users = await prisma.user.findMany({
    include: { organization: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <AdminUsersEditor
      initialUsers={users}
      currentUserId={session.user.id}
    />
  );
}

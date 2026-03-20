import { requireAdmin } from "@/lib/session";
import { Nav } from "@/components/Nav";
import { UserTable } from "@/components/admin/UserTable";
import { prisma } from "@/lib/prisma";

export default async function AdminPage() {
  const session = await requireAdmin();

  const users = await prisma.user.findMany({
    select: { id: true, username: true, email: true, role: true, created_at: true },
    orderBy: { created_at: "asc" },
  });

  return (
    <div className="min-h-screen">
      <Nav />
      <main className="pt-16">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-white">User Management</h1>
            <p className="text-slate-400 text-sm mt-1">
              Add or remove users who can access Job Helper
            </p>
          </div>

          <UserTable initialUsers={users} currentUserId={session.user.id} />
        </div>
      </main>
    </div>
  );
}

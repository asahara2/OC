import { AdminNav } from "@/components/admin/nav";
import { getStaffSession, permissionsForStaffSession } from "@/lib/staff-auth";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const session = await getStaffSession();
  return <div className="admin-shell"><AdminNav staffPermissions={session ? permissionsForStaffSession(session) : undefined} /><main className="admin-content">{children}</main></div>;
}

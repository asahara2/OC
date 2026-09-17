import { AdminNav } from "@/components/admin/nav";

export const dynamic = "force-dynamic";

export default function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <div className="admin-shell"><AdminNav /><main className="admin-content">{children}</main></div>;
}

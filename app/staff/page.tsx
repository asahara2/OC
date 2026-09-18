import Link from "next/link";
import { redirect } from "next/navigation";

import { getStaffSession, permissionsForStaffSession, type StaffPermission } from "@/lib/staff-auth";

export const dynamic = "force-dynamic";

export default async function StaffPage() {
  const session = await getStaffSession();
  if (!session) redirect("/staff/login");
  const permissions = permissionsForStaffSession(session);
  const links: [string, string, StaffPermission][] = [["ニュース", "/admin/news", "news_write"], ["憲章", "/admin/constitution", "constitution_write"], ["投票", "/admin/polls", "poll_manage"], ["メッセージ", "/admin/messages", "message_publish"]];
  return <main className="container"><h1>運営パネル</h1><p className="muted">役職: {session.role}</p><div className="admin-grid">{links.filter(([, , permission]) => permissions.includes(permission)).map(([name, href]) => <Link className="card" href={href} key={href}><h2>{name}</h2><p>管理画面を開く</p></Link>)}</div></main>;
}

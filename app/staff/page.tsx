import Link from "next/link";
import { redirect } from "next/navigation";

import { getStaffSession } from "@/lib/staff-auth";

export const dynamic = "force-dynamic";

export default async function StaffPage() {
  const session = await getStaffSession();
  if (!session) redirect("/staff/login");
  const links = [["ニュース", "/admin/news"], ["憲章", "/admin/constitution"], ["投票", "/admin/polls"], ["メッセージ", "/admin/messages"]];
  return <main className="container"><h1>運営パネル</h1><p className="muted">役職: {session.role}</p><div className="admin-grid">{links.map(([name, href]) => <Link className="card" href={href} key={href}><h2>{name}</h2><p>管理画面を開く</p></Link>)}</div></main>;
}

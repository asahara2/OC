import { PollList } from "@/components/public/poll-list";
import { listPublicPolls } from "@/lib/content";

export const dynamic = "force-dynamic";

export default async function PollsPage() {
  return <div className="oc-document"><header className="oc-document-heading"><p className="oc-eyebrow">05 / COMMUNITY POLLS</p><h1>共同体投票</h1><p>ログインなしで参加できる、現在の共同体アンケートです。</p></header><PollList polls={await listPublicPolls()} /></div>;
}

import { listPublicMessages } from "@/lib/content";

export const dynamic = "force-dynamic";

export default async function MessagesPage() {
  const messages = await listPublicMessages();
  return <div className="oc-document"><header className="oc-document-heading"><p className="oc-eyebrow">06 / LIVE DISPATCHES</p><h1>共同体からのメッセージ</h1><p>運営からの最新の発信です。</p></header><div className="oc-poll-list">{messages.map((message) => <article className="oc-poll" key={message.id}><p className="oc-eyebrow">{message.kind === "troll" ? "TROLL" : "MESSAGE"}</p><div className="oc-reading-body prose">{message.body}</div></article>)}{messages.length === 0 ? <div className="oc-empty"><p>現在、公開中のメッセージはありません。</p></div> : null}</div></div>;
}

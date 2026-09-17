// Presentation contract only. A future backend can pass a real published agenda.
// null means unavailable, never zero votes. This component does not accept votes.
export type AssemblyPresentation = {
  title: string;
  description: string;
  votes: { approve: number; oppose: number } | null;
};

export function AssemblyExhibit({ agenda = null }: { agenda?: AssemblyPresentation | null }) {
  const votes = agenda?.votes;
  const valid = votes && Number.isSafeInteger(votes.approve) && votes.approve >= 0 && Number.isSafeInteger(votes.oppose) && votes.oppose >= 0;
  const total = valid ? votes.approve + votes.oppose : 0;
  return <div className="oc-assembly-exhibit" data-voting-connected={Boolean(agenda)}>
    <div className="oc-assembly-axis" aria-hidden="true"><span /><span /><span /></div>
    <div className="oc-assembly-agenda" data-spatial-panel>
      <p className="oc-eyebrow">{agenda ? "PUBLISHED AGENDA" : "AWAITING AN AGENDA"}</p>
      <h3>{agenda?.title ?? "次の問いを、この場所で。"}</h3>
      <p>{agenda?.description ?? "共同体の意思が集まる、対話の空間。"}</p>
      {!agenda ? <small>総会・投票システムは未接続です。現在、議案や投票結果は表示していません。</small> : null}
    </div>
    <dl className="oc-vote-display" aria-label="投票状況">
      {(["approve", "oppose"] as const).map((key) => <div key={key}><dt>{key === "approve" ? "賛成" : "反対"}<span>{key === "approve" ? "APPROVE" : "OPPOSE"}</span></dt>
        <dd>{valid ? votes[key].toLocaleString("ja-JP") : "—"}<small>{valid ? "票" : "未接続"}</small></dd>
        {valid ? <meter min={0} max={Math.max(total, 1)} value={votes[key]} aria-label={key === "approve" ? "賛成票の割合" : "反対票の割合"} /> : null}
      </div>)}
    </dl>
  </div>;
}

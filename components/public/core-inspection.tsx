"use client";

import { useEffect, useRef } from "react";
import { INSPECT_CORE } from "@/components/three/journey-state";
import { Emblem } from "./icons";

export function CoreInspection() {
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const open = () => { if (!dialog.current?.open) dialog.current?.showModal(); };
    window.addEventListener(INSPECT_CORE, open);
    return () => window.removeEventListener(INSPECT_CORE, open);
  }, []);
  return <>
    <button ref={trigger} type="button" className="oc-core-inspect oc-text-link" aria-haspopup="dialog" onClick={() => dialog.current?.showModal()}>Origin Coreをひらく <span aria-hidden="true">＋</span></button>
    <dialog ref={dialog} className="oc-core-dialog" aria-labelledby="core-dialog-title" onClose={() => trigger.current?.focus({ preventScroll: true })}>
      <form method="dialog"><button className="oc-dialog-close" aria-label="Origin Coreの説明を閉じる">閉じる ×</button></form>
      <Emblem /><p className="oc-eyebrow">THE ORIGIN / OBJECT 001</p><h2 id="core-dialog-title">ふたつから、ひとつへ。</h2>
      <p>向かい合う曲面。重なる光。Origin Coreは、異なる存在が共に在ることを表した、共同体の抽象的なシンボルです。</p>
      <dl><div><dt>自由</dt><dd>自ら問い、自ら選ぶ。</dd></div><div><dt>平等</dt><dd>異なる声が、等しく在る。</dd></div><div><dt>平和</dt><dd>対話から、共に歩む。</dd></div></dl>
      <a href="/constitution" className="oc-text-link">共同体憲章へ ↗</a>
    </dialog>
  </>;
}

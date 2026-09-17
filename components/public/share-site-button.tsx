"use client";

import QRCode from "qrcode";
import { useRef, useState } from "react";

export function ShareSiteButton() {
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const [url, setUrl] = useState("");
  const [qrCode, setQrCode] = useState("");
  const [copied, setCopied] = useState(false);

  async function openDialog() {
    const siteUrl = `${window.location.origin}/`;
    setUrl(siteUrl);
    setCopied(false);
    dialog.current?.showModal();
    try {
      setQrCode(await QRCode.toDataURL(siteUrl, {
        errorCorrectionLevel: "M",
        margin: 2,
        width: 320,
        color: { dark: "#0a080d", light: "#fff9fc" },
      }));
    } catch {
      setQrCode("");
    }
  }

  async function copyUrl() {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  async function share() {
    if (!url || !navigator.share) return;
    try {
      await navigator.share({ title: "おっぱい共同体公式サイト", text: "おっぱい共同体", url });
    } catch {
      // A dismissed system share sheet is not an application error.
    }
  }

  return <>
    <button ref={trigger} type="button" className="oc-nav-share" aria-haspopup="dialog" onClick={openDialog}>サイトを共有</button>
    <dialog ref={dialog} className="oc-share-dialog" aria-labelledby="share-dialog-title" onClose={() => trigger.current?.focus({ preventScroll: true })}>
      <form method="dialog"><button className="oc-dialog-close" aria-label="サイト共有を閉じる">閉じる ×</button></form>
      <p className="oc-eyebrow">OC / SHARE THE SIGNAL</p>
      <h2 id="share-dialog-title">このサイトを共有</h2>
      <p>QRコードを読み取るか、URLをコピーして共有できます。</p>
      <div className="oc-qr-surface">{qrCode ? <>
        {/* QR data URLs are generated locally and cannot use Next image optimization. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={qrCode} width="240" height="240" alt="おっぱい共同体公式サイトのQRコード" />
      </> : <span>QRコードを準備中です。</span>}</div>
      <code>{url}</code>
      <div className="oc-share-actions"><button type="button" onClick={copyUrl}>{copied ? "コピーしました" : "URLをコピー"}</button>{typeof navigator !== "undefined" && "share" in navigator ? <button type="button" className="oc-share-native" onClick={share}>共有メニューを開く</button> : null}</div>
    </dialog>
  </>;
}

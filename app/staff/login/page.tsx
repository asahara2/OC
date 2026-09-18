"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function StaffLoginPage() {
  const router = useRouter(); const [error, setError] = useState(""); const [pending, setPending] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); setPending(true); setError(""); const form = new FormData(event.currentTarget); const response = await fetch("/api/staff/login", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ username: form.get("username"), password: form.get("password") }) }); const data = await response.json() as { error?: string }; if (!response.ok) { setError(data.error ?? "ログインできませんでした。"); setPending(false); return; } router.push("/staff"); router.refresh(); }
  return <main className="container"><h1>運営者ログイン</h1><form className="card stack" onSubmit={submit}><label>ID<input name="username" required autoComplete="username" /></label><label>パスワード<input name="password" type="password" required autoComplete="current-password" /></label>{error ? <p role="alert">{error}</p> : null}<button disabled={pending}>{pending ? "確認中…" : "ログイン"}</button></form></main>;
}

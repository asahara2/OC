// Test-only HTTP fixture for server-rendered UI. Not imported by application
// code, not a mock mode, and never connected to a real Supabase project.
import { createServer } from "node:http";

let scenario = "empty";
const timestamp = "2026-09-01T00:00:00Z";
const common = { created_at: timestamp, updated_at: timestamp };
const database = {
  news: [{ ...common, id: "00000000-0000-4000-8000-000000000001", title: "検証用ニュース：自由な探究のはじまり", slug: "ui-verification", excerpt: "これはUIの表示確認専用データです。", content: "本文の改行と文字列の表示を確認します。\n<script>window.unwanted = true</script>", is_published: true, published_at: timestamp }],
  leaders: [{ ...common, id: "00000000-0000-4000-8000-000000000002", name: "検証用 指導者", slug: "ui-leader", biography: "既存のSupabase取得関数を経由した、UI検証専用の紹介文です。", image_url: null, role_id: "00000000-0000-4000-8000-000000000003", role: { name: "検証用役職", slug: "ui-role" }, is_active: true, display_order: 0 }],
  roles: [{ ...common, id: "00000000-0000-4000-8000-000000000003", name: "検証用役職", slug: "ui-role", description: "テストデータ", display_order: 0, is_active: true }],
  constitution_articles: [{ ...common, id: "00000000-0000-4000-8000-000000000004", article_number: 1, title: "検証用条文", content: "自由な探究を尊重する。\nこれは本番DBとは無関係のUI検証専用データです。", display_order: 0, is_published: true }],
};

createServer(async (request, response) => {
  const url = new URL(request.url, "http://127.0.0.1:54329");
  if (url.pathname === "/health") { response.end("ok"); return; }
  if (url.pathname === "/portrait.svg") {
    response.setHeader("Content-Type", "image/svg+xml");
    response.end('<svg xmlns="http://www.w3.org/2000/svg" width="480" height="640" viewBox="0 0 480 640"><rect width="480" height="640" fill="#191220"/><circle cx="240" cy="215" r="98" fill="#997d92"/><path d="M80 590v-95a160 160 0 0 1 320 0v95" fill="#5b465e"/><text x="240" y="620" fill="#dbc0d5" text-anchor="middle" font-size="14">UI TEST PORTRAIT — NOT A REAL PERSON</text></svg>');
    return;
  }
  if (url.pathname === "/__scenario" && request.method === "POST") {
    const chunks = []; for await (const chunk of request) chunks.push(chunk);
    scenario = JSON.parse(Buffer.concat(chunks).toString()).scenario;
    response.end("ok"); return;
  }
  if (!["GET", "HEAD"].includes(request.method)) { response.writeHead(405).end(); return; }
  const table = url.pathname.split("/").pop();
  let data = [];
  if (table === "site_settings") {
    data = [
      { key: "site_name", value: scenario === "custom" ? "管理画面で設定した共同体名" : "Organization", is_public: true },
      { key: "site_description", value: scenario === "custom" ? "管理画面で設定したキャッチコピー" : "Official website", is_public: true },
      { key: "contact_email", value: "", is_public: true },
    ];
  } else if (scenario !== "empty") data = database[table] ?? [];
  if (scenario === "journey" && table === "leaders") data = data.map((leader) => ({ ...leader, image_url: "http://127.0.0.1:54329/portrait.svg" }));
  if (scenario === "journey" && table === "constitution_articles") data = Array.from({ length: 3 }, (_, index) => ({ ...database.constitution_articles[0], id: `article-${index}`, article_number: index + 1, title: ["自由への問い", "異なる声の共存", "対話からはじまる平和"][index], content: index === 1 ? "これはUI検証専用の長い本文です。本文は省略せず、検索・選択できるHTMLとして保持します。\n".repeat(8) : database.constitution_articles[0].content }));
  if (url.searchParams.has("slug")) data = data.filter((item) => item.slug === url.searchParams.get("slug").replace(/^eq\./, ""));
  if (url.searchParams.has("limit")) data = data.slice(0, Number(url.searchParams.get("limit")));
  response.setHeader("Content-Type", "application/json");
  response.setHeader("Content-Range", `0-${Math.max(data.length - 1, 0)}/${data.length}`);
  const single = request.headers.accept?.includes("application/vnd.pgrst.object+json");
  response.end(request.method === "HEAD" ? undefined : JSON.stringify(single ? data[0] ?? null : data));
}).listen(54329, "127.0.0.1", () => console.log("UI fixtures listening on 127.0.0.1:54329 (no real database)"));

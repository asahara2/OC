# おっぱい共同体公式サイト

公開UIの構成、3D品質調整、表示部品と既存データ層の境界、ブラウザ検証方法は [docs/UI.md](docs/UI.md) を参照してください。

Next.js App Router と Supabase を使う、公開サイトと最小限の管理画面です。ニュース、憲章、指導者、役職、サイト設定を管理できます。`/admin` はHTTP Basic Authenticationで保護され、更新処理はServer Actionsからのみ実行されます。

## 必要環境

- Node.js 20.9 以上
- Supabase プロジェクト
- （本番）Vercel プロジェクト

## ローカルセットアップ

1. 依存関係をインストールします。

   ```bash
   npm install
   ```

2. `.env.example` を `.env.local` にコピーし、Supabase の Project URL、anon key、service role key と管理者認証情報を設定します。

   `SUPABASE_SERVICE_ROLE_KEY` はサーバー専用です。Git、ブラウザ、`NEXT_PUBLIC_` 付きの環境変数には絶対に含めないでください。

3. Supabase CLI を使う場合はログイン後にプロジェクトをリンクして migration を適用します。

   ```bash
   npx supabase login
   npx supabase link --project-ref <project-ref>
   npx supabase db push
   ```

   CLIを使わない場合は、[supabase/migrations/20260917000000_initial_schema.sql](supabase/migrations/20260917000000_initial_schema.sql) を Supabase SQL Editor で実行してください。

4. 開発サーバーを起動します。

   ```bash
   npm run dev
   ```

   公開サイトは `/`、管理画面は `/admin` です。`/admin` にアクセスすると `ADMIN_USERNAME` / `ADMIN_PASSWORD` の入力を求められます。

## 環境変数

| 変数 | 用途 |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase プロジェクトURL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | RLSが適用される公開読取用キー |
| `SUPABASE_SERVICE_ROLE_KEY` | 管理Server Actions専用キー |
| `ADMIN_USERNAME` | `/admin` のBasic Authユーザー名 |
| `ADMIN_PASSWORD` | `/admin` のBasic Authパスワード |

## セキュリティ設計

- DBはRLSを有効化し、匿名利用者には公開済みコンテンツの `SELECT` だけを許可します。
- DBの書込みポリシーは作成していません。管理操作はBasic Authを通過したサーバー側のservice role clientだけが実行します。
- Server Actionsでも認証ヘッダーを再検証するため、`/admin` ミドルウェアを迂回したリクエストを拒否します。
- Basic Authの資格情報は平文比較せず、固定長のSHA-256ダイジェストを比較します。必ずHTTPSが提供されるVercel等で運用してください。
- 入力値はServer ActionごとにZodで検証し、公開本文はHTMLとして解釈せずテキストとして表示します。

## 検証コマンド

```bash
npm run lint
npm run typecheck
npm run build
```

## Vercelへのデプロイ

1. リポジトリをVercelにimportします。フレームワーク設定はNext.jsのままで構いません。
2. 上記5個の環境変数を Vercel Project Settings の Preview と Production に登録します。
3. Supabase migration を適用済みであることを確認してデプロイします。

`vercel.json` にランタイム依存の設定は置かず、Vercelの標準Next.jsビルドを利用します。セキュリティヘッダーは [next.config.ts](next.config.ts) に定義しています。

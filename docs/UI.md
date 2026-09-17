# 公開UI / Origin experience

`ui/astra-redesign` は公開画面の表示専用の変更です。Supabase schema、API、Server Actions、Basic Auth、環境変数、CRUD、管理画面のロジックは変更していません。

## 表示とデータの境界

- `app/(public)/page.tsx` は既存の `lib/content.ts` の取得関数からニュース・指導者・憲章・サイト設定を読み込み、`HomeExperience` に渡します。
- `components/public/` に表示部品、`app/(public)/public.css` に `.public-site` 配下だけに適用する公開用スタイルを置いています。管理画面のCSSに干渉しません。
- `lib/presentation.ts` は未設定または初期seedの `Organization` / `Official website` を指定された日本語の初期表示に変換します。管理画面で別の値を保存すると、そちらが優先されます。DBの値や取得処理は変更しません。
- フッターの団体区分、`OC2026@proton.me`、デザイナー表記は指定どおり固定表示します。DBに別の問い合わせ先が保存されている場合も、追加表示して保持します。
- ホームの統計は取得した公開レコードの件数です。会員数等を架空の数字で補っていません。
- 既存DBにはテーマ / 3D背景設定の項目がありません。新しいschemaや管理項目は追加せず、描画パラメーターは3D部品に閉じています。

## 3Dの構成

`components/three/origin-experience.tsx` は機能検出と表示切替だけを担当し、`origin-canvas.tsx` を動的importします。Three.jsはホームでのみロードします。既存React 19.3とReact Three Fiberのpeer条件が一致しないため、Reactを変更せずThree.jsを直接使っています。

遠景の巨大リングと光の柱、深度を持つ粒子、中景の双球・ガラス・軌道、前景の拡散光を別々のZ座標に配置しています。環境反射マップ、形状、光はローカルで生成し、外部モデル・HDRI・テクスチャの通信はありません。スクロールはブラウザ標準で、位置の読取りだけを行います。

品質はポインター種別・画面幅・論理コア数・利用可能なメモリー情報・Save-Dataを使って初期選択します。

| 品質 | 描画 |
| --- | --- |
| High | 64分割球体、屈折 / 虹彩、380粒子、最大DPR 1.75、最大60fps |
| Medium | 40分割球体、屈折、180粒子、最大DPR 1.25、最大30fps |
| Low | 24分割球体、反射材質（屈折パス省略）、65粒子、最大DPR 1、最大30fps |

総ピクセル数にも上限を設け、持続的な低フレームレートを検出した場合はDPRを下げます。端末性能の検出値が提供されないブラウザもあるため、この品質選択は推定であり、実機のfps保証ではありません。

- `prefers-reduced-motion` では静止描画。リサイズ以外に継続的なレンダリングを行いません。
- 通常時も「空間の動きを止める」ボタンで停止できます。タブが非表示の場合は描画ループを停止します。
- WebGL 2非対応、コンテキストロスト、描画部品エラーではCSSフォールバックへ切り替えます。本文やリンクは3Dの準備を待たず表示します。
- アンマウント時はRAF・ResizeObserver・イベントリスナーを解除し、geometry / material / environment render target / rendererをdisposeし、WebGL contextを解放します。

## 検証

```bash
npm run build
npm run lint
npm run typecheck
npx playwright install chromium
npm run test:ui
```

`tests/ui/fixture-server.mjs` は、実Supabaseの接続情報がなくてもUIを検証するためのテスト専用HTTPサービスです。テストが起動したNext.jsプロセスにだけ、ローカルURLと無効なテストキーを渡します。アプリ本体にモックモード・別ルート・テストデータを加えていません。実DBのCRUDやRLSの結合テストを代替するものではありません。

`127.0.0.1:3035` と `127.0.0.1:54329` を使用します。他の開発サーバーを再利用しません。Desktop / Laptop / Tablet / iPhone / Androidのエミュレーション、console / hydration、通常データ・空データ・設定変更、WebGL無効化、reduced-motion、低性能端末、複数回の画面遷移、WebGLリソース解放を検証します。スクリーンショットはGit対象外の `test-results/` に出力します。物理端末の実機検証ではありません。

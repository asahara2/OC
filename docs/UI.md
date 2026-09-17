# 公開UI / Immersive journey

`ui/astra-redesign` は公開画面の表示専用の変更です。Supabase schema、API、Server Actions、Basic Auth、アプリの接続設定、CRUD、管理画面のロジックは変更していません。テスト用ビルドの分離だけを `next.config.ts` に追加しています。

## 表示とデータの境界

- `app/(public)/page.tsx` は既存の `lib/content.ts` の取得関数からニュース・指導者・憲章・サイト設定を読み込み、`HomeExperience` に渡します。
- `components/public/` に表示部品、`app/(public)/public.css` に `.public-site` 配下だけに適用する公開用スタイルを置いています。管理画面のCSSに干渉しません。
- `lib/presentation.ts` は未設定または初期seedの `Organization` / `Official website` を指定された日本語の初期表示に変換します。管理画面で別の値を保存すると、そちらが優先されます。DBの値や取得処理は変更しません。
- フッターの団体区分、`OC2026@proton.me`、デザイナー表記は指定どおり固定表示します。DBに別の問い合わせ先が保存されている場合も、追加表示して保持します。
- ホームの統計は取得した公開レコードの件数です。会員数等を架空の数字で補っていません。
- 既存DBにはテーマ / 3D背景設定の項目がありません。新しいschemaや管理項目は追加せず、描画パラメーターは3D部品に閉じています。
- 指導者の大型展示は既存の公開表示順で先頭のレコードを使います。名前・役職・紹介文・画像URLをそのまま表示し、新しい序列を推測しません。他の指導者と全条文・全ニュースへの既存リンクも保持しています。
- 総会・投票のDB/APIは未実装です。`AssemblyExhibit` は表示専用の `AssemblyPresentation | null` を受け取り、未接続時は「— / 未接続」と明示します。将来、公開議案と実際の集計値を渡せますが、投票受付・保存・認証の実装はこのUI変更に含みません。架空の結果や投票ボタンはありません。
- 背景のネットワークは抽象表現であり、ノード数を会員数や実際の関係として表示しません。

## 3Dの構成

`components/three/origin-experience.tsx` は機能検出と表示切替だけを担当し、`origin-canvas.tsx` を動的importします。Three.jsはホームでのみロードします。既存React 19.3とReact Three Fiberのpeer条件が一致しないため、Reactを変更せずThree.jsを直接使っています。

### 一つの世界 / 七つの地点

| 場所 | 3D / HTML |
| --- | --- |
| ENTRY | 950msで消える小さなOC。読込みを待つ画面ではなく、操作を遮りません |
| THE ORIGIN | ガラスの双球・巨環・薄明かり。HTMLの巨大タイトルとわずかな透視変形 |
| ORIGIN CORE | 双球の横を通過し、自由・平等・平和へ。raycastで光が反応し、クリックで説明を開けます |
| THE LEADER | カメラが上昇。円形神殿、柱、光の中にDBの人物展示 |
| CONSTITUTION ARCHIVE | 奥へ続く文書パネル。最初の3条文の全文をHTMLで保持し、選択・検索・リンクを維持 |
| THE NETWORK | 奥行きのある線と点。実際の公開レコード件数とニュース |
| THE ASSEMBLY | 円形の総会場。未接続を明記した議案・賛否の展示枠と問い合わせ |
| FINAL VOID | 建築が視界から消え、粒子とOC、指定の連絡先・デザイナー表記だけが残る |

`journey-world.ts` が建築・材質・光・2本の CatmullRomCurve3（カメラと注視点）を管理します。世界のZ座標は約18〜-229、X/Yも変化します。`origin-canvas.tsx` は描画・入力・解放を担当します。`journey-state.ts` は各HTML地点の実測位置を進捗にマッピングします。長い本文・画像読み込み・リサイズ時もResizeObserverで再計測し、固定のスクロール距離には依存しません。

スクロールはブラウザ標準です。wheel / touchを奪うイベント、スクロールロック、強制スナップはありません。アンカー、戻る操作、キーボード操作、ハッシュへの直接アクセスを維持します。HTMLの本文やボタンはWebGLの準備を待ちません。空間の地点ナビも通常のアンカーです。

3Dは手続き的生成で、外部モデル・HDRI・テクスチャの通信はありません（指導者画像は従来どおりDBのURL）。ぼけた近景は半透明シェーダーによる表現で、実際のフル画面DOF / volumetric post-processingではありません。光と視差を複数の距離へ分け、重い後処理を避けています。

Coreの操作には同等のHTMLボタンがあり、native dialogのキーボード操作・Escape・フォーカス復帰に対応します。ドラッグやタッチスクロールをクリックと誤認しないよう移動量を確認します。音声は読み込まず、自動再生もありません。

品質はポインター種別・画面幅・論理コア数・利用可能なメモリー情報・Save-Dataを使って初期選択します。

| 品質 | 描画 |
| --- | --- |
| High | 64分割球体、屈折 / 虹彩、256環境反射、330粒子、100ノード、最大DPR 1.75、最大60fps |
| Medium | 36分割球体、128環境反射、140粒子、60ノード、最大DPR 1.25、最大30fps |
| Low | 20分割球体、環境反射・屈折なし、45粒子、28ノード、最大DPR 1、最大30fps |

Highを上限として、Ultra専用の追加パスは設けていません。Medium/Lowでは柱・文書パネル・座席も削減します。ノードと座席はInstancedMesh、線はまとめたLineSegmentsです。

総ピクセル数にも上限を設け、持続的な低フレームレートを検出した場合はDPRを下げます。端末性能の検出値が提供されないブラウザもあるため、この品質選択は推定であり、実機のfps保証ではありません。

- `prefers-reduced-motion` では導入とHTMLの透視変形を省略します。各地点の境界で静止画を1回描画するだけで、カメラの移動演出や継続的な描画ループはありません。
- 通常時も「空間の動きを止める」で現在のカメラを固定できます。停止中も本文は通常スクロールできます。タブが非表示の場合は描画ループを停止します。
- WebGL 2非対応、コンテキストロスト、描画部品エラーではCSSフォールバックへ切り替えます。本文やリンクは3Dの準備を待たず表示します。
- アンマウント時はRAF・ResizeObserver・イベントリスナーを解除し、geometry / material / InstancedMesh / environment render target / rendererをdisposeし、WebGL contextを解放します。描画中の例外にもCSS fallbackへ退避します。

## 検証

```bash
npm run build
npm run lint
npm run typecheck
npx playwright install chromium
npm run test:ui
```

`npm run test:ui` は専用の `.next-ui` をビルドしてから検証します。NEXT_PUBLIC変数はビルド時に埋め込まれるため、起動時だけでなくテストビルドにもfixture用の値を渡します。通常の `.next`、`.env.local` は上書きしません。`OC_UI_TEST=1` はPlaywrightがテストプロセスにのみ渡す内部フラグで、サイトの設定項目ではありません。Nextが生成する `next-env.d.ts` はビルド先を参照します。通常の `npm run build` / `npm run dev` で通常ビルドへの参照に戻ります。

`tests/ui/fixture-server.mjs` は、実Supabaseの接続情報がなくてもUIを検証するためのテスト専用HTTPサービスです。テストが起動したNext.jsプロセスにだけ、ローカルURLと無効なテストキーを渡します。アプリ本体にモックモード・別ルート・テストデータを加えていません。実DBのCRUDやRLSの結合テストを代替するものではありません。検証用の人物画像はSVGの図形で、実在の人物ではありません。

`127.0.0.1:3035` と `127.0.0.1:54329` を使用します。他の開発サーバーを再利用しません。Desktop / Laptop / Tablet / iPhone / Androidのエミュレーション、console / hydration、通常データ・空データ・設定変更、WebGL無効化、reduced-motion、低性能端末、複数回の画面遷移、WebGLリソース解放を検証します。さらに全地点の曲線移動、最終地点の建築消去、Coreのraycast/キーボード操作、長文選択、実画像、未接続総会、停止中の通常スクロール、JavaScript無効時の本文表示も検証します。

スクリーンショットはGit対象外の `test-results/` に出力します。物理端末の実機検証ではありません。Windowsでブラウザ子プロセスの終了が制限される環境では、必要な実行権限でテストしてください。

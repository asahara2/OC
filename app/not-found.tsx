import Link from "next/link";

export default function NotFound() {
  return <main><div className="container"><h1>ページが見つかりません</h1><p><Link href="/">トップページへ戻る</Link></p></div></main>;
}

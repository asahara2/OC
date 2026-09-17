import { AdminPageHeader } from "@/components/admin/page-header";
import { createArticle, deleteArticle, updateArticle } from "@/app/admin/actions";
import { createAdminClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function ConstitutionAdminPage() {
  const { data: articles, error } = await createAdminClient()
    .from("constitution_articles").select("*").order("display_order").order("article_number");
  if (error) throw new Error(`憲章を読み込めませんでした: ${error.message}`);

  return (
    <>
      <AdminPageHeader title="憲章" />
      <section className="admin-section">
        <h2>条文を追加</h2>
        <form action={createArticle}>
          <div className="form-grid">
            <label>条番号<input name="article_number" type="number" min="1" required /></label>
            <label>表示順<input name="display_order" type="number" defaultValue="0" required /></label>
            <label className="full">タイトル<input name="title" required maxLength={200} /></label>
            <label className="full">本文<textarea name="content" required maxLength={50000} /></label>
            <label className="checkbox"><input name="is_published" type="checkbox" defaultChecked />公開する</label>
          </div>
          <div className="form-actions"><button type="submit">追加</button></div>
        </form>
      </section>
      <section className="admin-section">
        <h2>既存の条文</h2>
        <div className="admin-list">
          {(articles ?? []).map((article) => <div className="admin-item" key={article.id}>
            <form action={updateArticle}>
              <input type="hidden" name="id" value={article.id} />
              <div className="form-grid">
                <label>条番号<input name="article_number" type="number" min="1" required defaultValue={article.article_number} /></label>
                <label>表示順<input name="display_order" type="number" required defaultValue={article.display_order} /></label>
                <label className="full">タイトル<input name="title" required maxLength={200} defaultValue={article.title} /></label>
                <label className="full">本文<textarea name="content" required maxLength={50000} defaultValue={article.content} /></label>
                <label className="checkbox"><input name="is_published" type="checkbox" defaultChecked={article.is_published} />公開する</label>
              </div>
              <div className="form-actions"><button type="submit">更新</button></div>
            </form>
            <form action={deleteArticle} className="row-actions"><input type="hidden" name="id" value={article.id} /><button type="submit" className="danger">削除</button></form>
          </div>)}
          {articles?.length === 0 ? <p className="muted">条文はまだありません。</p> : null}
        </div>
      </section>
    </>
  );
}

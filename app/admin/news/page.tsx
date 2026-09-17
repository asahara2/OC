import { AdminPageHeader } from "@/components/admin/page-header";
import { createNews, deleteNews, updateNews } from "@/app/admin/actions";
import { createAdminClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function localDateTime(value: string | null) {
  return value ? new Date(value).toISOString().slice(0, 16) : "";
}

export default async function NewsAdminPage() {
  const { data: news, error } = await createAdminClient().from("news").select("*").order("created_at", { ascending: false });
  if (error) throw new Error(`ニュースを読み込めませんでした: ${error.message}`);

  return (
    <>
      <AdminPageHeader title="ニュース" />
      <section className="admin-section">
        <h2>ニュースを追加</h2>
        <form action={createNews}>
          <div className="form-grid">
            <label>タイトル<input name="title" required maxLength={200} /></label>
            <label>Slug<input name="slug" required pattern="[a-z0-9]+(-[a-z0-9]+)*" maxLength={200} /></label>
            <label className="full">概要<textarea name="excerpt" maxLength={1000} /></label>
            <label className="full">本文<textarea name="content" maxLength={50000} /></label>
            <label>公開日時（UTC）<input name="published_at" type="datetime-local" /></label>
            <label className="checkbox"><input name="is_published" type="checkbox" />公開する</label>
          </div>
          <div className="form-actions"><button type="submit">追加</button></div>
        </form>
      </section>
      <section className="admin-section">
        <h2>既存のニュース</h2>
        <div className="admin-list">
          {(news ?? []).map((item) => <div className="admin-item" key={item.id}>
            <form action={updateNews}>
              <input type="hidden" name="id" value={item.id} />
              <div className="form-grid">
                <label>タイトル<input name="title" required maxLength={200} defaultValue={item.title} /></label>
                <label>Slug<input name="slug" required pattern="[a-z0-9]+(-[a-z0-9]+)*" maxLength={200} defaultValue={item.slug} /></label>
                <label className="full">概要<textarea name="excerpt" maxLength={1000} defaultValue={item.excerpt} /></label>
                <label className="full">本文<textarea name="content" maxLength={50000} defaultValue={item.content} /></label>
                <label>公開日時（UTC）<input name="published_at" type="datetime-local" defaultValue={localDateTime(item.published_at)} /></label>
                <label className="checkbox"><input name="is_published" type="checkbox" defaultChecked={item.is_published} />公開する</label>
              </div>
              <div className="form-actions"><button type="submit">更新</button></div>
            </form>
            <form action={deleteNews} className="row-actions"><input type="hidden" name="id" value={item.id} /><button type="submit" className="danger">削除</button></form>
          </div>)}
          {news?.length === 0 ? <p className="muted">ニュースはまだありません。</p> : null}
        </div>
      </section>
    </>
  );
}

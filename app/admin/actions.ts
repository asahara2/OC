"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/server";

const slug = z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug は半角英小文字・数字・ハイフンで入力してください。");
const id = z.string().uuid();
const order = z.coerce.number().int().min(-100000).max(100000);
const text = (maximum: number) => z.string().trim().max(maximum);

function formValue(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

function checked(formData: FormData, name: string) {
  return formData.get(name) === "on";
}

function optionalUrl(value: string) {
  return value.trim() || null;
}

function datetimeValue(value: string, published: boolean) {
  if (!published) return null;
  if (!value) return new Date().toISOString();
  const parsed = new Date(value);
  if (Number.isNaN(parsed.valueOf())) throw new Error("公開日時の形式が正しくありません。");
  return parsed.toISOString();
}

function validationError(error: z.ZodError) {
  return new Error(error.issues[0]?.message ?? "入力内容を確認してください。");
}

function publicContentChanged() {
  revalidatePath("/");
  revalidatePath("/news");
  revalidatePath("/news/[slug]", "page");
  revalidatePath("/constitution");
  revalidatePath("/leaders");
}

async function execute(operation: () => Promise<void>) {
  await requireAdmin();
  await operation();
}

export async function createRole(formData: FormData) {
  await execute(async () => {
    const parsed = z.object({ name: text(100).min(1), slug, description: text(5000), displayOrder: order }).safeParse({
      name: formValue(formData, "name"), slug: formValue(formData, "slug"), description: formValue(formData, "description"), displayOrder: formValue(formData, "display_order"),
    });
    if (!parsed.success) throw validationError(parsed.error);
    const { error } = await createAdminClient().from("roles").insert({
      name: parsed.data.name, slug: parsed.data.slug, description: parsed.data.description,
      display_order: parsed.data.displayOrder, is_active: checked(formData, "is_active"),
    });
    if (error) throw new Error(`役職を作成できませんでした: ${error.message}`);
    publicContentChanged();
    revalidatePath("/admin/roles");
  });
}

export async function updateRole(formData: FormData) {
  await execute(async () => {
    const parsed = z.object({ id, name: text(100).min(1), slug, description: text(5000), displayOrder: order }).safeParse({
      id: formValue(formData, "id"), name: formValue(formData, "name"), slug: formValue(formData, "slug"), description: formValue(formData, "description"), displayOrder: formValue(formData, "display_order"),
    });
    if (!parsed.success) throw validationError(parsed.error);
    const { error } = await createAdminClient().from("roles").update({
      name: parsed.data.name, slug: parsed.data.slug, description: parsed.data.description,
      display_order: parsed.data.displayOrder, is_active: checked(formData, "is_active"),
    }).eq("id", parsed.data.id);
    if (error) throw new Error(`役職を更新できませんでした: ${error.message}`);
    publicContentChanged();
    revalidatePath("/admin/roles");
    revalidatePath("/admin/leaders");
  });
}

export async function deleteRole(formData: FormData) {
  await execute(async () => {
    const parsed = id.safeParse(formValue(formData, "id"));
    if (!parsed.success) throw validationError(parsed.error);
    const { error } = await createAdminClient().from("roles").delete().eq("id", parsed.data);
    if (error) throw new Error(`役職を削除できませんでした: ${error.message}`);
    publicContentChanged();
    revalidatePath("/admin/roles");
    revalidatePath("/admin/leaders");
  });
}

const leaderSchema = z.object({
  name: text(160).min(1), slug, biography: text(20000), imageUrl: text(2048).refine((value) => !value || /^https?:\/\//.test(value), "画像 URL は http(s) URL で入力してください。"),
  roleId: z.union([id, z.literal("")]), displayOrder: order,
});

export async function createLeader(formData: FormData) {
  await execute(async () => {
    const parsed = leaderSchema.safeParse({
      name: formValue(formData, "name"), slug: formValue(formData, "slug"), biography: formValue(formData, "biography"), imageUrl: formValue(formData, "image_url"), roleId: formValue(formData, "role_id"), displayOrder: formValue(formData, "display_order"),
    });
    if (!parsed.success) throw validationError(parsed.error);
    const { error } = await createAdminClient().from("leaders").insert({
      name: parsed.data.name, slug: parsed.data.slug, biography: parsed.data.biography, image_url: optionalUrl(parsed.data.imageUrl),
      role_id: parsed.data.roleId || null, display_order: parsed.data.displayOrder, is_active: checked(formData, "is_active"),
    });
    if (error) throw new Error(`指導者を作成できませんでした: ${error.message}`);
    publicContentChanged();
    revalidatePath("/admin/leaders");
  });
}

export async function updateLeader(formData: FormData) {
  await execute(async () => {
    const parsed = leaderSchema.extend({ id }).safeParse({
      id: formValue(formData, "id"), name: formValue(formData, "name"), slug: formValue(formData, "slug"), biography: formValue(formData, "biography"), imageUrl: formValue(formData, "image_url"), roleId: formValue(formData, "role_id"), displayOrder: formValue(formData, "display_order"),
    });
    if (!parsed.success) throw validationError(parsed.error);
    const { error } = await createAdminClient().from("leaders").update({
      name: parsed.data.name, slug: parsed.data.slug, biography: parsed.data.biography, image_url: optionalUrl(parsed.data.imageUrl),
      role_id: parsed.data.roleId || null, display_order: parsed.data.displayOrder, is_active: checked(formData, "is_active"),
    }).eq("id", parsed.data.id);
    if (error) throw new Error(`指導者を更新できませんでした: ${error.message}`);
    publicContentChanged();
    revalidatePath("/admin/leaders");
  });
}

export async function deleteLeader(formData: FormData) {
  await execute(async () => {
    const parsed = id.safeParse(formValue(formData, "id"));
    if (!parsed.success) throw validationError(parsed.error);
    const { error } = await createAdminClient().from("leaders").delete().eq("id", parsed.data);
    if (error) throw new Error(`指導者を削除できませんでした: ${error.message}`);
    publicContentChanged();
    revalidatePath("/admin/leaders");
  });
}

const newsSchema = z.object({ title: text(200).min(1), slug, excerpt: text(1000), content: text(50000) });

async function saveNews(formData: FormData, itemId?: string) {
  const parsed = newsSchema.safeParse({
    title: formValue(formData, "title"), slug: formValue(formData, "slug"), excerpt: formValue(formData, "excerpt"), content: formValue(formData, "content"),
  });
  if (!parsed.success) throw validationError(parsed.error);
  const isPublished = checked(formData, "is_published");
  const values = {
    ...parsed.data, is_published: isPublished,
    published_at: datetimeValue(formValue(formData, "published_at"), isPublished),
  };
  const supabase = createAdminClient();
  const result = itemId
    ? await supabase.from("news").update(values).eq("id", itemId)
    : await supabase.from("news").insert(values);
  if (result.error) throw new Error(`ニュースを保存できませんでした: ${result.error.message}`);
}

export async function createNews(formData: FormData) {
  await execute(async () => { await saveNews(formData); publicContentChanged(); revalidatePath("/admin/news"); });
}

export async function updateNews(formData: FormData) {
  await execute(async () => {
    const parsed = id.safeParse(formValue(formData, "id"));
    if (!parsed.success) throw validationError(parsed.error);
    await saveNews(formData, parsed.data); publicContentChanged(); revalidatePath("/admin/news");
  });
}

export async function deleteNews(formData: FormData) {
  await execute(async () => {
    const parsed = id.safeParse(formValue(formData, "id"));
    if (!parsed.success) throw validationError(parsed.error);
    const { error } = await createAdminClient().from("news").delete().eq("id", parsed.data);
    if (error) throw new Error(`ニュースを削除できませんでした: ${error.message}`);
    publicContentChanged(); revalidatePath("/admin/news");
  });
}

const articleSchema = z.object({ articleNumber: z.coerce.number().int().positive(), title: text(200).min(1), content: text(50000).min(1), displayOrder: order });

async function saveArticle(formData: FormData, itemId?: string) {
  const parsed = articleSchema.safeParse({
    articleNumber: formValue(formData, "article_number"), title: formValue(formData, "title"), content: formValue(formData, "content"), displayOrder: formValue(formData, "display_order"),
  });
  if (!parsed.success) throw validationError(parsed.error);
  const values = { article_number: parsed.data.articleNumber, title: parsed.data.title, content: parsed.data.content, display_order: parsed.data.displayOrder, is_published: checked(formData, "is_published") };
  const supabase = createAdminClient();
  const result = itemId
    ? await supabase.from("constitution_articles").update(values).eq("id", itemId)
    : await supabase.from("constitution_articles").insert(values);
  if (result.error) throw new Error(`憲章を保存できませんでした: ${result.error.message}`);
}

export async function createArticle(formData: FormData) {
  await execute(async () => { await saveArticle(formData); publicContentChanged(); revalidatePath("/admin/constitution"); });
}

export async function updateArticle(formData: FormData) {
  await execute(async () => {
    const parsed = id.safeParse(formValue(formData, "id"));
    if (!parsed.success) throw validationError(parsed.error);
    await saveArticle(formData, parsed.data); publicContentChanged(); revalidatePath("/admin/constitution");
  });
}

export async function deleteArticle(formData: FormData) {
  await execute(async () => {
    const parsed = id.safeParse(formValue(formData, "id"));
    if (!parsed.success) throw validationError(parsed.error);
    const { error } = await createAdminClient().from("constitution_articles").delete().eq("id", parsed.data);
    if (error) throw new Error(`憲章を削除できませんでした: ${error.message}`);
    publicContentChanged(); revalidatePath("/admin/constitution");
  });
}

const settingSchema = z.object({ key: z.enum(["site_name", "site_description", "contact_email"]), value: text(2000) });

export async function updateSiteSettings(formData: FormData) {
  await execute(async () => {
    const settings = ["site_name", "site_description", "contact_email"].map((key) => settingSchema.safeParse({ key, value: formValue(formData, key) }));
    const failed = settings.find((item) => !item.success);
    if (failed && !failed.success) throw validationError(failed.error);
    const rows = settings.map((item) => {
      if (!item.success) throw new Error("設定値が不正です。");
      return { key: item.data.key, value: item.data.value, is_public: true };
    });
    const { error } = await createAdminClient().from("site_settings").upsert(rows);
    if (error) throw new Error(`サイト設定を保存できませんでした: ${error.message}`);
    publicContentChanged(); revalidatePath("/admin/settings");
  });
}

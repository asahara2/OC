"use server";

import { revalidatePath } from "next/cache";
import { randomUUID } from "crypto";
import { z } from "zod";

import { requireAdmin } from "@/lib/admin-auth";
import { requireFounderOrAdmin, requireStaffPermission, type StaffPermission } from "@/lib/staff-auth";
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

async function ensurePublicBucket(name: string) {
  const storage = createAdminClient().storage;
  const listed = await storage.listBuckets();
  if (!listed.error && listed.data.some((bucket) => bucket.name === name)) return storage.from(name);
  const created = await storage.createBucket(name, { public: true });
  if (created.error && !created.error.message.toLowerCase().includes("already exists")) throw new Error(`Storageバケットを作成できませんでした: ${created.error.message}`);
  return storage.from(name);
}

async function leaderImageUrl(formData: FormData, url: string) {
  const image = formData.get("image_file");
  if (!(image instanceof File) || image.size === 0) return optionalUrl(url);
  if (image.size > 5 * 1024 * 1024) throw new Error("画像ファイルは5MB以下にしてください。");
  const allowed = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
  if (!allowed.has(image.type)) throw new Error("JPEG、PNG、WebP、GIF画像を選択してください。");
  const extension = image.type.split("/")[1] === "jpeg" ? "jpg" : image.type.split("/")[1];
  const path = `${randomUUID()}.${extension}`;
  const storage = await ensurePublicBucket("leader-images");
  const { error } = await storage.upload(path, image, { contentType: image.type, upsert: false });
  if (error) throw new Error(`画像をアップロードできませんでした: ${error.message}`);
  return storage.getPublicUrl(path).data.publicUrl;
}

function datetimeValue(value: string, published: boolean) {
  if (!published) return null;
  if (!value) return new Date().toISOString();
  const parsed = new Date(value);
  if (Number.isNaN(parsed.valueOf())) throw new Error("公開日時の形式が正しくありません。");
  return parsed.toISOString();
}
function optionalDatetime(value: string) {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.valueOf())) throw new Error("投票期間の日時が正しくありません。");
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

async function execute(operation: () => Promise<void>, permission?: StaffPermission) {
  if (permission) await requireStaffPermission(permission);
  else await requireAdmin();
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
      name: parsed.data.name, slug: parsed.data.slug, biography: parsed.data.biography, image_url: await leaderImageUrl(formData, parsed.data.imageUrl),
      role_id: parsed.data.roleId || null, display_order: parsed.data.displayOrder, is_active: checked(formData, "is_active"), mod_leader_approved: checked(formData, "mod_leader_approved"),
    });
    if (error) throw new Error(`指導者を作成できませんでした: ${error.message}`);
    publicContentChanged();
    revalidatePath("/admin/leaders");
  }, "leader_manage");
}

export async function updateLeader(formData: FormData) {
  await execute(async () => {
    const parsed = leaderSchema.extend({ id }).safeParse({
      id: formValue(formData, "id"), name: formValue(formData, "name"), slug: formValue(formData, "slug"), biography: formValue(formData, "biography"), imageUrl: formValue(formData, "image_url"), roleId: formValue(formData, "role_id"), displayOrder: formValue(formData, "display_order"),
    });
    if (!parsed.success) throw validationError(parsed.error);
    const { error } = await createAdminClient().from("leaders").update({
      name: parsed.data.name, slug: parsed.data.slug, biography: parsed.data.biography, image_url: await leaderImageUrl(formData, parsed.data.imageUrl),
      role_id: parsed.data.roleId || null, display_order: parsed.data.displayOrder, is_active: checked(formData, "is_active"), mod_leader_approved: checked(formData, "mod_leader_approved"),
    }).eq("id", parsed.data.id);
    if (error) throw new Error(`指導者を更新できませんでした: ${error.message}`);
    publicContentChanged();
    revalidatePath("/admin/leaders");
  }, "leader_manage");
}

export async function deleteLeader(formData: FormData) {
  await execute(async () => {
    const parsed = id.safeParse(formValue(formData, "id"));
    if (!parsed.success) throw validationError(parsed.error);
    const { error } = await createAdminClient().from("leaders").delete().eq("id", parsed.data);
    if (error) throw new Error(`指導者を削除できませんでした: ${error.message}`);
    publicContentChanged();
    revalidatePath("/admin/leaders");
  }, "leader_manage");
}

const safeUrl = text(2048).refine((value) => !value || /^https?:\/\//.test(value), "URL は http(s) URL で入力してください。");
const newsSchema = z.object({ title: text(200).min(1), slug, excerpt: text(1000), content: text(50000), imageUrl: safeUrl, videoUrl: safeUrl });

async function saveNews(formData: FormData, itemId?: string) {
  const parsed = newsSchema.safeParse({
    title: formValue(formData, "title"), slug: formValue(formData, "slug"), excerpt: formValue(formData, "excerpt"), content: formValue(formData, "content"),
    imageUrl: formValue(formData, "image_url"), videoUrl: formValue(formData, "video_url"),
  });
  if (!parsed.success) throw validationError(parsed.error);
  const isPublished = checked(formData, "is_published");
  const values = {
    title: parsed.data.title, slug: parsed.data.slug, excerpt: parsed.data.excerpt, content: parsed.data.content,
    image_url: optionalUrl(parsed.data.imageUrl), video_url: optionalUrl(parsed.data.videoUrl), is_published: isPublished,
    published_at: datetimeValue(formValue(formData, "published_at"), isPublished),
  };
  const supabase = createAdminClient();
  const result = itemId
    ? await supabase.from("news").update(values).eq("id", itemId)
    : await supabase.from("news").insert(values);
  if (result.error) throw new Error(`ニュースを保存できませんでした: ${result.error.message}`);
}

export async function createNews(formData: FormData) {
  await execute(async () => { await saveNews(formData); publicContentChanged(); revalidatePath("/admin/news"); }, "news_write");
}

export async function updateNews(formData: FormData) {
  await execute(async () => {
    const parsed = id.safeParse(formValue(formData, "id"));
    if (!parsed.success) throw validationError(parsed.error);
    await saveNews(formData, parsed.data); publicContentChanged(); revalidatePath("/admin/news");
  }, "news_write");
}

export async function deleteNews(formData: FormData) {
  await execute(async () => {
    const parsed = id.safeParse(formValue(formData, "id"));
    if (!parsed.success) throw validationError(parsed.error);
    const { error } = await createAdminClient().from("news").delete().eq("id", parsed.data);
    if (error) throw new Error(`ニュースを削除できませんでした: ${error.message}`);
    publicContentChanged(); revalidatePath("/admin/news");
  }, "news_write");
}

const pollSchema = z.object({ title: text(200).min(1), description: text(5000), options: text(5000).min(3) });

function parsePollOptions(value: string) {
  const options = value.split(/\r?\n/).map((item) => item.trim()).filter(Boolean);
  if (options.length < 2 || options.length > 20) throw new Error("選択肢は2〜20件、1行に1件で入力してください。");
  if (new Set(options.map((option) => option.toLocaleLowerCase("ja-JP"))).size !== options.length) throw new Error("同じ選択肢は登録できません。");
  if (options.some((option) => option.length > 120)) throw new Error("各選択肢は120文字以内で入力してください。");
  return options;
}

export async function createPoll(formData: FormData) {
  await execute(async () => {
    const parsed = pollSchema.safeParse({ title: formValue(formData, "title"), description: formValue(formData, "description"), options: formValue(formData, "options") });
    if (!parsed.success) throw validationError(parsed.error);
    const { data: poll, error } = await createAdminClient().from("polls").insert({
      title: parsed.data.title, description: parsed.data.description,
      is_published: checked(formData, "is_published"), is_open: checked(formData, "is_open"), results_public: checked(formData, "results_public"),
      opens_at: optionalDatetime(formValue(formData, "opens_at")), closes_at: optionalDatetime(formValue(formData, "closes_at")),
    }).select("id").single();
    if (error || !poll) throw new Error(`投票を作成できませんでした: ${error?.message ?? "結果がありません。"}`);
    const options = parsePollOptions(parsed.data.options);
    const optionResult = await createAdminClient().from("poll_options").insert(options.map((label, index) => ({ poll_id: poll.id, label, display_order: index })));
    if (optionResult.error) throw new Error(`選択肢を保存できませんでした: ${optionResult.error.message}`);
    revalidatePath("/polls"); revalidatePath("/admin/polls");
  }, "poll_manage");
}

export async function updatePollStatus(formData: FormData) {
  await execute(async () => {
    const parsed = id.safeParse(formValue(formData, "id"));
    if (!parsed.success) throw validationError(parsed.error);
    const { error } = await createAdminClient().from("polls").update({
      is_published: checked(formData, "is_published"), is_open: checked(formData, "is_open"), results_public: checked(formData, "results_public"),
      opens_at: optionalDatetime(formValue(formData, "opens_at")), closes_at: optionalDatetime(formValue(formData, "closes_at")),
    }).eq("id", parsed.data);
    if (error) throw new Error(`投票状態を更新できませんでした: ${error.message}`);
    revalidatePath("/polls"); revalidatePath("/admin/polls");
  }, "poll_manage");
}

export async function deletePoll(formData: FormData) {
  await execute(async () => {
    const parsed = id.safeParse(formValue(formData, "id"));
    if (!parsed.success) throw validationError(parsed.error);
    const { error } = await createAdminClient().from("polls").delete().eq("id", parsed.data);
    if (error) throw new Error(`投票を削除できませんでした: ${error.message}`);
    revalidatePath("/polls"); revalidatePath("/admin/polls");
  }, "poll_manage");
}

export async function createCommunityMessage(formData: FormData) {
  const kind = formValue(formData, "kind");
  await execute(async () => {
    const parsed = z.object({ body: text(5000).min(1), kind: z.enum(["message", "troll"]) }).safeParse({ body: formValue(formData, "body"), kind: formValue(formData, "kind") });
    if (!parsed.success) throw validationError(parsed.error);
    const { error } = await createAdminClient().from("community_messages").insert({ body: parsed.data.body, kind: parsed.data.kind, is_published: checked(formData, "is_published") });
    if (error) throw new Error(`メッセージを保存できませんでした: ${error.message}`);
    revalidatePath("/messages"); revalidatePath("/admin/messages");
  }, kind === "troll" ? "troll_publish" : "message_publish");
}

export async function deleteCommunityMessage(formData: FormData) {
  await execute(async () => {
    const parsed = id.safeParse(formValue(formData, "id"));
    if (!parsed.success) throw validationError(parsed.error);
    const { error } = await createAdminClient().from("community_messages").delete().eq("id", parsed.data);
    if (error) throw new Error(`メッセージを削除できませんでした: ${error.message}`);
    revalidatePath("/messages"); revalidatePath("/admin/messages");
  }, "message_publish");
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
  await execute(async () => { await saveArticle(formData); publicContentChanged(); revalidatePath("/admin/constitution"); }, "constitution_write");
}

export async function updateArticle(formData: FormData) {
  await execute(async () => {
    const parsed = id.safeParse(formValue(formData, "id"));
    if (!parsed.success) throw validationError(parsed.error);
    await saveArticle(formData, parsed.data); publicContentChanged(); revalidatePath("/admin/constitution");
  }, "constitution_write");
}

export async function deleteArticle(formData: FormData) {
  await execute(async () => {
    const parsed = id.safeParse(formValue(formData, "id"));
    if (!parsed.success) throw validationError(parsed.error);
    const { error } = await createAdminClient().from("constitution_articles").delete().eq("id", parsed.data);
    if (error) throw new Error(`憲章を削除できませんでした: ${error.message}`);
    publicContentChanged(); revalidatePath("/admin/constitution");
  }, "constitution_write");
}

const settingSchema = z.object({ key: z.enum(["site_name", "site_description", "contact_email", "constitution_preamble"]), value: text(8000) });

export async function updateSiteSettings(formData: FormData) {
  await execute(async () => {
    const settings = ["site_name", "site_description", "contact_email", "constitution_preamble"].map((key) => settingSchema.safeParse({ key, value: formValue(formData, key) }));
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

export async function updateSiteBackground(formData: FormData) {
  const session = await requireFounderOrAdmin();
  const image = formData.get("background_file");
  if (!(image instanceof File) || image.size === 0) throw new Error("背景画像を選択してください。");
  if (image.size > 8 * 1024 * 1024 || !["image/jpeg", "image/png", "image/webp"].includes(image.type)) throw new Error("JPEG、PNG、WebPの8MB以下の画像を選択してください。");
  const requestedMinutes = Number(formData.get("duration_minutes") ?? 60);
  const maximum = session.role === "kyoso" ? 60 : 360;
  const minutes = Number.isFinite(requestedMinutes) ? Math.min(maximum, Math.max(1, Math.floor(requestedMinutes))) : maximum;
  const storage = await ensurePublicBucket("site-backgrounds");
  const path = `${crypto.randomUUID()}.${image.type.split("/")[1]}`;
  const uploaded = await storage.upload(path, image, { contentType: image.type, upsert: false });
  if (uploaded.error) throw new Error(`背景をアップロードできませんでした: ${uploaded.error.message}`);
  const expiresAt = new Date(Date.now() + minutes * 60_000).toISOString();
  const { error } = await createAdminClient().from("site_settings").upsert([
    { key: "background_url", value: storage.getPublicUrl(path).data.publicUrl, is_public: true },
    { key: "background_expires_at", value: expiresAt, is_public: true },
  ]);
  if (error) throw new Error(`背景設定を保存できませんでした: ${error.message}`);
  publicContentChanged(); revalidatePath("/admin/settings");
}

export async function triggerSiteEffect(formData: FormData) {
  const session = await requireFounderOrAdmin();
  const effect = formValue(formData, "effect");
  if (effect !== "cracker" && effect !== "emoji") throw new Error("演出の種類が正しくありません。");
  const requestedSeconds = Number(formData.get("duration_seconds") ?? 10);
  const maximum = session.role === "kyoso" ? 60 : 360;
  const seconds = Number.isFinite(requestedSeconds) ? Math.min(maximum, Math.max(1, Math.floor(requestedSeconds))) : 10;
  const expiresAt = new Date(Date.now() + seconds * 1000).toISOString();
  const { error } = await createAdminClient().from("site_settings").upsert([
    { key: "active_effect", value: effect, is_public: true }, { key: "effect_expires_at", value: expiresAt, is_public: true },
  ]);
  if (error) throw new Error(`演出を開始できませんでした: ${error.message}`);
  publicContentChanged(); revalidatePath("/admin/settings");
}

export async function updateSiteMode(formData: FormData) {
  await requireFounderOrAdmin();
  const mode = formValue(formData, "site_mode");
  if (mode !== "classic" && mode !== "immersive") throw new Error("表示モードが正しくありません。");
  const { error } = await createAdminClient().from("site_settings").upsert({ key: "site_mode", value: mode, is_public: true });
  if (error) throw new Error(`表示モードを保存できませんでした: ${error.message}`);
  publicContentChanged(); revalidatePath("/admin/settings");
}

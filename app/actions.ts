"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  clearAdminSession,
  isAdmin,
  passwordMatches,
  setAdminSession,
} from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";
import { normalizeGroupColor } from "@/lib/group-colors";
import { translations } from "@/lib/i18n";
import { getLanguage } from "@/lib/language";

const RESERVED_SLUGS = new Set([
  "admin",
  "login",
  "demo",
  "go",
  "api",
  "_next",
]);

function isReservedSlug(slug: string) {
  return RESERVED_SLUGS.has(slug);
}

function normalizeSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9_-]/g, "")
    .replace(/-+/g, "-")
    .slice(0, 80);
}

function normalizeGroupName(value: string) {
  return value.trim().replace(/\s+/g, " ").slice(0, 80);
}

function normalizeGroupId(value: FormDataEntryValue | null) {
  const id = String(value ?? "").trim();
  return id || null;
}

function isHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function withMessage(path: string, key: "ok" | "error", message: string) {
  return `${path}?${key}=${encodeURIComponent(message)}`;
}

async function requireAdminAction() {
  if (!(await isAdmin())) {
    redirect("/login");
  }
}

export async function loginAction(formData: FormData) {
  const password = String(formData.get("password") ?? "");
  const language = await getLanguage();

  if (!passwordMatches(password)) {
    redirect(withMessage("/login", "error", translations[language].login.wrongPassword));
  }

  await setAdminSession();
  redirect("/admin");
}

export async function logoutAction() {
  await clearAdminSession();
  redirect("/login");
}

export async function createGroupAction(formData: FormData) {
  await requireAdminAction();
  const language = await getLanguage();
  const messages = translations[language].actions;

  const name = normalizeGroupName(String(formData.get("name") ?? ""));
  const backgroundColor = normalizeGroupColor(String(formData.get("backgroundColor") ?? ""));
  if (!name) redirect(withMessage("/admin", "error", messages.groupNameRequired));

  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from("link_groups").insert({ name, background_color: backgroundColor });

  if (error) {
    const message = error.code === "23505" ? messages.groupExists : error.message;
    redirect(withMessage("/admin", "error", message));
  }

  revalidatePath("/admin");
  redirect(withMessage("/admin", "ok", messages.groupCreated));
}

export async function updateGroupAction(formData: FormData) {
  await requireAdminAction();
  const language = await getLanguage();
  const messages = translations[language].actions;

  const id = String(formData.get("id") ?? "").trim();
  const name = normalizeGroupName(String(formData.get("name") ?? ""));
  const backgroundColor = normalizeGroupColor(String(formData.get("backgroundColor") ?? ""));

  if (!id || !name) redirect(withMessage("/admin", "error", messages.groupDataInvalid));

  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from("link_groups").update({ name, background_color: backgroundColor }).eq("id", id);

  if (error) {
    const message = error.code === "23505" ? messages.groupExists : error.message;
    redirect(withMessage("/admin", "error", message));
  }

  revalidatePath("/admin");
  redirect(withMessage("/admin", "ok", messages.groupRenamed));
}

export async function deleteGroupAction(formData: FormData) {
  await requireAdminAction();
  const language = await getLanguage();
  const messages = translations[language].actions;

  const id = String(formData.get("id") ?? "").trim();
  if (!id) redirect(withMessage("/admin", "error", messages.groupNotFound));

  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from("link_groups").delete().eq("id", id);

  if (error) redirect(withMessage("/admin", "error", error.message));

  revalidatePath("/admin");
  redirect(withMessage("/admin", "ok", messages.groupDeleted));
}

export async function createLinkAction(formData: FormData) {
  await requireAdminAction();
  const language = await getLanguage();
  const messages = translations[language].actions;

  const name = String(formData.get("name") ?? "").trim();
  const slug = normalizeSlug(String(formData.get("slug") ?? ""));
  const destinationUrl = String(formData.get("destinationUrl") ?? "").trim();
  const groupId = normalizeGroupId(formData.get("groupId"));

  if (!name || !slug || !destinationUrl) {
    redirect(withMessage("/admin", "error", messages.requiredFields));
  }

  if (isReservedSlug(slug)) {
    redirect(withMessage("/admin", "error", messages.reservedSlug));
  }

  if (!isHttpUrl(destinationUrl)) {
    redirect(
      withMessage("/admin", "error", messages.invalidUrl)
    );
  }

  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from("links").insert({
    name,
    slug,
    destination_url: destinationUrl,
    group_id: groupId,
  });

  if (error) {
    const message = error.code === "23505" ? messages.slugExists : error.message;
    redirect(withMessage("/admin", "error", message));
  }

  revalidatePath("/admin");
  redirect(withMessage("/admin", "ok", messages.linkCreated));
}

export async function updateLinkAction(formData: FormData) {
  await requireAdminAction();
  const language = await getLanguage();
  const messages = translations[language].actions;

  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const slug = normalizeSlug(String(formData.get("slug") ?? ""));
  const destinationUrl = String(formData.get("destinationUrl") ?? "").trim();
  const groupId = normalizeGroupId(formData.get("groupId"));

  if (!id || !name || !slug || !destinationUrl || !isHttpUrl(destinationUrl)) {
    redirect(withMessage("/admin", "error", messages.linkDataInvalid));
  }

  if (isReservedSlug(slug)) {
    redirect(withMessage("/admin", "error", messages.reservedSlug));
  }

  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("links")
    .update({ name, slug, destination_url: destinationUrl, group_id: groupId })
    .eq("id", id);

  if (error) {
    const message = error.code === "23505" ? messages.slugExists : error.message;
    redirect(withMessage("/admin", "error", message));
  }

  revalidatePath("/admin");
  redirect(withMessage("/admin", "ok", messages.linkUpdated));
}

export async function toggleLinkAction(formData: FormData) {
  await requireAdminAction();

  const id = String(formData.get("id") ?? "");
  const nextValue = String(formData.get("nextValue") ?? "") === "true";

  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("links")
    .update({ is_active: nextValue })
    .eq("id", id);

  if (error) redirect(withMessage("/admin", "error", error.message));

  revalidatePath("/admin");
}

export async function deleteLinkAction(formData: FormData) {
  await requireAdminAction();
  const language = await getLanguage();
  const messages = translations[language].actions;

  const id = String(formData.get("id") ?? "");
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from("links").delete().eq("id", id);

  if (error) redirect(withMessage("/admin", "error", error.message));

  revalidatePath("/admin");
  redirect(withMessage("/admin", "ok", messages.linkDeleted));
}

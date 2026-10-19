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
  if (!name) redirect(withMessage("/admin", "error", messages.groupNameRequired));

  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from("link_groups").insert({ name });

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

  if (!id || !name) redirect(withMessage("/admin", "error", messages.groupDataInvalid));

  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from("link_groups").update({ name }).eq("id", id);

  if (error) {
    const message = error.code === "23505" ? messages.groupExists : error.message;
    redirect(withMessage("/admin", "error", message));
  }

  revalidatePath("/admin");
  redirect(withMessage("/admin", "ok", messages.groupRenamed));
}


export async function updateGroupColorAction(formData: FormData) {
  await requireAdminAction();
  const language = await getLanguage();
  const messages = translations[language].actions;

  const id = String(formData.get("id") ?? "").trim();
  const backgroundColor = normalizeGroupColor(String(formData.get("backgroundColor") ?? ""));

  if (!id) redirect(withMessage("/admin", "error", messages.groupNotFound));

  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("link_groups")
    .update({ background_color: backgroundColor })
    .eq("id", id);

  if (error) {
    const needsMigration =
      error.code === "PGRST204" ||
      error.code === "42703" ||
      error.message?.includes("background_color");

    redirect(withMessage(
      "/admin",
      "error",
      needsMigration ? messages.groupColorMigrationRequired : error.message
    ));
  }

  revalidatePath("/admin");
  return;
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
  // New links appear first in their group without changing existing order.
  let firstLinkQuery = supabase.from("links").select("sort_order");
  firstLinkQuery = groupId ? firstLinkQuery.eq("group_id", groupId) : firstLinkQuery.is("group_id", null);
  const { data: firstLink, error: positionError } = await firstLinkQuery
    .order("sort_order", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (positionError) redirect(withMessage("/admin", "error", positionError.message));
  const sortOrder = Number(firstLink?.sort_order ?? 1) - 1;

  const { data: createdLink, error } = await supabase.from("links").insert({
    name,
    slug,
    destination_url: destinationUrl,
    group_id: groupId,
    sort_order: sortOrder,
  }).select("id").single();

  if (error) {
    const message = error.code === "23505" ? messages.slugExists : error.message;
    redirect(withMessage("/admin", "error", message));
  }

  revalidatePath("/admin");
  redirect(`/admin?created=${encodeURIComponent(createdLink.id)}`);
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
  const { data: original, error: lookupError } = await supabase
    .from("links").select("group_id").eq("id", id).maybeSingle();
  if (lookupError || !original) {
    redirect(withMessage("/admin", "error", lookupError?.message ?? messages.linkDataInvalid));
  }

  const changes: {
    name: string;
    slug: string;
    destination_url: string;
    group_id: string | null;
    sort_order?: number;
  } = { name, slug, destination_url: destinationUrl, group_id: groupId };
  if (original.group_id !== groupId) {
    let targetQuery = supabase.from("links").select("sort_order");
    targetQuery = groupId ? targetQuery.eq("group_id", groupId) : targetQuery.is("group_id", null);
    const { data: first, error: orderError } = await targetQuery
      .order("sort_order", { ascending: true }).limit(1).maybeSingle();
    if (orderError) redirect(withMessage("/admin", "error", orderError.message));
    changes.sort_order = Number(first?.sort_order ?? 1) - 1;
  }

  const { error } = await supabase.from("links")
    .update(changes).eq("id", id);

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


export async function reorderLinksAction(groupId: string | null, linkIds: string[]) {
  if (!(await isAdmin())) return { ok: false, error: "Authentication required" };
  if (!Array.isArray(linkIds) || linkIds.length < 2 || linkIds.length > 2000) {
    return { ok: false, error: "Invalid link order" };
  }
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (linkIds.some((id) => !uuidPattern.test(id)) || new Set(linkIds).size !== linkIds.length) {
    return { ok: false, error: "Invalid link IDs" };
  }
  if (groupId !== null && !uuidPattern.test(groupId)) {
    return { ok: false, error: "Invalid group" };
  }

  try {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.rpc("reorder_links_in_group", {
      p_group_id: groupId,
      p_link_ids: linkIds,
    });
    if (error) return { ok: false, error: error.message };
    revalidatePath("/admin");
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Could not reorder links" };
  }
}

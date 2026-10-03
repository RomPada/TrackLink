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

const RESERVED_SLUGS = new Set([
  "admin",
  "login",
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

  if (!passwordMatches(password)) {
    redirect(withMessage("/login", "error", "Неправильний пароль"));
  }

  await setAdminSession();
  redirect("/admin");
}

export async function logoutAction() {
  await clearAdminSession();
  redirect("/login");
}

export async function createLinkAction(formData: FormData) {
  await requireAdminAction();

  const name = String(formData.get("name") ?? "").trim();
  const slug = normalizeSlug(String(formData.get("slug") ?? ""));
  const destinationUrl = String(formData.get("destinationUrl") ?? "").trim();

  if (!name || !slug || !destinationUrl) {
    redirect(withMessage("/admin", "error", "Заповни всі поля"));
  }

  if (isReservedSlug(slug)) {
    redirect(withMessage("/admin", "error", "Цей slug зарезервований системою. Обери інший."));
  }

  if (!isHttpUrl(destinationUrl)) {
    redirect(
      withMessage("/admin", "error", "Кінцева адреса має починатися з http:// або https://")
    );
  }

  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from("links").insert({
    name,
    slug,
    destination_url: destinationUrl,
  });

  if (error) {
    const message = error.code === "23505" ? "Такий slug уже існує" : error.message;
    redirect(withMessage("/admin", "error", message));
  }

  revalidatePath("/admin");
  redirect(withMessage("/admin", "ok", "Посилання створено"));
}

export async function updateLinkAction(formData: FormData) {
  await requireAdminAction();

  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const slug = normalizeSlug(String(formData.get("slug") ?? ""));
  const destinationUrl = String(formData.get("destinationUrl") ?? "").trim();

  if (!id || !name || !slug || !destinationUrl || !isHttpUrl(destinationUrl)) {
    redirect(withMessage("/admin", "error", "Перевір дані посилання"));
  }

  if (isReservedSlug(slug)) {
    redirect(withMessage("/admin", "error", "Цей slug зарезервований системою. Обери інший."));
  }

  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("links")
    .update({ name, slug, destination_url: destinationUrl })
    .eq("id", id);

  if (error) {
    const message = error.code === "23505" ? "Такий slug уже існує" : error.message;
    redirect(withMessage("/admin", "error", message));
  }

  revalidatePath("/admin");
  redirect(withMessage("/admin", "ok", "Посилання оновлено"));
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

  if (error) {
    redirect(withMessage("/admin", "error", error.message));
  }

  revalidatePath("/admin");
}

export async function deleteLinkAction(formData: FormData) {
  await requireAdminAction();

  const id = String(formData.get("id") ?? "");
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from("links").delete().eq("id", id);

  if (error) {
    redirect(withMessage("/admin", "error", error.message));
  }

  revalidatePath("/admin");
  redirect(withMessage("/admin", "ok", "Посилання видалено"));
}

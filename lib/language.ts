import "server-only";
import { cookies } from "next/headers";
import { LANGUAGE_COOKIE, type Language } from "@/lib/i18n";

export async function getLanguage(): Promise<Language> {
  const cookieStore = await cookies();
  return cookieStore.get(LANGUAGE_COOKIE)?.value === "uk" ? "uk" : "en";
}

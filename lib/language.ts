import type { Language } from "@/lib/i18n";

// Single-language UI: no locale cookie or settings are used.
export async function getLanguage(): Promise<Language> {
  return "en";
}

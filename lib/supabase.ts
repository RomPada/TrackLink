import "server-only";
import { createClient } from "@supabase/supabase-js";

export function getSupabaseAdmin() {
  const url = process.env.SUPABASE_URL?.trim();
  const secretKey = process.env.SUPABASE_SECRET_KEY?.trim();

  if (!url || !secretKey) {
    throw new Error(
      "Не задано SUPABASE_URL або SUPABASE_SECRET_KEY. Перевір файл .env.local."
    );
  }

  if (secretKey.startsWith("sb_publishable_")) {
    throw new Error(
      "У SUPABASE_SECRET_KEY зараз вказаний publishable key. Для TrackLink потрібен серверний Secret key виду sb_secret_..."
    );
  }

  try {
    new URL(url);
  } catch {
    throw new Error("SUPABASE_URL має неправильний формат.");
  }

  return createClient(url, secretKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

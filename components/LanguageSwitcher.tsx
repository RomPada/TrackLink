"use client";

import { LANGUAGE_COOKIE, type Language } from "@/lib/i18n";

export default function LanguageSwitcher({ language }: { language: Language }) {
  function setLanguage(next: Language) {
    if (next === language) return;
    document.cookie = `${LANGUAGE_COOKIE}=${next}; Path=/; Max-Age=31536000; SameSite=Lax`;
    window.location.reload();
  }

  return (
    <div className="language-switcher" role="group" aria-label="Language">
      <button
        type="button"
        className={language === "en" ? "language-option language-option-active" : "language-option"}
        onClick={() => setLanguage("en")}
        aria-pressed={language === "en"}
      >
        EN
      </button>
      <button
        type="button"
        className={language === "uk" ? "language-option language-option-active" : "language-option"}
        onClick={() => setLanguage("uk")}
        aria-pressed={language === "uk"}
      >
        UA
      </button>
    </div>
  );
}

"use client";

import { useState } from "react";
import { translations, type Language } from "@/lib/i18n";

export default function CopyButton({ value, language = "en" }: { value: string; language?: Language }) {
  const [copied, setCopied] = useState(false);
  const text = translations[language].common;

  async function copy() {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  }

  return (
    <button type="button" className="button button-ghost button-small" onClick={copy}>
      {copied ? text.copied : text.copy}
    </button>
  );
}

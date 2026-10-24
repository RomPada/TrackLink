"use client";

import { useState } from "react";
import { translations, type Language } from "@/lib/i18n";

type Props = { value: string; language?: Language; prominent?: boolean };

export default function CopyButton({ value, language = "en", prominent = false }: Props) {
  const [status, setStatus] = useState<"idle" | "copied" | "error">("idle");
  const text = translations[language].common;

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setStatus("copied");
      window.setTimeout(() => setStatus("idle"), 1800);
    } catch {
      setStatus("error");
      window.setTimeout(() => setStatus("idle"), 2400);
    }
  }

  const caption = status === "copied" ? text.copied : status === "error"
    ? "Copy failed"
    : "Copy tracking link";

  return (
    <button
      type="button"
      className={`button ${prominent ? "button-primary" : "button-ghost"} button-small copy-tracking-button`}
      onClick={copy}
      title={value}
      aria-label={caption}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/></svg>
      {caption}
    </button>
  );
}

"use client";

import { useState } from "react";

function EyeIcon({ crossed }: { crossed: boolean }) {
  if (crossed) {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M3 3l18 18" />
        <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
        <path d="M9.9 4.2A10.8 10.8 0 0 1 12 4c5.5 0 9.5 4.7 10 8-.2 1.5-1.2 3.3-2.8 4.8" />
        <path d="M6.6 6.6C4 8.1 2.4 10.5 2 12c.5 3.3 4.5 8 10 8 1.4 0 2.7-.3 3.9-.8" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

export default function PasswordField() {
  const [visible, setVisible] = useState(false);

  return (
    <div className="password-field">
      <input
        name="password"
        type={visible ? "text" : "password"}
        autoComplete="current-password"
        required
      />
      <button
        type="button"
        className="password-toggle"
        onClick={() => setVisible((current) => !current)}
        aria-label={visible ? "Сховати пароль" : "Показати пароль"}
        aria-pressed={visible}
        title={visible ? "Сховати пароль" : "Показати пароль"}
      >
        <EyeIcon crossed={visible} />
      </button>
    </div>
  );
}

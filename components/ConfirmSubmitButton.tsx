"use client";

import { useRef, useState } from "react";

export default function ConfirmSubmitButton({
  label,
  title,
  message,
  cancelLabel,
  confirmLabel,
  className = "button button-danger button-small",
}: {
  label: string;
  title: string;
  message: string;
  cancelLabel: string;
  confirmLabel: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  function confirm() {
    const form = triggerRef.current?.closest("form");
    setOpen(false);
    form?.requestSubmit();
  }

  return (
    <>
      <button ref={triggerRef} className={className} type="button" onClick={() => setOpen(true)}>
        {label}
      </button>
      {open ? (
        <div className="confirm-backdrop" role="presentation" onMouseDown={() => setOpen(false)}>
          <div
            className="confirm-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-dialog-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <h3 id="confirm-dialog-title">{title}</h3>
            <p>{message}</p>
            <div className="confirm-dialog-actions">
              <button className="button button-ghost" type="button" onClick={() => setOpen(false)}>
                {cancelLabel}
              </button>
              <button className="button button-danger" type="button" onClick={confirm} autoFocus>
                {confirmLabel}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

"use client";

import { useCallback, useEffect, useId, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from "react";
import { createPortal } from "react-dom";
import type { Language } from "@/lib/i18n";
import { normalizeGroupColor } from "@/lib/group-colors";

type GroupOption = { id: string; name: string; background_color: string | null };
type Props = {
  name: string;
  groups: GroupOption[];
  defaultValue?: string | null;
  language: Language;
  noGroupLabel: string;
};

type Position = { left: number; top: number; width: number; maxHeight: number };

export default function GroupSelect({ name, groups, defaultValue = "", language, noGroupLabel }: Props) {
  const [selected, setSelected] = useState(defaultValue ?? "");
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<Position | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const listId = useId();
  const options = [{ id: "", name: noGroupLabel, background_color: null }, ...groups];
  const selectedOption = options.find((item) => item.id === selected) ?? options[0];

  const updatePosition = useCallback(() => {
    const rect = triggerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const maxHeight = Math.min(options.length * 46 + 12, 286);
    const spaceBelow = window.innerHeight - rect.bottom - 12;
    const spaceAbove = rect.top - 12;
    const showAbove = spaceBelow < Math.min(maxHeight, 190) && spaceAbove > spaceBelow;
    const usableHeight = Math.max(80, Math.min(maxHeight, showAbove ? spaceAbove : spaceBelow));
    setPosition({
      left: Math.max(8, Math.min(rect.left, window.innerWidth - rect.width - 8)),
      top: showAbove ? rect.top - usableHeight - 6 : rect.bottom + 6,
      width: Math.min(rect.width, window.innerWidth - 16),
      maxHeight: usableHeight,
    });
  }, [options.length]);

  useEffect(() => {
    if (!open) return;
    updatePosition();
    const onPointer = (event: PointerEvent) => {
      const target = event.target as Node;
      if (!triggerRef.current?.contains(target) && !menuRef.current?.contains(target)) setOpen(false);
    };
    const onKey = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open, updatePosition]);

  function choose(id: string) {
    setSelected(id);
    setOpen(false);
    triggerRef.current?.focus();
  }

  function onKeyDown(event: ReactKeyboardEvent<HTMLButtonElement>) {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      const index = options.findIndex((option) => option.id === selected);
      const direction = event.key === "ArrowDown" ? 1 : -1;
      setSelected(options[(index + direction + options.length) % options.length].id);
      setOpen(true);
    } else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setOpen((current) => !current);
    } else if (event.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div className="group-select">
      <input type="hidden" name={name} value={selected} />
      <button
        ref={triggerRef}
        type="button"
        className="group-select-trigger"
        aria-label={"Choose a group"}
        role="combobox"
        aria-haspopup="listbox"
        aria-controls={open ? listId : undefined}
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        onKeyDown={onKeyDown}
      >
        <span className="group-select-choice">
          <span className={`group-select-dot${selected ? "" : " group-select-dot-empty"}`} style={selected ? { backgroundColor: normalizeGroupColor(selectedOption.background_color) } : undefined} />
          <span className="group-select-name">{selectedOption.name}</span>
        </span>
        <svg className={`group-select-chevron${open ? " group-select-chevron-open" : ""}`} width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg>
      </button>
      {open && position && createPortal(
        <div
          ref={menuRef}
          id={listId}
          role="listbox"
          aria-label={"Link groups"}
          className="group-select-menu"
          style={{ left: position.left, top: position.top, width: position.width, maxHeight: position.maxHeight }}
        >
          {options.map((option) => (
            <button
              key={option.id}
              type="button"
              role="option"
              aria-selected={selected === option.id}
              className={`group-select-option${selected === option.id ? " group-select-option-selected" : ""}`}
              onClick={() => choose(option.id)}
            >
              <span className="group-select-choice">
                <span className={`group-select-dot${option.id ? "" : " group-select-dot-empty"}`} style={option.id ? { backgroundColor: normalizeGroupColor(option.background_color) } : undefined} />
                <span className="group-select-name">{option.name}</span>
              </span>
              {selected === option.id && <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m5 12 4 4L19 6" /></svg>}
            </button>
          ))}
        </div>, document.body
      )}
    </div>
  );
}

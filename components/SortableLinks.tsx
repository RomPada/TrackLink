"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { reorderLinksAction } from "@/app/actions";
import type { Language } from "@/lib/i18n";

type Item = { id: string; content: ReactNode };
type Props = { groupId: string | null; items: Item[]; language: Language };

function moved(ids: string[], sourceId: string, targetId: string) {
  if (sourceId === targetId) return ids;
  const updated = [...ids];
  const oldIndex = updated.indexOf(sourceId);
  const newIndex = updated.indexOf(targetId);
  if (oldIndex < 0 || newIndex < 0) return ids;
  updated.splice(oldIndex, 1);
  updated.splice(newIndex, 0, sourceId);
  return updated;
}

export default function SortableLinks({ groupId, items, language }: Props) {
  const [order, setOrder] = useState(() => items.map((item) => item.id));
  const [dragging, setDragging] = useState<string | null>(null);
  const [over, setOver] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const dragRef = useRef<string | null>(null);
  const itemSignature = items.map((item) => item.id).join("|");

  useEffect(() => {
    setOrder(items.map((item) => item.id));
  }, [itemSignature]); // reset only when the server's ordered IDs actually change

  const byId = new Map(items.map((item) => [item.id, item.content]));

  async function persist(next: string[]) {
    if (saving || next.join("|") === order.join("|")) return;
    const previous = order;
    setOrder(next);
    setError("");
    setSaving(true);
    try {
      const response = await reorderLinksAction(groupId, next);
      if (!response.ok) throw new Error(response.error || "Could not save order");
    } catch (reason) {
      setOrder(previous);
      setError(reason instanceof Error ? reason.message : "Could not save order");
    } finally {
      setSaving(false);
    }
  }

  async function shift(id: string, offset: number) {
    const index = order.indexOf(id);
    const nextIndex = index + offset;
    if (index < 0 || nextIndex < 0 || nextIndex >= order.length) return;
    const next = [...order];
    [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
    await persist(next);
  }

  return (
    <div className="sortable-link-list">
      {order.map((id, index) => (
        <div
          key={id}
          className={`sortable-link-row${dragging === id ? " sortable-link-row-dragging" : ""}${over === id ? " sortable-link-row-over" : ""}`}
          onDragOver={(event) => {
            if (!dragRef.current || saving) return;
            event.preventDefault();
            event.dataTransfer.dropEffect = "move";
            setOver(id);
          }}
          onDrop={(event) => {
            event.preventDefault();
            const sourceId = dragRef.current;
            dragRef.current = null;
            setOver(null);
            setDragging(null);
            if (sourceId && sourceId !== id) void persist(moved(order, sourceId, id));
          }}
        >
          <div className="sortable-link-tools">
            <button
              type="button"
              className="sortable-drag-handle"
              draggable={!saving}
              disabled={saving}
              title={"Drag to reorder"}
              aria-label={"Drag to reorder"}
              onDragStart={(event) => {
                dragRef.current = id;
                setDragging(id);
                event.dataTransfer.effectAllowed = "move";
                event.dataTransfer.setData("text/plain", id);
              }}
              onDragEnd={() => {
                dragRef.current = null;
                setOver(null);
                setDragging(null);
              }}
            >
              <svg width="21" height="26" viewBox="0 0 20 28" fill="currentColor" aria-hidden="true">
                {[6, 13, 20].map((y) => <g key={y}><circle cx="6" cy={y} r="1.65"/><circle cx="14" cy={y} r="1.65"/></g>)}
              </svg>
            </button>
            <div className="sortable-step-buttons">
              <button type="button" disabled={saving || index === 0} aria-label={"Move up"} title={"Move up"} onClick={() => void shift(id, -1)}>↑</button>
              <button type="button" disabled={saving || index === order.length - 1} aria-label={"Move down"} title={"Move down"} onClick={() => void shift(id, 1)}>↓</button>
            </div>
          </div>
          <div className="sortable-link-content">{byId.get(id)}</div>
        </div>
      ))}
      {saving && <div className="sortable-note" role="status">{"Saving order..."}</div>}
      {error && <div className="sortable-error" role="alert">{error}</div>}
    </div>
  );
}

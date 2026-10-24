"use client";

import { useState } from "react";

export type DemoClickRow = {
  id: string;
  when: string;
  visitor: string;
  device: string;
  country: string;
  group: string;
  linkName: string;
  slug: string;
  destination: string;
};

export default function DemoClickRecordsTable({ records }: { records: DemoClickRow[] }) {
  const [rows, setRows] = useState(records);
  const [pendingId, setPendingId] = useState<string | null>(null);

  function confirmDelete() {
    if (!pendingId) return;
    setRows((current) => current.filter((record) => record.id !== pendingId));
    setPendingId(null);
  }

  return (
    <>
      <p className="records-summary">Demo deletions affect this page only. Refresh to restore sample records.</p>
      {rows.length ? (
        <div className="records-table-wrap">
          <table className="records-table">
            <thead>
              <tr>
                <th>When</th><th>Visitor</th><th>Country</th><th>Group</th><th>Link</th><th>Destination</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((record) => (
                <tr key={record.id}>
                  <td className="nowrap">{record.when}</td>
                  <td><code>{record.visitor}</code><span className="record-secondary">{record.device}</span></td>
                  <td>{record.country}</td>
                  <td>{record.group}</td>
                  <td><strong>{record.linkName}</strong><span className="record-secondary">/{record.slug}</span></td>
                  <td className="record-destination">{record.destination}</td>
                  <td className="record-actions-cell">
                    <button type="button" className="button button-danger button-small" onClick={() => setPendingId(record.id)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="empty-state">All sample click records have been removed from this view.</div>
      )}
      {pendingId ? (
        <div className="confirm-backdrop" role="presentation" onMouseDown={() => setPendingId(null)}>
          <div className="confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="demo-delete-title" onMouseDown={(event) => event.stopPropagation()}>
            <h3 id="demo-delete-title">Delete sample click record?</h3>
            <p>This will remove the selected sample row until you refresh the demo. No actual data will be deleted.</p>
            <div className="confirm-dialog-actions">
              <button type="button" className="button button-ghost" onClick={() => setPendingId(null)}>Cancel</button>
              <button type="button" className="button button-danger" onClick={confirmDelete} autoFocus>Delete</button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

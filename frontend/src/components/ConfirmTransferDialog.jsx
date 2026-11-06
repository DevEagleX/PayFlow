import { useEffect } from "react";
import Avatar from "./Avatar.jsx";
import { formatINR } from "../lib/format.js";

export default function ConfirmTransferDialog({ recipient, amount, note, submitting, onConfirm, onCancel }) {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && !submitting && onCancel();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [submitting, onCancel]);

  return (
    <div className="fixed inset-0 z-50 grid place-items-end bg-ink/40 p-0 backdrop-blur-sm sm:place-items-center sm:p-4" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
      <div className="card w-full max-w-sm animate-rise rounded-b-none p-6 sm:rounded-b-3xl">
        <h2 id="confirm-title" className="text-lg font-bold">Confirm transfer</h2>
        <div className="mt-5 flex items-center gap-3 rounded-2xl bg-canvas p-3">
          <Avatar name={recipient.fullName} />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{recipient.fullName}</p>
            <p className="truncate text-xs text-muted">{recipient.maskedIdentifier}</p>
          </div>
        </div>
        <p className="mt-5 text-center text-4xl font-extrabold tracking-tight">{formatINR(amount)}</p>
        {note && <p className="mt-2 text-center text-sm text-muted">“{note}”</p>}
        <div className="mt-6 grid grid-cols-2 gap-3">
          <button className="btn-ghost" onClick={onCancel} disabled={submitting}>Cancel</button>
          <button className="btn-primary" onClick={onConfirm} disabled={submitting}>{submitting ? "Sending…" : "Send now"}</button>
        </div>
      </div>
    </div>
  );
}

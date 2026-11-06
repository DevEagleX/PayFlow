import { Link, Navigate, useLocation } from "react-router-dom";
import { IconCheck } from "../components/Icons.jsx";
import { formatDateTime, formatINR } from "../lib/format.js";

export default function TransferSuccess() {
  const result = useLocation().state?.result;
  if (!result) return <Navigate to="/dashboard" replace />;

  const rows = [
    ["Sent to", result.recipientName],
    ["Date", formatDateTime(result.timestamp)],
    ["New balance", formatINR(result.newBalance)],
    ["Transaction ID", result.transactionId]
  ];

  return (
    <div className="mx-auto max-w-md pt-4">
      <div className="card p-7 text-center">
        <span className="mx-auto grid h-16 w-16 animate-pop place-items-center rounded-full bg-gradient-to-br from-[#6C63FF] to-[#3A33C0] text-white shadow-pop"><IconCheck size={30} strokeWidth={2.5} /></span>
        <h1 className="mt-5 text-xl font-extrabold">Payment sent</h1>
        <p className="mt-2 text-4xl font-extrabold tracking-tight">{formatINR(result.amount)}</p>
        <dl className="mt-6 divide-y divide-line rounded-2xl bg-canvas px-4 text-left text-sm">
          {rows.map(([k, v]) => (
            <div key={k} className="flex items-center justify-between gap-4 py-3">
              <dt className="text-muted">{k}</dt>
              <dd className="min-w-0 truncate font-semibold">{v}</dd>
            </div>
          ))}
        </dl>
        <div className="mt-6 grid grid-cols-2 gap-3">
          <Link to="/history" className="btn-ghost">History</Link>
          <Link to="/dashboard" className="btn-primary">Done</Link>
        </div>
      </div>
    </div>
  );
}

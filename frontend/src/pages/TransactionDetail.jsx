import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getTransactionById } from "../api/transactionApi.js";
import Avatar from "../components/Avatar.jsx";
import { formatDateTime, formatINR } from "../lib/format.js";

export default function TransactionDetail() {
  const { id } = useParams();
  const [tx, setTx] = useState(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    getTransactionById(id).then(setTx).catch(() => setNotFound(true));
  }, [id]);

  if (notFound) return (
    <div className="card mx-auto max-w-md p-8 text-center">
      <h1 className="text-lg font-bold">Transaction not found</h1>
      <Link to="/history" className="btn-primary mt-5">Back to transactions</Link>
    </div>
  );
  if (!tx) return <div className="skeleton mx-auto h-80 max-w-md" />;

  const received = tx.direction === "RECEIVED";
  const rows = [
    [received ? "From" : "To", tx.counterpartyName],
    ["Date", formatDateTime(tx.timestamp)],
    ["Note", tx.note || "—"],
    ["Status", "Completed"],
    ["Transaction ID", tx.transactionId]
  ];

  return (
    <div className="mx-auto max-w-md animate-rise">
      <Link to="/history" className="text-sm font-semibold text-brand">← Transactions</Link>
      <div className="card mt-4 p-7 text-center">
        <Avatar name={tx.counterpartyName} size={64} className="mx-auto" />
        <p className="mt-3 text-sm text-muted">{received ? "Received from" : "Sent to"} {tx.counterpartyName}</p>
        <p className={`mt-1 text-4xl font-extrabold tracking-tight ${received ? "text-[#17684A]" : ""}`}>{received ? "+" : "−"}{formatINR(tx.amount)}</p>
        <dl className="mt-6 divide-y divide-line rounded-2xl bg-canvas px-4 text-left text-sm">
          {rows.map(([k, v]) => (
            <div key={k} className="flex items-center justify-between gap-4 py-3">
              <dt className="text-muted">{k}</dt>
              <dd className="min-w-0 truncate font-semibold">{v}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}

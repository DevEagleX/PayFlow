import { Link } from "react-router-dom";
import Avatar from "./Avatar.jsx";
import { IconArrowDown, IconArrowUp } from "./Icons.jsx";
import { formatINR, formatTime } from "../lib/format.js";

export default function TransactionRow({ tx }) {
  const received = tx.direction === "RECEIVED";
  return (
    <Link to={`/history/${tx.transactionId}`} className="flex items-center gap-3 rounded-2xl px-2 py-3 transition-colors hover:bg-canvas">
      <Avatar name={tx.counterpartyName} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">{tx.counterpartyName}</p>
        <p className="truncate text-xs text-muted">{tx.note ? `${tx.note} · ` : ""}{formatTime(tx.timestamp)}</p>
      </div>
      <div className="text-right">
        <p className={`text-sm font-bold ${received ? "text-[#17684A]" : "text-ink"}`}>
          {received ? "+" : "−"}{formatINR(tx.amount)}
        </p>
        <p className="mt-0.5 inline-flex items-center gap-1 text-[11px] font-medium text-muted">
          {received ? <IconArrowDown size={11} /> : <IconArrowUp size={11} />}
          {received ? "Received" : "Sent"}
        </p>
      </div>
    </Link>
  );
}

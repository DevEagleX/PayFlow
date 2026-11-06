import { useEffect, useState } from "react";
import { getHistory } from "../api/transactionApi.js";
import TransactionRow from "../components/TransactionRow.jsx";
import { errMsg, groupByDay } from "../lib/format.js";

const TABS = [["ALL", "All"], ["SENT", "Sent"], ["RECEIVED", "Received"]];

export default function History() {
  const [direction, setDirection] = useState("ALL");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(0);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    setLoading(true); setError("");
    getHistory({ page, size: 15, direction, from: from || undefined, to: to || undefined })
      .then((d) => alive && setData(d))
      .catch((e) => alive && setError(errMsg(e, "Could not load transactions")))
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, [direction, from, to, page]);

  const reset = (fn) => (v) => { fn(v); setPage(0); };
  const items = data?.content ?? [];

  return (
    <div className="animate-rise">
      <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Transactions</h1>

      <div className="mt-5 flex flex-wrap items-end justify-between gap-4">
        <div className="flex rounded-full bg-white p-1 shadow-card" role="group" aria-label="Filter by direction">
          {TABS.map(([id, label]) => (
            <button key={id} aria-pressed={direction === id} onClick={() => reset(setDirection)(id)}
              className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${direction === id ? "bg-brand text-white" : "text-muted hover:text-ink"}`}>{label}</button>
          ))}
        </div>
        <div className="flex items-end gap-2">
          <div><label htmlFor="from" className="label">From</label><input id="from" type="date" className="input !py-2" value={from} max={to || undefined} onChange={(e) => reset(setFrom)(e.target.value)} /></div>
          <div><label htmlFor="to" className="label">To</label><input id="to" type="date" className="input !py-2" value={to} min={from || undefined} onChange={(e) => reset(setTo)(e.target.value)} /></div>
          {(from || to) && <button className="btn-ghost !py-2" onClick={() => { setFrom(""); setTo(""); setPage(0); }}>Clear</button>}
        </div>
      </div>

      <section className="card mt-5 p-4 sm:p-6">
        {error && <p role="alert" className="py-6 text-center text-sm text-coral-dark">{error}</p>}
        {loading && !data ? <div className="space-y-3">{[0, 1, 2, 3].map((i) => <div key={i} className="skeleton h-14" />)}</div>
          : !error && items.length === 0 ? <p className="py-12 text-center text-sm text-muted">No transactions match these filters.</p>
          : groupByDay(items).map((g) => (
            <div key={g.label} className={loading ? "opacity-60" : ""}>
              <p className="mt-3 px-2 text-xs font-semibold uppercase tracking-wide text-muted">{g.label}</p>
              {g.items.map((t) => <TransactionRow key={t.transactionId} tx={t} />)}
            </div>
          ))}
      </section>

      {data && data.totalPages > 1 && (
        <div className="mt-5 flex items-center justify-between">
          <button className="btn-ghost" disabled={page === 0} onClick={() => setPage(page - 1)}>Previous</button>
          <span className="text-sm text-muted">Page {data.page + 1} of {data.totalPages}</span>
          <button className="btn-ghost" disabled={page + 1 >= data.totalPages} onClick={() => setPage(page + 1)}>Next</button>
        </div>
      )}
    </div>
  );
}

import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.js";
import { getBalance } from "../api/walletApi.js";
import { getHistory } from "../api/transactionApi.js";
import ActivityChart from "../components/ActivityChart.jsx";
import TransactionRow from "../components/TransactionRow.jsx";
import { IconArrowDown, IconArrowUp, IconEye, IconEyeOff, IconSend, IconChevronRight } from "../components/Icons.jsx";
import { formatINR, totalsSince, groupByDay, errMsg } from "../lib/format.js";

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
}

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [balance, setBalance] = useState(null);
  const [txs, setTxs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [hidden, setHidden] = useState(false);
  const [to, setTo] = useState("");
  const [amount, setAmount] = useState("");

  useEffect(() => {
    let alive = true;
    Promise.all([getBalance(), getHistory({ page: 0, size: 100 })])
      .then(([b, h]) => { if (alive) { setBalance(b); setTxs(h.content); } })
      .catch((e) => alive && setError(errMsg(e, "Could not load your dashboard")))
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, []);

  const week = totalsSince(txs, 7);
  const month = totalsSince(txs, 30);
  const flow = month.sent + month.received || 1;
  const recent = txs.slice(0, 6);

  const quickSend = (e) => {
    e.preventDefault();
    const q = new URLSearchParams();
    if (to.trim()) q.set("to", to.trim());
    if (amount) q.set("amount", amount);
    navigate(`/transfer?${q}`);
  };

  return (
    <div className="space-y-6 animate-rise">
      <div>
        <p className="text-sm text-muted">{greeting()},</p>
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">{user?.fullName?.split(" ")[0]} 👋</h1>
      </div>

      {error && <div role="alert" className="rounded-2xl bg-coral-soft px-4 py-3 text-sm font-medium text-coral-dark">{error}</div>}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-6 min-w-0">
          <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#6C63FF] via-[#4A43D6] to-[#2B2597] p-6 text-white shadow-[0_24px_50px_-20px_rgba(58,51,192,0.7)] sm:p-8">
            <div className="absolute -right-16 -top-20 h-64 w-64 rounded-full bg-white/10" />
            <div className="absolute -bottom-24 right-24 h-56 w-56 rounded-full bg-white/5" />
            <div className="relative flex flex-wrap items-end justify-between gap-6">
              <div>
                <p className="flex items-center gap-2 text-sm font-medium text-white/75">
                  Total balance
                  <button onClick={() => setHidden(!hidden)} aria-label={hidden ? "Show balance" : "Hide balance"} className="rounded-full p-1 hover:bg-white/15">
                    {hidden ? <IconEyeOff size={16} /> : <IconEye size={16} />}
                  </button>
                </p>
                {loading ? <div className="mt-2 h-11 w-52 animate-pulse rounded-xl bg-white/20" /> : (
                  <p className="mt-1 text-4xl font-extrabold tracking-tight sm:text-5xl">{hidden ? "₹ ••••••" : formatINR(balance?.balance)}</p>
                )}
                <p className="mt-3 text-xs text-white/60">{user?.email}</p>
              </div>
              <Link to="/transfer" className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-bold text-brand shadow-card transition-transform hover:-translate-y-0.5">
                <IconSend size={16} /> Send money
              </Link>
            </div>
          </section>

          <ActivityChart transactions={txs} loading={loading} />

          <div className="grid gap-4 sm:grid-cols-2">
            <section className="rounded-3xl bg-gradient-to-br from-[#FF9468] to-[#EB6834] p-6 text-white shadow-[0_20px_40px_-20px_rgba(235,104,52,0.8)]">
              <p className="text-sm font-semibold text-white/85">This week</p>
              <p className="mt-2 text-3xl font-extrabold">{formatINR(week.sent)}</p>
              <p className="mt-1 text-xs text-white/85">sent · {formatINR(week.received)} received</p>
            </section>
            <section className="rounded-3xl bg-gradient-to-br from-[#6C63FF] to-[#3A33C0] p-6 text-white shadow-[0_20px_40px_-20px_rgba(58,51,192,0.8)]">
              <p className="text-sm font-semibold text-white/85">This month</p>
              <p className="mt-2 text-3xl font-extrabold">{formatINR(month.sent)}</p>
              <p className="mt-1 text-xs text-white/85">sent · {formatINR(month.received)} received</p>
            </section>
          </div>
        </div>

        <div className="space-y-6">
          <section className="card p-5">
            <h2 className="text-base font-bold">Quick transfer</h2>
            <form onSubmit={quickSend} className="mt-4 space-y-3">
              <div>
                <label htmlFor="qt-to" className="label">To</label>
                <input id="qt-to" className="input" placeholder="Email or phone" value={to} onChange={(e) => setTo(e.target.value)} />
              </div>
              <div>
                <label htmlFor="qt-amt" className="label">Amount</label>
                <input id="qt-amt" className="input" inputMode="decimal" placeholder="₹ 0.00" value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ""))} />
              </div>
              <button className="btn-primary w-full">Continue</button>
            </form>
          </section>

          <section className="card p-5">
            <h2 className="text-base font-bold">Wallet summary</h2>
            <p className="text-xs text-muted">Last 30 days</p>
            {[
              { label: "Outcome", value: month.sent, color: "#eb6834", Icon: IconArrowUp, tint: "bg-coral-soft text-coral-dark" },
              { label: "Income", value: month.received, color: "#4a43d6", Icon: IconArrowDown, tint: "bg-brand-soft text-brand" }
            ].map(({ label, value, color, Icon, tint }) => (
              <div key={label} className="mt-4">
                <div className="flex items-center gap-3">
                  <span className={`grid h-10 w-10 place-items-center rounded-2xl ${tint}`}><Icon size={18} /></span>
                  <div className="flex-1">
                    <p className="text-xs font-medium text-muted">{label}</p>
                    <p className="text-sm font-bold">{formatINR(value)}</p>
                  </div>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-canvas">
                  <div className="h-full rounded-full" style={{ width: `${(value / flow) * 100}%`, background: color }} />
                </div>
              </div>
            ))}
          </section>
        </div>
      </div>

      <section className="card p-5 sm:p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold">Recent transactions</h2>
          <Link to="/history" className="inline-flex items-center gap-1 text-sm font-semibold text-brand">View all <IconChevronRight size={14} /></Link>
        </div>
        <div className="mt-3">
          {loading ? <div className="space-y-3">{[0, 1, 2].map((i) => <div key={i} className="skeleton h-14" />)}</div>
            : recent.length === 0 ? <p className="py-8 text-center text-sm text-muted">No transactions yet. Send your first payment!</p>
            : groupByDay(recent).map((g) => (
              <div key={g.label}>
                <p className="mt-2 px-2 text-xs font-semibold uppercase tracking-wide text-muted">{g.label}</p>
                {g.items.map((t) => <TransactionRow key={t.transactionId} tx={t} />)}
              </div>
            ))}
        </div>
      </section>
    </div>
  );
}

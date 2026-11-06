const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 2, maximumFractionDigits: 2 });
const inr0 = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });

export const formatINR = (n) => inr.format(Number(n) || 0);
export const formatINRShort = (n) => {
  const v = Number(n) || 0;
  if (v >= 10000000) return `₹${(v / 10000000).toFixed(1)}Cr`;
  if (v >= 100000) return `₹${(v / 100000).toFixed(1)}L`;
  if (v >= 1000) return `₹${(v / 1000).toFixed(v % 1000 === 0 ? 0 : 1)}k`;
  return inr0.format(v);
};

export const initials = (name = "") =>
  name.trim().split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase() ?? "").join("") || "?";

export const formatDateTime = (iso) =>
  new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" });
export const formatDay = (d) => d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
export const formatTime = (iso) => new Date(iso).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });

const startOfDay = (d) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };

export function dayLabel(iso) {
  const d = startOfDay(iso);
  const today = startOfDay(new Date());
  const diff = Math.round((today - d) / 86400000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  return d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
}

export function groupByDay(items) {
  const groups = [];
  for (const t of items) {
    const label = dayLabel(t.timestamp);
    const last = groups[groups.length - 1];
    if (last && last.label === label) last.items.push(t);
    else groups.push({ label, items: [t] });
  }
  return groups;
}

/** Daily buckets for the last `days` days: [{date, received, sent}] */
export function buildDailySeries(transactions, days) {
  const today = startOfDay(new Date());
  const buckets = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    buckets.push({ date: d, received: 0, sent: 0 });
  }
  const first = buckets[0].date.getTime();
  for (const t of transactions) {
    const day = startOfDay(t.timestamp).getTime();
    if (day < first) continue;
    const idx = Math.round((day - first) / 86400000);
    const b = buckets[idx];
    if (!b) continue;
    if (t.direction === "RECEIVED") b.received += Number(t.amount);
    else b.sent += Number(t.amount);
  }
  return buckets;
}

export function totalsSince(transactions, days) {
  const since = startOfDay(new Date());
  since.setDate(since.getDate() - (days - 1));
  let sent = 0, received = 0;
  for (const t of transactions) {
    if (new Date(t.timestamp) < since) continue;
    if (t.direction === "RECEIVED") received += Number(t.amount);
    else sent += Number(t.amount);
  }
  return { sent, received };
}

export function errMsg(err, fallback = "Something went wrong") {
  if (err?.isNetworkError) return "Can't reach the server. Is the backend running?";
  return err?.response?.data?.message || fallback;
}

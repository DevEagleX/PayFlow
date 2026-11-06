import { useEffect, useMemo, useRef, useState } from "react";
import { buildDailySeries, formatDay, formatINR, formatINRShort } from "../lib/format.js";
import { IconChart, IconTable } from "./Icons.jsx";

const RECEIVED = "#4a43d6";
const SENT = "#eb6834";
const RANGES = [{ id: 7, label: "7D" }, { id: 30, label: "30D" }, { id: 90, label: "90D" }];
const H = 260;
const PAD = { t: 16, r: 16, b: 28, l: 48 };

/** Monotone cubic path through points (no overshoot below zero). */
function smoothPath(pts) {
  if (pts.length < 2) return "";
  const n = pts.length;
  const dx = [], m = [], t = [];
  for (let i = 0; i < n - 1; i++) { dx[i] = pts[i + 1][0] - pts[i][0]; m[i] = (pts[i + 1][1] - pts[i][1]) / dx[i]; }
  t[0] = m[0]; t[n - 1] = m[n - 2];
  for (let i = 1; i < n - 1; i++) t[i] = m[i - 1] * m[i] <= 0 ? 0 : (m[i - 1] + m[i]) / 2;
  for (let i = 0; i < n - 1; i++) {
    if (m[i] === 0) { t[i] = 0; t[i + 1] = 0; continue; }
    const a = t[i] / m[i], b = t[i + 1] / m[i], s = a * a + b * b;
    if (s > 9) { const k = 3 / Math.sqrt(s); t[i] = k * a * m[i]; t[i + 1] = k * b * m[i]; }
  }
  let d = `M${pts[0][0]},${pts[0][1]}`;
  for (let i = 0; i < n - 1; i++) {
    const h = dx[i] / 3;
    d += `C${pts[i][0] + h},${pts[i][1] + t[i] * h} ${pts[i + 1][0] - h},${pts[i + 1][1] - t[i + 1] * h} ${pts[i + 1][0]},${pts[i + 1][1]}`;
  }
  return d;
}

function niceMax(v) {
  if (v <= 0) return 100;
  const p = Math.pow(10, Math.floor(Math.log10(v)));
  const f = v / p;
  return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10) * p;
}

export default function ActivityChart({ transactions, loading }) {
  const [range, setRange] = useState(30);
  const [view, setView] = useState("chart");
  const [hover, setHover] = useState(null);
  const wrapRef = useRef(null);
  const [width, setWidth] = useState(640);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setWidth(Math.max(280, e.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, [view]);

  const data = useMemo(() => buildDailySeries(transactions, range), [transactions, range]);
  const max = niceMax(Math.max(...data.map((d) => Math.max(d.received, d.sent))));
  const iw = width - PAD.l - PAD.r, ih = H - PAD.t - PAD.b;
  const x = (i) => PAD.l + (data.length === 1 ? iw / 2 : (i / (data.length - 1)) * iw);
  const y = (v) => PAD.t + ih - (v / max) * ih;
  const line = (key) => data.map((d, i) => [x(i), y(d[key])]);
  const area = (pts) => `${smoothPath(pts)}L${pts[pts.length - 1][0]},${PAD.t + ih}L${pts[0][0]},${PAD.t + ih}Z`;
  const rp = line("received"), sp = line("sent");
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => f * max);
  const xTicks = data.map((_, i) => i).filter((i) => i % Math.ceil(data.length / (width < 480 ? 4 : 7)) === 0);
  const empty = data.every((d) => d.received === 0 && d.sent === 0);
  const totals = data.reduce((a, d) => ({ r: a.r + d.received, s: a.s + d.sent }), { r: 0, s: 0 });

  const onMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - rect.left) * (width / rect.width);
    const i = Math.round(((px - PAD.l) / iw) * (data.length - 1));
    setHover(Math.min(data.length - 1, Math.max(0, i)));
  };
  const h = hover !== null ? data[hover] : null;
  const tipLeft = h ? Math.min(width - 168, Math.max(8, x(hover) + 14)) : 0;

  return (
    <div className="card p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-bold">Money activity</h2>
          <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted" role="list" aria-label="Legend">
            <span role="listitem" className="inline-flex items-center gap-2"><i className="h-0.5 w-4 rounded" style={{ background: RECEIVED }} /> Received <b className="text-ink">{formatINR(totals.r)}</b></span>
            <span role="listitem" className="inline-flex items-center gap-2"><i className="h-0.5 w-4 rounded" style={{ background: SENT }} /> Sent <b className="text-ink">{formatINR(totals.s)}</b></span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-full bg-canvas p-1" role="group" aria-label="Date range">
            {RANGES.map((r) => (
              <button key={r.id} onClick={() => { setRange(r.id); setHover(null); }} aria-pressed={range === r.id}
                className={`rounded-full px-3 py-1 text-xs font-bold transition-colors ${range === r.id ? "bg-white text-brand shadow-card" : "text-muted hover:text-ink"}`}>{r.label}</button>
            ))}
          </div>
          <button onClick={() => setView(view === "chart" ? "table" : "chart")} className="grid h-8 w-8 place-items-center rounded-full bg-canvas text-muted hover:text-ink" aria-label={view === "chart" ? "Show as table" : "Show as chart"} title={view === "chart" ? "Table view" : "Chart view"}>
            {view === "chart" ? <IconTable size={16} /> : <IconChart size={16} />}
          </button>
        </div>
      </div>

      {view === "table" ? (
        <div className="mt-4 max-h-[260px] overflow-auto rounded-xl border border-line">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-canvas text-left text-xs text-muted"><tr><th className="px-4 py-2 font-semibold">Date</th><th className="px-4 py-2 text-right font-semibold">Received</th><th className="px-4 py-2 text-right font-semibold">Sent</th></tr></thead>
            <tbody>{[...data].reverse().map((d) => (
              <tr key={d.date} className="border-t border-line"><td className="px-4 py-2">{formatDay(d.date)}</td><td className="px-4 py-2 text-right">{formatINR(d.received)}</td><td className="px-4 py-2 text-right">{formatINR(d.sent)}</td></tr>
            ))}</tbody>
          </table>
        </div>
      ) : (
        <div ref={wrapRef} className="relative mt-4" style={{ height: H }}>
          {loading ? <div className="skeleton h-full w-full" /> : (
            <>
              <svg width={width} height={H} viewBox={`0 0 ${width} ${H}`} role="img"
                aria-label={`Received versus sent over the last ${range} days. Received total ${formatINR(totals.r)}, sent total ${formatINR(totals.s)}.`}
                onMouseLeave={() => setHover(null)} onPointerMove={onMove} className="touch-pan-y">
                <defs>
                  <linearGradient id="gRec" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={RECEIVED} stopOpacity="0.14" /><stop offset="1" stopColor={RECEIVED} stopOpacity="0" /></linearGradient>
                  <linearGradient id="gSent" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={SENT} stopOpacity="0.12" /><stop offset="1" stopColor={SENT} stopOpacity="0" /></linearGradient>
                </defs>
                {ticks.map((t) => (
                  <g key={t}>
                    <line x1={PAD.l} x2={width - PAD.r} y1={y(t)} y2={y(t)} stroke="#E8E6F4" strokeWidth="1" />
                    <text x={PAD.l - 8} y={y(t) + 4} textAnchor="end" fontSize="11" fill="#625F86">{formatINRShort(t)}</text>
                  </g>
                ))}
                {xTicks.map((i) => (
                  <text key={i} x={x(i)} y={H - 8} textAnchor="middle" fontSize="11" fill="#625F86">{formatDay(data[i].date)}</text>
                ))}
                {data.length > 1 && <>
                  <path d={area(sp)} fill="url(#gSent)" />
                  <path d={area(rp)} fill="url(#gRec)" />
                  <path d={smoothPath(sp)} fill="none" stroke={SENT} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d={smoothPath(rp)} fill="none" stroke={RECEIVED} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </>}
                {h && <>
                  <line x1={x(hover)} x2={x(hover)} y1={PAD.t} y2={PAD.t + ih} stroke="#A09EBD" strokeWidth="1" strokeDasharray="3 3" />
                  <circle cx={x(hover)} cy={y(h.sent)} r="5" fill={SENT} stroke="#fff" strokeWidth="2" />
                  <circle cx={x(hover)} cy={y(h.received)} r="5" fill={RECEIVED} stroke="#fff" strokeWidth="2" />
                </>}
              </svg>
              {empty && <p className="pointer-events-none absolute inset-0 grid place-items-center pb-6 text-sm text-muted">No activity in this period yet</p>}
              {h && (
                <div className="pointer-events-none absolute top-2 w-40 rounded-xl bg-ink px-3 py-2 text-xs text-white shadow-pop" style={{ left: tipLeft }}>
                  <p className="font-semibold text-white/70">{formatDay(h.date)}</p>
                  <p className="mt-1 flex items-center justify-between gap-2"><span className="inline-flex items-center gap-1.5"><i className="h-2 w-2 rounded-full" style={{ background: "#8F89FF" }} />Received</span><b>{formatINR(h.received)}</b></p>
                  <p className="mt-0.5 flex items-center justify-between gap-2"><span className="inline-flex items-center gap-1.5"><i className="h-2 w-2 rounded-full" style={{ background: "#FF9468" }} />Sent</span><b>{formatINR(h.sent)}</b></p>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

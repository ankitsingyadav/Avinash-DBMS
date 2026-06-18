// pages/DashboardPage.jsx
import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import useAuthStore from "../context/authStore";
import axios from "../utils/axios.js";

// ─── Mini animated counter ────────────────────────────────────────────────────
function Counter({ value, duration = 1200 }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    if (!value) return;
    let start = 0;
    const step = Math.ceil(value / (duration / 16));
    const timer = setInterval(() => {
      start = Math.min(start + step, value);
      setDisplay(start);
      if (start >= value) clearInterval(timer);
    }, 16);
    return () => clearInterval(timer);
  }, [value, duration]);
  return <span>{display.toLocaleString()}</span>;
}

// ─── Progress bar ─────────────────────────────────────────────────────────────
function ProgressBar({ value, total, color }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-700"
        style={{ width: `${pct}%`, background: color }}
      />
    </div>
  );
}

// ─── MERGED ORG CARD ─────────────────────────────────────────────────────────
function MergedOrgCard({ onNavigate }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const SECTIONS = [
    {
      key:        "school",
      label:      "Schools",
      centreType: "School",
      accent:     "#6366f1",
      bg:         "#f5f3ff",
      border:     "#c7d2fe",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5zm0 0v6m-4-4v4m8-4v4M3 21h18"/>
        </svg>
      ),
    },
    {
      key:        "college",
      label:      "Colleges",
      centreType: "College",
      accent:     "#0ea5e9",
      bg:         "#f0f9ff",
      border:     "#bae6fd",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4"/>
        </svg>
      ),
    },
    {
      key:        "ngo",
      label:      "NGOs",
      centreType: "NGO",
      accent:     "#10b981",
      bg:         "#f0fdf4",
      border:     "#a7f3d0",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
        </svg>
      ),
    },
    {
      key:        "corporate",
      label:      "Corporate",
      centreType: "Corporate",
      accent:     "#f59e0b",
      bg:         "#fffbeb",
      border:     "#fde68a",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21"/>
        </svg>
      ),
    },
    {
      key:        "online",
      label:      "Online",
      centreType: "Online",
      accent:     "#ec4899",
      bg:         "#fdf2f8",
      border:     "#fbcfe8",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253M3 12c0 .778.099 1.533.284 2.253"/>
        </svg>
      ),
    },
    {
      key:        "community",
      label:      "Community",
      centreType: "Community Centre",
      accent:     "#f97316",
      bg:         "#fff7ed",
      border:     "#fed7aa",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z"/>
        </svg>
      ),
    },
  ];

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const results = await Promise.all(
          SECTIONS.map(async (sec) => {
            const [totalRes, activeRes] = await Promise.all([
              axios.get(`/organisations?limit=1&centreType=${encodeURIComponent(sec.centreType)}`),
              axios.get(`/organisations?limit=1&centreType=${encodeURIComponent(sec.centreType)}&status=Active`),
            ]);
            const getTotal = (r) =>
              r?.data?.data?.total ?? r?.data?.total ?? 0;
            return {
              key:    sec.key,
              total:  getTotal(totalRes),
              active: getTotal(activeRes),
            };
          })
        );
        const map = {};
        results.forEach((r) => { map[r.key] = r; });
        setStats(map);
      } catch (err) {
        console.error("MergedOrgCard fetch error:", err);
        const fallback = {};
        SECTIONS.forEach((s) => { fallback[s.key] = { total: 0, active: 0 }; });
        setStats(fallback);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const grandTotal = stats
    ? SECTIONS.reduce((sum, s) => sum + (stats[s.key]?.total ?? 0), 0)
    : 0;

  return (
    <div
      className="group relative rounded-2xl p-5 cursor-default transition-all duration-200"
      style={{
        background: "#ffffff",
        border: "1px solid #e2e8f0",
        boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-0.5">
            Organisations
          </p>
          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-bold text-slate-800 tracking-tight">
              {loading ? (
                <span className="inline-block w-16 h-8 bg-slate-200 rounded-lg animate-pulse" />
              ) : (
                <Counter value={grandTotal} />
              )}
            </p>
            <span className="text-sm text-slate-500 font-medium">total</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Live
        </div>
      </div>

      {/* 3+3 Grid */}
      <div className="grid grid-cols-3 gap-3">
        {SECTIONS.map((sec) => {
          const s        = stats?.[sec.key];
          const inactive = s ? s.total - s.active : 0;

          return (
            <button
              key={sec.key}
              onClick={() => onNavigate(sec.key)}
              className="group/sec rounded-xl p-4 text-left transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md"
              style={{
                background: sec.bg,
                border: `1px solid ${sec.border}`,
              }}
            >
              {/* Icon + Label */}
              <div className="flex items-center gap-1.5 mb-3">
                <span style={{ color: sec.accent }}>{sec.icon}</span>
                <span className="text-xs font-semibold" style={{ color: sec.accent }}>
                  {sec.label}
                </span>
              </div>

              {/* Total count */}
              <p className="text-2xl font-bold text-slate-800 mb-2">
                {loading ? (
                  <span className="inline-block w-10 h-6 bg-slate-200 rounded animate-pulse" />
                ) : (
                  <Counter value={s?.total ?? 0} />
                )}
              </p>

              {/* Active / Inactive pills */}
              {loading ? (
                <div className="h-5 w-20 bg-slate-200 rounded-full animate-pulse" />
              ) : s ? (
                <div className="flex flex-col gap-1.5">
                  <span
                    className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full font-medium w-fit"
                    style={{
                      background: "rgba(16,185,129,0.10)",
                      border:     "1px solid rgba(16,185,129,0.25)",
                      color:      "#059669",
                    }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    {s.active} Active
                  </span>
                  {inactive > 0 && (
                    <span
                      className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full font-medium w-fit"
                      style={{
                        background: "#f1f5f9",
                        border:     "1px solid #cbd5e1",
                        color:      "#64748b",
                      }}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                      {inactive} Inactive
                    </span>
                  )}
                </div>
              ) : null}

              {/* View all hint on hover */}
              <div
                className="flex items-center gap-1 mt-3 opacity-0 group-hover/sec:opacity-100 transition-opacity text-[11px] font-medium"
                style={{ color: sec.accent }}
              >
                View all
                <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"/>
                </svg>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── VOLUNTEER CARD ───────────────────────────────────────────────────────────
function VolunteerCard({ onNavigate }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const accent  = "#f59e0b";
  const breakdowns = [
    { key: "area_of_interest", value: "Teaching",    label: "Teaching",    color: "#6366f1" },
    { key: "area_of_interest", value: "Tech",        label: "Tech",        color: "#0ea5e9" },
    { key: "area_of_interest", value: "Social Work", label: "Social Work", color: "#10b981" },
    { key: "area_of_interest", value: "Healthcare",  label: "Healthcare",  color: "#f59e0b" },
  ];

  useEffect(() => {
    const fetch = async () => {
      try {
        const [totalRes, activeRes, ...bdRes] = await Promise.all([
          axios.get(`/organisations/volunteers?limit=1`),
          axios.get(`/organisations/volunteers?limit=1&status=Active`),
          ...breakdowns.map((b) =>
            axios.get(`/organisations/volunteers?limit=1&area_of_interest=${encodeURIComponent(b.value)}`)
          ),
        ]);
        const getT = (r) => r?.data?.data?.total ?? r?.data?.total ?? 0;
        setStats({
          total: getT(totalRes),
          active: getT(activeRes),
          breakdowns: breakdowns.map((b, i) => ({ ...b, count: getT(bdRes[i]) })),
        });
      } catch {
        setStats({ total: 0, active: 0, breakdowns: breakdowns.map((b) => ({ ...b, count: 0 })) });
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const inactive = stats ? stats.total - stats.active : 0;

  return (
    <div
      onClick={() => onNavigate("volunteer")}
      className="group relative rounded-2xl p-5 cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"
      style={{
        background: "#ffffff",
        border: `1px solid #fde68a`,
        boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
      }}
    >
      {/* Hover glow */}
      <div
        className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{ background: `radial-gradient(ellipse at 50% 0%, ${accent}08, transparent 70%)` }}
      />

      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center"
          style={{ background: "#fffbeb", border: `1px solid #fde68a` }}>
          <span style={{ color: accent }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>
            </svg>
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500 group-hover:text-slate-700 transition-colors">
          View all
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"/>
          </svg>
        </div>
      </div>

      {/* Total */}
      <div className="mb-1">
        <p className="text-3xl font-bold text-slate-800 tracking-tight">
          {loading ? (
            <span className="inline-block w-16 h-8 bg-slate-200 rounded-lg animate-pulse" />
          ) : (
            <Counter value={stats?.total ?? 0} />
          )}
        </p>
        <p className="text-sm font-medium mt-0.5" style={{ color: accent }}>Volunteers</p>
      </div>

      {/* Active / Inactive pills */}
      {!loading && stats && (
        <div className="flex items-center gap-2 mb-4">
          <span
            className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium"
            style={{ background: "#f0fdf4", color: "#059669", border: "1px solid #a7f3d0" }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            {stats.active} Active
          </span>
          {inactive > 0 && (
            <span
              className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium"
              style={{ background: "#f1f5f9", color: "#64748b", border: "1px solid #cbd5e1" }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
              {inactive} Inactive
            </span>
          )}
        </div>
      )}

      {/* Breakdown bars */}
      <div className="space-y-2.5 border-t border-slate-100 pt-3">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-1">
              <div className="h-2.5 w-24 bg-slate-200 rounded animate-pulse" />
              <div className="h-1.5 w-full bg-slate-200 rounded animate-pulse" />
            </div>
          ))
        ) : (
          stats?.breakdowns.map((b) => (
            <div key={b.value}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-slate-500 font-medium">{b.label}</span>
                <span className="text-xs font-bold tabular-nums" style={{ color: b.color }}>
                  {b.count.toLocaleString()}
                </span>
              </div>
              <ProgressBar value={b.count} total={stats.total} color={b.color} />
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ─── Quick action button ──────────────────────────────────────────────────────
function QuickAction({ icon, label, sublabel, onClick, accent }) {
  return (
    <button
      onClick={onClick}
      className="group flex items-center gap-3 w-full px-4 py-3 rounded-xl transition-all duration-150 hover:translate-x-1"
      style={{ background: "#f8fafc", border: "1px solid #e2e8f0" }}>
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors"
        style={{ background: `${accent}15`, border: `1px solid ${accent}30` }}>
        <span style={{ color: accent }}>{icon}</span>
      </div>
      <div className="text-left min-w-0">
        <p className="text-sm font-medium text-slate-700 group-hover:text-slate-900 transition-colors">{label}</p>
        {sublabel && <p className="text-xs text-slate-400 truncate">{sublabel}</p>}
      </div>
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        className="ml-auto text-slate-300 group-hover:text-slate-500 shrink-0 transition-colors">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5"/>
      </svg>
    </button>
  );
}

// ─── Follow-up reminder card ──────────────────────────────────────────────────
function FollowUpCard({ onNavigate }) {
  const [items, setItems]     = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const today   = new Date().toISOString().split("T")[0];
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

    const endpoints = [
      {
        label:  "School",
        tab:    "school",
        url:    `/organisations?limit=3&centreType=School&dateFrom=${weekAgo}&dateTo=${today}&sortField=createdAt&sortDir=desc`,
        dataKey: "organisations",
        accent: "#6366f1",
      },
      {
        label:  "College",
        tab:    "college",
        url:    `/organisations?limit=3&centreType=College&dateFrom=${weekAgo}&dateTo=${today}&sortField=createdAt&sortDir=desc`,
        dataKey: "organisations",
        accent: "#0ea5e9",
      },
      {
        label:  "NGO",
        tab:    "ngo",
        url:    `/organisations?limit=3&centreType=NGO&dateFrom=${weekAgo}&dateTo=${today}&sortField=createdAt&sortDir=desc`,
        dataKey: "organisations",
        accent: "#10b981",
      },
      {
        label:  "Corporate",
        tab:    "corporate",
        url:    `/organisations?limit=3&centreType=Corporate&dateFrom=${weekAgo}&dateTo=${today}&sortField=createdAt&sortDir=desc`,
        dataKey: "organisations",
        accent: "#f59e0b",
      },
      {
        label:  "Online",
        tab:    "online",
        url:    `/organisations?limit=3&centreType=Online&dateFrom=${weekAgo}&dateTo=${today}&sortField=createdAt&sortDir=desc`,
        dataKey: "organisations",
        accent: "#ec4899",
      },
      {
        label:  "Community",
        tab:    "community",
        url:    `/organisations?limit=3&centreType=Community%20Centre&dateFrom=${weekAgo}&dateTo=${today}&sortField=createdAt&sortDir=desc`,
        dataKey: "organisations",
        accent: "#f97316",
      },
      {
        label:  "Volunteer",
        tab:    "volunteer",
        url:    `/organisations/volunteers?limit=3&dateFrom=${weekAgo}&dateTo=${today}&sortField=createdAt&sortDir=desc`,
        dataKey: "volunteers",
        accent: "#f59e0b",
      },
    ];

    Promise.all(
      endpoints.map((e) => axios.get(e.url).catch(() => null))
    )
      .then((results) => {
        const all = [];
        results.forEach((res, i) => {
          const data  = res?.data?.data ?? res?.data ?? {};
          const key   = endpoints[i].dataKey;
          const rows  = data[key] ?? [];
          rows.forEach((r) => {
            all.push({
              ...r,
              _catLabel: endpoints[i].label,
              _tab:      endpoints[i].tab,
              _accent:   endpoints[i].accent,
            });
          });
        });
        all.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setItems(all.slice(0, 6));
      })
      .finally(() => setLoading(false));
  }, []);

  const fmtDate = (d) =>
    new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short" });

  const isNew = (d) =>
    new Date(d) > new Date(Date.now() - 24 * 60 * 60 * 1000);

  if (!loading && items.length === 0) return null;

  return (
    <div
      className="rounded-2xl p-5"
      style={{ background: "#ffffff", border: "1px solid #e2e8f0", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          <h3 className="text-sm font-semibold text-slate-800">Recently Added</h3>
        </div>
        <span className="text-xs text-slate-400">Last 7 days</span>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-10 bg-slate-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <button
              key={item._id}
              onClick={() => onNavigate(item._tab)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all hover:translate-x-0.5 text-left group"
              style={{
                background: `${item._accent}08`,
                border:     `1px solid ${item._accent}25`,
              }}
            >
              <div
                className="w-2 h-2 rounded-full shrink-0"
                style={{ background: item._accent }}
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-700 truncate">
                  {item.centreName ?? item.name}
                </p>
                <p className="text-xs text-slate-400">{item._catLabel}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-xs font-semibold text-slate-500">
                  {fmtDate(item.createdAt)}
                </p>
                {isNew(item.createdAt) && (
                  <p className="text-[10px] text-emerald-600 font-medium">New</p>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { user, updateProfile, isLoading } = useAuthStore();
  const navigate = useNavigate();
  const fileRef  = useRef(null);

  const [editMode, setEditMode]   = useState(false);
  const [form, setForm]           = useState({
    fullName:     user?.fullName     || "",
    phone:        user?.phone        || "",
    ninAinNumber: user?.ninAinNumber || "",
  });
  const [preview, setPreview]     = useState(null);
  const [imageFile, setImageFile] = useState(null);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    const fd = new FormData();
    if (form.fullName     !== user.fullName)     fd.append("fullName",     form.fullName);
    if (form.phone        !== user.phone)        fd.append("phone",        form.phone);
    if (form.ninAinNumber !== user.ninAinNumber) fd.append("ninAinNumber", form.ninAinNumber);
    if (imageFile) fd.append("profileImage", imageFile);
    const result = await updateProfile(fd);
    if (result.success) { setEditMode(false); setPreview(null); setImageFile(null); }
  };

  const handleCardClick = (tab) => navigate("/admin", { state: { tab } });

  const avatarUrl = preview || user?.profileImage?.url;
  const initials  = user?.fullName?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  const isAdmin   = user?.role === "admin";

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#f8f9fc" }}>
      <Navbar />

      <div className="max-w-5xl mx-auto px-4 py-8 w-full flex-1">

        {/* ── Welcome banner ── */}
        <div className="flex items-center justify-between mb-7 flex-wrap gap-3">
          <div>
            <p className="text-slate-500 text-xs font-semibold uppercase tracking-widest mb-0.5">
              {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}
            </p>
            <h1 className="text-2xl font-bold text-slate-800">
              Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 17 ? "afternoon" : "evening"},{" "}
              <span style={{ color: "#6366f1" }}>{user?.fullName?.split(" ")[0]}</span> 👋
            </h1>
          </div>
          {isAdmin && (
            <button
              onClick={() => navigate("/admin")}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all hover:-translate-y-0.5"
              style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)", boxShadow: "0 4px 20px rgba(99,102,241,0.20)" }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0H3"/>
              </svg>
              Open Admin Panel
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* ── LEFT COL ── */}
          <div className="flex flex-col gap-4">

            {/* Profile card */}
            <div
              className="rounded-2xl p-5"
              style={{ background: "#ffffff", border: "1px solid #e2e8f0", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}
            >
              <div className="flex items-start gap-4 mb-5">
                <div className="relative shrink-0">
                  <div className="w-16 h-16 rounded-2xl overflow-hidden ring-2 ring-indigo-200">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt={user?.fullName} className="w-full h-full object-cover"/>
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center">
                        <span className="text-white text-lg font-bold">{initials}</span>
                      </div>
                    )}
                  </div>
                  {editMode && (
                    <button type="button" onClick={() => fileRef.current.click()}
                      className="absolute -bottom-1 -right-1 w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center border-2 border-white hover:bg-indigo-500 transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z"/>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z"/>
                      </svg>
                    </button>
                  )}
                  <input ref={fileRef} type="file" accept="image/*" onChange={handleImageChange} className="hidden"/>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                    <h2 className="text-base font-bold text-slate-800 truncate">{user?.fullName}</h2>
                    <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold shrink-0 ${
                      isAdmin
                        ? "bg-amber-50 text-amber-700 border border-amber-200"
                        : "bg-indigo-50 text-indigo-700 border border-indigo-200"
                    }`}>
                      {user?.role?.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-slate-500 text-xs truncate">{user?.email}</p>
                  <p className="text-slate-400 text-xs">{user?.phone}</p>
                </div>
              </div>

              {/* Stats row */}
              <div className="grid grid-cols-3 gap-2 mb-4">
                {[
                  { label: "NIN/AIN", value: user?.ninAinNumber || "—" },
                  { label: "Joined",  value: user?.createdAt ? new Date(user.createdAt).toLocaleDateString("en-IN", { month: "short", year: "2-digit" }) : "—" },
                  { label: "Login",   value: user?.lastLogin  ? new Date(user.lastLogin).toLocaleDateString("en-IN", { month: "short", day: "numeric" }) : "Today" },
                ].map((s) => (
                  <div key={s.label} className="bg-slate-50 rounded-xl p-2.5 border border-slate-200 text-center">
                    <p className="text-slate-800 font-semibold text-sm truncate" title={s.value}>{s.value}</p>
                    <p className="text-slate-400 text-xs mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>

              {/* Edit toggle */}
              <button
                onClick={() => setEditMode((p) => !p)}
                className={`w-full text-sm px-3.5 py-2 rounded-lg font-medium transition-all ${
                  editMode
                    ? "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    : "bg-indigo-50 text-indigo-600 border border-indigo-200 hover:bg-indigo-100"
                }`}>
                {editMode ? "Cancel" : "Edit Profile"}
              </button>

              {editMode && (
                <form onSubmit={handleUpdate} className="space-y-3 pt-4 mt-3 border-t border-slate-100">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="field-label">Full Name</label>
                      <input value={form.fullName} onChange={(e) => setForm((p) => ({ ...p, fullName: e.target.value }))} className="field-input" placeholder="Full name"/>
                    </div>
                    <div>
                      <label className="field-label">NIN / AIN Number</label>
                      <input
                        value={form.ninAinNumber}
                        onChange={(e) => setForm((p) => ({ ...p, ninAinNumber: e.target.value }))}
                        className="field-input"
                        placeholder="Enter NIN / AIN number"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="field-label">Phone Number</label>
                    <input value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} className="field-input" placeholder="+91 9876543210"/>
                  </div>
                  <button type="submit" disabled={isLoading} className="btn-primary">
                    {isLoading
                      ? <span className="flex items-center justify-center gap-2"><span className="loader"/> Saving...</span>
                      : "Save Changes →"}
                  </button>
                </form>
              )}
            </div>

            {/* Quick actions */}
            {isAdmin && (
              <div
                className="rounded-2xl p-5"
                style={{ background: "#ffffff", border: "1px solid #e2e8f0", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}
              >
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Quick Actions</p>
                <div className="space-y-2">
                  <QuickAction
                    accent="#8b5cf6"
                    label="Add Organisation"
                    sublabel="Unified form for all types"
                    onClick={() => navigate("/organisation/add")}
                    icon={<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15"/></svg>}
                  />
                  <QuickAction
                    accent="#10b981"
                    label="Import Data"
                    sublabel="Bulk upload via Excel"
                    onClick={() => navigate("/admin", { state: { showImport: true } })}
                    icon={<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/></svg>}
                  />
                </div>
              </div>
            )}

            {/* Security card */}
            <div
              className="rounded-2xl p-5"
              style={{ background: "#ffffff", border: "1px solid #e2e8f0", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}
            >
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Security</h3>
              <div className="flex items-center justify-between py-2.5 border-b border-slate-100">
                <div>
                  <p className="text-sm text-slate-700 font-medium">Password</p>
                  <p className="text-xs text-slate-400 mt-0.5">Change your account password</p>
                </div>
                <button onClick={() => navigate("/login")} className="text-xs text-indigo-500 hover:text-indigo-700 transition-colors">
                  Change →
                </button>
              </div>
              <div className="flex items-center justify-between py-2.5">
                <div>
                  <p className="text-sm text-slate-700 font-medium">Account Status</p>
                  <p className="text-xs text-slate-400 mt-0.5">Your account is active and secure</p>
                </div>
                <span className="text-xs text-emerald-600 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"/>
                  Active
                </span>
              </div>
            </div>
          </div>

          {/* ── RIGHT COL ── */}
          <div className="lg:col-span-2 flex flex-col gap-4">

            {/* Section header */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-800">Organisation Overview</h2>
                <p className="text-xs text-slate-400 mt-0.5">Click any section to open it in the admin panel</p>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"/>
                Live data
              </div>
            </div>

            {/* Merged Org Card */}
            <MergedOrgCard onNavigate={handleCardClick} />

            {/* Volunteer Card */}
            <VolunteerCard onNavigate={handleCardClick} />

            {/* Recently Added */}
            <FollowUpCard onNavigate={handleCardClick} />
          </div>
        </div>
      </div>

      <footer className="border-t border-slate-200 py-5 text-center mt-6">
        <p className="text-slate-400 text-xs">© {new Date().getFullYear()} DB Manager. All rights reserved.</p>
      </footer>
    </div>
  );
}
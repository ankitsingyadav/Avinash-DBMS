// ─── pages/NotificationsPage.jsx ─────────────────────────────────────────────
import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../utils/axios.js";
import Navbar from "../components/Navbar";

// ── Helpers ───────────────────────────────────────────────────────────────────
const getTimeRemaining = (date) => {
  const now    = Date.now();
  const target = new Date(date).getTime();
  const diff   = target - now;

  if (diff <= 0) {
    const over = Math.abs(diff);
    const h = Math.floor(over / (1000 * 60 * 60));
    const m = Math.floor((over % (1000 * 60 * 60)) / (1000 * 60));
    return {
      label:   h > 0 ? `${h}h ${m}m overdue` : `${m}m overdue`,
      urgent:  true,
      overdue: true,
      critical: false,
      pct: 0,
    };
  }

  const totalMs = 48 * 60 * 60 * 1000;
  const pct     = Math.max(0, Math.min(100, ((totalMs - diff) / totalMs) * 100));
  const hours   = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (hours === 0 && minutes < 60)
    return { label: `${minutes}m left`, urgent: true,  critical: true,  overdue: false, pct };
  if (hours < 2)
    return { label: `${hours}h ${minutes}m left`, urgent: true, critical: true, overdue: false, pct };
  if (hours < 6)
    return { label: `${hours}h ${minutes}m left`, urgent: true,  critical: false, overdue: false, pct };
  if (hours < 12)
    return { label: `${hours}h left`, urgent: true,  critical: false, overdue: false, pct };
  return       { label: `${hours}h left`, urgent: false, critical: false, overdue: false, pct };
};

const formatDateTime = (date) =>
  new Date(date).toLocaleString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit", hour12: true,
  });

const MODE_META = {
  Email:    { icon: "✉️",  color: "#6366f1", bg: "rgba(99,102,241,0.12)"  },
  Phone:    { icon: "📞",  color: "#10b981", bg: "rgba(16,185,129,0.12)"  },
  WhatsApp: { icon: "💬",  color: "#22c55e", bg: "rgba(34,197,94,0.12)"   },
  Visit:    { icon: "🏢",  color: "#f59e0b", bg: "rgba(245,158,11,0.12)"  },
};

const TYPE_COLORS = {
  School:             "#06b6d4",
  College:            "#8b5cf6",
  NGO:                "#10b981",
  Corporate:          "#f59e0b",
  Online:             "#6366f1",
  "Community Centre": "#f43f5e",
};

// ── CSS ───────────────────────────────────────────────────────────────────────
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap');

  .np-root { font-family: 'Syne', sans-serif; }

  @keyframes np-fadeUp {
    from { opacity: 0; transform: translateY(14px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes np-pulse-ring {
    0%,100% { transform: scale(1); opacity: 0.6; }
    50%      { transform: scale(1.65); opacity: 0; }
  }
  @keyframes np-spin { to { transform: rotate(360deg); } }
  @keyframes np-shimmer {
    from { background-position: -200% 0; }
    to   { background-position:  200% 0; }
  }
  @keyframes np-glow-red {
    0%,100% { box-shadow: 0 0 0 0 rgba(239,68,68,0); }
    50%      { box-shadow: 0 0 16px 2px rgba(239,68,68,0.18); }
  }
  @keyframes np-glow-amber {
    0%,100% { box-shadow: 0 0 0 0 rgba(245,158,11,0); }
    50%      { box-shadow: 0 0 14px 2px rgba(245,158,11,0.14); }
  }
  @keyframes np-progress-stripe {
    0%   { background-position: 0 0; }
    100% { background-position: 40px 0; }
  }

  .np-card {
    animation: np-fadeUp 0.32s ease both;
    transition: transform 0.22s cubic-bezier(.22,1,.36,1), box-shadow 0.22s, border-color 0.22s;
  }
  .np-card:hover {
    transform: translateY(-3px) scale(1.004);
    box-shadow: 0 16px 48px rgba(0,0,0,0.55);
  }
  .np-card-overdue  { animation: np-glow-red   3s ease infinite; }
  .np-card-critical { animation: np-glow-amber 3s ease infinite; }

  .np-skeleton {
    background: linear-gradient(90deg,
      rgba(255,255,255,0.03) 25%,
      rgba(255,255,255,0.08) 50%,
      rgba(255,255,255,0.03) 75%
    );
    background-size: 200% 100%;
    animation: np-shimmer 1.5s ease infinite;
    border-radius: 8px;
  }

  .np-scroll::-webkit-scrollbar { width: 3px; }
  .np-scroll::-webkit-scrollbar-track { background: transparent; }
  .np-scroll::-webkit-scrollbar-thumb { background: rgba(99,102,241,0.3); border-radius: 99px; }

  .np-cancel-btn {
    transition: all 0.15s;
    cursor: pointer;
  }
  .np-cancel-btn:hover {
    background: rgba(239,68,68,0.22) !important;
    border-color: rgba(239,68,68,0.55) !important;
    transform: scale(1.04);
  }

  .np-filter-chip {
    transition: all 0.14s;
    cursor: pointer;
    user-select: none;
  }
  .np-filter-chip:hover { opacity: 0.8; }

  .np-go-btn {
    transition: all 0.14s cubic-bezier(.22,1,.36,1);
  }
  .np-go-btn:hover {
    transform: translateX(3px);
    opacity: 0.9;
  }

  .np-progress-bar {
    position: relative;
    overflow: hidden;
    border-radius: 99px;
  }
  .np-progress-bar::after {
    content: '';
    position: absolute;
    inset: 0;
    background: repeating-linear-gradient(
      -45deg,
      transparent, transparent 8px,
      rgba(255,255,255,0.06) 8px, rgba(255,255,255,0.06) 16px
    );
    background-size: 40px 100%;
    animation: np-progress-stripe 1s linear infinite;
    border-radius: 99px;
  }

  @media (max-width: 640px) {
    .np-stat-grid { grid-template-columns: repeat(2,1fr) !important; }
    .np-card-actions { flex-direction: column !important; }
  }
`;

// ── Cancel Modal ──────────────────────────────────────────────────────────────
function CancelModal({ item, onConfirm, onCancel, loading }) {
  const mode = MODE_META[item.interactionMode] || { icon: "📋", color: "#6366f1" };
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9999,
      background: "rgba(0,0,0,0.9)", backdropFilter: "blur(12px)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
    }}>
      <div style={{
        background: "linear-gradient(145deg, #0f0f1e 0%, #0d0d18 100%)",
        border: "1px solid rgba(239,68,68,0.25)",
        borderRadius: 22, padding: 32, maxWidth: 400, width: "100%",
        boxShadow: "0 32px 80px rgba(0,0,0,0.75), 0 0 0 1px rgba(239,68,68,0.08)",
        animation: "np-fadeUp 0.22s ease",
      }}>
        <div style={{
          width: 54, height: 54, borderRadius: 16,
          background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.22)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 24, marginBottom: 20,
        }}>🗑️</div>

        <p style={{ color: "#f1f5f9", fontSize: 18, fontWeight: 800, margin: "0 0 6px", letterSpacing: "-0.03em" }}>
          Cancel Interaction?
        </p>
        <p style={{ color: "#475569", fontSize: 13, margin: "0 0 22px", lineHeight: 1.65 }}>
          The scheduled date will be cleared. All interaction history is preserved.
        </p>

        <div style={{
          padding: "13px 15px", borderRadius: 13, marginBottom: 24,
          background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)",
        }}>
          <p style={{ color: "#e2e8f0", fontSize: 13.5, fontWeight: 700, margin: "0 0 4px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {item.centreName}
          </p>
          <p style={{ color: "#475569", fontSize: 11.5, margin: 0 }}>
            {mode.icon} {item.interactionMode} · {formatDateTime(item.nextInteractionDate)}
          </p>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={onCancel}
            disabled={loading}
            style={{
              flex: 1, padding: "12px", borderRadius: 12,
              background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)",
              color: "#64748b", fontSize: 13, fontWeight: 600, cursor: "pointer",
              fontFamily: "'Syne', sans-serif", transition: "all 0.15s",
            }}
          >
            Keep it
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            style={{
              flex: 1, padding: "12px", borderRadius: 12,
              background: loading ? "rgba(239,68,68,0.06)" : "rgba(239,68,68,0.14)",
              border: "1px solid rgba(239,68,68,0.32)",
              color: "#f87171", fontSize: 13, fontWeight: 700,
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.6 : 1,
              fontFamily: "'Syne', sans-serif",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              transition: "all 0.15s",
            }}
          >
            {loading ? (
              <>
                <span style={{
                  width: 13, height: 13,
                  border: "2px solid rgba(248,113,113,0.3)", borderTopColor: "#f87171",
                  borderRadius: "50%", animation: "np-spin 0.7s linear infinite", display: "inline-block",
                }} />
                Cancelling…
              </>
            ) : "Cancel Interaction"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Skeleton Card ─────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div style={{
      background: "#111120", border: "1px solid rgba(255,255,255,0.05)",
      borderRadius: 20, padding: "20px 22px",
    }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
        <div className="np-skeleton" style={{ width: 46, height: 46, borderRadius: 13, flexShrink: 0 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="np-skeleton" style={{ height: 14, width: "52%", marginBottom: 8 }} />
          <div className="np-skeleton" style={{ height: 11, width: "32%", marginBottom: 14 }} />
          <div style={{ display: "flex", gap: 8 }}>
            <div className="np-skeleton" style={{ height: 24, width: 72, borderRadius: 7 }} />
            <div className="np-skeleton" style={{ height: 24, width: 110, borderRadius: 7 }} />
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
          <div className="np-skeleton" style={{ width: 60, height: 28, borderRadius: 9 }} />
          <div className="np-skeleton" style={{ width: 60, height: 28, borderRadius: 9 }} />
        </div>
      </div>
    </div>
  );
}

// ── Progress Bar ──────────────────────────────────────────────────────────────
function TimeProgress({ pct, color, overdue }) {
  if (overdue) return null;
  return (
    <div style={{
      height: 3, width: "100%", background: "rgba(255,255,255,0.06)",
      borderRadius: 99, marginTop: 12, overflow: "hidden",
    }}>
      <div
        className={pct > 80 ? "np-progress-bar" : ""}
        style={{
          height: "100%",
          width: `${pct}%`,
          background: pct > 85
            ? "linear-gradient(90deg,#ef4444,#f97316)"
            : pct > 65
              ? "linear-gradient(90deg,#f59e0b,#fbbf24)"
              : `linear-gradient(90deg,${color},${color}aa)`,
          borderRadius: 99,
          transition: "width 0.5s ease",
        }}
      />
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function NotificationsPage() {
    
  const navigate = useNavigate();

  const [interactions, setInteractions] = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelling,   setCancelling]   = useState(false);
  const [tick,         setTick]         = useState(0);

  // Filters
  const [filterMode,    setFilterMode]    = useState("");
  const [filterUrgency, setFilterUrgency] = useState("");
  const [filterType,    setFilterType]    = useState("");
  const [searchQ,       setSearchQ]       = useState("");

  const tickRef = useRef(null);

  // ── Fetch ───────────────────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await axios.get("/organisations/upcoming-interactions");
const list = res.data?.interactions || [];
      setInteractions(list);
    } catch {
      setInteractions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const ref = setInterval(fetchData, 3 * 60 * 1000);
    return () => clearInterval(ref);
  }, [fetchData]);

  // Countdown re-render every 30s for accuracy
  useEffect(() => {
    tickRef.current = setInterval(() => setTick((t) => t + 1), 30 * 1000);
    return () => clearInterval(tickRef.current);
  }, []);

  // ── Cancel ──────────────────────────────────────────────────────────────────
  const handleCancelConfirm = async () => {
    if (!cancelTarget) return;
    setCancelling(true);
    try {
      await axios.post(`/organisations/${cancelTarget._id}/interactions/cancel`, {
        interactionIndex: cancelTarget.interactionIndex,
      });
      await fetchData();
    } catch {
      // silent
    } finally {
      setCancelling(false);
      setCancelTarget(null);
    }
  };

  // ── Navigate to admin with highlight + interaction filter ────────────────────
  const handleGoToAdmin = (item, e) => {
    if (e) e.stopPropagation();
    navigate(`/admin?tab=organisation&highlight=${item._id}&filter=upcoming`);
  };

  // ── Filter logic ─────────────────────────────────────────────────────────────
  const filtered = interactions.filter((item) => {
    const tr = getTimeRemaining(item.nextInteractionDate);
    if (filterUrgency === "overdue"   && !tr.overdue)                  return false;
    if (filterUrgency === "critical"  && (!tr.critical || tr.overdue)) return false;
    if (filterUrgency === "urgent"    && (!tr.urgent || tr.overdue || tr.critical)) return false;
    if (filterUrgency === "upcoming"  && tr.urgent)                    return false;
    if (filterMode && item.interactionMode !== filterMode)             return false;
    if (filterType && item.centreType !== filterType)                  return false;
    if (searchQ) {
      const q = searchQ.toLowerCase();
      if (
        !item.centreName?.toLowerCase().includes(q) &&
        !item.interactedWith?.toLowerCase().includes(q) &&
        !item.interactionBy?.toLowerCase().includes(q) &&
        !item.centreType?.toLowerCase().includes(q)
      ) return false;
    }
    return true;
  });

  // Stats
  const total    = interactions.length;
  const overdue  = interactions.filter((i) => getTimeRemaining(i.nextInteractionDate).overdue).length;
  const critical = interactions.filter((i) => { const t = getTimeRemaining(i.nextInteractionDate); return t.critical && !t.overdue; }).length;
  const urgent   = interactions.filter((i) => { const t = getTimeRemaining(i.nextInteractionDate); return t.urgent && !t.overdue && !t.critical; }).length;
  const safe     = total - overdue - critical - urgent;

  const modes = [...new Set(interactions.map((i) => i.interactionMode).filter(Boolean))];
  const types = [...new Set(interactions.map((i) => i.centreType).filter(Boolean))];
  const hasFilters = filterMode || filterUrgency || filterType || searchQ;

  return (
    <div className="np-root" style={{ minHeight: "100vh", background: "#080812" }}>
      <style>{STYLES}</style>
      <Navbar />

      {cancelTarget && (
        <CancelModal
          item={cancelTarget}
          onConfirm={handleCancelConfirm}
          onCancel={() => setCancelTarget(null)}
          loading={cancelling}
        />
      )}

      <div style={{ maxWidth: 920, margin: "0 auto", padding: "28px 16px 100px" }}>

        {/* ── Page Header ──────────────────────────────────────────────────── */}
        <div style={{ marginBottom: 30 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
            <button
              onClick={() => navigate(-1)}
              style={{
                background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)",
                borderRadius: 9, padding: "6px 12px", color: "#475569", cursor: "pointer",
                display: "flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 600,
                fontFamily: "'Syne', sans-serif", transition: "all 0.15s",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = "#94a3b8"; e.currentTarget.style.background = "rgba(255,255,255,0.07)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = "#475569"; e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
            >
              <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/>
              </svg>
              Back
            </button>
            <span style={{ color: "#1e293b", fontSize: 10, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", fontFamily: "'JetBrains Mono', monospace" }}>
              Notification Centre
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: 14 }}>
            <div>
              <h1 style={{
                color: "#f1f5f9", fontSize: "clamp(22px, 5vw, 34px)", fontWeight: 800,
                margin: "0 0 5px", letterSpacing: "-0.035em", lineHeight: 1.1,
              }}>
                Upcoming Interactions
              </h1>
              <p style={{ color: "#334155", fontSize: 12.5, margin: 0, fontFamily: "'JetBrains Mono', monospace" }}>
                Next 48 hours · Auto-refreshes every 3 min
              </p>
            </div>

            <button
              onClick={fetchData}
              style={{
                display: "flex", alignItems: "center", gap: 7,
                background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.25)",
                borderRadius: 11, padding: "9px 16px", color: "#818cf8",
                fontSize: 12, fontWeight: 600, cursor: "pointer",
                fontFamily: "'Syne', sans-serif", transition: "all 0.15s",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(99,102,241,0.2)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(99,102,241,0.1)"; }}
            >
              <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
              </svg>
              Refresh
            </button>
          </div>
        </div>

        {/* ── Stat Row ─────────────────────────────────────────────────────── */}
        <div
          className="np-stat-grid"
          style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 24 }}
        >
          {[
            { label: "Total",    value: total,    color: "#6366f1", key: "",         icon: "📋" },
            { label: "Overdue",  value: overdue,  color: "#ef4444", key: "overdue",  icon: "🔴" },
            { label: "< 2h",     value: critical, color: "#f97316", key: "critical", icon: "⚡" },
            { label: "Upcoming", value: safe,     color: "#10b981", key: "upcoming", icon: "🟢" },
          ].map((s) => {
            const active = filterUrgency === s.key || (s.key === "" && !filterUrgency);
            return (
              <div
                key={s.label}
                onClick={() => setFilterUrgency(filterUrgency === s.key ? "" : s.key)}
                style={{
                  background: active ? `${s.color}12` : "#111120",
                  border: `1px solid ${active ? s.color + "45" : "rgba(255,255,255,0.05)"}`,
                  borderRadius: 16, padding: "15px 16px", cursor: "pointer",
                  transition: "all 0.16s",
                  boxShadow: active ? `0 0 0 1px ${s.color}18, 0 8px 28px ${s.color}12` : "none",
                }}
              >
                {loading ? (
                  <div className="np-skeleton" style={{ height: 28, width: "50%", marginBottom: 6 }} />
                ) : (
                  <div style={{
                    color: active ? s.color : "#e2e8f0",
                    fontSize: 28, fontWeight: 800, lineHeight: 1,
                    fontFamily: "'JetBrains Mono', monospace",
                    fontVariantNumeric: "tabular-nums",
                    transition: "color 0.16s",
                  }}>{s.value}</div>
                )}
                <div style={{
                  color: active ? s.color : "#334155",
                  fontSize: 11, fontWeight: 600, marginTop: 5,
                  letterSpacing: "0.03em", transition: "color 0.16s",
                  display: "flex", alignItems: "center", gap: 5,
                }}>
                  <span style={{ fontSize: 10 }}>{s.icon}</span>
                  {s.label}
                </div>
                {active && s.key !== "" && (
                  <div style={{ height: 2, marginTop: 8, background: `linear-gradient(90deg,${s.color},transparent)`, borderRadius: 99 }} />
                )}
              </div>
            );
          })}
        </div>

        {/* ── Filters ──────────────────────────────────────────────────────── */}
        <div style={{
          background: "#111120", border: "1px solid rgba(255,255,255,0.055)",
          borderRadius: 14, padding: "12px 16px", marginBottom: 16,
          display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center",
        }}>
          {/* Search */}
          <div style={{ position: "relative", flex: "1 1 190px", minWidth: 160 }}>
            <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="#334155" strokeWidth={2}
              style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)" }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
            <input
              type="text"
              placeholder="Search centre, contact…"
              value={searchQ}
              onChange={(e) => setSearchQ(e.target.value)}
              style={{
                width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)",
                borderRadius: 9, padding: "7px 10px 7px 28px", color: "#e2e8f0", fontSize: 12,
                outline: "none", boxSizing: "border-box", fontFamily: "'Syne', sans-serif",
              }}
            />
            {searchQ && (
              <button onClick={() => setSearchQ("")} style={{
                position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)",
                background: "none", border: "none", color: "#475569", cursor: "pointer", lineHeight: 1,
              }}>✕</button>
            )}
          </div>

          {/* Mode filter */}
          {modes.map((m) => {
            const meta = MODE_META[m] || { icon: "📋", color: "#6366f1" };
            const on   = filterMode === m;
            return (
              <button key={m} onClick={() => setFilterMode(on ? "" : m)} className="np-filter-chip" style={{
                display: "flex", alignItems: "center", gap: 5,
                padding: "5px 11px", borderRadius: 99, fontSize: 11, fontWeight: 600,
                background: on ? `${meta.color}18` : "rgba(255,255,255,0.03)",
                color: on ? meta.color : "#475569",
                border: `1px solid ${on ? meta.color + "38" : "rgba(255,255,255,0.06)"}`,
                fontFamily: "'Syne', sans-serif",
              }}>
                <span>{meta.icon}</span> {m}
              </button>
            );
          })}

          {/* Type filter */}
          {types.map((t) => {
            const color = TYPE_COLORS[t] || "#6366f1";
            const on    = filterType === t;
            return (
              <button key={t} onClick={() => setFilterType(on ? "" : t)} className="np-filter-chip" style={{
                display: "flex", alignItems: "center", gap: 5,
                padding: "5px 11px", borderRadius: 99, fontSize: 11, fontWeight: 600,
                background: on ? `${color}18` : "rgba(255,255,255,0.03)",
                color: on ? color : "#475569",
                border: `1px solid ${on ? color + "38" : "rgba(255,255,255,0.06)"}`,
                fontFamily: "'Syne', sans-serif",
              }}>
                {t}
              </button>
            );
          })}

          {hasFilters && (
            <button
              onClick={() => { setFilterMode(""); setFilterUrgency(""); setFilterType(""); setSearchQ(""); }}
              style={{
                marginLeft: "auto", background: "none", border: "none",
                color: "#334155", fontSize: 11, fontWeight: 600, cursor: "pointer",
                fontFamily: "'Syne', sans-serif", display: "flex", alignItems: "center", gap: 4,
                transition: "color 0.14s",
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = "#64748b"}
              onMouseLeave={(e) => e.currentTarget.style.color = "#334155"}
            >
              <svg width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
              </svg>
              Clear filters
            </button>
          )}

          <span style={{
            color: "#1e293b", fontSize: 11, fontWeight: 700,
            fontFamily: "'JetBrains Mono', monospace",
            marginLeft: hasFilters ? 0 : "auto",
          }}>
            {loading ? "…" : `${filtered.length} result${filtered.length !== 1 ? "s" : ""}`}
          </span>
        </div>

        {/* ── Content ──────────────────────────────────────────────────────── */}

        {loading && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[1,2,3,4,5].map((i) => <SkeletonCard key={i} />)}
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div style={{
            textAlign: "center", padding: "80px 24px",
            background: "#111120", border: "1px solid rgba(255,255,255,0.04)",
            borderRadius: 22,
          }}>
            <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.4 }}>
              {interactions.length === 0 ? "🎉" : "🔍"}
            </div>
            <p style={{ color: "#334155", fontSize: 15, fontWeight: 700, margin: "0 0 6px" }}>
              {interactions.length === 0 ? "All clear!" : "No results match your filters"}
            </p>
            <p style={{ color: "#1e293b", fontSize: 12, margin: "0 0 20px" }}>
              {interactions.length === 0
                ? "No interactions scheduled in the next 48 hours."
                : "Try adjusting or clearing the filters above."}
            </p>
            {hasFilters && (
              <button
                onClick={() => { setFilterMode(""); setFilterUrgency(""); setFilterType(""); setSearchQ(""); }}
                style={{
                  background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.25)",
                  color: "#818cf8", borderRadius: 11, padding: "9px 20px",
                  fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "'Syne', sans-serif",
                }}
              >
                Clear all filters
              </button>
            )}
          </div>
        )}

        {/* Interaction Cards */}
        {!loading && filtered.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {filtered.map((item, idx) => {
              const tr   = getTimeRemaining(item.nextInteractionDate);
              const mode = MODE_META[item.interactionMode] || { icon: "📋", color: "#6366f1", bg: "rgba(99,102,241,0.12)" };
              const tCol = TYPE_COLORS[item.centreType] || "#6366f1";

              const bCol = tr.overdue
                ? "#ef4444"
                : tr.critical
                  ? "#f97316"
                  : tr.urgent
                    ? "#f59e0b"
                    : "#10b981";

              const cardClass = tr.overdue
                ? "np-card np-card-overdue"
                : tr.critical
                  ? "np-card np-card-critical"
                  : "np-card";

              return (
                <div
                  key={`${item._id}_${item.interactionIndex}_${idx}`}
                  className={cardClass}
                  onClick={(e) => handleGoToAdmin(item, e)}
                  style={{
                    background: tr.overdue
                      ? "linear-gradient(135deg, #120a0a 0%, #111120 100%)"
                      : tr.critical
                        ? "linear-gradient(135deg, #120c08 0%, #111120 100%)"
                        : "#111120",
                    border: `1px solid ${tr.overdue ? "rgba(239,68,68,0.22)" : tr.critical ? "rgba(249,115,22,0.18)" : tr.urgent ? "rgba(245,158,11,0.14)" : "rgba(255,255,255,0.06)"}`,
                    borderLeft: `3px solid ${bCol}`,
                    borderRadius: 20, padding: "18px 20px 16px",
                    animationDelay: `${Math.min(idx * 35, 280)}ms`,
                    position: "relative", overflow: "hidden",
                    cursor: "pointer",
                  }}
                >
                  {/* Ambient glow */}
                  {(tr.overdue || tr.critical) && (
                    <div style={{
                      position: "absolute", top: -40, right: -40,
                      width: 120, height: 120, borderRadius: "50%",
                      background: tr.overdue ? "rgba(239,68,68,0.07)" : "rgba(249,115,22,0.06)",
                      filter: "blur(32px)", pointerEvents: "none",
                    }} />
                  )}

                  <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>

                    {/* Mode icon */}
                    <div style={{
                      width: 48, height: 48, borderRadius: 14, flexShrink: 0,
                      background: mode.bg, border: `1px solid ${mode.color}30`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 20, position: "relative",
                    }}>
                      {mode.icon}
                      {(tr.overdue || tr.critical) && (
                        <span style={{
                          position: "absolute", inset: -3, borderRadius: "inherit",
                          border: `1.5px solid ${bCol}50`,
                          animation: "np-pulse-ring 2.2s ease infinite",
                        }} />
                      )}
                    </div>

                    {/* Main content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      {/* Top row */}
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 5 }}>
                        <span style={{
                          color: "#f1f5f9", fontSize: 14.5, fontWeight: 700,
                          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                          maxWidth: "calc(100% - 110px)", letterSpacing: "-0.01em",
                        }}>
                          {item.centreName}
                        </span>
                        <span style={{
                          fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 99,
                          background: `${tCol}15`, color: tCol, border: `1px solid ${tCol}25`,
                          flexShrink: 0, letterSpacing: "0.02em",
                        }}>
                          {item.centreType}
                        </span>
                      </div>

                      {/* Sub info */}
                      <p style={{ color: "#475569", fontSize: 11.5, margin: "0 0 11px" }}>
                        {mode.icon} {item.interactionMode}
                        {item.interactedWith && (
                          <> · with <strong style={{ color: "#64748b" }}>{item.interactedWith}</strong></>
                        )}
                        {item.interactionBy && (
                          <> · by <strong style={{ color: "#64748b" }}>{item.interactionBy}</strong></>
                        )}
                      </p>

                      {/* Time + Date row */}
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                        {/* Urgency badge */}
                        <span style={{
                          fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 8,
                          background: tr.overdue
                            ? "rgba(239,68,68,0.16)"
                            : tr.critical
                              ? "rgba(249,115,22,0.14)"
                              : tr.urgent
                                ? "rgba(245,158,11,0.12)"
                                : "rgba(16,185,129,0.1)",
                          color: bCol,
                          fontFamily: "'JetBrains Mono', monospace",
                          display: "flex", alignItems: "center", gap: 4,
                        }}>
                          {(tr.overdue || tr.critical) && (
                            <span style={{
                              width: 5, height: 5, borderRadius: "50%",
                              background: bCol, display: "inline-block",
                              boxShadow: `0 0 6px ${bCol}`,
                            }} />
                          )}
                          {tr.label}
                        </span>

                        <span style={{
                          color: "#2d3748", fontSize: 11,
                          fontFamily: "'JetBrains Mono', monospace",
                        }}>
                          {formatDateTime(item.nextInteractionDate)}
                        </span>
                      </div>

                      {/* Progress bar */}
                      <TimeProgress pct={tr.pct} color={bCol} overdue={tr.overdue} />
                    </div>

                    {/* Actions */}
                    <div
                      className="np-card-actions"
                      style={{ display: "flex", flexDirection: "column", gap: 7, flexShrink: 0 }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={(e) => handleGoToAdmin(item, e)}
                        title="View in Admin"
                        className="np-go-btn"
                        style={{
                          display: "flex", alignItems: "center", gap: 5,
                          background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.25)",
                          borderRadius: 9, padding: "6px 11px", color: "#818cf8",
                          fontSize: 11, fontWeight: 700, cursor: "pointer",
                          fontFamily: "'Syne', sans-serif",
                        }}
                      >
                        View
                        <svg width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6"/>
                        </svg>
                      </button>

                      <button
                        onClick={(e) => { e.stopPropagation(); setCancelTarget(item); }}
                        title="Cancel interaction"
                        className="np-cancel-btn"
                        style={{
                          display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
                          background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.2)",
                          borderRadius: 9, padding: "6px 11px", color: "#f87171",
                          fontSize: 11, fontWeight: 700,
                          fontFamily: "'Syne', sans-serif",
                        }}
                      >
                        <svg width="9" height="9" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
                        </svg>
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Footer note */}
        {!loading && total > 0 && (
          <p style={{
            textAlign: "center", color: "#1a1a2e", fontSize: 11, marginTop: 28,
            fontFamily: "'JetBrains Mono', monospace",
          }}>
            Showing interactions scheduled within the next 48 hours · {total} total
          </p>
        )}
      </div>
    </div>
  );
}
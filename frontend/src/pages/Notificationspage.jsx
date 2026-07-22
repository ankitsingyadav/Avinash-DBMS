// ─── pages/Notificationspage.jsx ─────────────────────────────────────────────
import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import axios from "../utils/axios.js";
import Navbar from "../components/Navbar";
import {
  loadCancelledKeys,
  addCancelledKey,
  isCancelled,
  getSoonestPerOrg,
} from "../utils/notificationUtils.js";

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
      label:    h > 0 ? `${h}h ${m}m overdue` : `${m}m overdue`,
      urgent:   true,
      overdue:  true,
      critical: false,
      pct:      0,
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
  Email:    { icon: "✉️",  color: "#4f46e5", bg: "rgba(79,70,229,0.08)"   },
  Phone:    { icon: "📞",  color: "#0891b2", bg: "rgba(8,145,178,0.08)"   },
  WhatsApp: { icon: "💬",  color: "#16a34a", bg: "rgba(22,163,74,0.08)"   },
  Visit:    { icon: "🏢",  color: "#d97706", bg: "rgba(217,119,6,0.08)"   },
};

const TYPE_COLORS = {
  School:             "#0891b2",
  College:            "#7c3aed",
  NGO:                "#059669",
  Corporate:          "#d97706",
  Online:             "#4f46e5",
  "Community Centre": "#db2777",
};

// ── CSS ───────────────────────────────────────────────────────────────────────
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap');

  .np-root { font-family: 'Syne', sans-serif; background: #f0f6ff; }

  @keyframes np-fadeUp {
    from { opacity: 0; transform: translateY(14px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes np-pulse-ring {
    0%,100% { transform: scale(1); opacity: 0.5; }
    50%      { transform: scale(1.65); opacity: 0; }
  }
  @keyframes np-spin { to { transform: rotate(360deg); } }
  @keyframes np-shimmer {
    from { background-position: -200% 0; }
    to   { background-position:  200% 0; }
  }

  .np-card {
    animation: np-fadeUp 0.32s ease both;
    transition: transform 0.22s cubic-bezier(.22,1,.36,1), box-shadow 0.22s, border-color 0.22s;
  }
  .np-card:hover {
    transform: translateY(-3px) scale(1.004);
    box-shadow: 0 12px 36px rgba(30,100,200,0.10);
  }

  .np-skeleton {
    background: linear-gradient(90deg,
      #e2edf8 25%,
      #cfe0f2 50%,
      #e2edf8 75%
    );
    background-size: 200% 100%;
    animation: np-shimmer 1.5s ease infinite;
    border-radius: 8px;
  }

  .np-scroll::-webkit-scrollbar { width: 3px; }
  .np-scroll::-webkit-scrollbar-track { background: transparent; }
  .np-scroll::-webkit-scrollbar-thumb { background: rgba(79,130,230,0.25); border-radius: 99px; }

  .np-cancel-btn {
    transition: all 0.15s;
    cursor: pointer;
  }
  .np-cancel-btn:hover {
    background: rgba(21,128,61,0.12) !important;
    border-color: rgba(21,128,61,0.45) !important;
    transform: scale(1.04);
  }

  .np-reschedule-btn {
    transition: all 0.15s;
    cursor: pointer;
  }
  .np-reschedule-btn:hover {
    background: rgba(109,40,217,0.12) !important;
    border-color: rgba(109,40,217,0.45) !important;
    transform: scale(1.04);
  }

  .np-filter-chip {
    transition: all 0.14s;
    cursor: pointer;
    user-select: none;
  }
  .np-filter-chip:hover { opacity: 0.75; }

  .np-go-btn {
    transition: all 0.14s cubic-bezier(.22,1,.36,1);
  }
  .np-go-btn:hover {
    transform: translateX(3px);
    opacity: 0.85;
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
      rgba(255,255,255,0.25) 8px, rgba(255,255,255,0.25) 16px
    );
    background-size: 40px 100%;
    border-radius: 99px;
  }

  @media (max-width: 640px) {
    .np-stat-grid { grid-template-columns: repeat(2,1fr) !important; }
    .np-card-actions { flex-direction: column !important; }
  }
`;

// ── Mark Done Modal ───────────────────────────────────────────────────────────
function CancelModal({ item, onConfirm, onCancel, loading }) {
  const mode = MODE_META[item.interactionMode] || { icon: "📋", color: "#4f46e5" };
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9999,
      background: "rgba(15,42,74,0.55)", backdropFilter: "blur(10px)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
    }}>
      <div style={{
        background: "#ffffff",
        border: "1px solid #a7f3d0",
        borderRadius: 22, padding: 32, maxWidth: 400, width: "100%",
        boxShadow: "0 32px 80px rgba(30,60,120,0.18)",
        animation: "np-fadeUp 0.22s ease",
      }}>
        <div style={{
          width: 54, height: 54, borderRadius: 16,
          background: "#f0fdf4", border: "1px solid #a7f3d0",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 24, marginBottom: 20,
        }}>✅</div>

        <p style={{ color: "#0f2a4a", fontSize: 18, fontWeight: 800, margin: "0 0 6px", letterSpacing: "-0.03em" }}>
          Mark as Done?
        </p>
        <p style={{ color: "#7a9ec0", fontSize: 13, margin: "0 0 22px", lineHeight: 1.65 }}>
          This marks the interaction as completed and removes it from upcoming notifications. All interaction history is preserved.
        </p>

        <div style={{
          padding: "13px 15px", borderRadius: 13, marginBottom: 24,
          background: "#f5f9ff", border: "1px solid #cce0f5",
        }}>
          <p style={{ color: "#0f2a4a", fontSize: 13.5, fontWeight: 700, margin: "0 0 4px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {item.centreName}
          </p>
          <p style={{ color: "#7a9ec0", fontSize: 11.5, margin: 0 }}>
            {mode.icon} {item.interactionMode} · {formatDateTime(item.nextInteractionDate)}
          </p>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={onCancel}
            disabled={loading}
            style={{
              flex: 1, padding: "12px", borderRadius: 12,
              background: "#f5f9ff", border: "1px solid #cce0f5",
              color: "#7a9ec0", fontSize: 13, fontWeight: 600, cursor: "pointer",
              fontFamily: "'Syne', sans-serif", transition: "all 0.15s",
            }}
          >
            Not yet
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            style={{
              flex: 1, padding: "12px", borderRadius: 12,
              background: loading ? "#f0fdf4" : "#dcfce7",
              border: "1px solid #a7f3d0",
              color: "#15803d", fontSize: 13, fontWeight: 700,
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
                  border: "2px solid rgba(21,128,61,0.25)", borderTopColor: "#15803d",
                  borderRadius: "50%", animation: "np-spin 0.7s linear infinite", display: "inline-block",
                }} />
                Marking…
              </>
            ) : "Mark Done"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Reschedule Modal (edit next interaction: date / mode / notes) ────────────
function RescheduleModal({ item, onConfirm, onCancel, loading }) {
  const [date, setDate] = useState(
    item?.nextInteractionDate
      ? new Date(item.nextInteractionDate).toISOString().split("T")[0]
      : ""
  );
  const [mode, setMode]   = useState(item?.interactionMode || "");
  const [notes, setNotes] = useState(item?.nextNotes || "");
  const [error, setError] = useState("");

  if (!item) return null;

  const handleConfirm = () => {
    if (!date) { setError("Please pick a date."); return; }
    if (!mode) { setError("Please select a mode."); return; }
    setError("");
    onConfirm({ nextInteractionDate: date, interactionMode: mode, nextNotes: notes.trim() });
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9999,
      background: "rgba(15,42,74,0.55)", backdropFilter: "blur(10px)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
    }}>
      <div style={{
        background: "#ffffff",
        border: "1px solid #bfdbfe",
        borderRadius: 22, padding: 32, maxWidth: 420, width: "100%",
        boxShadow: "0 32px 80px rgba(30,60,120,0.18)",
        animation: "np-fadeUp 0.22s ease",
      }}>
        <div style={{
          width: 54, height: 54, borderRadius: 16,
          background: "#eff6ff", border: "1px solid #bfdbfe",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 24, marginBottom: 20,
        }}>🔄</div>

        <p style={{ color: "#0f2a4a", fontSize: 18, fontWeight: 800, margin: "0 0 6px", letterSpacing: "-0.03em" }}>
          Reschedule Interaction
        </p>
        <p style={{ color: "#7a9ec0", fontSize: 13, margin: "0 0 20px", lineHeight: 1.65 }}>
          Update the planned date, mode, and notes. This edits the existing entry — it won't create a new interaction or change the interaction count.
        </p>

        <div style={{
          padding: "11px 14px", borderRadius: 12, marginBottom: 20,
          background: "#f5f9ff", border: "1px solid #cce0f5",
        }}>
          <p style={{ color: "#0f2a4a", fontSize: 13, fontWeight: 700, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {item.centreName}
          </p>
        </div>

        {/* Date */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 11, fontWeight: 700, color: "#5a85aa", textTransform: "uppercase", letterSpacing: "0.04em", display: "block", marginBottom: 6 }}>
            Next Interaction Date
          </label>
          <input
            type="date"
            value={date}
            min={new Date().toISOString().split("T")[0]}
            onChange={(e) => setDate(e.target.value)}
            style={{
              width: "100%", background: "#f5f9ff", border: "1px solid #cce0f5",
              borderRadius: 10, padding: "9px 11px", color: "#0f2a4a", fontSize: 13,
              outline: "none", boxSizing: "border-box", fontFamily: "'Syne', sans-serif",
              colorScheme: "light",
            }}
          />
        </div>

        {/* Mode */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 11, fontWeight: 700, color: "#5a85aa", textTransform: "uppercase", letterSpacing: "0.04em", display: "block", marginBottom: 6 }}>
            Interaction Mode
          </label>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 7 }}>
            {["Email", "Phone", "WhatsApp", "Visit"].map((m) => {
              const meta   = MODE_META[m] || {};
              const active = mode === m;
              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMode(m)}
                  style={{
                    display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
                    padding: "8px 4px", borderRadius: 10, cursor: "pointer",
                    border: `1px solid ${active ? (meta.color || "#4f46e5") + "60" : "#cce0f5"}`,
                    background: active ? (meta.bg || "#eef2ff") : "#f5f9ff",
                    color: active ? (meta.color || "#4f46e5") : "#5a85aa",
                    fontSize: 10.5, fontWeight: 700,
                    fontFamily: "'Syne', sans-serif", transition: "all 0.14s",
                  }}
                >
                  <span style={{ fontSize: 15 }}>{meta.icon}</span>
                  {m}
                </button>
              );
            })}
          </div>
        </div>

        {/* Notes */}
        <div style={{ marginBottom: error ? 10 : 22 }}>
          <label style={{ fontSize: 11, fontWeight: 700, color: "#5a85aa", textTransform: "uppercase", letterSpacing: "0.04em", display: "block", marginBottom: 6 }}>
            Notes
          </label>
          <textarea
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any notes for the next interaction..."
            style={{
              width: "100%", background: "#f5f9ff", border: "1px solid #cce0f5",
              borderRadius: 10, padding: "9px 11px", color: "#0f2a4a", fontSize: 13,
              outline: "none", boxSizing: "border-box", fontFamily: "'Syne', sans-serif",
              resize: "none",
            }}
          />
        </div>

        {error && (
          <p style={{ color: "#dc2626", fontSize: 12, margin: "0 0 14px", fontWeight: 600 }}>{error}</p>
        )}

        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={onCancel}
            disabled={loading}
            style={{
              flex: 1, padding: "12px", borderRadius: 12,
              background: "#f5f9ff", border: "1px solid #cce0f5",
              color: "#7a9ec0", fontSize: 13, fontWeight: 600, cursor: "pointer",
              fontFamily: "'Syne', sans-serif",
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            style={{
              flex: 1, padding: "12px", borderRadius: 12,
              background: loading ? "#eff6ff" : "#dbeafe",
              border: "1px solid #bfdbfe",
              color: "#1d4ed8", fontSize: 13, fontWeight: 700,
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.6 : 1,
              fontFamily: "'Syne', sans-serif",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            }}
          >
            {loading ? (
              <>
                <span style={{
                  width: 13, height: 13,
                  border: "2px solid rgba(29,78,216,0.25)", borderTopColor: "#1d4ed8",
                  borderRadius: "50%", animation: "np-spin 0.7s linear infinite", display: "inline-block",
                }} />
                Updating…
              </>
            ) : "Update"}
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
      background: "#ffffff", border: "1px solid #cce0f5",
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
      height: 3, width: "100%", background: "#ddeefa",
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
              : `linear-gradient(90deg,${color},${color}88)`,
          borderRadius: 99,
          transition: "width 0.5s ease",
        }}
      />
    </div>
  );
}


// ── Main Page ─────────────────────────────────────────────────────────────────
export default function Notificationspage() {

  const navigate = useNavigate();

  const [interactions, setInteractions] = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelling,   setCancelling]   = useState(false);

  // Reschedule (edit next interaction — date/mode/notes) state
  const [rescheduleTarget, setRescheduleTarget] = useState(null);
  const [rescheduling,     setRescheduling]     = useState(false);

  const lastFetchRef = useRef(0);
  const tickRef      = useRef(null);

  // Filters
  const [filterMode,    setFilterMode]    = useState("");
  const [filterUrgency, setFilterUrgency] = useState("");
  const [filterType,    setFilterType]    = useState("");
  const [searchQ,       setSearchQ]       = useState("");

  // ── Fetch — localStorage se cancelled interactions padhkar filter karo ───────
  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res        = await axios.get("/organisations/upcoming-interactions");
      const list       = res.data?.interactions || [];
      const cancelled  = loadCancelledKeys();
      const filtered   = cancelled.size > 0
        ? list.filter((i) => !isCancelled(i, cancelled))
        : list;
      setInteractions(filtered);
      lastFetchRef.current = Date.now();
    } catch {
      setInteractions([]);
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const ref = setInterval(() => fetchData(true), 3 * 60 * 1000);
    return () => clearInterval(ref);
  }, [fetchData]);

  useEffect(() => {
    const handle = () => {
      if (document.visibilityState === "visible" && Date.now() - lastFetchRef.current > 5000)
        fetchData(true);
    };
    document.addEventListener("visibilitychange", handle);
    return () => document.removeEventListener("visibilitychange", handle);
  }, [fetchData]);

  useEffect(() => {
    const handle = () => fetchData(true);
    window.addEventListener("interaction-saved", handle);
    return () => window.removeEventListener("interaction-saved", handle);
  }, [fetchData]);

  // Countdown re-render every 30s to keep time labels fresh
  useEffect(() => {
    tickRef.current = setInterval(() => setFilterMode((m) => m), 30 * 1000);
    return () => clearInterval(tickRef.current);
  }, []);

  // ── Mark Done — removes only the specific interaction from notifications ─────
  const handleCancelConfirm = async () => {
    if (!cancelTarget) return;
    setCancelling(true);

    const removedId    = String(cancelTarget._id);
    const removedIndex = cancelTarget.interactionIndex;

    // 1. Persist to localStorage (cross-tab) before optimistic UI update
    addCancelledKey(removedId, removedIndex);

    // 2. Remove only the specific interaction entry from state
    setInteractions((prev) =>
      prev.filter((i) => !(String(i._id) === removedId && i.interactionIndex === removedIndex))
    );

    setCancelTarget(null);
    setCancelling(false);

    // 3. API call — rollback + toast on failure
    try {
      await axios.post(`/organisations/${removedId}/interactions/cancel`, {
        interactionIndex: removedIndex,
      });
      toast.success("Interaction marked as done.");
      // Notify NotificationBell to refresh its count
      window.dispatchEvent(new CustomEvent("interaction-saved"));
    } catch {
      toast.error("Could not mark as done. Please try again.");
      fetchData(true); // restore correct state from server
    }
  };

  // ── Reschedule — edits the SAME interaction entry (date/mode/notes only).
  //    No new interaction is pushed, so interactionCount stays exactly as-is. ───
  const handleRescheduleConfirm = async (formData) => {
    if (!rescheduleTarget) return;
    setRescheduling(true);

    const orgId  = String(rescheduleTarget._id);
    const idx    = rescheduleTarget.interactionIndex;

    try {
      await axios.patch(`/organisations/${orgId}/interactions/next`, {
        interactionIndex:    idx,
        nextInteractionDate: formData.nextInteractionDate,
        interactionMode:     formData.interactionMode,
        nextNotes:           formData.nextNotes,
      });

      // Update the same entry in place — nothing added, nothing removed
      setInteractions((prev) =>
        prev.map((i) =>
          String(i._id) === orgId && i.interactionIndex === idx
            ? {
                ...i,
                nextInteractionDate: formData.nextInteractionDate,
                interactionMode:     formData.interactionMode,
                nextNotes:           formData.nextNotes,
              }
            : i
        )
      );

      toast.success("Interaction rescheduled successfully.");
      setRescheduleTarget(null);
      // Notify NotificationBell / other tabs to refresh
      window.dispatchEvent(new CustomEvent("interaction-saved"));
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not reschedule. Please try again.");
    } finally {
      setRescheduling(false);
    }
  };

  // ── Navigate ────────────────────────────────────────────────────────────────
  const handleGoToAdmin = (item, e) => {
    if (e) e.stopPropagation();
    navigate(`/admin?tab=organisation&highlight=${item._id}&filter=upcoming`);
  };

  // ── Filter logic ─────────────────────────────────────────────────────────────
  const filtered = interactions.filter((item) => {
    const tr = getTimeRemaining(item.nextInteractionDate);
    if (filterUrgency === "overdue"  && !tr.overdue)                              return false;
    if (filterUrgency === "critical" && (!tr.critical || tr.overdue))             return false;
    if (filterUrgency === "urgent"   && (!tr.urgent || tr.overdue || tr.critical)) return false;
    // "on-track" = not overdue, not critical, not urgent (>12h)
    if (filterUrgency === "on-track" && tr.urgent)                                return false;
    if (filterMode && item.interactionMode !== filterMode)                        return false;
    if (filterType && item.centreType     !== filterType)                         return false;
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

  // Pick soonest per org (not latest) so most urgent shows first
  const displayList = getSoonestPerOrg(filtered);

  // Stats — computed from soonest-per-org deduplicated list
  const allOrgs  = getSoonestPerOrg(interactions);
  const total    = allOrgs.length;
  const overdue  = allOrgs.filter((i) => getTimeRemaining(i.nextInteractionDate).overdue).length;
  const critical = allOrgs.filter((i) => { const t = getTimeRemaining(i.nextInteractionDate); return t.critical && !t.overdue; }).length;
  const urgent   = allOrgs.filter((i) => { const t = getTimeRemaining(i.nextInteractionDate); return t.urgent && !t.overdue && !t.critical; }).length;
  const onTrack  = total - overdue - critical - urgent;

  const modes     = [...new Set(interactions.map((i) => i.interactionMode).filter(Boolean))];
  const types     = [...new Set(interactions.map((i) => i.centreType).filter(Boolean))];
  const hasFilters = filterMode || filterUrgency || filterType || searchQ;

  return (
    <div className="np-root" style={{ minHeight: "100vh", background: "#f0f6ff" }}>
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

      {rescheduleTarget && (
        <RescheduleModal
          item={rescheduleTarget}
          onConfirm={handleRescheduleConfirm}
          onCancel={() => setRescheduleTarget(null)}
          loading={rescheduling}
        />
      )}

      <div style={{ maxWidth: 920, margin: "0 auto", padding: "28px 16px 100px" }}>

        {/* ── Page Header ──────────────────────────────────────────────────── */}
        <div style={{ marginBottom: 30 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
            <button
              onClick={() => navigate(-1)}
              style={{
                background: "#ffffff", border: "1px solid #cce0f5",
                borderRadius: 9, padding: "6px 12px", color: "#5a85aa", cursor: "pointer",
                display: "flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 600,
                fontFamily: "'Syne', sans-serif", transition: "all 0.15s",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = "#2464b0"; e.currentTarget.style.background = "#e8f2ff"; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = "#5a85aa"; e.currentTarget.style.background = "#ffffff"; }}
            >
              <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/>
              </svg>
              Back
            </button>
            <span style={{ color: "#64a0cc", fontSize: 10, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", fontFamily: "'JetBrains Mono', monospace" }}>
              Notification Centre
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: 14 }}>
            <div>
              <h1 style={{
                color: "#0f2a4a", fontSize: "clamp(22px, 5vw, 34px)", fontWeight: 800,
                margin: "0 0 5px", letterSpacing: "-0.035em", lineHeight: 1.1,
              }}>
                Upcoming Interactions
              </h1>
              <p style={{ color: "#7ba8cc", fontSize: 12.5, margin: 0, fontFamily: "'JetBrains Mono', monospace" }}>
                Latest per organisation · Auto-refreshes every 3 min
              </p>
            </div>

            <button
              onClick={() => fetchData()}
              style={{
                display: "flex", alignItems: "center", gap: 7,
                background: "#e8f2ff", border: "1px solid #b0d0f0",
                borderRadius: 11, padding: "9px 16px", color: "#2970b8",
                fontSize: 12, fontWeight: 600, cursor: "pointer",
                fontFamily: "'Syne', sans-serif", transition: "all 0.15s",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "#d4e9ff"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "#e8f2ff"; }}
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
            { label: "Total",    value: total,    color: "#4060cc", key: "",         icon: "📋" },
            { label: "Overdue",  value: overdue,  color: "#dc2626", key: "overdue",  icon: "🔴" },
            { label: "< 2h",     value: critical, color: "#c2410c", key: "critical", icon: "⚡" },
            { label: "On Track", value: onTrack,  color: "#065f46", key: "on-track", icon: "🟢" },
          ].map((s) => {
            const active = filterUrgency === s.key || (s.key === "" && !filterUrgency);
            return (
              <div
                key={s.label}
                onClick={() => setFilterUrgency(filterUrgency === s.key ? "" : s.key)}
                style={{
                  background: active ? `${s.color}10` : "#ffffff",
                  border: `1px solid ${active ? s.color + "50" : "#cce0f5"}`,
                  borderRadius: 16, padding: "15px 16px", cursor: "pointer",
                  transition: "all 0.16s",
                  boxShadow: active ? `0 0 0 1px ${s.color}14, 0 6px 20px ${s.color}10` : "none",
                }}
              >
                {loading ? (
                  <div className="np-skeleton" style={{ height: 28, width: "50%", marginBottom: 6 }} />
                ) : (
                  <div style={{
                    color: active ? s.color : "#0f2a4a",
                    fontSize: 28, fontWeight: 800, lineHeight: 1,
                    fontFamily: "'JetBrains Mono', monospace",
                    fontVariantNumeric: "tabular-nums",
                    transition: "color 0.16s",
                  }}>{s.value}</div>
                )}
                <div style={{
                  color: active ? s.color : "#7a9ec0",
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
          background: "#ffffff", border: "1px solid #cce0f5",
          borderRadius: 14, padding: "12px 16px", marginBottom: 16,
          display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center",
        }}>
          {/* Search */}
          <div style={{ position: "relative", flex: "1 1 190px", minWidth: 160 }}>
            <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="#9bbcd4" strokeWidth={2}
              style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)" }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
            <input
              type="text"
              placeholder="Search centre, contact…"
              value={searchQ}
              onChange={(e) => setSearchQ(e.target.value)}
              style={{
                width: "100%", background: "#f5f9ff", border: "1px solid #cce0f5",
                borderRadius: 9, padding: "7px 10px 7px 28px", color: "#1a3a5c", fontSize: 12,
                outline: "none", boxSizing: "border-box", fontFamily: "'Syne', sans-serif",
              }}
            />
            {searchQ && (
              <button onClick={() => setSearchQ("")} style={{
                position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)",
                background: "none", border: "none", color: "#9bbcd4", cursor: "pointer", lineHeight: 1,
              }}>✕</button>
            )}
          </div>

          {/* Mode filter */}
          {modes.map((m) => {
            const meta = MODE_META[m] || { icon: "📋", color: "#4f46e5" };
            const on   = filterMode === m;
            return (
              <button key={m} onClick={() => setFilterMode(on ? "" : m)} className="np-filter-chip" style={{
                display: "flex", alignItems: "center", gap: 5,
                padding: "5px 11px", borderRadius: 99, fontSize: 11, fontWeight: 600,
                background: on ? `${meta.color}12` : "#f0f6ff",
                color: on ? meta.color : "#4a7090",
                border: `1px solid ${on ? meta.color + "45" : "#cce0f5"}`,
                fontFamily: "'Syne', sans-serif",
              }}>
                <span>{meta.icon}</span> {m}
              </button>
            );
          })}

          {/* Type filter */}
          {types.map((t) => {
            const color = TYPE_COLORS[t] || "#4f46e5";
            const on    = filterType === t;
            return (
              <button key={t} onClick={() => setFilterType(on ? "" : t)} className="np-filter-chip" style={{
                display: "flex", alignItems: "center", gap: 5,
                padding: "5px 11px", borderRadius: 99, fontSize: 11, fontWeight: 600,
                background: on ? `${color}12` : "#f0f6ff",
                color: on ? color : "#4a7090",
                border: `1px solid ${on ? color + "45" : "#cce0f5"}`,
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
                color: "#9bbcd4", fontSize: 11, fontWeight: 600, cursor: "pointer",
                fontFamily: "'Syne', sans-serif", display: "flex", alignItems: "center", gap: 4,
                transition: "color 0.14s",
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = "#5a85aa"}
              onMouseLeave={(e) => e.currentTarget.style.color = "#9bbcd4"}
            >
              <svg width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
              </svg>
              Clear filters
            </button>
          )}

          <span style={{
            color: "#9bbcd4", fontSize: 11, fontWeight: 700,
            fontFamily: "'JetBrains Mono', monospace",
            marginLeft: hasFilters ? 0 : "auto",
          }}>
            {loading ? "…" : `${displayList.length} organisation${displayList.length !== 1 ? "s" : ""}`}
          </span>
        </div>

        {/* ── Content ──────────────────────────────────────────────────────── */}

        {loading && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        )}

        {!loading && displayList.length === 0 && (
          <div style={{
            textAlign: "center", padding: "80px 24px",
            background: "#ffffff", border: "1px solid #cce0f5",
            borderRadius: 22,
          }}>
            <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.5 }}>
              {interactions.length === 0 ? "🎉" : "🔍"}
            </div>
            <p style={{ color: "#0f2a4a", fontSize: 15, fontWeight: 700, margin: "0 0 6px" }}>
              {interactions.length === 0 ? "All clear!" : "No results match your filters"}
            </p>
            <p style={{ color: "#7a9ec0", fontSize: 12, margin: "0 0 20px" }}>
              {interactions.length === 0
                ? "No interactions scheduled in the next 48 hours."
                : "Try adjusting or clearing the filters above."}
            </p>
            {hasFilters && (
              <button
                onClick={() => { setFilterMode(""); setFilterUrgency(""); setFilterType(""); setSearchQ(""); }}
                style={{
                  background: "#e8f2ff", border: "1px solid #b0d0f0",
                  color: "#2970b8", borderRadius: 11, padding: "9px 20px",
                  fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "'Syne', sans-serif",
                }}
              >
                Clear all filters
              </button>
            )}
          </div>
        )}

        {/* Interaction Cards — one per organisation */}
        {!loading && displayList.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {displayList.map((item, idx) => {
              const tr   = getTimeRemaining(item.nextInteractionDate);
              const mode = MODE_META[item.interactionMode] || { icon: "📋", color: "#4f46e5", bg: "rgba(79,70,229,0.08)" };
              const tCol = TYPE_COLORS[item.centreType] || "#4f46e5";

              const bCol = tr.overdue
                ? "#ef4444"
                : tr.critical
                  ? "#f97316"
                  : tr.urgent
                    ? "#f59e0b"
                    : "#10b981";

              const cardBg = tr.overdue
                ? "#fff8f8"
                : tr.critical
                  ? "#fffaf5"
                  : "#ffffff";

              const cardBorderColor = tr.overdue
                ? "#fca5a5"
                : tr.critical
                  ? "#fed7aa"
                  : tr.urgent
                    ? "#fde68a"
                    : "#cce0f5";

              return (
                <div
                  key={`${item._id}_${item.interactionIndex}_${idx}`}
                  className="np-card"
                  onClick={(e) => handleGoToAdmin(item, e)}
                  style={{
                    background: cardBg,
                    border: `1px solid ${cardBorderColor}`,
                    borderLeft: `3px solid ${bCol}`,
                    borderRadius: 20, padding: "18px 20px 16px",
                    animationDelay: `${idx * 40}ms`,
                    position: "relative", overflow: "hidden",
                    cursor: "pointer",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>

                    {/* Mode icon */}
                    <div style={{
                      width: 48, height: 48, borderRadius: 14, flexShrink: 0,
                      background: mode.bg, border: `1px solid ${mode.color}25`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 20, position: "relative",
                    }}>
                      {mode.icon}
                      {(tr.overdue || tr.critical) && (
                        <span style={{
                          position: "absolute", inset: -3, borderRadius: "inherit",
                          border: `1.5px solid ${bCol}45`,
                          animation: "np-pulse-ring 2.2s ease infinite",
                        }} />
                      )}
                    </div>

                    {/* Main content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      {/* Top row */}
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 5 }}>
                        <span style={{
                          color: "#0f2a4a", fontSize: 14.5, fontWeight: 700,
                          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                          maxWidth: "calc(100% - 110px)", letterSpacing: "-0.01em",
                        }}>
                          {item.centreName}
                        </span>
                        <span style={{
                          fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 99,
                          background: `${tCol}14`, color: tCol, border: `1px solid ${tCol}28`,
                          flexShrink: 0, letterSpacing: "0.02em",
                        }}>
                          {item.centreType}
                        </span>
                      </div>

                      {/* Sub info */}
                      <p style={{ color: "#7a9ec0", fontSize: 11.5, margin: "0 0 7px" }}>
                        {mode.icon} {item.interactionMode}
                        {item.interactedWith && (
                          <> · with <strong style={{ color: "#4a7090" }}>{item.interactedWith}</strong></>
                        )}
                        {item.interactionBy && (
                          <> · by <strong style={{ color: "#4a7090" }}>{item.interactionBy}</strong></>
                        )}
                      </p>

                      {/* Status badge + next notes */}
                      <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginBottom: 9 }}>
                        {item.interactionStatus && (() => {
                          const STATUS_COLORS_MAP = {
                            Initiated: { color: "#7c3aed", bg: "rgba(124,58,237,0.10)" },
                            Pending:   { color: "#d97706", bg: "rgba(217,119,6,0.10)" },
                            Progressive: { color: "#2563eb", bg: "rgba(37,99,235,0.10)" },
                            Active:    { color: "#059669", bg: "rgba(5,150,105,0.10)" },
                            Inactive:  { color: "#64748b", bg: "rgba(100,116,139,0.10)" },
                          };
                          const sc = STATUS_COLORS_MAP[item.interactionStatus] || { color: "#64748b", bg: "rgba(100,116,139,0.10)" };
                          return (
                            <span style={{
                              fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 99,
                              background: sc.bg, color: sc.color,
                              letterSpacing: "0.03em", textTransform: "uppercase",
                            }}>
                              {item.interactionStatus}
                            </span>
                          );
                        })()}
                        {item.nextNotes && (
                          <span style={{
                            fontSize: 11, color: "#7a9ec0", fontStyle: "italic",
                            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                            maxWidth: 180,
                          }}>
                            "{item.nextNotes}"
                          </span>
                        )}
                      </div>

                      {/* Time + Date row */}
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                        <span style={{
                          fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 8,
                          background: tr.overdue
                            ? "rgba(239,68,68,0.10)"
                            : tr.critical
                              ? "rgba(249,115,22,0.10)"
                              : tr.urgent
                                ? "rgba(245,158,11,0.10)"
                                : "rgba(16,185,129,0.10)",
                          color: bCol,
                          fontFamily: "'JetBrains Mono', monospace",
                          display: "flex", alignItems: "center", gap: 4,
                        }}>
                          {(tr.overdue || tr.critical) && (
                            <span style={{
                              width: 5, height: 5, borderRadius: "50%",
                              background: bCol, display: "inline-block",
                            }} />
                          )}
                          {tr.label}
                        </span>

                        <span style={{
                          color: "#9bbcd4", fontSize: 11,
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
                          background: "#e8f0ff", border: "1px solid #a0c0ea",
                          borderRadius: 9, padding: "6px 11px", color: "#2464b0",
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
                        onClick={(e) => { e.stopPropagation(); setRescheduleTarget(item); }}
                        title="Reschedule next interaction (date / mode / notes)"
                        className="np-reschedule-btn"
                        style={{
                          display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
                          background: "#f5f3ff", border: "1px solid #ddd6fe",
                          borderRadius: 9, padding: "6px 11px", color: "#6d28d9",
                          fontSize: 11, fontWeight: 700,
                          fontFamily: "'Syne', sans-serif",
                        }}
                      >
                        <svg width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"/>
                        </svg>
                        Reschedule
                      </button>

                      <button
                        onClick={(e) => { e.stopPropagation(); setCancelTarget(item); }}
                        title="Mark interaction as done"
                        className="np-cancel-btn"
                        style={{
                          display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
                          background: "#f0fdf4", border: "1px solid #a7f3d0",
                          borderRadius: 9, padding: "6px 11px", color: "#15803d",
                          fontSize: 11, fontWeight: 700,
                          fontFamily: "'Syne', sans-serif",
                        }}
                      >
                        <svg width="9" height="9" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
                        </svg>
                        Mark Done
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
            textAlign: "center", color: "#a0c0d8", fontSize: 11, marginTop: 28,
            fontFamily: "'JetBrains Mono', monospace",
          }}>
            {displayList.length} organisation{displayList.length !== 1 ? "s" : ""} · {total} total interactions in next 48h
          </p>
        )}
      </div>
    </div>
  );
}
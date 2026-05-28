import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../utils/axios.js";

// ── sessionStorage helpers — Notificationspage ke saath shared ────────────────
const SS_KEY = "np_cancelled_orgs";

const loadCancelledOrgs = () => {
  try {
    return new Set(JSON.parse(sessionStorage.getItem(SS_KEY) || "[]"));
  } catch {
    return new Set();
  }
};

const addCancelledOrg = (orgId) => {
  const current = loadCancelledOrgs();
  current.add(String(orgId));
  try {
    sessionStorage.setItem(SS_KEY, JSON.stringify([...current]));
  } catch {}
  return current;
};

const getTimeRemaining = (date) => {
  const now    = Date.now();
  const target = new Date(date).getTime();
  const diff   = target - now;

  if (diff <= 0) return { label: "Overdue", urgent: true, overdue: true };

  const hours   = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (hours === 0) return { label: `${minutes}m left`, urgent: true,  overdue: false };
  if (hours < 6)  return { label: `${hours}h ${minutes}m left`, urgent: true,  overdue: false };
  return               { label: `${hours}h left`, urgent: false, overdue: false };
};

const formatDateTime = (date) =>
  new Date(date).toLocaleString("en-IN", {
    day: "2-digit", month: "short",
    hour: "2-digit", minute: "2-digit", hour12: true,
  });

const MODE_ICONS = { Email: "✉️", Phone: "📞", WhatsApp: "💬", Visit: "🏢" };

// ── Cancel Confirm Modal ──────────────────────────────────────────────────────
function CancelConfirmModal({ notification, onConfirm, onCancel, loading }) {
  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center px-4"
      style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)" }}
    >
      <div
        className="relative w-full max-w-sm rounded-2xl p-6"
        style={{
          background: "#0d0d18",
          border: "1px solid rgba(239,68,68,0.25)",
          boxShadow: "0 24px 64px rgba(0,0,0,0.6)",
          animation: "nb-scaleIn 0.18s cubic-bezier(.22,1,.36,1)",
        }}
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
            style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)" }}>
            🗑️
          </div>
          <div>
            <p className="text-white font-bold text-sm">Cancel Interaction?</p>
            <p className="text-slate-500 text-xs">This will remove the next interaction date</p>
          </div>
        </div>

        <div className="mb-5 p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
          <p className="text-white text-sm font-semibold truncate">{notification.centreName}</p>
          <p className="text-slate-500 text-xs mt-0.5">
            {MODE_ICONS[notification.interactionMode]} {notification.interactionMode} · {formatDateTime(notification.nextInteractionDate)}
          </p>
        </div>

        <div className="flex gap-2.5">
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium text-slate-400 transition-colors"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
          >
            Keep it
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all"
            style={{
              background: loading ? "rgba(239,68,68,0.1)" : "rgba(239,68,68,0.15)",
              border: "1px solid rgba(239,68,68,0.3)",
              color: "#f87171",
              opacity: loading ? 0.6 : 1,
            }}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-3 h-3 border border-red-400/30 border-t-red-400 rounded-full animate-spin inline-block" />
                Cancelling…
              </span>
            ) : "Cancel Interaction"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Helper: Get latest interaction per organisation ───────────────────────────
const getLatestPerOrg = (list) => {
  if (!list || list.length === 0) return [];

  const orgMap = {};

  list.forEach((item) => {
    const orgId = item._id;
    if (!orgMap[orgId]) {
      orgMap[orgId] = item;
      return;
    }

    const existing = orgMap[orgId];
    const existingTime = new Date(
      existing.createdAt || existing.savedAt || existing.nextInteractionDate
    ).getTime();
    const itemTime = new Date(
      item.createdAt || item.savedAt || item.nextInteractionDate
    ).getTime();

    if (!existing.createdAt && !existing.savedAt && !item.createdAt && !item.savedAt) {
      if ((item.interactionIndex ?? 0) > (existing.interactionIndex ?? 0)) {
        orgMap[orgId] = item;
      }
    } else if (itemTime > existingTime) {
      orgMap[orgId] = item;
    }
  });

  return Object.values(orgMap);
};

// ── Main NotificationBell ─────────────────────────────────────────────────────
export default function NotificationBell({ canViewNotifications }) {
  const navigate = useNavigate();
  const [notifications, setNoti]        = useState([]);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelling, setCancelling]     = useState(false);
  const [tick, setTick]                 = useState(0);
  const dropRef     = useRef(null);
  const intervalRef = useRef(null);
  const fetchRef    = useRef(null);

  // ── Fetch — sessionStorage se cancelled orgs padhkar filter karo ─────────
  const fetchNotifications = useCallback(async () => {
    if (!canViewNotifications) return;
    try {
      const res  = await axios.get("/organisations/upcoming-interactions");
      const list = res.data?.interactions || [];

      // Har fetch pe sessionStorage se fresh padho — page refresh ke baad bhi kaam karega
      const cancelled = loadCancelledOrgs();
      const filtered  = cancelled.size > 0
        ? list.filter((i) => !cancelled.has(String(i._id)))
        : list;

      setNoti(filtered);
    } catch {
      // Silent fail
    }
  }, [canViewNotifications]);

  useEffect(() => {
    if (!canViewNotifications) return;
    fetchNotifications();
    fetchRef.current = setInterval(fetchNotifications, 5 * 60 * 1000);
    return () => clearInterval(fetchRef.current);
  }, [fetchNotifications]);

  useEffect(() => {
    intervalRef.current = setInterval(() => setTick((t) => t + 1), 60 * 1000);
    return () => clearInterval(intervalRef.current);
  }, []);

  useEffect(() => {
    const fn = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target)) return;
    };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  if (!canViewNotifications) return null;

  const latestPerOrg = getLatestPerOrg(notifications);

  const totalCount  = latestPerOrg.length;
  const urgentCount = latestPerOrg.filter((n) => {
    const tr = getTimeRemaining(n.nextInteractionDate);
    return tr.urgent || tr.overdue;
  }).length;

  const handleCancelConfirm = async () => {
    if (!cancelTarget) return;
    setCancelling(true);

    const removedId    = String(cancelTarget._id);
    const removedIndex = cancelTarget.interactionIndex;

    // sessionStorage mein save karo — refresh pe bhi persist rahega
    addCancelledOrg(removedId);

    // State se poori org hata do
    setNoti((prev) => prev.filter((i) => String(i._id) !== removedId));

    setCancelTarget(null);
    setCancelling(false);

    try {
      await axios.post(`/organisations/${removedId}/interactions/cancel`, {
        interactionIndex: removedIndex,
      });
    } catch {
      // Silent
    }
  };

  const handleBellClick = () => {
    navigate("/notifications");
  };

  return (
    <>
      <style>{`
        @keyframes nb-scaleIn { from { transform: scale(0.92); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        @keyframes nb-pulse-ring { 0%,100% { transform: scale(1); opacity: 0.6; } 50% { transform: scale(1.5); opacity: 0; } }
        .nb-item { transition: background 0.12s; }
        .nb-item:hover { background: rgba(255,255,255,0.025) !important; }
      `}</style>

      <div className="relative" ref={dropRef}>
        <button
          onClick={handleBellClick}
          className="relative flex items-center justify-center w-9 h-9 rounded-xl transition-all"
          style={{
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
          title="View Upcoming Interactions"
        >
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#64748b" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"/>
          </svg>

          {totalCount > 0 && (
            <span
              className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center rounded-full text-[10px] font-bold text-white px-1"
              style={{
                background: urgentCount > 0
                  ? "linear-gradient(135deg,#ef4444,#dc2626)"
                  : "linear-gradient(135deg,#6366f1,#8b5cf6)",
                boxShadow: urgentCount > 0
                  ? "0 0 0 2px #080810, 0 0 8px rgba(239,68,68,0.5)"
                  : "0 0 0 2px #080810",
              }}
            >
              {totalCount > 99 ? "99+" : totalCount}
            </span>
          )}

          {urgentCount > 0 && (
            <span
              className="absolute -top-1 -right-1 w-[18px] h-[18px] rounded-full pointer-events-none"
              style={{ background: "rgba(239,68,68,0.4)", animation: "nb-pulse-ring 2s ease infinite" }}
            />
          )}
        </button>
      </div>

      {cancelTarget && (
        <CancelConfirmModal
          notification={cancelTarget}
          onConfirm={handleCancelConfirm}
          onCancel={() => setCancelTarget(null)}
          loading={cancelling}
        />
      )}
    </>
  );
}
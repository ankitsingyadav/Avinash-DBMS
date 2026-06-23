import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../utils/axios.js";
import {
  loadCancelledKeys,
  addCancelledKey,
  isCancelled,
  getSoonestPerOrg,
} from "../utils/notificationUtils.js";

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

// ── Main NotificationBell ─────────────────────────────────────────────────────
export default function NotificationBell({ canViewNotifications }) {
  const navigate = useNavigate();
  const [notifications, setNoti] = useState([]);
  const intervalRef = useRef(null);
  const fetchRef    = useRef(null);

  const fetchNotifications = useCallback(async () => {
    if (!canViewNotifications) return;
    try {
      const res       = await axios.get("/organisations/upcoming-interactions");
      const list      = res.data?.interactions || [];
      const cancelled = loadCancelledKeys();
      const filtered  = cancelled.size > 0
        ? list.filter((i) => !isCancelled(i, cancelled))
        : list;
      setNoti(filtered);
    } catch {
      // Silent fail — bell is non-critical
    }
  }, [canViewNotifications]);

  useEffect(() => {
    if (!canViewNotifications) return;
    fetchNotifications();
    fetchRef.current = setInterval(fetchNotifications, 5 * 60 * 1000);
    return () => clearInterval(fetchRef.current);
  }, [fetchNotifications]);

  // Countdown re-render every 60s
  useEffect(() => {
    intervalRef.current = setInterval(() => setNoti((n) => [...n]), 60 * 1000);
    return () => clearInterval(intervalRef.current);
  }, []);

  if (!canViewNotifications) return null;

  const latestPerOrg = getSoonestPerOrg(notifications);
  const totalCount   = latestPerOrg.length;
  const urgentCount  = latestPerOrg.filter((n) => {
    const tr = getTimeRemaining(n.nextInteractionDate);
    return tr.urgent || tr.overdue;
  }).length;

  return (
    <>
      <style>{`
        @keyframes nb-pulse-ring { 0%,100% { transform: scale(1); opacity: 0.6; } 50% { transform: scale(1.5); opacity: 0; } }
      `}</style>

      <button
        onClick={() => navigate("/notifications")}
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
    </>
  );
}

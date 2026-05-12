// ─── pages/AccessControlPage.jsx ─────────────────────────────────────────────
import { useState, useEffect, useCallback, useRef, memo } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../utils/axios.js";
import toast from "react-hot-toast";
import Navbar from "../components/Navbar";
import useAuthStore from "../context/authStore";

// ── Constants ─────────────────────────────────────────────────────────────────
const ROLES = [
  { value: "full_admin",    label: "Full Admin",    color: "#d97706", bg: "#fef3c7", desc: "Unrestricted access",       icon: "🛡️" },
  { value: "partial_admin", label: "Partial Admin", color: "#7c3aed", bg: "#ede9fe", desc: "Limited modules & actions", icon: "🔐" },
  { value: "data_entry",    label: "Data Entry",    color: "#059669", bg: "#d1fae5", desc: "Own records only",          icon: "✏️" },
  { value: "user",          label: "User",          color: "#475569", bg: "#f1f5f9", desc: "Basic access",              icon: "👤" },
];

const MODULES = [
  { value: "volunteer",        label: "Volunteers",        icon: "👥" },
  { value: "organisation",     label: "All Centres",       icon: "🏢" },
  { value: "School",           label: "Schools",           icon: "🏫" },
  { value: "College",          label: "Colleges",          icon: "🎓" },
  { value: "NGO",              label: "NGOs",              icon: "🤝" },
  { value: "Corporate",        label: "Corporate",         icon: "💼" },
  { value: "Online",           label: "Online",            icon: "🌐" },
  { value: "Community Centre", label: "Community Centres", icon: "🏘️" },
];

const ACTIONS = [
  { value: "view",   label: "View",   icon: "👁️",  color: "#0891b2" },
  { value: "add",    label: "Add",    icon: "➕",   color: "#059669" },
  { value: "edit",   label: "Edit",   icon: "✏️",  color: "#d97706" },
  { value: "delete", label: "Delete", icon: "🗑️",  color: "#dc2626" },
];

const HIDDEN_FIELDS = [
  { value: "phone", label: "Phone",  icon: "📞" },
  { value: "email", label: "Email",  icon: "📧" },
];

const ROLE_COLORS = {
  admin:         "#d97706",
  full_admin:    "#d97706",
  partial_admin: "#7c3aed",
  data_entry:    "#059669",
  user:          "#475569",
};

const ROLE_BG = {
  admin:         "#fef3c7",
  full_admin:    "#fef3c7",
  partial_admin: "#ede9fe",
  data_entry:    "#d1fae5",
  user:          "#f1f5f9",
};

const STAT_CARDS = [
  { key: "total",         label: "Total Users",    color: "#4f46e5", icon: "👥" },
  { key: "full_admin",    label: "Full Admins",    color: "#d97706", icon: "🛡️" },
  { key: "partial_admin", label: "Co-Admins",      color: "#7c3aed", icon: "🔐" },
  { key: "data_entry",    label: "Data Entry",     color: "#059669", icon: "✏️" },
  { key: "user",          label: "Users",          color: "#475569", icon: "👤" },
  { key: "active",        label: "Active",         color: "#0891b2", icon: "✅" },
];

const STAT_FILTERS = {
  total:         () => true,
  full_admin:    (u) => u.role === "full_admin" || u.role === "admin",
  partial_admin: (u) => u.role === "partial_admin",
  data_entry:    (u) => u.role === "data_entry",
  user:          (u) => u.role === "user",
  active:        (u) => u.isActive === true,
};

// ── Helpers ───────────────────────────────────────────────────────────────────
const getRoleLabel = (role) => {
  const map = { admin: "Full Admin", full_admin: "Full Admin", partial_admin: "Partial Admin", data_entry: "Data Entry", user: "User" };
  return map[role] || role;
};

const initPermissions = (user) => ({
  allowedModules:     user?.permissions?.allowedModules ?? [],
  allowedActions:     user?.permissions?.allowedActions ?? [],
  hiddenFields:       user?.permissions?.hiddenFields   ?? [],
  notificationAccess: user?.permissions?.notificationAccess ?? false,
  dateFrom: user?.permissions?.dateFrom ? user.permissions.dateFrom.slice(0, 10) : "",
  dateTo:   user?.permissions?.dateTo   ? user.permissions.dateTo.slice(0, 10)   : "",
});

const toggleItem = (arr, val) =>
  arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val];

const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : null;

// ── Global Styles ─────────────────────────────────────────────────────────────
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;600&display=swap');

  *, *::before, *::after { box-sizing: border-box; }

  @keyframes acl-spin    { to { transform: rotate(360deg); } }
  @keyframes acl-fadeUp  { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes acl-slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
  @keyframes acl-slideInUp { from { transform: translateY(100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
  @keyframes acl-pulse   { 0%,100% { opacity: 1; } 50% { opacity: 0.35; } }
  @keyframes acl-shimmer { from { background-position: -200% 0; } to { background-position: 200% 0; } }
  @keyframes acl-scaleIn { from { transform: scale(0.97); opacity: 0; } to { transform: scale(1); opacity: 1; } }

  .acl-root {
    font-family: 'DM Sans', sans-serif;
    background: #f8fafc;
    color: #0f172a;
  }

  /* Stat Cards */
  .acl-stat {
    cursor: pointer;
    transition: transform 0.18s cubic-bezier(.22,1,.36,1), box-shadow 0.18s;
    user-select: none;
    border-radius: 14px;
  }
  .acl-stat:hover  { transform: translateY(-3px); box-shadow: 0 8px 24px rgba(0,0,0,0.08); }
  .acl-stat:active { transform: scale(0.97); }

  /* Table rows */
  .acl-row {
    transition: background 0.12s;
    animation: acl-fadeUp 0.22s ease both;
  }
  .acl-row:hover { background: #f8fafc !important; }

  /* Buttons */
  .acl-btn-edit {
    display: inline-flex; align-items: center; gap: 5px;
    background: #eef2ff; border: 1px solid #c7d2fe;
    color: #4f46e5; border-radius: 8px; padding: 5px 12px;
    cursor: pointer; font-size: 12px; font-weight: 600;
    font-family: 'DM Sans', sans-serif;
    transition: background 0.12s, border-color 0.12s, color 0.12s;
    white-space: nowrap;
  }
  .acl-btn-edit:hover { background: #e0e7ff; border-color: #a5b4fc; color: #4338ca; }

  .acl-btn-del {
    display: inline-flex; align-items: center;
    background: #fef2f2; border: 1px solid #fecaca;
    color: #ef4444; border-radius: 8px; padding: 5px 10px;
    cursor: pointer; font-size: 13px;
    transition: background 0.12s, border-color 0.12s;
  }
  .acl-btn-del:hover { background: #fee2e2; border-color: #fca5a5; }

  /* Toggle */
  .acl-toggle {
    position: relative; width: 40px; height: 22px;
    border-radius: 99px; border: none; padding: 3px;
    display: flex; align-items: center;
    transition: background 0.22s; cursor: pointer; outline: none;
    flex-shrink: 0;
  }
  .acl-toggle:focus-visible { box-shadow: 0 0 0 2px #4f46e5; }
  .acl-toggle-thumb {
    width: 16px; height: 16px; border-radius: 50%;
    transition: transform 0.22s cubic-bezier(.34,1.56,.64,1), background 0.22s;
  }

  /* Permission panel */
  .acl-panel { animation: acl-slideIn 0.26s cubic-bezier(0.22,1,0.36,1); }

  /* Modal */
  .acl-modal { animation: acl-scaleIn 0.2s cubic-bezier(.22,1,.36,1); }

  /* Pill badge */
  .acl-pill {
    display: inline-flex; align-items: center; gap: 4px;
    padding: 2px 9px; border-radius: 99px;
    font-size: 10px; font-weight: 700; letter-spacing: 0.04em;
    text-transform: uppercase; white-space: nowrap;
  }

  /* Filter chip */
  .acl-chip {
    display: inline-flex; align-items: center; gap: 5px;
    padding: 3px 10px; border-radius: 99px;
    font-size: 11px; font-weight: 700; cursor: pointer;
    transition: all 0.12s; letter-spacing: 0.03em;
  }

  /* Skeleton shimmer */
  .acl-skeleton {
    background: linear-gradient(90deg, #e2e8f0 25%, #f1f5f9 50%, #e2e8f0 75%);
    background-size: 200% 100%;
    animation: acl-shimmer 1.4s ease infinite;
    border-radius: 6px;
  }

  /* Scrollbar */
  .acl-scroll::-webkit-scrollbar { width: 4px; }
  .acl-scroll::-webkit-scrollbar-track { background: transparent; }
  .acl-scroll::-webkit-scrollbar-thumb { background: #c7d2fe; border-radius: 99px; }

  /* Input focus ring */
  .acl-input:focus { border-color: #6366f1 !important; box-shadow: 0 0 0 3px rgba(99,102,241,0.12); }
  .acl-input { outline: none; }

  /* Section toggle buttons */
  .acl-tog-btn {
    padding: 9px 8px; border-radius: 9px; cursor: pointer;
    font-family: 'DM Sans', sans-serif;
    transition: all 0.15s; border: 1px solid;
    display: flex; flex-direction: column; align-items: center; gap: 4px;
  }

  /* ── STAT GRID RESPONSIVE ── */
  .acl-stat-grid {
    display: grid;
    grid-template-columns: repeat(6, 1fr);
    gap: 10px;
  }
  @media (max-width: 1100px) {
    .acl-stat-grid { grid-template-columns: repeat(3, 1fr); }
  }
  @media (max-width: 600px) {
    .acl-stat-grid { grid-template-columns: repeat(2, 1fr); gap: 8px; }
  }
  @media (max-width: 360px) {
    .acl-stat-grid { grid-template-columns: repeat(2, 1fr); gap: 6px; }
  }

  /* ── TABLE RESPONSIVE ── */
  .acl-table-header {
    display: grid;
    grid-template-columns: 2fr 1.6fr 1fr 1.3fr 1.3fr 80px 110px;
    padding: 10px 24px;
    align-items: center;
    border-bottom: 1px solid #e2e8f0;
    background: #f8fafc;
  }
  .acl-table-row {
    display: grid;
    grid-template-columns: 2fr 1.6fr 1fr 1.3fr 1.3fr 80px 110px;
    padding: 13px 24px;
    align-items: center;
    gap: 0;
  }

  @media (max-width: 900px) {
    .acl-table-header {
      grid-template-columns: 2fr 1.4fr 1fr 80px 90px;
      padding: 10px 16px;
    }
    .acl-table-row {
      grid-template-columns: 2fr 1.4fr 1fr 80px 90px;
      padding: 12px 16px;
    }
    .acl-col-modules,
    .acl-col-actions { display: none !important; }
    .acl-col-modules-hdr,
    .acl-col-actions-hdr { display: none !important; }
  }

  @media (max-width: 600px) {
    .acl-table-header { display: none !important; }
    .acl-table-row {
      display: flex !important;
      flex-direction: column;
      padding: 14px 14px;
      gap: 10px;
    }
    .acl-table-wrap { border-radius: 12px; }
    .acl-col-contact-desktop { display: none !important; }
  }

  /* ── PANEL RESPONSIVE ── */
  @media (max-width: 600px) {
    .acl-panel { animation: acl-slideInUp 0.28s cubic-bezier(0.22,1,0.36,1) !important; }
    .acl-panel-inner {
      width: 100vw !important;
      height: 92vh !important;
      border-radius: 20px 20px 0 0 !important;
      border-left: none !important;
      border-top: 1px solid #e0e7ff !important;
    }
    .acl-panel-overlay { align-items: flex-end !important; }
  }

  /* ── MODAL RESPONSIVE ── */
  @media (max-width: 600px) {
    .acl-modal-wrap { align-items: flex-end !important; padding: 0 !important; }
    .acl-modal { border-radius: 20px 20px 0 0 !important; max-height: 96vh !important; width: 100% !important; }
  }

  /* ── PAGE HEADER ── */
  @media (max-width: 600px) {
    .acl-page-header { flex-direction: column !important; align-items: flex-start !important; gap: 12px !important; }
    .acl-add-btn { width: 100% !important; justify-content: center !important; }
  }

  @media (max-width: 500px) {
    .acl-search-bar { padding: 8px 12px !important; }
  }

  @media (max-width: 400px) {
    .acl-role-grid { grid-template-columns: 1fr !important; }
    .acl-module-grid { grid-template-columns: 1fr !important; }
    .acl-date-grid { flex-direction: column !important; }
  }
`;

// ── Sub-components ────────────────────────────────────────────────────────────

const RoleBadge = memo(({ role }) => {
  const color = ROLE_COLORS[role] || "#475569";
  const bg    = ROLE_BG[role]    || "#f1f5f9";
  return (
    <span className="acl-pill" style={{ background: bg, color, border: `1px solid ${color}30` }}>
      {getRoleLabel(role)}
    </span>
  );
});

const Avatar = memo(({ user, size = 36 }) => {
  const [err, setErr] = useState(false);
  const color = ROLE_COLORS[user.role] || "#4f46e5";
  const bg    = ROLE_BG[user.role]    || "#eef2ff";
  const initials = (user.fullName || "U").split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  if (err || !user.avatar) {
    return (
      <div style={{
        width: size, height: size, borderRadius: Math.round(size * 0.27),
        flexShrink: 0, background: bg, border: `1.5px solid ${color}30`,
        display: "flex", alignItems: "center", justifyContent: "center",
        color, fontSize: size * 0.33, fontWeight: 700, letterSpacing: "-0.02em",
        fontFamily: "'JetBrains Mono', monospace",
      }}>
        {initials}
      </div>
    );
  }
  return (
    <img
      src={user.avatar} alt={user.fullName} onError={() => setErr(true)}
      style={{ width: size, height: size, borderRadius: Math.round(size * 0.27), objectFit: "cover", flexShrink: 0, border: "1.5px solid #e2e8f0" }}
    />
  );
});

// Skeleton row
const SkeletonRow = () => (
  <div style={{ padding: "14px 24px", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", gap: 12 }}>
    <div className="acl-skeleton" style={{ width: 36, height: 36, borderRadius: 10, flexShrink: 0 }} />
    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
      <div className="acl-skeleton" style={{ height: 13, width: "55%", borderRadius: 6 }} />
      <div className="acl-skeleton" style={{ height: 11, width: "35%", borderRadius: 6 }} />
    </div>
    <div className="acl-skeleton" style={{ height: 22, width: 70, borderRadius: 99 }} />
    <div className="acl-skeleton" style={{ height: 22, width: 40, borderRadius: 8 }} />
  </div>
);

// Stat Card
const StatCard = memo(({ label, value, color, filterKey, activeFilter, onClick, icon }) => {
  const isActive = activeFilter === filterKey;
  return (
    <div
      className="acl-stat"
      onClick={onClick}
      style={{
        background: isActive ? "#fff" : "#fff",
        border: `1.5px solid ${isActive ? color : "#e2e8f0"}`,
        padding: "14px 12px",
        position: "relative", overflow: "hidden",
        boxShadow: isActive ? `0 4px 20px ${color}20` : "0 1px 4px rgba(0,0,0,0.05)",
      }}
    >
      {isActive && (
        <div style={{ position: "absolute", top: -20, right: -20, width: 70, height: 70, borderRadius: "50%", background: `${color}10`, filter: "blur(16px)", pointerEvents: "none" }} />
      )}

      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 8 }}>
        <div style={{ fontSize: 16, lineHeight: 1 }}>{icon}</div>
        {isActive && (
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: color, boxShadow: `0 0 6px ${color}` }} />
        )}
      </div>

      <div style={{
        color: isActive ? color : "#0f172a",
        fontSize: 22, fontWeight: 800, lineHeight: 1,
        fontFamily: "'JetBrains Mono', monospace",
        fontVariantNumeric: "tabular-nums",
        transition: "color 0.18s",
      }}>
        {value}
      </div>
      <div style={{ color: isActive ? color : "#94a3b8", fontSize: 10, fontWeight: 600, marginTop: 5, transition: "color 0.18s", letterSpacing: "0.02em", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
        {label}
      </div>

      {isActive && (
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 2.5, background: color, borderRadius: "0 0 14px 14px" }} />
      )}
    </div>
  );
});

// ── Mobile User Card Row ──────────────────────────────────────────────────────
const MobileUserRow = memo(({ u, me, isMe, toggling, onEdit, onDelete, onToggle }) => {
  const mods           = u.permissions?.allowedModules ?? [];
  const hasNotifAccess = u.permissions?.notificationAccess === true;
  const isFullAdminUser= u.role === "admin" || u.role === "full_admin";

  return (
    <div
      className="acl-row"
      style={{
        padding: "14px", borderBottom: "1px solid #f1f5f9",
        opacity: u.isActive ? 1 : 0.5,
        background: isMe ? "#f0f9ff" : "#fff",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
        <Avatar user={u} size={40} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ color: "#0f172a", fontSize: 14, fontWeight: 600, display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 140 }}>{u.fullName}</span>
            {isMe && <span style={{ color: "#4f46e5", fontSize: 9, fontWeight: 800, background: "#eef2ff", padding: "1px 6px", borderRadius: 99, flexShrink: 0, fontFamily: "'JetBrains Mono', monospace" }}>YOU</span>}
            {hasNotifAccess && !isFullAdminUser && <span title="Notification Access" style={{ fontSize: 11, flexShrink: 0 }}>🔔</span>}
          </div>
          <div style={{ color: "#94a3b8", fontSize: 11, marginTop: 1, fontFamily: "'JetBrains Mono', monospace" }}>
            {u.lastLogin ? `Last login ${formatDate(u.lastLogin)}` : "Never logged in"}
          </div>
        </div>
        <button
          className="acl-toggle"
          onClick={() => !isMe && !toggling && onToggle(u)}
          disabled={isMe || toggling}
          style={{
            background: u.isActive ? "#d1fae5" : "#f1f5f9",
            cursor: isMe ? "not-allowed" : "pointer",
            opacity: toggling ? 0.5 : 1,
          }}
        >
          <div className="acl-toggle-thumb" style={{
            background: u.isActive ? "#059669" : "#cbd5e1",
            transform: u.isActive ? "translateX(18px)" : "translateX(0)",
            animation: toggling ? "acl-pulse 0.8s ease infinite" : "none",
          }} />
        </button>
      </div>

      <div style={{ marginBottom: 8, paddingLeft: 50 }}>
        <div style={{ color: "#475569", fontSize: 12 }}>{u.email}</div>
        <div style={{ color: "#94a3b8", fontSize: 11, marginTop: 2, fontFamily: "'JetBrains Mono', monospace" }}>{u.phone}</div>
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingLeft: 50, flexWrap: "wrap", gap: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <RoleBadge role={u.role} />
          {!isFullAdminUser && mods.length > 0 && (
            <span style={{ color: "#7c3aed", fontSize: 11 }} title={mods.join(", ")}>
              {mods.slice(0, 2).join(", ")}{mods.length > 2 ? ` +${mods.length - 2}` : ""}
            </span>
          )}
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <button className="acl-btn-edit" onClick={() => onEdit(u)}>
            <span style={{ fontSize: 11 }}>✏️</span> Edit
          </button>
          {!isMe && (
            <button className="acl-btn-del" onClick={() => onDelete(u)}>🗑️</button>
          )}
        </div>
      </div>
    </div>
  );
});

// ── Permission Panel ──────────────────────────────────────────────────────────
function PermissionPanel({ user, onClose, onSaved }) {
  const [role, setRole]     = useState(user?.role === "admin" ? "full_admin" : (user?.role || "user"));
  const [perms, setPerms]   = useState(initPermissions(user));
  const [saving, setSaving] = useState(false);

  const toggleModule = (v) => setPerms((p) => ({ ...p, allowedModules: toggleItem(p.allowedModules, v) }));
  const toggleAction = (v) => setPerms((p) => ({ ...p, allowedActions: toggleItem(p.allowedActions, v) }));
  const toggleField  = (v) => setPerms((p) => ({ ...p, hiddenFields:   toggleItem(p.hiddenFields,   v) }));

  const handleSave = async () => {
    setSaving(true);
    try {
      await axios.patch(`/users/${user._id}/permissions`, {
        role,
        permissions: {
          ...perms,
          dateFrom: perms.dateFrom || null,
          dateTo:   perms.dateTo   || null,
          notificationAccess: perms.notificationAccess,
        },
      });
      toast.success("Permissions saved successfully.");
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save permissions.");
    } finally {
      setSaving(false);
    }
  };

  const showModules      = role === "partial_admin";
  const showActions      = role === "partial_admin" || role === "data_entry";
  const showDateRange    = role === "partial_admin";
  const showHiddenFields = role === "partial_admin" || role === "data_entry";
  const showNotifAccess  = role === "partial_admin" || role === "data_entry";

  const selectedRole = ROLES.find((r) => r.value === role);

  const inputCls = {
    width: "100%", background: "#fff",
    border: "1.5px solid #e2e8f0", borderRadius: 9,
    padding: "9px 12px", color: "#0f172a", fontSize: 13,
    boxSizing: "border-box", fontFamily: "'DM Sans', sans-serif",
    transition: "border-color 0.15s, box-shadow 0.15s",
  };

  const sectionLabel = {
    color: "#64748b", fontSize: 10, fontWeight: 700,
    letterSpacing: "0.12em", textTransform: "uppercase",
    display: "block", marginBottom: 10,
  };

  return (
    <div
      className="acl-panel-overlay"
      style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(15,23,42,0.4)", backdropFilter: "blur(4px)", display: "flex", alignItems: "stretch", justifyContent: "flex-end" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="acl-panel acl-panel-inner acl-scroll" style={{
        width: "min(500px, 100vw)", height: "100vh",
        background: "#fff", borderLeft: "1px solid #e2e8f0",
        overflowY: "auto", padding: "0",
        display: "flex", flexDirection: "column",
      }}>
        {/* Sticky Header */}
        <div style={{
          position: "sticky", top: 0, zIndex: 10,
          background: "#fff", borderBottom: "1px solid #f1f5f9",
          padding: "20px 20px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Avatar user={user} size={42} />
            <div>
              <div style={{ color: "#0f172a", fontSize: 15, fontWeight: 700, marginBottom: 1 }}>{user?.fullName}</div>
              <div style={{ color: "#94a3b8", fontSize: 11.5, overflow: "hidden", textOverflow: "ellipsis", maxWidth: "160px", whiteSpace: "nowrap" }}>{user?.email}</div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 9, padding: "7px 11px", color: "#64748b", cursor: "pointer", fontSize: 14, lineHeight: 1, fontFamily: "'DM Sans', sans-serif", transition: "all 0.12s", flexShrink: 0 }}>✕</button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, padding: "20px", display: "flex", flexDirection: "column", gap: 24 }}>

          {/* Role */}
          <section>
            <label style={sectionLabel}>Assign Role</label>
            <div className="acl-role-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {ROLES.map((r) => {
                const on = role === r.value;
                return (
                  <button key={r.value} onClick={() => setRole(r.value)} style={{
                    padding: "12px 14px", borderRadius: 11, textAlign: "left", cursor: "pointer",
                    background: on ? r.bg : "#f8fafc",
                    border: `1.5px solid ${on ? r.color + "60" : "#e2e8f0"}`,
                    transition: "all 0.15s", fontFamily: "'DM Sans', sans-serif",
                    boxShadow: on ? `0 2px 12px ${r.color}18` : "none",
                  }}>
                    <div style={{ fontSize: 16, marginBottom: 5 }}>{r.icon}</div>
                    <div style={{ color: on ? r.color : "#475569", fontWeight: 700, fontSize: 13 }}>{r.label}</div>
                    <div style={{ color: "#94a3b8", fontSize: 11, marginTop: 2 }}>{r.desc}</div>
                  </button>
                );
              })}
            </div>
            {selectedRole && (
              <div style={{ marginTop: 10, padding: "9px 12px", borderRadius: 8, background: selectedRole.bg, border: `1px solid ${selectedRole.color}30`, display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 13 }}>{selectedRole.icon}</span>
                <span style={{ color: selectedRole.color, fontSize: 11.5, fontWeight: 600 }}>{selectedRole.label} — {selectedRole.desc}</span>
              </div>
            )}
          </section>

          {/* Notification Access */}
          {showNotifAccess && (
            <section>
              <label style={sectionLabel}>Notification Access</label>
              <div
                onClick={() => setPerms((p) => ({ ...p, notificationAccess: !p.notificationAccess }))}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "14px 16px", borderRadius: 11, cursor: "pointer",
                  background: perms.notificationAccess ? "#eef2ff" : "#f8fafc",
                  border: `1.5px solid ${perms.notificationAccess ? "#a5b4fc" : "#e2e8f0"}`,
                  transition: "all 0.15s", gap: 10,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 0 }}>
                  <span style={{ fontSize: 20, flexShrink: 0 }}>🔔</span>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ color: perms.notificationAccess ? "#4f46e5" : "#475569", fontWeight: 700, fontSize: 13 }}>
                      Upcoming Interaction Alerts
                    </div>
                    <div style={{ color: "#94a3b8", fontSize: 11, marginTop: 1 }}>
                      Show 48-hour interaction notifications
                    </div>
                  </div>
                </div>
                <button
                  className="acl-toggle"
                  style={{
                    background: perms.notificationAccess ? "#c7d2fe" : "#f1f5f9",
                    cursor: "pointer",
                  }}
                >
                  <div className="acl-toggle-thumb" style={{
                    background: perms.notificationAccess ? "#4f46e5" : "#cbd5e1",
                    transform: perms.notificationAccess ? "translateX(18px)" : "translateX(0)",
                  }} />
                </button>
              </div>
              {perms.notificationAccess && (
                <p style={{ color: "#64748b", fontSize: 11, marginTop: 8, lineHeight: 1.5 }}>
                  ✅ User will see the notification bell with upcoming 48h interaction alerts.
                </p>
              )}
            </section>
          )}

          {/* Modules */}
          {showModules && (
            <section>
              <label style={sectionLabel}>
                Module Access
                <span style={{ marginLeft: 6, color: "#4f46e5", fontSize: 9, fontWeight: 700, background: "#eef2ff", padding: "1px 6px", borderRadius: 99 }}>
                  {perms.allowedModules.length} selected
                </span>
              </label>
              <div className="acl-module-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7 }}>
                {MODULES.map((m) => {
                  const on = perms.allowedModules.includes(m.value);
                  return (
                    <button key={m.value} onClick={() => toggleModule(m.value)} style={{
                      padding: "9px 12px", borderRadius: 9, textAlign: "left", cursor: "pointer",
                      background: on ? "#eef2ff" : "#f8fafc",
                      border: `1.5px solid ${on ? "#a5b4fc" : "#e2e8f0"}`,
                      color: on ? "#4f46e5" : "#64748b", fontSize: 12.5, fontWeight: 600,
                      transition: "all 0.14s", fontFamily: "'DM Sans', sans-serif",
                      display: "flex", alignItems: "center", gap: 7,
                    }}>
                      <span style={{ fontSize: 14 }}>{m.icon}</span>
                      {m.label}
                      {on && <span style={{ marginLeft: "auto", color: "#4f46e5", fontSize: 12 }}>✓</span>}
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          {/* Actions */}
          {showActions && (
            <section>
              <label style={sectionLabel}>
                Allowed Actions
                <span style={{ marginLeft: 6, color: "#4f46e5", fontSize: 9, fontWeight: 700, background: "#eef2ff", padding: "1px 6px", borderRadius: 99 }}>
                  {perms.allowedActions.length} selected
                </span>
              </label>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {ACTIONS.map((a) => {
                  const on = perms.allowedActions.includes(a.value);
                  return (
                    <button key={a.value} onClick={() => toggleAction(a.value)} className="acl-tog-btn" style={{
                      flex: "1 1 60px", minWidth: 60,
                      background: on ? `${a.color}10` : "#f8fafc",
                      borderColor: on ? `${a.color}50` : "#e2e8f0",
                      color: on ? a.color : "#94a3b8",
                    }}>
                      <span style={{ fontSize: 16 }}>{a.icon}</span>
                      <span style={{ fontSize: 11, fontWeight: 700 }}>{a.label}</span>
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          {/* Hidden Fields */}
          {showHiddenFields && (
            <section>
              <label style={sectionLabel}>Mask Sensitive Fields</label>
              <div style={{ display: "flex", gap: 8 }}>
                {HIDDEN_FIELDS.map((f) => {
                  const on = perms.hiddenFields.includes(f.value);
                  return (
                    <button key={f.value} onClick={() => toggleField(f.value)} className="acl-tog-btn" style={{
                      flex: 1,
                      background: on ? "#fef2f2" : "#f8fafc",
                      borderColor: on ? "#fca5a5" : "#e2e8f0",
                      color: on ? "#dc2626" : "#94a3b8",
                      flexDirection: "row", gap: 7, justifyContent: "center",
                    }}>
                      <span style={{ fontSize: 14 }}>{on ? "🔒" : "🔓"}</span>
                      <span style={{ fontSize: 12, fontWeight: 700 }}>{f.label}</span>
                    </button>
                  );
                })}
              </div>
              {perms.hiddenFields.length > 0 && (
                <p style={{ color: "#64748b", fontSize: 11, marginTop: 8, lineHeight: 1.5 }}>
                  ⚠ Masked fields are stripped server-side, not just hidden in the UI.
                </p>
              )}
            </section>
          )}

          {/* Date Range */}
          {showDateRange && (
            <section>
              <label style={sectionLabel}>Date Range Restriction</label>
              <div className="acl-date-grid" style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ color: "#64748b", fontSize: 11, marginBottom: 5, fontWeight: 600 }}>From</div>
                  <input type="date" value={perms.dateFrom} onChange={(e) => setPerms((p) => ({ ...p, dateFrom: e.target.value }))} style={inputCls} className="acl-input" />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ color: "#64748b", fontSize: 11, marginBottom: 5, fontWeight: 600 }}>To</div>
                  <input type="date" value={perms.dateTo} onChange={(e) => setPerms((p) => ({ ...p, dateTo: e.target.value }))} style={inputCls} className="acl-input" />
                </div>
                {(perms.dateFrom || perms.dateTo) && (
                  <button onClick={() => setPerms((p) => ({ ...p, dateFrom: "", dateTo: "" }))} style={{ background: "none", border: "none", cursor: "pointer", color: "#ef4444", fontSize: 16, padding: "0 4px", paddingBottom: 2, lineHeight: 1 }}>✕</button>
                )}
              </div>
              {(perms.dateFrom || perms.dateTo) && (
                <p style={{ color: "#64748b", fontSize: 11, marginTop: 8, lineHeight: 1.5 }}>
                  User will only see records created within this date window.
                </p>
              )}
            </section>
          )}
        </div>

        {/* Sticky Footer */}
        <div style={{
          position: "sticky", bottom: 0,
          background: "#fff", borderTop: "1px solid #f1f5f9",
          padding: "16px 20px", display: "flex", gap: 10,
        }}>
          <button onClick={onClose} style={{
            flex: 1, padding: "11px", borderRadius: 10,
            background: "#f8fafc", border: "1.5px solid #e2e8f0",
            color: "#64748b", fontSize: 13, fontWeight: 600, cursor: "pointer",
            fontFamily: "'DM Sans', sans-serif", transition: "all 0.12s",
          }}>
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving} style={{
            flex: 2, padding: "11px", borderRadius: 10,
            background: saving ? "#e2e8f0" : "linear-gradient(135deg, #4f46e5, #6366f1)",
            border: "none", color: saving ? "#94a3b8" : "#fff", fontSize: 13, fontWeight: 700,
            cursor: saving ? "not-allowed" : "pointer",
            opacity: saving ? 0.8 : 1, transition: "all 0.15s",
            fontFamily: "'DM Sans', sans-serif",
            boxShadow: saving ? "none" : "0 4px 16px rgba(99,102,241,0.3)",
          }}>
            {saving ? (
              <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                <span style={{ width: 13, height: 13, border: "2px solid #cbd5e1", borderTopColor: "#6366f1", borderRadius: "50%", display: "inline-block", animation: "acl-spin 0.7s linear infinite" }} />
                Saving…
              </span>
            ) : "Save Permissions"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Add User Modal ────────────────────────────────────────────────────────────
function AddUserModal({ onClose, onCreated }) {
  const [form, setForm] = useState({
    fullName: "", email: "", phone: "", password: "", age: "",
    role: "data_entry",
    permissions: { allowedModules: [], allowedActions: ["view", "add"], hiddenFields: [], notificationAccess: false, dateFrom: "", dateTo: "" },
  });
  const [saving, setSaving] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await axios.post("/users", {
        ...form,
        age: Number(form.age),
        permissions: { ...form.permissions, dateFrom: form.permissions.dateFrom || null, dateTo: form.permissions.dateTo || null },
      });
      toast.success("User created successfully.");
      onCreated();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create user.");
    } finally {
      setSaving(false);
    }
  };

  const inputStyle = {
    width: "100%", background: "#fff",
    border: "1.5px solid #e2e8f0", borderRadius: 9,
    padding: "10px 13px", color: "#0f172a", fontSize: 13, outline: "none",
    boxSizing: "border-box", fontFamily: "'DM Sans', sans-serif",
    transition: "border-color 0.15s, box-shadow 0.15s",
  };
  const labelStyle = {
    color: "#64748b", fontSize: 10, fontWeight: 700,
    letterSpacing: "0.1em", textTransform: "uppercase",
    marginBottom: 6, display: "block",
  };

  return (
    <div
      className="acl-modal-wrap"
      style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(15,23,42,0.4)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="acl-modal acl-scroll" style={{
        background: "#fff", border: "1px solid #e2e8f0",
        borderRadius: 20, width: "min(500px, 100%)", maxHeight: "92vh",
        overflowY: "auto", padding: 0,
        boxShadow: "0 20px 60px rgba(15,23,42,0.15)",
      }}>
        <div style={{ padding: "22px 22px 18px", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ color: "#4f46e5", fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 4 }}>Access Control</div>
            <h2 style={{ color: "#0f172a", fontSize: 18, fontWeight: 800, margin: 0, letterSpacing: "-0.02em" }}>Create New User</h2>
          </div>
          <button onClick={onClose} style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 9, padding: "7px 11px", color: "#64748b", cursor: "pointer", fontSize: 14, lineHeight: 1, fontFamily: "'DM Sans', sans-serif", flexShrink: 0 }}>✕</button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: "20px 22px 24px", display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={labelStyle}>Full Name</label>
            <input required className="acl-input" style={inputStyle} placeholder="e.g. Arjun Sharma" value={form.fullName} onChange={(e) => set("fullName", e.target.value)} />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={labelStyle}>Email</label>
              <input required type="email" className="acl-input" style={inputStyle} placeholder="user@example.com" value={form.email} onChange={(e) => set("email", e.target.value)} />
            </div>
            <div>
              <label style={labelStyle}>Phone</label>
              <input required className="acl-input" style={inputStyle} placeholder="+91 9876543210" value={form.phone} onChange={(e) => set("phone", e.target.value)} />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={labelStyle}>Password</label>
              <div style={{ position: "relative" }}>
                <input required type={showPw ? "text" : "password"} className="acl-input" style={{ ...inputStyle, paddingRight: 38 }} placeholder="Min 8 characters" value={form.password} onChange={(e) => set("password", e.target.value)} />
                <button type="button" onClick={() => setShowPw((p) => !p)} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#94a3b8", fontSize: 14, lineHeight: 1 }}>
                  {showPw ? "🙈" : "👁️"}
                </button>
              </div>
            </div>
            <div>
              <label style={labelStyle}>Age</label>
              <input required type="number" min="13" max="120" className="acl-input" style={inputStyle} placeholder="Age" value={form.age} onChange={(e) => set("age", e.target.value)} />
            </div>
          </div>

          <div>
            <label style={labelStyle}>Role</label>
            <select className="acl-input" style={{ ...inputStyle, cursor: "pointer" }} value={form.role} onChange={(e) => set("role", e.target.value)}>
              {ROLES.map((r) => <option key={r.value} value={r.value}>{r.icon} {r.label} — {r.desc}</option>)}
            </select>
          </div>

          <div style={{ padding: "12px", background: "#f0f9ff", borderRadius: 10, border: "1px solid #bae6fd" }}>
            <p style={{ color: "#0369a1", fontSize: 11.5, margin: 0, lineHeight: 1.5 }}>
              💡 Detailed permissions (modules, actions, notification access) can be configured after creation via the <strong>Edit</strong> button.
            </p>
          </div>

          <div style={{ display: "flex", gap: 10, paddingTop: 4 }}>
            <button type="button" onClick={onClose} style={{
              flex: 1, padding: "11px", borderRadius: 10,
              background: "#f8fafc", border: "1.5px solid #e2e8f0",
              color: "#64748b", cursor: "pointer", fontWeight: 600, fontSize: 13, fontFamily: "'DM Sans', sans-serif",
            }}>Cancel</button>
            <button type="submit" disabled={saving} style={{
              flex: 2, padding: "11px", borderRadius: 10,
              background: saving ? "#e2e8f0" : "linear-gradient(135deg,#4f46e5,#6366f1)",
              border: "none", color: saving ? "#94a3b8" : "#fff", fontSize: 13, fontWeight: 700,
              cursor: saving ? "not-allowed" : "pointer",
              fontFamily: "'DM Sans', sans-serif",
              boxShadow: saving ? "none" : "0 4px 16px rgba(99,102,241,0.3)",
            }}>
              {saving ? (
                <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                  <span style={{ width: 13, height: 13, border: "2px solid #cbd5e1", borderTopColor: "#6366f1", borderRadius: "50%", display: "inline-block", animation: "acl-spin 0.7s linear infinite" }} />
                  Creating…
                </span>
              ) : "Create User"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Delete Confirm ────────────────────────────────────────────────────────────
function DeleteModal({ target, onCancel, onConfirm, loading }) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 300, background: "rgba(15,23,42,0.5)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div className="acl-modal" style={{
        background: "#fff", border: "1px solid #fecaca",
        borderRadius: 18, padding: "24px 20px", maxWidth: 380, width: "100%",
        boxShadow: "0 20px 60px rgba(15,23,42,0.15)",
      }}>
        <div style={{ width: 46, height: 46, borderRadius: 13, background: "#fef2f2", border: "1px solid #fecaca", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, marginBottom: 16 }}>🗑️</div>
        <h3 style={{ color: "#0f172a", margin: "0 0 8px", fontSize: 17, fontWeight: 800, letterSpacing: "-0.01em" }}>Delete User?</h3>
        <p style={{ color: "#64748b", fontSize: 13, margin: "0 0 22px", lineHeight: 1.6 }}>
          This will permanently delete <strong style={{ color: "#0f172a" }}>{target.fullName}</strong> and all their access. This action cannot be undone.
        </p>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onCancel} disabled={loading} style={{ flex: 1, padding: "11px", borderRadius: 10, background: "#f8fafc", border: "1.5px solid #e2e8f0", color: "#64748b", cursor: "pointer", fontWeight: 600, fontSize: 13, fontFamily: "'DM Sans', sans-serif" }}>
            Cancel
          </button>
          <button onClick={() => onConfirm(target)} disabled={loading} style={{ flex: 1, padding: "11px", borderRadius: 10, background: "#fef2f2", border: "1.5px solid #fca5a5", color: "#dc2626", cursor: loading ? "not-allowed" : "pointer", fontWeight: 700, fontSize: 13, fontFamily: "'DM Sans', sans-serif", opacity: loading ? 0.6 : 1 }}>
            {loading ? "Deleting…" : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function AccessControlPage() {
  const navigate = useNavigate();
  const { user: me, isFullAdmin } = useAuthStore();

  const [users, setUsers]               = useState([]);
  const [loading, setLoading]           = useState(true);
  const [search, setSearch]             = useState("");
  const [activeFilter, setActiveFilter] = useState("total");
  const [editUser, setEditUser]         = useState(null);
  const [showAdd, setShowAdd]           = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting]         = useState(false);
  const [togglingId, setTogglingId]     = useState(null);
  const [isMobile, setIsMobile]         = useState(false);
  const searchRef = useRef(null);

  useEffect(() => {
    if (me && !isFullAdmin()) navigate("/");
  }, [me]);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 600);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get("/users");
      setUsers(res.data?.users || []);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load users.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const stats = {
    total:         users.length,
    full_admin:    users.filter(STAT_FILTERS.full_admin).length,
    partial_admin: users.filter(STAT_FILTERS.partial_admin).length,
    data_entry:    users.filter(STAT_FILTERS.data_entry).length,
    user:          users.filter(STAT_FILTERS.user).length,
    active:        users.filter(STAT_FILTERS.active).length,
  };

  const handleStatClick = (key) => {
    setActiveFilter((prev) => (prev === key ? "total" : key));
    setSearch("");
    setTimeout(() => searchRef.current?.focus(), 50);
  };

  const filtered = users.filter((u) => {
    if (!STAT_FILTERS[activeFilter]?.(u)) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase().trim();
    return (
      u.fullName?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.phone?.toLowerCase().includes(q) ||
      getRoleLabel(u.role).toLowerCase().includes(q) ||
      u.role?.toLowerCase().includes(q)
    );
  });

  const handleToggleStatus = async (u) => {
    if (u._id === me?._id) return;
    setTogglingId(u._id);
    try {
      await axios.patch(`/users/${u._id}/status`);
      toast.success(`User ${u.isActive ? "deactivated" : "activated"}.`);
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update status.");
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async (u) => {
    setDeleting(true);
    try {
      await axios.delete(`/users/${u._id}`);
      toast.success("User deleted.");
      setDeleteTarget(null);
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete user.");
    } finally {
      setDeleting(false);
    }
  };

  const activeCard = STAT_CARDS.find((c) => c.key === activeFilter);

  return (
    <div className="acl-root" style={{ minHeight: "100vh", background: "#f8fafc" }}>
      <style>{GLOBAL_CSS}</style>
      <Navbar />

      {/* Modals */}
      {showAdd      && <AddUserModal onClose={() => setShowAdd(false)} onCreated={fetchUsers} />}
      {editUser     && <PermissionPanel user={editUser} onClose={() => setEditUser(null)} onSaved={fetchUsers} />}
      {deleteTarget && <DeleteModal target={deleteTarget} loading={deleting} onCancel={() => setDeleteTarget(null)} onConfirm={handleDelete} />}

      <div style={{ maxWidth: 1500, margin: "0 auto", padding: "20px 12px 80px" }}>

        {/* ── Page Header ── */}
        <div
          className="acl-page-header"
          style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 14 }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <div style={{ width: 3, height: 16, borderRadius: 99, background: "linear-gradient(180deg, #4f46e5, #a5b4fc)" }} />
              <span style={{ color: "#94a3b8", fontSize: 10, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", fontFamily: "'JetBrains Mono', monospace" }}>
                Full Admin · Access Control
              </span>
            </div>
            <h1 style={{ color: "#0f172a", fontSize: "clamp(18px, 5vw, 28px)", fontWeight: 800, margin: 0, letterSpacing: "-0.03em" }}>
              User Management
            </h1>
            <p style={{ color: "#94a3b8", fontSize: 12, margin: "5px 0 0" }}>
              {loading ? "Loading users…" : `${users.length} user${users.length !== 1 ? "s" : ""} in the system`}
            </p>
          </div>

          <button
            className="acl-add-btn"
            onClick={() => setShowAdd(true)}
            style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "10px 20px", borderRadius: 12, border: "none", cursor: "pointer",
              background: "linear-gradient(135deg,#4f46e5,#6366f1)",
              color: "#fff", fontSize: 13, fontWeight: 700,
              fontFamily: "'DM Sans', sans-serif",
              boxShadow: "0 4px 20px rgba(99,102,241,0.28)",
              transition: "transform 0.15s, box-shadow 0.15s",
              whiteSpace: "nowrap",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 28px rgba(99,102,241,0.38)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)";    e.currentTarget.style.boxShadow = "0 4px 20px rgba(99,102,241,0.28)"; }}
          >
            <span style={{ fontSize: 17, lineHeight: 1 }}>＋</span>
            Add User
          </button>
        </div>

        {/* ── Stat Cards ── */}
        <div className="acl-stat-grid" style={{ marginBottom: 16 }}>
          {STAT_CARDS.map((s) => (
            <StatCard
              key={s.key}
              label={s.label}
              value={loading ? "—" : stats[s.key]}
              color={s.color}
              icon={s.icon}
              filterKey={s.key}
              activeFilter={activeFilter}
              onClick={() => handleStatClick(s.key)}
            />
          ))}
        </div>

        {/* ── Search Bar ── */}
        <div
          className="acl-search-bar"
          style={{
            background: "#fff", border: "1.5px solid #e2e8f0",
            borderRadius: 13, padding: "10px 16px", marginBottom: 10,
            display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap",
            boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
          }}
        >
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#94a3b8" strokeWidth={2.2} style={{ flexShrink: 0 }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
          <input
            ref={searchRef}
            type="text"
            placeholder="Search by name, email, phone or role…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ background: "none", border: "none", outline: "none", color: "#0f172a", fontSize: 13, flex: 1, minWidth: 120, fontFamily: "'DM Sans', sans-serif" }}
          />

          {activeFilter !== "total" && (
            <span
              className="acl-chip"
              onClick={() => handleStatClick(activeFilter)}
              style={{ background: `${activeCard?.color}10`, color: activeCard?.color, border: `1px solid ${activeCard?.color}30` }}
            >
              {activeCard?.icon} {activeCard?.label}
              <span style={{ opacity: 0.5, fontSize: 10 }}>✕</span>
            </span>
          )}

          {search && (
            <button onClick={() => setSearch("")} style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: 17, lineHeight: 1, padding: 0 }}>✕</button>
          )}

          <span style={{ color: "#cbd5e1", fontSize: 12, fontWeight: 700, whiteSpace: "nowrap", fontFamily: "'JetBrains Mono', monospace" }}>
            {loading ? "…" : `${filtered.length} result${filtered.length !== 1 ? "s" : ""}`}
          </span>
        </div>

        {/* ── Table / Card List ── */}
        <div className="acl-table-wrap" style={{ background: "#fff", border: "1.5px solid #e2e8f0", borderRadius: 16, overflow: "hidden", boxShadow: "0 1px 8px rgba(0,0,0,0.05)" }}>

          {/* Table Header */}
          <div className="acl-table-header">
            {["User","Contact","Role","Modules","Actions","Status",""].map((h, i) => (
              <span key={i}
                className={i === 3 ? "acl-col-modules-hdr" : i === 4 ? "acl-col-actions-hdr" : ""}
                style={{ color: "#94a3b8", fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", fontFamily: "'JetBrains Mono', monospace" }}
              >{h}</span>
            ))}
          </div>

          {/* Loading Skeletons */}
          {loading && [...Array(5)].map((_, i) => <SkeletonRow key={i} />)}

          {/* Empty State */}
          {!loading && filtered.length === 0 && (
            <div style={{ padding: "64px 24px", textAlign: "center" }}>
              <div style={{ fontSize: 36, marginBottom: 12, opacity: 0.4 }}>🔍</div>
              <p style={{ color: "#94a3b8", fontSize: 14, margin: "0 0 16px", fontWeight: 600 }}>
                {search ? `No results for "${search}"` : activeFilter !== "total" ? "No users in this category" : "No users found"}
              </p>
              {(search || activeFilter !== "total") && (
                <button
                  onClick={() => { setSearch(""); setActiveFilter("total"); }}
                  style={{ background: "#eef2ff", border: "1px solid #c7d2fe", color: "#4f46e5", borderRadius: 9, padding: "7px 16px", cursor: "pointer", fontSize: 12.5, fontWeight: 600, fontFamily: "'DM Sans', sans-serif" }}
                >
                  Clear all filters
                </button>
              )}
            </div>
          )}

          {/* Mobile card rows */}
          {!loading && isMobile && filtered.map((u) => (
            <MobileUserRow
              key={u._id}
              u={u}
              me={me}
              isMe={u._id === me?._id}
              toggling={togglingId === u._id}
              onEdit={setEditUser}
              onDelete={setDeleteTarget}
              onToggle={handleToggleStatus}
            />
          ))}

          {/* Desktop grid rows */}
          {!loading && !isMobile && filtered.map((u, i) => {
            const isMe            = u._id === me?._id;
            const mods            = u.permissions?.allowedModules ?? [];
            const acts            = u.permissions?.allowedActions ?? [];
            const hasNotifAccess  = u.permissions?.notificationAccess === true;
            const isFullAdminUser = u.role === "admin" || u.role === "full_admin";
            const toggling        = togglingId === u._id;

            return (
              <div
                key={u._id}
                className="acl-row acl-table-row"
                style={{
                  borderBottom: i < filtered.length - 1 ? "1px solid #f1f5f9" : "none",
                  opacity: u.isActive ? 1 : 0.45,
                  animationDelay: `${Math.min(i * 20, 200)}ms`,
                  background: isMe ? "#f0f9ff" : "#fff",
                }}
              >
                {/* User */}
                <div style={{ display: "flex", alignItems: "center", gap: 11, paddingRight: 14, minWidth: 0 }}>
                  <Avatar user={u} size={36} />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ color: "#0f172a", fontSize: 13.5, fontWeight: 600, display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "120px" }}>{u.fullName}</span>
                      {isMe && (
                        <span style={{ color: "#4f46e5", fontSize: 9, fontWeight: 800, background: "#eef2ff", padding: "1px 6px", borderRadius: 99, flexShrink: 0, fontFamily: "'JetBrains Mono', monospace" }}>YOU</span>
                      )}
                      {hasNotifAccess && !isFullAdminUser && (
                        <span title="Notification Access" style={{ fontSize: 11, flexShrink: 0 }}>🔔</span>
                      )}
                    </div>
                    <div style={{ color: "#cbd5e1", fontSize: 11, marginTop: 2, fontFamily: "'JetBrains Mono', monospace" }}>
                      {u.lastLogin ? `Last login ${formatDate(u.lastLogin)}` : "Never logged in"}
                    </div>
                  </div>
                </div>

                {/* Contact */}
                <div style={{ paddingRight: 12, minWidth: 0 }}>
                  <div style={{ color: "#475569", fontSize: 12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{u.email}</div>
                  <div style={{ color: "#94a3b8", fontSize: 11, marginTop: 2, fontFamily: "'JetBrains Mono', monospace" }}>{u.phone}</div>
                </div>

                {/* Role */}
                <div><RoleBadge role={u.role} /></div>

                {/* Modules */}
                <div className="acl-col-modules" style={{ paddingRight: 8 }}>
                  {isFullAdminUser ? (
                    <span style={{ color: "#d97706", fontSize: 11, fontWeight: 600, opacity: 0.7 }}>All modules</span>
                  ) : mods.length > 0 ? (
                    <span style={{ color: "#7c3aed", fontSize: 11 }} title={mods.join(", ")}>
                      {mods.slice(0, 2).join(", ")}{mods.length > 2 ? ` +${mods.length - 2}` : ""}
                    </span>
                  ) : (
                    <span style={{ color: "#e2e8f0", fontSize: 11 }}>—</span>
                  )}
                </div>

                {/* Actions */}
                <div className="acl-col-actions" style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                  {isFullAdminUser ? (
                    <span style={{ color: "#d97706", fontSize: 11, fontWeight: 600, opacity: 0.7 }}>All</span>
                  ) : acts.length > 0 ? (
                    acts.map((a) => {
                      const actionDef = ACTIONS.find((x) => x.value === a);
                      return (
                        <span key={a} className="acl-pill" style={{ background: `${actionDef?.color || "#4f46e5"}10`, color: actionDef?.color || "#4f46e5", border: `1px solid ${actionDef?.color || "#4f46e5"}25`, fontSize: 9.5 }}>
                          {a}
                        </span>
                      );
                    })
                  ) : (
                    <span style={{ color: "#e2e8f0", fontSize: 11 }}>—</span>
                  )}
                </div>

                {/* Status Toggle */}
                <div style={{ display: "flex", alignItems: "center" }}>
                  <button
                    className="acl-toggle"
                    onClick={() => !isMe && !toggling && handleToggleStatus(u)}
                    disabled={isMe || toggling}
                    title={isMe ? "Cannot change your own status" : u.isActive ? "Deactivate user" : "Activate user"}
                    style={{
                      background: u.isActive ? "#d1fae5" : "#f1f5f9",
                      cursor: isMe ? "not-allowed" : "pointer",
                      opacity: toggling ? 0.5 : 1,
                    }}
                  >
                    <div className="acl-toggle-thumb" style={{
                      background: u.isActive ? "#059669" : "#cbd5e1",
                      transform: u.isActive ? "translateX(18px)" : "translateX(0)",
                      animation: toggling ? "acl-pulse 0.8s ease infinite" : "none",
                    }} />
                  </button>
                </div>

                {/* Edit / Delete */}
                <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                  <button className="acl-btn-edit" onClick={() => setEditUser(u)}>
                    <span style={{ fontSize: 11 }}>✏️</span> Edit
                  </button>
                  {!isMe && (
                    <button className="acl-btn-del" onClick={() => setDeleteTarget(u)}>🗑️</button>
                  )}
                </div>
              </div>
            );
          })}

          {/* Footer */}
          {!loading && filtered.length > 0 && (
            <div style={{
              padding: "10px 16px", borderTop: "1px solid #f1f5f9",
              display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8,
              background: "#f8fafc",
            }}>
              <span style={{ color: "#cbd5e1", fontSize: 11.5, fontFamily: "'JetBrains Mono', monospace" }}>
                {filtered.length} / {users.length} users
              </span>
              {(activeFilter !== "total" || search) && (
                <button
                  onClick={() => { setActiveFilter("total"); setSearch(""); }}
                  style={{ background: "none", border: "none", color: "#94a3b8", fontSize: 11.5, cursor: "pointer", fontWeight: 600, fontFamily: "'DM Sans', sans-serif" }}
                >
                  Clear filters ✕
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
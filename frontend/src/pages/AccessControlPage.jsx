// pages/AccessControlPage.jsx
// ─── Production-Grade: Full Admin User Management + Permission Assignment ─────
import { useState, useEffect, useCallback, useRef, memo } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../utils/axios.js";
import toast from "react-hot-toast";
import Navbar from "../components/Navbar";
import useAuthStore from "../context/authStore";

// ── Constants ─────────────────────────────────────────────────────────────────
const ROLES = [
  { value: "full_admin",    label: "Full Admin",    color: "#f59e0b", bg: "#f59e0b12", desc: "Unrestricted access",       icon: "🛡️" },
  { value: "partial_admin", label: "Partial Admin", color: "#8b5cf6", bg: "#8b5cf612", desc: "Limited modules & actions", icon: "🔐" },
  { value: "data_entry",    label: "Data Entry",    color: "#10b981", bg: "#10b98112", desc: "Own records only",          icon: "✏️" },
  { value: "user",          label: "User",          color: "#64748b", bg: "#64748b12", desc: "Basic access",              icon: "👤" },
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
  { value: "view",   label: "View",   icon: "👁️",  color: "#06b6d4" },
  { value: "add",    label: "Add",    icon: "➕",   color: "#10b981" },
  { value: "edit",   label: "Edit",   icon: "✏️",  color: "#f59e0b" },
  { value: "delete", label: "Delete", icon: "🗑️",  color: "#ef4444" },
];

const HIDDEN_FIELDS = [
  { value: "phone", label: "Phone",  icon: "📞" },
  { value: "email", label: "Email",  icon: "📧" },
];

const ROLE_COLORS = {
  admin:         "#f59e0b",
  full_admin:    "#f59e0b",
  partial_admin: "#8b5cf6",
  data_entry:    "#10b981",
  user:          "#64748b",
};

const STAT_CARDS = [
  { key: "total",         label: "Total Users",    color: "#6366f1", icon: "👥" },
  { key: "full_admin",    label: "Full Admins",    color: "#f59e0b", icon: "🛡️" },
  { key: "partial_admin", label: "Co-Admins",      color: "#8b5cf6", icon: "🔐" },
  { key: "data_entry",    label: "Data Entry",     color: "#10b981", icon: "✏️" },
  { key: "user",          label: "Users",          color: "#64748b", icon: "👤" },
  { key: "active",        label: "Active",         color: "#06b6d4", icon: "✅" },
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
  allowedModules: user?.permissions?.allowedModules ?? [],
  allowedActions: user?.permissions?.allowedActions ?? [],
  hiddenFields:   user?.permissions?.hiddenFields   ?? [],
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
  @keyframes acl-fadeUp  { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes acl-slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
  @keyframes acl-pulse   { 0%,100% { opacity: 1; } 50% { opacity: 0.35; } }
  @keyframes acl-shimmer { from { background-position: -200% 0; } to { background-position: 200% 0; } }
  @keyframes acl-scaleIn { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }

  .acl-root { font-family: 'DM Sans', sans-serif; }

  /* Stat Cards */
  .acl-stat {
    cursor: pointer;
    transition: transform 0.18s cubic-bezier(.22,1,.36,1), box-shadow 0.18s;
    user-select: none;
    border-radius: 16px;
  }
  .acl-stat:hover  { transform: translateY(-3px); }
  .acl-stat:active { transform: scale(0.97); }

  /* Table rows */
  .acl-row {
    transition: background 0.12s;
    animation: acl-fadeUp 0.22s ease both;
  }
  .acl-row:hover { background: rgba(255,255,255,0.028) !important; }

  /* Buttons */
  .acl-btn-edit {
    display: inline-flex; align-items: center; gap: 5px;
    background: rgba(99,102,241,0.08); border: 1px solid rgba(99,102,241,0.2);
    color: #818cf8; border-radius: 8px; padding: 5px 12px;
    cursor: pointer; font-size: 12px; font-weight: 600;
    font-family: 'DM Sans', sans-serif;
    transition: background 0.12s, border-color 0.12s, color 0.12s;
  }
  .acl-btn-edit:hover { background: rgba(99,102,241,0.18); color: #a5b4fc; border-color: rgba(99,102,241,0.4); }

  .acl-btn-del {
    display: inline-flex; align-items: center;
    background: rgba(239,68,68,0.06); border: 1px solid rgba(239,68,68,0.18);
    color: #f87171; border-radius: 8px; padding: 5px 10px;
    cursor: pointer; font-size: 13px;
    transition: background 0.12s, border-color 0.12s;
  }
  .acl-btn-del:hover { background: rgba(239,68,68,0.16); border-color: rgba(239,68,68,0.35); }

  /* Toggle */
  .acl-toggle {
    position: relative; width: 40px; height: 22px;
    border-radius: 99px; border: none; padding: 3px;
    display: flex; align-items: center;
    transition: background 0.22s; cursor: pointer; outline: none;
  }
  .acl-toggle:focus-visible { box-shadow: 0 0 0 2px #6366f1; }
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
    background: linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 75%);
    background-size: 200% 100%;
    animation: acl-shimmer 1.4s ease infinite;
    border-radius: 6px;
  }

  /* Scrollbar */
  .acl-scroll::-webkit-scrollbar { width: 4px; }
  .acl-scroll::-webkit-scrollbar-track { background: transparent; }
  .acl-scroll::-webkit-scrollbar-thumb { background: rgba(99,102,241,0.3); border-radius: 99px; }

  /* Input focus ring */
  .acl-input:focus { border-color: rgba(99,102,241,0.5) !important; box-shadow: 0 0 0 3px rgba(99,102,241,0.12); }
  .acl-input { outline: none; }

  /* Section toggle buttons */
  .acl-tog-btn {
    padding: 9px 8px; border-radius: 9px; cursor: pointer;
    font-family: 'DM Sans', sans-serif;
    transition: all 0.15s; border: 1px solid;
    display: flex; flex-direction: column; align-items: center; gap: 4px;
  }
`;

// ── Sub-components ────────────────────────────────────────────────────────────

const RoleBadge = memo(({ role }) => {
  const color = ROLE_COLORS[role] || "#64748b";
  return (
    <span className="acl-pill" style={{ background: `${color}15`, color, border: `1px solid ${color}30` }}>
      {getRoleLabel(role)}
    </span>
  );
});

const Avatar = memo(({ user, size = 36 }) => {
  const [err, setErr] = useState(false);
  const color = ROLE_COLORS[user.role] || "#6366f1";
  const initials = (user.fullName || "U").split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  if (err || !user.avatar) {
    return (
      <div style={{
        width: size, height: size, borderRadius: Math.round(size * 0.27),
        flexShrink: 0, background: `${color}18`, border: `1.5px solid ${color}28`,
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
      style={{ width: size, height: size, borderRadius: Math.round(size * 0.27), objectFit: "cover", flexShrink: 0, border: "1.5px solid rgba(255,255,255,0.07)" }}
    />
  );
});

// Skeleton row
const SkeletonRow = () => (
  <div style={{ display: "grid", gridTemplateColumns: "2fr 1.6fr 1fr 1.3fr 1.3fr 80px 100px", padding: "14px 24px", alignItems: "center", borderBottom: "1px solid rgba(255,255,255,0.04)", gap: 0 }}>
    {[140, 120, 70, 100, 80, 40, 80].map((w, i) => (
      <div key={i} className="acl-skeleton" style={{ height: 14, width: w, borderRadius: 6 }} />
    ))}
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
        background: isActive ? `${color}10` : "#111119",
        border: `1px solid ${isActive ? color + "45" : "rgba(255,255,255,0.05)"}`,
        padding: "18px 20px",
        position: "relative", overflow: "hidden",
        boxShadow: isActive ? `0 0 0 1px ${color}25, 0 8px 32px ${color}14` : "none",
      }}
    >
      {/* Glow bg */}
      {isActive && (
        <div style={{ position: "absolute", top: -20, right: -20, width: 80, height: 80, borderRadius: "50%", background: `${color}14`, filter: "blur(20px)", pointerEvents: "none" }} />
      )}

      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 10 }}>
        <div style={{ fontSize: 18, lineHeight: 1 }}>{icon}</div>
        {isActive && (
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: color, boxShadow: `0 0 8px ${color}` }} />
        )}
      </div>

      <div style={{
        color: isActive ? color : "#e2e8f0",
        fontSize: 30, fontWeight: 800, lineHeight: 1,
        fontFamily: "'JetBrains Mono', monospace",
        fontVariantNumeric: "tabular-nums",
        transition: "color 0.18s",
      }}>
        {value}
      </div>
      <div style={{ color: isActive ? color : "#475569", fontSize: 11.5, fontWeight: 600, marginTop: 6, transition: "color 0.18s", letterSpacing: "0.02em" }}>
        {label}
      </div>

      {isActive && (
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, transparent, ${color}, transparent)` }} />
      )}
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
        permissions: { ...perms, dateFrom: perms.dateFrom || null, dateTo: perms.dateTo || null },
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

  const selectedRole = ROLES.find((r) => r.value === role);

  const inputCls = {
    width: "100%", background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)", borderRadius: 9,
    padding: "9px 12px", color: "#e2e8f0", fontSize: 13,
    colorScheme: "dark", boxSizing: "border-box", fontFamily: "'DM Sans', sans-serif",
    transition: "border-color 0.15s, box-shadow 0.15s",
  };

  const sectionLabel = {
    color: "#475569", fontSize: 10, fontWeight: 700,
    letterSpacing: "0.12em", textTransform: "uppercase",
    display: "block", marginBottom: 10,
  };

  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)", display: "flex", alignItems: "stretch", justifyContent: "flex-end" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="acl-panel acl-scroll" style={{
        width: "min(500px, 96vw)", height: "100vh",
        background: "#0d0d18", borderLeft: "1px solid rgba(99,102,241,0.12)",
        overflowY: "auto", padding: "0",
        display: "flex", flexDirection: "column",
      }}>
        {/* Sticky Header */}
        <div style={{
          position: "sticky", top: 0, zIndex: 10,
          background: "#0d0d18", borderBottom: "1px solid rgba(255,255,255,0.05)",
          padding: "20px 24px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Avatar user={user} size={42} />
            <div>
              <div style={{ color: "#fff", fontSize: 15, fontWeight: 700, marginBottom: 1 }}>{user?.fullName}</div>
              <div style={{ color: "#475569", fontSize: 11.5 }}>{user?.email}</div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 9, padding: "7px 11px", color: "#475569", cursor: "pointer", fontSize: 14, lineHeight: 1, fontFamily: "'DM Sans', sans-serif", transition: "all 0.12s" }}>✕</button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, padding: "24px", display: "flex", flexDirection: "column", gap: 26 }}>

          {/* Role */}
          <section>
            <label style={sectionLabel}>Assign Role</label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {ROLES.map((r) => {
                const on = role === r.value;
                return (
                  <button key={r.value} onClick={() => setRole(r.value)} style={{
                    padding: "12px 14px", borderRadius: 11, textAlign: "left", cursor: "pointer",
                    background: on ? r.bg : "rgba(255,255,255,0.02)",
                    border: `1px solid ${on ? r.color + "45" : "rgba(255,255,255,0.05)"}`,
                    transition: "all 0.15s", fontFamily: "'DM Sans', sans-serif",
                    boxShadow: on ? `0 4px 20px ${r.color}12` : "none",
                  }}>
                    <div style={{ fontSize: 16, marginBottom: 5 }}>{r.icon}</div>
                    <div style={{ color: on ? r.color : "#94a3b8", fontWeight: 700, fontSize: 13 }}>{r.label}</div>
                    <div style={{ color: "#334155", fontSize: 11, marginTop: 2 }}>{r.desc}</div>
                  </button>
                );
              })}
            </div>
            {selectedRole && (
              <div style={{ marginTop: 10, padding: "9px 12px", borderRadius: 8, background: `${selectedRole.color}08`, border: `1px solid ${selectedRole.color}18`, display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 13 }}>{selectedRole.icon}</span>
                <span style={{ color: selectedRole.color, fontSize: 11.5, fontWeight: 600 }}>{selectedRole.label} — {selectedRole.desc}</span>
              </div>
            )}
          </section>

          {/* Modules */}
          {showModules && (
            <section>
              <label style={sectionLabel}>
                Module Access
                <span style={{ marginLeft: 6, color: "#6366f1", fontSize: 9, fontWeight: 700, background: "rgba(99,102,241,0.12)", padding: "1px 6px", borderRadius: 99 }}>
                  {perms.allowedModules.length} selected
                </span>
              </label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7 }}>
                {MODULES.map((m) => {
                  const on = perms.allowedModules.includes(m.value);
                  return (
                    <button key={m.value} onClick={() => toggleModule(m.value)} style={{
                      padding: "9px 12px", borderRadius: 9, textAlign: "left", cursor: "pointer",
                      background: on ? "rgba(99,102,241,0.1)" : "rgba(255,255,255,0.02)",
                      border: `1px solid ${on ? "rgba(99,102,241,0.35)" : "rgba(255,255,255,0.05)"}`,
                      color: on ? "#a5b4fc" : "#475569", fontSize: 12.5, fontWeight: 600,
                      transition: "all 0.14s", fontFamily: "'DM Sans', sans-serif",
                      display: "flex", alignItems: "center", gap: 7,
                    }}>
                      <span style={{ fontSize: 14 }}>{m.icon}</span>
                      {m.label}
                      {on && <span style={{ marginLeft: "auto", color: "#6366f1", fontSize: 12 }}>✓</span>}
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
                <span style={{ marginLeft: 6, color: "#6366f1", fontSize: 9, fontWeight: 700, background: "rgba(99,102,241,0.12)", padding: "1px 6px", borderRadius: 99 }}>
                  {perms.allowedActions.length} selected
                </span>
              </label>
              <div style={{ display: "flex", gap: 8 }}>
                {ACTIONS.map((a) => {
                  const on = perms.allowedActions.includes(a.value);
                  return (
                    <button key={a.value} onClick={() => toggleAction(a.value)} className="acl-tog-btn" style={{
                      flex: 1,
                      background: on ? `${a.color}12` : "rgba(255,255,255,0.02)",
                      borderColor: on ? `${a.color}40` : "rgba(255,255,255,0.05)",
                      color: on ? a.color : "#475569",
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
                      background: on ? "rgba(239,68,68,0.08)" : "rgba(255,255,255,0.02)",
                      borderColor: on ? "rgba(239,68,68,0.3)" : "rgba(255,255,255,0.05)",
                      color: on ? "#f87171" : "#475569",
                      flexDirection: "row", gap: 7, justifyContent: "center",
                    }}>
                      <span style={{ fontSize: 14 }}>{on ? "🔒" : "🔓"}</span>
                      <span style={{ fontSize: 12, fontWeight: 700 }}>{f.label}</span>
                    </button>
                  );
                })}
              </div>
              {perms.hiddenFields.length > 0 && (
                <p style={{ color: "#475569", fontSize: 11, marginTop: 8, lineHeight: 1.5 }}>
                  ⚠ Masked fields are stripped server-side, not just hidden in the UI.
                </p>
              )}
            </section>
          )}

          {/* Date Range */}
          {showDateRange && (
            <section>
              <label style={sectionLabel}>Date Range Restriction</label>
              <div style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ color: "#475569", fontSize: 11, marginBottom: 5, fontWeight: 600 }}>From</div>
                  <input type="date" value={perms.dateFrom} onChange={(e) => setPerms((p) => ({ ...p, dateFrom: e.target.value }))} style={inputCls} className="acl-input" />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ color: "#475569", fontSize: 11, marginBottom: 5, fontWeight: 600 }}>To</div>
                  <input type="date" value={perms.dateTo} onChange={(e) => setPerms((p) => ({ ...p, dateTo: e.target.value }))} style={inputCls} className="acl-input" />
                </div>
                {(perms.dateFrom || perms.dateTo) && (
                  <button onClick={() => setPerms((p) => ({ ...p, dateFrom: "", dateTo: "" }))} style={{ background: "none", border: "none", cursor: "pointer", color: "#ef4444", fontSize: 16, padding: "0 4px", paddingBottom: 2, lineHeight: 1 }}>✕</button>
                )}
              </div>
              {(perms.dateFrom || perms.dateTo) && (
                <p style={{ color: "#475569", fontSize: 11, marginTop: 8, lineHeight: 1.5 }}>
                  User will only see records created within this date window.
                </p>
              )}
            </section>
          )}
        </div>

        {/* Sticky Footer */}
        <div style={{
          position: "sticky", bottom: 0,
          background: "#0d0d18", borderTop: "1px solid rgba(255,255,255,0.05)",
          padding: "16px 24px", display: "flex", gap: 10,
        }}>
          <button onClick={onClose} style={{
            flex: 1, padding: "11px", borderRadius: 10,
            background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)",
            color: "#64748b", fontSize: 13, fontWeight: 600, cursor: "pointer",
            fontFamily: "'DM Sans', sans-serif", transition: "all 0.12s",
          }}>
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving} style={{
            flex: 2, padding: "11px", borderRadius: 10,
            background: saving ? "#1a1a2e" : "linear-gradient(135deg, #4f46e5, #6366f1)",
            border: "none", color: "#fff", fontSize: 13, fontWeight: 700,
            cursor: saving ? "not-allowed" : "pointer",
            opacity: saving ? 0.65 : 1, transition: "all 0.15s",
            fontFamily: "'DM Sans', sans-serif",
            boxShadow: saving ? "none" : "0 4px 20px rgba(99,102,241,0.3)",
          }}>
            {saving ? (
              <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                <span style={{ width: 13, height: 13, border: "2px solid rgba(255,255,255,0.25)", borderTopColor: "#fff", borderRadius: "50%", display: "inline-block", animation: "acl-spin 0.7s linear infinite" }} />
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
    permissions: { allowedModules: [], allowedActions: ["view", "add"], hiddenFields: [], dateFrom: "", dateTo: "" },
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
    width: "100%", background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)", borderRadius: 9,
    padding: "10px 13px", color: "#e2e8f0", fontSize: 13, outline: "none",
    boxSizing: "border-box", fontFamily: "'DM Sans', sans-serif",
    transition: "border-color 0.15s, box-shadow 0.15s",
  };
  const labelStyle = {
    color: "#475569", fontSize: 10, fontWeight: 700,
    letterSpacing: "0.1em", textTransform: "uppercase",
    marginBottom: 6, display: "block",
  };

  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,0.8)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="acl-modal acl-scroll" style={{
        background: "#0d0d18", border: "1px solid rgba(99,102,241,0.15)",
        borderRadius: 20, width: "min(500px, 100%)", maxHeight: "92vh",
        overflowY: "auto", padding: 0,
      }}>
        {/* Modal Header */}
        <div style={{ padding: "22px 26px 18px", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ color: "#6366f1", fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 4 }}>Access Control</div>
            <h2 style={{ color: "#fff", fontSize: 18, fontWeight: 800, margin: 0, letterSpacing: "-0.02em" }}>Create New User</h2>
          </div>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 9, padding: "7px 11px", color: "#475569", cursor: "pointer", fontSize: 14, lineHeight: 1, fontFamily: "'DM Sans', sans-serif" }}>✕</button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: "22px 26px 26px", display: "flex", flexDirection: "column", gap: 16 }}>
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
                <button type="button" onClick={() => setShowPw((p) => !p)} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#475569", fontSize: 14, lineHeight: 1 }}>
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
            <select className="acl-input" style={{ ...inputStyle, colorScheme: "dark", cursor: "pointer" }} value={form.role} onChange={(e) => set("role", e.target.value)}>
              {ROLES.map((r) => <option key={r.value} value={r.value}>{r.icon} {r.label} — {r.desc}</option>)}
            </select>
          </div>

          <div style={{ padding: "12px", background: "rgba(99,102,241,0.05)", borderRadius: 10, border: "1px solid rgba(99,102,241,0.1)" }}>
            <p style={{ color: "#475569", fontSize: 11.5, margin: 0, lineHeight: 1.5 }}>
              💡 Detailed permissions can be configured after user creation via the <strong style={{ color: "#6366f1" }}>Edit</strong> button.
            </p>
          </div>

          <div style={{ display: "flex", gap: 10, paddingTop: 4 }}>
            <button type="button" onClick={onClose} style={{
              flex: 1, padding: "11px", borderRadius: 10,
              background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)",
              color: "#64748b", cursor: "pointer", fontWeight: 600, fontSize: 13, fontFamily: "'DM Sans', sans-serif",
            }}>Cancel</button>
            <button type="submit" disabled={saving} style={{
              flex: 2, padding: "11px", borderRadius: 10,
              background: saving ? "#1a1a2e" : "linear-gradient(135deg,#4f46e5,#6366f1)",
              border: "none", color: "#fff", fontSize: 13, fontWeight: 700,
              cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.65 : 1,
              fontFamily: "'DM Sans', sans-serif",
              boxShadow: saving ? "none" : "0 4px 20px rgba(99,102,241,0.3)",
            }}>
              {saving ? (
                <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                  <span style={{ width: 13, height: 13, border: "2px solid rgba(255,255,255,0.25)", borderTopColor: "#fff", borderRadius: "50%", display: "inline-block", animation: "acl-spin 0.7s linear infinite" }} />
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
    <div style={{ position: "fixed", inset: 0, zIndex: 300, background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div className="acl-modal" style={{
        background: "#0d0d18", border: "1px solid rgba(239,68,68,0.2)",
        borderRadius: 18, padding: 28, maxWidth: 400, width: "100%",
      }}>
        <div style={{ width: 46, height: 46, borderRadius: 13, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.22)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, marginBottom: 16 }}>🗑️</div>
        <h3 style={{ color: "#fff", margin: "0 0 8px", fontSize: 17, fontWeight: 800, letterSpacing: "-0.01em" }}>Delete User?</h3>
        <p style={{ color: "#64748b", fontSize: 13, margin: "0 0 22px", lineHeight: 1.6 }}>
          This will permanently delete <strong style={{ color: "#e2e8f0" }}>{target.fullName}</strong> and all their access. This action cannot be undone.
        </p>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onCancel} disabled={loading} style={{ flex: 1, padding: "11px", borderRadius: 10, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", color: "#64748b", cursor: "pointer", fontWeight: 600, fontSize: 13, fontFamily: "'DM Sans', sans-serif" }}>
            Cancel
          </button>
          <button onClick={() => onConfirm(target)} disabled={loading} style={{ flex: 1, padding: "11px", borderRadius: 10, background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.28)", color: "#f87171", cursor: loading ? "not-allowed" : "pointer", fontWeight: 700, fontSize: 13, fontFamily: "'DM Sans', sans-serif", opacity: loading ? 0.6 : 1 }}>
            {loading ? "Deleting…" : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

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
  const searchRef = useRef(null);

  useEffect(() => {
    if (me && !isFullAdmin()) navigate("/");
  }, [me]);

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

  // Stats
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

  // Filtered
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

  // Toggle status
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

  // Delete
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
    <div className="acl-root" style={{ minHeight: "100vh", background: "#080810" }}>
      <style>{GLOBAL_CSS}</style>
      <Navbar />

      {/* Modals */}
      {showAdd      && <AddUserModal onClose={() => setShowAdd(false)} onCreated={fetchUsers} />}
      {editUser     && <PermissionPanel user={editUser} onClose={() => setEditUser(null)} onSaved={fetchUsers} />}
      {deleteTarget && <DeleteModal target={deleteTarget} loading={deleting} onCancel={() => setDeleteTarget(null)} onConfirm={handleDelete} />}

      <div style={{ maxWidth: 1500, margin: "0 auto", padding: "32px 24px 100px" }}>

        {/* ── Page Header ─────────────────────────────────────────────────── */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 28, flexWrap: "wrap", gap: 16 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <div style={{ width: 3, height: 16, borderRadius: 99, background: "linear-gradient(180deg, #6366f1, transparent)" }} />
              <span style={{ color: "#334155", fontSize: 10, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", fontFamily: "'JetBrains Mono', monospace" }}>
                Full Admin · Access Control
              </span>
            </div>
            <h1 style={{ color: "#f1f5f9", fontSize: 28, fontWeight: 800, margin: 0, letterSpacing: "-0.03em" }}>
              User Management
            </h1>
            <p style={{ color: "#334155", fontSize: 12.5, margin: "5px 0 0" }}>
              {loading ? "Loading users…" : `${users.length} user${users.length !== 1 ? "s" : ""} in the system`}
            </p>
          </div>

          <button
            onClick={() => setShowAdd(true)}
            style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "11px 22px", borderRadius: 12, border: "none", cursor: "pointer",
              background: "linear-gradient(135deg,#4f46e5,#6366f1)",
              color: "#fff", fontSize: 13.5, fontWeight: 700,
              fontFamily: "'DM Sans', sans-serif",
              boxShadow: "0 4px 24px rgba(99,102,241,0.32)",
              transition: "transform 0.15s, box-shadow 0.15s, opacity 0.15s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 32px rgba(99,102,241,0.4)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)";    e.currentTarget.style.boxShadow = "0 4px 24px rgba(99,102,241,0.32)"; }}
          >
            <span style={{ fontSize: 17, lineHeight: 1 }}>＋</span>
            Add User
          </button>
        </div>

        {/* ── Stat Cards ──────────────────────────────────────────────────── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 10, marginBottom: 20 }}>
          {STAT_CARDS.map((s, i) => (
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

        {/* ── Search Bar ──────────────────────────────────────────────────── */}
        <div style={{
          background: "#111119", border: "1px solid rgba(255,255,255,0.055)",
          borderRadius: 13, padding: "10px 16px", marginBottom: 12,
          display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap",
        }}>
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#334155" strokeWidth={2.2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
          <input
            ref={searchRef}
            type="text"
            placeholder="Search by name, email, phone or role…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ background: "none", border: "none", outline: "none", color: "#e2e8f0", fontSize: 13, flex: 1, minWidth: 140, fontFamily: "'DM Sans', sans-serif" }}
          />

          {activeFilter !== "total" && (
            <span
              className="acl-chip"
              onClick={() => handleStatClick(activeFilter)}
              style={{ background: `${activeCard?.color}15`, color: activeCard?.color, border: `1px solid ${activeCard?.color}30` }}
            >
              {activeCard?.icon} {activeCard?.label}
              <span style={{ opacity: 0.6, fontSize: 10 }}>✕</span>
            </span>
          )}

          {search && (
            <button onClick={() => setSearch("")} style={{ background: "none", border: "none", color: "#334155", cursor: "pointer", fontSize: 17, lineHeight: 1, padding: 0 }}>✕</button>
          )}

          <span style={{ color: "#1e293b", fontSize: 12, fontWeight: 700, whiteSpace: "nowrap", fontFamily: "'JetBrains Mono', monospace" }}>
            {loading ? "…" : `${filtered.length} result${filtered.length !== 1 ? "s" : ""}`}
          </span>
        </div>

        {/* ── Table ───────────────────────────────────────────────────────── */}
        <div style={{ background: "#111119", border: "1px solid rgba(255,255,255,0.055)", borderRadius: 16, overflow: "hidden" }}>

          {/* Table Header */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "2fr 1.6fr 1fr 1.3fr 1.3fr 80px 110px",
            padding: "10px 24px", alignItems: "center",
            borderBottom: "1px solid rgba(255,255,255,0.045)",
            background: "rgba(255,255,255,0.012)",
          }}>
            {["User", "Contact", "Role", "Modules", "Actions", "Status", ""].map((h) => (
              <span key={h} style={{ color: "#1e293b", fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", fontFamily: "'JetBrains Mono', monospace" }}>{h}</span>
            ))}
          </div>

          {/* Loading Skeletons */}
          {loading && (
            <>
              {[...Array(5)].map((_, i) => <SkeletonRow key={i} />)}
            </>
          )}

          {/* Empty State */}
          {!loading && filtered.length === 0 && (
            <div style={{ padding: "64px 24px", textAlign: "center" }}>
              <div style={{ fontSize: 36, marginBottom: 12, opacity: 0.5 }}>🔍</div>
              <p style={{ color: "#334155", fontSize: 14, margin: "0 0 16px", fontWeight: 600 }}>
                {search ? `No results for "${search}"` : activeFilter !== "total" ? "No users in this category" : "No users found"}
              </p>
              {(search || activeFilter !== "total") && (
                <button
                  onClick={() => { setSearch(""); setActiveFilter("total"); }}
                  style={{ background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.25)", color: "#6366f1", borderRadius: 9, padding: "7px 16px", cursor: "pointer", fontSize: 12.5, fontWeight: 600, fontFamily: "'DM Sans', sans-serif" }}
                >
                  Clear all filters
                </button>
              )}
            </div>
          )}

          {/* Rows */}
          {!loading && filtered.map((u, i) => {
            const isMe            = u._id === me?._id;
            const mods            = u.permissions?.allowedModules ?? [];
            const acts            = u.permissions?.allowedActions ?? [];
            const isFullAdminUser = u.role === "admin" || u.role === "full_admin";
            const toggling        = togglingId === u._id;

            return (
              <div
                key={u._id}
                className="acl-row"
                style={{
                  display: "grid",
                  gridTemplateColumns: "2fr 1.6fr 1fr 1.3fr 1.3fr 80px 110px",
                  padding: "13px 24px", alignItems: "center",
                  borderBottom: i < filtered.length - 1 ? "1px solid rgba(255,255,255,0.032)" : "none",
                  opacity: u.isActive ? 1 : 0.4,
                  animationDelay: `${Math.min(i * 20, 200)}ms`,
                  background: isMe ? "rgba(99,102,241,0.025)" : "transparent",
                }}
              >
                {/* User */}
                <div style={{ display: "flex", alignItems: "center", gap: 11, paddingRight: 14, minWidth: 0 }}>
                  <Avatar user={u} size={36} />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ color: "#e2e8f0", fontSize: 13.5, fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{u.fullName}</span>
                      {isMe && (
                        <span style={{ color: "#6366f1", fontSize: 9, fontWeight: 800, background: "rgba(99,102,241,0.14)", padding: "1px 6px", borderRadius: 99, flexShrink: 0, fontFamily: "'JetBrains Mono', monospace" }}>YOU</span>
                      )}
                    </div>
                    <div style={{ color: "#1e293b", fontSize: 11, marginTop: 2, fontFamily: "'JetBrains Mono', monospace" }}>
                      {u.lastLogin ? `Last login ${formatDate(u.lastLogin)}` : "Never logged in"}
                    </div>
                  </div>
                </div>

                {/* Contact */}
                <div style={{ paddingRight: 12, minWidth: 0 }}>
                  <div style={{ color: "#475569", fontSize: 12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{u.email}</div>
                  <div style={{ color: "#1e293b", fontSize: 11, marginTop: 2, fontFamily: "'JetBrains Mono', monospace" }}>{u.phone}</div>
                </div>

                {/* Role */}
                <div><RoleBadge role={u.role} /></div>

                {/* Modules */}
                <div style={{ paddingRight: 8 }}>
                  {isFullAdminUser ? (
                    <span style={{ color: "#f59e0b", fontSize: 11, fontWeight: 600, opacity: 0.5 }}>All modules</span>
                  ) : mods.length > 0 ? (
                    <span style={{ color: "#8b5cf6", fontSize: 11, opacity: 0.7 }} title={mods.join(", ")}>
                      {mods.slice(0, 2).join(", ")}{mods.length > 2 ? ` +${mods.length - 2}` : ""}
                    </span>
                  ) : (
                    <span style={{ color: "#1e293b", fontSize: 11 }}>—</span>
                  )}
                </div>

                {/* Actions */}
                <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                  {isFullAdminUser ? (
                    <span style={{ color: "#f59e0b", fontSize: 11, fontWeight: 600, opacity: 0.5 }}>All</span>
                  ) : acts.length > 0 ? (
                    acts.map((a) => {
                      const actionDef = ACTIONS.find((x) => x.value === a);
                      return (
                        <span key={a} className="acl-pill" style={{ background: `${actionDef?.color || "#6366f1"}12`, color: actionDef?.color || "#818cf8", border: `1px solid ${actionDef?.color || "#6366f1"}25`, fontSize: 9.5 }}>
                          {a}
                        </span>
                      );
                    })
                  ) : (
                    <span style={{ color: "#1e293b", fontSize: 11 }}>—</span>
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
                      background: u.isActive ? "rgba(16,185,129,0.2)" : "rgba(100,116,139,0.12)",
                      cursor: isMe ? "not-allowed" : "pointer",
                      opacity: toggling ? 0.5 : 1,
                      boxShadow: u.isActive ? "0 0 0 1px rgba(16,185,129,0.2) inset" : "none",
                    }}
                  >
                    <div className="acl-toggle-thumb" style={{
                      background: u.isActive ? "#10b981" : "#334155",
                      transform: u.isActive ? "translateX(18px)" : "translateX(0)",
                      boxShadow: u.isActive ? "0 0 8px rgba(16,185,129,0.6)" : "none",
                      animation: toggling ? "acl-pulse 0.8s ease infinite" : "none",
                    }} />
                  </button>
                </div>

                {/* Actions */}
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
              padding: "10px 24px", borderTop: "1px solid rgba(255,255,255,0.035)",
              display: "flex", alignItems: "center", justifyContent: "space-between",
              background: "rgba(255,255,255,0.01)",
            }}>
              <span style={{ color: "#1e293b", fontSize: 11.5, fontFamily: "'JetBrains Mono', monospace" }}>
                {filtered.length} / {users.length} users
              </span>
              {(activeFilter !== "total" || search) && (
                <button
                  onClick={() => { setActiveFilter("total"); setSearch(""); }}
                  style={{ background: "none", border: "none", color: "#334155", fontSize: 11.5, cursor: "pointer", fontWeight: 600, fontFamily: "'DM Sans', sans-serif" }}
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
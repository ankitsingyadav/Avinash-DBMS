// pages/AccessControlPage.jsx
// ─── Full Admin: User Management + Permission Assignment ──────────────────────
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../utils/axios.js";
import toast from "react-hot-toast";
import Navbar from "../components/Navbar";
import useAuthStore from "../context/authStore";

// ── Constants ─────────────────────────────────────────────────────────────────
const ROLES = [
  { value: "full_admin",    label: "Full Admin",    color: "#f59e0b", desc: "Unrestricted access" },
  { value: "partial_admin", label: "Partial Admin", color: "#6366f1", desc: "Limited modules & actions" },
  { value: "data_entry",    label: "Data Entry",    color: "#10b981", desc: "Own records only" },
  { value: "user",          label: "User",          color: "#64748b", desc: "Basic access" },
];

const MODULES = [
  { value: "volunteer",        label: "Volunteers",       icon: "👥" },
  { value: "organisation",     label: "All Centres",      icon: "🏢" },
  { value: "School",           label: "Schools",          icon: "🏫" },
  { value: "College",          label: "Colleges",         icon: "🎓" },
  { value: "NGO",              label: "NGOs",             icon: "🤝" },
  { value: "Corporate",        label: "Corporate",        icon: "💼" },
  { value: "Online",           label: "Online",           icon: "🌐" },
  { value: "Community Centre", label: "Community Centres",icon: "🏘️" },
];

const ACTIONS = [
  { value: "view",   label: "View",   icon: "👁" },
  { value: "add",    label: "Add",    icon: "➕" },
  { value: "edit",   label: "Edit",   icon: "✏️" },
  { value: "delete", label: "Delete", icon: "🗑" },
];

const HIDDEN_FIELDS = [
  { value: "phone", label: "Phone Number" },
  { value: "email", label: "Email Address" },
];

const ROLE_COLORS = {
  admin:         "#f59e0b",
  full_admin:    "#f59e0b",
  partial_admin: "#6366f1",
  data_entry:    "#10b981",
  user:          "#64748b",
};

const ROLE_LABELS = {
  admin:         "Full Admin",
  full_admin:    "Full Admin",
  partial_admin: "Partial Admin",
  data_entry:    "Data Entry",
  user:          "User",
};

// ── Helpers ───────────────────────────────────────────────────────────────────
const initPermissions = (user) => ({
  allowedModules:  user?.permissions?.allowedModules  ?? [],
  allowedActions:  user?.permissions?.allowedActions  ?? [],
  hiddenFields:    user?.permissions?.hiddenFields    ?? [],
  dateFrom:        user?.permissions?.dateFrom ? user.permissions.dateFrom.slice(0, 10) : "",
  dateTo:          user?.permissions?.dateTo   ? user.permissions.dateTo.slice(0, 10)   : "",
});

const toggleItem = (arr, val) =>
  arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val];

// ── Sub-component: Role Badge ─────────────────────────────────────────────────
function RoleBadge({ role }) {
  const color = ROLE_COLORS[role] || "#64748b";
  const label = ROLE_LABELS[role] || role;
  return (
    <span
      style={{
        background: `${color}18`,
        color,
        border: `1px solid ${color}35`,
        fontSize: 10,
        fontWeight: 700,
        padding: "2px 8px",
        borderRadius: 99,
        letterSpacing: "0.04em",
        textTransform: "uppercase",
      }}
    >
      {label}
    </span>
  );
}

// ── Sub-component: Permission Panel (slide-in) ────────────────────────────────
function PermissionPanel({ user, onClose, onSaved }) {
  const [role, setRole] = useState(user?.role || "user");
  const [perms, setPerms] = useState(initPermissions(user));
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
        },
      });
      toast.success("Permissions updated successfully.");
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update permissions.");
    } finally {
      setSaving(false);
    }
  };

  const showModules = role === "partial_admin";
  const showActions = role === "partial_admin" || role === "data_entry";
  const showDateRange = role === "partial_admin";
  const showHiddenFields = role === "partial_admin" || role === "data_entry";

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 100,
        background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)",
        display: "flex", alignItems: "center", justifyContent: "flex-end",
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        style={{
          width: "min(480px,96vw)", height: "100vh",
          background: "#13131f", borderLeft: "1px solid rgba(99,102,241,0.15)",
          overflowY: "auto", padding: "28px 24px",
          display: "flex", flexDirection: "column", gap: 20,
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <p style={{ color: "#6366f1", fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 2 }}>
              Editing Permissions
            </p>
            <h2 style={{ color: "#fff", fontSize: 18, fontWeight: 700, margin: 0 }}>{user?.fullName}</h2>
            <p style={{ color: "#475569", fontSize: 12, margin: "2px 0 0" }}>{user?.email}</p>
          </div>
          <button
            onClick={onClose}
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, padding: "6px 10px", color: "#64748b", cursor: "pointer" }}
          >
            ✕
          </button>
        </div>

        {/* Role Selector */}
        <section>
          <label style={{ color: "#94a3b8", fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", display: "block", marginBottom: 10 }}>
            Role
          </label>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {ROLES.map((r) => (
              <button
                key={r.value}
                onClick={() => setRole(r.value)}
                style={{
                  padding: "10px 12px", borderRadius: 10, textAlign: "left", cursor: "pointer",
                  background: role === r.value ? `${r.color}15` : "rgba(255,255,255,0.03)",
                  border: `1px solid ${role === r.value ? r.color + "50" : "rgba(255,255,255,0.06)"}`,
                  transition: "all 0.15s",
                }}
              >
                <div style={{ color: role === r.value ? r.color : "#94a3b8", fontWeight: 700, fontSize: 13 }}>{r.label}</div>
                <div style={{ color: "#475569", fontSize: 11, marginTop: 2 }}>{r.desc}</div>
              </button>
            ))}
          </div>
        </section>

        {/* Allowed Modules */}
        {showModules && (
          <section>
            <label style={{ color: "#94a3b8", fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", display: "block", marginBottom: 10 }}>
              Allowed Modules
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7 }}>
              {MODULES.map((m) => {
                const on = perms.allowedModules.includes(m.value);
                return (
                  <button
                    key={m.value}
                    onClick={() => toggleModule(m.value)}
                    style={{
                      padding: "8px 12px", borderRadius: 8, textAlign: "left", cursor: "pointer",
                      background: on ? "rgba(99,102,241,0.12)" : "rgba(255,255,255,0.03)",
                      border: `1px solid ${on ? "rgba(99,102,241,0.4)" : "rgba(255,255,255,0.06)"}`,
                      color: on ? "#a5b4fc" : "#64748b", fontSize: 12, fontWeight: 600,
                      transition: "all 0.15s",
                    }}
                  >
                    <span style={{ marginRight: 6 }}>{m.icon}</span>{m.label}
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {/* Allowed Actions */}
        {showActions && (
          <section>
            <label style={{ color: "#94a3b8", fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", display: "block", marginBottom: 10 }}>
              Allowed Actions
            </label>
            <div style={{ display: "flex", gap: 8 }}>
              {ACTIONS.map((a) => {
                const on = perms.allowedActions.includes(a.value);
                return (
                  <button
                    key={a.value}
                    onClick={() => toggleAction(a.value)}
                    style={{
                      flex: 1, padding: "9px 4px", borderRadius: 8, cursor: "pointer",
                      background: on ? "rgba(99,102,241,0.15)" : "rgba(255,255,255,0.03)",
                      border: `1px solid ${on ? "rgba(99,102,241,0.4)" : "rgba(255,255,255,0.06)"}`,
                      color: on ? "#a5b4fc" : "#475569", fontSize: 12, fontWeight: 700,
                      transition: "all 0.15s",
                      display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
                    }}
                  >
                    <span style={{ fontSize: 16 }}>{a.icon}</span>
                    <span>{a.label}</span>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {/* Hidden Fields */}
        {showHiddenFields && (
          <section>
            <label style={{ color: "#94a3b8", fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", display: "block", marginBottom: 10 }}>
              Hide Sensitive Fields
            </label>
            <div style={{ display: "flex", gap: 8 }}>
              {HIDDEN_FIELDS.map((f) => {
                const on = perms.hiddenFields.includes(f.value);
                return (
                  <button
                    key={f.value}
                    onClick={() => toggleField(f.value)}
                    style={{
                      flex: 1, padding: "9px 12px", borderRadius: 8, cursor: "pointer",
                      background: on ? "rgba(239,68,68,0.1)" : "rgba(255,255,255,0.03)",
                      border: `1px solid ${on ? "rgba(239,68,68,0.35)" : "rgba(255,255,255,0.06)"}`,
                      color: on ? "#f87171" : "#475569", fontSize: 12, fontWeight: 700,
                      transition: "all 0.15s",
                    }}
                  >
                    {on ? "🔒 " : "🔓 "}{f.label}
                  </button>
                );
              })}
            </div>
            {perms.hiddenFields.length > 0 && (
              <p style={{ color: "#64748b", fontSize: 11, marginTop: 6 }}>
                ⚠ Hidden fields are removed server-side — not just hidden in UI.
              </p>
            )}
          </section>
        )}

        {/* Date Range */}
        {showDateRange && (
          <section>
            <label style={{ color: "#94a3b8", fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", display: "block", marginBottom: 10 }}>
              Date Range Restriction
            </label>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <div style={{ flex: 1 }}>
                <div style={{ color: "#64748b", fontSize: 11, marginBottom: 4 }}>From</div>
                <input
                  type="date"
                  value={perms.dateFrom}
                  onChange={(e) => setPerms((p) => ({ ...p, dateFrom: e.target.value }))}
                  style={{
                    width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: 8, padding: "8px 10px", color: "#e2e8f0", fontSize: 12,
                    colorScheme: "dark", outline: "none",
                  }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ color: "#64748b", fontSize: 11, marginBottom: 4 }}>To</div>
                <input
                  type="date"
                  value={perms.dateTo}
                  onChange={(e) => setPerms((p) => ({ ...p, dateTo: e.target.value }))}
                  style={{
                    width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: 8, padding: "8px 10px", color: "#e2e8f0", fontSize: 12,
                    colorScheme: "dark", outline: "none",
                  }}
                />
              </div>
              {(perms.dateFrom || perms.dateTo) && (
                <button
                  onClick={() => setPerms((p) => ({ ...p, dateFrom: "", dateTo: "" }))}
                  style={{ marginTop: 18, color: "#ef4444", background: "none", border: "none", cursor: "pointer", fontSize: 18 }}
                >
                  ✕
                </button>
              )}
            </div>
          </section>
        )}

        {/* Save */}
        <div style={{ marginTop: "auto", paddingTop: 16, borderTop: "1px solid rgba(255,255,255,0.05)" }}>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              width: "100%", padding: "12px", borderRadius: 10, cursor: saving ? "not-allowed" : "pointer",
              background: saving ? "#1e1e2e" : "linear-gradient(135deg,#4f46e5,#6366f1)",
              border: "none", color: "#fff", fontSize: 14, fontWeight: 700,
              opacity: saving ? 0.6 : 1, transition: "all 0.15s",
            }}
          >
            {saving ? "Saving…" : "Save Permissions"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Sub-component: Add User Modal ─────────────────────────────────────────────
function AddUserModal({ onClose, onCreated }) {
  const [form, setForm] = useState({
    fullName: "", email: "", phone: "", password: "", age: "",
    role: "data_entry",
    permissions: {
      allowedModules: [], allowedActions: ["view", "add"],
      hiddenFields: [], dateFrom: "", dateTo: "",
    },
  });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await axios.post("/users", {
        ...form,
        age: Number(form.age),
        permissions: {
          ...form.permissions,
          dateFrom: form.permissions.dateFrom || null,
          dateTo:   form.permissions.dateTo   || null,
        },
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
    width: "100%", background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8,
    padding: "10px 12px", color: "#e2e8f0", fontSize: 13, outline: "none",
    boxSizing: "border-box",
  };
  const labelStyle = { color: "#94a3b8", fontSize: 11, fontWeight: 700, marginBottom: 4, display: "block" };

  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ background: "#13131f", border: "1px solid rgba(99,102,241,0.15)", borderRadius: 16, width: "min(480px,100%)", maxHeight: "90vh", overflowY: "auto", padding: 28 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <h2 style={{ color: "#fff", fontSize: 18, fontWeight: 700, margin: 0 }}>Create New User</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", fontSize: 18 }}>✕</button>
        </div>
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={labelStyle}>Full Name</label>
            <input required style={inputStyle} placeholder="Full Name" value={form.fullName} onChange={(e) => set("fullName", e.target.value)} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={labelStyle}>Email</label>
              <input required type="email" style={inputStyle} placeholder="Email" value={form.email} onChange={(e) => set("email", e.target.value)} />
            </div>
            <div>
              <label style={labelStyle}>Phone</label>
              <input required style={inputStyle} placeholder="Phone" value={form.phone} onChange={(e) => set("phone", e.target.value)} />
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={labelStyle}>Password</label>
              <input required type="password" style={inputStyle} placeholder="Min 8 chars" value={form.password} onChange={(e) => set("password", e.target.value)} />
            </div>
            <div>
              <label style={labelStyle}>Age</label>
              <input required type="number" min="13" max="120" style={inputStyle} placeholder="Age" value={form.age} onChange={(e) => set("age", e.target.value)} />
            </div>
          </div>
          <div>
            <label style={labelStyle}>Role</label>
            <select
              style={{ ...inputStyle, colorScheme: "dark" }}
              value={form.role}
              onChange={(e) => set("role", e.target.value)}
            >
              {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </div>
          <button
            type="submit"
            disabled={saving}
            style={{
              marginTop: 8, padding: "12px", borderRadius: 10,
              background: saving ? "#1e1e2e" : "linear-gradient(135deg,#4f46e5,#6366f1)",
              border: "none", color: "#fff", fontSize: 14, fontWeight: 700,
              cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.6 : 1,
            }}
          >
            {saving ? "Creating…" : "Create User"}
          </button>
        </form>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function AccessControlPage() {
  const navigate = useNavigate();
  const { user: me, isFullAdmin } = useAuthStore();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [editUser, setEditUser] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [togglingId, setTogglingId] = useState(null);

  useEffect(() => {
    if (!isFullAdmin()) { navigate("/"); }
  }, [me]); // eslint-disable-line

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get("/users");
      setUsers(res.data?.data?.users || []);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load users.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleToggleStatus = async (u) => {
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
    try {
      await axios.delete(`/users/${u._id}`);
      toast.success("User deleted.");
      setDeleteTarget(null);
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete user.");
    }
  };

  const filtered = users.filter((u) =>
    !search ||
    u.fullName?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase()) ||
    u.role?.toLowerCase().includes(search.toLowerCase())
  );

  const stats = {
    total:        users.length,
    fullAdmins:   users.filter((u) => u.role === "full_admin" || u.role === "admin").length,
    partialAdmins:users.filter((u) => u.role === "partial_admin").length,
    dataEntry:    users.filter((u) => u.role === "data_entry").length,
    active:       users.filter((u) => u.isActive).length,
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0c0c14" }}>
      <Navbar />

      {showAdd && (
        <AddUserModal onClose={() => setShowAdd(false)} onCreated={fetchUsers} />
      )}
      {editUser && (
        <PermissionPanel user={editUser} onClose={() => setEditUser(null)} onSaved={fetchUsers} />
      )}

      {/* Delete confirm */}
      {deleteTarget && (
        <div style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div style={{ background: "#13131f", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 16, padding: 28, maxWidth: 380, width: "100%" }}>
            <h3 style={{ color: "#fff", margin: "0 0 8px", fontSize: 16, fontWeight: 700 }}>Delete User?</h3>
            <p style={{ color: "#94a3b8", fontSize: 13, margin: "0 0 20px" }}>
              Permanently delete <strong style={{ color: "#e2e8f0" }}>{deleteTarget.fullName}</strong>? This cannot be undone.
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setDeleteTarget(null)} style={{ flex: 1, padding: "10px", borderRadius: 9, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "#94a3b8", cursor: "pointer", fontWeight: 600, fontSize: 13 }}>Cancel</button>
              <button onClick={() => handleDelete(deleteTarget)} style={{ flex: 1, padding: "10px", borderRadius: 9, background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)", color: "#f87171", cursor: "pointer", fontWeight: 700, fontSize: 13 }}>Delete</button>
            </div>
          </div>
        </div>
      )}

      <div style={{ maxWidth: 1400, margin: "0 auto", padding: "28px 20px 60px" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <div style={{ width: 4, height: 20, borderRadius: 4, background: "linear-gradient(180deg,#6366f1,#6366f144)" }} />
              <span style={{ color: "#475569", fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" }}>
                Full Admin · Access Control
              </span>
            </div>
            <h1 style={{ color: "#fff", fontSize: 24, fontWeight: 800, margin: 0 }}>User Management</h1>
          </div>
          <button
            onClick={() => setShowAdd(true)}
            style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "10px 18px", borderRadius: 12, border: "none", cursor: "pointer",
              background: "linear-gradient(135deg,#4f46e5,#6366f1)",
              color: "#fff", fontSize: 13, fontWeight: 700,
              boxShadow: "0 4px 20px rgba(99,102,241,0.3)",
            }}
          >
            <span style={{ fontSize: 15 }}>+</span> Add User
          </button>
        </div>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: 12, marginBottom: 24 }}>
          {[
            { label: "Total Users",   value: stats.total,         color: "#6366f1" },
            { label: "Full Admins",   value: stats.fullAdmins,    color: "#f59e0b" },
            { label: "Partial Admins",value: stats.partialAdmins, color: "#8b5cf6" },
            { label: "Data Entry",    value: stats.dataEntry,     color: "#10b981" },
            { label: "Active",        value: stats.active,        color: "#06b6d4" },
          ].map((s) => (
            <div
              key={s.label}
              style={{
                background: "#13131f", border: `1px solid ${s.color}20`,
                borderRadius: 14, padding: "16px 18px",
              }}
            >
              <div style={{ color: s.color, fontSize: 26, fontWeight: 800, lineHeight: 1 }}>{s.value}</div>
              <div style={{ color: "#475569", fontSize: 11, fontWeight: 600, marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Search */}
        <div style={{ background: "#13131f", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, padding: "12px 16px", marginBottom: 16, display: "flex", alignItems: "center", gap: 12 }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#475569" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
          <input
            type="text"
            placeholder="Search users by name, email, or role…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ background: "none", border: "none", outline: "none", color: "#e2e8f0", fontSize: 13, flex: 1 }}
          />
          {search && (
            <button onClick={() => setSearch("")} style={{ background: "none", border: "none", color: "#475569", cursor: "pointer", fontSize: 16 }}>✕</button>
          )}
          <span style={{ color: "#334155", fontSize: 12, fontWeight: 600 }}>
            {loading ? "Loading…" : `${filtered.length} user${filtered.length !== 1 ? "s" : ""}`}
          </span>
        </div>

        {/* Table */}
        <div style={{ background: "#13131f", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16, overflow: "hidden" }}>
          {/* Table Head */}
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1.5fr 1fr 1fr 1fr 1fr auto", gap: 0, borderBottom: "1px solid rgba(255,255,255,0.05)", padding: "10px 20px", alignItems: "center" }}>
            {["User", "Email / Phone", "Role", "Modules", "Actions", "Status", ""].map((h) => (
              <span key={h} style={{ color: "#334155", fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>{h}</span>
            ))}
          </div>

          {/* Rows */}
          {loading ? (
            <div style={{ padding: "48px 20px", textAlign: "center", color: "#334155" }}>
              <div style={{ width: 32, height: 32, border: "2px solid #6366f1", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.7s linear infinite", margin: "0 auto 12px" }} />
              Loading users…
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: "48px 20px", textAlign: "center", color: "#334155", fontSize: 14 }}>
              {search ? "No users match your search." : "No users found."}
            </div>
          ) : (
            filtered.map((u, i) => {
              const isMe = u._id === me?._id;
              const mods = u.permissions?.allowedModules ?? [];
              const acts = u.permissions?.allowedActions ?? [];
              return (
                <div
                  key={u._id}
                  style={{
                    display: "grid", gridTemplateColumns: "2fr 1.5fr 1fr 1fr 1fr 1fr auto",
                    gap: 0, padding: "14px 20px", alignItems: "center",
                    borderBottom: i < filtered.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
                    opacity: u.isActive ? 1 : 0.5,
                    transition: "background 0.1s",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.02)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                >
                  {/* User */}
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <img
                      src={u.avatar}
                      alt={u.fullName}
                      style={{ width: 34, height: 34, borderRadius: 9, objectFit: "cover", border: "1px solid rgba(255,255,255,0.08)", flexShrink: 0 }}
                    />
                    <div>
                      <div style={{ color: "#e2e8f0", fontSize: 13, fontWeight: 600 }}>
                        {u.fullName} {isMe && <span style={{ color: "#6366f1", fontSize: 10 }}>(you)</span>}
                      </div>
                      <div style={{ color: "#334155", fontSize: 11, marginTop: 1 }}>
                        Last login: {u.lastLogin ? new Date(u.lastLogin).toLocaleDateString("en-IN") : "Never"}
                      </div>
                    </div>
                  </div>

                  {/* Email / Phone */}
                  <div>
                    <div style={{ color: "#64748b", fontSize: 12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{u.email}</div>
                    <div style={{ color: "#334155", fontSize: 11 }}>{u.phone}</div>
                  </div>

                  {/* Role */}
                  <div><RoleBadge role={u.role} /></div>

                  {/* Modules */}
                  <div style={{ color: "#475569", fontSize: 11 }}>
                    {(u.role === "admin" || u.role === "full_admin")
                      ? <span style={{ color: "#f59e0b80", fontSize: 11 }}>All</span>
                      : mods.length > 0
                        ? <span style={{ color: "#6366f180" }}>{mods.slice(0, 2).join(", ")}{mods.length > 2 ? ` +${mods.length - 2}` : ""}</span>
                        : <span style={{ color: "#1e293b" }}>None</span>
                    }
                  </div>

                  {/* Actions */}
                  <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                    {(u.role === "admin" || u.role === "full_admin")
                      ? <span style={{ color: "#f59e0b60", fontSize: 11 }}>All</span>
                      : acts.length > 0
                        ? acts.map((a) => (
                            <span key={a} style={{ background: "rgba(99,102,241,0.1)", color: "#6366f1", fontSize: 10, padding: "1px 6px", borderRadius: 99, fontWeight: 600 }}>{a}</span>
                          ))
                        : <span style={{ color: "#1e293b", fontSize: 11 }}>None</span>
                    }
                  </div>

                  {/* Status Toggle */}
                  <div>
                    <button
                      onClick={() => !isMe && handleToggleStatus(u)}
                      disabled={isMe || togglingId === u._id}
                      title={isMe ? "Cannot change own status" : (u.isActive ? "Deactivate" : "Activate")}
                      style={{
                        position: "relative", width: 36, height: 20, borderRadius: 99, border: "none",
                        background: u.isActive ? "rgba(16,185,129,0.25)" : "rgba(100,116,139,0.2)",
                        cursor: isMe ? "not-allowed" : "pointer", transition: "all 0.2s",
                        display: "flex", alignItems: "center", padding: "2px 3px",
                      }}
                    >
                      <div style={{
                        width: 14, height: 14, borderRadius: "50%", transition: "all 0.2s",
                        background: u.isActive ? "#10b981" : "#475569",
                        transform: u.isActive ? "translateX(16px)" : "translateX(0)",
                        boxShadow: u.isActive ? "0 0 6px #10b98180" : "none",
                      }} />
                    </button>
                  </div>

                  {/* Actions */}
                  <div style={{ display: "flex", gap: 6 }}>
                    <button
                      onClick={() => setEditUser(u)}
                      title="Edit permissions"
                      style={{ background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.2)", color: "#6366f1", borderRadius: 7, padding: "5px 9px", cursor: "pointer", fontSize: 12, fontWeight: 600 }}
                    >
                      Edit
                    </button>
                    {!isMe && (
                      <button
                        onClick={() => setDeleteTarget(u)}
                        title="Delete user"
                        style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171", borderRadius: 7, padding: "5px 9px", cursor: "pointer", fontSize: 12 }}
                      >
                        🗑
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

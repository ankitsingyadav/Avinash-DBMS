// pages/DashboardPage.jsx
import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import useAuthStore from "../context/authStore";
import axios from "../utils/axios.js";

// ─── Stat card accent config ──────────────────────────────────────────────────
const STAT_CONFIG = {
  school: {
    label:    "Schools",
    tab:      "school",
    accent:   "#6366f1",
    bg:       "rgba(99,102,241,0.08)",
    border:   "rgba(99,102,241,0.18)",
    endpoint: "/organisations/schools",
    dataKey:  "schools",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5zm0 0v6m-4-4v4m8-4v4M3 21h18"/>
      </svg>
    ),
    breakdowns: [
      { key: "school_type", value: "Government", label: "Government", color: "#10b981" },
      { key: "school_type", value: "Private",    label: "Private",    color: "#f59e0b" },
    ],
  },
  college: {
    label:    "Colleges",
    tab:      "college",
    accent:   "#0ea5e9",
    bg:       "rgba(14,165,233,0.08)",
    border:   "rgba(14,165,233,0.18)",
    endpoint: "/organisations/colleges",
    dataKey:  "colleges",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4"/>
      </svg>
    ),
    breakdowns: [
      { key: "college_type", value: "University", label: "University", color: "#6366f1" },
      { key: "college_type", value: "Private",    label: "Private",    color: "#f59e0b" },
      { key: "college_type", value: "Government", label: "Government", color: "#10b981" },
    ],
  },
  ngo: {
    label:    "NGOs",
    tab:      "ngo",
    accent:   "#10b981",
    bg:       "rgba(16,185,129,0.08)",
    border:   "rgba(16,185,129,0.18)",
    endpoint: "/organisations/ngos",
    dataKey:  "ngos",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
      </svg>
    ),
    breakdowns: [
      { key: "ngo_type", value: "Trust",      label: "Trust",      color: "#6366f1" },
      { key: "ngo_type", value: "Society",    label: "Society",    color: "#0ea5e9" },
      { key: "ngo_type", value: "Foundation", label: "Foundation", color: "#f59e0b" },
    ],
  },
  volunteer: {
    label:    "Volunteers",
    tab:      "volunteer",
    accent:   "#f59e0b",
    bg:       "rgba(245,158,11,0.08)",
    border:   "rgba(245,158,11,0.18)",
    endpoint: "/organisations/volunteers",
    dataKey:  "volunteers",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>
      </svg>
    ),
    breakdowns: [
      { key: "area_of_interest", value: "Teaching",    label: "Teaching",    color: "#6366f1" },
      { key: "area_of_interest", value: "Tech",        label: "Tech",        color: "#0ea5e9" },
      { key: "area_of_interest", value: "Social Work", label: "Social Work", color: "#10b981" },
      { key: "area_of_interest", value: "Healthcare",  label: "Healthcare",  color: "#f59e0b" },
    ],
  },
};

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
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1 rounded-full bg-slate-800/80 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
    </div>
  );
}

// ─── Stat card ────────────────────────────────────────────────────────────────
function StatCard({ config, onNavigate }) {
  const [stats, setStats]   = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch total + each breakdown in parallel
        const requests = [
          axios.get(`${config.endpoint}?limit=1`),
          ...config.breakdowns.map((b) =>
            axios.get(`${config.endpoint}?limit=1&${b.key}=${encodeURIComponent(b.value)}`)
          ),
          // Active count
          axios.get(`${config.endpoint}?limit=1&status=Active`),
        ];
        const results = await Promise.all(requests);
        const getTotal = (res) => res.data?.data?.total ?? res.data?.total ?? 0;

        setStats({
          total:      getTotal(results[0]),
          breakdowns: config.breakdowns.map((b, i) => ({
            ...b,
            count: getTotal(results[i + 1]),
          })),
          active: getTotal(results[results.length - 1]),
        });
      } catch {
        setStats({ total: 0, breakdowns: config.breakdowns.map((b) => ({ ...b, count: 0 })), active: 0 });
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [config]);

  const inactiveCount = stats ? stats.total - stats.active : 0;

  return (
    <div
      onClick={() => onNavigate(config.tab)}
      className="group relative rounded-2xl p-5 cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-2xl"
      style={{
        background:   config.bg,
        border:       `1px solid ${config.border}`,
        boxShadow:    `0 4px 24px ${config.accent}10`,
      }}
    >
      {/* Hover glow */}
      <div
        className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{ background: `radial-gradient(ellipse at 50% 0%, ${config.accent}12, transparent 70%)` }}
      />

      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center"
          style={{ background: `${config.accent}15`, border: `1px solid ${config.accent}25` }}>
          <span style={{ color: config.accent }}>{config.icon}</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500 group-hover:text-slate-400 transition-colors">
          View all
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"/>
          </svg>
        </div>
      </div>

      {/* Total count */}
      <div className="mb-1">
        <p className="text-3xl font-bold text-white tracking-tight">
          {loading ? (
            <span className="inline-block w-16 h-8 bg-slate-800/80 rounded-lg animate-pulse" />
          ) : (
            <Counter value={stats?.total ?? 0} />
          )}
        </p>
        <p className="text-sm font-medium mt-0.5" style={{ color: config.accent }}>
          {config.label}
        </p>
      </div>

      {/* Active / Inactive pill row */}
      {!loading && stats && (
        <div className="flex items-center gap-2 mb-4">
          <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/15">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            {stats.active} Active
          </span>
          {inactiveCount > 0 && (
            <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium bg-slate-700/50 text-slate-500 border border-slate-700/40">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-600" />
              {inactiveCount} Inactive
            </span>
          )}
        </div>
      )}

      {/* Breakdown bars */}
      <div className="space-y-2.5 border-t border-slate-800/40 pt-3">
        {loading ? (
          Array.from({ length: config.breakdowns.length }).map((_, i) => (
            <div key={i} className="space-y-1">
              <div className="h-2.5 w-24 bg-slate-800/80 rounded animate-pulse" />
              <div className="h-1 w-full bg-slate-800/80 rounded animate-pulse" />
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
      style={{ background: "rgba(30,41,59,0.4)", border: "1px solid rgba(51,65,85,0.3)" }}>
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors"
        style={{ background: `${accent}15`, border: `1px solid ${accent}20` }}>
        <span style={{ color: accent }}>{icon}</span>
      </div>
      <div className="text-left min-w-0">
        <p className="text-sm font-medium text-slate-200 group-hover:text-white transition-colors">{label}</p>
        {sublabel && <p className="text-xs text-slate-600 truncate">{sublabel}</p>}
      </div>
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        className="ml-auto text-slate-700 group-hover:text-slate-400 shrink-0 transition-colors">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5"/>
      </svg>
    </button>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { user, updateProfile, isLoading } = useAuthStore();
  const navigate = useNavigate();
  const fileRef  = useRef(null);

  const [editMode, setEditMode]   = useState(false);
  const [form, setForm]           = useState({
    fullName: user?.fullName || "",
    phone:    user?.phone    || "",
    age:      user?.age      || "",
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
    if (form.fullName !== user.fullName) fd.append("fullName", form.fullName);
    if (form.phone    !== user.phone)    fd.append("phone",    form.phone);
    if (form.age      !== user.age)      fd.append("age",      form.age);
    if (imageFile) fd.append("profileImage", imageFile);
    const result = await updateProfile(fd);
    if (result.success) { setEditMode(false); setPreview(null); setImageFile(null); }
  };

  const handleCardClick = (tab) => {
    navigate("/admin", { state: { tab } });
  };

  const avatarUrl = preview || user?.profileImage?.url;
  const initials  = user?.fullName?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  const isAdmin   = user?.role === "admin";

  return (
    <div className="auth-bg min-h-screen flex flex-col">
      <Navbar />

      <div className="max-w-5xl mx-auto px-4 py-8 w-full flex-1">

        {/* ── Welcome banner ── */}
        <div className="flex items-center justify-between mb-7 flex-wrap gap-3">
          <div>
            <p className="text-slate-500 text-xs font-semibold uppercase tracking-widest mb-0.5">
              {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}
            </p>
            <h1 className="text-2xl font-bold text-white">
              Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 17 ? "afternoon" : "evening"},{" "}
              <span style={{ color: "#6366f1" }}>{user?.fullName?.split(" ")[0]}</span> 👋
            </h1>
          </div>
          {isAdmin && (
            <button
              onClick={() => navigate("/admin")}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all hover:-translate-y-0.5"
              style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)", boxShadow: "0 4px 20px rgba(99,102,241,0.25)" }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0H3"/>
              </svg>
              Open Admin Panel
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* ── LEFT COL: Profile card + Quick actions ── */}
          <div className="flex flex-col gap-4">

            {/* Profile card */}
            <div className="auth-card">
              <div className="flex items-start gap-4 mb-5">
                <div className="relative shrink-0">
                  <div className="w-16 h-16 rounded-2xl overflow-hidden ring-2 ring-indigo-500/30">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt={user?.fullName} className="w-full h-full object-cover"/>
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center">
                        <span className="text-white text-lg font-bold">{initials}</span>
                      </div>
                    )}
                  </div>
                  {editMode && (
                    <button type="button" onClick={() => fileRef.current.click()}
                      className="absolute -bottom-1 -right-1 w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center border-2 border-[#0f0f18] hover:bg-indigo-500 transition-colors">
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
                    <h2 className="text-base font-bold text-white truncate">{user?.fullName}</h2>
                    <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold shrink-0 ${
                      isAdmin
                        ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                        : "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
                    }`}>
                      {user?.role?.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-slate-400 text-xs truncate">{user?.email}</p>
                  <p className="text-slate-500 text-xs">{user?.phone}</p>
                </div>
              </div>

              {/* Stats row */}
              <div className="grid grid-cols-3 gap-2 mb-4">
                {[
                  { label: "Age",    value: user?.age ? `${user.age}y` : "—" },
                  { label: "Joined", value: user?.createdAt ? new Date(user.createdAt).toLocaleDateString("en-IN", { month: "short", year: "2-digit" }) : "—" },
                  { label: "Login",  value: user?.lastLogin  ? new Date(user.lastLogin).toLocaleDateString("en-IN", { month: "short", day: "numeric" }) : "Today" },
                ].map((s) => (
                  <div key={s.label} className="bg-slate-800/40 rounded-xl p-2.5 border border-slate-700/30 text-center">
                    <p className="text-white font-semibold text-sm">{s.value}</p>
                    <p className="text-slate-500 text-xs mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>

              {/* Edit toggle */}
              <button
                onClick={() => setEditMode((p) => !p)}
                className={`w-full text-sm px-3.5 py-2 rounded-lg font-medium transition-all ${
                  editMode
                    ? "bg-slate-700 text-slate-300 hover:bg-slate-600"
                    : "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 hover:bg-indigo-500/20"
                }`}>
                {editMode ? "Cancel" : "Edit Profile"}
              </button>

              {editMode && (
                <form onSubmit={handleUpdate} className="space-y-3 pt-4 mt-3 border-t border-slate-700/50">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="field-label">Full Name</label>
                      <input value={form.fullName} onChange={(e) => setForm((p) => ({ ...p, fullName: e.target.value }))} className="field-input" placeholder="Full name"/>
                    </div>
                    <div>
                      <label className="field-label">Age</label>
                      <input type="number" value={form.age} onChange={(e) => setForm((p) => ({ ...p, age: e.target.value }))} className="field-input" placeholder="Age" min="13" max="120"/>
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
              <div className="auth-card">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Quick Actions</p>
                <div className="space-y-2">
                  <QuickAction
                    accent="#6366f1"
                    label="Add New School"
                    sublabel="Register a school"
                    onClick={() => navigate("/admin", { state: { tab: "school", action: "add" } })}
                    icon={<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15"/></svg>}
                  />
                  <QuickAction
                    accent="#0ea5e9"
                    label="Add New College"
                    sublabel="Register a college"
                    onClick={() => navigate("/admin", { state: { tab: "college", action: "add" } })}
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

          
            <div className="auth-card">
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Security</h3>
              <div className="flex items-center justify-between py-2.5 border-b border-slate-800/60">
                <div>
                  <p className="text-sm text-slate-200 font-medium">Password</p>
                  <p className="text-xs text-slate-500 mt-0.5">Change your account password</p>
                </div>
                <button onClick={() => navigate("/login")} className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors">
                  Change →
                </button>
              </div>
              <div className="flex items-center justify-between py-2.5">
                <div>
                  <p className="text-sm text-slate-200 font-medium">Account Status</p>
                  <p className="text-xs text-slate-500 mt-0.5">Your account is active and secure</p>
                </div>
                <span className="text-xs text-emerald-400 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"/>
                  Active
                </span>
              </div>
            </div>
          </div>

          {/* ── RIGHT COL: Stat cards (2×2 grid) ── */}
          <div className="lg:col-span-2 flex flex-col gap-4">

            {/* Section header */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-white">Organisation Overview</h2>
                <p className="text-xs text-slate-500 mt-0.5">Click any card to open that section in the admin panel</p>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-600">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"/>
                Live data
              </div>
            </div>

            {/* 2×2 stat grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {Object.entries(STAT_CONFIG).map(([key, config]) => (
                <StatCard key={key} config={config} onNavigate={handleCardClick} />
              ))}
            </div>

            {/* Follow-up reminder card */}
            <FollowUpCard onNavigate={handleCardClick} />
          </div>
        </div>
      </div>

      <footer className="border-t border-slate-800/60 py-5 text-center mt-6">
        <p className="text-slate-600 text-xs">© {new Date().getFullYear()} DB Manager. All rights reserved.</p>
      </footer>
    </div>
  );
}

// ─── Follow-up reminder card ──────────────────────────────────────────────────
// Shows records whose follow_up_date is today or in the past (overdue)
function FollowUpCard({ onNavigate }) {
  const [items, setItems]     = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const today    = new Date().toISOString().split("T")[0];
    const weekAgo  = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

    const endpoints = [
      { label: "School",    tab: "school",    url: `/organisations/schools?limit=3&dateFrom=${weekAgo}&dateTo=${today}&sortField=follow_up_date&sortDir=asc`,    accent: "#6366f1" },
      { label: "College",   tab: "college",   url: `/organisations/colleges?limit=3&dateFrom=${weekAgo}&dateTo=${today}&sortField=follow_up_date&sortDir=asc`,   accent: "#0ea5e9" },
      { label: "NGO",       tab: "ngo",       url: `/organisations/ngos?limit=3&dateFrom=${weekAgo}&dateTo=${today}&sortField=follow_up_date&sortDir=asc`,       accent: "#10b981" },
      { label: "Volunteer", tab: "volunteer", url: `/organisations/volunteers?limit=3&dateFrom=${weekAgo}&dateTo=${today}&sortField=follow_up_date&sortDir=asc`, accent: "#f59e0b" },
    ];

    Promise.all(endpoints.map((e) => axios.get(e.url).catch(() => null)))
      .then((results) => {
        const all = [];
        results.forEach((res, i) => {
          const data = res?.data?.data ?? res?.data ?? {};
          const key  = ["schools","colleges","ngos","volunteers"][i];
          (data[key] || []).forEach((r) => {
            all.push({ ...r, _catLabel: endpoints[i].label, _tab: endpoints[i].tab, _accent: endpoints[i].accent });
          });
        });
        // Sort by follow_up_date ascending
        all.sort((a, b) => new Date(a.follow_up_date) - new Date(b.follow_up_date));
        setItems(all.slice(0, 5));
      })
      .finally(() => setLoading(false));
  }, []);

  const fmtDate = (d) => new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
  const isOverdue = (d) => new Date(d) < new Date(new Date().setHours(0,0,0,0));

  if (!loading && items.length === 0) return null;

  return (
    <div className="auth-card">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          <h3 className="text-sm font-semibold text-white">Pending Follow-ups</h3>
        </div>
        <span className="text-xs text-slate-500">Last 7 days</span>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1,2,3].map((i) => (
            <div key={i} className="h-10 bg-slate-800/60 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <button
              key={item._id}
              onClick={() => onNavigate(item._tab)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all hover:translate-x-0.5 text-left group"
              style={{ background: `${item._accent}08`, border: `1px solid ${item._accent}18` }}>
              <div className="w-2 h-2 rounded-full shrink-0" style={{ background: item._accent }} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{item.name}</p>
                <p className="text-xs text-slate-500">{item._catLabel}</p>
              </div>
              <div className="text-right shrink-0">
                <p className={`text-xs font-semibold ${isOverdue(item.follow_up_date) ? "text-red-400" : "text-amber-400"}`}>
                  {fmtDate(item.follow_up_date)}
                </p>
                <p className="text-xs text-slate-600">{isOverdue(item.follow_up_date) ? "Overdue" : "Due"}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
// pages/ProfilePage.jsx
import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import useAuthStore from "../context/authStore";

export default function ProfilePage() {
  const { user, updateProfile, isLoading } = useAuthStore();
  const navigate = useNavigate();
  const fileRef  = useRef(null);

  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({
    fullName: user?.fullName || "",
    phone:    user?.phone    || "",
    age:      user?.age      || "",
  });
  const [preview, setPreview]     = useState(null);
  const [imageFile, setImageFile] = useState(null);

  const isAdmin  = user?.role === "admin";

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const dateStr  = new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" });
  const avatarUrl = preview || user?.profileImage?.url;
  const initials  = user?.fullName
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

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
    if (result.success) {
      setEditMode(false);
      setPreview(null);
      setImageFile(null);
    }
  };

  const handleCancel = () => {
    setEditMode(false);
    setPreview(null);
    setImageFile(null);
    setForm({
      fullName: user?.fullName || "",
      phone:    user?.phone    || "",
      age:      user?.age      || "",
    });
  };

  return (
    <div className="auth-bg min-h-screen flex flex-col">
      <Navbar />

      <div className="max-w-2xl mx-auto px-4 py-10 w-full flex-1">

        {/* ── Page Header ── */}
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 transition-colors mb-5"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"/>
            </svg>
            Back
          </button>
          <p className="text-slate-500 text-xs font-semibold uppercase tracking-widest mb-0.5">{dateStr}</p>
          <h1 className="text-2xl font-bold text-white">{greeting}, <span style={{ color: "#6366f1" }}>{user?.fullName?.split(" ")[0]}</span> 👋</h1>
          <p className="text-slate-500 text-sm mt-1">Manage your personal information and account settings</p>
        </div>

        <div className="space-y-4">

          {/* ── Avatar + Basic Info Card ── */}
          <div className="auth-card">

            {/* Avatar row */}
            <div className="flex items-center gap-5 mb-6 pb-6 border-b border-slate-800/60">
              <div className="relative shrink-0">
                <div className="w-20 h-20 rounded-2xl overflow-hidden ring-2 ring-indigo-500/30">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt={user?.fullName} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center">
                      <span className="text-white text-2xl font-bold">{initials}</span>
                    </div>
                  )}
                </div>
                {editMode && (
                  <button
                    type="button"
                    onClick={() => fileRef.current.click()}
                    className="absolute -bottom-1 -right-1 w-7 h-7 bg-indigo-600 rounded-full flex items-center justify-center border-2 border-[#0f0f18] hover:bg-indigo-500 transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z"/>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z"/>
                    </svg>
                  </button>
                )}
                <input ref={fileRef} type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <h2 className="text-lg font-bold text-white">{user?.fullName}</h2>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold shrink-0 ${
                    isAdmin
                      ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                      : "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
                  }`}>
                    {user?.role?.toUpperCase()}
                  </span>
                </div>
                <p className="text-slate-400 text-sm">{user?.email}</p>
                <p className="text-slate-500 text-sm">{user?.phone || "No phone added"}</p>
              </div>

              {/* Edit toggle */}
              <button
                onClick={() => editMode ? handleCancel() : setEditMode(true)}
                className={`shrink-0 text-sm px-4 py-2 rounded-lg font-medium transition-all ${
                  editMode
                    ? "bg-slate-700 text-slate-300 hover:bg-slate-600"
                    : "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 hover:bg-indigo-500/20"
                }`}
              >
                {editMode ? "Cancel" : "Edit"}
              </button>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-3 mb-5">
              {[
                { label: "Age",     value: user?.age ? `${user.age}y` : "—" },
                { label: "Joined",  value: user?.createdAt ? new Date(user.createdAt).toLocaleDateString("en-IN", { month: "short", year: "numeric" }) : "—" },
                { label: "Last Login", value: user?.lastLogin ? new Date(user.lastLogin).toLocaleDateString("en-IN", { month: "short", day: "numeric" }) : "Today" },
              ].map((s) => (
                <div key={s.label} className="bg-slate-800/40 rounded-xl p-3 border border-slate-700/30 text-center">
                  <p className="text-white font-semibold text-sm">{s.value}</p>
                  <p className="text-slate-500 text-xs mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Edit Form */}
            {editMode && (
              <form onSubmit={handleUpdate} className="space-y-3 pt-4 border-t border-slate-700/50">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Edit Information</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="field-label">Full Name</label>
                    <input
                      value={form.fullName}
                      onChange={(e) => setForm((p) => ({ ...p, fullName: e.target.value }))}
                      className="field-input"
                      placeholder="Full name"
                    />
                  </div>
                  <div>
                    <label className="field-label">Age</label>
                    <input
                      type="number"
                      value={form.age}
                      onChange={(e) => setForm((p) => ({ ...p, age: e.target.value }))}
                      className="field-input"
                      placeholder="Age"
                      min="13"
                      max="120"
                    />
                  </div>
                </div>
                <div>
                  <label className="field-label">Phone  Number</label>
                  <input
                    value={form.phone}
                    onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                    className="field-input"
                    placeholder="+91 9876543210"
                  />
                </div>
                <button type="submit" disabled={isLoading} className="btn-primary">
                  {isLoading
                    ? <span className="flex items-center justify-center gap-2"><span className="loader" /> Saving...</span>
                    : "Save Changes →"}
                </button>
              </form>
            )}
          </div>

          {/* ── Account Info Card ── */}
          <div className="auth-card">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">Account Details</p>
            <div className="space-y-3">
              {[
                { label: "Email Address", value: user?.email, icon: (
                  <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"/>
                  </svg>
                )},
                { label: "Role", value: user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1), icon: (
                  <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"/>
                  </svg>
                )},
                { label: "Member Since", value: user?.createdAt ? new Date(user.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }) : "—", icon: (
                  <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"/>
                  </svg>
                )},
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-3 py-2.5 border-b border-slate-800/40 last:border-0">
                  <span className="text-slate-500 shrink-0">{item.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-slate-500">{item.label}</p>
                    <p className="text-sm text-slate-200 font-medium truncate">{item.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Security Card ── */}
          <div className="auth-card">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">Security</p>
            <div className="space-y-1">

              {/* Password */}
              <div className="flex items-center justify-between py-3 border-b border-slate-800/40">
                <div className="flex items-center gap-3">
                  <span className="text-slate-500">
                    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"/>
                    </svg>
                  </span>
                  <div>
                    <p className="text-sm text-slate-200 font-medium">Password</p>
                    <p className="text-xs text-slate-500">Change your account password</p>
                  </div>
                </div>
                <button
                  onClick={() => navigate("/login")}
                  className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors font-medium"
                >
                  Change →
                </button>
              </div>

              {/* Account Status */}
              <div className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <span className="text-slate-500">
                    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"/>
                    </svg>
                  </span>
                  <div>
                    <p className="text-sm text-slate-200 font-medium">Account Status</p>
                    <p className="text-xs text-slate-500">Your account is active and secure</p>
                  </div>
                </div>
                <span className="text-xs text-emerald-400 flex items-center gap-1.5 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Active
                </span>
              </div>
            </div>
          </div>

          {/* ── Admin shortcuts (only for admin) ── */}
          {isAdmin && (
            <div className="auth-card">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Quick Navigation</p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  {
                    label: "Dashboard",
                    sub: "Overview & stats",
                    to: "/dashboard",
                    accent: "#6366f1",
                    icon: (
                      <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z"/>
                      </svg>
                    ),
                  },
                  {
                    label: "Admin Panel",
                    sub: "Manage records",
                    to: "/admin",
                    accent: "#f59e0b",
                    icon: (
                      <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0H3"/>
                      </svg>
                    ),
                  },
                ].map((item) => (
                  <button
                    key={item.label}
                    onClick={() => navigate(item.to)}
                    className="group flex items-center gap-3 p-3 rounded-xl transition-all hover:-translate-y-0.5 text-left"
                    style={{ background: `${item.accent}10`, border: `1px solid ${item.accent}20` }}
                  >
                    <span style={{ color: item.accent }}>{item.icon}</span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-white">{item.label}</p>
                      <p className="text-xs text-slate-500 truncate">{item.sub}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>

      <footer className="border-t border-slate-800/60 py-5 text-center mt-6">
        <p className="text-slate-600 text-xs">© {new Date().getFullYear()} DB Manager. All rights reserved.</p>
      </footer>
    </div>
  );
}
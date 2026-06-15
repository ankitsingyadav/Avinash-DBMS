// pages/ProfilePage.jsx
import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import useAuthStore from "../context/authStore";
import { TEAM_NAMES } from "../constants/teamNames";

export default function ProfilePage() {
  const { user, updateProfile, isLoading } = useAuthStore();
  const navigate = useNavigate();
  const fileRef  = useRef(null);

  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({
    fullName: user?.fullName || "",
    phone:    user?.phone    || "",
    teamName: user?.teamName || "",
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
    if (form.teamName !== user.teamName) fd.append("teamName", form.teamName);
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
      teamName: user?.teamName || "",
    });
  };

  const inputStyle = {
    width: "100%", padding: "11px 14px",
    border: "1.5px solid #e2e8f0", borderRadius: "10px",
    fontSize: "14px", color: "#0f172a", background: "#f8fafc",
    outline: "none", boxSizing: "border-box", fontFamily: "inherit",
    transition: "all 0.2s",
  };

  const handleFocus = (e) => {
    e.target.style.borderColor = "#0ea5e9";
    e.target.style.background = "#fff";
    e.target.style.boxShadow = "0 0 0 3px rgba(14,165,233,0.1)";
  };
  const handleBlur = (e) => {
    e.target.style.borderColor = "#e2e8f0";
    e.target.style.background = "#f8fafc";
    e.target.style.boxShadow = "none";
  };

  return (
    <div
      style={{
        background: "#f0f4f8",
        backgroundImage: "radial-gradient(#cbd5e1 1px, transparent 1px)",
        backgroundSize: "24px 24px",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}
    >
      <Navbar />

      <div className="max-w-2xl mx-auto px-4 py-10 w-full flex-1">

        {/* ── Page Header ── */}
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            style={{ color: "#64748b", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", marginBottom: "20px", padding: 0 }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"/>
            </svg>
            Back
          </button>
          <p style={{ color: "#94a3b8", fontSize: "11px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "2px" }}>{dateStr}</p>
          <h1 style={{ fontSize: "22px", fontWeight: "700", color: "#0f172a", margin: "0 0 4px" }}>
            {greeting}, <span style={{ color: "#0ea5e9" }}>{user?.fullName?.split(" ")[0]}</span> 👋
          </h1>
          <p style={{ color: "#64748b", fontSize: "14px", margin: 0 }}>Manage your personal information and account settings</p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

          {/* ── Avatar + Basic Info Card ── */}
          <div style={{ background: "#fff", borderRadius: "20px", padding: "1.5rem", border: "1px solid #e2e8f0", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.04), 0 10px 40px -5px rgba(14,165,233,0.06)" }}>

            {/* Avatar row */}
            <div style={{ display: "flex", alignItems: "center", gap: "20px", marginBottom: "24px", paddingBottom: "24px", borderBottom: "1px solid #f1f5f9" }}>
              <div style={{ position: "relative", flexShrink: 0 }}>
                <div style={{ width: "80px", height: "80px", borderRadius: "16px", overflow: "hidden", border: "2.5px solid #bae6fd", outline: "3px solid #f0f9ff" }}>
                  {avatarUrl ? (
                    <img src={avatarUrl} alt={user?.fullName} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <div style={{ width: "100%", height: "100%", background: "linear-gradient(135deg, #0ea5e9, #2563eb)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <span style={{ color: "white", fontSize: "24px", fontWeight: "700" }}>{initials}</span>
                    </div>
                  )}
                </div>
                {editMode && (
                  <button
                    type="button"
                    onClick={() => fileRef.current.click()}
                    style={{
                      position: "absolute", bottom: "-4px", right: "-4px",
                      width: "28px", height: "28px",
                      background: "linear-gradient(135deg, #0ea5e9, #2563eb)",
                      borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                      border: "2px solid #fff", cursor: "pointer",
                      boxShadow: "0 2px 6px rgba(14,165,233,0.4)",
                    }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z"/>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z"/>
                    </svg>
                  </button>
                )}
                <input ref={fileRef} type="file" accept="image/*" onChange={handleImageChange} style={{ display: "none" }} />
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginBottom: "4px" }}>
                  <h2 style={{ fontSize: "17px", fontWeight: "700", color: "#0f172a", margin: 0 }}>{user?.fullName}</h2>
                  <span style={{
                    fontSize: "11px", padding: "2px 8px", borderRadius: "100px", fontWeight: "600",
                    background: isAdmin ? "#fffbeb" : "#f0f9ff",
                    color: isAdmin ? "#b45309" : "#0369a1",
                    border: isAdmin ? "1px solid #fde68a" : "1px solid #bae6fd",
                  }}>
                    {user?.role?.toUpperCase()}
                  </span>
                </div>
                <p style={{ color: "#64748b", fontSize: "14px", margin: "0 0 2px" }}>{user?.email}</p>
                <p style={{ color: "#94a3b8", fontSize: "14px", margin: 0 }}>{user?.phone || "No phone added"}</p>
              </div>

              {/* Edit toggle */}
              <button
                onClick={() => editMode ? handleCancel() : setEditMode(true)}
                style={{
                  flexShrink: 0, fontSize: "13px", padding: "8px 16px", borderRadius: "10px",
                  fontWeight: "500", cursor: "pointer", transition: "all 0.2s",
                  background: editMode ? "#f1f5f9" : "#f0f9ff",
                  color: editMode ? "#475569" : "#0369a1",
                  border: editMode ? "1px solid #e2e8f0" : "1px solid #bae6fd",
                  fontFamily: "inherit",
                }}
              >
                {editMode ? "Cancel" : "Edit"}
              </button>
            </div>

            {/* Stats row */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px", marginBottom: "20px" }}>
              {[
                { label: "Team",       value: user?.teamName || "—" },
                { label: "Joined",     value: user?.createdAt ? new Date(user.createdAt).toLocaleDateString("en-IN", { month: "short", year: "numeric" }) : "—" },
                { label: "Last Login", value: user?.lastLogin  ? new Date(user.lastLogin).toLocaleDateString("en-IN", { month: "short", day: "numeric" }) : "Today" },
              ].map((s) => (
                <div key={s.label} style={{ background: "#f8fafc", borderRadius: "12px", padding: "12px", border: "1px solid #e2e8f0", textAlign: "center" }}>
                  <p style={{ color: "#0f172a", fontWeight: "600", fontSize: "14px", margin: "0 0 2px" }}>{s.value}</p>
                  <p style={{ color: "#94a3b8", fontSize: "12px", margin: 0 }}>{s.label}</p>
                </div>
              ))}
            </div>

            {/* Edit Form */}
            {editMode && (
              <form onSubmit={handleUpdate} style={{ display: "flex", flexDirection: "column", gap: "12px", paddingTop: "16px", borderTop: "1px solid #f1f5f9" }}>
                <p style={{ fontSize: "11px", fontWeight: "600", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.1em", margin: 0 }}>Edit Information</p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "13px", fontWeight: "500", color: "#374151", marginBottom: "6px" }}>Full Name</label>
                    <input
                      value={form.fullName}
                      onChange={(e) => setForm((p) => ({ ...p, fullName: e.target.value }))}
                      placeholder="Full name"
                      style={inputStyle}
                      onFocus={handleFocus} onBlur={handleBlur}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "13px", fontWeight: "500", color: "#374151", marginBottom: "6px" }}>Team Name</label>
                    <select
                      value={form.teamName}
                      onChange={(e) => setForm((p) => ({ ...p, teamName: e.target.value }))}
                      style={inputStyle}
                      onFocus={handleFocus} onBlur={handleBlur}
                    >
                      <option value="" disabled>Select team</option>
                      {TEAM_NAMES.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "500", color: "#374151", marginBottom: "6px" }}>Phone Number</label>
                  <input
                    value={form.phone}
                    onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                    placeholder="+91 9876543210"
                    style={inputStyle}
                    onFocus={handleFocus} onBlur={handleBlur}
                  />
                </div>
                <button
                  type="submit" disabled={isLoading}
                  style={{
                    width: "100%", padding: "12px",
                    background: "linear-gradient(135deg, #0ea5e9, #2563eb)",
                    color: "#fff", border: "none", borderRadius: "10px",
                    fontSize: "14px", fontWeight: "600", cursor: isLoading ? "not-allowed" : "pointer",
                    boxShadow: "0 4px 14px rgba(14,165,233,0.35)",
                    opacity: isLoading ? 0.7 : 1, fontFamily: "inherit",
                  }}
                >
                  {isLoading ? (
                    <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"
                        style={{ animation: "spin 1s linear infinite" }}>
                        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
                      </svg>
                      Saving...
                    </span>
                  ) : "Save Changes →"}
                </button>
              </form>
            )}
          </div>

          {/* ── Account Info Card ── */}
          <div style={{ background: "#fff", borderRadius: "20px", padding: "1.5rem", border: "1px solid #e2e8f0", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.04), 0 10px 40px -5px rgba(14,165,233,0.06)" }}>
            <p style={{ fontSize: "11px", fontWeight: "600", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "16px" }}>Account Details</p>
            <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
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
                <div key={item.label} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 0", borderBottom: "1px solid #f1f5f9" }}
                  className="last:border-0">
                  <span style={{ color: "#94a3b8", flexShrink: 0 }}>{item.icon}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: "12px", color: "#94a3b8", margin: "0 0 2px" }}>{item.label}</p>
                    <p style={{ fontSize: "14px", color: "#0f172a", fontWeight: "500", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Security Card ── */}
          <div style={{ background: "#fff", borderRadius: "20px", padding: "1.5rem", border: "1px solid #e2e8f0", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.04), 0 10px 40px -5px rgba(14,165,233,0.06)" }}>
            <p style={{ fontSize: "11px", fontWeight: "600", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "16px" }}>Security</p>
            <div>
              {/* Password */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid #f1f5f9" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <span style={{ color: "#94a3b8" }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"/>
                    </svg>
                  </span>
                  <div>
                    <p style={{ fontSize: "14px", color: "#0f172a", fontWeight: "500", margin: "0 0 2px" }}>Password</p>
                    <p style={{ fontSize: "12px", color: "#94a3b8", margin: 0 }}>Change your account password</p>
                  </div>
                </div>
                <button
                  onClick={() => navigate("/login")}
                  style={{ fontSize: "13px", color: "#0ea5e9", background: "none", border: "none", cursor: "pointer", fontWeight: "500", fontFamily: "inherit" }}
                >
                  Change →
                </button>
              </div>

              {/* Account Status */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 0" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <span style={{ color: "#94a3b8" }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"/>
                    </svg>
                  </span>
                  <div>
                    <p style={{ fontSize: "14px", color: "#0f172a", fontWeight: "500", margin: "0 0 2px" }}>Account Status</p>
                    <p style={{ fontSize: "12px", color: "#94a3b8", margin: 0 }}>Your account is active and secure</p>
                  </div>
                </div>
                <span style={{ fontSize: "12px", color: "#16a34a", display: "flex", alignItems: "center", gap: "6px", fontWeight: "500" }}>
                  <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#22c55e", display: "inline-block", animation: "pulse 2s infinite" }} />
                  Active
                </span>
              </div>
            </div>
          </div>

          {/* ── Admin shortcuts ── */}
          {isAdmin && (
            <div style={{ background: "#fff", borderRadius: "20px", padding: "1.5rem", border: "1px solid #e2e8f0", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.04), 0 10px 40px -5px rgba(14,165,233,0.06)" }}>
              <p style={{ fontSize: "11px", fontWeight: "600", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "12px" }}>Quick Navigation</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                {[
                  {
                    label: "Dashboard", sub: "Overview & stats", to: "/dashboard",
                    accent: "#0ea5e9", bg: "#f0f9ff", border: "#bae6fd",
                    icon: (
                      <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z"/>
                      </svg>
                    ),
                  },
                  {
                    label: "Admin Panel", sub: "Manage records", to: "/admin",
                    accent: "#b45309", bg: "#fffbeb", border: "#fde68a",
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
                    style={{
                      display: "flex", alignItems: "center", gap: "12px",
                      padding: "12px", borderRadius: "12px", cursor: "pointer",
                      background: item.bg, border: `1px solid ${item.border}`,
                      transition: "all 0.2s", textAlign: "left", fontFamily: "inherit",
                    }}
                  >
                    <span style={{ color: item.accent }}>{item.icon}</span>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontSize: "14px", fontWeight: "500", color: "#0f172a", margin: "0 0 2px" }}>{item.label}</p>
                      <p style={{ fontSize: "12px", color: "#94a3b8", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.sub}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>

      <footer style={{ borderTop: "1px solid #e2e8f0", padding: "20px 0", textAlign: "center", marginTop: "24px" }}>
        <p style={{ color: "#94a3b8", fontSize: "12px", margin: 0 }}>© {new Date().getFullYear()} DB Manager. All rights reserved.</p>
      </footer>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
      `}</style>
    </div>
  );
}
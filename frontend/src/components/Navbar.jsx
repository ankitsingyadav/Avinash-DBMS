import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import useAuthStore from "../context/authStore";

// Role badge config
const ROLE_CONFIG = {
  admin:         { label: "Full Admin",    color: "#f59e0b" },
  full_admin:    { label: "Full Admin",    color: "#f59e0b" },
  partial_admin: { label: "Partial Admin", color: "#8b5cf6" },
  data_entry:    { label: "Data Entry",    color: "#10b981" },
  user:          { label: "User",          color: "#6366f1" },
};

export default function Navbar() {
  const { user, isAuthenticated, logout, isFullAdmin } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const isAdminRole = ["admin","full_admin","partial_admin","data_entry"].includes(user?.role);
  const isFA = isFullAdmin?.() ?? (user?.role === "admin" || user?.role === "full_admin");
  const roleConf = ROLE_CONFIG[user?.role] || ROLE_CONFIG.user;

  const isActive = (path) =>
    location.pathname === path || location.pathname.startsWith(path + "/");

  const handleLogout = async () => {
    setProfileOpen(false);
    await logout();
    navigate("/");
  };

  const navLinks = [
    { label: "Home",         to: "/" },
    { label: "About",        to: "/about" },
    { label: "Organisation", to: "/organisation" },
    ...(isAdminRole ? [{ label: "Admin Panel", to: "/admin", badge: roleConf.label, badgeColor: roleConf.color }] : []),
    ...(isFA         ? [{ label: "Access Control", to: "/access-control", badge: "ADMIN", badgeColor: "#f59e0b" }] : []),
  ];

  return (
    <nav className="w-full border-b border-slate-800/60 bg-[#0c0c14]/90 backdrop-blur-md sticky top-0 z-50 relative">
      <div className="max-w-6xl mx-auto px-5 py-3 flex items-center justify-between gap-4">

        {/* ── Logo ─────────────────────────────────────── */}
        <Link to="/" className="flex items-center gap-2.5 shrink-0 group">
          <div className="w-9 h-9 rounded-xl overflow-hidden ring-1 ring-indigo-500/30">
            <img
              src="/logo.png"
              alt="DB Manager"
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.style.display = "none";
                e.target.parentElement.innerHTML = `
                  <svg width="36" height="36" viewBox="0 0 32 32" fill="none">
                    <rect width="32" height="32" rx="10" fill="url(#nb-grad)"/>
                    <path d="M16 7l7 4v8l-7 4-7-4V11l7-4z" stroke="white" strokeWidth="1.5" fill="none"/>
                    <circle cx="16" cy="16" r="3" fill="white" fillOpacity="0.9"/>
                    <defs><linearGradient id="nb-grad" x1="0" y1="0" x2="32" y2="32">
                      <stop stopColor="#6366f1"/><stop offset="1" stopColor="#8b5cf6"/>
                    </linearGradient></defs>
                  </svg>`;
              }}
            />
          </div>
          <div className="flex flex-col leading-none">
            <span className="text-white font-bold text-sm tracking-tight group-hover:text-indigo-300 transition-colors">
              DB Manager
            </span>
            <span className="text-slate-500 text-[10px]">Database Management</span>
          </div>
        </Link>

        {/* ── Center Nav ───────────────────────────────── */}
        <div className="hidden md:flex items-center gap-1 bg-slate-800/50 rounded-xl p-1 border border-slate-700/40">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              to={link.to}
              className={`px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 flex items-center gap-1.5 ${
                isActive(link.to)
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20"
                  : "text-slate-400 hover:text-white hover:bg-slate-700/60"
              }`}
            >
              {link.label === "Organisation" && (
                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
                </svg>
              )}
              {link.label === "Access Control" && (
                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                </svg>
              )}
              {link.label}
              {link.badge && (
                <span
                  className="ml-0.5 text-[10px] px-1.5 py-0.5 rounded-full font-semibold"
                  style={{
                    background: `${link.badgeColor}20`,
                    color: link.badgeColor,
                    border: `1px solid ${link.badgeColor}30`,
                  }}
                >
                  {link.badge}
                </span>
              )}
            </Link>
          ))}
        </div>

        {/* ── Right: Auth ───────────────────────────────── */}
        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <div className="relative">
              <button
                onClick={() => setProfileOpen((p) => !p)}
                className="flex items-center gap-2.5 bg-slate-800/60 hover:bg-slate-700/60 border border-slate-700/50 rounded-xl px-3 py-2 transition-all"
              >
                {/* Avatar */}
                <div className="w-7 h-7 rounded-lg overflow-hidden ring-1 ring-indigo-500/30">
                  {user?.profileImage?.url ? (
                    <img src={user.profileImage.url} alt={user.fullName} className="w-full h-full object-cover"/>
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center">
                      <span className="text-white text-[11px] font-bold">
                        {user?.fullName?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
                      </span>
                    </div>
                  )}
                </div>
                <div className="hidden sm:flex flex-col items-start leading-none">
                  <span className="text-white text-xs font-medium">{user?.fullName?.split(" ")[0]}</span>
                  <span className="text-[10px] font-medium" style={{ color: roleConf.color }}>
                    {roleConf.label}
                  </span>
                </div>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="14" height="14"
                  viewBox="0 0 24 24" fill="none" stroke="currentColor"
                  className={`text-slate-400 transition-transform duration-200 ${profileOpen ? "rotate-180" : ""}`}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/>
                </svg>
              </button>

              {/* ── Dropdown ────────────────────────────────── */}
              {profileOpen && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-[#13131f] border border-slate-700/60 rounded-xl shadow-2xl shadow-black/40 overflow-hidden z-50">

                  {/* User info */}
                  <div className="px-4 py-3 border-b border-slate-800/60">
                    <p className="text-white text-sm font-semibold truncate">{user?.fullName}</p>
                    <p className="text-slate-500 text-xs truncate mt-0.5">{user?.email}</p>
                    <span
                      className="inline-block mt-1.5 text-[10px] font-semibold px-2 py-0.5 rounded-full border"
                      style={{
                        background: `${roleConf.color}15`,
                        color: roleConf.color,
                        borderColor: `${roleConf.color}30`,
                      }}
                    >
                      {roleConf.label.toUpperCase()}
                    </span>
                  </div>

                  {/* Links */}
                  <div className="py-1.5">

                    <Link
                      to="/profile"
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-300 hover:text-white hover:bg-slate-800/60 transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                      </svg>
                      My Profile
                    </Link>

                    <Link
                      to="/organisation"
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-300 hover:text-white hover:bg-slate-800/60 transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
                      </svg>
                      Organisation
                    </Link>

                    {/* Admin Panel — all admin roles */}
                    {isAdminRole && (
                      <>
                        <Link
                          to="/dashboard"
                          onClick={() => setProfileOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-300 hover:text-white hover:bg-slate-800/60 transition-colors"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
                          </svg>
                          Dashboard
                        </Link>
                        <Link
                          to="/admin"
                          onClick={() => setProfileOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-slate-800/60 transition-colors"
                          style={{ color: roleConf.color }}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                          </svg>
                          Admin Panel
                        </Link>
                      </>
                    )}

                    {/* Access Control — full admin only */}
                    {isFA && (
                      <Link
                        to="/access-control"
                        onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-slate-800/60 transition-colors"
                        style={{ color: "#f59e0b" }}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
                        </svg>
                        Access Control
                        <span className="ml-auto text-[10px] bg-amber-500/15 text-amber-400 border border-amber-500/25 px-1.5 py-0.5 rounded-full font-semibold">
                          ADMIN
                        </span>
                      </Link>
                    )}
                  </div>

                  <div className="border-t border-slate-800/60 py-1.5">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/5 transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
                      </svg>
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="text-sm font-medium text-slate-300 hover:text-white px-4 py-2 rounded-lg hover:bg-slate-800/60 transition-all"
              >
                Sign In
              </Link>
              <Link
                to="/signup"
                className="text-sm font-semibold text-white px-4 py-2 rounded-xl transition-all hover:-translate-y-0.5"
                style={{
                  background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                  boxShadow: "0 4px 14px rgba(99,102,241,0.3)",
                }}
              >
                Get Started
              </Link>
            </div>
          )}

          {/* Mobile Hamburger */}
          <button
            className="md:hidden text-slate-400 hover:text-white p-1.5"
            onClick={() => setMenuOpen((p) => !p)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={menuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"}/>
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 border-t border-slate-800/60 bg-[#0c0c14] px-5 py-3 space-y-1 z-50 shadow-xl shadow-black/40">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              to={link.to}
              onClick={() => setMenuOpen(false)}
              className={`flex items-center gap-2.5 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive(link.to)
                  ? "bg-indigo-600/20 text-indigo-300"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/60"
              }`}
            >
              {link.label}
              {link.badge && (
                <span
                  className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold"
                  style={{
                    background: `${link.badgeColor}18`,
                    color: link.badgeColor,
                    border: `1px solid ${link.badgeColor}28`,
                  }}
                >
                  {link.badge}
                </span>
              )}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
}
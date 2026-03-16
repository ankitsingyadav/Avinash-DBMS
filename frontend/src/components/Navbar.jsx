import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import useAuthStore from "../context/authStore";

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const isAdmin = user?.role === "admin";
  const isActive = (path) => location.pathname === path;

  const handleLogout = async () => {
    setProfileOpen(false);
    await logout();
    navigate("/");
  };

  const navLinks = [
    { label: "Home", to: "/" },
    { label: "About", to: "/about" },
    ...(isAdmin ? [{ label: "Admin", to: "/admin" }] : []),
  ];

  return (
    <nav className="w-full border-b border-slate-800/60 bg-[#0c0c14]/90 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-5 py-3 flex items-center justify-between gap-4">

        {/* ── Left: Logo ─────────────────────────────────────────── */}
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

        {/* ── Center: Nav Tabs ──────────────────────────────────── */}
        <div className="hidden md:flex items-center gap-1 bg-slate-800/50 rounded-xl p-1 border border-slate-700/40">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              to={link.to}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                isActive(link.to)
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20"
                  : "text-slate-400 hover:text-white hover:bg-slate-700/60"
              }`}
            >
              {link.label}
              {link.label === "Admin" && (
                <span className="ml-1.5 text-[10px] bg-amber-500/20 text-amber-400 border border-amber-500/30 px-1.5 py-0.5 rounded-full">
                  ADMIN
                </span>
              )}
            </Link>
          ))}
        </div>

        {/* ── Right: Auth Section ───────────────────────────────── */}
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
                  <span className={`text-[10px] font-medium ${isAdmin ? "text-amber-400" : "text-indigo-400"}`}>
                    {isAdmin ? "Admin" : "User"}
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

              {/* ── Dropdown ──────────────────────────────────────── */}
              {profileOpen && (
                <div className="absolute right-0 top-full mt-2 w-52 bg-[#13131f] border border-slate-700/60 rounded-xl shadow-2xl shadow-black/40 overflow-hidden z-50">

                  {/* User info */}
                  <div className="px-4 py-3 border-b border-slate-800/60">
                    <p className="text-white text-sm font-semibold truncate">{user?.fullName}</p>
                    <p className="text-slate-500 text-xs truncate mt-0.5">{user?.email}</p>
                    <span className={`inline-block mt-1.5 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                      isAdmin
                        ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                        : "bg-indigo-500/10 text-indigo-400 border-indigo-500/20"
                    }`}>
                      {isAdmin ? "ADMIN" : "USER"}
                    </span>
                  </div>

                  {/* Links */}
                  <div className="py-1.5">

                    {/* My Profile — sabko dikhega */}
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

                    {/* Dashboard — sirf admin */}
                    {isAdmin && (
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
                    )}

                    {/* Admin Panel — sirf admin */}
                    {isAdmin && (
                      <Link
                        to="/admin"
                        onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-amber-400 hover:text-amber-300 hover:bg-slate-800/60 transition-colors"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                        </svg>
                        Admin Panel
                      </Link>
                    )}
                  </div>

                  {/* Logout */}
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
            /* Not logged in */
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
        <div className="md:hidden border-t border-slate-800/60 bg-[#0c0c14] px-5 py-3 space-y-1">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              to={link.to}
              onClick={() => setMenuOpen(false)}
              className={`block px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive(link.to)
                  ? "bg-indigo-600/20 text-indigo-300"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/60"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
}
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";

export default function HomePage() {
  return (
    <div className="auth-bg min-h-screen flex flex-col">
      <Navbar />

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <main className="flex-1 flex items-center justify-center px-6 py-24">
        <div className="text-center max-w-2xl mx-auto">

          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full px-4 py-1.5 mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"/>
            <span className="text-indigo-300 text-xs font-medium tracking-wide">
              System Online · Production Ready
            </span>
          </div>

          <h1 className="text-5xl font-extrabold text-white tracking-tight leading-tight mb-5">
            Welcome to{" "}
            <span
              className="bg-clip-text text-transparent"
              style={{ backgroundImage: "linear-gradient(135deg, #6366f1, #a78bfa, #8b5cf6)" }}
            >
              Database
            </span>
            <br />
            Management
          </h1>

          <p className="text-slate-400 text-lg leading-relaxed mb-10 max-w-lg mx-auto">
            Secure, fast and reliable database management with
            role-based access control, JWT authentication, and cloud storage.
          </p>

          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link
              to="/signup"
              className="px-7 py-3.5 text-sm font-semibold text-white rounded-xl transition-all hover:-translate-y-0.5"
              style={{
                background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                boxShadow: "0 6px 24px rgba(99,102,241,0.35)",
              }}
            >
              Create Account →
            </Link>
            <Link
              to="/login"
              className="px-7 py-3.5 text-sm font-semibold text-slate-300 rounded-xl border border-slate-700/60 hover:border-indigo-500/40 hover:text-white bg-slate-800/40 hover:bg-slate-800/70 transition-all"
            >
              Sign In
            </Link>
          </div>

          {/* Stats */}
          <div className="flex items-center justify-center gap-10 mt-16 pt-10 border-t border-slate-800/60">
            {[
              { value: "JWT", label: "Secure Auth" },
              { value: "RBAC", label: "Role Based Access" },
              { value: "Cloud", label: "Cloudinary Storage" },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-indigo-400 font-bold text-lg">{s.value}</p>
                <p className="text-slate-500 text-xs mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/60 py-5 text-center">
        <p className="text-slate-600 text-xs">
          © {new Date().getFullYear()} DB Manager. All rights reserved.
        </p>
      </footer>
    </div>
  );
}

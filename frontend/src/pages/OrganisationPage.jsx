// pages/OrganisationPage.jsx
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";

const cards = [
  {
    id: "volunteer",
    label: "Volunteers",
    route: "/organisation/volunteer",
    description: "Register volunteers, their skills, and assign them to organisations.",
    accent: "#f59e0b",
    glow: "rgba(245,158,11,0.15)",
    border: "rgba(245,158,11,0.25)",
    stat: "Field Workers",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>
      </svg>
    ),
    features: ["Individual volunteers", "Skills & interests", "Area assignment"],
  },
  {
    id: "unified-org",
    label: "Add Organisation",
    route: "/organisation/add",
    description: "One unified form for Schools, Colleges, NGOs, Corporates, and more.",
    accent: "#8b5cf6",
    glow: "rgba(139,92,246,0.15)",
    border: "rgba(139,92,246,0.25)",
    stat: "Unified Form",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21"/>
      </svg>
    ),
    features: ["School / College / NGO", "Corporate / Online", "Community Centre"],
  },
];

export default function OrganisationPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#0c0c14] flex flex-col">
      <Navbar />

      {/* ── Main Content ── */}
      <div className="flex-1 flex flex-col items-center justify-center px-5 py-8">

        {/* Header */}
        <div className="text-center mb-4">
          <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full px-4 py-1.5 mb-5">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
            <span className="text-indigo-400 text-xs font-semibold uppercase tracking-widest">
              Admin Panel · Organisation Management
            </span>
          </div>
          <h1 className="text-4xl font-bold text-white mb-3 tracking-tight">
            What would you like to add?
          </h1>
          <p className="text-slate-400 text-sm max-w-md mx-auto leading-relaxed">
            Choose a category below to register a new entry into the database.
          </p>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full max-w-3xl">
          {cards.map((card) => (
            <button
              key={card.id}
              onClick={() => navigate(card.route)}
              className="group relative text-left rounded-2xl p-7 transition-all duration-300 hover:-translate-y-1.5 overflow-hidden"
              style={{
                background: "rgba(19,19,31,0.80)",
                border: `1px solid ${card.border}`,
                boxShadow: `0 0 0 0 ${card.glow}`,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = `0 20px 60px ${card.glow}, 0 0 0 1px ${card.border}`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = `0 0 0 0 ${card.glow}`;
              }}
            >
              {/* Glow bg on hover */}
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-2xl"
                style={{ background: `radial-gradient(ellipse at 0% 0%, ${card.glow}, transparent 70%)` }}
              />

              {/* Decorative circle */}
              <div
                className="absolute -bottom-10 -right-10 w-40 h-40 rounded-full opacity-[0.06] group-hover:opacity-[0.12] transition-opacity duration-300 pointer-events-none"
                style={{ background: card.accent }}
              />

              <div className="relative z-10">
                {/* Icon */}
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6"
                  style={{
                    background: `${card.accent}15`,
                    border: `1.5px solid ${card.accent}30`,
                  }}
                >
                  <span style={{ color: card.accent }}>{card.icon}</span>
                </div>

                {/* Title + badge */}
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <h3 className="text-white text-xl font-bold">{card.label}</h3>
                  <span
                    className="text-[10px] font-bold px-2 py-0.5 rounded-full tracking-wide"
                    style={{
                      background: `${card.accent}15`,
                      color: card.accent,
                      border: `1px solid ${card.accent}25`,
                    }}
                  >
                    {card.stat}
                  </span>
                </div>

                {/* Description */}
                <p className="text-slate-400 text-sm leading-relaxed mb-5 group-hover:text-slate-300 transition-colors">
                  {card.description}
                </p>

                {/* Feature pills */}
                <div className="flex flex-wrap gap-1.5 mb-6">
                  {card.features.map((f) => (
                    <span
                      key={f}
                      className="text-[11px] px-2.5 py-1 rounded-lg font-medium"
                      style={{
                        background: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.08)",
                        color: "#94a3b8",
                      }}
                    >
                      {f}
                    </span>
                  ))}
                </div>

                {/* CTA */}
                <div
                  className="flex items-center gap-2 text-sm font-semibold"
                  style={{ color: card.accent }}
                >
                  <span>Get Started</span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="14" height="14"
                    fill="none" viewBox="0 0 24 24"
                    stroke="currentColor" strokeWidth={2.5}
                    className="transition-transform duration-200 group-hover:translate-x-1.5"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3"/>
                  </svg>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Info strip */}
        <div
          className="mt-8 w-full max-w-2xl rounded-xl p-4 flex items-center gap-3"
          style={{
            background: "rgba(99,102,241,0.06)",
            border: "1px solid rgba(99,102,241,0.15)",
          }}
        >
          <div className="shrink-0 w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="#6366f1" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
            </svg>
          </div>
          <p className="text-slate-400 text-xs leading-relaxed">
            <span className="text-white font-semibold">Admin only · </span>
            All registrations are logged with timestamps and stored in dedicated MongoDB collections with validation schemas.
          </p>
        </div>
      </div>
    </div>
  );
}
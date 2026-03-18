/**
 * FeaturesSection.jsx — v2.0 (White Theme)
 * Interactive Key Features section
 * Cards: College | NGO | Volunteer | School
 * Click card → animated detail panel slides in (left mockup + right explanation)
 * Theme: #ffffff | No personal data shown | Chart-based visual mockups
 */

import { useState } from "react";

/* ─── Shared Mini Bar Chart ─────────────────────────────────────────────── */
function MiniBar({ bars, color }) {
  return (
    <div className="flex items-end gap-1" style={{ height: 40 }}>
      {bars.map((h, i) => (
        <div key={i} className="flex-1 rounded-sm" style={{
          height: `${h}%`, background: color,
          opacity: 0.3 + (i / bars.length) * 0.7,
        }} />
      ))}
    </div>
  );
}

/* ─── Donut SVG ─────────────────────────────────────────────────────────── */
function Donut({ pct, color, size = 52 }) {
  const r = 20, c = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} viewBox="0 0 50 50">
      <circle cx="25" cy="25" r={r} fill="none" stroke="rgba(255,255,255,.1)" strokeWidth="5" />
      <circle cx="25" cy="25" r={r} fill="none" stroke={color} strokeWidth="5"
        strokeDasharray={`${(pct / 100) * c} ${c}`}
        strokeLinecap="round"
        transform="rotate(-90 25 25)" />
      <text x="25" y="29" textAnchor="middle" fontSize="10" fontWeight="800" fill={color}
        fontFamily="'Plus Jakarta Sans'">{pct}%</text>
    </svg>
  );
}

/* ─── Data ─────────────────────────────────────────────────────────────── */
const FEATURES = [
  {
    id: "college",
    label: "Higher Education",
    name: "College & University",
    accent: "#2563eb",
    accentLight: "rgba(37,99,235,.1)",
    accentMid: "rgba(37,99,235,.22)",
    tag: "Student Information System",
    title: ["Unified Academic Data", "Management Platform"],
    description:
      "A comprehensive database solution designed for higher education institutions to manage the complete student lifecycle — from admission to alumni — along with faculty records, departmental data, and examination systems.",
    features: [
      "Real-time admission tracking and merit list generation",
      "Faculty profile management with workload allocation",
      "Automated result processing and grade-card publishing",
      "Fee management with installment tracking and receipts",
      "Department-wise analytics and performance dashboards",
    ],
    cta: "Explore College Module",
    mockup: (
      <div className="w-full h-full flex items-center justify-center p-5"
        style={{ background: "linear-gradient(135deg,#0f2a5e,#1a3a7a)" }}>
        <div className="w-full max-w-xs rounded-xl border overflow-hidden"
          style={{ background: "rgba(255,255,255,.06)", borderColor: "rgba(255,255,255,.1)" }}>
          {/* Header bar */}
          <div className="flex items-center justify-between px-3 py-2"
            style={{ background: "rgba(37,99,235,.3)", borderBottom: "1px solid rgba(255,255,255,.08)" }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,.85)", fontFamily: "Plus Jakarta Sans" }}>
              Academic Overview
            </span>
            <span style={{ fontSize: 9, color: "rgba(255,255,255,.45)" }}>AY 2024-25</span>
          </div>

          <div className="p-3">
            {/* Stat chips */}
            <div className="grid grid-cols-3 gap-1.5 mb-3">
              {[["8,420","Students","#60a5fa"],["312","Faculty","#93c5fd"],["14","Depts","#bfdbfe"]].map(([v,l,c])=>(
                <div key={l} className="rounded-lg p-2 text-center" style={{ background: "rgba(255,255,255,.06)" }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: c, fontFamily: "Plus Jakarta Sans", lineHeight: 1 }}>{v}</div>
                  <div style={{ fontSize: 9, color: "rgba(255,255,255,.4)", marginTop: 2 }}>{l}</div>
                </div>
              ))}
            </div>

            {/* Bar chart — Dept-wise enrollment */}
            <div style={{ fontSize: 9, color: "rgba(255,255,255,.45)", marginBottom: 5, fontWeight: 600, letterSpacing: ".04em" }}>
              DEPT-WISE ENROLLMENT
            </div>
            <div className="flex items-end gap-1 mb-1" style={{ height: 44 }}>
              {[75,90,60,82,55,70,95,65].map((h,i)=>(
                <div key={i} className="flex-1 rounded-sm" style={{
                  height: `${h}%`,
                  background: `rgba(96,165,250,${0.3 + i*0.07})`,
                }}/>
              ))}
            </div>
            <div className="flex justify-between mb-3">
              {["CSE","ECE","MBA","B.Sc","Law","Arts","Med","Edu"].map(l=>(
                <span key={l} style={{ fontSize: 7.5, color: "rgba(255,255,255,.3)", flex: 1, textAlign: "center" }}>{l}</span>
              ))}
            </div>

            {/* Admission funnel */}
            <div style={{ fontSize: 9, color: "rgba(255,255,255,.45)", marginBottom: 4, fontWeight: 600, letterSpacing: ".04em" }}>
              ADMISSION FUNNEL
            </div>
            {[["Applied","100%","#60a5fa"],["Shortlisted","62%","#93c5fd"],["Admitted","38%","#bfdbfe"]].map(([l,pct,c])=>(
              <div key={l} className="mb-1.5">
                <div className="flex justify-between mb-0.5">
                  <span style={{ fontSize: 9, color: "rgba(255,255,255,.6)" }}>{l}</span>
                  <span style={{ fontSize: 9, fontWeight: 700, color: c }}>{pct}</span>
                </div>
                <div className="rounded-full overflow-hidden" style={{ height: 4, background: "rgba(255,255,255,.08)" }}>
                  <div className="h-full rounded-full" style={{ width: pct, background: c }}/>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
  },
  {
    id: "ngo",
    label: "Non-Profit",
    name: "NGO Management",
    accent: "#16a34a",
    accentLight: "rgba(22,163,74,.1)",
    accentMid: "rgba(22,163,74,.22)",
    tag: "Beneficiary & Donor Management",
    title: ["Transparent Operations", "for NGOs & Non-Profits"],
    description:
      "A purpose-built data management system for NGOs to track beneficiaries across programs, manage donor contributions, monitor field activities, and generate audit-ready compliance reports for government and international funders.",
    features: [
      "Beneficiary registration with geo-tagged field data",
      "Donation tracking with tax receipt generation",
      "Program milestone tracking and impact measurement",
      "Multi-branch data consolidation with role access",
      "FCRA compliance reports and full audit trail logs",
    ],
    cta: "Explore NGO Module",
    mockup: (
      <div className="w-full h-full flex items-center justify-center p-5"
        style={{ background: "linear-gradient(135deg,#071a0e,#14472c)" }}>
        <div className="w-full max-w-xs rounded-xl border overflow-hidden"
          style={{ background: "rgba(255,255,255,.06)", borderColor: "rgba(255,255,255,.1)" }}>
          <div className="flex items-center justify-between px-3 py-2"
            style={{ background: "rgba(22,163,74,.25)", borderBottom: "1px solid rgba(255,255,255,.08)" }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,.85)", fontFamily: "Plus Jakarta Sans" }}>Program Impact</span>
            <span style={{ fontSize: 9, padding: "1px 8px", borderRadius: 999, background: "rgba(34,197,94,.3)", color: "#4ade80", fontWeight: 600 }}>Live</span>
          </div>

          <div className="p-3">
            {/* Donut + stat */}
            <div className="flex items-center gap-4 mb-3">
              <Donut pct={78} color="#4ade80" />
              <div>
                <div style={{ fontSize: 9, color: "rgba(255,255,255,.45)", fontWeight: 600, letterSpacing: ".06em" }}>OVERALL IMPACT</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: "#4ade80", fontFamily: "Plus Jakarta Sans", lineHeight: 1.1 }}>4,280</div>
                <div style={{ fontSize: 9, color: "rgba(255,255,255,.4)" }}>Beneficiaries Served</div>
              </div>
            </div>

            {/* Program bars */}
            {[["Education Outreach","91%","#22c55e"],["Healthcare Camps","76%","#4ade80"],
              ["Livelihood Skills","63%","#86efac"],["Disaster Relief","48%","#bbf7d0"]].map(([label,pct,color])=>(
              <div key={label} className="mb-2">
                <div className="flex justify-between mb-0.5">
                  <span style={{ fontSize: 9.5, color: "rgba(255,255,255,.65)" }}>{label}</span>
                  <span style={{ fontSize: 9.5, fontWeight: 700, color }}>{pct}</span>
                </div>
                <div className="rounded-full overflow-hidden" style={{ height: 5, background: "rgba(255,255,255,.1)" }}>
                  <div className="h-full rounded-full" style={{ width: pct, background: color }}/>
                </div>
              </div>
            ))}

            {/* Donation trend */}
            <div style={{ fontSize: 9, color: "rgba(255,255,255,.4)", marginTop: 8, marginBottom: 4, fontWeight: 600, letterSpacing: ".04em" }}>MONTHLY DONATIONS (₹L)</div>
            <div className="flex items-end gap-1" style={{ height: 32 }}>
              {[40,55,48,70,62,85,78,92].map((h,i)=>(
                <div key={i} className="flex-1 rounded-sm" style={{ height: `${h}%`, background: `rgba(74,222,128,${0.25+i*0.08})` }}/>
              ))}
            </div>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: "volunteer",
    label: "Volunteer Programs",
    name: "Volunteer Coordinator",
    accent: "#ea580c",
    accentLight: "rgba(234,88,12,.1)",
    accentMid: "rgba(234,88,12,.22)",
    tag: "Volunteer Workforce System",
    title: ["Coordinate & Track", "Your Volunteer Network"],
    description:
      "A robust platform for managing large volunteer workforces — from onboarding and skill mapping to shift assignments, GPS-verified attendance, hour logging, and automated certificate generation for every volunteer milestone.",
    features: [
      "Digital volunteer onboarding with ID and skill mapping",
      "Shift scheduling with automated WhatsApp/SMS alerts",
      "GPS-verified check-in and real-time attendance logs",
      "Service hour tracking with automated certificate issuance",
      "Impact dashboards with city-wise deployment analytics",
    ],
    cta: "Explore Volunteer Module",
    mockup: (
      <div className="w-full h-full flex items-center justify-center p-5"
        style={{ background: "linear-gradient(135deg,#1a0c00,#5a2800)" }}>
        <div className="w-full max-w-xs rounded-xl border overflow-hidden"
          style={{ background: "rgba(255,255,255,.06)", borderColor: "rgba(255,255,255,.1)" }}>
          <div className="flex items-center justify-between px-3 py-2"
            style={{ background: "rgba(234,88,12,.25)", borderBottom: "1px solid rgba(255,255,255,.08)" }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,.85)", fontFamily: "Plus Jakarta Sans" }}>Deployment Analytics</span>
            <span style={{ fontSize: 9, color: "rgba(255,255,255,.45)" }}>Today</span>
          </div>

          <div className="p-3">
            {/* Status chips */}
            <div className="grid grid-cols-3 gap-1.5 mb-3">
              {[["38","Active","#fb923c"],["12","Pending","#fde68a"],["6","Done","#4ade80"]].map(([v,l,c])=>(
                <div key={l} className="rounded-lg py-2 text-center" style={{ background: "rgba(255,255,255,.06)" }}>
                  <div style={{ fontSize: 16, fontWeight: 800, color: c, fontFamily: "Plus Jakarta Sans", lineHeight: 1 }}>{v}</div>
                  <div style={{ fontSize: 8.5, color: "rgba(255,255,255,.4)", marginTop: 2 }}>{l}</div>
                </div>
              ))}
            </div>

            {/* City-wise deployment */}
            <div style={{ fontSize: 9, color: "rgba(255,255,255,.4)", marginBottom: 5, fontWeight: 600, letterSpacing: ".04em" }}>CITY-WISE DEPLOYMENT</div>
            {[["Delhi","72%","#f97316"],["Mumbai","58%","#fb923c"],["Pune","44%","#fdba74"],["Chennai","36%","#fed7aa"]].map(([city,pct,c])=>(
              <div key={city} className="mb-2 flex items-center gap-2">
                <span style={{ fontSize: 9, color: "rgba(255,255,255,.55)", width: 46 }}>{city}</span>
                <div className="flex-1 rounded-full overflow-hidden" style={{ height: 5, background: "rgba(255,255,255,.1)" }}>
                  <div className="h-full rounded-full" style={{ width: pct, background: c }}/>
                </div>
                <span style={{ fontSize: 9, fontWeight: 700, color: c, width: 28, textAlign: "right" }}>{pct}</span>
              </div>
            ))}

            {/* Hours trend */}
            <div style={{ fontSize: 9, color: "rgba(255,255,255,.4)", marginTop: 8, marginBottom: 4, fontWeight: 600, letterSpacing: ".04em" }}>SERVICE HOURS (WEEKLY)</div>
            <div className="flex items-end gap-1" style={{ height: 30 }}>
              {[55,70,60,85,75,90,80].map((h,i)=>(
                <div key={i} className="flex-1 rounded-sm" style={{
                  height:`${h}%`,
                  background: `rgba(249,115,22,${0.3+i*0.1})`
                }}/>
              ))}
            </div>
            <div className="flex justify-between mt-0.5">
              {["M","T","W","T","F","S","S"].map((d,i)=>(
                <span key={i} style={{ flex:1, textAlign:"center", fontSize: 7.5, color: "rgba(255,255,255,.25)" }}>{d}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: "school",
    label: "K-12 Schools",
    name: "School Administration",
    accent: "#7c3aed",
    accentLight: "rgba(124,58,237,.1)",
    accentMid: "rgba(124,58,237,.22)",
    tag: "School Information System",
    title: ["Complete K-12 School", "Management Database"],
    description:
      "An end-to-end school management database covering student enrollment, timetable generation, examination records, and staff administration — with parent portal access, fee management, and regulatory compliance built in.",
    features: [
      "Student enrollment with section and class allocation",
      "Smart timetable generator with teacher availability sync",
      "Examination management with auto result computation",
      "Staff payroll and attendance integrated database",
      "Parent portal with real-time academic updates",
    ],
    cta: "Explore School Module",
    mockup: (
      <div className="w-full h-full flex items-center justify-center p-5"
        style={{ background: "linear-gradient(135deg,#0c0a1e,#2d1572)" }}>
        <div className="w-full max-w-xs rounded-xl border overflow-hidden"
          style={{ background: "rgba(255,255,255,.06)", borderColor: "rgba(255,255,255,.1)" }}>
          <div className="flex items-center justify-between px-3 py-2"
            style={{ background: "rgba(124,58,237,.25)", borderBottom: "1px solid rgba(255,255,255,.08)" }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,.85)", fontFamily: "Plus Jakarta Sans" }}>Academic Dashboard</span>
            <span style={{ fontSize: 9, color: "rgba(255,255,255,.45)" }}>2024-25</span>
          </div>

          <div className="p-3">
            {/* Top stats */}
            <div className="grid grid-cols-3 gap-1.5 mb-3">
              {[["1,840","Students","#c4b5fd"],["92","Teachers","#a78bfa"],["98.2%","Pass Rate","#7c3aed"]].map(([v,l,c])=>(
                <div key={l} className="rounded-lg p-2 text-center" style={{ background: "rgba(255,255,255,.06)" }}>
                  <div style={{ fontSize: 12, fontWeight: 800, color: c, fontFamily: "Plus Jakarta Sans", lineHeight: 1 }}>{v}</div>
                  <div style={{ fontSize: 8.5, color: "rgba(255,255,255,.4)", marginTop: 2 }}>{l}</div>
                </div>
              ))}
            </div>

            {/* Grade performance */}
            <div style={{ fontSize: 9, color: "rgba(255,255,255,.4)", marginBottom: 4, fontWeight: 600, letterSpacing: ".04em" }}>GRADE-WISE PERFORMANCE</div>
            {[["Grade 10","93%","#8b5cf6"],["Grade 9","87%","#a78bfa"],
              ["Grade 8","81%","#c4b5fd"],["Grade 7","78%","#ddd6fe"]].map(([label,pct,color])=>(
              <div key={label} className="mb-1.5">
                <div className="flex justify-between mb-0.5">
                  <span style={{ fontSize: 9, color: "rgba(255,255,255,.6)" }}>{label}</span>
                  <span style={{ fontSize: 9, fontWeight: 700, color }}>{pct}</span>
                </div>
                <div className="rounded-full overflow-hidden" style={{ height: 4, background: "rgba(255,255,255,.1)" }}>
                  <div className="h-full rounded-full" style={{ width: pct, background: color }}/>
                </div>
              </div>
            ))}

            {/* Attendance vs Exam trend */}
            <div style={{ fontSize: 9, color: "rgba(255,255,255,.4)", marginTop: 7, marginBottom: 4, fontWeight: 600, letterSpacing: ".04em" }}>MONTHLY ATTENDANCE %</div>
            <div className="flex items-end gap-1" style={{ height: 30 }}>
              {[82,88,91,86,94,90,96,93].map((h,i)=>(
                <div key={i} className="flex-1 rounded-sm" style={{
                  height:`${h-70}%`,
                  background: `rgba(167,139,250,${0.35+i*0.08})`
                }}/>
              ))}
            </div>
          </div>
        </div>
      </div>
    ),
  },
];

/* ─── CheckIcon ─────────────────────────────────────────────────────────── */
function Check({ color, accentLight, accentMid }) {
  return (
    <div className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0 mt-0.5"
      style={{ background: accentLight, border: `1px solid ${accentMid}` }}>
      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
        <path d="M2 5l2.5 2.5L8 3" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

/* ─── Main Component ────────────────────────────────────────────────────── */
export default function FeaturesSection() {
  const [active, setActive] = useState(0);
  const feat = FEATURES[active];

  return (
    <section
      id="features"
      aria-labelledby="features-heading"
      className="w-full py-8 px-4 sm:px-6 lg:px-8"
      style={{ background: "#ffffff" }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&family=Plus+Jakarta+Sans:wght@700;800;900&display=swap');
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .feat-card {
          transition: border-color .2s, box-shadow .2s, transform .2s;
        }
        .feat-card:hover {
          transform: translateY(-3px);
        }
        .feat-cta-btn {
          transition: transform .15s, box-shadow .15s;
        }
        .feat-cta-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 18px rgba(0,0,0,.18);
        }
      `}</style>

      {/* ── Section Heading ── */}
      <div className="text-center mb-10 max-w-2xl mx-auto">
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          fontSize: 10, fontWeight: 700, letterSpacing: ".2em", textTransform: "uppercase",
          color: "#6b7280", marginBottom: 12,
          fontFamily: "'Sora', sans-serif",
        }}>
          <span style={{ width: 20, height: 1.5, background: "#d1d5db", display: "inline-block" }}/>
          Platform Capabilities
          <span style={{ width: 20, height: 1.5, background: "#d1d5db", display: "inline-block" }}/>
        </div>
        <h2
          id="features-heading"
          style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontWeight: 900, fontSize: "clamp(26px,3.5vw,40px)",
            letterSpacing: "-.03em", color: "#0f172a", marginBottom: 10, lineHeight: 1.15,
          }}
        >
          Key Features
        </h2>
        <p style={{
          fontSize: 13.5, color: "#6b7280", lineHeight: 1.75, maxWidth: 480, margin: "0 auto",
          fontFamily: "'Sora', sans-serif",
        }}>
          Purpose-built database modules for educational institutions, non-profits,
          volunteer networks, and schools — all under one unified platform.
        </p>
      </div>

      {/* ── Feature Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 max-w-7xl mx-auto mb-8">
        {FEATURES.map((f, i) => (
          <button
            key={f.id}
            onClick={() => setActive(i)}
            aria-pressed={i === active}
            aria-label={`Select ${f.name}`}
            className="feat-card rounded-2xl overflow-hidden text-left focus:outline-none"
            style={{
              border: `2px solid ${i === active ? f.accent : "#e5e7eb"}`,
              background: "#fff",
              boxShadow: i === active
                ? `0 0 0 4px ${f.accentLight}, 0 4px 20px rgba(0,0,0,.07)`
                : "0 1px 4px rgba(0,0,0,.06)",
            }}
          >
            {/* Mockup preview */}
            <div className="relative overflow-hidden group" style={{ height: 150 }}>
              <div className="w-full h-full transition-transform duration-500 group-hover:scale-[1.03]">
                {f.mockup}
              </div>
              {/* Hover overlay */}
              <div
                className="absolute inset-0 flex flex-col justify-end p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{ background: "linear-gradient(to top,rgba(0,0,0,.8) 0%,rgba(0,0,0,.1) 60%,transparent 100%)" }}
              >
                <span className="text-[10px] font-semibold uppercase tracking-widest mb-0.5"
                  style={{ color: "rgba(255,255,255,.6)" }}>{f.label}</span>
                <span className="text-sm font-extrabold text-white leading-tight"
                  style={{ fontFamily: "'Plus Jakarta Sans'" }}>{f.name}</span>
                <span className="mt-2 inline-flex items-center gap-1.5 text-[10px] font-bold text-white px-2.5 py-1 rounded-full w-fit"
                  style={{ background: "rgba(255,255,255,.15)", border: "1px solid rgba(255,255,255,.25)" }}>
                  <svg width="9" height="9" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6h8M6 2l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Learn more
                </span>
              </div>
            </div>

            {/* Card footer */}
            <div className="flex items-center justify-between px-3 py-2.5"
              style={{ borderTop: `1px solid ${i === active ? f.accentMid : "#f3f4f6"}` }}>
              <span style={{ fontSize: 11.5, fontWeight: 700, color: "#1e293b", fontFamily: "'Sora'" }}>{f.name}</span>
              <div className="w-2 h-2 rounded-full transition-colors duration-300"
                style={{ background: i === active ? f.accent : "#d1d5db" }} />
            </div>
          </button>
        ))}
      </div>

      {/* ── Detail Panel ── */}
      <div
        key={feat.id}
        className="max-w-7xl mx-auto rounded-2xl overflow-hidden"
        style={{
          animation: "slideIn .42s cubic-bezier(.22,1,.36,1)",
          border: "1px solid #e5e7eb",
          boxShadow: "0 4px 24px rgba(0,0,0,.07)",
        }}
        aria-live="polite"
        aria-label={`Details for ${feat.name}`}
      >
        <div className="grid grid-cols-1 lg:grid-cols-2">
          {/* Left — mockup */}
          <div className="min-h-[280px] lg:min-h-[360px]">
            {feat.mockup}
          </div>

          {/* Right — explanation */}
          <div className="p-8 lg:p-10 flex flex-col justify-center" style={{ background: "#ffffff" }}>
            {/* Tag */}
            <div className="flex items-center gap-2 mb-3" style={{
              fontSize: 9.5, fontWeight: 700, letterSpacing: ".18em",
              textTransform: "uppercase", color: feat.accent,
              fontFamily: "'Sora', sans-serif",
            }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: feat.accent }} />
              {feat.tag}
            </div>

            {/* Title */}
            <h3 style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontWeight: 900, fontSize: "clamp(20px,2.4vw,28px)",
              letterSpacing: "-.025em", lineHeight: 1.18, color: "#0f172a",
              marginBottom: 12,
            }}>
              {feat.title[0]}<br />
              <span style={{ color: feat.accent }}>{feat.title[1]}</span>
            </h3>

            {/* Description */}
            <p style={{
              fontSize: 12.5, color: "#64748b", lineHeight: 1.8,
              marginBottom: 20, fontFamily: "'Sora', sans-serif",
            }}>
              {feat.description}
            </p>

            {/* Feature list */}
            <ul className="flex flex-col gap-2 mb-6">
              {feat.features.map((f) => (
                <li key={f} className="flex items-start gap-2.5"
                  style={{ fontSize: 12, color: "#374151", lineHeight: 1.7, fontFamily: "'Sora', sans-serif" }}>
                  <Check color={feat.accent} accentLight={feat.accentLight} accentMid={feat.accentMid} />
                  {f}
                </li>
              ))}
            </ul>

            {/* CTA */}
            <button
              className="feat-cta-btn self-start inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold text-white"
              style={{ background: feat.accent, fontFamily: "'Sora', sans-serif", fontSize: 12.5 }}
              aria-label={feat.cta}
            >
              {feat.cta}
              <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                <path d="M2 7h10M7 2l5 5-5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
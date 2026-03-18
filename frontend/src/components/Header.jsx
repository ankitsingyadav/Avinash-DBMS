/**
 * Header.jsx — Professional Hero Slider (Enhanced)
 * Database Management System | Colleges · NGOs · Volunteers · Schools
 * Tailwind CSS · Fully Responsive · SEO Optimized
 * Height: 50vh | Slide-in animation | Auto-changes every 5 seconds
 * v2.0 — Real images, richer data, premium UI
 */

import { useState, useEffect, useRef, useCallback } from "react";

const slides = [
  {
    id: "college",
    eyebrow: "Higher Education",
    eyebrowColor: "#93c5fd",
    accentDot: "#3b82f6",
    title: ["Centralized Database", "for Universities & Colleges"],
    description:
      "Manage student records, faculty data, admissions, and academic reports from a single secure platform built for modern institutions.",
    tags: ["Student Records", "Faculty Management", "Admissions", "Analytics"],
    tagColor: { text: "#93c5fd", border: "rgba(59,130,246,.35)", bg: "rgba(59,130,246,.1)" },
    cta: "Explore Platform",
    ctaSecondary: "Request Demo",
    ctaBg: "#2563eb",
    ctaBgHover: "#1d4ed8",
    accent: "#3b82f6",
    accentLight: "rgba(59,130,246,.22)",
    bg: "linear-gradient(130deg,#0c1a3a 0%,#0f2a5e 45%,#1a3a7a 100%)",
    imageUrl: "https://images.unsplash.com/photo-1607237138185-eedd9c632b0b?w=420&q=80&auto=format&fit=crop",
    imageAlt: "University campus building",
    stats: [
      { v: "5K+", l: "Students Managed", icon: "🎓" },
      { v: "300+", l: "Institutions", icon: "🏛️" },
      { v: "99.9%", l: "Uptime SLA", icon: "⚡" },
    ],
    statColor: "#60a5fa",
    badge: "Trusted by IITs & IIMs",
    badgeColor: "rgba(59,130,246,.2)",
    badgeBorder: "rgba(59,130,246,.4)",
    highlights: ["NAAC Accreditation Ready", "Multi-campus Support", "Real-time Analytics"],
  },
  {
    id: "ngo",
    eyebrow: "Non-Profit Organizations",
    eyebrowColor: "#86efac",
    accentDot: "#22c55e",
    title: ["Transparent Records for", "NGO Operations"],
    description:
      "Track beneficiaries, donations, project milestones, and compliance reports with full audit transparency across all your programs.",
    tags: ["Beneficiary Tracking", "Donations", "Audit Ready", "Compliance"],
    tagColor: { text: "#86efac", border: "rgba(34,197,94,.35)", bg: "rgba(34,197,94,.1)" },
    cta: "NGO Portal",
    ctaSecondary: "View Features",
    ctaBg: "#16a34a",
    ctaBgHover: "#15803d",
    accent: "#22c55e",
    accentLight: "rgba(34,197,94,.2)",
    bg: "linear-gradient(130deg,#071a0e 0%,#0d3320 45%,#14472c 100%)",
    imageUrl: "https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=420&q=80&auto=format&fit=crop",
    imageAlt: "NGO volunteers helping community",
    stats: [
      { v: "1,200+", l: "NGOs Onboard", icon: "🌿" },
      { v: "₹1Cr+", l: "Donations Tracked", icon: "💰" },
      { v: "100%", l: "Audit Ready", icon: "✅" },
    ],
    statColor: "#4ade80",
    badge: "CSR Compliance Built-in",
    badgeColor: "rgba(34,197,94,.2)",
    badgeBorder: "rgba(34,197,94,.4)",
    highlights: ["FCRA Compliant", "Impact Reports", "Donor Portal"],
  },
  {
    id: "volunteer",
    eyebrow: "Volunteer Programs",
    eyebrowColor: "#fdba74",
    accentDot: "#f97316",
    title: ["Coordinate & Monitor", "Your Volunteer Workforce"],
    description:
      "Assign roles, track attendance, log service hours, and generate impact certificates — all managed through one unified platform.",
    tags: ["Role Assignment", "Hour Tracking", "Certificates", "Geo Tracking"],
    tagColor: { text: "#fdba74", border: "rgba(249,115,22,.35)", bg: "rgba(249,115,22,.1)" },
    cta: "Volunteer Hub",
    ctaSecondary: "See How It Works",
    ctaBg: "#ea580c",
    ctaBgHover: "#c2410c",
    accent: "#f97316",
    accentLight: "rgba(249,115,22,.2)",
    bg: "linear-gradient(130deg,#1a0c00 0%,#3d1a00 45%,#5a2800 100%)",
    imageUrl: "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=420&q=80&auto=format&fit=crop",
    imageAlt: "Volunteers working together",
    stats: [
      { v: "8K+", l: "Active Volunteers", icon: "🙌" },
      { v: "60+", l: "Cities Covered", icon: "🗺️" },
      { v: "2K+", l: "Service Hours Logged", icon: "⏱️" },
    ],
    statColor: "#fb923c",
    badge: "NSS & NCC Partners",
    badgeColor: "rgba(249,115,22,.2)",
    badgeBorder: "rgba(249,115,22,.4)",
    highlights: ["Auto Certificate Generation", "QR Check-in", "WhatsApp Alerts"],
  },
  {
    id: "school",
    eyebrow: "K-12 Schools",
    eyebrowColor: "#c4b5fd",
    accentDot: "#8b5cf6",
    title: ["Complete School Data", "Management System"],
    description:
      "Digitize enrollment, timetables, exam records, and staff profiles with enterprise-grade security trusted by thousands of schools.",
    tags: ["Enrollment", "Exam Records", "Staff Profiles", "Parent Portal"],
    tagColor: { text: "#c4b5fd", border: "rgba(139,92,246,.35)", bg: "rgba(139,92,246,.1)" },
    cta: "School Portal",
    ctaSecondary: "Start Free Trial",
    ctaBg: "#7c3aed",
    ctaBgHover: "#6d28d9",
    accent: "#8b5cf6",
    accentLight: "rgba(139,92,246,.22)",
    bg: "linear-gradient(130deg,#0c0a1e 0%,#1e1050 45%,#2d1572 100%)",
    imageUrl: "https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=420&q=80&auto=format&fit=crop",
    imageAlt: "School students in classroom",
    stats: [
      { v: "10K+", l: "Schools Active", icon: "🏫" },
      { v: "ISO", l: "27001 Certified", icon: "🔒" },
      { v: "4.9★", l: "School Rating", icon: "⭐" },
    ],
    statColor: "#a78bfa",
    badge: "CBSE & ICSE Approved",
    badgeColor: "rgba(139,92,246,.2)",
    badgeBorder: "rgba(139,92,246,.4)",
    highlights: ["Live Progress Reports", "Fee Management", "Smart Timetable"],
  },
];

export default function Header() {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [imgLoaded, setImgLoaded] = useState({});
  const startRef = useRef(Date.now());
  const progressRef = useRef(0);
  const rafRef = useRef(null);
  const DURATION = 5500;

  const goTo = useCallback((idx) => {
    if (idx === current) return;
    setCurrent(idx);
    setProgress(0);
    progressRef.current = 0;
    startRef.current = Date.now();
  }, [current]);

  useEffect(() => {
    const tick = () => {
      if (!paused) {
        const p = Math.min(((Date.now() - startRef.current) / DURATION) * 100, 100);
        progressRef.current = p;
        setProgress(p);
        if (p >= 100) {
          setCurrent((c) => (c + 1) % slides.length);
          progressRef.current = 0;
          setProgress(0);
          startRef.current = Date.now();
        }
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [paused]);

  const slide = slides[current];

  return (
    <>
      <meta name="description" content="DataVault — Enterprise database management for colleges, NGOs, volunteer programs, and schools. Secure, scalable, audit-ready." />

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap');

        .dv-slide-img {
          transition: transform 0.8s cubic-bezier(0.25,0.46,0.45,0.94), opacity 0.5s ease;
        }
        .dv-slide-img:hover { transform: scale(1.03); }

        .dv-cta-primary {
          transition: background 0.2s, transform 0.15s, box-shadow 0.2s;
          box-shadow: 0 4px 14px rgba(0,0,0,0.3);
        }
        .dv-cta-primary:hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(0,0,0,0.4);
        }
        .dv-cta-secondary {
          transition: background 0.2s, transform 0.15s;
          backdrop-filter: blur(8px);
        }
        .dv-cta-secondary:hover {
          background: rgba(255,255,255,.14) !important;
          transform: translateY(-1px);
        }

        .dv-stat-card {
          transition: transform 0.2s, background 0.2s;
        }
        .dv-stat-card:hover {
          transform: translateY(-2px);
          background: rgba(0,0,0,.35) !important;
        }

        .dv-highlight-item {
          opacity: 0;
          animation: dv-fadein 0.4s ease forwards;
        }
        @keyframes dv-fadein {
          from { opacity: 0; transform: translateX(-8px); }
          to   { opacity: 1; transform: translateX(0); }
        }

        .dv-badge-pulse::after {
          content: '';
          position: absolute;
          inset: -3px;
          border-radius: 999px;
          animation: dv-pulse 2.5s ease infinite;
        }
        @keyframes dv-pulse {
          0%, 100% { opacity: 0; }
          50% { opacity: 0.3; }
        }

        .dv-img-shimmer {
          background: linear-gradient(90deg, rgba(255,255,255,.04) 25%, rgba(255,255,255,.1) 50%, rgba(255,255,255,.04) 75%);
          background-size: 200% 100%;
          animation: dv-shimmer 1.5s infinite;
        }
        @keyframes dv-shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>

      <header
        role="banner"
        aria-label="DataVault — Database Management Platform"
        className="relative w-full overflow-hidden"
        style={{ height: "50vh", minHeight: "340px", maxHeight: "460px", fontFamily: "'Sora', sans-serif" }}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        {/* Sliding Track */}
        <div
          className="flex h-full"
          style={{
            transform: `translateX(-${current * 100}%)`,
            transition: "transform 0.7s cubic-bezier(0.77,0,0.18,1)",
            willChange: "transform",
          }}
        >
          {slides.map((s, si) => (
            <div
              key={s.id}
              className="flex-shrink-0 w-full h-full relative flex items-center"
              style={{ background: s.bg }}
            >
              {/* Decorative grid overlay */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  backgroundImage: `linear-gradient(rgba(255,255,255,.025) 1px, transparent 1px),
                                    linear-gradient(90deg, rgba(255,255,255,.025) 1px, transparent 1px)`,
                  backgroundSize: "40px 40px",
                }}
              />

              {/* Radial glow */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{ background: `radial-gradient(ellipse 55% 90% at 82% 50%, ${s.accentLight}, transparent)` }}
              />

              {/* Top-left corner accent line */}
              <div style={{
                position: "absolute", top: 0, left: 0, width: 80, height: 2,
                background: `linear-gradient(90deg, ${s.accent}, transparent)`,
              }} />

              {/* Content */}
              <div className="relative z-10 w-full max-w-6xl mx-auto px-6 sm:px-10 lg:px-16 grid items-center gap-6"
                style={{ gridTemplateColumns: "1fr auto auto" }}>

                {/* ── LEFT: Text ── */}
                <div>
                  {/* Eyebrow */}
                  <div className="flex items-center gap-2 mb-2"
                    style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: ".22em", textTransform: "uppercase", color: s.eyebrowColor }}>
                    <span style={{ width: 5, height: 5, borderRadius: "50%", background: s.accentDot, display: "inline-block", boxShadow: `0 0 6px ${s.accent}` }} />
                    {s.eyebrow}
                    {/* Trust badge */}
                    <span style={{
                      marginLeft: 6, fontSize: 9, fontWeight: 600, padding: "2px 9px", borderRadius: 999,
                      background: s.badgeColor, border: `1px solid ${s.badgeBorder}`, color: s.eyebrowColor,
                      letterSpacing: ".05em", position: "relative",
                    }} className="dv-badge-pulse">
                      {s.badge}
                    </span>
                  </div>

                  {/* Headline */}
                  <h1
                    className="text-white mb-2"
                    style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 900, fontSize: "clamp(20px, 2.8vw, 34px)", lineHeight: 1.15, letterSpacing: "-.03em" }}
                  >
                    {s.title[0]}
                    <br />
                    <span style={{ color: s.eyebrowColor }}>{s.title[1]}</span>
                  </h1>

                  {/* Description */}
                  <p className="mb-3" style={{ fontSize: 12, lineHeight: 1.8, color: "rgba(255,255,255,.6)", maxWidth: 370 }}>
                    {s.description}
                  </p>

                  {/* Feature Highlights */}
                  <div className="flex flex-col gap-1 mb-3">
                    {s.highlights.map((h, hi) => (
                      <div
                        key={h}
                        className="flex items-center gap-1.5 dv-highlight-item"
                        style={{ animationDelay: `${hi * 0.1}s`, fontSize: 11, color: "rgba(255,255,255,.75)", fontWeight: 500 }}
                      >
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                          <circle cx="6" cy="6" r="5.5" fill={s.accentLight} />
                          <path d="M3.5 6l1.8 1.8 3.2-3.6" stroke={s.accent} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        {h}
                      </div>
                    ))}
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {s.tags.map((t) => (
                      <span
                        key={t}
                        style={{
                          fontSize: 9.5, fontWeight: 600, padding: "3px 10px", borderRadius: 999,
                          border: `1px solid ${s.tagColor.border}`,
                          background: s.tagColor.bg,
                          color: s.tagColor.text,
                          letterSpacing: ".04em",
                        }}
                      >
                        {t}
                      </span>
                    ))}
                  </div>

                  {/* Buttons */}
                  <div className="flex gap-3 flex-wrap">
                    <button
                      className="dv-cta-primary"
                      style={{ padding: "9px 22px", borderRadius: 8, fontSize: 12, fontWeight: 700, background: s.ctaBg, color: "#fff", border: "none", cursor: "pointer", letterSpacing: ".02em" }}
                      aria-label={s.cta}
                    >
                      {s.cta} →
                    </button>
                    <button
                      className="dv-cta-secondary"
                      style={{ padding: "9px 22px", borderRadius: 8, fontSize: 12, fontWeight: 600, background: "rgba(255,255,255,.07)", border: "1px solid rgba(255,255,255,.15)", color: "rgba(255,255,255,.85)", cursor: "pointer" }}
                      aria-label={s.ctaSecondary}
                    >
                      {s.ctaSecondary}
                    </button>
                  </div>
                </div>

                {/* ── CENTER: Real Image ── */}
                <div className="hidden md:block" style={{ marginRight: 8 }}>
                  <div style={{
                    width: "clamp(130px, 14vw, 180px)",
                    height: "clamp(130px, 14vw, 180px)",
                    borderRadius: 20,
                    overflow: "hidden",
                    border: `1px solid rgba(255,255,255,.12)`,
                    boxShadow: `0 8px 32px rgba(0,0,0,.5), 0 0 0 1px ${s.accentLight}`,
                    position: "relative",
                    flexShrink: 0,
                  }}>
                    {/* Shimmer while loading */}
                    {!imgLoaded[s.id] && (
                      <div className="dv-img-shimmer absolute inset-0" style={{ borderRadius: 20 }} />
                    )}
                    <img
                      src={s.imageUrl}
                      alt={s.imageAlt}
                      className="dv-slide-img"
                      style={{
                        width: "100%", height: "100%", objectFit: "cover",
                        opacity: imgLoaded[s.id] ? 1 : 0,
                      }}
                      onLoad={() => setImgLoaded(p => ({ ...p, [s.id]: true }))}
                      loading="lazy"
                    />
                    {/* Image overlay gradient */}
                    <div style={{
                      position: "absolute", inset: 0,
                      background: `linear-gradient(160deg, transparent 50%, ${s.bg.split(",")[0].replace("linear-gradient(130deg,","")} 100%)`,
                      borderRadius: 20,
                    }} />
                    {/* Corner accent */}
                    <div style={{
                      position: "absolute", top: 8, right: 8,
                      width: 24, height: 24, borderRadius: 999,
                      background: s.ctaBg,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 12, boxShadow: `0 2px 8px rgba(0,0,0,.4)`,
                    }}>
                      ✦
                    </div>
                  </div>
                </div>

                {/* ── RIGHT: Stat Cards ── */}
                <div className="hidden sm:flex flex-col gap-2">
                  {s.stats.map((st) => (
                    <div
                      key={st.l}
                      className="dv-stat-card"
                      style={{
                        padding: "9px 14px",
                        borderRadius: 12,
                        background: "rgba(0,0,0,.3)",
                        border: "1px solid rgba(255,255,255,.08)",
                        minWidth: 138,
                        backdropFilter: "blur(8px)",
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                      }}
                    >
                      <span style={{ fontSize: 18 }}>{st.icon}</span>
                      <div>
                        <div style={{
                          fontFamily: "'Plus Jakarta Sans', sans-serif",
                          fontSize: 17, fontWeight: 800,
                          color: s.statColor, lineHeight: 1,
                          letterSpacing: "-.02em",
                        }}>{st.v}</div>
                        <div style={{ fontSize: 9.5, color: "rgba(255,255,255,.45)", marginTop: 2.5, fontWeight: 500, letterSpacing: ".02em" }}>{st.l}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bottom gradient */}
              <div style={{
                position: "absolute", bottom: 0, left: 0, right: 0, height: 60,
                background: "linear-gradient(to top, rgba(0,0,0,.5), transparent)",
                pointerEvents: "none",
              }} />
            </div>
          ))}
        </div>

        {/* ── Navigation Dots ── */}
        <nav
          aria-label="Slide navigation"
          className="absolute bottom-0 left-0 right-0 z-20 flex items-center justify-center gap-2 pb-3"
        >
          {slides.map((s, i) => (
            <button
              key={s.id}
              onClick={() => goTo(i)}
              aria-label={`Slide ${i + 1}: ${s.eyebrow}`}
              aria-current={i === current ? "true" : "false"}
              style={{
                height: 3,
                width: i === current ? 48 : 8,
                borderRadius: 3,
                background: i === current ? "rgba(255,255,255,.2)" : "rgba(255,255,255,.2)",
                border: "none",
                cursor: "pointer",
                padding: 0,
                position: "relative",
                overflow: "hidden",
                transition: "width .3s cubic-bezier(0.4,0,0.2,1)",
              }}
            >
              {i === current && (
                <span
                  style={{
                    position: "absolute", left: 0, top: 0,
                    height: "100%",
                    width: `${progress}%`,
                    background: slide.accent,
                    borderRadius: 3,
                    transition: "width 0.05s linear",
                  }}
                />
              )}
            </button>
          ))}

          {/* Slide counter */}
          <span style={{
            marginLeft: 10, fontSize: 9.5, fontWeight: 600,
            color: "rgba(255,255,255,.4)", letterSpacing: ".1em",
            fontFamily: "'Plus Jakarta Sans', sans-serif",
          }}>
            {String(current + 1).padStart(2, "0")}/{String(slides.length).padStart(2, "0")}
          </span>
        </nav>

        {/* Pause indicator */}
        {paused && (
          <div style={{
            position: "absolute", top: 12, right: 14, zIndex: 30,
            fontSize: 9, fontWeight: 600, color: "rgba(255,255,255,.35)",
            letterSpacing: ".12em", textTransform: "uppercase",
            display: "flex", alignItems: "center", gap: 5,
          }}>
            <span style={{ width: 5, height: 5, borderRadius: "50%", background: "rgba(255,255,255,.3)" }} />
            PAUSED
          </div>
        )}
      </header>
    </>
  );
}
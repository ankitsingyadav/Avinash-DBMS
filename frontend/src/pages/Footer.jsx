import React, { useState } from "react";
import { FaTwitter, FaFacebookF, FaLinkedinIn, FaYoutube, FaArrowUp } from "react-icons/fa";

const footerData = {
  company: [
    { title: "About Us", desc: "Humare mission, vision aur values ke baare mein janiye." },
    { title: "Careers", desc: "Hamare saath exciting job opportunities explore karein." },
    { title: "Investors", desc: "Stakeholders aur investors ke liye jaankari." },
    { title: "ESG", desc: "Hamari environmental, social aur governance initiatives." },
  ],
  subsidiaries: [
    { title: "EdgeVerve Systems", desc: "Automation solutions ke liye hamar product subsidiary." },
    { title: "DataVault BPM", desc: "Business process management solutions." },
    { title: "DataVault Consulting", desc: "Global businesses ke liye consulting services." },
  ],
  programs: [
    { title: "DataVault Foundation", desc: "Social initiatives aur corporate responsibility." },
    { title: "Science Foundation", desc: "Scientific achievements ki recognition." },
    { title: "Leadership Institute", desc: "Kal ke leaders develop karna." },
  ],
  support: [
    { title: "Terms of Use", desc: "Legal terms aur conditions." },
    { title: "Privacy Statements", desc: "Hum aapka data kaise handle karte hain." },
    { title: "Cookie Policy", desc: "Cookies usage ke baare mein jaankari." },
  ],
};

const socials = [
  { icon: FaTwitter,   href: "#", label: "Twitter",  color: "#1d9bf0", bg: "rgba(29,155,240,0.15)",  border: "rgba(29,155,240,0.3)"  },
  { icon: FaFacebookF, href: "#", label: "Facebook", color: "#1877f2", bg: "rgba(24,119,242,0.15)", border: "rgba(24,119,242,0.3)"  },
  { icon: FaLinkedinIn,href: "#", label: "LinkedIn", color: "#0a66c2", bg: "rgba(10,102,194,0.15)",  border: "rgba(10,102,194,0.3)"  },
  { icon: FaYoutube,   href: "#", label: "YouTube",  color: "#ff0000", bg: "rgba(255,0,0,0.12)",     border: "rgba(255,0,0,0.3)"     },
];

const Footer = () => {
  const [openTooltip, setOpenTooltip] = useState(null);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  const renderSection = (title, items) => (
    <div>
      <h4 style={{
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        fontSize: 10, fontWeight: 800,
        letterSpacing: "0.2em", textTransform: "uppercase",
        color: "#475569", marginBottom: 20,
        display: "flex", alignItems: "center", gap: 8,
      }}>
        <span style={{ display: "inline-block", width: 18, height: 1.5, background: "rgba(255,255,255,0.1)" }} />
        {title}
      </h4>
      <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 4 }}>
        {items.map((item, idx) => {
          const key = `${title}-${idx}`;
          const isOpen = openTooltip === key;
          return (
            <li key={idx} style={{ position: "relative" }}>
              <button
                onMouseEnter={() => setOpenTooltip(key)}
                onMouseLeave={() => setOpenTooltip(null)}
                onFocus={() => setOpenTooltip(key)}
                onBlur={() => setOpenTooltip(null)}
                style={{
                  width: "100%", display: "flex", alignItems: "center",
                  justifyContent: "space-between", gap: 8,
                  background: isOpen ? "rgba(255,255,255,0.05)" : "transparent",
                  border: "1px solid",
                  borderColor: isOpen ? "rgba(255,255,255,0.1)" : "transparent",
                  borderRadius: 8, padding: "8px 10px",
                  cursor: "pointer", textAlign: "left",
                  transition: "all 0.2s",
                }}
              >
                <span style={{
                  fontSize: 13, fontWeight: 500,
                  color: isOpen ? "#e2e8f0" : "#94a3b8",
                  transition: "color 0.2s",
                }}>
                  {item.title}
                </span>
                <svg
                  width="12" height="12" viewBox="0 0 12 12" fill="none"
                  style={{
                    flexShrink: 0,
                    transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                    transition: "transform 0.25s",
                    color: isOpen ? "#60a5fa" : "#475569",
                  }}
                >
                  <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>

              {/* Tooltip */}
              {isOpen && (
                <div style={{
                  position: "absolute", left: 0, top: "calc(100% + 4px)",
                  zIndex: 30, width: 220,
                  background: "#1e293b",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 10, padding: "10px 12px",
                  fontSize: 11.5, color: "#94a3b8", lineHeight: 1.6,
                  boxShadow: "0 12px 32px rgba(0,0,0,0.4)",
                  animation: "fadeUp 0.18s ease",
                }}>
                  {item.desc}
                  {/* Arrow */}
                  <div style={{
                    position: "absolute", top: -5, left: 16,
                    width: 8, height: 8,
                    background: "#1e293b",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRight: "none", borderBottom: "none",
                    transform: "rotate(45deg)",
                  }} />
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@700;800;900&display=swap');
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .footer-social:hover .footer-social-icon { transform: scale(1.15) translateY(-2px); }
        .footer-back-top:hover { transform: translateY(-3px); box-shadow: 0 10px 28px rgba(59,130,246,0.4) !important; }
      `}</style>

      <footer style={{
        background: "#080d1a",
        fontFamily: "'Sora', sans-serif",
        position: "relative",
        overflow: "hidden",
        borderTop: "1px solid rgba(255,255,255,0.06)",
      }}>
        {/* dot grid */}
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.03) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
          pointerEvents: "none", zIndex: 0,
        }} />
        {/* glow */}
        <div style={{
          position: "absolute", width: 400, height: 400, borderRadius: "50%",
          background: "radial-gradient(circle, #1d4ed8, transparent 70%)",
          filter: "blur(100px)", opacity: 0.2,
          top: -100, left: -100, pointerEvents: "none", zIndex: 0,
        }} />
        <div style={{
          position: "absolute", width: 300, height: 300, borderRadius: "50%",
          background: "radial-gradient(circle, #6d28d9, transparent 70%)",
          filter: "blur(80px)", opacity: 0.18,
          bottom: -80, right: -80, pointerEvents: "none", zIndex: 0,
        }} />

        <div style={{ position: "relative", zIndex: 1, maxWidth: 1280, margin: "0 auto", padding: "64px 24px 0" }}>

          {/* ── Top: Brand + tagline ── */}
          <div style={{
            display: "flex", flexWrap: "wrap", justifyContent: "space-between",
            alignItems: "flex-start", gap: 32, marginBottom: 52,
            paddingBottom: 40, borderBottom: "1px solid rgba(255,255,255,0.07)",
          }}>
            {/* Brand */}
            <div style={{ maxWidth: 320 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: "linear-gradient(135deg, #2563eb, #6366f1)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  boxShadow: "0 4px 14px rgba(37,99,235,0.4)",
                }}>
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                    <rect x="2" y="2" width="6" height="6" rx="1.5" fill="white" opacity="0.9"/>
                    <rect x="10" y="2" width="6" height="6" rx="1.5" fill="white" opacity="0.6"/>
                    <rect x="2" y="10" width="6" height="6" rx="1.5" fill="white" opacity="0.6"/>
                    <rect x="10" y="10" width="6" height="6" rx="1.5" fill="white" opacity="0.3"/>
                  </svg>
                </div>
                <span style={{
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  fontSize: 20, fontWeight: 900,
                  letterSpacing: "-0.03em", color: "#f1f5f9",
                }}>
                  DataVault
                </span>
              </div>
              <p style={{ fontSize: 13, color: "#64748b", lineHeight: 1.75, marginBottom: 16 }}>
                India ki leading database management platform — colleges, NGOs aur organizations ke liye secure, real-time data management.
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 13 }}>🇮🇳</span>
                <span style={{ fontSize: 11.5, color: "#475569", fontWeight: 600, letterSpacing: "0.06em" }}>
                  Proudly Made in India
                </span>
              </div>
            </div>

            {/* Social icons */}
            <div>
              <h4 style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontSize: 10, fontWeight: 800,
                letterSpacing: "0.2em", textTransform: "uppercase",
                color: "#475569", marginBottom: 16,
              }}>
                Connect With Us
              </h4>
              <div style={{ display: "flex", gap: 10 }}>
                {socials.map(({ icon: Icon, href, label, color, bg, border }) => (
                  <a
                    key={label}
                    href={href}
                    aria-label={label}
                    className="footer-social"
                    style={{
                      width: 40, height: 40, borderRadius: 10,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      background: bg, border: `1px solid ${border}`,
                      color: color, textDecoration: "none",
                      transition: "all 0.25s",
                    }}
                  >
                    <Icon className="footer-social-icon" style={{ width: 16, height: 16, transition: "transform 0.25s" }} />
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* ── Links grid ── */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
            gap: "40px 32px",
            marginBottom: 52,
          }}>
            {renderSection("Company", footerData.company)}
            {renderSection("Subsidiaries", footerData.subsidiaries)}
            {renderSection("Programs", footerData.programs)}
            {renderSection("Support", footerData.support)}
          </div>

          {/* ── Bottom bar ── */}
          <div style={{
            borderTop: "1px solid rgba(255,255,255,0.07)",
            padding: "20px 0 28px",
            display: "flex", flexWrap: "wrap",
            justifyContent: "space-between", alignItems: "center",
            gap: 16,
          }}>
            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 20 }}>
              <p style={{ fontSize: 12, color: "#334155", margin: 0 }}>
                © 2026 <span style={{ color: "#475569", fontWeight: 600 }}>DataVault</span> — All rights reserved
              </p>
              <div style={{ display: "flex", gap: 16 }}>
                {["Privacy", "Terms", "Cookies"].map((t) => (
                  <a key={t} href="#" style={{
                    fontSize: 11.5, color: "#334155", textDecoration: "none", fontWeight: 500,
                    transition: "color 0.2s",
                  }}
                  onMouseEnter={e => e.target.style.color = "#60a5fa"}
                  onMouseLeave={e => e.target.style.color = "#334155"}
                  >
                    {t}
                  </a>
                ))}
              </div>
            </div>

            {/* Back to top */}
            <button
              onClick={scrollToTop}
              className="footer-back-top"
              aria-label="Back to top"
              style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "9px 18px", borderRadius: 10, border: "none",
                background: "linear-gradient(135deg, #2563eb, #6366f1)",
                color: "#fff", fontSize: 12, fontWeight: 700,
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                cursor: "pointer",
                boxShadow: "0 4px 16px rgba(37,99,235,0.3)",
                transition: "transform 0.2s, box-shadow 0.2s",
              }}
            >
              <FaArrowUp style={{ width: 11, height: 11 }} />
              Back to Top
            </button>
          </div>
        </div>
      </footer>
    </>
  );
};

export default Footer;
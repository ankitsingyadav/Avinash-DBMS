import React, { useState } from "react";
import {
  FaTwitter,
  FaFacebookF,
  FaLinkedinIn,
  FaYoutube,
  FaArrowUp,
} from "react-icons/fa";

const footerData = {
  platform: [
    {
      title: "About DB Manager",
      desc: "Learn about DB Manager and how it helps organizations manage their database-related workflows and information in one place.",
      href: "#about",
    },
    {
      title: "Features",
      desc: "Explore the features currently available in DB Manager, such as organization, volunteer, interaction, and user-management workflows where enabled.",
      href: "#features",
    },
    {
      title: "How It Works",
      desc: "Understand the platform workflow, from signing in to accessing the tools and information available to your account.",
      href: "#how-it-works",
    },
    {
      title: "Contact",
      desc: "Need help or have a question about the platform? Use the project's verified contact channel.",
      href: "#contact",
    },
  ],
  resources: [
    {
      title: "Getting Started",
      desc: "Start with the sign-in and onboarding steps provided by the application. Available options may depend on your account permissions.",
      href: "#getting-started",
    },
    {
      title: "Database Concepts",
      desc: "Learn about relational data, tables, keys, constraints, queries, and data integrity through trusted database learning resources.",
      href: "https://www.postgresql.org/docs/current/",
      external: true,
    },
    {
      title: "FAQs",
      desc: "Find answers to common questions about using the platform. Add a dedicated FAQ page before linking this item to a live route.",
      href: "/#faqs",
    },
    {
      title: "Report an Issue",
      desc: "Report a reproducible bug with the page, steps taken, and the error message. Connect this item to your verified issue tracker or support channel.",
      href: "#report-issue",
    },
  ],
  community: [
    {
      title: "GitHub Repository",
      desc: "View the source code, report issues, and follow development. Link this item to the official DB Manager repository.",
      href: "https://github.com/Simtrak1234/Avinash-DBMS",
      external: true,
    },
    {
      title: "Contribute",
      desc: "Contributions can include bug reports, documentation improvements, accessibility fixes, and reviewed code changes, subject to the project's contribution guidelines.",
      href: "https://github.com/Simtrak1234/Avinash-DBMS",
      external: true,
    },
    {
      title: "Feedback",
      desc: "Share suggestions about usability, missing features, or problems. Connect this item to a real feedback form or verified contact address.",
      href: "#feedback",
    },
    {
      title: "Releases",
      desc: "Check the repository's releases or commit history for verified changes and updates. Do not promise a release schedule unless one exists.",
      href: "https://github.com/Simtrak1234/Avinash-DBMS",
      external: true,
    },
  ],

support: [
  {
    title: "Privacy Policy",
    desc: "Learn what personal and institutional information DB Manager collects, how it is used and stored, who may access it, and how users can request correction or deletion where applicable.",
    href: "/privacy",
  },
  {
    title: "Terms of Use",
    desc: "Understand the rules for using DB Manager, account responsibilities, acceptable use, access permissions, and the process for reporting misuse or resolving disputes.",
    href: "/terms",
  },
  {
    title: "Security",
    desc: "Learn about DB Manager's implemented access controls and data-protection practices. Find guidance for reporting suspected vulnerabilities, unauthorized access, or other security concerns.",
    href: "/security",
  },
  {
    title: "Cookie Policy",
    desc: "Find out whether DB Manager uses cookies or similar technologies, what purposes they serve, how essential cookies support the application, and what choices are available for optional cookies.",
    href: "/cookies",
  },
],
};

const socials = [
  // Replace these placeholder destinations with official DB Manager profiles,
  // or remove any network that does not have an official account.
  {
    icon: FaTwitter,
    href: "#",
    label: "Twitter",
    color: "#1d9bf0",
    bg: "rgba(29,155,240,0.15)",
    border: "rgba(29,155,240,0.3)",
  },
  {
    icon: FaFacebookF,
    href: "#",
    label: "Facebook",
    color: "#1877f2",
    bg: "rgba(24,119,242,0.15)",
    border: "rgba(24,119,242,0.3)",
  },
  {
    icon: FaLinkedinIn,
    href: "#",
    label: "LinkedIn",
    color: "#0a66c2",
    bg: "rgba(10,102,194,0.15)",
    border: "rgba(10,102,194,0.3)",
  },
  {
    icon: FaYoutube,
    href: "#",
    label: "YouTube",
    color: "#ff0000",
    bg: "rgba(255,0,0,0.12)",
    border: "rgba(255,0,0,0.3)",
  },
];

const Footer = () => {
  const [openTooltip, setOpenTooltip] = useState(null);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  const renderSection = (title, items) => (
    <div key={title}>
      <h4
        style={{
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          fontSize: 10,
          fontWeight: 800,
          letterSpacing: "0.2em",
          textTransform: "uppercase",
          color: "#64748b",
          marginBottom: 20,
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <span
          aria-hidden="true"
          style={{
            display: "inline-block",
            width: 18,
            height: 1.5,
            background: "rgba(255,255,255,0.16)",
          }}
        />
        {title}
      </h4>

      <ul
        style={{
          listStyle: "none",
          padding: 0,
          margin: 0,
          display: "flex",
          flexDirection: "column",
          gap: 4,
        }}
      >
        {items.map((item, idx) => {
          const key = `${title}-${idx}`;
          const isOpen = openTooltip === key;
          const isExternal = item.external;

          return (
            <li key={key} style={{ position: "relative" }}>
              <a
                href={item.href}
                target={isExternal ? "_blank" : undefined}
                rel={isExternal ? "noreferrer" : undefined}
                onMouseEnter={() => setOpenTooltip(key)}
                onMouseLeave={() => setOpenTooltip(null)}
                onFocus={() => setOpenTooltip(key)}
                onBlur={() => setOpenTooltip(null)}
                aria-describedby={isOpen ? `${key}-description` : undefined}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 8,
                  boxSizing: "border-box",
                  background: isOpen ? "rgba(255,255,255,0.05)" : "transparent",
                  border: "1px solid",
                  borderColor: isOpen ? "rgba(255,255,255,0.1)" : "transparent",
                  borderRadius: 8,
                  padding: "8px 10px",
                  cursor: "pointer",
                  textAlign: "left",
                  textDecoration: "none",
                  transition: "all 0.2s",
                  color: isOpen ? "#e2e8f0" : "#a6b4c9",
                  fontSize: 13,
                  fontWeight: 500,
                }}
              >
                <span>{item.title}</span>
                <svg
                  aria-hidden="true"
                  width="12"
                  height="12"
                  viewBox="0 0 12 12"
                  fill="none"
                  style={{
                    flexShrink: 0,
                    transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                    transition: "transform 0.25s",
                    color: isOpen ? "#60a5fa" : "#64748b",
                  }}
                >
                  <path
                    d="M2 4l4 4 4-4"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </a>

              {isOpen && (
                <div
                  id={`${key}-description`}
                  role="tooltip"
                  style={{
                    position: "absolute",
                    left: 0,
                    top: "calc(100% + 4px)",
                    zIndex: 30,
                    width: "min(260px, calc(100vw - 48px))",
                    boxSizing: "border-box",
                    background: "#1e293b",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 10,
                    padding: "10px 12px",
                    fontSize: 11.5,
                    color: "#c0cada",
                    lineHeight: 1.6,
                    boxShadow: "0 12px 32px rgba(0,0,0,0.4)",
                    animation: "dbFooterFadeUp 0.18s ease",
                  }}
                >
                  {item.desc}
                  <div
                    aria-hidden="true"
                    style={{
                      position: "absolute",
                      top: -5,
                      left: 16,
                      width: 8,
                      height: 8,
                      background: "#1e293b",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRight: "none",
                      borderBottom: "none",
                      transform: "rotate(45deg)",
                    }}
                  />
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
        @keyframes dbFooterFadeUp {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .db-footer-social:hover .db-footer-social-icon {
          transform: scale(1.15) translateY(-2px);
        }
        .db-footer-back-top:hover {
          transform: translateY(-3px);
          box-shadow: 0 10px 28px rgba(59,130,246,0.4);
        }
        .db-footer-link:focus-visible,
        .db-footer-social:focus-visible,
        .db-footer-back-top:focus-visible {
          outline: 2px solid #93c5fd;
          outline-offset: 3px;
        }
        @media (max-width: 640px) {
          .db-footer-top {
            flex-direction: column;
          }
          .db-footer-socials {
            flex-wrap: wrap;
          }
          .db-footer-bottom {
            align-items: flex-start !important;
          }
        }
      `}</style>

      <footer
        style={{
          background: "#080d1a",
          fontFamily: "'Sora', sans-serif",
          position: "relative",
          overflow: "hidden",
          borderTop: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "radial-gradient(circle, rgba(255,255,255,0.03) 1px, transparent 1px)",
            backgroundSize: "28px 28px",
            pointerEvents: "none",
            zIndex: 0,
          }}
        />
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            width: 400,
            height: 400,
            borderRadius: "50%",
            background: "radial-gradient(circle, #1d4ed8, transparent 70%)",
            filter: "blur(100px)",
            opacity: 0.2,
            top: -100,
            left: -100,
            pointerEvents: "none",
            zIndex: 0,
          }}
        />
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            width: 300,
            height: 300,
            borderRadius: "50%",
            background: "radial-gradient(circle, #6d28d9, transparent 70%)",
            filter: "blur(80px)",
            opacity: 0.18,
            bottom: -80,
            right: -80,
            pointerEvents: "none",
            zIndex: 0,
          }}
        />

        <div
          style={{
            position: "relative",
            zIndex: 1,
            maxWidth: 1280,
            margin: "0 auto",
            padding: "64px 24px 0",
          }}
        >
          <div
            className="db-footer-top"
            style={{
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "space-between",
              alignItems: "flex-start",
              gap: 32,
              marginBottom: 52,
              paddingBottom: 40,
              borderBottom: "1px solid rgba(255,255,255,0.07)",
            }}
          >
            <div style={{ maxWidth: 360 }}>
              <a
                href="/"
                aria-label="DB Manager home"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 10,
                  marginBottom: 14,
                  textDecoration: "none",
                }}
              >
                <span
                  aria-hidden="true"
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 12,
                    background: "linear-gradient(135deg, #2563eb, #6366f1)",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 4px 14px rgba(37,99,235,0.4)",
                    flexShrink: 0,
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                    <rect x="2" y="2" width="6" height="6" rx="1.5" fill="white" opacity="0.9" />
                    <rect x="10" y="2" width="6" height="6" rx="1.5" fill="white" opacity="0.6" />
                    <rect x="2" y="10" width="6" height="6" rx="1.5" fill="white" opacity="0.6" />
                    <rect x="10" y="10" width="6" height="6" rx="1.5" fill="white" opacity="0.3" />
                  </svg>
                </span>
                <span
                  style={{
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                    fontSize: 21,
                    fontWeight: 900,
                    letterSpacing: "-0.03em",
                    color: "#f1f5f9",
                  }}
                >
                  DB Manager
                </span>
              </a>

              <p
                style={{
                  fontSize: 13,
                  color: "#94a3b8",
                  lineHeight: 1.8,
                  margin: "0 0 16px",
                }}
              >
                A centralized platform for managing organization data and
                workflows with clarity and consistency.
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                <span aria-hidden="true" style={{ fontSize: 13 }}>🇮🇳</span>
                <span
                  style={{
                    fontSize: 11.5,
                    color: "#64748b",
                    fontWeight: 600,
                    letterSpacing: "0.06em",
                  }}
                >
                  Built with purpose in India
                </span>
              </div>
            </div>

            <div>
              <h4
                style={{
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  fontSize: 10,
                  fontWeight: 800,
                  letterSpacing: "0.2em",
                  textTransform: "uppercase",
                  color: "#64748b",
                  margin: "4px 0 16px",
                }}
              >
                Connect With Us
              </h4>
              <div className="db-footer-socials" style={{ display: "flex", gap: 10 }}>
                {socials.map(({ icon: Icon, href, label, color, bg, border }) => (
                  <a
                    key={label}
                    href={href}
                    aria-label={label}
                    title={label}
                    className="db-footer-social"
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: 12,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: bg,
                      border: `1px solid ${border}`,
                      color,
                      textDecoration: "none",
                      transition: "all 0.25s",
                    }}
                  >
                    {React.createElement(Icon, {
                      className: "db-footer-social-icon",
                      style: {
                        width: 16,
                        height: 16,
                        transition: "transform 0.25s",
                      },
                    })}
                  </a>
                ))}
              </div>
              <p style={{ fontSize: 10.5, color: "#64748b", marginTop: 10, maxWidth: 260, lineHeight: 1.5 }}>
              </p>
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: "40px 32px",
              marginBottom: 52,
            }}
          >
            {renderSection("Platform", footerData.platform)}
            {renderSection("Resources", footerData.resources)}
            {renderSection("Community", footerData.community)}
            {renderSection("Legal & Support", footerData.support)}
          </div>

          <div
            className="db-footer-bottom"
            style={{
              borderTop: "1px solid rgba(255,255,255,0.07)",
              padding: "20px 0 28px",
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 16,
            }}
          >
            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 20 }}>
              <p style={{ fontSize: 12, color: "#64748b", margin: 0 }}>
                © {new Date().getFullYear()}{" "}
                <span style={{ color: "#94a3b8", fontWeight: 600 }}>DB Manager</span>
                {" "}— All rights reserved.
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
                {[
                
                ].map(({ title, href }) => (
                  <a
                    key={title}
                    href={href}
                    className="db-footer-link"
                    style={{
                      fontSize: 11.5,
                      color: "#64748b",
                      textDecoration: "none",
                      fontWeight: 500,
                      transition: "color 0.2s",
                    }}
                    onMouseEnter={(event) => {
                      event.currentTarget.style.color = "#93c5fd";
                    }}
                    onMouseLeave={(event) => {
                      event.currentTarget.style.color = "#64748b";
                    }}
                  >
                    {title}
                  </a>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={scrollToTop}
              className="db-footer-back-top"
              aria-label="Back to top"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "10px 18px",
                borderRadius: 10,
                border: "none",
                background: "linear-gradient(135deg, #2563eb, #6366f1)",
                color: "#fff",
                fontSize: 12,
                fontWeight: 700,
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                cursor: "pointer",
                boxShadow: "0 4px 16px rgba(37,99,235,0.3)",
                transition: "transform 0.2s, box-shadow 0.2s",
              }}
            >
              <FaArrowUp aria-hidden="true" style={{ width: 11, height: 11 }} />
              Back to Top
            </button>
          </div>
        </div>
      </footer>
    </>
  );
};

export default Footer;

import React, { useState } from "react";

const faqs = [
  {
    category: "Access & Roles",
    icon: "🔐",
    question: "Who can access the system and what are their roles?",
    shortAnswer: "The system supports multiple roles — Super Admin, Institution Admin, Staff, and Volunteers — each with specific access privileges.",
    detailedAnswer: "Each user is assigned a role upon registration. Access to sensitive data is strictly controlled based on that role.\n\n✅ Super Admin manages all institutions and system-wide settings.\n⚡ Institution Admin handles data specific to their college, school, or NGO.\n📌 Staff members can view and update records within their department.\n💡 Volunteers have limited read-only access to tasks assigned to them.",
  },
  {
    category: "Institution Management",
    icon: "🏫",
    question: "Can multiple institutions be managed from a single platform?",
    shortAnswer: "Yes, the platform supports multi-institution management under a single Super Admin account.",
    detailedAnswer: "Each institution — whether a college, school, or NGO — operates as an independent unit with its own data, users, and settings.\n\n✅ Isolated data per institution ensures privacy and accuracy.\n⚡ Super Admin can switch between institutions without separate logins.\n📌 Cross-institution reporting is available for comparative analysis.\n💡 Ideal for education boards, NGO networks, and multi-campus organizations.",
  },
  {
    category: "Data Entry",
    icon: "📝",
    question: "How is member or student data entered into the system?",
    shortAnswer: "Data can be entered manually, imported via Excel/CSV, or collected through online registration forms.",
    detailedAnswer: "The system provides three flexible methods for data entry to suit different workflows.\n\n✅ Manual entry with field validation prevents incomplete or incorrect records.\n⚡ Bulk import via Excel/CSV allows onboarding hundreds of records at once.\n📌 Online forms can be shared publicly for self-registration (e.g., volunteer sign-ups).\n💡 Duplicate detection alerts admins before records are saved.",
  },
  {
    category: "Volunteer Tracking",
    icon: "🙋",
    question: "How does the system track volunteer participation and hours?",
    shortAnswer: "Volunteer check-ins, task assignments, and hours are logged automatically and viewable in real time.",
    detailedAnswer: "The platform provides a complete volunteer management module.\n\n✅ QR-code or manual check-in options for events and activities.\n⚡ Hours are calculated automatically based on check-in/out timestamps.\n📌 Volunteers receive certificates or badges based on participation milestones.\n💡 Admins can export volunteer hour reports for funding or compliance purposes.",
  },
  {
    category: "Reports & Analytics",
    icon: "📊",
    question: "What kinds of reports can be generated?",
    shortAnswer: "Detailed reports on attendance, membership, donations, events, and volunteer hours can be generated in seconds.",
    detailedAnswer: "The reporting module is built for both operational and strategic decision-making.\n\n✅ Attendance reports for classes, events, and volunteer drives.\n⚡ Membership growth trends, lapsed members, and renewal reminders.\n📌 Export reports in PDF or Excel with one click.\n💡 Dashboards with visual charts help leadership make data-driven decisions.",
  },
  {
    category: "Real-Time Sync",
    icon: "⚡",
    question: "Is the data updated in real time across all users?",
    shortAnswer: "Yes, all changes are reflected instantly across all active sessions.",
    detailedAnswer: "The system uses live database listeners, so no manual refresh is ever needed.\n\n✅ Staff in different locations see the same up-to-date data simultaneously.\n⚡ Event registrations and attendance updates are reflected instantly.\n📌 Prevents double-booking of resources or duplicate member registrations.\n💡 Critical for day-of-event coordination and live reporting.",
  },
  {
    category: "Security",
    icon: "🔒",
    question: "How is sensitive institutional data kept secure?",
    shortAnswer: "The system uses encrypted storage, role-based access, and full audit logs to protect all data.",
    detailedAnswer: "Security is built into every layer of the platform.\n\n✅ End-to-end encryption for all data at rest and in transit.\n⚡ Role-based permissions ensure only authorized users access sensitive records.\n📌 All changes are logged with timestamps and user IDs for full auditability.\n💡 GDPR and data-privacy compliance features are built in by default.",
  },
  {
    category: "Event Management",
    icon: "📅",
    question: "Can the system manage events, drives, and workshops?",
    shortAnswer: "Yes, events can be created, publicized, and tracked end-to-end within the platform.",
    detailedAnswer: "The event module handles the full lifecycle of institutional events.\n\n✅ Create events with capacity limits, schedules, and registration links.\n⚡ Send automated reminders and confirmation emails to registrants.\n📌 Track attendance in real time on the day of the event.\n💡 Post-event feedback forms and analytics help improve future programs.",
  },
  {
    category: "Document Storage",
    icon: "📁",
    question: "Can institutional documents be stored and managed in the system?",
    shortAnswer: "Yes, the system includes a centralized document repository with access controls.",
    detailedAnswer: "All official documents can be stored, organized, and retrieved from a single place.\n\n✅ Upload certificates, ID proofs, policy documents, and media files.\n⚡ Organize documents by department, category, or date.\n📌 Role-based access ensures sensitive documents are only visible to authorized users.\n💡 Version history lets you track edits and restore previous document versions.",
  },
  {
    category: "Support & Onboarding",
    icon: "💡",
    question: "Is training or onboarding support available for new institutions?",
    shortAnswer: "Yes, every new institution gets a guided onboarding session and access to detailed documentation.",
    detailedAnswer: "We ensure every institution gets off to a smooth start with dedicated support.\n\n✅ Step-by-step onboarding walkthrough for admins during initial setup.\n⚡ Video tutorials and an in-app knowledge base for self-service learning.\n📌 Dedicated support chat for technical queries and troubleshooting.\n💡 Regular webinars keep your team updated on new features and best practices.",
  },
];

const categoryColors = {
  "Access & Roles":        { accent: "#2563eb", bg: "rgba(37,99,235,0.08)",   border: "rgba(37,99,235,0.2)"   },
  "Institution Management":{ accent: "#7c3aed", bg: "rgba(124,58,237,0.08)",  border: "rgba(124,58,237,0.2)"  },
  "Data Entry":            { accent: "#0891b2", bg: "rgba(8,145,178,0.08)",   border: "rgba(8,145,178,0.2)"   },
  "Volunteer Tracking":    { accent: "#d97706", bg: "rgba(217,119,6,0.08)",   border: "rgba(217,119,6,0.2)"   },
  "Reports & Analytics":   { accent: "#ea580c", bg: "rgba(234,88,12,0.08)",   border: "rgba(234,88,12,0.2)"   },
  "Real-Time Sync":        { accent: "#059669", bg: "rgba(5,150,105,0.08)",   border: "rgba(5,150,105,0.2)"   },
  "Security":              { accent: "#dc2626", bg: "rgba(220,38,38,0.08)",   border: "rgba(220,38,38,0.2)"   },
  "Event Management":      { accent: "#db2777", bg: "rgba(219,39,119,0.08)",  border: "rgba(219,39,119,0.2)"  },
  "Document Storage":      { accent: "#9333ea", bg: "rgba(147,51,234,0.08)",  border: "rgba(147,51,234,0.2)"  },
  "Support & Onboarding":  { accent: "#ca8a04", bg: "rgba(202,138,4,0.08)",   border: "rgba(202,138,4,0.2)"   },
};

const FAQ = () => {
  const [activeIndex, setActiveIndex] = useState(null);
  const [showMore, setShowMore] = useState({});

  const toggleFAQ = (index) => {
    setActiveIndex(activeIndex === index ? null : index);
    setShowMore((prev) => ({ ...prev, [index]: false }));
  };

  const toggleShowMore = (index) => {
    setShowMore((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@700;800;900&display=swap');

        .faq-section {
          background: #f8fafc;
          padding: 72px 24px 80px;
          font-family: 'Sora', sans-serif;
          position: relative;
          overflow: hidden;
        }

        .faq-section::before {
          content: '';
          position: absolute;
          inset: 0;
          background-image: radial-gradient(circle, rgba(37,99,235,0.06) 1px, transparent 1px);
          background-size: 28px 28px;
          pointer-events: none;
          z-index: 0;
        }

        .faq-glow {
          position: absolute;
          border-radius: 50%;
          filter: blur(120px);
          pointer-events: none;
          z-index: 0;
        }
        .faq-glow--tl {
          width: 500px; height: 500px; opacity: 0.1;
          background: radial-gradient(circle, #3b82f6, transparent 70%);
          top: -160px; left: -160px;
        }
        .faq-glow--br {
          width: 400px; height: 400px; opacity: 0.08;
          background: radial-gradient(circle, #6366f1, transparent 70%);
          bottom: -120px; right: -120px;
        }

        .faq-inner {
          position: relative;
          z-index: 1;
          max-width: 1280px;
          margin: 0 auto;
        }

        .faq-header { text-align: center; margin-bottom: 52px; }

        .faq-eyebrow {
          display: inline-flex; align-items: center; gap: 10px;
          font-size: 10px; font-weight: 700;
          letter-spacing: 0.22em; text-transform: uppercase;
          color: #94a3b8; margin-bottom: 14px;
        }
        .faq-eyebrow__dot {
          display: inline-block; width: 5px; height: 5px;
          border-radius: 50%; background: #2563eb;
        }

        .faq-heading {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: clamp(26px, 4vw, 44px);
          font-weight: 900;
          letter-spacing: -0.035em;
          line-height: 1.1;
          color: #0f172a;
          margin-bottom: 14px;
        }
        .faq-heading__accent {
          background: linear-gradient(110deg, #2563eb, #6366f1);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .faq-subtext {
          font-size: 14px; color: #64748b;
          line-height: 1.75; max-width: 560px; margin: 0 auto;
        }
        .faq-count {
          display: inline-flex; align-items: center; gap: 6px;
          margin-top: 16px; font-size: 11px; font-weight: 600; color: #64748b;
          background: #fff; border: 1px solid #e2e8f0;
          border-radius: 999px; padding: 5px 14px;
          box-shadow: 0 1px 4px rgba(0,0,0,0.05);
        }
        .faq-count__dot { width: 6px; height: 6px; border-radius: 50%; background: #22c55e; }

        .faq-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
          align-items: start;
        }
        @media (max-width: 768px) {
          .faq-grid { grid-template-columns: 1fr; }
        }

        .faq-card {
          background: #ffffff;
          border: 1.5px solid #e2e8f0;
          border-radius: 16px;
          overflow: hidden;
          transition: border-color 0.25s, box-shadow 0.25s, transform 0.2s;
          box-shadow: 0 1px 4px rgba(0,0,0,0.05);
        }
        .faq-card:hover {
          border-color: #cbd5e1;
          box-shadow: 0 6px 24px rgba(0,0,0,0.09);
          transform: translateY(-1px);
        }
        .faq-card--active {
          border-color: var(--card-accent) !important;
          box-shadow: 0 0 0 3px var(--card-bg), 0 6px 24px rgba(0,0,0,0.08) !important;
          transform: none !important;
        }

        .faq-card__header {
          display: flex; align-items: center; gap: 12px;
          padding: 16px 18px;
          cursor: pointer;
          user-select: none;
          -webkit-tap-highlight-color: transparent;
        }

        .faq-card__icon {
          width: 38px; height: 38px; flex-shrink: 0;
          border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          font-size: 17px;
          background: var(--card-bg);
          border: 1px solid var(--card-border);
          transition: transform 0.2s;
        }
        .faq-card:hover .faq-card__icon { transform: scale(1.07); }

        .faq-card__text { flex: 1; min-width: 0; }
        .faq-card__category {
          font-size: 9px; font-weight: 700;
          letter-spacing: 0.14em; text-transform: uppercase;
          color: var(--card-accent); margin-bottom: 3px;
        }
        .faq-card__question {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: clamp(12.5px, 1.4vw, 14px);
          font-weight: 800;
          color: #1e293b; line-height: 1.35;
        }

        .faq-card__chevron {
          flex-shrink: 0; width: 26px; height: 26px;
          border-radius: 7px; background: #f1f5f9;
          border: 1px solid #e2e8f0;
          display: flex; align-items: center; justify-content: center;
          transition: background 0.2s, transform 0.3s, border-color 0.2s;
          color: #94a3b8;
        }
        .faq-card--active .faq-card__chevron {
          background: var(--card-bg);
          border-color: var(--card-border);
          color: var(--card-accent);
          transform: rotate(180deg);
        }

        .faq-card__body {
          max-height: 0; overflow: hidden;
          transition: max-height 0.45s cubic-bezier(0.22,1,0.36,1);
        }
        .faq-card__body--open { max-height: 900px; }

        .faq-card__body-inner { padding: 0 18px 18px 68px; }

        .faq-divider { height: 1px; background: #f1f5f9; margin-bottom: 14px; }

        .faq-short-answer {
          font-size: 13px; color: #475569;
          line-height: 1.7; margin-bottom: 12px;
        }

        .faq-more-btn {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 6px 14px; border-radius: 7px;
          font-size: 11px; font-weight: 700;
          font-family: 'Plus Jakarta Sans', sans-serif;
          letter-spacing: 0.04em; cursor: pointer;
          background: var(--card-bg);
          border: 1px solid var(--card-border);
          color: var(--card-accent);
          transition: filter 0.2s, transform 0.15s;
        }
        .faq-more-btn:hover { filter: brightness(0.93); transform: translateY(-1px); }
        .faq-more-btn__arrow { display: inline-block; transition: transform 0.25s; }
        .faq-more-btn--open .faq-more-btn__arrow { transform: rotate(180deg); }

        .faq-detail {
          max-height: 0; overflow: hidden;
          transition: max-height 0.4s cubic-bezier(0.22,1,0.36,1), opacity 0.3s ease;
          opacity: 0;
        }
        .faq-detail--open { max-height: 600px; opacity: 1; }

        .faq-detail__text {
          margin-top: 10px; font-size: 12px; color: #64748b;
          line-height: 1.85; white-space: pre-line;
          background: #f8fafc; border: 1px solid #e2e8f0;
          border-radius: 10px; padding: 12px 14px;
        }

        @media (max-width: 640px) {
          .faq-section { padding: 52px 14px 60px; }
          .faq-card__body-inner { padding: 0 14px 16px 14px; }
          .faq-card__header { padding: 14px; gap: 10px; }
          .faq-card__icon { width: 34px; height: 34px; font-size: 15px; }
        }
      `}</style>

      <section className="faq-section">
        <div className="faq-glow faq-glow--tl" aria-hidden="true" />
        <div className="faq-glow faq-glow--br" aria-hidden="true" />

        <div className="faq-inner">
          <div className="faq-header">
            <div className="faq-eyebrow">
              <span className="faq-eyebrow__dot" />
              Help Center
              <span className="faq-eyebrow__dot" />
            </div>
            <h2 className="faq-heading">
              Frequently Asked{" "}
              <span className="faq-heading__accent">Questions</span>
            </h2>
            <p className="faq-subtext">
              Everything you need to know about managing your College, School, Volunteer, or NGO data — billing, roles, security, and more.
            </p>
            <div className="faq-count">
              <span className="faq-count__dot" />
              {faqs.length} questions covered
            </div>
          </div>

          <div className="faq-grid">
            {faqs.map((faq, index) => {
              const isOpen = activeIndex === index;
              const isMoreOpen = !!showMore[index];
              const colors = categoryColors[faq.category] || {
                accent: "#2563eb", bg: "rgba(37,99,235,0.08)", border: "rgba(37,99,235,0.2)",
              };

              return (
                <div
                  key={index}
                  className={`faq-card${isOpen ? " faq-card--active" : ""}`}
                  style={{
                    "--card-accent": colors.accent,
                    "--card-bg": colors.bg,
                    "--card-border": colors.border,
                  }}
                >
                  <div
                    className="faq-card__header"
                    onClick={() => toggleFAQ(index)}
                    role="button"
                    aria-expanded={isOpen}
                    tabIndex={0}
                    onKeyDown={(e) => e.key === "Enter" && toggleFAQ(index)}
                  >
                    <div className="faq-card__icon">{faq.icon}</div>
                    <div className="faq-card__text">
                      <div className="faq-card__category">{faq.category}</div>
                      <div className="faq-card__question">{faq.question}</div>
                    </div>
                    <div className="faq-card__chevron" aria-hidden="true">
                      <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                        <path d="M3 5l4 4 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  </div>

                  <div className={`faq-card__body${isOpen ? " faq-card__body--open" : ""}`}>
                    <div className="faq-card__body-inner">
                      <div className="faq-divider" />
                      <p className="faq-short-answer">{faq.shortAnswer}</p>
                      <button
                        className={`faq-more-btn${isMoreOpen ? " faq-more-btn--open" : ""}`}
                        onClick={() => toggleShowMore(index)}
                      >
                        {isMoreOpen ? "Less Info" : "More Info"}
                        <span className="faq-more-btn__arrow" aria-hidden="true">
                          <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                            <path d="M2.5 4.5L6 8l3.5-3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </span>
                      </button>
                      <div className={`faq-detail${isMoreOpen ? " faq-detail--open" : ""}`}>
                        <p className="faq-detail__text">{faq.detailedAnswer}</p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </>
  );
};

export default FAQ;
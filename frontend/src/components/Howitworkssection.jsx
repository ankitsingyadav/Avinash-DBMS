/**
 * HowItWorksSection.jsx — Complete Rebuild
 * Mobile: Horizontal pill tabs → detail renders below (NO accordion/grid tricks)
 * Desktop: Left step list + Right sticky detail panel
 * Zero extra whitespace on any screen size.
 */

import { useState } from "react";

/* ── Icons ───────────────────────────────────────────────────────────── */
const Ico = {
  login: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>,
  signup: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>,
  forgot: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>,
  add: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg>,
  update: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/></svg>,
  check: <svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="1.5 6 4 8.5 9.5 2.5"/></svg>,
  arrow: <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="2" y1="6.5" x2="11" y2="6.5"/><polyline points="7.5 3 11 6.5 7.5 10"/></svg>,
};

/* ── Mockups ─────────────────────────────────────────────────────────── */
const M = {
  login: ({ a }) => (
    <div style={{ background: "linear-gradient(155deg,#0f172a,#1e3a5f)", borderRadius: 12, padding: 18 }}>
      <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: ".14em", color: "rgba(255,255,255,.35)", textTransform: "uppercase", marginBottom: 14 }}>DB Manager · Secure Login</div>
      {[["Email","admin@dbmanager.in"],["Password","••••••••••"]].map(([l,v]) => (
        <div key={l} style={{ marginBottom: 9 }}>
          <div style={{ fontSize: 9, color: "rgba(255,255,255,.35)", marginBottom: 3, fontWeight: 600 }}>{l}</div>
          <div style={{ background: "rgba(255,255,255,.07)", border: "1px solid rgba(255,255,255,.11)", borderRadius: 7, padding: "7px 11px", fontSize: 11, color: "rgba(255,255,255,.55)" }}>{v}</div>
        </div>
      ))}
      <div style={{ display: "flex", gap: 5, marginBottom: 12 }}>
        {["Admin","Manager","Viewer"].map((r,i) => (
          <div key={r} style={{ flex: 1, textAlign: "center", padding: "5px 0", borderRadius: 6, fontSize: 9.5, fontWeight: 700, background: i===0 ? a+"30" : "rgba(255,255,255,.05)", border: `1px solid ${i===0 ? a+"55" : "rgba(255,255,255,.09)"}`, color: i===0 ? a : "rgba(255,255,255,.3)" }}>{r}</div>
        ))}
      </div>
      <div style={{ background: a, borderRadius: 8, padding: "9px 0", textAlign: "center", fontSize: 11, fontWeight: 800, color: "#fff" }}>Login to Dashboard →</div>
    </div>
  ),
  signup: ({ a }) => (
    <div style={{ background: "linear-gradient(155deg,#071a0e,#14472c)", borderRadius: 12, padding: 18 }}>
      <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: ".14em", color: "rgba(255,255,255,.35)", textTransform: "uppercase", marginBottom: 12 }}>Create Account · Step 1 of 3</div>
      <div style={{ display: "flex", gap: 4, marginBottom: 13 }}>
        {[0,1,2].map(i => <div key={i} style={{ flex: 1, height: 3, borderRadius: 99, background: i===0 ? a : "rgba(255,255,255,.12)" }} />)}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7, marginBottom: 7 }}>
        {[["Full Name","Rajesh Kumar"],["Organization","DB Manager"]].map(([l,v]) => (
          <div key={l}>
            <div style={{ fontSize: 8.5, color: "rgba(255,255,255,.35)", marginBottom: 3, fontWeight: 600 }}>{l}</div>
            <div style={{ background: "rgba(255,255,255,.07)", border: "1px solid rgba(255,255,255,.1)", borderRadius: 6, padding: "5px 7px", fontSize: 10, color: "rgba(255,255,255,.7)" }}>{v}</div>
          </div>
        ))}
      </div>
      <div style={{ marginBottom: 10 }}>
        <div style={{ fontSize: 8.5, color: "rgba(255,255,255,.35)", marginBottom: 3, fontWeight: 600 }}>Email</div>
        <div style={{ background: "rgba(255,255,255,.07)", border: "1px solid rgba(255,255,255,.1)", borderRadius: 6, padding: "5px 9px", fontSize: 10, color: "rgba(255,255,255,.7)" }}>rajesh@org.in</div>
      </div>
      <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 12 }}>
        {["College Admin","NGO Manager","School Admin"].map((r,i) => (
          <span key={r} style={{ fontSize: 8.5, padding: "3px 7px", borderRadius: 99, fontWeight: 700, background: i===0 ? a+"28" : "rgba(255,255,255,.05)", border: `1px solid ${i===0 ? a+"44" : "rgba(255,255,255,.09)"}`, color: i===0 ? a : "rgba(255,255,255,.3)" }}>{r}</span>
        ))}
      </div>
      <div style={{ background: a, borderRadius: 8, padding: "9px 0", textAlign: "center", fontSize: 11, fontWeight: 800, color: "#fff" }}>Create Account →</div>
    </div>
  ),
  forgot: ({ a }) => (
    <div style={{ background: "linear-gradient(155deg,#1a1000,#3d2800)", borderRadius: 12, padding: 18 }}>
      <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: ".14em", color: "rgba(255,255,255,.35)", textTransform: "uppercase", marginBottom: 14 }}>Password Recovery</div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
        {[["1","Email",a],["2","OTP","rgba(255,255,255,.2)"],["3","Reset","rgba(255,255,255,.2)"]].map(([n,l,c]) => (
          <div key={n} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
            <div style={{ width: 26, height: 26, borderRadius: "50%", background: n==="1" ? a+"28" : "rgba(255,255,255,.05)", border: `2px solid ${c}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 800, color: c }}>{n}</div>
            <span style={{ fontSize: 9, color: "rgba(255,255,255,.35)" }}>{l}</span>
          </div>
        ))}
      </div>
      <div style={{ marginBottom: 9 }}>
        <div style={{ fontSize: 9, color: "rgba(255,255,255,.35)", marginBottom: 4, fontWeight: 600 }}>Registered Email</div>
        <div style={{ background: "rgba(255,255,255,.07)", border: `1px solid ${a}44`, borderRadius: 7, padding: "7px 11px", fontSize: 11, color: "rgba(255,255,255,.55)" }}>raj****@org.in</div>
      </div>
      <div style={{ fontSize: 10, color: "rgba(255,255,255,.35)", textAlign: "center", marginBottom: 12, background: "rgba(255,255,255,.04)", borderRadius: 7, padding: "7px 9px", border: "1px solid rgba(255,255,255,.06)" }}>
        OTP valid for <strong style={{ color: a }}>10 minutes</strong> only
      </div>
      <div style={{ background: a, borderRadius: 8, padding: "9px 0", textAlign: "center", fontSize: 11, fontWeight: 800, color: "#fff" }}>Send OTP →</div>
    </div>
  ),
  add: ({ a }) => (
    <div style={{ background: "linear-gradient(155deg,#0c0a1e,#2d1572)", borderRadius: 12, padding: 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: ".14em", color: "rgba(255,255,255,.35)", textTransform: "uppercase" }}>Add New Record</div>
        <span style={{ fontSize: 8.5, padding: "2px 7px", borderRadius: 99, background: a+"38", color: a, fontWeight: 700 }}>College</span>
      </div>
      <div style={{ display: "flex", gap: 4, marginBottom: 11 }}>
        {["Student","Faculty","Course","Exam"].map((t,i) => (
          <span key={t} style={{ flex: 1, textAlign: "center", fontSize: 8.5, fontWeight: 700, padding: "4px 0", borderRadius: 6, background: i===0 ? a+"32" : "rgba(255,255,255,.04)", border: `1px solid ${i===0 ? a+"50" : "rgba(255,255,255,.07)"}`, color: i===0 ? a : "rgba(255,255,255,.28)" }}>{t}</span>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 7 }}>
        {[["Name","Pooja Sharma"],["ID","2024-CS-088"],["Dept","Computer Sci."],["Sem","3rd"]].map(([l,v]) => (
          <div key={l}>
            <div style={{ fontSize: 7.5, color: "rgba(255,255,255,.3)", marginBottom: 2.5, fontWeight: 600 }}>{l}</div>
            <div style={{ background: "rgba(255,255,255,.07)", border: "1px solid rgba(255,255,255,.09)", borderRadius: 5, padding: "4px 7px", fontSize: 9.5, color: "rgba(255,255,255,.65)" }}>{v}</div>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 5, marginBottom: 11 }}>
        {["Active","Scholarship","Hostel"].map(t => (
          <span key={t} style={{ fontSize: 8.5, padding: "2px 7px", borderRadius: 99, fontWeight: 700, background: a+"20", border: `1px solid ${a}38`, color: a }}>{t}</span>
        ))}
      </div>
      <div style={{ background: a, borderRadius: 8, padding: "9px 0", textAlign: "center", fontSize: 11, fontWeight: 800, color: "#fff" }}>Save Record →</div>
    </div>
  ),
  update: ({ a }) => (
    <div style={{ background: "linear-gradient(155deg,#071a0e,#0a2a1e)", borderRadius: 12, padding: 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: ".14em", color: "rgba(255,255,255,.35)", textTransform: "uppercase" }}>Update Record</div>
        <span style={{ fontSize: 8.5, padding: "2px 7px", borderRadius: 99, background: a+"38", color: a, fontWeight: 700 }}>Edit Mode</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 12, background: a+"14", border: `1px solid ${a}30`, borderRadius: 9, padding: "7px 11px" }}>
        <div style={{ width: 30, height: 30, borderRadius: "50%", background: a+"28", border: `1.5px solid ${a}55`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, color: a }}>P</div>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#fff" }}>Pooja Sharma</div>
          <div style={{ fontSize: 8.5, color: "rgba(255,255,255,.35)" }}>ID: 2024-CS-088</div>
        </div>
      </div>
      {[["Semester","3rd Sem","4th Sem","#22c55e"],["Status","Enrolled","Active + Scholar","#f59e0b"]].map(([f,o,n,c]) => (
        <div key={f} style={{ marginBottom: 8 }}>
          <div style={{ fontSize: 7.5, color: "rgba(255,255,255,.3)", marginBottom: 3, fontWeight: 600 }}>{f.toUpperCase()}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <div style={{ flex: 1, background: "rgba(255,0,0,.07)", border: "1px solid rgba(255,0,0,.18)", borderRadius: 5, padding: "4px 7px", fontSize: 9, color: "rgba(255,100,100,.6)", textDecoration: "line-through" }}>{o}</div>
            <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><path d="M1.5 5.5h8M6 2l3.5 3.5L6 9" stroke={c} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
            <div style={{ flex: 1, background: c+"15", border: `1px solid ${c}3a`, borderRadius: 5, padding: "4px 7px", fontSize: 9, color: c, fontWeight: 700 }}>{n}</div>
          </div>
        </div>
      ))}
      <div style={{ display: "flex", gap: 7, marginTop: 12 }}>
        <div style={{ flex: 1, background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.1)", borderRadius: 7, padding: "7px 0", textAlign: "center", fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,.38)" }}>Discard</div>
        <div style={{ flex: 2, background: a, borderRadius: 7, padding: "7px 0", textAlign: "center", fontSize: 10, fontWeight: 800, color: "#fff" }}>Save Changes →</div>
      </div>
    </div>
  ),
};

/* ── Steps Data ──────────────────────────────────────────────────────── */
const STEPS = [
  {
    id: "login", num: "01", label: "Login", icon: "login",
    title: "Secure Admin Login",
    subtitle: "Access your database management dashboard",
    accent: "#2563eb",
    points: ["Multi-role access — Admin, Manager & Viewer","Two-factor authentication for every account","Session tokens with auto-expiry protection","SSO support for institutional accounts","Full activity log for every login event"],
  },
  {
    id: "signup", num: "02", label: "Sign Up", icon: "signup",
    title: "Create Your Account",
    subtitle: "Register and configure your organization profile",
    accent: "#16a34a",
    points: ["Guided multi-step registration flow","Domain-based organization email validation","Choose type — College, NGO, School or Volunteer","Invite team members with role-specific access","Secure email verification on activation"],
  },
  {
    id: "forgot", num: "03", label: "Forgot Password", icon: "forgot",
    title: "Quick Password Recovery",
    subtitle: "Regain secure access in under 2 minutes",
    accent: "#ea580c",
    points: ["OTP sent to registered email or mobile","Secure link valid for 10 minutes only","Password strength validator enforced","Admin can reset any user from panel","Full audit log for every password change"],
  },
  {
    id: "add", num: "04", label: "Add Data", icon: "add",
    title: "Add New Database Records",
    subtitle: "Insert structured data across all modules",
    accent: "#7c3aed",
    points: ["Smart forms with module-specific validation","Bulk CSV/Excel import for high-volume data","Auto-generated unique ID per record","Duplicate detection before saving","File attachments — docs, photos, certificates"],
  },
  {
    id: "update", num: "05", label: "Update Data", icon: "update",
    title: "Edit & Manage Records",
    subtitle: "Modify existing data with full audit visibility",
    accent: "#0891b2",
    points: ["Inline editing with field-level change tracking","Approval workflow before changes go live","Full version history with one-click rollback","Bulk update using advanced filter queries","Immutable audit trail with timestamps"],
  },
];

/* ── Detail Panel ────────────────────────────────────────────────────── */
function Detail({ s }) {
  const Mockup = M[s.icon];
  return (
    <div style={{ background: "#fff", border: "1.5px solid #f0f4f8", borderRadius: 18, overflow: "hidden" }}>
      <div style={{ padding: 18 }}>
        <Mockup a={s.accent} />
      </div>
      <div style={{ padding: "20px 22px 24px", borderTop: "1px solid #f0f4f8" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 9.5, fontWeight: 700, letterSpacing: ".14em", textTransform: "uppercase", color: s.accent, marginBottom: 9 }}>
          <span style={{ width: 5, height: 5, borderRadius: "50%", background: s.accent, display: "inline-block" }} />
          Step {s.num} — {s.label}
        </div>
        <h3 style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 900, fontSize: 20, letterSpacing: "-.022em", lineHeight: 1.2, color: "#0f172a", margin: "0 0 4px" }}>{s.title}</h3>
        <p style={{ fontSize: 12, color: "#94a3b8", marginBottom: 16, lineHeight: 1.6 }}>{s.subtitle}</p>
        <ul style={{ display: "flex", flexDirection: "column", gap: 8, margin: 0, padding: 0, listStyle: "none" }}>
          {s.points.map((pt, i) => (
            <li key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
              <div style={{ width: 17, height: 17, borderRadius: 5, flexShrink: 0, marginTop: 2, background: s.accent+"18", border: `1px solid ${s.accent}30`, display: "flex", alignItems: "center", justifyContent: "center", color: s.accent }}>
                {Ico.check}
              </div>
              <span style={{ fontSize: 12.5, color: "#374151", lineHeight: 1.65 }}>{pt}</span>
            </li>
          ))}
        </ul>
        <button style={{ marginTop: 18, display: "inline-flex", alignItems: "center", gap: 6, padding: "9px 18px", borderRadius: 10, fontSize: 12, fontWeight: 800, background: s.accent, color: "#fff", border: "none", cursor: "pointer", fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
          Get Started {Ico.arrow}
        </button>
      </div>
    </div>
  );
}

/* ── Main ────────────────────────────────────────────────────────────── */
export default function HowItWorksSection() {
  const [active, setActive] = useState(0);
  const cur = STEPS[active];

  return (
    <section id="how-it-works" style={{ background: "#fff", padding: "48px 16px", fontFamily: "'Sora',sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=Plus+Jakarta+Sans:wght@700;800;900&display=swap');
        #how-it-works *{box-sizing:border-box;margin:0;padding:0;}
        .hiw-pills::-webkit-scrollbar{display:none;}
        .hiw-pill{transition:all .15s ease;}
        .hiw-sbtn{transition:all .16s ease;}
        .hiw-sbtn:hover{transform:translateX(3px);}
        @media(min-width:1024px){.hiw-m{display:none!important;}.hiw-d{display:grid!important;}}
        @media(max-width:1023px){.hiw-m{display:block!important;}.hiw-d{display:none!important;}}
      `}</style>

      <div style={{ maxWidth: 1180, margin: "0 auto" }}>

        {/* Heading */}
        <div style={{ textAlign: "center", marginBottom: 44 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 10, fontWeight: 700, letterSpacing: ".2em", textTransform: "uppercase", color: "#9ca3af", marginBottom: 14 }}>
            <span style={{ width: 22, height: 1.5, background: "#e5e7eb", display: "inline-block" }} />
            Step-by-Step Guide
            <span style={{ width: 22, height: 1.5, background: "#e5e7eb", display: "inline-block" }} />
          </div>
          <h2 style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 900, fontSize: "clamp(26px,3.5vw,40px)", letterSpacing: "-.03em", color: "#0f172a", marginBottom: 10, lineHeight: 1.12 }}>
            How It Works
          </h2>
          <p style={{ fontSize: 14, color: "#6b7280", lineHeight: 1.75, maxWidth: 460, margin: "0 auto" }}>
            Get started with DB Manager in minutes — manage your institution's data securely and efficiently.
          </p>
        </div>

        {/* ── MOBILE: pills + detail below (no tricks, pure content height) ── */}
        <div className="hiw-m">
          {/* Scrollable pill row */}
          <div className="hiw-pills" style={{ display: "flex", gap: 7, overflowX: "auto", paddingBottom: 2, marginBottom: 16, scrollbarWidth: "none" }}>
            {STEPS.map((s, i) => (
              <button
                key={s.id}
                className="hiw-pill"
                onClick={() => setActive(i)}
                style={{
                  flexShrink: 0, display: "flex", alignItems: "center", gap: 6,
                  padding: "7px 13px", borderRadius: 99, cursor: "pointer",
                  border: `2px solid ${i === active ? s.accent : "#e2e8f0"}`,
                  background: i === active ? s.accent + "14" : "#fff",
                  fontSize: 11.5, fontWeight: 700,
                  color: i === active ? s.accent : "#64748b",
                  fontFamily: "'Plus Jakarta Sans',sans-serif",
                  whiteSpace: "nowrap",
                }}
              >
                <span style={{ color: i === active ? s.accent : "#94a3b8", display: "flex" }}>{Ico[s.icon]}</span>
                {s.label}
              </button>
            ))}
          </div>

          {/* Detail — key forces React to re-render (no phantom height) */}
          <Detail key={cur.id} s={cur} />
        </div>

        {/* ── DESKTOP: left list + right panel — equal height ── */}
        <div className="hiw-d" style={{ gridTemplateColumns: "300px 1fr", gap: 22, alignItems: "stretch" }}>

          {/* Left — space-between so cards spread to match right panel height */}
          <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", gap: 14 }}>
            {STEPS.map((s, i) => {
              const on = i === active;
              return (
                <button
                  key={s.id}
                  className="hiw-sbtn"
                  onClick={() => setActive(i)}
                  style={{ width: "100%", display: "flex", alignItems: "center", gap: 13, padding: "13px 13px", borderRadius: 13, textAlign: "left", border: `2px solid ${on ? s.accent : "#f1f5f9"}`, background: on ? s.accent + "10" : "#fff", boxShadow: on ? `0 0 0 3px ${s.accent}15` : "0 1px 3px rgba(0,0,0,.04)", cursor: "pointer" }}
                >
                  <div style={{ width: 38, height: 38, borderRadius: "50%", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: on ? s.accent : "#f8fafc", border: `2px solid ${on ? s.accent : "#e2e8f0"}`, color: on ? "#fff" : "#94a3b8", transition: "all .16s" }}>
                    {on ? Ico[s.icon] : <span style={{ fontSize: 11, fontWeight: 800, fontFamily: "Plus Jakarta Sans" }}>{s.num}</span>}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 8.5, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: on ? s.accent : "#94a3b8", marginBottom: 2 }}>Step {s.num}</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: on ? "#0f172a" : "#475569", fontFamily: "Plus Jakarta Sans", lineHeight: 1.2 }}>{s.title}</div>
                    <div style={{ fontSize: 10.5, color: "#94a3b8", marginTop: 1 }}>{s.subtitle}</div>
                  </div>
                  {on && <span style={{ color: s.accent, flexShrink: 0, display: "flex" }}>{Ico.arrow}</span>}
                </button>
              );
            })}
          </div>

          {/* Right — no sticky, height matches left column naturally */}
          <div>
            <Detail key={cur.id} s={cur} />
          </div>

        </div>

      </div>
    </section>
  );
}
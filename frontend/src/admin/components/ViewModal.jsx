// ─── admin/components/ViewModal.jsx ──────────────────────────────────────────
import { fmtDate } from "../helpers.js";
import { StatusBadge, TypeBadge } from "./ui.jsx";

const LABEL_MAP = {
  _id:              "Record ID",
  centreName:       "Centre Name",
  centreType:       "Centre Type",
  name:             "Name",
  phone:            "Phone",
  email:            "Email",
  website:          "Website",
  address:          "Address",
  city:             "City",
  district:         "District",
  state:            "State",
  pincode:          "Pincode",
  onboardedBy:      "Onboarded By",
  ninAin:           "NIN / AIN",
  area_of_interest: "Area of Interest",
  volunteer_type:   "Volunteer Type",
  remarks:          "Remarks",
  status:           "Status",
  follow_up_date:   "Follow-up Date",
  createdAt:        "Registered On",
  updatedAt:        "Last Updated",
  contacts:         "Contact Persons",
};

const VIEW_FIELDS = {
  organisation: [
    "centreName","centreType","website",
    "address","city","district","state","pincode",
    "onboardedBy","ninAin",
    "contacts",
    "status","createdAt","_id",
  ],
  volunteer: [
    "name","phone","email","website",
    "address","city","district","state",
    "area_of_interest","volunteer_type","remarks",
    "status","follow_up_date","createdAt","_id",
  ],
};

function InteractionModeIcon({ mode }) {
  const icons = {
    Email: (
      <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"/>
      </svg>
    ),
    Phone: (
      <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.387a12.035 12.035 0 01-7.143-7.143c-.155-.441.011-.928.387-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z"/>
      </svg>
    ),
    WhatsApp: (
      <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 9.75a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375m-13.5 3.01c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a1.14 1.14 0 01.778-.332 48.294 48.294 0 005.83-.498c1.585-.233 2.708-1.626 2.708-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z"/>
      </svg>
    ),
    Visit: (
      <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"/>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"/>
      </svg>
    ),
  };
  return icons[mode] || null;
}

// ── Interaction block — two sections: Current + Next ──────────────────────────
function InteractionBlock({ interaction, accent }) {
  if (!interaction) return null;

  const {
    interactionBy, interactedWith, interactionDate,
    interactionMode, interactionStatus, notes, ninAin,
    nextInteractionDate, nextNotes,
  } = interaction;

  const STATUS_COLORS_VM = {
    Initiated:   { color: "#a78bfa", bg: "rgba(167,139,250,0.15)" },
    Pending:     { color: "#fbbf24", bg: "rgba(251,191,36,0.15)"  },
    Progressive: { color: "#60a5fa", bg: "rgba(96,165,250,0.15)"  },
    Active:      { color: "#34d399", bg: "rgba(52,211,153,0.15)"  },
    Inactive:    { color: "#94a3b8", bg: "rgba(148,163,184,0.15)" },
  };

  return (
    <div className="space-y-3 w-full">

      {/* ── CURRENT INTERACTION ── */}
      <div className="p-3 bg-slate-800/40 border border-slate-700/50 rounded-xl space-y-2.5">
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">
          Current Interaction
        </p>

        <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-xs">
          {interactionBy && (
            <div>
              <p className="text-slate-600 text-[10px] uppercase tracking-wide mb-0.5">Interaction By</p>
              <p className="text-white font-medium">{interactionBy}</p>
            </div>
          )}
          {interactedWith && (
            <div>
              <p className="text-slate-600 text-[10px] uppercase tracking-wide mb-0.5">Interacted With</p>
              <p className="text-white font-medium">{interactedWith}</p>
            </div>
          )}
          {interactionDate && (
            <div>
              <p className="text-slate-600 text-[10px] uppercase tracking-wide mb-0.5">Interaction Date</p>
              <p className="text-white font-medium">{fmtDate(interactionDate)}</p>
            </div>
          )}
          {ninAin && (
            <div>
              <p className="text-slate-600 text-[10px] uppercase tracking-wide mb-0.5">AIN / NIN Number</p>
              <p className="text-white font-medium font-mono">{ninAin}</p>
            </div>
          )}
          {interactionStatus && (() => {
            const sc = STATUS_COLORS_VM[interactionStatus] || { color: "#94a3b8", bg: "rgba(148,163,184,0.15)" };
            return (
              <div>
                <p className="text-slate-600 text-[10px] uppercase tracking-wide mb-0.5">Status</p>
                <span style={{
                  fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 99,
                  background: sc.bg, color: sc.color, letterSpacing: "0.04em",
                  textTransform: "uppercase", display: "inline-block",
                }}>
                  {interactionStatus}
                </span>
              </div>
            );
          })()}
        </div>

        {notes && (
          <div className="pt-2 border-t border-slate-700/40">
            <p className="text-slate-600 text-[10px] uppercase tracking-wide mb-1">Notes</p>
            <p className="text-slate-300 text-xs leading-relaxed">{notes}</p>
          </div>
        )}
      </div>

      {/* ── NEXT INTERACTION ── */}
      <div className="p-3 bg-slate-800/40 border border-slate-700/50 rounded-xl space-y-2.5">
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">
          Next Interaction Planned
        </p>

        <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-xs">
          {nextInteractionDate ? (
            <div>
              <p className="text-slate-600 text-[10px] uppercase tracking-wide mb-0.5">Planned Date</p>
              <p className="font-semibold" style={{ color: accent }}>{fmtDate(nextInteractionDate)}</p>
            </div>
          ) : (
            <div>
              <p className="text-slate-600 text-[10px] uppercase tracking-wide mb-0.5">Planned Date</p>
              <p className="text-slate-600 text-xs italic">Not set</p>
            </div>
          )}
          {interactionMode && (
            <div>
              <p className="text-slate-600 text-[10px] uppercase tracking-wide mb-0.5">Mode</p>
              <p className="text-white font-medium flex items-center gap-1">
                <InteractionModeIcon mode={interactionMode} />
                {interactionMode}
              </p>
            </div>
          )}
        </div>

        {nextNotes && (
          <div className="pt-2 border-t border-slate-700/40">
            <p className="text-slate-600 text-[10px] uppercase tracking-wide mb-1">Next Notes</p>
            <p className="text-slate-300 text-xs leading-relaxed">{nextNotes}</p>
          </div>
        )}
      </div>

    </div>
  );
}

// ── Main ViewModal ────────────────────────────────────────────────────────────
export default function ViewModal({ isOpen, onClose, record, category, onEdit, onDelete }) {
  if (!isOpen || !record) return null;

  const fieldOrder = VIEW_FIELDS[category.id] || Object.keys(record);

  const renderValue = (key, val) => {
    if (!val && val !== 0) return null;

    if (key === "_id")
      return <span className="font-mono text-xs text-slate-500 break-all">{val}</span>;

    if (["createdAt","updatedAt","follow_up_date"].includes(key))
      return <span className="text-white text-sm">{fmtDate(val)}</span>;

    if (key === "status")
      return <StatusBadge value={val} />;

    if (key === "centreType" || key === "area_of_interest")
      return <TypeBadge value={val} accent={category.accent} />;

    if (key === "website")
      return (
        <a
          href={val.startsWith("http") ? val : `https://${val}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-indigo-400 hover:text-indigo-300 text-sm underline underline-offset-2 transition-colors"
        >
          {val}
        </a>
      );

    if (key === "ninAin")
      return <span className="text-white text-sm font-mono">{val}</span>;

    if (key === "contacts" && Array.isArray(val)) {
      if (val.length === 0)
        return <span className="text-slate-600 text-xs italic">No contacts</span>;
      return (
        <div className="space-y-3 w-full">
          {val.map((c, i) => (
            <div
              key={i}
              className="p-3 bg-slate-800/40 border border-slate-700/50 rounded-xl shadow-sm"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                  Contact #{i + 1}
                </span>
                <span
                  className="text-[10px] font-semibold px-1.5 py-0.5 rounded"
                  style={{
                    background: `${category.accent}15`,
                    color: category.accent,
                    border: `1px solid ${category.accent}25`,
                  }}
                >
                  {c.designation}
                </span>
              </div>
              <p className="text-sm font-bold text-white mb-1.5">{c.name}</p>
              <div className="flex flex-col gap-1">
                <p className="text-xs text-slate-400 flex items-center gap-1.5">
                  <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.387a12.035 12.035 0 01-7.143-7.143c-.155-.441.011-.928.387-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z"/>
                  </svg>
                  {c.contactNumber}
                </p>
                <p className="text-xs text-slate-400 flex items-center gap-1.5">
                  <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"/>
                  </svg>
                  {c.email}
                </p>
              </div>
            </div>
          ))}
        </div>
      );
    }

    return <span className="text-white text-sm">{String(val)}</span>;
  };

  const hasInteraction = category.id === "organisation" && record.interaction;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-[#13131f] border border-slate-700/50 rounded-2xl shadow-2xl flex flex-col max-h-[85vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="w-9 h-9 rounded-xl shrink-0 flex items-center justify-center"
              style={{ background: `${category.accent}15`, border: `1px solid ${category.accent}30` }}
            >
              <span style={{ color: category.accent }}>{category.icon}</span>
            </div>
            <div className="min-w-0">
              <h3 className="text-white font-bold text-sm truncate">
                {record.centreName || record.name}
              </h3>
              <StatusBadge value={record.status} />
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-600 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors shrink-0"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-6 py-4 space-y-3">

          {/* Location pill row */}
          <div className="flex flex-wrap gap-2 pb-2 border-b border-slate-800/50">
            {[record.city, record.district, record.state, record.pincode].filter(Boolean).map((v, i) => (
              <span
                key={i}
                className="text-xs px-2.5 py-0.5 rounded-full font-medium"
                style={{
                  background: `${category.accent}12`,
                  color: category.accent,
                  border: `1px solid ${category.accent}25`,
                }}
              >
                {v}
              </span>
            ))}
          </div>

          {/* Standard fields */}
          {fieldOrder.map((k) => {
            const val = record[k];
            const rendered = renderValue(k, val);
            if (rendered === null) return null;
            const isContacts = k === "contacts";
            return (
              <div
                key={k}
                className={`flex ${isContacts ? "flex-col gap-2" : "gap-3 items-start"}`}
              >
                <span
                  className={`text-slate-600 text-xs font-semibold uppercase tracking-wide shrink-0 ${
                    isContacts ? "" : "w-32 pt-0.5"
                  }`}
                >
                  {LABEL_MAP[k] || k.replace(/_/g, " ")}
                </span>
                {rendered}
              </div>
            );
          })}

          {/* Interaction Remarks section */}
          {hasInteraction && (
            <div className="pt-3 border-t border-slate-800/50">
              <div className="flex flex-col gap-2">
                <span className="text-slate-600 text-xs font-semibold uppercase tracking-wide">
                  Interaction Remarks
                </span>
                <InteractionBlock
                  interaction={record.interaction}
                  accent={category.accent}
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-2 px-6 py-4 border-t border-slate-800 shrink-0">
          <button
            onClick={() => { onClose(); onEdit(record); }}
            className="flex-1 py-2 rounded-lg text-xs font-semibold transition-all hover:-translate-y-0.5"
            style={{
              background: `${category.accent}18`,
              color: category.accent,
              border: `1px solid ${category.accent}30`,
            }}
          >
            ✏️ Edit
          </button>
          <button
            onClick={() => { onClose(); onDelete(record); }}
            className="flex-1 py-2 rounded-lg text-xs font-semibold text-red-400 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 transition-all"
          >
            🗑 Delete
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-2 rounded-lg text-xs font-medium text-slate-400 bg-slate-800/60 border border-slate-700/50 hover:text-white transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
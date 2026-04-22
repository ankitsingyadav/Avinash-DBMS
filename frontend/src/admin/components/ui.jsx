// ─── admin/components/ui.jsx ──────────────────────────────────────────────────

// Data completion status (replaces old Active/Inactive status)
const DATA_STATUS_COLORS = {
  "Complete": { bg: "rgba(16,185,129,0.12)",  text: "#10b981", dot: "#10b981" },
  "Partial":  { bg: "rgba(245,158,11,0.13)",  text: "#f59e0b", dot: "#f59e0b" },
  "Basic":    { bg: "rgba(99,102,241,0.13)",   text: "#818cf8", dot: "#6366f1" },
};

// Legacy Active/Inactive (kept for volunteer status, etc.)
const STATUS_COLORS = {
  "Active":     { bg: "rgba(16,185,129,0.12)",  text: "#10b981", dot: "#10b981" },
  "Inactive":   { bg: "rgba(100,116,139,0.15)", text: "#64748b", dot: "#475569" },
  "Not Active": { bg: "rgba(239,68,68,0.12)",   text: "#f87171", dot: "#ef4444" },
};

export function StatusBadge({ value }) {
  const c = STATUS_COLORS[value] || STATUS_COLORS["Inactive"];
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap"
      style={{ background: c.bg, color: c.text }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: c.dot }} />
      {value || "—"}
    </span>
  );
}

export function DataStatusBadge({ value }) {
  const c = DATA_STATUS_COLORS[value] || DATA_STATUS_COLORS["Basic"];
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap"
      style={{ background: c.bg, color: c.text }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: c.dot }} />
      {value || "Basic"}
    </span>
  );
}

export function TypeBadge({ value, accent }) {
  if (!value) return <span className="text-slate-700 text-xs">—</span>;
  return (
    <span
      className="inline-block px-2 py-0.5 rounded-md text-xs font-semibold whitespace-nowrap"
      style={{ background: `${accent}15`, color: accent, border: `1px solid ${accent}25` }}
    >
      {value}
    </span>
  );
}

export function HighlightText({ text, query }) {
  if (!query || !text) return <span>{text || "—"}</span>;
  const str = String(text);
  const idx = str.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return <span>{str}</span>;
  return (
    <span>
      {str.slice(0, idx)}
      <mark
        style={{
          background: "rgba(250,204,21,0.25)",
          color: "#fde68a",
          borderRadius: "3px",
          padding: "0 2px",
        }}
      >
        {str.slice(idx, idx + query.length)}
      </mark>
      {str.slice(idx + query.length)}
    </span>
  );
}

// Reusable input className builder
export const inputCls = (hasError = false) =>
  `w-full bg-slate-800/60 border ${
    hasError ? "border-red-500/60" : "border-slate-700/50"
  } rounded-lg px-3 py-2 text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 ${
    hasError
      ? "focus:ring-red-500/30"
      : "focus:ring-indigo-500/30 focus:border-indigo-500/50"
  } transition-all`;
// ─── admin/components/ui.jsx  (LIGHT THEME) ──────────────────────────────────

const DATA_STATUS_COLORS = {
  "Complete": { bg: "#dcfce7", text: "#14532d", dot: "#16a34a", border: "#86efac" },
  "Partial":  { bg: "#fef9c3", text: "#713f12", dot: "#ca8a04", border: "#fde047" },
  "Basic":    { bg: "#dbeafe", text: "#1e3a8a", dot: "#2563eb", border: "#93c5fd" },
};

const STATUS_COLORS = {
  "Active":     { bg: "#dcfce7", text: "#14532d", dot: "#16a34a", border: "#86efac" },
  "Inactive":   { bg: "#f1f5f9", text: "#475569", dot: "#94a3b8", border: "#cbd5e1" },
  "Not Active": { bg: "#fee2e2", text: "#991b1b", dot: "#ef4444", border: "#fca5a5" },
};

export function StatusBadge({ value }) {
  const c = STATUS_COLORS[value] || STATUS_COLORS["Inactive"];
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap"
      style={{ background: c.bg, color: c.text, border: `1px solid ${c.border}` }}
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
      className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap"
      style={{ background: c.bg, color: c.text, border: `1px solid ${c.border}` }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: c.dot }} />
      {value || "Basic"}
    </span>
  );
}

export function TypeBadge({ value, accent }) {
  if (!value) return <span className="text-slate-400 text-xs">—</span>;
  return (
    <span
      className="inline-block px-2.5 py-0.5 rounded-md text-xs font-semibold whitespace-nowrap"
      style={{
        background: `${accent}18`,
        color: accent,
        border: `1px solid ${accent}35`,
      }}
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
          background: "#fef08a",
          color: "#713f12",
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

// Light-theme input class builder
export const inputCls = (hasError = false) =>
  `w-full bg-white border ${
    hasError ? "border-red-400 ring-1 ring-red-200" : "border-slate-300"
  } rounded-lg px-3 py-2 text-slate-900 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 ${
    hasError
      ? "focus:ring-red-200 focus:border-red-400"
      : "focus:ring-blue-100 focus:border-blue-400"
  } transition-all shadow-sm`;
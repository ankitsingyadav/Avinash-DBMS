// ─── admin/components/FilterDropdown.jsx ─────────────────────────────────────
import { useState, useEffect, useRef } from "react";

export default function FilterDropdown({ filter, value, onChange, accent }) {
  const [open, setOpen] = useState(false);
  const ref = useRef();

  useEffect(() => {
    const fn = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  const active = !!value;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border"
        style={
          active
            ? { background: `${accent}18`, color: accent, border: `1px solid ${accent}30` }
            : { background: "rgba(30,41,59,0.6)", color: "#64748b", border: "1px solid rgba(51,65,85,0.5)" }
        }>
        {filter.label}
        {active && (
          <span className="opacity-75">: {value.length > 12 ? value.slice(0, 12) + "…" : value}</span>
        )}
        <svg
          xmlns="http://www.w3.org/2000/svg" width="9" height="9" fill="none"
          viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
          className={`transition-transform duration-150 ${open ? "rotate-180" : ""}`}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/>
        </svg>
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1.5 w-48 bg-[#1a1a2e] border border-slate-700/60 rounded-xl shadow-2xl z-40 overflow-hidden">
          <div className="p-1.5">
            <button
              onClick={() => { onChange(""); setOpen(false); }}
              className="w-full text-left px-3 py-1.5 rounded-lg text-xs transition-colors"
              style={!value ? { background: "rgba(51,65,85,0.5)", color: "#e2e8f0", fontWeight: 600 } : { color: "#64748b" }}>
              All {filter.label}s
            </button>
            <div className="my-1 border-t border-slate-800" />
            <div className="max-h-52 overflow-y-auto">
              {filter.options.map((opt) => (
                <button
                  key={opt}
                  onClick={() => { onChange(opt); setOpen(false); }}
                  className="w-full text-left px-3 py-1.5 rounded-lg text-xs transition-all"
                  style={value === opt ? { background: `${accent}15`, color: accent, fontWeight: 600 } : { color: "#94a3b8" }}>
                  {opt}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
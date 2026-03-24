// ─── admin/components/FilterDropdown.jsx ─────────────────────────────────────
import { useState, useEffect, useRef, useCallback } from "react";
import { INDIA_LOCATION_DATA } from "../../components/LocationSelector"; // ← local data

// ── Get districts locally (no API needed) ─────────────────────────────────────
function getDistrictsForState(state) {
  if (!state) return [];
  const districtMap = INDIA_LOCATION_DATA[state]?.districts || {};
  return Object.keys(districtMap).sort();
}

// ── Single FilterDropdown ──────────────────────────────────────────────────────
export default function FilterDropdown({
  filter,
  value,
  onChange,
  accent,
  dependentValue,
  disabled,
}) {
  const [open, setOpen]       = useState(false);
  const [search, setSearch]   = useState("");
  const [options, setOptions] = useState(filter.options ?? []);
  const ref                   = useRef();
  const searchRef             = useRef();

  // ── Close on outside click ─────────────────────────────────────────────────
  useEffect(() => {
    const fn = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  // ── Focus search when opened ───────────────────────────────────────────────
  useEffect(() => {
    if (open && searchRef.current) {
      setTimeout(() => searchRef.current?.focus(), 50);
    } else {
      setSearch("");
    }
  }, [open]);

  // ── Load districts from LOCAL data when state changes ─────────────────────
  useEffect(() => {
    if (filter.async) {
      if (dependentValue) {
        const districts = getDistrictsForState(dependentValue);
        setOptions(districts);
      } else {
        setOptions([]);
      }
    }
  }, [filter.async, dependentValue]);

  // ── Reset value when dependent parent changes ──────────────────────────────
  useEffect(() => {
    if (filter.dependsOn && value) {
      onChange("");
    }
    // eslint-disable-next-line
  }, [dependentValue]);

  const active          = !!value;
  const isDisabled      = disabled || (filter.dependsOn && !dependentValue);
  const filteredOptions = options.filter((o) =>
    search ? String(o).toLowerCase().includes(search.toLowerCase()) : true
  );

  const displayValue = value
    ? value.length > 14 ? value.slice(0, 14) + "…" : value
    : null;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => !isDisabled && setOpen((o) => !o)}
        title={isDisabled && filter.dependsOn ? `Select ${filter.dependsOn} first` : undefined}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border select-none"
        style={
          isDisabled
            ? { background: "rgba(15,23,42,0.4)", color: "#1e293b", border: "1px solid rgba(30,41,59,0.4)", cursor: "not-allowed" }
            : active
            ? { background: `${accent}18`, color: accent, border: `1px solid ${accent}30` }
            : { background: "rgba(30,41,59,0.6)", color: "#64748b", border: "1px solid rgba(51,65,85,0.5)", cursor: "pointer" }
        }
      >
        {/* Dependent indicator dot */}
        {filter.dependsOn && !isDisabled && (
          <span
            className="w-1.5 h-1.5 rounded-full shrink-0"
            style={{ background: active ? accent : "#334155" }}
          />
        )}

        <span>{filter.label}</span>

        {active && (
          <span className="opacity-75 max-w-[80px] truncate">: {displayValue}</span>
        )}

        {/* Chevron */}
        <svg
          xmlns="http://www.w3.org/2000/svg" width="9" height="9" fill="none"
          viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
          className={`transition-transform duration-150 shrink-0 ${open ? "rotate-180" : ""}`}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/>
        </svg>

        {/* Clear button */}
        {active && !isDisabled && (
          <span
            role="button"
            onClick={(e) => { e.stopPropagation(); onChange(""); }}
            className="ml-0.5 rounded-full hover:opacity-100 opacity-60 transition-opacity"
            style={{ color: accent }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </span>
        )}
      </button>

      {open && !isDisabled && (
        <div className="absolute top-full left-0 mt-1.5 w-52 bg-[#1a1a2e] border border-slate-700/60 rounded-xl shadow-2xl z-40 overflow-hidden">
          {/* Search box (show if >8 options) */}
          {options.length > 8 && (
            <div className="p-2 border-b border-slate-800">
              <div className="relative">
                <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-600">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                </svg>
                <input
                  ref={searchRef}
                  type="text"
                  placeholder={`Search ${filter.label}…`}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-slate-800/60 border border-slate-700/40 rounded-lg pl-7 pr-3 py-1.5 text-white text-xs placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500/30"
                />
              </div>
            </div>
          )}

          <div className="p-1.5">
            {/* All option */}
            <button
              onClick={() => { onChange(""); setOpen(false); }}
              className="w-full text-left px-3 py-1.5 rounded-lg text-xs transition-colors"
              style={
                !value
                  ? { background: "rgba(51,65,85,0.5)", color: "#e2e8f0", fontWeight: 600 }
                  : { color: "#64748b" }
              }
            >
              All {filter.label}s
            </button>

            <div className="my-1 border-t border-slate-800" />

            {/* Empty state — state select nahi kiya abhi */}
            {filter.dependsOn && !dependentValue && (
              <p className="text-center text-xs text-slate-700 py-4 italic">
                Select {filter.dependsOn} first
              </p>
            )}

            {/* No districts found */}
            {filter.dependsOn && dependentValue && options.length === 0 && (
              <p className="text-center text-xs text-slate-700 py-4 italic">
                No districts found
              </p>
            )}

            {/* Options list */}
            <div className="max-h-52 overflow-y-auto">
              {filteredOptions.length === 0 && search && (
                <p className="text-center text-xs text-slate-700 py-4 italic">
                  No match for "{search}"
                </p>
              )}

              {filteredOptions.map((opt) => (
                <button
                  key={opt}
                  onClick={() => { onChange(opt); setOpen(false); setSearch(""); }}
                  className="w-full text-left px-3 py-1.5 rounded-lg text-xs transition-all flex items-center gap-2"
                  style={
                    value === opt
                      ? { background: `${accent}15`, color: accent, fontWeight: 600 }
                      : { color: "#94a3b8" }
                  }
                >
                  {value === opt && (
                    <svg xmlns="http://www.w3.org/2000/svg" width="9" height="9" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
                    </svg>
                  )}
                  <span className={value === opt ? "" : "ml-[13px]"}>{opt}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
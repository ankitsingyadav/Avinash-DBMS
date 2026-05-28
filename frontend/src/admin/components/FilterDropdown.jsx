// ─── admin/components/FilterDropdown.jsx  (LIGHT THEME) ──────────────────────
import { useState, useEffect, useRef } from "react";
import { INDIA_LOCATION_DATA } from "../../components/LocationSelector";

function getDistrictsForState(state) {
  if (!state) return [];
  const districtMap = INDIA_LOCATION_DATA[state]?.districts || {};
  return Object.keys(districtMap).sort();
}

export default function FilterDropdown({ filter, value, onChange, accent, dependentValue, disabled }) {
  const [open,    setOpen]    = useState(false);
  const [search,  setSearch]  = useState("");
  const [options, setOptions] = useState(filter.options ?? []);
  const ref       = useRef();
  const searchRef = useRef();

  useEffect(() => {
    const fn = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  useEffect(() => {
    if (open && searchRef.current) setTimeout(() => searchRef.current?.focus(), 50);
    else setSearch("");
  }, [open]);

  useEffect(() => {
    if (filter.async) {
      if (dependentValue) setOptions(getDistrictsForState(dependentValue));
      else setOptions([]);
    }
  }, [filter.async, dependentValue]);

  useEffect(() => {
    if (filter.dependsOn && value) onChange("");
  }, [dependentValue]); // eslint-disable-line

  const active          = !!value;
  const isDisabled      = disabled || (filter.dependsOn && !dependentValue);
  const filteredOptions = options.filter((o) => search ? String(o).toLowerCase().includes(search.toLowerCase()) : true);
  const displayValue    = value ? (value.length > 14 ? value.slice(0, 14) + "…" : value) : null;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => !isDisabled && setOpen((o) => !o)}
        title={isDisabled && filter.dependsOn ? `Select ${filter.dependsOn} first` : undefined}
        className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all border select-none"
        style={
          isDisabled
            ? { background: "#f1f5f9", color: "#cbd5e1", borderColor: "#e2e8f0", cursor: "not-allowed" }
            : active
            ? { background: `${accent}12`, color: accent, borderColor: `${accent}35` }
            : { background: "#f8fafc", color: "#64748b", borderColor: "#e2e8f0", cursor: "pointer" }
        }
      >
        {filter.dependsOn && !isDisabled && (
          <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: active ? accent : "#cbd5e1" }} />
        )}
        <span>{filter.label}</span>
        {active && <span className="opacity-75 max-w-[80px] truncate">: {displayValue}</span>}
        <svg xmlns="http://www.w3.org/2000/svg" width="9" height="9" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
          className={`transition-transform duration-150 shrink-0 ${open ? "rotate-180" : ""}`}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/>
        </svg>
        {active && !isDisabled && (
          <span role="button" onClick={(e) => { e.stopPropagation(); onChange(""); }}
            className="ml-0.5 rounded-full hover:opacity-100 opacity-60 transition-opacity" style={{ color: accent }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </span>
        )}
      </button>

      {open && !isDisabled && (
        <div className="absolute top-full left-0 mt-1.5 w-52 bg-white border border-slate-200 rounded-xl shadow-xl z-40 overflow-hidden">
          {options.length > 8 && (
            <div className="p-2 border-b border-slate-100">
              <div className="relative">
                <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                </svg>
                <input ref={searchRef} type="text" placeholder={`Search ${filter.label}…`} value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-7 pr-3 py-1.5 text-slate-800 text-xs placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-200"/>
              </div>
            </div>
          )}
          <div className="p-1.5">
            <button onClick={() => { onChange(""); setOpen(false); }}
              className="w-full text-left px-3 py-1.5 rounded-lg text-xs transition-colors"
              style={!value ? { background: "#f1f5f9", color: "#1e293b", fontWeight: 600 } : { color: "#64748b" }}>
              All {filter.label}s
            </button>
            <div className="my-1 border-t border-slate-100" />
            {filter.dependsOn && !dependentValue && (
              <p className="text-center text-xs text-slate-400 py-4 italic">Select {filter.dependsOn} first</p>
            )}
            {filter.dependsOn && dependentValue && options.length === 0 && (
              <p className="text-center text-xs text-slate-400 py-4 italic">No districts found</p>
            )}
            <div className="max-h-52 overflow-y-auto">
              {filteredOptions.length === 0 && search && (
                <p className="text-center text-xs text-slate-400 py-4 italic">No match for "{search}"</p>
              )}
              {filteredOptions.map((opt) => (
                <button key={opt} onClick={() => { onChange(opt); setOpen(false); setSearch(""); }}
                  className="w-full text-left px-3 py-1.5 rounded-lg text-xs transition-all flex items-center gap-2"
                  style={value === opt ? { background: `${accent}10`, color: accent, fontWeight: 600 } : { color: "#475569" }}>
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
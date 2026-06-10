// admin/components/DuplicateReviewModal.jsx
import { useState } from "react";
import axios from "../../utils/axios.js";
import toast from "react-hot-toast";
import { buildPayload } from "../helpers.js";

// ─────────────────────────────────────────────────────────────────────────────
// DuplicateReviewModal
//
// Props:
//   isOpen        — boolean
//   onClose       — () => void
//   onDone        — (forceInsertedCount: number) => void   called after force-insert
//   duplicates    — Array<{ index, incoming, existing, catLabel, endpoint, fields }>
// ─────────────────────────────────────────────────────────────────────────────

export default function DuplicateReviewModal({ isOpen, onClose, onDone, duplicates = [] }) {
  const [checked,   setChecked]   = useState(new Set());
  const [loading,   setLoading]   = useState(false);
  const [selectAll, setSelectAll] = useState(false);

  if (!isOpen || duplicates.length === 0) return null;

  const toggle = (idx) => {
    setChecked((prev) => {
      const next = new Set(prev);
      next.has(idx) ? next.delete(idx) : next.add(idx);
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setChecked(new Set());
      setSelectAll(false);
    } else {
      setChecked(new Set(duplicates.map((_, i) => i)));
      setSelectAll(true);
    }
  };

  const handleForceInsert = async () => {
    if (checked.size === 0) {
      onClose();
      return;
    }

    setLoading(true);
    const toInsert = [...checked].map((i) => duplicates[i]);

    // Group by endpoint so we can batch per category
    const byEndpoint = {};
    for (const d of toInsert) {
      if (!byEndpoint[d.endpoint]) byEndpoint[d.endpoint] = [];
      byEndpoint[d.endpoint].push(d);
    }

    let totalInserted = 0;
    let totalFailed   = 0;

    for (const [endpoint, items] of Object.entries(byEndpoint)) {
      const payloads = items.map((d) => ({
        ...buildPayload(d.incoming, d.fields),
        forceInsert: true,
      }));

      try {
        // Try bulk force-insert first
        const res = await axios.post(`${endpoint}/bulk`, { records: payloads });
        totalInserted += res.data?.inserted ?? payloads.length;
      } catch (bulkErr) {
        // Fallback: sequential
        for (const payload of payloads) {
          try {
            await axios.post(endpoint, payload);
            totalInserted++;
          } catch {
            totalFailed++;
          }
        }
      }
    }

    setLoading(false);

    if (totalInserted > 0) toast.success(`${totalInserted} duplicate record${totalInserted > 1 ? "s" : ""} inserted.`);
    if (totalFailed   > 0) toast.error(`${totalFailed} record${totalFailed > 1 ? "s" : ""} failed to insert.`);

    onDone(totalInserted);
  };

  const checkedCount   = checked.size;
  const skippedCount   = duplicates.length - checkedCount;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center px-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={!loading ? onClose : undefined}
      />

      <div className="relative w-full max-w-2xl bg-[#13131f] border border-slate-700/50 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            {/* Warning icon */}
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="#f59e0b" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
              </svg>
            </div>
            <div>
              <h3 className="text-white font-bold text-sm">Duplicate Records Found</h3>
              <p className="text-slate-500 text-xs mt-0.5">
                {duplicates.length} record{duplicates.length > 1 ? "s" : ""} already exist in the database
              </p>
            </div>
          </div>
          {!loading && (
            <button
              onClick={onClose}
              className="text-slate-600 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          )}
        </div>

        {/* ── Explanation banner ──────────────────────────────────────────── */}
        <div className="mx-6 mt-4 px-4 py-2.5 rounded-xl bg-amber-500/5 border border-amber-500/15 shrink-0">
          <p className="text-amber-400/80 text-xs leading-relaxed">
            Tick the records you want to <strong className="text-amber-400">insert anyway</strong>. Unticked records will be skipped. Duplicate check is based on <span className="font-mono text-amber-300/70">Centre Name + Centre Type + Pincode</span>.
          </p>
        </div>

        {/* ── Select-all bar ──────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-6 py-3 shrink-0">
          <button
            onClick={handleSelectAll}
            className="flex items-center gap-2 text-xs text-slate-400 hover:text-white transition-colors"
          >
            <div
              className="w-4 h-4 rounded flex items-center justify-center"
              style={{
                background: selectAll ? "#6366f1" : "transparent",
                border: `1.5px solid ${selectAll ? "#6366f1" : "#475569"}`,
              }}
            >
              {selectAll && (
                <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="#fff" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
                </svg>
              )}
            </div>
            {selectAll ? "Deselect all" : "Select all"}
          </button>
          <div className="flex items-center gap-3 text-xs">
            {checkedCount > 0 && (
              <span className="text-indigo-400 font-semibold">{checkedCount} to insert</span>
            )}
            {skippedCount > 0 && (
              <span className="text-slate-600">{skippedCount} to skip</span>
            )}
          </div>
        </div>

        {/* ── Duplicate list ──────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto px-6 pb-2 space-y-2 min-h-0">
          {duplicates.map((d, i) => {
            const isChecked = checked.has(i);
            const inc = d.incoming;
            const ex  = d.existing;

            return (
              <div
                key={i}
                onClick={() => toggle(i)}
                className="rounded-xl border cursor-pointer transition-all"
                style={{
                  borderColor: isChecked ? "#6366f130" : "#1e293b",
                  background:  isChecked ? "#6366f108" : "#0f172a",
                }}
              >
                {/* Row header */}
                <div className="flex items-start gap-3 px-4 py-3">
                  {/* Checkbox */}
                  <div
                    className="w-4 h-4 rounded flex items-center justify-center shrink-0 mt-0.5"
                    style={{
                      background: isChecked ? "#6366f1" : "transparent",
                      border: `1.5px solid ${isChecked ? "#6366f1" : "#475569"}`,
                    }}
                  >
                    {isChecked && (
                      <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="#fff" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
                      </svg>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    {/* Centre name + type badge */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-white text-sm font-semibold truncate">
                        {inc.centreName || inc.name || "—"}
                      </span>
                      {inc.centreType && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-slate-700/60 text-slate-400 font-medium shrink-0">
                          {inc.centreType}
                        </span>
                      )}
                      {d.catLabel && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 font-medium shrink-0">
                          {d.catLabel}
                        </span>
                      )}
                    </div>

                    {/* Incoming vs Existing comparison */}
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      {/* Incoming */}
                      <div className="bg-slate-800/40 rounded-lg px-3 py-2 space-y-1">
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Importing</p>
                        <p className="text-xs text-slate-300 truncate">{inc.city || "—"}{inc.state ? `, ${inc.state}` : ""}</p>
                        <p className="text-xs text-slate-500 font-mono">{inc.pincode || "—"}</p>
                      </div>
                      {/* Existing */}
                      <div className="bg-amber-500/5 rounded-lg px-3 py-2 space-y-1 border border-amber-500/10">
                        <p className="text-xs font-semibold text-amber-500/60 uppercase tracking-wider">In Database</p>
                        <p className="text-xs text-slate-300 truncate">
                          {[ex.city, ex.district, ex.state].filter(Boolean).join(", ") || "—"}
                        </p>
                        <p className="text-xs text-slate-500 font-mono">{ex.pincode || "—"}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Footer ─────────────────────────────────────────────────────── */}
        <div className="px-6 py-4 border-t border-slate-800 shrink-0">
          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={loading}
              className="flex-1 py-2.5 rounded-lg text-sm font-medium text-slate-400 bg-slate-800/60 border border-slate-700/50 hover:text-white transition-all disabled:opacity-40"
            >
              Skip All & Close
            </button>
            <button
              onClick={handleForceInsert}
              disabled={loading}
              className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-white transition-all hover:-translate-y-0.5 disabled:opacity-60 disabled:translate-y-0 flex items-center justify-center gap-2"
              style={{
                background: checkedCount > 0
                  ? "linear-gradient(135deg,#6366f1,#8b5cf6)"
                  : "linear-gradient(135deg,#374151,#4b5563)",
                boxShadow: checkedCount > 0 ? "0 4px 15px rgba(99,102,241,0.2)" : "none",
              }}
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Inserting…
                </>
              ) : checkedCount > 0 ? (
                `Insert ${checkedCount} Record${checkedCount > 1 ? "s" : ""}`
              ) : (
                "Skip All"
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
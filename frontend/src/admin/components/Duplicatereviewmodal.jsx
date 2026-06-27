// admin/components/DuplicateReviewModal.jsx
import { useState, useEffect } from "react";
import axios from "../../utils/axios.js";
import toast from "react-hot-toast";
import { buildPayload } from "../helpers.js";

// Per-record action choices
const ACTION_SKIP   = "skip";
const ACTION_INSERT = "insert";
const ACTION_MERGE  = "merge";

// ─────────────────────────────────────────────────────────────────────────────
// DuplicateReviewModal
//
// Props:
//   isOpen        — boolean
//   onClose       — () => void
//   onDone        — (processed: number) => void
//   duplicates    — Array<{ index, incoming, existing, catLabel, endpoint, fields }>
// ─────────────────────────────────────────────────────────────────────────────

export default function DuplicateReviewModal({ isOpen, onClose, onDone, duplicates = [] }) {
  const [actions,  setActions]  = useState({});
  const [loading,  setLoading]  = useState(false);

  // Re-initialise actions every time the duplicates list changes (e.g. first load)
  useEffect(() => {
    if (duplicates.length > 0) {
      setActions(Object.fromEntries(duplicates.map((_, i) => [i, ACTION_SKIP])));
    }
  }, [duplicates.length]);

  if (!isOpen || duplicates.length === 0) return null;

  const setAction = (idx, action) =>
    setActions((prev) => ({ ...prev, [idx]: action }));

  const countOf = (action) =>
    Object.values(actions).filter((a) => a === action).length;

  const handleConfirm = async () => {
    const toInsert = duplicates.filter((_, i) => actions[i] === ACTION_INSERT);
    const toMerge  = duplicates.filter((_, i) => actions[i] === ACTION_MERGE);

    if (toInsert.length === 0 && toMerge.length === 0) {
      onClose();
      return;
    }

    setLoading(true);
    let totalProcessed = 0;
    let totalFailed    = 0;

    // ── Force-inserts (grouped by endpoint for bulk) ──────────────────────
    if (toInsert.length > 0) {
      const byEndpoint = {};
      for (const d of toInsert) {
        if (!byEndpoint[d.endpoint]) byEndpoint[d.endpoint] = [];
        byEndpoint[d.endpoint].push(d);
      }
      for (const [endpoint, items] of Object.entries(byEndpoint)) {
        const payloads = items.map((d) => ({
          ...buildPayload(d.incoming, d.fields),
          forceInsert: true,
        }));
        try {
          const res = await axios.post(`${endpoint}/bulk`, { records: payloads });
          totalProcessed += res.data?.inserted ?? payloads.length;
        } catch {
          for (const payload of payloads) {
            try {
              await axios.post(endpoint, payload);
              totalProcessed++;
            } catch {
              totalFailed++;
            }
          }
        }
      }
    }

    // ── Merges (one request per record using existing._id) ────────────────
    for (const d of toMerge) {
      const existingId = d.existing?._id;
      if (!existingId) { totalFailed++; continue; }
      try {
        const payload = buildPayload(d.incoming, d.fields);
        await axios.post(`${d.endpoint}/${existingId}/merge`, payload);
        totalProcessed++;
      } catch {
        totalFailed++;
      }
    }

    setLoading(false);

    if (totalProcessed > 0)
      toast.success(`${totalProcessed} record${totalProcessed > 1 ? "s" : ""} processed.`);
    if (totalFailed > 0)
      toast.error(`${totalFailed} record${totalFailed > 1 ? "s" : ""} failed.`);

    onDone(totalProcessed);
  };

  const insertCount = countOf(ACTION_INSERT);
  const mergeCount  = countOf(ACTION_MERGE);
  const skipCount   = countOf(ACTION_SKIP);
  const hasWork     = insertCount > 0 || mergeCount > 0;

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
            Choose an action for each duplicate:&nbsp;
            <strong className="text-slate-400">Skip</strong> to ignore,&nbsp;
            <strong className="text-emerald-400">Merge</strong> to add new contacts&nbsp;&amp; interactions into the existing record, or&nbsp;
            <strong className="text-indigo-400">Insert</strong> to create a separate copy.
          </p>
        </div>

        {/* ── Summary bar ────────────────────────────────────────────────── */}
        <div className="flex items-center gap-4 px-6 py-3 shrink-0 text-xs">
          {insertCount > 0 && <span className="text-indigo-400 font-semibold">{insertCount} insert</span>}
          {mergeCount  > 0 && <span className="text-emerald-400 font-semibold">{mergeCount} merge</span>}
          {skipCount   > 0 && <span className="text-slate-600">{skipCount} skip</span>}
        </div>

        {/* ── Duplicate list ──────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto px-6 pb-2 space-y-2 min-h-0">
          {duplicates.map((d, i) => {
            const action = actions[i];
            const inc    = d.incoming;
            const ex     = d.existing;

            const borderColor =
              action === ACTION_INSERT ? "#6366f130" :
              action === ACTION_MERGE  ? "#10b98130" : "#1e293b";
            const bgColor =
              action === ACTION_INSERT ? "#6366f108" :
              action === ACTION_MERGE  ? "#10b98108" : "#0f172a";

            return (
              <div
                key={i}
                className="rounded-xl border transition-all"
                style={{ borderColor, background: bgColor }}
              >
                {/* Info row */}
                <div className="flex items-start gap-3 px-4 pt-3 pb-2">
                  <div className="flex-1 min-w-0">
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

                    <div className="mt-2 grid grid-cols-2 gap-2">
                      <div className="bg-slate-800/40 rounded-lg px-3 py-2 space-y-1">
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Importing</p>
                        <p className="text-xs text-slate-300 truncate">{inc.city || "—"}{inc.state ? `, ${inc.state}` : ""}</p>
                        <p className="text-xs text-slate-500 font-mono">{inc.pincode || "—"}</p>
                      </div>
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

                {/* Action selector */}
                <div className="flex gap-2 px-4 pb-3">
                  {[
                    { key: ACTION_SKIP,   label: "Skip",   activeClass: "bg-slate-700 text-white border-slate-600" },
                    { key: ACTION_MERGE,  label: "Merge",  activeClass: "bg-emerald-600/20 text-emerald-300 border-emerald-500/40" },
                    { key: ACTION_INSERT, label: "Insert", activeClass: "bg-indigo-600/20 text-indigo-300 border-indigo-500/40" },
                  ].map(({ key, label, activeClass }) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setAction(i, key)}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                        action === key
                          ? activeClass
                          : "bg-transparent text-slate-600 border-slate-800 hover:border-slate-600 hover:text-slate-400"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
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
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={loading}
              className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-white transition-all hover:-translate-y-0.5 disabled:opacity-60 disabled:translate-y-0 flex items-center justify-center gap-2"
              style={{
                background: hasWork
                  ? "linear-gradient(135deg,#6366f1,#10b981)"
                  : "linear-gradient(135deg,#374151,#4b5563)",
                boxShadow: hasWork ? "0 4px 15px rgba(99,102,241,0.2)" : "none",
              }}
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Processing…
                </>
              ) : hasWork ? (
                [
                  insertCount > 0 && `Insert ${insertCount}`,
                  mergeCount  > 0 && `Merge ${mergeCount}`,
                ].filter(Boolean).join(" · ")
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

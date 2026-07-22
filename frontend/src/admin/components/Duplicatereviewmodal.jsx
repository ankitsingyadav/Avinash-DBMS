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
      onDone(0);
      return;
    }

    setLoading(true);
    let totalProcessed = 0;
    let totalFailed    = 0;
    const failedNames  = [];

    // ── Force-inserts grouped by endpoint ────────────────────────────────
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
          const res  = await axios.post(`${endpoint}/bulk`, { records: payloads });
          const data = res.data?.data ?? res.data ?? {};
          totalProcessed += data.inserted ?? payloads.length;
          if (data.failed > 0) totalFailed += data.failed;
        } catch (bulkErr) {
          if (bulkErr?.response?.status === 207) {
            const data = bulkErr.response.data ?? {};
            totalProcessed += data.inserted ?? 0;
            totalFailed    += data.failed    ?? 0;
          } else {
            // Sequential fallback with per-record error names
            for (let i = 0; i < payloads.length; i++) {
              try {
                await axios.post(endpoint, payloads[i]);
                totalProcessed++;
              } catch (singleErr) {
                totalFailed++;
                const name = items[i]?.incoming?.centreName || items[i]?.incoming?.name || `Record ${i + 1}`;
                const msg  = singleErr?.response?.data?.message || singleErr?.message || "unknown error";
                failedNames.push(`${name}: ${msg}`);
              }
            }
          }
        }
      }
    }

    // ── Merges (one per record, using existing._id) ───────────────────────
    for (const d of toMerge) {
      const existingId = d.existing?._id;
      const name = d.incoming?.centreName || d.incoming?.name || "Record";
      if (!existingId) {
        totalFailed++;
        failedNames.push(`${name}: existing record ID missing`);
        continue;
      }
      try {
        const payload = buildPayload(d.incoming, d.fields);
        await axios.post(`${d.endpoint}/${existingId}/merge`, payload);
        totalProcessed++;
      } catch (err) {
        totalFailed++;
        const msg = err?.response?.data?.message || err?.message || "merge failed";
        failedNames.push(`${name}: ${msg}`);
      }
    }

    setLoading(false);

    if (totalProcessed > 0)
      toast.success(`${totalProcessed} record${totalProcessed !== 1 ? "s" : ""} processed successfully.`);
    if (totalFailed > 0) {
      toast.error(`${totalFailed} record${totalFailed !== 1 ? "s" : ""} failed.`);
      failedNames.slice(0, 3).forEach((m) => console.error("[DupModal]", m));
    }

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
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        onClick={!loading ? onClose : undefined}
      />

      <div className="relative w-full max-w-2xl bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#d97706" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
              </svg>
            </div>
            <div>
              <h3 className="text-slate-900 font-bold text-sm">Duplicate Records Found</h3>
              <p className="text-slate-500 text-xs mt-0.5">
                {duplicates.length} record{duplicates.length > 1 ? "s" : ""} already exist in the database
              </p>
            </div>
          </div>
          {!loading && (
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          )}
        </div>

        {/* ── Explanation banner ──────────────────────────────────────────── */}
        <div className="mx-6 mt-4 px-4 py-2.5 rounded-xl bg-amber-50 border border-amber-200 shrink-0">
          <p className="text-amber-800 text-xs leading-relaxed">
            Choose an action for each duplicate:&nbsp;
            <strong className="text-slate-600">Skip</strong> to ignore,&nbsp;
            <strong className="text-emerald-700">Merge</strong> to add new contacts&nbsp;&amp; interactions into the existing record, or&nbsp;
            <strong className="text-indigo-700">Insert</strong> to create a separate copy.
          </p>
        </div>

        {/* ── Summary bar ────────────────────────────────────────────────── */}
        <div className="flex items-center gap-4 px-6 py-3 shrink-0 text-xs">
          {insertCount > 0 && <span className="text-indigo-700 font-semibold">{insertCount} insert</span>}
          {mergeCount  > 0 && <span className="text-emerald-700 font-semibold">{mergeCount} merge</span>}
          {skipCount   > 0 && <span className="text-slate-500">{skipCount} skip</span>}
        </div>

        {/* ── Duplicate list ──────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto px-6 pb-2 space-y-2 min-h-0">
          {duplicates.map((d, i) => {
            const action = actions[i];
            const inc    = d.incoming;
            const ex     = d.existing;

            const borderColor =
              action === ACTION_INSERT ? "border-indigo-200" :
              action === ACTION_MERGE  ? "border-emerald-200" : "border-slate-200";
            const bgColor =
              action === ACTION_INSERT ? "bg-indigo-50/40" :
              action === ACTION_MERGE  ? "bg-emerald-50/40" : "bg-slate-50";

            return (
              <div
                key={i}
                className={`rounded-xl border transition-all ${borderColor} ${bgColor}`}
              >
                {/* Info row */}
                <div className="flex items-start gap-3 px-4 pt-3 pb-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-slate-900 text-sm font-semibold truncate">
                        {inc.centreName || inc.name || "—"}
                      </span>
                      {inc.centreType && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-slate-200 text-slate-600 font-medium shrink-0">
                          {inc.centreType}
                        </span>
                      )}
                      {d.catLabel && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 font-medium shrink-0">
                          {d.catLabel}
                        </span>
                      )}
                    </div>

                    <div className="mt-2 grid grid-cols-2 gap-2">
                      <div className="bg-white rounded-lg px-3 py-2 space-y-1 border border-slate-200 shadow-sm">
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Importing</p>
                        <p className="text-xs text-slate-700 truncate">{inc.city || "—"}{inc.state ? `, ${inc.state}` : ""}</p>
                        <p className="text-xs text-slate-500 font-mono">{inc.pincode || "—"}</p>
                      </div>
                      <div className="bg-amber-50 rounded-lg px-3 py-2 space-y-1 border border-amber-200">
                        <p className="text-xs font-semibold text-amber-700 uppercase tracking-wider">In Database</p>
                        <p className="text-xs text-slate-700 truncate">
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
                    { key: ACTION_SKIP,   label: "Skip",   activeClass: "bg-slate-700 text-white border-slate-700" },
                    { key: ACTION_MERGE,  label: "Merge",  activeClass: "bg-emerald-600 text-white border-emerald-600" },
                    { key: ACTION_INSERT, label: "Insert", activeClass: "bg-indigo-600 text-white border-indigo-600" },
                  ].map(({ key, label, activeClass }) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setAction(i, key)}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                        action === key
                          ? activeClass
                          : "bg-white text-slate-500 border-slate-300 hover:border-slate-400 hover:text-slate-700"
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
        <div className="px-6 py-4 border-t border-slate-200 shrink-0">
          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={loading}
              className="flex-1 py-2.5 rounded-lg text-sm font-medium text-slate-600 bg-slate-100 border border-slate-200 hover:bg-slate-200 hover:text-slate-900 transition-all disabled:opacity-40"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={loading}
              className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-white transition-all hover:-translate-y-0.5 disabled:opacity-60 disabled:translate-y-0 flex items-center justify-center gap-2"
              style={{
                background: hasWork
                  ? "linear-gradient(135deg,#4f46e5,#059669)"
                  : "linear-gradient(135deg,#94a3b8,#64748b)",
                boxShadow: hasWork ? "0 4px 15px rgba(79,70,229,0.25)" : "none",
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
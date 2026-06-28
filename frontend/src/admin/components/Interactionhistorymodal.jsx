// ─── admin/components/Interactionhistorymodal.jsx ────────────────────────────
import { useState, useEffect } from "react";
import axios from "../../utils/axios.js";
import { fmtDate } from "../helpers.js";

const fmtDateTime = (d) =>
  d
    ? new Date(d).toLocaleString("en-IN", {
        day: "2-digit", month: "short", year: "numeric",
        hour: "2-digit", minute: "2-digit", hour12: true,
      })
    : "—";

const MODE_CONFIG = {
  Email:    { icon: "✉️",  color: "#6366f1" },
  Phone:    { icon: "📞",  color: "#10b981" },
  WhatsApp: { icon: "💬",  color: "#22c55e" },
  Visit:    { icon: "🏢",  color: "#f59e0b" },
};

const STATUS_CONFIG = {
  Initiated:   { color: "#7c3aed", bg: "#7c3aed15" },
  Pending:     { color: "#d97706", bg: "#d9770615" },
  Progressive: { color: "#2563eb", bg: "#2563eb15" },
  Active:      { color: "#059669", bg: "#05966915" },
  Inactive:    { color: "#64748b", bg: "#64748b15" },
};

function InteractionCard({ entry, index, total, accent }) {
  const isLatest = index === 0;
  const mode     = MODE_CONFIG[entry.interactionMode] || { icon: "📋", color: accent };

  return (
    <div className="relative pl-8">
      {/* Timeline line */}
      {index < total - 1 && (
        <div
          className="absolute left-[13px] top-8 bottom-0 w-px"
          style={{ background: `linear-gradient(to bottom, ${accent}40, transparent)` }}
        />
      )}

      {/* Timeline dot */}
      <div
        className="absolute left-0 top-4 w-7 h-7 rounded-full flex items-center justify-center text-sm border-2 shrink-0"
        style={{
          background:  isLatest ? `${accent}20` : "#f8fafc",
          borderColor: isLatest ? accent        : "#e2e8f0",
        }}
      >
        {mode.icon}
      </div>

      <div
        className="mb-4 rounded-xl border overflow-hidden"
        style={{
          background:  isLatest ? `${accent}05` : "#fff",
          borderColor: isLatest ? `${accent}25` : "#e2e8f0",
        }}
      >
        {/* Card header */}
        <div
          className="flex items-center justify-between px-4 py-3 border-b gap-2"
          style={{ borderColor: isLatest ? `${accent}15` : "#f1f5f9" }}
        >
          <div className="flex items-center gap-2 flex-wrap min-w-0">
            {isLatest && (
              <span
                className="text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-widest shrink-0"
                style={{ background: `${accent}20`, color: accent }}
              >
                Latest
              </span>
            )}
            <span className="text-slate-800 text-xs font-semibold">
              {fmtDateTime(entry.interactionDate)}
            </span>
            {entry.interactionStatus && (() => {
              const s = STATUS_CONFIG[entry.interactionStatus] || { color: "#64748b", bg: "#64748b15" };
              return (
                <span
                  className="text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wide shrink-0"
                  style={{ background: s.bg, color: s.color }}
                >
                  {entry.interactionStatus}
                </span>
              );
            })()}
          </div>
          <span
            className="text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0"
            style={{ background: `${mode.color}15`, color: mode.color }}
          >
            {entry.interactionMode}
          </span>
        </div>

        {/* Card body */}
        <div className="px-4 py-3 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            {[
              ["By",        entry.interactionBy   ],
              ["With",      entry.interactedWith  ],
              ["AIN / NIN", entry.ninAin          ],
            ].map(([label, value]) =>
              value ? (
                <div key={label}>
                  <p className="text-[10px] text-slate-400 uppercase tracking-wide mb-0.5">{label}</p>
                  <p className="text-xs font-medium text-slate-800">{value}</p>
                </div>
              ) : null
            )}
          </div>

          {entry.notes && (
            <div className="pt-2 border-t border-slate-100">
              <p className="text-[10px] text-slate-400 uppercase tracking-wide mb-1">Notes</p>
              <p className="text-xs text-slate-600 leading-relaxed">{entry.notes}</p>
            </div>
          )}

          {/* ── Next Interaction Planned ── */}
          {(entry.nextInteractionDate || entry.nextNotes) && (
            <div
              className="rounded-lg px-3 py-2 border mt-1"
              style={{ background: `${accent}06`, borderColor: `${accent}20` }}
            >
              <p
                className="text-[10px] font-bold uppercase tracking-widest mb-2"
                style={{ color: accent }}
              >
                Next Interaction Planned
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[10px] text-slate-400 uppercase tracking-wide mb-0.5">Planned Date</p>
                  {entry.nextInteractionDate ? (
                    <p className="text-xs font-semibold" style={{ color: accent }}>
                      {fmtDate(entry.nextInteractionDate)}
                    </p>
                  ) : (
                    <p className="text-xs text-slate-400 italic">Not set</p>
                  )}
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 uppercase tracking-wide mb-0.5">Mode</p>
                  <p className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                    <span>{mode.icon}</span> {entry.interactionMode}
                  </p>
                </div>
              </div>

              {entry.nextNotes && (
                <div className="mt-2 pt-2 border-t" style={{ borderColor: `${accent}20` }}>
                  <p className="text-[10px] text-slate-400 uppercase tracking-wide mb-1">Notes</p>
                  <p className="text-xs text-slate-600 leading-relaxed">{entry.nextNotes}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Timestamp footer */}
        {entry.createdAt && (
          <div className="px-4 py-2 border-t border-slate-100">
            <p className="text-[10px] text-slate-400">
              Recorded: {new Date(entry.createdAt).toLocaleString("en-IN", {
                day: "2-digit", month: "short", year: "numeric",
                hour: "2-digit", minute: "2-digit",
              })}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Interactionhistorymodal({ isOpen, onClose, record, category, onAddNew }) {
  const [state, setState] = useState({ history: [], loading: false, error: null });

  useEffect(() => {
    if (!isOpen || !record?._id) return;
    // Reset state when a new record opens — one batched call is intentional here
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setState({ history: [], loading: true, error: null });

    axios
      .get(`${category.endpoint}/${record._id}/interactions`)
      .then((res) => {
        const data = res.data?.data ?? res.data ?? {};
        setState({ history: data.interactions || [], loading: false, error: null });
      })
      .catch((err) => {
        setState({ history: [], loading: false, error: err.response?.data?.message || "Failed to load interaction history." });
      });
  }, [isOpen, record?._id]); // eslint-disable-line

  const { history, loading, error } = state;

  if (!isOpen || !record) return null;

  const accent = category.accent;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-lg bg-white border border-slate-200 rounded-2xl shadow-2xl flex flex-col max-h-[88vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="w-9 h-9 rounded-xl shrink-0 flex items-center justify-center"
              style={{ background: `${accent}15`, border: `1px solid ${accent}30` }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke={accent} strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
            <div className="min-w-0">
              <h3 className="text-slate-900 font-bold text-sm truncate">Interaction History</h3>
              <p className="text-slate-400 text-xs truncate">{record.centreName}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onAddNew}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-all hover:-translate-y-0.5"
              style={{ background: `linear-gradient(135deg,${accent},${accent}bb)` }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15"/>
              </svg>
              Add
            </button>

            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Stats strip */}
        {!loading && !error && history.length > 0 && (
          <div
            className="flex items-center gap-4 px-6 py-2.5 border-b border-slate-100"
            style={{ background: `${accent}06` }}
          >
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-slate-400 uppercase tracking-wide">Total</span>
              <span className="text-sm font-bold" style={{ color: accent }}>{history.length}</span>
            </div>
            <div className="w-px h-4 bg-slate-200" />
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-slate-400 uppercase tracking-wide">Last</span>
              <span className="text-xs text-slate-700 font-medium">{fmtDate(history[0]?.interactionDate)}</span>
            </div>
            {history[0]?.nextInteractionDate && (
              <>
                <div className="w-px h-4 bg-slate-200" />
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wide">Next</span>
                  <span className="text-xs font-semibold" style={{ color: accent }}>
                    {fmtDate(history[0].nextInteractionDate)}
                  </span>
                </div>
              </>
            )}
          </div>
        )}

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-6 py-5 bg-slate-50">

          {/* Loading */}
          {loading && (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="pl-8 relative">
                  <div className="absolute left-0 top-4 w-7 h-7 rounded-full bg-slate-200 animate-pulse" />
                  <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3 animate-pulse">
                    <div className="flex justify-between">
                      <div className="h-3 w-24 bg-slate-200 rounded-full" />
                      <div className="h-3 w-16 bg-slate-200 rounded-full" />
                    </div>
                    <div className="h-2 w-3/4 bg-slate-100 rounded-full" />
                    <div className="h-2 w-1/2 bg-slate-100 rounded-full" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Error */}
          {!loading && error && (
            <div className="flex flex-col items-center gap-3 py-12">
              <div className="w-12 h-12 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="#f87171" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                </svg>
              </div>
              <p className="text-red-500 text-sm text-center">{error}</p>
            </div>
          )}

          {/* Empty */}
          {!loading && !error && history.length === 0 && (
            <div className="flex flex-col items-center gap-3 py-12">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center"
                style={{ background: `${accent}10`, border: `1px solid ${accent}20` }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke={accent} strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </div>
              <p className="text-slate-500 text-sm">No interactions recorded yet</p>
              <button
                onClick={onAddNew}
                className="text-xs font-semibold px-4 py-2 rounded-lg transition-all"
                style={{ background: `${accent}12`, color: accent, border: `1px solid ${accent}30` }}
              >
                Add first interaction
              </button>
            </div>
          )}

          {/* Timeline */}
          {!loading && !error && history.length > 0 && (
            <div>
              {history.map((entry, i) => (
                <InteractionCard
                  key={entry._id || i}
                  entry={entry}
                  index={i}
                  total={history.length}
                  accent={accent}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 shrink-0 bg-white">
          <button
            onClick={onClose}
            className="w-full py-2 rounded-lg text-sm font-medium text-slate-500 bg-white border border-slate-200 hover:bg-slate-50 hover:text-slate-700 transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
// ─── admin/components/ViewModal.jsx ──────────────────────────────────────────
import { fmtDate } from "../helpers.js";
import { StatusBadge } from "./ui.jsx";

export default function ViewModal({ isOpen, onClose, record, category, onEdit, onDelete }) {
  if (!isOpen || !record) return null;

  const allKeys = [...category.editFields.map((f) => f.key), "_id", "createdAt"];
  const labels  = Object.fromEntries(category.editFields.map((f) => [f.key, f.label]));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-[#13131f] border border-slate-700/50 rounded-2xl shadow-2xl flex flex-col max-h-[85vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="w-9 h-9 rounded-xl shrink-0 flex items-center justify-center"
              style={{ background: `${category.accent}15`, border: `1px solid ${category.accent}30` }}>
              <span style={{ color: category.accent }}>{category.icon}</span>
            </div>
            <div className="min-w-0">
              <h3 className="text-white font-bold text-sm truncate">{record.centreName || record.name}</h3>
              <StatusBadge value={record.status} />
            </div>
          </div>
          <button onClick={onClose} className="text-slate-600 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-6 py-4 space-y-3">
          {allKeys.map((k) => {
            const val = record[k];
            if (!val && val !== 0) return null;
            let display;
            if (k === "_id")
              display = <span className="font-mono text-xs text-slate-500 break-all">{val}</span>;
            else if (k === "createdAt" || k === "follow_up_date")
              display = <span className="text-white text-sm">{fmtDate(val)}</span>;
            else if (k === "status")
              display = <StatusBadge value={val} />;
            else if (k === "contacts" && Array.isArray(val))
              display = (
                <div className="space-y-3 w-full">
                  {val.map((c, i) => (
                    <div key={i} className="p-3 bg-slate-800/40 border border-slate-700/50 rounded-xl space-y-1 shadow-sm">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Contact #{i + 1}</span>
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">{c.designation}</span>
                      </div>
                      <p className="text-sm font-bold text-white">{c.name}</p>
                      <div className="flex flex-col gap-0.5">
                        <p className="text-xs text-slate-400 flex items-center gap-1.5">
                          <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.387a12.035 12.035 0 01-7.143-7.143c-.155-.441.011-.928.387-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z"/></svg>
                          {c.contactNumber}
                        </p>
                        <p className="text-xs text-slate-400 flex items-center gap-1.5">
                          <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"/></svg>
                          {c.email}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              );
            else
              display = <span className="text-white text-sm">{String(val)}</span>;
            return (
              <div key={k} className="flex gap-3 items-start">
                <span className="text-slate-600 text-xs font-semibold uppercase tracking-wide w-32 shrink-0 pt-0.5">
                  {labels[k] || k.replace(/_/g, " ")}
                </span>
                {display}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="flex gap-2 px-6 py-4 border-t border-slate-800 shrink-0">
          <button
            onClick={() => { onClose(); onEdit(record); }}
            className="flex-1 py-2 rounded-lg text-xs font-semibold transition-all hover:-translate-y-0.5"
            style={{ background: `${category.accent}18`, color: category.accent, border: `1px solid ${category.accent}30` }}>
            ✏️ Edit
          </button>
          <button
            onClick={() => { onClose(); onDelete(record); }}
            className="flex-1 py-2 rounded-lg text-xs font-semibold text-red-400 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 transition-all">
            🗑 Delete
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-2 rounded-lg text-xs font-medium text-slate-400 bg-slate-800/60 border border-slate-700/50 hover:text-white transition-all">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
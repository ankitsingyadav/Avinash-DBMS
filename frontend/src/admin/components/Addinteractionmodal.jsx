// ─── admin/components/AddInteractionModal.jsx ────────────────────────────────
import { useState, useEffect } from "react";
import axios from "../../utils/axios.js";
import toast from "react-hot-toast";
import { inputCls } from "./ui.jsx";

const INTERACTION_MODES = ["Email", "Phone", "WhatsApp", "Visit"];

const MODE_ICONS = {
  Email:    "✉️",
  Phone:    "📞",
  WhatsApp: "💬",
  Visit:    "🏢",
};

const EMPTY_FORM = {
  interactionBy:       "",
  interactedWith:      "",
  interactionDate:     new Date().toISOString().split("T")[0],
  interactionMode:     "",
  notes:               "",
  ninAin:              "",
  nextInteractionDate: "",
};

export default function AddInteractionModal({ isOpen, onClose, record, category, onSaved }) {
  const [form,    setForm]    = useState(EMPTY_FORM);
  const [errors,  setErrors]  = useState({});
  const [loading, setLoading] = useState(false);

  // Reset form whenever modal opens with a new record
  useEffect(() => {
    if (isOpen) {
      setForm(EMPTY_FORM);
      setErrors({});
    }
  }, [isOpen, record?._id]);

  if (!isOpen || !record) return null;

  const accent = category.accent;

  const set = (key, val) => {
    setForm((p) => ({ ...p, [key]: val }));
    setErrors((p) => ({ ...p, [key]: "" }));
  };

  const validate = () => {
    const errs = {};
    if (!form.interactionBy.trim())    errs.interactionBy    = "Required";
    if (!form.interactedWith.trim())   errs.interactedWith   = "Required";
    if (!form.interactionDate)         errs.interactionDate  = "Required";
    if (!form.interactionMode)         errs.interactionMode  = "Required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) {
      toast.error("Please fill in all required fields.");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        interactionBy:   form.interactionBy.trim(),
        interactedWith:  form.interactedWith.trim(),
        interactionDate: form.interactionDate,
        interactionMode: form.interactionMode,
      };
      if (form.notes.trim())               payload.notes               = form.notes.trim();
      if (form.ninAin.trim())              payload.ninAin              = form.ninAin.trim();
      if (form.nextInteractionDate)        payload.nextInteractionDate = form.nextInteractionDate;

      await axios.post(`${category.endpoint}/${record._id}/interactions`, payload);
      toast.success("Interaction recorded successfully!");
      onSaved?.();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save interaction. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={!loading ? onClose : undefined} />

      <div className="relative w-full max-w-lg bg-[#13131f] border border-slate-700/50 rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: `${accent}15`, border: `1px solid ${accent}30` }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke={accent} strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15"/>
              </svg>
            </div>
            <div>
              <h3 className="text-white font-bold text-sm">Add Interaction</h3>
              <p className="text-slate-600 text-xs truncate max-w-[260px]">{record.centreName}</p>
            </div>
          </div>

          {!loading && (
            <button
              onClick={onClose}
              className="text-slate-600 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          )}
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">

          {/* ── Current Interaction section ── */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span
                className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded"
                style={{ background: `${accent}15`, color: accent, border: `1px solid ${accent}25` }}
              >
                Current Interaction
              </span>
              <div className="flex-1 h-px bg-slate-800" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

              {/* Interaction By */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Interaction By <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={form.interactionBy}
                  onChange={(e) => set("interactionBy", e.target.value)}
                  placeholder="Your name"
                  className={inputCls(!!errors.interactionBy)}
                />
                {errors.interactionBy && <p className="text-red-400 text-xs">{errors.interactionBy}</p>}
              </div>

              {/* Interacted With */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Interacted With <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={form.interactedWith}
                  onChange={(e) => set("interactedWith", e.target.value)}
                  placeholder="Contact person name"
                  className={inputCls(!!errors.interactedWith)}
                />
                {errors.interactedWith && <p className="text-red-400 text-xs">{errors.interactedWith}</p>}
              </div>

              {/* Interaction Date */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Interaction Date <span className="text-red-400">*</span>
                </label>
                <input
                  type="date"
                  value={form.interactionDate}
                  onChange={(e) => set("interactionDate", e.target.value)}
                  max={new Date().toISOString().split("T")[0]}
                  className={inputCls(!!errors.interactionDate) + " [color-scheme:dark]"}
                />
                {errors.interactionDate && <p className="text-red-400 text-xs">{errors.interactionDate}</p>}
              </div>

              {/* AIN / NIN */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">AIN / NIN Number</label>
                <input
                  type="text"
                  value={form.ninAin}
                  onChange={(e) => set("ninAin", e.target.value)}
                  placeholder="Enter AIN or NIN"
                  className={inputCls(false)}
                />
              </div>

              {/* Notes — full width */}
              <div className="sm:col-span-2 space-y-1.5">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Notes</label>
                <textarea
                  rows={3}
                  value={form.notes}
                  onChange={(e) => set("notes", e.target.value)}
                  placeholder="Any relevant notes about this interaction..."
                  className={inputCls(false) + " resize-none"}
                />
              </div>
            </div>
          </div>

          {/* ── Next Interaction section ── */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span
                className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded"
                style={{ background: `${accent}15`, color: accent, border: `1px solid ${accent}25` }}
              >
                Next Interaction Planned
              </span>
              <div className="flex-1 h-px bg-slate-800" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

              {/* Next Interaction Date */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Planned Date</label>
                <input
                  type="date"
                  value={form.nextInteractionDate}
                  onChange={(e) => set("nextInteractionDate", e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                  className={inputCls(false) + " [color-scheme:dark]"}
                />
              </div>

              {/* Interaction Mode */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Interaction Mode <span className="text-red-400">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {INTERACTION_MODES.map((mode) => {
                    const active = form.interactionMode === mode;
                    return (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => set("interactionMode", mode)}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-semibold transition-all"
                        style={
                          active
                            ? { background: `${accent}18`, color: accent, borderColor: `${accent}40` }
                            : { background: "#1a1a2e", color: "#475569", borderColor: "#1e293b" }
                        }
                      >
                        <span>{MODE_ICONS[mode]}</span>
                        {mode}
                      </button>
                    );
                  })}
                </div>
                {errors.interactionMode && (
                  <p className="text-red-400 text-xs">{errors.interactionMode}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 py-4 border-t border-slate-800 shrink-0">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 py-2.5 rounded-lg text-sm font-medium text-slate-400 bg-slate-800/60 border border-slate-700/50 hover:text-white transition-all disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-white disabled:opacity-50 transition-all hover:-translate-y-0.5 flex items-center justify-center gap-2"
            style={{
              background:  `linear-gradient(135deg,${accent},${accent}cc)`,
              boxShadow:   `0 4px 15px ${accent}25`,
            }}
          >
            {loading && (
              <svg className="animate-spin" width="14" height="14" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
            )}
            {loading ? "Saving…" : "Save Interaction"}
          </button>
        </div>
      </div>
    </div>
  );
}
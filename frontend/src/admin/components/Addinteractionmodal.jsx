// ─── admin/components/AddInteractionModal.jsx ────────────────────────────────
import { useState, useEffect } from "react";
import axios from "../../utils/axios.js";
import toast from "react-hot-toast";
import { inputCls } from "./ui.jsx";
import useAuthStore from "../../context/authStore";

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
  nextNotes:           "",
};

export default function AddInteractionModal({ isOpen, onClose, record, category, onSaved }) {
  const { user } = useAuthStore();
  const [form,    setForm]    = useState(EMPTY_FORM);
  const [errors,  setErrors]  = useState({});
  const [loading, setLoading] = useState(false);

  // NEW: toggles "Interacted With" between dropdown-of-contacts and free text
  const [interactedWithCustom, setInteractedWithCustom] = useState(false);

  // NEW: contact names pulled from this organisation's saved contacts
  const contactNameOptions = (record?.contacts || [])
    .map((c, idx) => ({ idx, name: (c?.name || "").trim() }))
    .filter((c) => c.name.length > 0);

  useEffect(() => {
    if (isOpen) {
      // Pre-fill Interaction By + AIN/NIN from logged-in user, rest stays empty.
      // Both remain fully editable — this only sets the initial value.
      setForm({
        ...EMPTY_FORM,
        interactionBy: user?.fullName || "",
        ninAin:        user?.ninAinNumber || "",
      });
      setErrors({});
      // Default to dropdown mode if this org has saved contacts, else custom text
      setInteractedWithCustom(contactNameOptions.length === 0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      if (form.notes.trim())        payload.notes               = form.notes.trim();
      if (form.ninAin.trim())       payload.ninAin              = form.ninAin.trim();
      if (form.nextInteractionDate) payload.nextInteractionDate = form.nextInteractionDate;
      if (form.nextNotes.trim())    payload.nextNotes           = form.nextNotes.trim();

      await axios.post(`${category.endpoint}/${record._id}/interactions`, payload);
      toast.success("Interaction recorded successfully!");
      // Notify notification bell + page to refresh immediately
      window.dispatchEvent(new CustomEvent("interaction-saved"));
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
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={!loading ? onClose : undefined} />

      <div className="relative w-full max-w-lg bg-white border border-slate-200 rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: `${accent}15`, border: `1.5px solid ${accent}30` }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke={accent} strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15"/>
              </svg>
            </div>
            <div>
              <h3 className="text-slate-900 font-bold text-sm">Add Interaction</h3>
              <p className="text-slate-500 text-xs truncate max-w-[260px]">{record.centreName}</p>
            </div>
          </div>
          {!loading && (
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          )}
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5 bg-slate-50">

          {/* Current Interaction */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span
                className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded"
                style={{ background: `${accent}15`, color: accent, border: `1px solid ${accent}25` }}
              >
                Current Interaction
              </span>
              <div className="flex-1 h-px bg-slate-200" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Interaction By <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.interactionBy}
                  onChange={(e) => set("interactionBy", e.target.value)}
                  placeholder="Your name"
                  className={inputCls(!!errors.interactionBy)}
                />
                {errors.interactionBy && <p className="text-red-500 text-xs">{errors.interactionBy}</p>}
              </div>

              {/* Interacted With — dropdown sourced from record.contacts,
                  with a Custom option that switches to free text */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Interacted With <span className="text-red-500">*</span>
                </label>

                {interactedWithCustom ? (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={form.interactedWith}
                      onChange={(e) => set("interactedWith", e.target.value)}
                      placeholder="Contact person name"
                      className={inputCls(!!errors.interactedWith)}
                      autoFocus
                    />
                    {contactNameOptions.length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          setInteractedWithCustom(false);
                          set("interactedWith", "");
                        }}
                        className="shrink-0 px-3 rounded-lg border border-slate-300 text-xs font-medium text-slate-500 hover:bg-slate-50 transition-colors"
                        title="Choose from contact list instead"
                      >
                        ↩ List
                      </button>
                    )}
                  </div>
                ) : (
                  <select
                    value={form.interactedWith}
                    onChange={(e) => {
                      if (e.target.value === "__custom__") {
                        setInteractedWithCustom(true);
                        set("interactedWith", "");
                      } else {
                        set("interactedWith", e.target.value);
                      }
                    }}
                    className={inputCls(!!errors.interactedWith)}
                  >
                    <option value="">
                      {contactNameOptions.length > 0
                        ? "Select Contact Person"
                        : "No saved contacts"}
                    </option>
                    {contactNameOptions.map(({ idx, name }) => (
                      <option key={idx} value={name}>
                        {name}
                      </option>
                    ))}
                    <option value="__custom__">+ Custom (type manually)</option>
                  </select>
                )}
                {errors.interactedWith && <p className="text-red-500 text-xs">{errors.interactedWith}</p>}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Interaction Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={form.interactionDate}
                  onChange={(e) => set("interactionDate", e.target.value)}
                  max={new Date().toISOString().split("T")[0]}
                  className={inputCls(!!errors.interactionDate)}
                />
                {errors.interactionDate && <p className="text-red-500 text-xs">{errors.interactionDate}</p>}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">AIN / NIN Number</label>
                <input
                  type="text"
                  value={form.ninAin}
                  onChange={(e) => set("ninAin", e.target.value)}
                  placeholder="Enter AIN or NIN"
                  className={inputCls(false)}
                />
              </div>

              <div className="sm:col-span-2 space-y-1.5">
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Notes</label>
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

          {/* Next Interaction */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span
                className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded"
                style={{ background: `${accent}15`, color: accent, border: `1px solid ${accent}25` }}
              >
                Next Interaction Planned
              </span>
              <div className="flex-1 h-px bg-slate-200" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Planned Date</label>
                <input
                  type="date"
                  value={form.nextInteractionDate}
                  onChange={(e) => set("nextInteractionDate", e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                  className={inputCls(false)}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Interaction Mode <span className="text-red-500">*</span>
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
                            ? { background: `${accent}12`, color: accent, borderColor: `${accent}50`, boxShadow: `0 0 0 2px ${accent}20` }
                            : { background: "#fff", color: "#64748b", borderColor: "#e2e8f0" }
                        }
                      >
                        <span>{MODE_ICONS[mode]}</span>
                        {mode}
                      </button>
                    );
                  })}
                </div>
                {errors.interactionMode && (
                  <p className="text-red-500 text-xs">{errors.interactionMode}</p>
                )}
              </div>

              <div className="sm:col-span-2 space-y-1.5">
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Notes</label>
                <textarea
                  rows={3}
                  value={form.nextNotes}
                  onChange={(e) => set("nextNotes", e.target.value)}
                  placeholder="Any notes for the next interaction..."
                  className={inputCls(false) + " resize-none"}
                />
              </div>

            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 py-4 border-t border-slate-100 shrink-0 bg-white">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 py-2.5 rounded-lg text-sm font-medium text-slate-600 bg-white border border-slate-300 hover:bg-slate-50 transition-all disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-white disabled:opacity-50 transition-all hover:-translate-y-0.5 flex items-center justify-center gap-2 shadow-sm"
            style={{
              background: accent,
              boxShadow: `0 4px 12px ${accent}35`,
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
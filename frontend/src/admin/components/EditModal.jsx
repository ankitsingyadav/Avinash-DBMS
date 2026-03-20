// ─── admin/components/EditModal.jsx ──────────────────────────────────────────
import { useState, useEffect } from "react";
import axios from "../../utils/axios.js";
import toast from "react-hot-toast";
import { inputCls } from "./ui.jsx";

export default function EditModal({ isOpen, onClose, record, category, onSaved }) {
  const [form, setForm]     = useState({});
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (record && category) {
      const init = {};
      category.editFields.forEach((f) => {
        let v = record[f.key];
        if (f.key === "follow_up_date" && v) v = new Date(v).toISOString().split("T")[0];
        init[f.key] = v ?? "";
      });
      setForm(init);
      setErrors({});
    }
  }, [record, category]);

  if (!isOpen || !record) return null;

  const validate = () => {
    const errs = {};
    category.editFields.forEach((f) => {
      if (f.required && (!form[f.key] || String(form[f.key]).trim() === ""))
        errs[f.key] = "Required";
    });
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) { toast.error("Please fill in all required fields."); return; }
    setLoading(true);
    try {
      const payload = {};
      category.editFields.forEach((f) => {
        if (form[f.key] !== undefined && form[f.key] !== "") payload[f.key] = form[f.key];
      });
      await axios.put(`${category.endpoint}/${record._id}`, payload);
      toast.success("Record updated successfully!");
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update record. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const set = (key, val) => {
    setForm((p) => ({ ...p, [key]: val }));
    setErrors((p) => ({ ...p, [key]: "" }));
  };

  const renderInput = (f) => {
    if (f.type === "select")
      return (
        <select
          value={form[f.key] || ""}
          onChange={(e) => set(f.key, e.target.value)}
          className={inputCls(!!errors[f.key]) + " appearance-none"}>
          <option value="">Select…</option>
          {f.options.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
      );
    if (f.type === "textarea")
      return (
        <textarea
          rows={2}
          value={form[f.key] || ""}
          onChange={(e) => set(f.key, e.target.value)}
          className={inputCls(!!errors[f.key]) + " resize-none"}
        />
      );
    return (
      <input
        type={f.type}
        value={form[f.key] || ""}
        onChange={(e) => set(f.key, e.target.value)}
        className={inputCls(!!errors[f.key]) + (f.type === "date" ? " [color-scheme:dark]" : "")}
      />
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-[#13131f] border border-slate-700/50 rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: `${category.accent}15`, border: `1px solid ${category.accent}30` }}>
              <span style={{ color: category.accent }}>{category.icon}</span>
            </div>
            <div>
              <h3 className="text-white font-bold text-sm">Edit {category.label.slice(0, -1)}</h3>
              <p className="text-slate-700 text-xs font-mono">{record._id}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-600 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-6 py-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {category.editFields.map((f) => (
              <div
                key={f.key}
                className={(f.type === "textarea" || f.key === "address" || f.key === "remarks") ? "sm:col-span-2" : ""}>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  {f.label}{f.required && <span className="text-red-400 ml-1">*</span>}
                </label>
                {renderInput(f)}
                {errors[f.key] && <p className="text-red-400 text-xs mt-1">{errors[f.key]}</p>}
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 py-4 border-t border-slate-800 shrink-0">
          <button
            onClick={onClose}
            className="flex-1 py-2 rounded-lg text-sm font-medium text-slate-400 bg-slate-800/60 border border-slate-700/50 hover:text-white transition-all">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="flex-1 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-50 transition-all hover:-translate-y-0.5"
            style={{ background: `linear-gradient(135deg,${category.accent},${category.accent}cc)`, boxShadow: `0 4px 15px ${category.accent}25` }}>
            {loading ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
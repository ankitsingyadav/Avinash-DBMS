// ─── admin/components/EditModal.jsx ──────────────────────────────────────────
import { useState, useEffect } from "react";
import axios from "../../utils/axios.js";
import toast from "react-hot-toast";
import { inputCls } from "./ui.jsx";

// ── Contacts sub-editor ────────────────────────────────────────────────────────
function ContactsEditor({ contacts, onChange }) {
  const update = (i, key, val) => {
    const next = contacts.map((c, idx) => idx === i ? { ...c, [key]: val } : c);
    onChange(next);
  };
  const add = () =>
    contacts.length < 4 &&
    onChange([...contacts, { name: "", designation: "", contactNumber: "", email: "" }]);
  const remove = (i) => onChange(contacts.filter((_, idx) => idx !== i));

  return (
    <div className="sm:col-span-2 space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Contact Persons
        </label>
        {contacts.length < 4 && (
          <button
            type="button"
            onClick={add}
            className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15"/>
            </svg>
            Add contact
          </button>
        )}
      </div>

      {contacts.map((c, i) => (
        <div
          key={i}
          className="relative p-4 bg-slate-800/40 border border-slate-700/40 rounded-xl space-y-3"
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              Contact #{i + 1}
            </span>
            {contacts.length > 1 && (
              <button
                type="button"
                onClick={() => remove(i)}
                className="text-red-400 hover:text-red-300 text-xs flex items-center gap-1 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12h-15"/>
                </svg>
                Remove
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { key: "name",          label: "Full Name",  type: "text"  },
              { key: "designation",   label: "Designation",type: "text"  },
              { key: "contactNumber", label: "Phone",      type: "tel"   },
              { key: "email",         label: "Email",      type: "email" },
            ].map((f) => (
              <div key={f.key} className="space-y-1">
                <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                  {f.label}
                </label>
                <input
                  type={f.type}
                  value={c[f.key] || ""}
                  onChange={(e) => update(i, f.key, e.target.value)}
                  className={inputCls(false)}
                />
              </div>
            ))}
          </div>
        </div>
      ))}

      {contacts.length === 0 && (
        <p className="text-xs text-slate-600 italic">No contacts yet. Click "Add contact" above.</p>
      )}
    </div>
  );
}

// ── Section divider ────────────────────────────────────────────────────────────
function SectionDivider({ label, accent }) {
  return (
    <div className="sm:col-span-2 flex items-center gap-3 pt-2">
      <span
        className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded"
        style={{ background: `${accent}15`, color: accent, border: `1px solid ${accent}25` }}
      >
        {label}
      </span>
      <div className="flex-1 h-px bg-slate-800" />
    </div>
  );
}

// ── Main modal ─────────────────────────────────────────────────────────────────
export default function EditModal({ isOpen, onClose, record, category, onSaved }) {
  const [form,    setForm]    = useState({});
  const [errors,  setErrors]  = useState({});
  const [loading, setLoading] = useState(false);

  // ── Init form from record ──────────────────────────────────────────────────
  useEffect(() => {
    if (record && category) {
      const init = {};
      category.editFields.forEach((f) => {
        if (f.type === "section") return;

        if (f.key === "contacts") {
          init.contacts = Array.isArray(record.contacts) && record.contacts.length
            ? record.contacts
            : [{ name: "", designation: "", contactNumber: "", email: "" }];
          return;
        }

        if (f.key.includes(".")) {
          const [parent, child] = f.key.split(".");
          let v = record[parent]?.[child];
          if (f.type === "date" && v) v = new Date(v).toISOString().split("T")[0];
          init[f.key] = v ?? "";
          return;
        }

        let v = record[f.key];
        if (f.type === "date" && v) v = new Date(v).toISOString().split("T")[0];
        init[f.key] = v ?? "";
      });
      setForm(init);
      setErrors({});
    }
  }, [record, category]);

  if (!isOpen || !record) return null;

  const getVal = (key) => form[key] ?? "";
  const set = (key, val) => {
    setForm((p) => ({ ...p, [key]: val }));
    setErrors((p) => ({ ...p, [key]: "" }));
  };

  const validate = () => {
    const errs = {};
    category.editFields.forEach((f) => {
      if (f.type === "section" || f.key === "contacts") return;
      if (f.required && (!getVal(f.key) || String(getVal(f.key)).trim() === ""))
        errs[f.key] = "Required";
    });
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // ── Save ───────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!validate()) { toast.error("Please fill in all required fields."); return; }
    setLoading(true);
    try {
      const payload = {};

      category.editFields.forEach((f) => {
        if (f.type === "section") return;

        if (f.key === "contacts") {
          payload.contacts = form.contacts;
          return;
        }

        // Nested interaction.* fields → build nested object
        if (f.key.includes(".")) {
          const [parent, child] = f.key.split(".");
          const val = form[f.key];
          if (val !== undefined && val !== "") {
            if (!payload[parent]) payload[parent] = {};
            payload[parent][child] = val;
          }
          return;
        }

        if (form[f.key] !== undefined && form[f.key] !== "") {
          payload[f.key] = form[f.key];
        }
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

  // ── Render individual field ────────────────────────────────────────────────
  const renderInput = (f) => {
    if (f.key === "contacts") {
      return (
        <ContactsEditor
          contacts={Array.isArray(form.contacts) ? form.contacts : []}
          onChange={(v) => set("contacts", v)}
        />
      );
    }

    if (f.type === "select")
      return (
        <select
          value={getVal(f.key)}
          onChange={(e) => set(f.key, e.target.value)}
          className={inputCls(!!errors[f.key]) + " appearance-none"}
        >
          <option value="">Select…</option>
          {f.options.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
      );

    if (f.type === "textarea")
      return (
        <textarea
          rows={2}
          value={getVal(f.key)}
          onChange={(e) => set(f.key, e.target.value)}
          className={inputCls(!!errors[f.key]) + " resize-none"}
        />
      );

    return (
      <input
        type={f.type}
        value={getVal(f.key)}
        onChange={(e) => set(f.key, e.target.value)}
        className={inputCls(!!errors[f.key]) + (f.type === "date" ? " [color-scheme:dark]" : "")}
      />
    );
  };

  // ── Which keys trigger a section divider before them ──────────────────────
  const SECTION_BEFORE = {
    "interaction.interactionBy":      { label: "Current Interaction", accent: category.accent },
    "interaction.nextInteractionDate":{ label: "Next Interaction",    accent: category.accent },
    "onboardedBy":                    { label: "Onboarding Info",     accent: category.accent },
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
              style={{ background: `${category.accent}15`, border: `1px solid ${category.accent}30` }}
            >
              <span style={{ color: category.accent }}>{category.icon}</span>
            </div>
            <div>
              <h3 className="text-white font-bold text-sm">
                Edit {category.label === "Centres" ? "Centre" : category.label.slice(0, -1)}
              </h3>
              <p className="text-slate-700 text-xs font-mono">{record._id}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-600 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-6 py-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {category.editFields.map((f, idx) => {

              // Full-width contacts editor
              if (f.key === "contacts") {
                return (
                  <div key="contacts" className="sm:col-span-2">
                    {renderInput(f)}
                    {errors.contacts && (
                      <p className="text-red-400 text-xs mt-1">{errors.contacts}</p>
                    )}
                  </div>
                );
              }

              const sectionBefore = SECTION_BEFORE[f.key];
              const fullWidth =
                f.type === "textarea" ||
                f.key === "address"   ||
                f.key === "remarks"   ||
                f.key === "interaction.notes";

              // KEY FIX: use idx as part of key to avoid duplicate key warning
              return (
                <div key={`field-${f.key}-${idx}`} className={`contents`}>
                  {sectionBefore && (
                    <SectionDivider
                      key={`section-${f.key}`}
                      label={sectionBefore.label}
                      accent={sectionBefore.accent}
                    />
                  )}
                  <div className={fullWidth ? "sm:col-span-2" : ""}>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                      {f.label}
                      {f.required && <span className="text-red-400 ml-1">*</span>}
                    </label>
                    {renderInput(f)}
                    {errors[f.key] && (
                      <p className="text-red-400 text-xs mt-1">{errors[f.key]}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 py-4 border-t border-slate-800 shrink-0">
          <button
            onClick={onClose}
            className="flex-1 py-2 rounded-lg text-sm font-medium text-slate-400 bg-slate-800/60 border border-slate-700/50 hover:text-white transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="flex-1 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-50 transition-all hover:-translate-y-0.5"
            style={{
              background: `linear-gradient(135deg,${category.accent},${category.accent}cc)`,
              boxShadow: `0 4px 15px ${category.accent}25`,
            }}
          >
            {loading ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
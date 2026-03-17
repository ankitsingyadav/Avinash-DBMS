import { useState } from "react";
import { Link } from "react-router-dom";
import axios from "../utils/axios.js";
import toast from "react-hot-toast";
import ConfirmModal from "../components/ConfirmModal";

const INITIAL = {
  name: "",
  email: "",
  phone: "",
  address: "",
  focus_area: "",
  head_name: "",
  registration_number: "",
  established_year: "",
  website: "",
  description: "",
};

const FOCUS_AREAS = [
  "Education", "Healthcare", "Environment", "Women Empowerment",
  "Child Welfare", "Rural Development", "Disability Support",
  "Disaster Relief", "Animal Welfare", "Other",
];

function Field({ label, required, error, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-300 mb-1.5">
        {label}{required && <span className="text-red-400 ml-1">*</span>}
      </label>
      {children}
      {error && (
        <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1">
          <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
          </svg>
          {error}
        </p>
      )}
    </div>
  );
}

const inputCls = (err) =>
  `w-full bg-slate-800/50 border ${err ? "border-red-500/60" : "border-slate-700/50"} rounded-xl px-4 py-2.5 text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 ${err ? "focus:ring-red-500/30" : "focus:ring-emerald-500/30"} focus:border-emerald-500/50 transition-all`;

function validate(form) {
  const errs = {};
  if (!form.name.trim()) errs.name = "NGO name is required.";
  else if (form.name.trim().length < 3) errs.name = "Name must be at least 3 characters.";

  if (!form.email.trim()) errs.email = "Email is required.";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = "Enter a valid email.";

  if (!form.phone.trim()) errs.phone = "Phone is required.";
  else if (!/^(\+\d{1,3}[- ]?)?\d{10,15}$/.test(form.phone)) errs.phone = "Enter a valid phone number.";

  if (!form.address.trim()) errs.address = "Address is required.";
  else if (form.address.trim().length < 10) errs.address = "Please enter a complete address.";

  if (!form.focus_area) errs.focus_area = "Focus area is required.";
  if (!form.head_name.trim()) errs.head_name = "Head / Director name is required.";
  else if (form.head_name.trim().length < 3) errs.head_name = "Name must be at least 3 characters.";

  if (!form.registration_number.trim()) errs.registration_number = "NGO registration number is required.";

  if (!form.established_year) errs.established_year = "Established year is required.";
  else {
    const y = parseInt(form.established_year);
    if (isNaN(y) || y < 1800 || y > new Date().getFullYear())
      errs.established_year = `Year must be between 1800 and ${new Date().getFullYear()}.`;
  }

  if (form.website && !/^https?:\/\/.+/.test(form.website))
    errs.website = "Must start with http:// or https://";

  return errs;
}

export default function NGOFormPage() {
  const [form, setForm] = useState(INITIAL);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submittedData, setSubmittedData] = useState(null);

  const set = (key, val) => {
    setForm((p) => ({ ...p, [key]: val }));
    if (touched[key]) {
      const errs = validate({ ...form, [key]: val });
      setErrors((p) => ({ ...p, [key]: errs[key] }));
    }
  };

  const blur = (key) => {
    setTouched((p) => ({ ...p, [key]: true }));
    setErrors((p) => ({ ...p, [key]: validate(form)[key] }));
  };

  const handleSubmitClick = () => {
    setTouched(Object.fromEntries(Object.keys(INITIAL).map((k) => [k, true])));
    const errs = validate(form);
    setErrors(errs);
    if (Object.keys(errs).length > 0) { toast.error("Please fix all errors before submitting."); return; }
    setShowConfirm(true);
  };

  const handleConfirm = async () => {
    setLoading(true);
    try {
      const payload = {
        name: form.name.trim(),
        email: form.email.toLowerCase().trim(),
        phone: form.phone.trim(),
        address: form.address.trim(),
        focus_area: form.focus_area,
        head_name: form.head_name.trim(),
        registration_number: form.registration_number.trim(),
        established_year: parseInt(form.established_year),
        ...(form.website && { website: form.website.trim() }),
        ...(form.description && { description: form.description.trim() }),
      };
      const { data } = await axios.post("/organisations/ngos", payload);
      setSubmittedData(data.data?.ngo || payload);
      setSubmitted(true);
      setShowConfirm(false);
      toast.success("NGO registered successfully!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Submission failed.");
      setShowConfirm(false);
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#0c0c14] flex items-center justify-center px-5">
        <div className="max-w-md w-full bg-[#13131f] border border-emerald-500/30 rounded-2xl p-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-5">
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="#10b981" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          </div>
          <h2 className="text-white text-xl font-bold mb-2">NGO Registered!</h2>
          <p className="text-slate-400 text-sm mb-6"><span className="text-emerald-400 font-semibold">{submittedData?.name}</span> has been added to the database.</p>
          <div className="bg-slate-800/40 rounded-xl p-4 text-left mb-6 space-y-2">
            {[["Name", submittedData?.name], ["Email", submittedData?.email], ["Head", submittedData?.head_name], ["Focus", submittedData?.focus_area], ["Reg. No.", submittedData?.registration_number]].map(([l, v]) => v ? (
              <div key={l} className="flex gap-3 text-sm"><span className="text-slate-500 w-20 shrink-0">{l}</span><span className="text-white truncate">{v}</span></div>
            ) : null)}
          </div>
          <div className="flex gap-3">
            <button onClick={() => { setForm(INITIAL); setErrors({}); setTouched({}); setSubmitted(false); }} className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-white" style={{ background: "linear-gradient(135deg, #10b981, #059669)" }}>Register Another</button>
            <Link to="/organisation" className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium text-slate-300 bg-slate-800/60 border border-slate-700/50 hover:text-white transition-all text-center">Back to Orgs</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0c0c14]">
      <ConfirmModal isOpen={showConfirm} onCancel={() => setShowConfirm(false)} onConfirm={handleConfirm} loading={loading}
        title="Register NGO?" message={`You are about to register "${form.name}". This creates a permanent database record. Proceed?`}
      />
      <div className="max-w-3xl mx-auto px-5 py-10">
        <div className="flex items-center gap-2 text-xs text-slate-500 mb-8">
          <Link to="/organisation" className="hover:text-slate-300 transition-colors">Organisation</Link>
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>
          <span className="text-emerald-400 font-medium">Register NGO</span>
        </div>

        <div className="flex items-start gap-4 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="#10b981" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">Register an NGO</h1>
            <p className="text-slate-400 text-sm">Fields marked with <span className="text-red-400">*</span> are mandatory.</p>
          </div>
        </div>

        <div className="bg-[#13131f] border border-slate-700/40 rounded-2xl p-6 md:p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="md:col-span-2">
              <Field label="NGO Name" required error={touched.name && errors.name}>
                <input type="text" placeholder="e.g. Helping Hands Foundation" value={form.name} onChange={(e) => set("name", e.target.value)} onBlur={() => blur("name")} className={inputCls(touched.name && errors.name)} />
              </Field>
            </div>
            <Field label="Official Email" required error={touched.email && errors.email}>
              <input type="email" placeholder="ngo@example.org" value={form.email} onChange={(e) => set("email", e.target.value)} onBlur={() => blur("email")} className={inputCls(touched.email && errors.email)} />
            </Field>
            <Field label="Contact Phone" required error={touched.phone && errors.phone}>
              <input type="tel" placeholder="+91 8888888888" value={form.phone} onChange={(e) => set("phone", e.target.value)} onBlur={() => blur("phone")} className={inputCls(touched.phone && errors.phone)} />
            </Field>
            <Field label="Head / Director Name" required error={touched.head_name && errors.head_name}>
              <input type="text" placeholder="Full Name" value={form.head_name} onChange={(e) => set("head_name", e.target.value)} onBlur={() => blur("head_name")} className={inputCls(touched.head_name && errors.head_name)} />
            </Field>
            <Field label="Focus Area" required error={touched.focus_area && errors.focus_area}>
              <select value={form.focus_area} onChange={(e) => set("focus_area", e.target.value)} onBlur={() => blur("focus_area")} className={inputCls(touched.focus_area && errors.focus_area) + " appearance-none"}>
                <option value="">Select focus area…</option>
                {FOCUS_AREAS.map((f) => <option key={f} value={f}>{f}</option>)}
              </select>
            </Field>
            <Field label="Registration Number" required error={touched.registration_number && errors.registration_number}>
              <input type="text" placeholder="e.g. MP/2020/0012345" value={form.registration_number} onChange={(e) => set("registration_number", e.target.value)} onBlur={() => blur("registration_number")} className={inputCls(touched.registration_number && errors.registration_number)} />
            </Field>
            <Field label="Established Year" required error={touched.established_year && errors.established_year}>
              <input type="number" placeholder="e.g. 2010" min="1800" max={new Date().getFullYear()} value={form.established_year} onChange={(e) => set("established_year", e.target.value)} onBlur={() => blur("established_year")} className={inputCls(touched.established_year && errors.established_year)} />
            </Field>
            <Field label="Website" error={touched.website && errors.website}>
              <input type="url" placeholder="https://ngowebsite.org" value={form.website} onChange={(e) => set("website", e.target.value)} onBlur={() => blur("website")} className={inputCls(touched.website && errors.website)} />
            </Field>
            <div className="md:col-span-2">
              <Field label="Full Address" required error={touched.address && errors.address}>
                <textarea rows={2} placeholder="Street, City, State, PIN Code" value={form.address} onChange={(e) => set("address", e.target.value)} onBlur={() => blur("address")} className={inputCls(touched.address && errors.address) + " resize-none"} />
              </Field>
            </div>
            <div className="md:col-span-2">
              <Field label="Brief Description" error={null}>
                <textarea rows={3} placeholder="What does your NGO do? (optional)" value={form.description} onChange={(e) => set("description", e.target.value)} className={inputCls(false) + " resize-none"} />
              </Field>
            </div>
          </div>

          <div className="mt-8 flex items-center justify-between pt-6 border-t border-slate-800/60">
            <Link to="/organisation" className="text-sm text-slate-400 hover:text-white flex items-center gap-1.5 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg>
              Back
            </Link>
            <button onClick={handleSubmitClick} className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:-translate-y-0.5" style={{ background: "linear-gradient(135deg, #10b981, #059669)", boxShadow: "0 4px 20px rgba(16,185,129,0.3)" }}>
              Submit Registration
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
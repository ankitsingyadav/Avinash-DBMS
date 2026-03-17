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
  principal_name: "",
  established_year: "",
  board_affiliation: "",
  total_students: "",
  website: "",
};

const BOARDS = ["CBSE", "ICSE", "State Board", "IB", "Cambridge", "Other"];

function Field({ label, required, error, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-300 mb-1.5">
        {label}
        {required && <span className="text-red-400 ml-1">*</span>}
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
  `w-full bg-slate-800/50 border ${err ? "border-red-500/60" : "border-slate-700/50"} rounded-xl px-4 py-2.5 text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 ${err ? "focus:ring-red-500/30" : "focus:ring-indigo-500/30"} focus:border-indigo-500/50 transition-all`;

function validate(form) {
  const errs = {};
  if (!form.name.trim()) errs.name = "School name is required.";
  else if (form.name.trim().length < 3) errs.name = "Name must be at least 3 characters.";

  if (!form.email.trim()) errs.email = "Email address is required.";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = "Enter a valid email address.";

  if (!form.phone.trim()) errs.phone = "Phone number is required.";
  else if (!/^(\+\d{1,3}[- ]?)?\d{10,15}$/.test(form.phone)) errs.phone = "Enter a valid phone number (10–15 digits).";

  if (!form.address.trim()) errs.address = "Address is required.";
  else if (form.address.trim().length < 10) errs.address = "Please enter a complete address.";

  if (!form.principal_name.trim()) errs.principal_name = "Principal name is required.";
  else if (form.principal_name.trim().length < 3) errs.principal_name = "Name must be at least 3 characters.";

  if (!form.established_year) errs.established_year = "Established year is required.";
  else {
    const y = parseInt(form.established_year);
    if (isNaN(y) || y < 1800 || y > new Date().getFullYear())
      errs.established_year = `Year must be between 1800 and ${new Date().getFullYear()}.`;
  }

  if (!form.board_affiliation) errs.board_affiliation = "Board affiliation is required.";

  if (form.total_students && (isNaN(form.total_students) || parseInt(form.total_students) < 0))
    errs.total_students = "Enter a valid number of students.";

  if (form.website && !/^https?:\/\/.+/.test(form.website))
    errs.website = "Website must start with http:// or https://";

  return errs;
}

export default function SchoolFormPage() {
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
    const errs = validate(form);
    setErrors((p) => ({ ...p, [key]: errs[key] }));
  };

  const handleSubmitClick = () => {
    const allTouched = Object.fromEntries(Object.keys(INITIAL).map((k) => [k, true]));
    setTouched(allTouched);
    const errs = validate(form);
    setErrors(errs);
    if (Object.keys(errs).length > 0) {
      toast.error("Please fix all errors before submitting.");
      return;
    }
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
        principal_name: form.principal_name.trim(),
        established_year: parseInt(form.established_year),
        board_affiliation: form.board_affiliation,
        ...(form.total_students && { total_students: parseInt(form.total_students) }),
        ...(form.website && { website: form.website.trim() }),
      };
      const { data } = await axios.post("/organisations/schools", payload);
      setSubmittedData(data.data?.school || payload);
      setSubmitted(true);
      setShowConfirm(false);
      toast.success("School registered successfully!");
    } catch (err) {
      const msg = err.response?.data?.message || "Submission failed. Please try again.";
      toast.error(msg);
      setShowConfirm(false);
    } finally {
      setLoading(false);
    }
  };

  // ── Success Screen ──────────────────────────────────────────────────────────
  if (submitted) {
    return (
      <div className="min-h-screen bg-[#0c0c14] flex items-center justify-center px-5">
        <div className="max-w-md w-full bg-[#13131f] border border-emerald-500/30 rounded-2xl p-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-5">
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="#10b981" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          </div>
          <h2 className="text-white text-xl font-bold mb-2">School Registered!</h2>
          <p className="text-slate-400 text-sm mb-6">
            <span className="text-emerald-400 font-semibold">{submittedData?.name}</span> has been
            successfully added to the database.
          </p>
          <div className="bg-slate-800/40 rounded-xl p-4 text-left mb-6 space-y-2">
            {[
              ["Name", submittedData?.name],
              ["Email", submittedData?.email],
              ["Principal", submittedData?.principal_name],
              ["Board", submittedData?.board_affiliation],
              ["Address", submittedData?.address],
            ].map(([label, val]) => val ? (
              <div key={label} className="flex gap-3 text-sm">
                <span className="text-slate-500 w-20 shrink-0">{label}</span>
                <span className="text-white truncate">{val}</span>
              </div>
            ) : null)}
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => { setForm(INITIAL); setErrors({}); setTouched({}); setSubmitted(false); setSubmittedData(null); }}
              className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all"
              style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}
            >
              Register Another
            </button>
            <Link
              to="/organisation"
              className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium text-slate-300 bg-slate-800/60 border border-slate-700/50 hover:text-white hover:bg-slate-700/60 transition-all text-center"
            >
              Back to Orgs
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0c0c14]">
      <ConfirmModal
        isOpen={showConfirm}
        onCancel={() => setShowConfirm(false)}
        onConfirm={handleConfirm}
        loading={loading}
        title="Register School?"
        message={`You are about to register "${form.name}" in the database. This action will create a permanent record. Proceed?`}
      />

      <div className="max-w-3xl mx-auto px-5 py-10">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-slate-500 mb-8">
          <Link to="/organisation" className="hover:text-slate-300 transition-colors">Organisation</Link>
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>
          <span className="text-indigo-400 font-medium">Register School</span>
        </div>

        {/* Header */}
        <div className="flex items-start gap-4 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="#6366f1" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5zm0 0v6m-4-4v4m8-4v4M3 21h18"/>
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">Register a School</h1>
            <p className="text-slate-400 text-sm">Fill in all required details. Fields marked with <span className="text-red-400">*</span> are mandatory.</p>
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-[#13131f] border border-slate-700/40 rounded-2xl p-6 md:p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

            {/* School Name */}
            <div className="md:col-span-2">
              <Field label="School Name" required error={touched.name && errors.name}>
                <input
                  type="text"
                  placeholder="e.g. Delhi Public School"
                  value={form.name}
                  onChange={(e) => set("name", e.target.value)}
                  onBlur={() => blur("name")}
                  className={inputCls(touched.name && errors.name)}
                />
              </Field>
            </div>

            {/* Email */}
            <Field label="Official Email" required error={touched.email && errors.email}>
              <input
                type="email"
                placeholder="school@example.com"
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
                onBlur={() => blur("email")}
                className={inputCls(touched.email && errors.email)}
              />
            </Field>

            {/* Phone */}
            <Field label="Contact Phone" required error={touched.phone && errors.phone}>
              <input
                type="tel"
                placeholder="+91 9876543210"
                value={form.phone}
                onChange={(e) => set("phone", e.target.value)}
                onBlur={() => blur("phone")}
                className={inputCls(touched.phone && errors.phone)}
              />
            </Field>

            {/* Principal Name */}
            <Field label="Principal Name" required error={touched.principal_name && errors.principal_name}>
              <input
                type="text"
                placeholder="Mr. / Ms. Full Name"
                value={form.principal_name}
                onChange={(e) => set("principal_name", e.target.value)}
                onBlur={() => blur("principal_name")}
                className={inputCls(touched.principal_name && errors.principal_name)}
              />
            </Field>

            {/* Board Affiliation */}
            <Field label="Board Affiliation" required error={touched.board_affiliation && errors.board_affiliation}>
              <select
                value={form.board_affiliation}
                onChange={(e) => set("board_affiliation", e.target.value)}
                onBlur={() => blur("board_affiliation")}
                className={inputCls(touched.board_affiliation && errors.board_affiliation) + " appearance-none"}
              >
                <option value="">Select board…</option>
                {BOARDS.map((b) => <option key={b} value={b}>{b}</option>)}
              </select>
            </Field>

            {/* Established Year */}
            <Field label="Established Year" required error={touched.established_year && errors.established_year}>
              <input
                type="number"
                placeholder={`e.g. 1995`}
                min="1800"
                max={new Date().getFullYear()}
                value={form.established_year}
                onChange={(e) => set("established_year", e.target.value)}
                onBlur={() => blur("established_year")}
                className={inputCls(touched.established_year && errors.established_year)}
              />
            </Field>

            {/* Total Students */}
            <Field label="Total Students" error={touched.total_students && errors.total_students}>
              <input
                type="number"
                placeholder="e.g. 1200"
                min="0"
                value={form.total_students}
                onChange={(e) => set("total_students", e.target.value)}
                onBlur={() => blur("total_students")}
                className={inputCls(touched.total_students && errors.total_students)}
              />
            </Field>

            {/* Website */}
            <Field label="Website" error={touched.website && errors.website}>
              <input
                type="url"
                placeholder="https://schoolwebsite.com"
                value={form.website}
                onChange={(e) => set("website", e.target.value)}
                onBlur={() => blur("website")}
                className={inputCls(touched.website && errors.website)}
              />
            </Field>

            {/* Address */}
            <div className="md:col-span-2">
              <Field label="Full Address" required error={touched.address && errors.address}>
                <textarea
                  rows={3}
                  placeholder="Street, City, State, PIN Code"
                  value={form.address}
                  onChange={(e) => set("address", e.target.value)}
                  onBlur={() => blur("address")}
                  className={inputCls(touched.address && errors.address) + " resize-none"}
                />
              </Field>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-8 flex items-center justify-between pt-6 border-t border-slate-800/60">
            <Link
              to="/organisation"
              className="text-sm text-slate-400 hover:text-white flex items-center gap-1.5 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg>
              Back
            </Link>
            <button
              onClick={handleSubmitClick}
              className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:-translate-y-0.5 active:translate-y-0"
              style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)", boxShadow: "0 4px 20px rgba(99,102,241,0.3)" }}
            >
              Submit Registration
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
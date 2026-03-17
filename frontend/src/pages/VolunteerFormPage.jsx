import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "../utils/axios.js";
import toast from "react-hot-toast";
import ConfirmModal from "../components/ConfirmModal";

const INITIAL = {
  name: "", email: "", phone: "", skills: "",
  assigned_to_type: "", assigned_to_id: "",
  availability: "", experience_years: "", address: "",
};

const AVAILABILITY = ["Full-time", "Part-time", "Weekends Only", "Flexible"];

// Type ke hisaab se API endpoint aur response key
const ORG_CONFIG = {
  school:  { endpoint: "/organisations/schools",  key: "schools"  },
  college: { endpoint: "/organisations/colleges", key: "colleges" },
  ngo:     { endpoint: "/organisations/ngos",     key: "ngos"     },
};

function Field({ label, required, error, hint, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-300 mb-1.5">
        {label}{required && <span className="text-red-400 ml-1">*</span>}
      </label>
      {children}
      {hint && !error && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
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
  `w-full bg-slate-800/50 border ${err ? "border-red-500/60" : "border-slate-700/50"} rounded-xl px-4 py-2.5 text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 ${err ? "focus:ring-red-500/30" : "focus:ring-amber-500/30"} focus:border-amber-500/50 transition-all`;

function validate(form) {
  const errs = {};
  if (!form.name.trim()) errs.name = "Full name is required.";
  else if (form.name.trim().length < 3) errs.name = "Name must be at least 3 characters.";
  if (!form.email.trim()) errs.email = "Email is required.";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = "Enter a valid email.";
  if (!form.phone.trim()) errs.phone = "Phone is required.";
  else if (!/^(\+\d{1,3}[- ]?)?\d{10,15}$/.test(form.phone)) errs.phone = "Enter a valid phone number.";
  if (!form.skills.trim()) errs.skills = "At least one skill is required.";
  if (!form.availability) errs.availability = "Availability is required.";
  if (form.experience_years && (isNaN(form.experience_years) || parseInt(form.experience_years) < 0 || parseInt(form.experience_years) > 60))
    errs.experience_years = "Enter a valid number (0–60).";
  if (form.assigned_to_type && !form.assigned_to_id)
    errs.assigned_to_id = "Please select an organisation.";
  return errs;
}

export default function VolunteerFormPage() {
  const [form, setForm]                   = useState(INITIAL);
  const [errors, setErrors]               = useState({});
  const [touched, setTouched]             = useState({});
  const [showConfirm, setShowConfirm]     = useState(false);
  const [loading, setLoading]             = useState(false);
  const [submitted, setSubmitted]         = useState(false);
  const [submittedData, setSubmittedData] = useState(null);
  const [skillInput, setSkillInput]       = useState("");
  const [skillsList, setSkillsList]       = useState([]);
  const [orgList, setOrgList]             = useState([]);
  const [orgLoading, setOrgLoading]       = useState(false);

  // ── Jab type change ho — organisations fetch karo ────────────────────────
  useEffect(() => {
    if (!form.assigned_to_type) {
      setOrgList([]);
      setForm((p) => ({ ...p, assigned_to_id: "" }));
      return;
    }
    const { endpoint, key } = ORG_CONFIG[form.assigned_to_type];
    setOrgLoading(true);
    setOrgList([]);
    setForm((p) => ({ ...p, assigned_to_id: "" }));

    axios.get(`${endpoint}?limit=100`)
      .then(({ data }) => setOrgList(data.data?.[key] || []))
      .catch(() => toast.error("Could not load organisations."))
      .finally(() => setOrgLoading(false));
  }, [form.assigned_to_type]);

  // ── Skills helpers ────────────────────────────────────────────────────────
  const addSkill = () => {
    const s = skillInput.trim();
    if (!s) return;
    if (skillsList.includes(s)) { toast.error("Already added."); return; }
    const updated = [...skillsList, s];
    setSkillsList(updated);
    setSkillInput("");
    setField("skills", updated.join(","));
  };

  const removeSkill = (sk) => {
    const updated = skillsList.filter((s) => s !== sk);
    setSkillsList(updated);
    setField("skills", updated.join(","));
  };

  // ── Field helpers ─────────────────────────────────────────────────────────
  const setField = (key, val) => {
    const updated = { ...form, [key]: val };
    setForm(updated);
    if (touched[key]) setErrors((p) => ({ ...p, [key]: validate(updated)[key] }));
  };

  const blur = (key) => {
    setTouched((p) => ({ ...p, [key]: true }));
    setErrors((p) => ({ ...p, [key]: validate(form)[key] }));
  };

  const handleSubmitClick = () => {
    setTouched(Object.fromEntries(Object.keys(INITIAL).map((k) => [k, true])));
    const errs = validate(form);
    setErrors(errs);
    if (Object.keys(errs).length > 0) { toast.error("Please fix all errors."); return; }
    setShowConfirm(true);
  };

  const handleConfirm = async () => {
    setLoading(true);
    try {
      const payload = {
        name: form.name.trim(),
        email: form.email.toLowerCase().trim(),
        phone: form.phone.trim(),
        skills: skillsList,
        availability: form.availability,
        ...(form.experience_years && { experience_years: parseInt(form.experience_years) }),
        ...(form.address && { address: form.address.trim() }),
        ...(form.assigned_to_type && form.assigned_to_id && {
          assigned_to: { type: form.assigned_to_type, id: form.assigned_to_id },
        }),
      };
      const { data } = await axios.post("/organisations/volunteers", payload);
      setSubmittedData(data.data?.volunteer || payload);
      setSubmitted(true);
      setShowConfirm(false);
      toast.success("Volunteer registered!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Submission failed.");
      setShowConfirm(false);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm(INITIAL); setSkillsList([]); setSkillInput("");
    setErrors({}); setTouched({}); setOrgList([]);
    setSubmitted(false); setSubmittedData(null);
  };

  // ── Success screen ────────────────────────────────────────────────────────
  if (submitted) {
    const orgName = orgList.find((o) => o._id === form.assigned_to_id)?.name;
    return (
      <div className="min-h-screen bg-[#0c0c14] flex items-center justify-center px-5">
        <div className="max-w-md w-full bg-[#13131f] border border-amber-500/30 rounded-2xl p-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto mb-5">
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="#f59e0b" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          </div>
          <h2 className="text-white text-xl font-bold mb-2">Volunteer Registered!</h2>
          <p className="text-slate-400 text-sm mb-6">
            <span className="text-amber-400 font-semibold">{submittedData?.name}</span> has been added.
          </p>
          <div className="bg-slate-800/40 rounded-xl p-4 text-left mb-6 space-y-2">
            {[
              ["Name",         submittedData?.name],
              ["Email",        submittedData?.email],
              ["Skills",       Array.isArray(submittedData?.skills) ? submittedData.skills.join(", ") : submittedData?.skills],
              ["Availability", submittedData?.availability],
              ["Assigned to",  orgName ? `${orgName} (${form.assigned_to_type})` : null],
            ].map(([l, v]) => v ? (
              <div key={l} className="flex gap-3 text-sm">
                <span className="text-slate-500 w-24 shrink-0">{l}</span>
                <span className="text-white">{v}</span>
              </div>
            ) : null)}
          </div>
          <div className="flex gap-3">
            <button onClick={resetForm} className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-white"
              style={{ background: "linear-gradient(135deg, #f59e0b, #d97706)" }}>
              Register Another
            </button>
            <Link to="/organisation" className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium text-slate-300 bg-slate-800/60 border border-slate-700/50 hover:text-white transition-all text-center">
              Back to Orgs
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const selectedOrg = orgList.find((o) => o._id === form.assigned_to_id);

  // ── Main form ─────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#0c0c14]">
      <ConfirmModal isOpen={showConfirm} onCancel={() => setShowConfirm(false)}
        onConfirm={handleConfirm} loading={loading} title="Register Volunteer?"
        message={`Register "${form.name}" as a volunteer? This creates a permanent record.`}
      />

      <div className="max-w-3xl mx-auto px-5 py-10">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-slate-500 mb-8">
          <Link to="/organisation" className="hover:text-slate-300 transition-colors">Organisation</Link>
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>
          <span className="text-amber-400 font-medium">Register Volunteer</span>
        </div>

        {/* Header */}
        <div className="flex items-start gap-4 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="#f59e0b" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">Register a Volunteer</h1>
            <p className="text-slate-400 text-sm">Fields marked with <span className="text-red-400">*</span> are mandatory.</p>
          </div>
        </div>

        <div className="bg-[#13131f] border border-slate-700/40 rounded-2xl p-6 md:p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

            {/* Name */}
            <div className="md:col-span-2">
              <Field label="Full Name" required error={touched.name && errors.name}>
                <input type="text" placeholder="Volunteer's full name" value={form.name}
                  onChange={(e) => setField("name", e.target.value)} onBlur={() => blur("name")}
                  className={inputCls(touched.name && errors.name)} />
              </Field>
            </div>

            {/* Email */}
            <Field label="Email Address" required error={touched.email && errors.email}>
              <input type="email" placeholder="volunteer@example.com" value={form.email}
                onChange={(e) => setField("email", e.target.value)} onBlur={() => blur("email")}
                className={inputCls(touched.email && errors.email)} />
            </Field>

            {/* Phone */}
            <Field label="Phone Number" required error={touched.phone && errors.phone}>
              <input type="tel" placeholder="+91 7777777777" value={form.phone}
                onChange={(e) => setField("phone", e.target.value)} onBlur={() => blur("phone")}
                className={inputCls(touched.phone && errors.phone)} />
            </Field>

            {/* Availability */}
            <Field label="Availability" required error={touched.availability && errors.availability}>
              <select value={form.availability} onChange={(e) => setField("availability", e.target.value)}
                onBlur={() => blur("availability")} className={inputCls(touched.availability && errors.availability) + " appearance-none"}>
                <option value="">Select availability…</option>
                {AVAILABILITY.map((a) => <option key={a} value={a}>{a}</option>)}
              </select>
            </Field>

            {/* Experience */}
            <Field label="Years of Experience" error={touched.experience_years && errors.experience_years}>
              <input type="number" placeholder="e.g. 2" min="0" max="60" value={form.experience_years}
                onChange={(e) => setField("experience_years", e.target.value)} onBlur={() => blur("experience_years")}
                className={inputCls(touched.experience_years && errors.experience_years)} />
            </Field>

            {/* Skills */}
            <div className="md:col-span-2">
              <Field label="Skills" required error={touched.skills && errors.skills} hint='Press Enter or click "+ Add" for each skill.'>
                <div className={`w-full bg-slate-800/50 border ${touched.skills && errors.skills ? "border-red-500/60" : "border-slate-700/50"} rounded-xl px-3 py-2.5 focus-within:ring-2 focus-within:ring-amber-500/30 focus-within:border-amber-500/50 transition-all`}>
                  {skillsList.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {skillsList.map((sk) => (
                        <span key={sk} className="flex items-center gap-1 bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs px-2.5 py-1 rounded-full">
                          {sk}
                          <button onClick={() => removeSkill(sk)} className="text-amber-400/60 hover:text-amber-300 transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="flex gap-2">
                    <input type="text" placeholder="e.g. Teaching, First Aid, IT…"
                      value={skillInput} onChange={(e) => setSkillInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addSkill(); } }}
                      onBlur={() => { if (!skillsList.length) blur("skills"); }}
                      className="flex-1 bg-transparent text-white text-sm placeholder-slate-500 focus:outline-none" />
                    <button type="button" onClick={addSkill} className="text-xs font-semibold text-amber-400 hover:text-amber-300 px-2 transition-colors shrink-0">
                      + Add
                    </button>
                  </div>
                </div>
              </Field>
            </div>

            {/* ── Assign to Organisation ─────────────────────────────── */}
            <div className="md:col-span-2">
              <div className="bg-slate-800/30 border border-slate-700/40 rounded-xl p-4">
                <p className="text-slate-300 text-xs font-semibold uppercase tracking-widest mb-3">
                  Assign to Organisation
                  <span className="text-slate-500 font-normal normal-case tracking-normal ml-2">(optional)</span>
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                  {/* Type select */}
                  <Field label="Organisation Type">
                    <select value={form.assigned_to_type}
                      onChange={(e) => setField("assigned_to_type", e.target.value)}
                      className={inputCls(false) + " appearance-none"}>
                      <option value="">Not assigned</option>
                      <option value="school">School</option>
                      <option value="college">College</option>
                      <option value="ngo">NGO</option>
                    </select>
                  </Field>

                  {/* Organisation name dropdown — auto-fetched */}
                  <Field label="Select Organisation"
                    error={touched.assigned_to_id && errors.assigned_to_id}
                    hint={!form.assigned_to_type ? "Select type first" : orgList.length === 0 && !orgLoading ? `No ${form.assigned_to_type}s registered yet` : ""}>
                    <div className="relative">
                      <select value={form.assigned_to_id}
                        onChange={(e) => { setField("assigned_to_id", e.target.value); blur("assigned_to_id"); }}
                        disabled={!form.assigned_to_type || orgLoading || orgList.length === 0}
                        className={inputCls(touched.assigned_to_id && errors.assigned_to_id) + " appearance-none disabled:opacity-40 disabled:cursor-not-allowed"}>
                        <option value="">{orgLoading ? "Loading…" : `Select ${form.assigned_to_type || "organisation"}…`}</option>
                        {orgList.map((org) => (
                          <option key={org._id} value={org._id}>{org.name}</option>
                        ))}
                      </select>
                      {orgLoading && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                          <div className="w-4 h-4 border-2 border-amber-500/30 border-t-amber-400 rounded-full animate-spin" />
                        </div>
                      )}
                    </div>

                    {/* Selected org preview */}
                    {selectedOrg && (
                      <div className="mt-2 bg-amber-500/5 border border-amber-500/20 rounded-lg px-3 py-2 flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="#f59e0b" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                        </svg>
                        <div>
                          <p className="text-amber-300 text-xs font-semibold">{selectedOrg.name}</p>
                          <p className="text-slate-500 text-[10px]">{selectedOrg.email} · {selectedOrg.phone}</p>
                        </div>
                      </div>
                    )}
                  </Field>

                </div>
              </div>
            </div>

            {/* Address */}
            <div className="md:col-span-2">
              <Field label="Address">
                <textarea rows={2} placeholder="Volunteer's address (optional)" value={form.address}
                  onChange={(e) => setField("address", e.target.value)}
                  className={inputCls(false) + " resize-none"} />
              </Field>
            </div>

          </div>

          {/* Actions */}
          <div className="mt-8 flex items-center justify-between pt-6 border-t border-slate-800/60">
            <Link to="/organisation" className="text-sm text-slate-400 hover:text-white flex items-center gap-1.5 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg>
              Back
            </Link>
            <button onClick={handleSubmitClick}
              className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:-translate-y-0.5"
              style={{ background: "linear-gradient(135deg, #f59e0b, #d97706)", boxShadow: "0 4px 20px rgba(245,158,11,0.3)" }}>
              Submit Registration
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
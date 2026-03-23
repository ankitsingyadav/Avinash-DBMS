// VolunteerFormPage.jsx — Updated with LocationSelector (cascading dropdowns)
import { useState } from "react";
import { Link } from "react-router-dom";
import axios from "../utils/axios.js";
import toast from "react-hot-toast";
import ConfirmModal from "../components/ConfirmModal";
import LocationSelector from "../components/LocationSelector"; // ← NEW

const AREAS = ["Teaching", "Tech", "Social Work", "Healthcare", "Environment", "Other"];

const INITIAL = {
  name: "", phone: "", email: "", website: "",
  address: "",
  // location fields — managed by LocationSelector
  state: "", district: "", city: "",
  area_of_interest: "", remarks: "", status: "Active", follow_up_date: "",
};

function Field({ label, required, error, children }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wide">
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

const ic = (err) =>
  `w-full bg-slate-800/60 border ${
    err
      ? "border-red-500/60 focus:ring-red-500/30"
      : "border-slate-700/50 focus:ring-amber-500/30 focus:border-amber-500/50"
  } rounded-xl px-3.5 py-2.5 text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 transition-all`;

function validate(f) {
  const e = {};
  if (!f.name.trim())  e.name = "Name is required.";
  else if (f.name.trim().length < 3) e.name = "Min 3 characters.";
  if (!f.phone.trim()) e.phone = "Phone is required.";
  else if (!/^(\+\d{1,3}[- ]?)?\d{10,15}$/.test(f.phone)) e.phone = "Enter a valid phone number.";
  if (!f.email.trim()) e.email = "Email is required.";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email)) e.email = "Enter a valid email.";
  if (f.website && f.website !== "NA" && !/^https?:\/\/.+/.test(f.website))
    e.website = "Must start with http:// or https://";
  if (!f.city.trim())     e.city    = "City is required.";
  if (!f.state)           e.state   = "State is required.";
  if (!f.district?.trim()) e.district = "District is required.";
  if (!f.area_of_interest) e.area_of_interest = "Area of interest is required.";
  if (!f.status)          e.status  = "Status is required.";
  return e;
}

export default function VolunteerFormPage() {
  const [form,          setForm]          = useState(INITIAL);
  const [errors,        setErrors]        = useState({});
  const [touched,       setTouched]       = useState({});
  const [showConfirm,   setShowConfirm]   = useState(false);
  const [loading,       setLoading]       = useState(false);
  const [submitted,     setSubmitted]     = useState(false);
  const [submittedData, setSubmittedData] = useState(null);

  const set = (key, val) => {
    setForm(p => ({ ...p, [key]: val }));
    if (touched[key]) setErrors(p => ({ ...p, [key]: validate({ ...form, [key]: val })[key] }));
  };

  const blur = (key) => {
    setTouched(p => ({ ...p, [key]: true }));
    setErrors(p => ({ ...p, [key]: validate(form)[key] }));
  };

  const handleSubmit = () => {
    setTouched(Object.fromEntries(Object.keys(INITIAL).map(k => [k, true])));
    const errs = validate(form);
    setErrors(errs);
    if (Object.keys(errs).length > 0) { toast.error("Please fix all errors."); return; }
    setShowConfirm(true);
  };

  const handleConfirm = async () => {
    setLoading(true);
    try {
      const payload = {
        name:             form.name.trim(),
        phone:            form.phone.trim(),
        email:            form.email.toLowerCase().trim(),
        website:          form.website?.trim() || "NA",
        address:          form.address?.trim() || null,
        city:             form.city.trim(),
        district:         form.district.trim(),
        state:            form.state,
        area_of_interest: form.area_of_interest,
        remarks:          form.remarks?.trim() || null,
        status:           form.status,
        follow_up_date:   form.follow_up_date || null,
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

  if (submitted) return (
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
            ["Name",     submittedData?.name],
            ["Interest", submittedData?.area_of_interest],
            ["City",     submittedData?.city],
            ["District", submittedData?.district],
            ["State",    submittedData?.state],
            ["Status",   submittedData?.status],
          ].map(([l, v]) => v ? (
            <div key={l} className="flex gap-3 text-sm">
              <span className="text-slate-500 w-20 shrink-0">{l}</span>
              <span className="text-white">{v}</span>
            </div>
          ) : null)}
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => { setForm(INITIAL); setErrors({}); setTouched({}); setSubmitted(false); }}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-white"
            style={{ background: "linear-gradient(135deg,#f59e0b,#d97706)" }}
          >
            Register Another
          </button>
          <Link
            to="/organisation"
            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium text-slate-300 bg-slate-800/60 border border-slate-700/50 hover:text-white transition-all text-center"
          >
            Back to Orgs
          </Link>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0c0c14]">
      <ConfirmModal
        isOpen={showConfirm}
        onCancel={() => setShowConfirm(false)}
        onConfirm={handleConfirm}
        loading={loading}
        title="Register Volunteer?"
        message={`Register "${form.name}" as a volunteer? This creates a permanent record.`}
      />

      <div className="max-w-3xl mx-auto px-5 py-10">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-slate-500 mb-8">
          <Link to="/organisation" className="hover:text-slate-300 transition-colors">Organisation</Link>
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/>
          </svg>
          <span className="text-amber-400 font-medium">Register Volunteer</span>
        </div>

        <div className="flex items-start gap-4 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="#f59e0b" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">Register a Volunteer</h1>
            <p className="text-slate-400 text-sm">Fields marked <span className="text-red-400">*</span> are mandatory.</p>
          </div>
        </div>

        <div className="bg-[#13131f] border border-slate-700/40 rounded-2xl p-6 md:p-8 space-y-6">
          {/* Type badge */}
          <div className="flex items-center gap-2 px-3 py-2 bg-amber-500/5 border border-amber-500/20 rounded-xl w-fit">
            <div className="w-2 h-2 rounded-full bg-amber-400" />
            <span className="text-amber-300 text-xs font-semibold">Individual Volunteer</span>
          </div>

          {/* Basic Information */}
          <div>
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-widest mb-4 pb-2 border-b border-slate-800">Basic Information</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Field label="Volunteer Name" required error={touched.name && errors.name}>
                  <input
                    type="text"
                    placeholder="Full Name"
                    value={form.name}
                    onChange={e => set("name", e.target.value)}
                    onBlur={() => blur("name")}
                    className={ic(touched.name && errors.name)}
                  />
                </Field>
              </div>
              <Field label="Area of Interest" required error={touched.area_of_interest && errors.area_of_interest}>
                <select
                  value={form.area_of_interest}
                  onChange={e => set("area_of_interest", e.target.value)}
                  onBlur={() => blur("area_of_interest")}
                  className={ic(touched.area_of_interest && errors.area_of_interest) + " appearance-none"}
                >
                  <option value="">Select area…</option>
                  {AREAS.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
              </Field>
              <Field label="Status" required error={touched.status && errors.status}>
                <select
                  value={form.status}
                  onChange={e => set("status", e.target.value)}
                  onBlur={() => blur("status")}
                  className={ic(touched.status && errors.status) + " appearance-none"}
                >
                  <option value="Active">Active</option>
                  <option value="Not Active">Not Active</option>
                </select>
              </Field>
            </div>
          </div>

          {/* Contact Details */}
          <div>
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-widest mb-4 pb-2 border-b border-slate-800">Contact Details</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Contact Number" required error={touched.phone && errors.phone}>
                <input
                  type="tel"
                  placeholder="+91 7777777777"
                  value={form.phone}
                  onChange={e => set("phone", e.target.value)}
                  onBlur={() => blur("phone")}
                  className={ic(touched.phone && errors.phone)}
                />
              </Field>
              <Field label="Email" required error={touched.email && errors.email}>
                <input
                  type="email"
                  placeholder="volunteer@example.com"
                  value={form.email}
                  onChange={e => set("email", e.target.value)}
                  onBlur={() => blur("email")}
                  className={ic(touched.email && errors.email)}
                />
              </Field>
              <div className="md:col-span-2">
                <Field label="Website (Optional)" error={touched.website && errors.website}>
                  <input
                    type="text"
                    placeholder="https://portfolio.com  (leave blank for NA)"
                    value={form.website}
                    onChange={e => set("website", e.target.value)}
                    onBlur={() => blur("website")}
                    className={ic(touched.website && errors.website)}
                  />
                  <p className="mt-1 text-xs text-slate-600">Leave blank to set as NA automatically</p>
                </Field>
              </div>
            </div>
          </div>

          {/* Location — handled by LocationSelector */}
          <div>
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-widest mb-4 pb-2 border-b border-slate-800">Location</p>

            {/* Optional freeform address */}
            <div className="mb-4">
              <Field label="Address">
                <textarea
                  rows={2}
                  placeholder="Street / Area (optional)"
                  value={form.address}
                  onChange={e => set("address", e.target.value)}
                  className={ic(false) + " resize-none"}
                />
              </Field>
            </div>

            {/* ── LocationSelector (no pincode for volunteer form) ── */}
            <LocationSelector
              mode="manual"
              showPincode={false}
              values={{ state: form.state, district: form.district, city: form.city }}
              onChange={(key, val) => set(key, val)}
              onBlur={(key) => blur(key)}
              errors={errors}
              touched={touched}
            />
          </div>

          {/* Follow-up */}
          <div>
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-widest mb-4 pb-2 border-b border-slate-800">Follow-up</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Follow-up Date">
                <input
                  type="date"
                  value={form.follow_up_date}
                  onChange={e => set("follow_up_date", e.target.value)}
                  className={ic(false) + " [color-scheme:dark]"}
                />
              </Field>
              <div className="md:col-span-2">
                <Field label="Remarks">
                  <textarea
                    rows={3}
                    placeholder="Any notes or remarks…"
                    value={form.remarks}
                    onChange={e => set("remarks", e.target.value)}
                    className={ic(false) + " resize-none"}
                  />
                </Field>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-800/60">
            <Link
              to="/organisation"
              className="text-sm text-slate-400 hover:text-white flex items-center gap-1.5 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/>
              </svg>
              Back
            </Link>
            <button
              onClick={handleSubmit}
              className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white hover:-translate-y-0.5 transition-all"
              style={{ background: "linear-gradient(135deg,#f59e0b,#d97706)", boxShadow: "0 4px 20px rgba(245,158,11,0.3)" }}
            >
              Add Registration
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
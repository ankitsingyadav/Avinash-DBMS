import { useState } from "react";
import { Link } from "react-router-dom";
import axios from "../utils/axios.js";
import toast from "react-hot-toast";
import ConfirmModal from "../components/ConfirmModal";

const INDIAN_STATES = ["Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh","Goa","Gujarat","Haryana","Himachal Pradesh","Jharkhand","Karnataka","Kerala","Madhya Pradesh","Maharashtra","Manipur","Meghalaya","Mizoram","Nagaland","Odisha","Punjab","Rajasthan","Sikkim","Tamil Nadu","Telangana","Tripura","Uttar Pradesh","Uttarakhand","West Bengal","Andaman and Nicobar Islands","Chandigarh","Dadra and Nagar Haveli and Daman and Diu","Delhi","Jammu and Kashmir","Ladakh","Lakshadweep","Puducherry"];

const INITIAL = {
  name: "", ngo_type: "", phone: "", email: "", website: "",
  address: "", city: "", state: "",
  coordinator_name: "", remarks: "", status: "Active", follow_up_date: "",
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
          <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/></svg>
          {error}
        </p>
      )}
    </div>
  );
}

const ic = (err) => `w-full bg-slate-800/60 border ${err ? "border-red-500/60 focus:ring-red-500/30" : "border-slate-700/50 focus:ring-emerald-500/30 focus:border-emerald-500/50"} rounded-xl px-3.5 py-2.5 text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 transition-all`;

function validate(f) {
  const e = {};
  if (!f.name.trim()) e.name = "NGO name is required.";
  else if (f.name.trim().length < 3) e.name = "Min 3 characters.";
  if (!f.ngo_type) e.ngo_type = "NGO type is required.";
  if (!f.phone.trim()) e.phone = "Phone is required.";
  else if (!/^(\+\d{1,3}[- ]?)?\d{10,15}$/.test(f.phone)) e.phone = "Enter a valid phone number.";
  if (!f.email.trim()) e.email = "Email is required.";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email)) e.email = "Enter a valid email.";
  if (f.website && f.website !== "NA" && !/^https?:\/\/.+/.test(f.website)) e.website = "Must start with http:// or https://";
  if (!f.address.trim()) e.address = "Address is required.";
  if (!f.city.trim()) e.city = "City is required.";
  if (!f.state) e.state = "State is required.";
  if (!f.coordinator_name.trim()) e.coordinator_name = "Coordinator name is required.";
  if (!f.status) e.status = "Status is required.";
  return e;
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
        name: form.name.trim(), ngo_type: form.ngo_type,
        phone: form.phone.trim(), email: form.email.toLowerCase().trim(),
        website: form.website?.trim() || "NA",
        address: form.address.trim(), city: form.city.trim(), state: form.state,
        coordinator_name: form.coordinator_name.trim(),
        remarks: form.remarks?.trim() || null,
        status: form.status,
        follow_up_date: form.follow_up_date || null,
      };
      const { data } = await axios.post("/organisations/ngos", payload);
      setSubmittedData(data.data?.ngo || payload);
      setSubmitted(true); setShowConfirm(false);
      toast.success("NGO registered successfully!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Submission failed.");
      setShowConfirm(false);
    } finally { setLoading(false); }
  };

  if (submitted) return (
    <div className="min-h-screen bg-[#0c0c14] flex items-center justify-center px-5">
      <div className="max-w-md w-full bg-[#13131f] border border-emerald-500/30 rounded-2xl p-8 text-center">
        <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-5">
          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="#10b981" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
        </div>
        <h2 className="text-white text-xl font-bold mb-2">NGO Registered!</h2>
        <p className="text-slate-400 text-sm mb-6"><span className="text-emerald-400 font-semibold">{submittedData?.name}</span> has been added.</p>
        <div className="bg-slate-800/40 rounded-xl p-4 text-left mb-6 space-y-2">
          {[["Name",submittedData?.name],["Type",submittedData?.ngo_type],["Coordinator",submittedData?.coordinator_name],["City",submittedData?.city],["Status",submittedData?.status]].map(([l,v])=>v?(
            <div key={l} className="flex gap-3 text-sm"><span className="text-slate-500 w-24 shrink-0">{l}</span><span className="text-white">{v}</span></div>
          ):null)}
        </div>
        <div className="flex gap-3">
          <button onClick={()=>{setForm(INITIAL);setErrors({});setTouched({});setSubmitted(false);}} className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-white" style={{background:"linear-gradient(135deg,#10b981,#059669)"}}>Register Another</button>
          <Link to="/organisation" className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium text-slate-300 bg-slate-800/60 border border-slate-700/50 hover:text-white transition-all text-center">Back to Orgs</Link>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0c0c14]">
      <ConfirmModal isOpen={showConfirm} onCancel={()=>setShowConfirm(false)} onConfirm={handleConfirm} loading={loading}
        title="Register NGO?" message={`Register "${form.name}"? This will create a permanent record.`} />
      <div className="max-w-3xl mx-auto px-5 py-10">
        <div className="flex items-center gap-2 text-xs text-slate-500 mb-8">
          <Link to="/organisation" className="hover:text-slate-300 transition-colors">Organisation</Link>
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>
          <span className="text-emerald-400 font-medium">Register NGO</span>
        </div>
        <div className="flex items-start gap-4 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="#10b981" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/></svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">Register an NGO</h1>
            <p className="text-slate-400 text-sm">Fields marked <span className="text-red-400">*</span> are mandatory.</p>
          </div>
        </div>

        <div className="bg-[#13131f] border border-slate-700/40 rounded-2xl p-6 md:p-8 space-y-6">
          <div>
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-widest mb-4 pb-2 border-b border-slate-800">Basic Information</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Field label="NGO Name" required error={touched.name&&errors.name}>
                  <input type="text" placeholder="e.g. Helping Hands Foundation" value={form.name} onChange={e=>set("name",e.target.value)} onBlur={()=>blur("name")} className={ic(touched.name&&errors.name)} />
                </Field>
              </div>
              <Field label="Type (Trust / Society / Foundation)" required error={touched.ngo_type&&errors.ngo_type}>
                <select value={form.ngo_type} onChange={e=>set("ngo_type",e.target.value)} onBlur={()=>blur("ngo_type")} className={ic(touched.ngo_type&&errors.ngo_type)+" appearance-none"}>
                  <option value="">Select type…</option>
                  <option value="Trust">Trust</option>
                  <option value="Society">Society</option>
                  <option value="Foundation">Foundation</option>
                </select>
              </Field>
              <Field label="Status" required error={touched.status&&errors.status}>
                <select value={form.status} onChange={e=>set("status",e.target.value)} onBlur={()=>blur("status")} className={ic(touched.status&&errors.status)+" appearance-none"}>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </Field>
            </div>
          </div>

          <div>
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-widest mb-4 pb-2 border-b border-slate-800">Contact Details</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Contact Number" required error={touched.phone&&errors.phone}>
                <input type="tel" placeholder="+91 8888888888" value={form.phone} onChange={e=>set("phone",e.target.value)} onBlur={()=>blur("phone")} className={ic(touched.phone&&errors.phone)} />
              </Field>
              <Field label="Email" required error={touched.email&&errors.email}>
                <input type="email" placeholder="ngo@example.org" value={form.email} onChange={e=>set("email",e.target.value)} onBlur={()=>blur("email")} className={ic(touched.email&&errors.email)} />
              </Field>
              <div className="md:col-span-2">
                <Field label="Website" error={touched.website&&errors.website}>
                  <input type="text" placeholder="https://ngowebsite.org  (leave blank for NA)" value={form.website} onChange={e=>set("website",e.target.value)} onBlur={()=>blur("website")} className={ic(touched.website&&errors.website)} />
                  <p className="mt-1 text-xs text-slate-600">Leave blank to set as NA automatically</p>
                </Field>
              </div>
            </div>
          </div>

          <div>
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-widest mb-4 pb-2 border-b border-slate-800">Location</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Field label="Address" required error={touched.address&&errors.address}>
                  <textarea rows={2} placeholder="Street / Area" value={form.address} onChange={e=>set("address",e.target.value)} onBlur={()=>blur("address")} className={ic(touched.address&&errors.address)+" resize-none"} />
                </Field>
              </div>
              <Field label="City" required error={touched.city&&errors.city}>
                <input type="text" placeholder="e.g. Mumbai" value={form.city} onChange={e=>set("city",e.target.value)} onBlur={()=>blur("city")} className={ic(touched.city&&errors.city)} />
              </Field>
              <Field label="State" required error={touched.state&&errors.state}>
                <select value={form.state} onChange={e=>set("state",e.target.value)} onBlur={()=>blur("state")} className={ic(touched.state&&errors.state)+" appearance-none"}>
                  <option value="">Select state…</option>
                  {INDIAN_STATES.map(s=><option key={s} value={s}>{s}</option>)}
                </select>
              </Field>
            </div>
          </div>

          <div>
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-widest mb-4 pb-2 border-b border-slate-800">Contact Person & Follow-up</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Coordinator Name (Contact Person)" required error={touched.coordinator_name&&errors.coordinator_name}>
                <input type="text" placeholder="Full Name" value={form.coordinator_name} onChange={e=>set("coordinator_name",e.target.value)} onBlur={()=>blur("coordinator_name")} className={ic(touched.coordinator_name&&errors.coordinator_name)} />
              </Field>
              <Field label="Follow-up Date">
                <input type="date" value={form.follow_up_date} onChange={e=>set("follow_up_date",e.target.value)} className={ic(false)+" [color-scheme:dark]"} />
              </Field>
              <div className="md:col-span-2">
                <Field label="Remarks">
                  <textarea rows={3} placeholder="Any notes or remarks…" value={form.remarks} onChange={e=>set("remarks",e.target.value)} className={ic(false)+" resize-none"} />
                </Field>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-800/60">
            <Link to="/organisation" className="text-sm text-slate-400 hover:text-white flex items-center gap-1.5 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg>Back
            </Link>
            <button onClick={handleSubmit} className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white hover:-translate-y-0.5 transition-all" style={{background:"linear-gradient(135deg,#10b981,#059669)",boxShadow:"0 4px 20px rgba(16,185,129,0.3)"}}>
              Submit Registration
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
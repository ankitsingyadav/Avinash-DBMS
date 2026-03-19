import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import axios from "../utils/axios.js";
import toast from "react-hot-toast";
import Navbar from "../components/Navbar";
import ConfirmModal from "../components/ConfirmModal";
import * as XLSX from "xlsx";

// ─── CONSTANTS ────────────────────────────────────────────────────────────────

const INDIAN_STATES = ["Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh","Goa","Gujarat","Haryana","Himachal Pradesh","Jharkhand","Karnataka","Kerala","Madhya Pradesh","Maharashtra","Manipur","Meghalaya","Mizoram","Nagaland","Odisha","Punjab","Rajasthan","Sikkim","Tamil Nadu","Telangana","Tripura","Uttar Pradesh","Uttarakhand","West Bengal","Delhi","Chandigarh","Jammu and Kashmir","Ladakh","Puducherry"];

const CATEGORIES = [
  {
    id: "school", label: "Schools", accent: "#6366f1", endpoint: "/organisations/schools", dataKey: "schools",
    columns: [
      { key: "_id", label: "ID", mono: true, w: 100 },
      { key: "name", label: "School Name", sortable: true, bold: true, w: 200 },
      { key: "school_type", label: "Type", badge: true, w: 100 },
      { key: "phone", label: "Phone", w: 140 },
      { key: "email", label: "Email", w: 190 },
      { key: "city", label: "City", sortable: true, w: 110 },
      { key: "state", label: "State", sortable: true, w: 130 },
      { key: "principal_name", label: "Principal", w: 150 },
      { key: "status", label: "Status", isStatus: true, w: 90 },
      { key: "follow_up_date", label: "Follow-up", isDate: true, sortable: true, w: 100 },
      { key: "createdAt", label: "Added", isDate: true, sortable: true, w: 95 },
    ],
    filters: [
      { key: "school_type", label: "Type", options: ["Government", "Private"] },
      { key: "status", label: "Status", options: ["Active", "Inactive"] },
      { key: "state", label: "State", options: INDIAN_STATES },
    ],
    fields: ["name","school_type","phone","email","website","address","city","state","principal_name","remarks","status","follow_up_date"],
    requiredFields: ["name","school_type","phone","email","address","city","state","principal_name"],
    fieldMap: { "name":"name","school name":"name","type":"school_type","school type":"school_type","phone":"phone","contact number":"phone","email":"email","website":"website","address":"address","city":"city","state":"state","principal":"principal_name","principal name":"principal_name","contact person":"principal_name","remarks":"remarks","status":"status","follow up date":"follow_up_date","follow-up date":"follow_up_date","id":"_id","_id":"_id" },
    signatureFields: ["school_type","principal_name"],
    editFields: [
      { key:"name", label:"School Name", type:"text", required:true },
      { key:"school_type", label:"Type", type:"select", options:["Government","Private"], required:true },
      { key:"phone", label:"Phone", type:"tel", required:true },
      { key:"email", label:"Email", type:"email", required:true },
      { key:"website", label:"Website", type:"text" },
      { key:"address", label:"Address", type:"textarea" },
      { key:"city", label:"City", type:"text", required:true },
      { key:"state", label:"State", type:"select", options:INDIAN_STATES, required:true },
      { key:"principal_name", label:"Principal Name", type:"text", required:true },
      { key:"status", label:"Status", type:"select", options:["Active","Inactive"] },
      { key:"follow_up_date", label:"Follow-up Date", type:"date" },
      { key:"remarks", label:"Remarks", type:"textarea" },
    ],
    icon: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5zm0 0v6m-4-4v4m8-4v4M3 21h18"/></svg>,
  },
  {
    id: "college", label: "Colleges", accent: "#0ea5e9", endpoint: "/organisations/colleges", dataKey: "colleges",
    columns: [
      { key: "_id", label: "ID", mono: true, w: 100 },
      { key: "name", label: "College Name", sortable: true, bold: true, w: 200 },
      { key: "college_type", label: "Type", badge: true, w: 110 },
      { key: "phone", label: "Phone", w: 140 },
      { key: "email", label: "Email", w: 190 },
      { key: "city", label: "City", sortable: true, w: 110 },
      { key: "state", label: "State", sortable: true, w: 130 },
      { key: "placement_officer", label: "Officer / HOD", w: 150 },
      { key: "status", label: "Status", isStatus: true, w: 90 },
      { key: "follow_up_date", label: "Follow-up", isDate: true, sortable: true, w: 100 },
      { key: "createdAt", label: "Added", isDate: true, sortable: true, w: 95 },
    ],
    filters: [
      { key: "college_type", label: "Type", options: ["University", "Private", "Government"] },
      { key: "status", label: "Status", options: ["Active", "Inactive"] },
      { key: "state", label: "State", options: INDIAN_STATES },
    ],
    fields: ["name","college_type","phone","email","website","address","city","state","placement_officer","remarks","status","follow_up_date"],
    requiredFields: ["name","college_type","phone","email","address","city","state","placement_officer"],
    fieldMap: { "name":"name","college name":"name","type":"college_type","college type":"college_type","phone":"phone","contact number":"phone","email":"email","website":"website","address":"address","city":"city","state":"state","placement officer":"placement_officer","placement officer / hod":"placement_officer","hod":"placement_officer","contact person":"placement_officer","officer":"placement_officer","remarks":"remarks","status":"status","follow up date":"follow_up_date","follow-up date":"follow_up_date","id":"_id","_id":"_id" },
    signatureFields: ["college_type","placement_officer"],
    editFields: [
      { key:"name", label:"College Name", type:"text", required:true },
      { key:"college_type", label:"Type", type:"select", options:["University","Private","Government"], required:true },
      { key:"phone", label:"Phone", type:"tel", required:true },
      { key:"email", label:"Email", type:"email", required:true },
      { key:"website", label:"Website", type:"text" },
      { key:"address", label:"Address", type:"textarea" },
      { key:"city", label:"City", type:"text", required:true },
      { key:"state", label:"State", type:"select", options:INDIAN_STATES, required:true },
      { key:"placement_officer", label:"Placement Officer / HOD", type:"text", required:true },
      { key:"status", label:"Status", type:"select", options:["Active","Inactive"] },
      { key:"follow_up_date", label:"Follow-up Date", type:"date" },
      { key:"remarks", label:"Remarks", type:"textarea" },
    ],
    icon: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4"/></svg>,
  },
  {
    id: "ngo", label: "NGOs", accent: "#10b981", endpoint: "/organisations/ngos", dataKey: "ngos",
    columns: [
      { key: "_id", label: "ID", mono: true, w: 100 },
      { key: "name", label: "NGO Name", sortable: true, bold: true, w: 200 },
      { key: "ngo_type", label: "Type", badge: true, w: 110 },
      { key: "phone", label: "Phone", w: 140 },
      { key: "email", label: "Email", w: 190 },
      { key: "city", label: "City", sortable: true, w: 110 },
      { key: "state", label: "State", sortable: true, w: 130 },
      { key: "coordinator_name", label: "Coordinator", w: 150 },
      { key: "status", label: "Status", isStatus: true, w: 90 },
      { key: "follow_up_date", label: "Follow-up", isDate: true, sortable: true, w: 100 },
      { key: "createdAt", label: "Added", isDate: true, sortable: true, w: 95 },
    ],
    filters: [
      { key: "ngo_type", label: "Type", options: ["Trust", "Society", "Foundation"] },
      { key: "status", label: "Status", options: ["Active", "Inactive"] },
      { key: "state", label: "State", options: INDIAN_STATES },
    ],
    fields: ["name","ngo_type","phone","email","website","address","city","state","coordinator_name","remarks","status","follow_up_date"],
    requiredFields: ["name","ngo_type","phone","email","address","city","state","coordinator_name"],
    fieldMap: { "name":"name","ngo name":"name","type":"ngo_type","ngo type":"ngo_type","phone":"phone","contact number":"phone","email":"email","website":"website","address":"address","city":"city","state":"state","coordinator":"coordinator_name","coordinator name":"coordinator_name","contact person":"coordinator_name","remarks":"remarks","status":"status","follow up date":"follow_up_date","follow-up date":"follow_up_date","id":"_id","_id":"_id" },
    signatureFields: ["ngo_type","coordinator_name"],
    editFields: [
      { key:"name", label:"NGO Name", type:"text", required:true },
      { key:"ngo_type", label:"Type", type:"select", options:["Trust","Society","Foundation"], required:true },
      { key:"phone", label:"Phone", type:"tel", required:true },
      { key:"email", label:"Email", type:"email", required:true },
      { key:"website", label:"Website", type:"text" },
      { key:"address", label:"Address", type:"textarea" },
      { key:"city", label:"City", type:"text", required:true },
      { key:"state", label:"State", type:"select", options:INDIAN_STATES, required:true },
      { key:"coordinator_name", label:"Coordinator Name", type:"text", required:true },
      { key:"status", label:"Status", type:"select", options:["Active","Inactive"] },
      { key:"follow_up_date", label:"Follow-up Date", type:"date" },
      { key:"remarks", label:"Remarks", type:"textarea" },
    ],
    icon: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/></svg>,
  },
  {
    id: "volunteer", label: "Volunteers", accent: "#f59e0b", endpoint: "/organisations/volunteers", dataKey: "volunteers",
    columns: [
      { key: "_id", label: "ID", mono: true, w: 100 },
      { key: "name", label: "Name", sortable: true, bold: true, w: 180 },
      { key: "area_of_interest", label: "Interest", badge: true, w: 120 },
      { key: "phone", label: "Phone", w: 140 },
      { key: "email", label: "Email", w: 190 },
      { key: "city", label: "City", sortable: true, w: 110 },
      { key: "state", label: "State", sortable: true, w: 130 },
      { key: "status", label: "Status", isStatus: true, w: 90 },
      { key: "follow_up_date", label: "Follow-up", isDate: true, sortable: true, w: 100 },
      { key: "createdAt", label: "Added", isDate: true, sortable: true, w: 95 },
    ],
    filters: [
      { key: "area_of_interest", label: "Interest", options: ["Teaching","Tech","Social Work","Healthcare","Environment","Other"] },
      { key: "status", label: "Status", options: ["Active", "Not Active"] },
      { key: "state", label: "State", options: INDIAN_STATES },
    ],
    fields: ["name","phone","email","website","address","city","state","area_of_interest","remarks","status","follow_up_date"],
    requiredFields: ["name","phone","email","city","state","area_of_interest"],
    fieldMap: { "name":"name","volunteer name":"name","phone":"phone","contact number":"phone","email":"email","website":"website","address":"address","city":"city","state":"state","area of interest":"area_of_interest","interest":"area_of_interest","remarks":"remarks","status":"status","follow up date":"follow_up_date","follow-up date":"follow_up_date","id":"_id","_id":"_id" },
    signatureFields: ["area_of_interest"],
    editFields: [
      { key:"name", label:"Name", type:"text", required:true },
      { key:"phone", label:"Phone", type:"tel", required:true },
      { key:"email", label:"Email", type:"email", required:true },
      { key:"website", label:"Website", type:"text" },
      { key:"address", label:"Address", type:"textarea" },
      { key:"city", label:"City", type:"text", required:true },
      { key:"state", label:"State", type:"select", options:INDIAN_STATES, required:true },
      { key:"area_of_interest", label:"Area of Interest", type:"select", options:["Teaching","Tech","Social Work","Healthcare","Environment","Other"], required:true },
      { key:"status", label:"Status", type:"select", options:["Active","Not Active"] },
      { key:"follow_up_date", label:"Follow-up Date", type:"date" },
      { key:"remarks", label:"Remarks", type:"textarea" },
    ],
    icon: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg>,
  },
];

// ─── HELPERS ──────────────────────────────────────────────────────────────────

const fmtDate = (d) => d ? new Date(d).toLocaleDateString("en-IN", { day:"2-digit", month:"short", year:"numeric" }) : "—";
const shortId = (id) => id ? String(id).slice(-8) : "—";

function HighlightText({ text, query }) {
  if (!query || !text) return <span>{text || "—"}</span>;
  const str = String(text);
  const idx = str.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return <span>{str}</span>;
  return (
    <span>
      {str.slice(0, idx)}
      <mark style={{background:"rgba(250,204,21,0.25)",color:"#fde68a",borderRadius:"3px",padding:"0 2px"}}>{str.slice(idx, idx + query.length)}</mark>
      {str.slice(idx + query.length)}
    </span>
  );
}

const STATUS_COLORS = {
  "Active":     { bg:"rgba(16,185,129,0.12)",  text:"#10b981", dot:"#10b981" },
  "Inactive":   { bg:"rgba(100,116,139,0.15)", text:"#64748b", dot:"#475569" },
  "Not Active": { bg:"rgba(239,68,68,0.12)",   text:"#f87171", dot:"#ef4444" },
};

function StatusBadge({ value }) {
  const c = STATUS_COLORS[value] || STATUS_COLORS["Inactive"];
  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap"
      style={{background:c.bg, color:c.text}}>
      <span className="w-1.5 h-1.5 rounded-full" style={{background:c.dot}} />
      {value || "—"}
    </span>
  );
}

function TypeBadge({ value, accent }) {
  if (!value) return <span className="text-slate-700 text-xs">—</span>;
  return (
    <span className="inline-block px-2 py-0.5 rounded-md text-xs font-semibold whitespace-nowrap"
      style={{background:`${accent}15`, color:accent, border:`1px solid ${accent}25`}}>
      {value}
    </span>
  );
}

const ic = (err) => `w-full bg-slate-800/60 border ${err ? "border-red-500/60" : "border-slate-700/50"} rounded-lg px-3 py-2 text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 ${err ? "focus:ring-red-500/30" : "focus:ring-indigo-500/30 focus:border-indigo-500/50"} transition-all`;

// ─── IMPORT HELPERS ───────────────────────────────────────────────────────────

const ALL_FIELD_MAPS = Object.fromEntries(CATEGORIES.map(c => [c.id, c.fieldMap]));
const CAT_SIGNATURE  = Object.fromEntries(CATEGORIES.map(c => [c.id, c.signatureFields]));

function parseSheetRows(ws, fieldMap) {
  const raw = XLSX.utils.sheet_to_json(ws, { header:1, defval:"" });
  let hi = -1;
  for (let i = 0; i < Math.min(raw.length, 8); i++) {
    if (raw[i].some(cell => fieldMap[String(cell).toLowerCase().trim()] !== undefined)) { hi = i; break; }
  }
  if (hi === -1) return null;
  const headers = raw[hi];
  return raw.slice(hi + 1).map(row => {
    const obj = {};
    headers.forEach((h, i) => {
      const key = fieldMap[String(h).toLowerCase().trim()];
      if (key && row[i] !== undefined && String(row[i]).trim() !== "") obj[key] = String(row[i]).trim();
    });
    return obj;
  }).filter(r => r.name && r.name.length > 0);
}

// ─── EDIT MODAL ───────────────────────────────────────────────────────────────

function EditModal({ isOpen, onClose, record, category, onSaved }) {
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (record && category) {
      const init = {};
      category.editFields.forEach(f => {
        let v = record[f.key];
        if (f.key === "follow_up_date" && v) v = new Date(v).toISOString().split("T")[0];
        init[f.key] = v ?? "";
      });
      setForm(init);
    }
  }, [record, category]);

  if (!isOpen || !record) return null;

  const handleSave = async () => {
    setLoading(true);
    try {
      const payload = {};
      category.editFields.forEach(f => { if (form[f.key] !== undefined && form[f.key] !== "") payload[f.key] = form[f.key]; });
      await axios.put(`${category.endpoint}/${record._id}`, payload);
      toast.success("Updated successfully!");
      onSaved(); onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Update failed.");
    } finally { setLoading(false); }
  };

  const renderInput = (f) => {
    if (f.type === "select") return (
      <select value={form[f.key]||""} onChange={e=>setForm(p=>({...p,[f.key]:e.target.value}))} className={ic(false)+" appearance-none"}>
        <option value="">Select…</option>
        {f.options.map(o=><option key={o} value={o}>{o}</option>)}
      </select>
    );
    if (f.type === "textarea") return (
      <textarea rows={2} value={form[f.key]||""} onChange={e=>setForm(p=>({...p,[f.key]:e.target.value}))} className={ic(false)+" resize-none"} />
    );
    return <input type={f.type} value={form[f.key]||""} onChange={e=>setForm(p=>({...p,[f.key]:e.target.value}))} className={ic(false)+(f.type==="date"?" [color-scheme:dark]":"")} />;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-[#13131f] border border-slate-700/50 rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{background:`${category.accent}15`,border:`1px solid ${category.accent}30`}}>
              <span style={{color:category.accent}}>{category.icon}</span>
            </div>
            <div>
              <h3 className="text-white font-bold text-sm">Edit {category.label.slice(0,-1)}</h3>
              <p className="text-slate-700 text-xs font-mono">{record._id}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-600 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>
        <div className="overflow-y-auto flex-1 px-6 py-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {category.editFields.map(f => (
              <div key={f.key} className={(f.type==="textarea"||f.key==="address"||f.key==="remarks")?"sm:col-span-2":""}>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  {f.label}{f.required&&<span className="text-red-400 ml-1">*</span>}
                </label>
                {renderInput(f)}
              </div>
            ))}
          </div>
        </div>
        <div className="flex gap-3 px-6 py-4 border-t border-slate-800 shrink-0">
          <button onClick={onClose} className="flex-1 py-2 rounded-lg text-sm font-medium text-slate-400 bg-slate-800/60 border border-slate-700/50 hover:text-white transition-all">Cancel</button>
          <button onClick={handleSave} disabled={loading} className="flex-1 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-50 transition-all hover:-translate-y-0.5"
            style={{background:`linear-gradient(135deg,${category.accent},${category.accent}cc)`,boxShadow:`0 4px 15px ${category.accent}25`}}>
            {loading ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── VIEW MODAL ───────────────────────────────────────────────────────────────

function ViewModal({ isOpen, onClose, record, category, onEdit, onDelete }) {
  if (!isOpen || !record) return null;
  const allKeys = [...category.editFields.map(f=>f.key), "_id", "createdAt"];
  const labels  = Object.fromEntries(category.editFields.map(f=>[f.key,f.label]));
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-[#13131f] border border-slate-700/50 rounded-2xl shadow-2xl flex flex-col max-h-[85vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl shrink-0 flex items-center justify-center" style={{background:`${category.accent}15`,border:`1px solid ${category.accent}30`}}>
              <span style={{color:category.accent}}>{category.icon}</span>
            </div>
            <div className="min-w-0">
              <h3 className="text-white font-bold text-sm truncate">{record.name}</h3>
              <StatusBadge value={record.status} />
            </div>
          </div>
          <button onClick={onClose} className="text-slate-600 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>
        <div className="overflow-y-auto flex-1 px-6 py-4 space-y-3">
          {allKeys.map(k => {
            let val = record[k]; if (!val && val !== 0) return null;
            let display;
            if (k === "_id") display = <span className="font-mono text-xs text-slate-500 break-all">{val}</span>;
            else if (k === "createdAt" || k === "follow_up_date") display = fmtDate(val);
            else if (k === "status") display = <StatusBadge value={val} />;
            else display = <span className="text-white text-sm">{String(val)}</span>;
            return (
              <div key={k} className="flex gap-3 items-start">
                <span className="text-slate-600 text-xs font-semibold uppercase tracking-wide w-32 shrink-0 pt-0.5">{labels[k]||k.replace(/_/g," ")}</span>
                {display}
              </div>
            );
          })}
        </div>
        <div className="flex gap-2 px-6 py-4 border-t border-slate-800 shrink-0">
          <button onClick={()=>{onClose();onEdit(record);}}
            className="flex-1 py-2 rounded-lg text-xs font-semibold transition-all hover:-translate-y-0.5"
            style={{background:`${category.accent}18`,color:category.accent,border:`1px solid ${category.accent}30`}}>
            ✏️ Edit
          </button>
          <button onClick={()=>{onClose();onDelete(record);}}
            className="flex-1 py-2 rounded-lg text-xs font-semibold text-red-400 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 transition-all">
            🗑 Delete
          </button>
          <button onClick={onClose} className="flex-1 py-2 rounded-lg text-xs font-medium text-slate-400 bg-slate-800/60 border border-slate-700/50 hover:text-white transition-all">Close</button>
        </div>
      </div>
    </div>
  );
}

// ─── IMPORT MODAL ─────────────────────────────────────────────────────────────

function ImportModal({ isOpen, onClose, onUploaded }) {
  const [step, setStep] = useState("choose");
  const [plan, setPlan] = useState([]);
  const [upState, setUpState] = useState({ done:0, total:0, catLabel:"", record:"", pct:0 });
  const [results, setResults] = useState([]);
  const fileRef = useRef();

  useEffect(() => { if (!isOpen) { setStep("choose"); setPlan([]); setResults([]); } }, [isOpen]);
  if (!isOpen) return null;

  // Detect category from sheet name first (most reliable)
  const detectCatFromSheetName = (sheetName) => {
    const l = sheetName.toLowerCase();
    if (l.includes("school"))    return "school";
    if (l.includes("college"))   return "college";
    if (l.includes("ngo"))       return "ngo";
    if (l.includes("volunteer")) return "volunteer";
    return null;
  };

  const handleFile = (e) => {
    const file = e.target.files[0]; if (!file) return; e.target.value = "";
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const wb = XLSX.read(ev.target.result, { type:"array" });
        const catMap = Object.fromEntries(CATEGORIES.map(c=>[c.id,c]));
        const detected = [];
        for (const sheetName of wb.SheetNames) {
          if (/readme|📋/i.test(sheetName)) continue;
          if (/mixed/i.test(sheetName)) continue; // skip mixed sheet
          const ws = wb.Sheets[sheetName];

          // Step 1: Try sheet name match first (most reliable)
          let forcedCat = detectCatFromSheetName(sheetName);
          if (forcedCat) {
            const rows = parseSheetRows(ws, ALL_FIELD_MAPS[forcedCat]);
            if (rows && rows.length > 0) {
              const c = catMap[forcedCat];
              const ex = detected.find(d=>d.catId===forcedCat);
              if (ex) { ex.rows=[...ex.rows,...rows]; ex.sheets.push(sheetName); }
              else detected.push({catId:forcedCat,catLabel:c.label,accent:c.accent,endpoint:c.endpoint,fields:c.fields,requiredFields:c.requiredFields||[],rows,sheets:[sheetName],checked:true});
              continue;
            }
          }

          // Step 2: Score-based detection for unnamed sheets
          // Score = count of unique signature fields found in parsed rows
          let bestCat=null, bestRows=null, bestScore=0;
          for (const cat of CATEGORIES) {
            const rows = parseSheetRows(ws, ALL_FIELD_MAPS[cat.id]);
            if (!rows || rows.length===0) continue;
            const sig = CAT_SIGNATURE[cat.id];
            // Check across first 3 rows for signature fields
            const sampleRows = rows.slice(0, 3);
            const score = sig.filter(f => sampleRows.some(r => r[f] !== undefined && r[f] !== "")).length;
            // Bonus: if every required field of this cat is present
            const reqScore = cat.requiredFields
              ? cat.requiredFields.filter(f => sampleRows.some(r => r[f] !== undefined && r[f] !== "")).length
              : 0;
            const totalScore = score * 3 + reqScore;
            if (totalScore > bestScore) { bestScore=totalScore; bestCat=cat.id; bestRows=rows; }
          }
          if (bestCat && bestRows?.length > 0 && bestScore >= 3) {
            const c = catMap[bestCat];
            const ex = detected.find(d=>d.catId===bestCat);
            if (ex) { ex.rows=[...ex.rows,...bestRows]; ex.sheets.push(sheetName); }
            else detected.push({catId:bestCat,catLabel:c.label,accent:c.accent,endpoint:c.endpoint,fields:c.fields,requiredFields:c.requiredFields||[],rows:bestRows,sheets:[sheetName],checked:true});
          }
        }
        if (!detected.length) { toast.error("No recognizable data found. Make sure sheet names contain: Schools, Colleges, NGOs, or Volunteers."); return; }
        setPlan(detected); setStep("preview");
      } catch (err) {
        console.error("File parse error:", err);
        toast.error("Failed to parse file. Check the format.");
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const totalSel = plan.filter(p=>p.checked).reduce((s,p)=>s+p.rows.length,0);

  const handleUpload = async () => {
    const active = plan.filter(p=>p.checked);
    const total  = active.reduce((s,p)=>s+p.rows.length,0);
    setUpState({ done:0, total, catLabel:"", record:"", pct:0 });
    setStep("uploading");
    const finals = [];
    let done = 0;
    for (const p of active) {
      let success=0, failed=0;
      for (const r of p.rows) {
        setUpState(prev=>({...prev, catLabel:p.catLabel, record:r.name||"…"}));
        // payload declared outside try so catch block can log it
        const payload = {};
        p.fields.forEach(f => {
          if (r[f]!==undefined && r[f]!=="") {
            if (["established_year","total_students","total_departments","experience_years"].includes(f)) { const n=parseInt(r[f]); if(!isNaN(n)) payload[f]=n; }
            else if (f==="skills") payload[f]=r[f].split(",").map(s=>s.trim()).filter(Boolean);
            else payload[f]=r[f];
          }
        });
        try {
          await axios.post(p.endpoint, payload);
          success++;
        } catch (err) {
          failed++;
          if (import.meta.env.DEV) {
            console.warn(`[Import] Failed: ${r.name} | ${p.catLabel} | ${err.response?.data?.message || err.message} | payload:`, payload);
          }
        }
        done++;
        setUpState(prev=>({...prev, done, pct:Math.round((done/total)*100)}));
      }
      finals.push({ catLabel:p.catLabel, accent:p.accent, success, failed });
    }
    setResults(finals); setStep("done");
    const ts=finals.reduce((s,r)=>s+r.success,0), tf=finals.reduce((s,r)=>s+r.failed,0);
    if (ts>0) { onUploaded(); toast.success(`${ts} records imported!`); }
    if (tf>0) toast.error(`${tf} records failed.`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={step!=="uploading"?onClose:undefined} />
      <div className="relative w-full max-w-xl bg-[#13131f] border border-slate-700/50 rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <h3 className="text-white font-bold text-sm flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="#6366f1" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/></svg>
            Import Data
          </h3>
          {step!=="uploading"&&<button onClick={onClose} className="text-slate-600 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors"><svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg></button>}
        </div>
        <div className="px-6 py-5">

          {step==="choose"&&(
            <div className="space-y-4">
              <p className="text-slate-400 text-sm">Upload Excel or CSV. All sheets auto-detected and imported in one shot.</p>
              <div className="grid grid-cols-2 gap-3">
                {[{l:"Excel / CSV",i:"📊",d:".xlsx, .xls, .csv"},{l:"Google Sheets",i:"📋",d:"Export as .xlsx first"}].map(opt=>(
                  <button key={opt.l} onClick={()=>fileRef.current?.click()}
                    className="flex flex-col items-center gap-2 p-5 rounded-xl border border-slate-700/50 hover:border-indigo-500/40 bg-slate-800/30 hover:bg-slate-800/60 transition-all text-center">
                    <span className="text-3xl">{opt.i}</span>
                    <span className="text-white text-sm font-semibold">{opt.l}</span>
                    <span className="text-slate-600 text-xs">{opt.d}</span>
                  </button>
                ))}
              </div>
              <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleFile} />
              <div className="bg-slate-800/30 rounded-xl p-3 border border-slate-700/30">
                <p className="text-slate-600 text-xs font-semibold uppercase tracking-wider mb-2">Auto-detects:</p>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map(c=><span key={c.id} className="text-xs px-2 py-0.5 rounded-full font-medium" style={{background:`${c.accent}15`,color:c.accent,border:`1px solid ${c.accent}25`}}>{c.label}</span>)}
                </div>
              </div>
            </div>
          )}

          {step==="preview"&&(
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-white font-semibold text-sm">Review Detected Data</p>
                <span className="text-slate-500 text-xs">{totalSel} records selected</span>
              </div>
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {plan.map((p,idx)=>(
                  <div key={p.catId} className="rounded-xl border overflow-hidden" style={{borderColor:p.checked?`${p.accent}30`:"#1e293b"}}>
                    <div className="flex items-center gap-3 px-4 py-3 cursor-pointer select-none"
                      style={{background:p.checked?`${p.accent}08`:"#0f172a"}}
                      onClick={()=>setPlan(prev=>prev.map((x,i)=>i===idx?{...x,checked:!x.checked}:x))}>
                      <div className="w-4 h-4 rounded flex items-center justify-center shrink-0" style={{background:p.checked?p.accent:"transparent",border:`1.5px solid ${p.checked?p.accent:"#475569"}`}}>
                        {p.checked&&<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="#fff" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-white text-sm font-semibold">{p.catLabel}</span>
                          <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{background:`${p.accent}20`,color:p.accent}}>{p.rows.length} records</span>
                        </div>
                        <p className="text-slate-700 text-xs truncate">from: {p.sheets.join(", ")}</p>
                      </div>
                    </div>
                    {p.checked&&(
                      <div className="border-t border-slate-800/30 divide-y divide-slate-800/20">
                        {p.rows.slice(0,3).map((r,ri)=>(
                          <div key={ri} className="px-4 py-1.5 flex gap-4 text-xs">
                            <span className="text-white font-medium w-36 truncate shrink-0">{r.name}</span>
                            <span className="text-slate-600 truncate">{r.email||r.phone||"—"}</span>
                          </div>
                        ))}
                        {p.rows.length>3&&<p className="px-4 py-1 text-xs text-slate-700">+{p.rows.length-3} more</p>}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <div className="flex gap-3 pt-1">
                <button onClick={()=>setStep("choose")} className="flex-1 py-2.5 rounded-lg text-sm font-medium text-slate-400 bg-slate-800/60 border border-slate-700/50 hover:text-white transition-all">Back</button>
                <button onClick={handleUpload} disabled={totalSel===0}
                  className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-white disabled:opacity-40 transition-all hover:-translate-y-0.5"
                  style={{background:"linear-gradient(135deg,#6366f1,#8b5cf6)",boxShadow:"0 4px 15px rgba(99,102,241,0.2)"}}>
                  Import {totalSel} Records
                </button>
              </div>
            </div>
          )}

          {step==="uploading"&&(
            <div className="py-1 space-y-5">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0">
                  <div className="w-6 h-6 border-2 border-indigo-500/30 border-t-indigo-400 rounded-full animate-spin" />
                </div>
                <div>
                  <p className="text-white font-bold text-sm">Importing data…</p>
                  <p className="text-slate-600 text-xs mt-0.5">Do not close this window</p>
                </div>
              </div>
              <div className="bg-slate-800/40 rounded-xl px-4 py-3 space-y-2 border border-slate-800">
                {[["Category", upState.catLabel, false], ["Record", upState.record, true], ["Progress", `${upState.done} / ${upState.total}`, false]].map(([l,v,trunc])=>(
                  <div key={l} className="flex items-center justify-between text-xs">
                    <span className="text-slate-600 font-semibold uppercase tracking-wide">{l}</span>
                    <span className={`text-white font-medium ${trunc?"truncate max-w-[200px]":""}`}>{v||"—"}</span>
                  </div>
                ))}
              </div>
              <div>
                <div className="flex justify-between text-xs mb-2">
                  <span className="text-slate-600">Upload progress</span>
                  <span className="text-white font-bold">{upState.pct}%</span>
                </div>
                <div className="bg-slate-800/60 rounded-full h-3 overflow-hidden border border-slate-700/30">
                  <div className="h-full rounded-full relative overflow-hidden transition-all duration-300"
                    style={{width:`${upState.pct}%`,background:"linear-gradient(90deg,#6366f1,#8b5cf6,#06b6d4)"}}>
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-pulse" />
                  </div>
                </div>
              </div>
              <div className="space-y-1">
                {plan.filter(p=>p.checked).map(p=>{
                  const isCur = p.catLabel===upState.catLabel;
                  return (
                    <div key={p.catId} className="flex items-center gap-3 px-3 py-2 rounded-lg transition-all"
                      style={{background:isCur?`${p.accent}10`:"transparent",border:`1px solid ${isCur?p.accent+"20":"transparent"}`}}>
                      <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{background:isCur?p.accent:"#374151"}} />
                      <span className="text-sm font-medium" style={{color:isCur?p.accent:"#4b5563"}}>{p.catLabel}</span>
                      <span className="text-xs ml-auto" style={{color:isCur?p.accent:"#374151"}}>{p.rows.length} records</span>
                      {isCur&&<div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" style={{color:p.accent}} />}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {step==="done"&&(
            <div className="py-1 space-y-4">
              <div className="text-center">
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-3">
                  <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" fill="none" viewBox="0 0 24 24" stroke="#10b981" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                </div>
                <p className="text-white font-bold text-lg">Import Complete!</p>
                <p className="text-slate-600 text-xs mt-1">{results.reduce((s,r)=>s+r.success,0)} records added successfully</p>
              </div>
              <div className="space-y-2">
                {results.map(r=>(
                  <div key={r.catLabel} className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-slate-800/40 border border-slate-700/30">
                    <span className="text-white text-sm font-medium">{r.catLabel}</span>
                    <div className="flex items-center gap-3 text-xs font-semibold">
                      {r.success>0&&<span className="text-emerald-400">✓ {r.success} added</span>}
                      {r.failed>0&&<span className="text-red-400">✗ {r.failed} failed</span>}
                    </div>
                  </div>
                ))}
              </div>
              <button onClick={onClose} className="w-full py-2.5 rounded-lg text-sm font-semibold text-white"
                style={{background:"linear-gradient(135deg,#6366f1,#8b5cf6)"}}>Done</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── FILTER DROPDOWN ─────────────────────────────────────────────────────────

function FilterDropdown({ filter, value, onChange, accent }) {
  const [open, setOpen] = useState(false);
  const ref = useRef();
  useEffect(() => {
    const fn = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);
  const active = !!value;
  return (
    <div className="relative" ref={ref}>
      <button onClick={()=>setOpen(o=>!o)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border"
        style={active ? {background:`${accent}18`,color:accent,border:`1px solid ${accent}30`} : {background:"rgba(30,41,59,0.6)",color:"#64748b",border:"1px solid rgba(51,65,85,0.5)"}}>
        {filter.label}
        {active&&<span className="opacity-75">: {value.length>12?value.slice(0,12)+"…":value}</span>}
        <svg xmlns="http://www.w3.org/2000/svg" width="9" height="9" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} className={`transition-transform duration-150 ${open?"rotate-180":""}`}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/></svg>
      </button>
      {open&&(
        <div className="absolute top-full left-0 mt-1.5 w-48 bg-[#1a1a2e] border border-slate-700/60 rounded-xl shadow-2xl z-40 overflow-hidden">
          <div className="p-1.5">
            <button onClick={()=>{onChange("");setOpen(false);}}
              className="w-full text-left px-3 py-1.5 rounded-lg text-xs transition-colors"
              style={!value?{background:"rgba(51,65,85,0.5)",color:"#e2e8f0",fontWeight:600}:{color:"#64748b"}}>
              All {filter.label}s
            </button>
            <div className="my-1 border-t border-slate-800" />
            <div className="max-h-52 overflow-y-auto">
              {filter.options.map(opt=>(
                <button key={opt} onClick={()=>{onChange(opt);setOpen(false);}}
                  className="w-full text-left px-3 py-1.5 rounded-lg text-xs transition-all"
                  style={value===opt?{background:`${accent}15`,color:accent,fontWeight:600}:{color:"#94a3b8"}}>
                  {opt}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState("school");
  const [data, setData]           = useState([]);
  const [total, setTotal]         = useState(0);
  const [pages, setPages]         = useState(1);
  const [loading, setLoading]     = useState(false);
  const [page, setPage]           = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch]       = useState("");
  const [sortField, setSortField] = useState("createdAt");
  const [sortDir, setSortDir]     = useState("desc");
  const [filters, setFilters]     = useState({});
  const [dateFrom, setDateFrom]   = useState("");
  const [dateTo, setDateTo]       = useState("");
  const [editRecord, setEditRecord]     = useState(null);
  const [viewRecord, setViewRecord]     = useState(null);
  const [deleteRecord, setDeleteRecord] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showImport, setShowImport]   = useState(false);
  const [hoveredRow, setHoveredRow]   = useState(null);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const searchTimer = useRef(null);

  const category = useMemo(() => CATEGORIES.find(c=>c.id===activeTab), [activeTab]);

  const handleSearchInput = (val) => {
    setSearchInput(val);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => { setSearch(val); setPage(1); }, 600);
  };

  const fetchData = useCallback(async () => {
    const cat = CATEGORIES.find(c=>c.id===activeTab); if (!cat) return;
    setLoading(true);
    try {
      const p = new URLSearchParams({ page, limit:12, sortField, sortDir });
      if (search)   p.set("search", search);
      if (dateFrom) p.set("dateFrom", dateFrom);
      if (dateTo)   p.set("dateTo", dateTo);
      Object.entries(filters).forEach(([k,v]) => { if (v) p.set(k,v); });
      const res = await axios.get(`${cat.endpoint}?${p}`);
      const payload = res.data?.data ?? res.data ?? {};
      setData(payload[cat.dataKey]||[]);
      setTotal(payload.total||0);
      setPages(payload.pages||1);
    } catch (err) {
      toast.error(err.response?.data?.message||"Failed to load.");
      setData([]); setTotal(0); setPages(1);
    } finally { setLoading(false); }
  }, [activeTab, page, search, sortField, sortDir, dateFrom, dateTo, filters]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    setData([]); setTotal(0); setPages(1); setPage(1);
    setSearch(""); setSearchInput(""); setSortField("createdAt"); setSortDir("desc");
    setFilters({}); setDateFrom(""); setDateTo(""); setSelectedIds(new Set());
  }, [activeTab]);

  // Clear selection on page/filter change
  useEffect(() => { setSelectedIds(new Set()); }, [page, search, filters, dateFrom, dateTo]);

  // Selection helpers
  const allPageIds   = data.map(r => r._id);
  const allSelected  = allPageIds.length > 0 && allPageIds.every(id => selectedIds.has(id));
  const someSelected = allPageIds.some(id => selectedIds.has(id)) && !allSelected;

  const toggleAll = () => {
    if (allSelected) {
      setSelectedIds(prev => { const n = new Set(prev); allPageIds.forEach(id => n.delete(id)); return n; });
    } else {
      setSelectedIds(prev => { const n = new Set(prev); allPageIds.forEach(id => n.add(id)); return n; });
    }
  };

  const toggleRow = (id) => {
    setSelectedIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    const cat = CATEGORIES.find(c => c.id === activeTab);
    const ids = [...selectedIds];
    let success = 0;
    for (const id of ids) {
      try { await axios.delete(`${cat.endpoint}/${id}`); success++; } catch {}
    }
    toast.success(`${success} record${success !== 1 ? "s" : ""} deleted.`);
    setSelectedIds(new Set());
    fetchData();
  };

  const handleSort = (field) => {
    if (sortField===field) setSortDir(d=>d==="asc"?"desc":"asc");
    else { setSortField(field); setSortDir("asc"); }
    setPage(1);
  };

  const handleDelete = async () => {
    if (!deleteRecord) return;
    const cat = CATEGORIES.find(c=>c.id===activeTab);
    setDeleteLoading(true);
    try {
      await axios.delete(`${cat.endpoint}/${deleteRecord._id}`);
      toast.success("Record deleted."); setDeleteRecord(null); fetchData();
    } catch (err) { toast.error(err.response?.data?.message||"Delete failed."); }
    finally { setDeleteLoading(false); }
  };

  const activeFiltersCount = Object.values(filters).filter(Boolean).length + (dateFrom?1:0) + (dateTo?1:0);

  const getCellDisplay = (row, col) => {
    const v = row[col.key];
    if (col.key==="_id") return <span className="font-mono text-xs text-slate-700 select-all cursor-text">{shortId(v)}</span>;
    if (col.isStatus)    return <StatusBadge value={v} />;
    if (col.badge)       return <TypeBadge value={v} accent={category.accent} />;
    if (col.isDate)      return <span className="text-slate-500 text-xs whitespace-nowrap">{fmtDate(v)}</span>;
    if (!v && v!==0)     return <span className="text-slate-800">—</span>;
    if (col.bold)        return <span className="text-white font-medium text-sm"><HighlightText text={String(v)} query={search} /></span>;
    return <span className="text-slate-400 text-sm"><HighlightText text={String(v)} query={search} /></span>;
  };

  const SortIcon = ({ field }) => {
    if (sortField!==field) return <svg className="opacity-20" xmlns="http://www.w3.org/2000/svg" width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4"/></svg>;
    return sortDir==="asc"
      ? <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" fill="none" viewBox="0 0 24 24" stroke={category.accent} strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7"/></svg>
      : <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" fill="none" viewBox="0 0 24 24" stroke={category.accent} strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/></svg>;
  };

  return (
    <div className="min-h-screen bg-[#0c0c14]">
      <Navbar />
      <EditModal   isOpen={!!editRecord}   onClose={()=>setEditRecord(null)}   record={editRecord}   category={category} onSaved={fetchData} />
      <ViewModal   isOpen={!!viewRecord}   onClose={()=>setViewRecord(null)}   record={viewRecord}   category={category} onEdit={r=>setEditRecord(r)} onDelete={r=>setDeleteRecord(r)} />
      <ImportModal isOpen={showImport}     onClose={()=>setShowImport(false)}  onUploaded={fetchData} />
      <ConfirmModal isOpen={!!deleteRecord} onCancel={()=>setDeleteRecord(null)} onConfirm={handleDelete} loading={deleteLoading}
        title="Delete Record?" message={`Permanently delete "${deleteRecord?.name}"? This cannot be undone.`} />

      <div className="max-w-[1500px] mx-auto px-4 sm:px-6 pt-7 pb-16">

        {/* Header */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <div className="w-1 h-5 rounded-full" style={{background:`linear-gradient(180deg,${category.accent},${category.accent}44)`}} />
              <span className="text-slate-600 text-xs font-semibold uppercase tracking-widest">Admin · Organisation Management</span>
            </div>
            <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          </div>
          <button onClick={()=>setShowImport(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:-translate-y-0.5"
            style={{background:"linear-gradient(135deg,#6366f1,#8b5cf6)",boxShadow:"0 4px 20px rgba(99,102,241,0.22)"}}>
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/></svg>
            Import Data
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-5 bg-[#13131f] border border-slate-800 rounded-2xl p-1.5 overflow-x-auto">
          {CATEGORIES.map(cat => {
            const a = activeTab===cat.id;
            return (
              <button key={cat.id} onClick={()=>setActiveTab(cat.id)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap flex-1 justify-center"
                style={{
                  background: a?`${cat.accent}18`:"transparent",
                  color: a?cat.accent:"#475569",
                  border: `1px solid ${a?cat.accent+"30":"transparent"}`,
                  transition: "all 0.15s ease",
                }}>
                <span style={{color:a?cat.accent:"#334155",flexShrink:0}}>{cat.icon}</span>
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Filters */}
        <div className="bg-[#13131f] border border-slate-800 rounded-2xl p-3.5 mb-4">
          <div className="flex flex-wrap gap-2.5 items-center">
            {/* Search */}
            <div className="relative min-w-[200px] max-w-xs flex-1">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
              </svg>
              <input type="text" placeholder={`Search ${category.label.toLowerCase()}…`}
                value={searchInput} onChange={e=>handleSearchInput(e.target.value)}
                className="w-full bg-slate-800/60 border border-slate-700/50 rounded-lg pl-8 pr-7 py-1.5 text-white text-xs placeholder-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500/50 transition-all" />
              {searchInput&&(
                <button onClick={()=>{setSearchInput("");setSearch("");setPage(1);}}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-300 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
                </button>
              )}
            </div>

            {/* Category filters */}
            {category.filters.map(f=>(
              <FilterDropdown key={f.key} filter={f} value={filters[f.key]||""}
                onChange={v=>{setFilters(p=>({...p,[f.key]:v}));setPage(1);}} accent={category.accent} />
            ))}

            {/* Date */}
            <div className="flex items-center gap-1.5">
              <span className="text-slate-700 text-xs font-semibold">From</span>
              <input type="date" value={dateFrom} onChange={e=>{setDateFrom(e.target.value);setPage(1);}}
                className="bg-slate-800/60 border border-slate-700/50 rounded-lg px-2 py-1.5 text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/30 [color-scheme:dark]" />
              <span className="text-slate-700 text-xs font-semibold">To</span>
              <input type="date" value={dateTo} onChange={e=>{setDateTo(e.target.value);setPage(1);}}
                className="bg-slate-800/60 border border-slate-700/50 rounded-lg px-2 py-1.5 text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/30 [color-scheme:dark]" />
            </div>

            {(activeFiltersCount>0||search)&&(
              <button onClick={()=>{setFilters({});setDateFrom("");setDateTo("");setSearch("");setSearchInput("");setPage(1);}}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-red-400 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 transition-all">
                <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
                Clear {activeFiltersCount+(search?1:0)}
              </button>
            )}
            <div className="ml-auto text-slate-700 text-xs font-semibold">
              {loading?<span className="animate-pulse text-slate-600">Loading…</span>:`${total.toLocaleString()} record${total!==1?"s":""}`}
            </div>
          </div>

          {/* Search status */}
          {searchInput && searchInput!==search && (
            <div className="flex items-center gap-2 mt-2">
              <div className="w-2 h-2 rounded-full bg-yellow-400/70 animate-pulse" />
              <span className="text-xs text-slate-600">Searching in 600ms…</span>
            </div>
          )}
          {search && search===searchInput && data.length>=0 && (
            <div className="flex items-center gap-2 mt-2">
              <div className="w-2 h-2 rounded-full animate-pulse" style={{background:category.accent}} />
              <span className="text-xs" style={{color:category.accent}}>
                Results for "<strong>{search}</strong>" — {total} found
              </span>
            </div>
          )}
        </div>

        {/* Bulk action bar - shown when rows selected */}
        {selectedIds.size > 0 && (
          <div className="flex items-center justify-between px-4 py-2.5 mb-3 rounded-xl border"
            style={{background:`${category.accent}0c`,border:`1px solid ${category.accent}25`}}>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full animate-pulse" style={{background:category.accent}} />
              <span className="text-sm font-semibold" style={{color:category.accent}}>
                {selectedIds.size} record{selectedIds.size!==1?"s":""} selected
              </span>
              <button onClick={()=>setSelectedIds(new Set())}
                className="text-xs text-slate-500 hover:text-slate-300 transition-colors underline underline-offset-2">
                Clear
              </button>
            </div>
            <button onClick={handleBulkDelete}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-red-400 bg-red-500/10 border border-red-500/25 hover:bg-red-500/20 transition-all">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
              Delete {selectedIds.size} selected
            </button>
          </div>
        )}

        {/* Table */}
        <div className="bg-[#13131f] border border-slate-800 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-max">
              <thead>
                <tr className="border-b border-slate-800">
                  {/* Select-all checkbox */}
                  <th className="pl-4 pr-2 py-3 w-10">
                    <button onClick={toggleAll}
                      className="w-4 h-4 rounded flex items-center justify-center transition-all border"
                      style={{
                        background: allSelected ? category.accent : someSelected ? `${category.accent}40` : "transparent",
                        border: `1.5px solid ${allSelected || someSelected ? category.accent : "#334155"}`,
                      }}>
                      {allSelected && <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="#fff" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>}
                      {someSelected && !allSelected && <div className="w-2 h-0.5 bg-white rounded" />}
                    </button>
                  </th>
                  {category.columns.map(col=>(
                    <th key={col.key}
                      className={`px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider whitespace-nowrap ${col.sortable?"cursor-pointer hover:text-slate-400 select-none":""} transition-colors`}
                      style={{minWidth:col.w}} onClick={()=>col.sortable&&handleSort(col.key)}>
                      <div className="flex items-center gap-1.5">{col.label}{col.sortable&&<SortIcon field={col.key} />}</div>
                    </th>
                  ))}
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider w-24">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({length:8}).map((_,i)=>(
                    <tr key={i} className="border-b border-slate-800/40">
                      <td className="pl-4 pr-2 py-3.5 w-10"><div className="w-4 h-4 bg-slate-800/80 rounded animate-pulse" /></td>
                      {category.columns.map(col=>(
                        <td key={col.key} className="px-4 py-3.5">
                          <div className="h-3 bg-slate-800/80 rounded-full animate-pulse" style={{width:`${40+Math.random()*45}%`}} />
                        </td>
                      ))}
                      <td className="px-4 py-3.5"><div className="h-3 w-14 bg-slate-800/80 rounded-full animate-pulse ml-auto" /></td>
                    </tr>
                  ))
                ) : data.length===0 ? (
                  <tr>
                    <td colSpan={category.columns.length+2} className="text-center py-20">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{background:`${category.accent}10`,border:`1px solid ${category.accent}20`}}>
                          <span style={{color:category.accent}}>{category.icon}</span>
                        </div>
                        <p className="text-slate-600 text-sm">No {category.label.toLowerCase()} found</p>
                        {(search||activeFiltersCount>0)&&<p className="text-slate-700 text-xs">Adjust your search or filters</p>}
                      </div>
                    </td>
                  </tr>
                ) : data.map(row=>(
                  <tr key={row._id}
                    className="border-b border-slate-800/30 cursor-pointer group transition-colors"
                    style={{
                      background: selectedIds.has(row._id)
                        ? `${category.accent}10`
                        : hoveredRow===row._id ? `${category.accent}07` : "transparent"
                    }}
                    onMouseEnter={()=>setHoveredRow(row._id)}
                    onMouseLeave={()=>setHoveredRow(null)}
                    onClick={()=>setViewRecord(row)}>
                    {/* Row checkbox */}
                    <td className="pl-4 pr-2 py-3 w-10" onClick={e=>{e.stopPropagation();toggleRow(row._id);}}>
                      <div className="w-4 h-4 rounded flex items-center justify-center transition-all"
                        style={{
                          background: selectedIds.has(row._id) ? category.accent : "transparent",
                          border: `1.5px solid ${selectedIds.has(row._id) ? category.accent : "#1e293b"}`,
                        }}>
                        {selectedIds.has(row._id) && <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="#fff" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>}
                      </div>
                    </td>
                    {category.columns.map(col=>(
                      <td key={col.key} className="px-4 py-3 max-w-[220px]">
                        <div className="truncate">{getCellDisplay(row, col)}</div>
                      </td>
                    ))}
                    <td className="px-4 py-3" onClick={e=>e.stopPropagation()}>
                      <div className={`flex items-center justify-end gap-1 transition-opacity duration-100 ${hoveredRow===row._id?"opacity-100":"opacity-0"}`}>
                        <button onClick={()=>setViewRecord(row)} title="View" className="p-1.5 rounded-lg text-slate-600 hover:text-white hover:bg-slate-700/50 transition-all">
                          <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                        </button>
                        <button onClick={()=>setEditRecord(row)} title="Edit" className="p-1.5 rounded-lg hover:bg-indigo-500/15 transition-all" style={{color:category.accent}}>
                          <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                        </button>
                        <button onClick={()=>setDeleteRecord(row)} title="Delete" className="p-1.5 rounded-lg text-red-600 hover:text-red-400 hover:bg-red-500/15 transition-all">
                          <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {!loading && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-slate-800 flex-wrap gap-3">
              <span className="text-slate-700 text-xs">
                {data.length>0 ? `Showing ${((page-1)*12)+1}–${Math.min(page*12,total)} of ${total.toLocaleString()}` : `0 records`}
              </span>
              {pages>1&&(
                <div className="flex items-center gap-1">
                  <button onClick={()=>setPage(1)} disabled={page===1} className="px-2 py-1.5 rounded-lg text-xs text-slate-600 bg-slate-800/60 border border-slate-800 hover:text-white disabled:opacity-25 transition-all">«</button>
                  <button onClick={()=>setPage(p=>p-1)} disabled={page===1} className="px-3 py-1.5 rounded-lg text-xs text-slate-500 bg-slate-800/60 border border-slate-800 hover:text-white disabled:opacity-25 transition-all">‹</button>
                  {Array.from({length:Math.min(5,pages)},(_,i)=>{
                    let p;
                    if(pages<=5) p=i+1;
                    else if(page<=3) p=i+1;
                    else if(page>=pages-2) p=pages-4+i;
                    else p=page-2+i;
                    return (
                      <button key={p} onClick={()=>setPage(p)}
                        className="w-7 h-7 rounded-lg text-xs font-semibold transition-all"
                        style={p===page?{background:`linear-gradient(135deg,${category.accent},${category.accent}cc)`,color:"#fff"}:{background:"#1a1a2e",color:"#4b5563",border:"1px solid #1e293b"}}>
                        {p}
                      </button>
                    );
                  })}
                  <button onClick={()=>setPage(p=>p+1)} disabled={page===pages} className="px-3 py-1.5 rounded-lg text-xs text-slate-500 bg-slate-800/60 border border-slate-800 hover:text-white disabled:opacity-25 transition-all">›</button>
                  <button onClick={()=>setPage(pages)} disabled={page===pages} className="px-2 py-1.5 rounded-lg text-xs text-slate-600 bg-slate-800/60 border border-slate-800 hover:text-white disabled:opacity-25 transition-all">»</button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
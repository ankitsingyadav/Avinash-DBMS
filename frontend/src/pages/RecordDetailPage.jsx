// ─── pages/RecordDetailPage.jsx ──────────────────────────────────────────────
import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import axios from "../utils/axios.js";
import toast from "react-hot-toast";
import Navbar from "../components/Navbar";
import { CATEGORIES } from "../admin/constants.js";
import { CATEGORY_ICONS } from "../admin/icons.jsx";
import { fmtDate } from "../admin/helpers.js";
import { StatusBadge, DataStatusBadge, TypeBadge } from "../admin/components/ui.jsx";
import EditModal from "../admin/components/EditModal.jsx";
import AddInteractionModal from "../admin/components/Addinteractionmodal.jsx";
import ConfirmModal from "../components/ConfirmModal.jsx";
import useAuthStore, { roleHelpers } from "../context/authStore.js";

const ALL_CATS = CATEGORIES.map((c) => ({ ...c, icon: CATEGORY_ICONS[c.id] }));

const MODE_CONFIG = {
  Email:    { icon: "✉️",  color: "#6366f1" },
  Phone:    { icon: "📞",  color: "#10b981" },
  WhatsApp: { icon: "💬",  color: "#22c55e" },
  Visit:    { icon: "🏢",  color: "#f59e0b" },
};

const LABEL_MAP = {
  centreName:       "Centre Name",
  centreType:       "Centre Type",
  name:             "Name",
  phone:            "Phone",
  email:            "Email",
  website:          "Website",
  address:          "Address",
  city:             "City",
  district:         "District",
  state:            "State",
  pincode:          "Pincode",
  onboardedBy:      "Onboarded By",
  ninAin:           "NIN / AIN",
  area_of_interest: "Area of Interest",
  volunteer_type:   "Volunteer Type",
  remarks:          "Remarks",
  status:           "Status",
  follow_up_date:   "Follow-up Date",
  createdAt:        "Registered On",
  updatedAt:        "Last Updated",
};

// ── Info field renderers ──────────────────────────────────────────────────────
function InfoRow({ label, value, accent, children }) {
  if (!children && (!value && value !== 0)) return null;
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{label}</span>
      <div className="text-slate-800 text-sm font-medium">
        {children || value}
      </div>
    </div>
  );
}

function ContactCard({ contact, accent, index }) {
  return (
    <div
      className="rounded-xl border p-3 space-y-2"
      style={{ background: `${accent}06`, borderColor: `${accent}20` }}
    >
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Contact #{index + 1}</span>
        {contact.designation && (
          <span
            className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
            style={{ background: `${accent}15`, color: accent, border: `1px solid ${accent}25` }}
          >
            {contact.designation}
          </span>
        )}
      </div>
      <p className="text-slate-900 text-sm font-bold">{contact.name || "—"}</p>
      <div className="space-y-1">
        {contact.contactNumber && (
          <p className="text-xs text-slate-500 flex items-center gap-1.5">
            <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.387a12.035 12.035 0 01-7.143-7.143c-.155-.441.011-.928.387-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z"/>
            </svg>
            {contact.contactNumber}
          </p>
        )}
        {contact.email && (
          <p className="text-xs text-slate-500 flex items-center gap-1.5">
            <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"/>
            </svg>
            {contact.email}
          </p>
        )}
      </div>
    </div>
  );
}

// ── Interaction timeline card ─────────────────────────────────────────────────
function InteractionCard({ entry, index, total, accent }) {
  const [expanded, setExpanded] = useState(index === 0);
  const isLatest = index === 0;
  const mode = MODE_CONFIG[entry.interactionMode] || { icon: "📋", color: accent };

  const hasUpcoming = entry.nextInteractionDate && (() => {
    const now = Date.now();
    const d = new Date(entry.nextInteractionDate).getTime();
    return d >= now - 86400000 && d <= now + 48 * 60 * 60 * 1000;
  })();

  return (
    <div className="relative pl-8">
      {/* Timeline line */}
      {index < total - 1 && (
        <div
          className="absolute left-[13px] top-8 bottom-0 w-px"
          style={{ background: `linear-gradient(to bottom, ${accent}50, transparent)` }}
        />
      )}

      {/* Timeline dot */}
      <div
        className="absolute left-0 top-3.5 w-7 h-7 rounded-full flex items-center justify-center text-sm border-2 shrink-0 cursor-pointer"
        style={{
          background:  isLatest ? `${accent}20` : "#f8fafc",
          borderColor: isLatest ? accent        : "#e2e8f0",
        }}
        onClick={() => setExpanded((e) => !e)}
      >
        <span>{mode.icon}</span>
      </div>

      <div
        className="mb-4 rounded-xl border overflow-hidden transition-all"
        style={{
          background:  isLatest ? `${accent}05` : "#fff",
          borderColor: isLatest ? `${accent}25` : "#e2e8f0",
        }}
      >
        {/* Card header — always visible */}
        <div
          className="flex items-center justify-between px-4 py-3 cursor-pointer select-none"
          style={{ borderBottom: expanded ? `1px solid ${isLatest ? accent + "15" : "#f1f5f9"}` : "none" }}
          onClick={() => setExpanded((e) => !e)}
        >
          <div className="flex items-center gap-2 flex-wrap">
            {isLatest && (
              <span
                className="text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-widest"
                style={{ background: `${accent}20`, color: accent }}
              >
                Latest
              </span>
            )}
            {hasUpcoming && (
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-widest bg-amber-100 text-amber-700">
                🔔 Upcoming
              </span>
            )}
            <span className="text-slate-800 text-xs font-semibold">
              {fmtDate(entry.interactionDate)}
            </span>
            <span className="text-slate-500 text-xs">·</span>
            <span className="text-xs font-medium text-slate-600">{entry.interactionBy}</span>
          </div>
          <div className="flex items-center gap-2">
            <span
              className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
              style={{ background: `${mode.color}15`, color: mode.color }}
            >
              {entry.interactionMode}
            </span>
            <svg
              xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="none"
              viewBox="0 0 24 24" stroke="#94a3b8" strokeWidth={2.5}
              className={`transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/>
            </svg>
          </div>
        </div>

        {/* Card body — collapsible */}
        {expanded && (
          <div className="px-4 py-3 space-y-3">
            <div className="grid grid-cols-2 gap-3 text-xs">
              {entry.interactedWith && (
                <div>
                  <p className="text-slate-400 text-[10px] uppercase tracking-wide mb-0.5">Interacted With</p>
                  <p className="text-slate-800 font-semibold">{entry.interactedWith}</p>
                </div>
              )}
              {entry.ninAin && (
                <div>
                  <p className="text-slate-400 text-[10px] uppercase tracking-wide mb-0.5">AIN / NIN</p>
                  <p className="text-slate-800 font-mono font-semibold">{entry.ninAin}</p>
                </div>
              )}
            </div>

            {entry.notes && (
              <div className="bg-slate-50 rounded-lg px-3 py-2 border border-slate-100">
                <p className="text-slate-400 text-[10px] uppercase tracking-wide mb-1">Notes</p>
                <p className="text-slate-700 text-xs leading-relaxed">{entry.notes}</p>
              </div>
            )}

            {/* Next interaction planned */}
            {(entry.nextInteractionDate || entry.interactionMode) && (
              <div
                className="rounded-lg px-3 py-2 border"
                style={{ background: `${accent}06`, borderColor: `${accent}20` }}
              >
                <p
                  className="text-[10px] font-bold uppercase tracking-widest mb-1.5"
                  style={{ color: accent }}
                >
                  Next Interaction Planned
                </p>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <p className="text-slate-400 text-[10px] uppercase tracking-wide mb-0.5">Planned Date</p>
                    {entry.nextInteractionDate ? (
                      <p className="font-semibold" style={{ color: accent }}>{fmtDate(entry.nextInteractionDate)}</p>
                    ) : (
                      <p className="text-slate-400 italic">Not set</p>
                    )}
                  </div>
                  {entry.interactionMode && (
                    <div>
                      <p className="text-slate-400 text-[10px] uppercase tracking-wide mb-0.5">Mode</p>
                      <p className="text-slate-700 font-semibold flex items-center gap-1">
                        <span>{mode.icon}</span> {entry.interactionMode}
                      </p>
                    </div>
                  )}
                </div>

                {/* ── nextNotes — ADDED ── */}
                {entry.nextNotes && (
                  <div className="mt-2 pt-2 border-t border-slate-200/60">
                    <p className="text-slate-400 text-[10px] uppercase tracking-wide mb-1">Notes</p>
                    <p className="text-slate-700 text-xs leading-relaxed">{entry.nextNotes}</p>
                  </div>
                )}
              </div>
            )}

            {entry.createdAt && (
              <p className="text-[10px] text-slate-400">
                Recorded: {new Date(entry.createdAt).toLocaleString("en-IN", {
                  day: "2-digit", month: "short", year: "numeric",
                  hour: "2-digit", minute: "2-digit",
                })}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function RecordDetailPage() {
  const { tab, id } = useParams();
  const navigate    = useNavigate();
  const [searchParams] = useSearchParams();

  const authUser  = useAuthStore((s) => s.user);
  const canEdit   = roleHelpers.canDo(authUser, "edit");
  const canDelete = roleHelpers.canDo(authUser, "delete");

  const category = ALL_CATS.find((c) => c.id === tab) ?? null;

  const [record,          setRecord]          = useState(null);
  const [interactions,    setInteractions]    = useState([]);
  const [loadingRecord,   setLoadingRecord]   = useState(true);
  const [loadingHistory,  setLoadingHistory]  = useState(false);
  const [error,           setError]           = useState(null);

  const [showEdit,        setShowEdit]        = useState(false);
  const [showAddInt,      setShowAddInt]      = useState(false);
  const [showDelete,      setShowDelete]      = useState(false);
  const [deleteLoading,   setDeleteLoading]   = useState(false);

  // ── Fetch record ────────────────────────────────────────────────────────────
  const fetchRecord = useCallback(async () => {
    if (!category) return;
    setLoadingRecord(true);
    setError(null);
    try {
      const res = await axios.get(`${category.endpoint}/${id}`);
      const data = res.data?.data ?? res.data ?? {};
      const rec = data[category.id === "volunteer" ? "volunteer" : "organisation"] ?? data;
      setRecord(rec);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load record.");
    } finally {
      setLoadingRecord(false);
    }
  }, [category, id]);

  // ── Fetch interaction history (organisations only) ──────────────────────────
  const fetchInteractions = useCallback(async () => {
    if (tab !== "organisation") return;
    setLoadingHistory(true);
    try {
      const res = await axios.get(`/organisations/${id}/interactions`);
      const data = res.data?.data ?? res.data ?? {};
      setInteractions(data.interactions || []);
    } catch {
      setInteractions([]);
    } finally {
      setLoadingHistory(false);
    }
  }, [tab, id]);

  useEffect(() => { fetchRecord(); }, [fetchRecord]);
  useEffect(() => { fetchInteractions(); }, [fetchInteractions]);

  // ── Delete handler ──────────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!category || !record) return;
    setDeleteLoading(true);
    try {
      await axios.delete(`${category.endpoint}/${record._id}`);
      toast.success("Record deleted successfully.");
      navigate(`/admin?tab=${tab}`, { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete record.");
    } finally {
      setDeleteLoading(false); setShowDelete(false);
    }
  };

  const backUrl = `/admin?tab=${tab}${searchParams.get("page") ? `&page=${searchParams.get("page")}` : ""}`;

  // ── Loading / error / not found states ─────────────────────────────────────
  if (!category) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <div className="flex items-center justify-center h-[80vh]">
          <p className="text-slate-500">Invalid category.</p>
        </div>
      </div>
    );
  }

  if (loadingRecord) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 pt-7 pb-16">
          <div className="h-4 w-28 bg-slate-200 rounded-full animate-pulse mb-6" />
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-5">
            <div className="space-y-4">
              {[120, 80, 160, 100].map((w, i) => (
                <div key={i} className="h-4 bg-slate-200 rounded-full animate-pulse" style={{ width: `${w}px` }} />
              ))}
            </div>
            <div className="h-64 bg-slate-200 rounded-2xl animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !record) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <div className="flex flex-col items-center justify-center h-[80vh] gap-3">
          <p className="text-red-500 text-sm">{error || "Record not found."}</p>
          <button onClick={() => navigate(backUrl)} className="text-xs text-blue-600 underline">← Go back</button>
        </div>
      </div>
    );
  }

  const accent = category.accent;
  const title  = record.centreName || record.name || "—";
  const isOrg  = tab === "organisation";

  const allInteractions = interactions.length > 0 ? interactions : (record.interactions || []);

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      {/* Modals */}
      <EditModal
        isOpen={showEdit} onClose={() => setShowEdit(false)}
        record={record} category={category}
        onSaved={() => { fetchRecord(); fetchInteractions(); }}
      />
      <AddInteractionModal
        isOpen={showAddInt} onClose={() => setShowAddInt(false)}
        record={record} category={category}
        onSaved={() => { fetchRecord(); fetchInteractions(); }}
      />
      <ConfirmModal
        isOpen={showDelete} onCancel={() => setShowDelete(false)}
        onConfirm={handleDelete} loading={deleteLoading}
        title="Delete Record?"
        message={`Permanently delete "${title}"? This action cannot be undone.`}
      />

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 pt-6 pb-16">

        {/* ── Top bar ── */}
        <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
          <button
            onClick={() => navigate(backUrl)}
            className="flex items-center gap-1.5 text-slate-500 hover:text-slate-800 text-sm font-medium transition-colors group"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
              className="group-hover:-translate-x-0.5 transition-transform">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/>
            </svg>
            Back to {category.label}
          </button>

          <div className="flex items-center gap-2">
            {isOrg && (
              <button
                onClick={() => setShowAddInt(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-white transition-all hover:-translate-y-0.5 shadow-sm"
                style={{ background: `linear-gradient(135deg,${accent},${accent}cc)`, boxShadow: `0 4px 12px ${accent}30` }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15"/>
                </svg>
                Add Interaction
              </button>
            )}
            {canEdit && (
              <button
                onClick={() => setShowEdit(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all hover:-translate-y-0.5"
                style={{ background: `${accent}10`, color: accent, borderColor: `${accent}30` }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                </svg>
                Edit
              </button>
            )}
            {canDelete && (
              <button
                onClick={() => setShowDelete(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-red-500 bg-red-50 border border-red-200 hover:bg-red-100 transition-all hover:-translate-y-0.5"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                </svg>
                Delete
              </button>
            )}
          </div>
        </div>

        {/* ── Page hero ── */}
        <div
          className="rounded-2xl border p-5 mb-5 flex items-start gap-4 flex-wrap"
          style={{ background: `linear-gradient(135deg,${accent}08,${accent}03)`, borderColor: `${accent}20` }}
        >
          <div
            className="w-12 h-12 rounded-2xl shrink-0 flex items-center justify-center text-lg"
            style={{ background: `${accent}20`, border: `2px solid ${accent}35` }}
          >
            <span style={{ color: accent }}>{category.icon}</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h1 className="text-xl font-bold text-slate-900 truncate">{title}</h1>
              {record.centreType && <TypeBadge value={record.centreType} accent={accent} />}
              {record.status && (isOrg ? <DataStatusBadge value={record.status} /> : <StatusBadge value={record.status} />)}
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              {[record.city, record.district, record.state, record.pincode].filter(Boolean).map((v, i) => (
                <span
                  key={i}
                  className="text-xs px-2 py-0.5 rounded-full font-medium"
                  style={{ background: `${accent}12`, color: accent, border: `1px solid ${accent}25` }}
                >
                  {v}
                </span>
              ))}
            </div>
          </div>
          {isOrg && (
            <div
              className="flex flex-col items-center px-4 py-2 rounded-xl border"
              style={{ background: `${accent}10`, borderColor: `${accent}25` }}
            >
              <span className="text-2xl font-black" style={{ color: accent }}>{allInteractions.length}</span>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Interactions</span>
            </div>
          )}
        </div>

        {/* ── Two-column layout ── */}
        <div className={`grid gap-5 ${isOrg ? "grid-cols-1 lg:grid-cols-[1fr_420px]" : "grid-cols-1 max-w-2xl"}`}>

          {/* LEFT — Record information */}
          <div className="space-y-4">

            {/* Basic Info */}
            <section className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ background: accent }} />
                Basic Information
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {isOrg ? (
                  <>
                    <InfoRow label="Centre Name" value={record.centreName} />
                    <InfoRow label="Centre Type"><TypeBadge value={record.centreType} accent={accent} /></InfoRow>
                    {record.website && record.website !== "https://example.com" && (
                      <InfoRow label="Website">
                        <a href={record.website} target="_blank" rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-700 text-sm underline underline-offset-2 transition-colors">
                          {record.website}
                        </a>
                      </InfoRow>
                    )}
                    <InfoRow label="Onboarded By" value={record.onboardedBy} />
                    {record.ninAin && <InfoRow label="NIN / AIN"><span className="font-mono text-sm">{record.ninAin}</span></InfoRow>}
                    <InfoRow label="Data Status"><DataStatusBadge value={record.status} /></InfoRow>
                    <InfoRow label="Registered On" value={fmtDate(record.createdAt)} />
                  </>
                ) : (
                  <>
                    <InfoRow label="Name" value={record.name} />
                    <InfoRow label="Phone" value={record.phone} />
                    <InfoRow label="Email" value={record.email} />
                    {record.website && record.website !== "NA" && (
                      <InfoRow label="Website">
                        <a href={record.website} target="_blank" rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-700 text-sm underline underline-offset-2">
                          {record.website}
                        </a>
                      </InfoRow>
                    )}
                    <InfoRow label="Area of Interest"><TypeBadge value={record.area_of_interest} accent={accent} /></InfoRow>
                    <InfoRow label="Status"><StatusBadge value={record.status} /></InfoRow>
                    {record.follow_up_date && <InfoRow label="Follow-up Date" value={fmtDate(record.follow_up_date)} />}
                    {record.remarks && <div className="sm:col-span-2"><InfoRow label="Remarks" value={record.remarks} /></div>}
                    <InfoRow label="Registered On" value={fmtDate(record.createdAt)} />
                  </>
                )}
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Record ID</span>
                <p className="font-mono text-xs text-slate-500 mt-0.5 select-all">{record._id}</p>
              </div>
            </section>

            {/* Location */}
            <section className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ background: accent }} />
                Location
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <InfoRow label="City"     value={record.city} />
                <InfoRow label="District" value={record.district} />
                <InfoRow label="State"    value={record.state} />
                {isOrg && <InfoRow label="Pincode"  value={record.pincode} />}
                {record.address && (
                  <div className="col-span-2 sm:col-span-3">
                    <InfoRow label="Address" value={record.address} />
                  </div>
                )}
              </div>
            </section>

            {/* Contacts (organisations only) */}
            {isOrg && Array.isArray(record.contacts) && record.contacts.length > 0 && (
              <section className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ background: accent }} />
                  Contact Persons
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {record.contacts.map((c, i) => (
                    <ContactCard key={i} contact={c} accent={accent} index={i} />
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* RIGHT — Interaction history (organisations only) */}
          {isOrg && (
            <div className="space-y-4">

              {/* Interaction stats strip */}
              {allInteractions.length > 0 && (() => {
                const latest = allInteractions[0];
                const upcoming = allInteractions.find((i) => {
                  if (!i.nextInteractionDate) return false;
                  const d = new Date(i.nextInteractionDate).getTime();
                  return d >= Date.now() && d <= Date.now() + 48 * 60 * 60 * 1000;
                });
                return (
                  <div
                    className="rounded-2xl border p-4 grid grid-cols-3 gap-3"
                    style={{ background: `${accent}05`, borderColor: `${accent}20` }}
                  >
                    <div className="text-center">
                      <p className="text-2xl font-black" style={{ color: accent }}>{allInteractions.length}</p>
                      <p className="text-[10px] text-slate-500 uppercase tracking-wide font-semibold">Total</p>
                    </div>
                    <div className="text-center border-x border-slate-200">
                      <p className="text-sm font-bold text-slate-700">{fmtDate(latest.interactionDate)}</p>
                      <p className="text-[10px] text-slate-500 uppercase tracking-wide font-semibold">Last</p>
                    </div>
                    <div className="text-center">
                      {upcoming ? (
                        <>
                          <p className="text-sm font-bold" style={{ color: accent }}>{fmtDate(upcoming.nextInteractionDate)}</p>
                          <p className="text-[10px] text-amber-600 uppercase tracking-wide font-semibold">Next 🔔</p>
                        </>
                      ) : (
                        <>
                          <p className="text-sm font-bold text-slate-400">—</p>
                          <p className="text-[10px] text-slate-400 uppercase tracking-wide font-semibold">Next</p>
                        </>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* Interaction timeline */}
              <section className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                <div
                  className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100"
                  style={{ background: `${accent}05` }}
                >
                  <h2 className="text-xs font-bold text-slate-600 uppercase tracking-widest flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="none" viewBox="0 0 24 24" stroke={accent} strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                    Interaction History
                  </h2>
                  <button
                    onClick={() => setShowAddInt(true)}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-all"
                    style={{ background: `${accent}15`, color: accent, border: `1px solid ${accent}30` }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="9" height="9" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15"/>
                    </svg>
                    Add
                  </button>
                </div>

                <div className="px-5 py-5">
                  {loadingHistory ? (
                    <div className="space-y-4">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="pl-8 relative">
                          <div className="absolute left-0 top-3.5 w-7 h-7 rounded-full bg-slate-100 animate-pulse" />
                          <div className="bg-slate-50 rounded-xl border border-slate-100 p-4 space-y-2 animate-pulse">
                            <div className="flex justify-between">
                              <div className="h-3 w-24 bg-slate-200 rounded-full" />
                              <div className="h-3 w-16 bg-slate-200 rounded-full" />
                            </div>
                            <div className="h-2 w-3/4 bg-slate-100 rounded-full" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : allInteractions.length === 0 ? (
                    <div className="flex flex-col items-center gap-3 py-10">
                      <div
                        className="w-12 h-12 rounded-2xl flex items-center justify-center"
                        style={{ background: `${accent}10`, border: `1px solid ${accent}20` }}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke={accent} strokeWidth={1.8}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"/>
                        </svg>
                      </div>
                      <p className="text-slate-500 text-sm">No interactions recorded yet</p>
                      <button
                        onClick={() => setShowAddInt(true)}
                        className="text-xs font-semibold px-4 py-2 rounded-lg transition-all"
                        style={{ background: `${accent}15`, color: accent, border: `1px solid ${accent}30` }}
                      >
                        Add first interaction
                      </button>
                    </div>
                  ) : (
                    <div>
                      {allInteractions.map((entry, i) => (
                        <InteractionCard
                          key={entry._id || i}
                          entry={entry}
                          index={i}
                          total={allInteractions.length}
                          accent={accent}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </section>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
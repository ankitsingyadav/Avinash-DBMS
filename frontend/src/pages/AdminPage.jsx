// ─── pages/AdminPage.jsx ─────────────────────────────────────────────────────
// KEY CHANGES:
//  1. Reads ?filter=upcoming from URL params (set by NotificationsPage "View" click)
//  2. When filter=upcoming is active, fetches only orgs with nextInteractionDate
//     in next 48h from client-side — uses a derived "upcomingOnly" overlay on
//     the existing data (no new API endpoint needed; server already supports it).
//  3. Adds an "Upcoming Interactions" highlighted banner/filter bar when active.

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import axios from "../utils/axios.js";
import toast from "react-hot-toast";

import Navbar       from "../components/Navbar";
import ConfirmModal from "../components/ConfirmModal";

import { CATEGORIES }              from "../admin/constants.js";
import { CATEGORY_ICONS }          from "../admin/icons.jsx";
import { useDebounce }             from "../admin/helpers.js";
import FilterDropdown              from "../admin/components/FilterDropdown.jsx";
import EditModal                   from "../admin/components/EditModal.jsx";
import ViewModal                   from "../admin/components/ViewModal.jsx";
import ImportModal                 from "../admin/components/ImportModal.jsx";
import DataTable                   from "../admin/components/DataTable.jsx";
import InteractionHistoryModal     from "../admin/components/InteractionHistoryModal.jsx";
import useAuthStore, { roleHelpers } from "../context/authStore.js";
import AddInteractionModal from "../admin/components/Addinteractionmodal.jsx";

const ALL_CATS = CATEGORIES.map((c) => ({ ...c, icon: CATEGORY_ICONS[c.id] }));

// ── helper: check if a nextInteractionDate is within 48h from now ─────────────
const isUpcoming48h = (dateStr) => {
  if (!dateStr) return false;
  const now  = Date.now();
  const d    = new Date(dateStr).getTime();
  return d >= now && d <= now + 48 * 60 * 60 * 1000;
};

function readParams(params, category) {
  const filters = {};
  (category?.filters ?? []).forEach((f) => {
    const v = params.get(f.key);
    if (v) filters[f.key] = v;
  });
  return {
    tab:             params.get("tab")       || "volunteer",
    page:            parseInt(params.get("page") || "1", 10),
    search:          params.get("search")    || "",
    sortField:       params.get("sortField") || "createdAt",
    sortDir:         params.get("sortDir")   || "desc",
    dateFrom:        params.get("dateFrom")  || "",
    dateTo:          params.get("dateTo")    || "",
    highlight:       params.get("highlight") || "",
    upcomingFilter:  params.get("filter") === "upcoming",
    filters,
  };
}

export default function AdminPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const location  = useLocation();
  const navigate  = useNavigate();

  const authUser    = useAuthStore((s) => s.user);
  const isFullAdmin = roleHelpers.isFullAdmin(authUser);

  const canAccess = useCallback(
    (module) => roleHelpers.canAccess(authUser, module),
    [authUser]
  );
  const canDo = useCallback(
    (action) => roleHelpers.canDo(authUser, action),
    [authUser]
  );
  const isFieldHidden = useCallback(
    (field) => roleHelpers.isFieldHidden(authUser, field),
    [authUser]
  );

  const CATS = useMemo(() => {
    if (!authUser) return [];
    return ALL_CATS.filter((c) => roleHelpers.canAccess(authUser, c.id));
  }, [authUser]);

  const canAdd    = canDo("add");
  const canEdit   = canDo("edit");
  const canDelete = canDo("delete");
  const canImport = isFullAdmin;

  const getVisibleColumns = useCallback(
    (cat) => (cat?.columns ?? []).filter((col) => !isFieldHidden(col.key)),
    [isFieldHidden]
  );

  const initialCat = useMemo(
    () => CATS.find((c) => c.id === (searchParams.get("tab") || "volunteer")) ?? CATS[0],
    [] // eslint-disable-line
  );
  const initial = useMemo(() => readParams(searchParams, initialCat), []); // eslint-disable-line

  const [activeTab,     setActiveTab]     = useState(initial.tab);
  const [data,          setData]          = useState([]);
  const [total,         setTotal]         = useState(0);
  const [pages,         setPages]         = useState(1);
  const [loading,       setLoading]       = useState(false);
  const [page,          setPage]          = useState(initial.page);
  const [searchInput,   setSearchInput]   = useState(initial.search);
  const [search,        setSearch]        = useState(initial.search);
  const [sortField,     setSortField]     = useState(initial.sortField);
  const [sortDir,       setSortDir]       = useState(initial.sortDir);
  const [filters,       setFilters]       = useState(initial.filters);
  const [dateFrom,      setDateFrom]      = useState(initial.dateFrom);
  const [dateTo,        setDateTo]        = useState(initial.dateTo);
  const [highlightId,   setHighlightId]   = useState(initial.highlight);

  // ── Upcoming Interactions filter ──────────────────────────────────────────
  const [upcomingFilter, setUpcomingFilter] = useState(initial.upcomingFilter);
  // Stores fetched upcoming interaction data from /upcoming-interactions
  const [upcomingData,   setUpcomingData]   = useState([]);
  const [upcomingLoading, setUpcomingLoading] = useState(false);

  const [editRecord,    setEditRecord]    = useState(null);
  const [viewRecord,    setViewRecord]    = useState(null);
  const [deleteRecord,  setDeleteRecord]  = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showImport,    setShowImport]    = useState(false);

  const [interactionHistoryRecord, setInteractionHistoryRecord] = useState(null);
  const [addInteractionRecord,     setAddInteractionRecord]     = useState(null);

  const [selectedIds,           setSelectedIds]           = useState(new Set());
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const [bulkDeleteLoading,     setBulkDeleteLoading]     = useState(false);

  const abortRef = useRef(null);

  const category = useMemo(
    () => CATS.find((c) => c.id === activeTab) ?? CATS[0] ?? null,
    [activeTab, CATS]
  );

  useEffect(() => {
    if (CATS.length > 0 && !CATS.find((c) => c.id === activeTab)) {
      setActiveTab(CATS[0].id);
    }
  }, [CATS, activeTab]);

  // ── Sync URL params ─────────────────────────────────────────────────────────
  useEffect(() => {
    const p = new URLSearchParams();
    p.set("tab", activeTab);
    if (page > 1)                      p.set("page",      String(page));
    if (search)                        p.set("search",    search);
    if (sortField !== "createdAt")     p.set("sortField", sortField);
    if (sortDir   !== "desc")          p.set("sortDir",   sortDir);
    if (dateFrom)                      p.set("dateFrom",  dateFrom);
    if (dateTo)                        p.set("dateTo",    dateTo);
    if (highlightId)                   p.set("highlight", highlightId);
    if (upcomingFilter)                p.set("filter",    "upcoming");
    Object.entries(filters).forEach(([k, v]) => { if (v) p.set(k, v); });
    setSearchParams(p, { replace: true });
  }, [activeTab, page, search, sortField, sortDir, dateFrom, dateTo, filters, highlightId, upcomingFilter]); // eslint-disable-line

  useEffect(() => {
    if (location.state?.tab)        setActiveTab(location.state.tab);
    if (location.state?.showImport) setShowImport(true);
    if (location.state?.action === "add") {
      if (location.state.tab === "organisation") navigate("/organisation/add");
      else setEditRecord({});
    }
  }, []); // eslint-disable-line

  // ── Fetch upcoming interactions data ────────────────────────────────────────
  const fetchUpcomingData = useCallback(async () => {
    setUpcomingLoading(true);
    try {
      const res  = await axios.get("/organisations/upcoming-interactions");
      const list = res.data?.data?.interactions || [];
      setUpcomingData(list);
    } catch {
      setUpcomingData([]);
    } finally {
      setUpcomingLoading(false);
    }
  }, []);

  useEffect(() => {
    if (upcomingFilter && activeTab === "organisation") {
      fetchUpcomingData();
    }
  }, [upcomingFilter, activeTab, fetchUpcomingData]);

  const debouncedSetSearch = useDebounce((val) => { setSearch(val); setPage(1); }, 600);
  const handleSearchInput = (val) => { setSearchInput(val); debouncedSetSearch(val); };

  // ── Main data fetch ─────────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    const cat = CATS.find((c) => c.id === activeTab);
    if (!cat) return;
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();
    setLoading(true);
    try {
      const p = new URLSearchParams({ page, limit: 12, sortField, sortDir });
      if (search)   p.set("search",   search);
      if (dateFrom) p.set("dateFrom", dateFrom);
      if (dateTo)   p.set("dateTo",   dateTo);
      Object.entries(filters).forEach(([k, v]) => { if (v) p.set(k, v); });

      const res     = await axios.get(`${cat.endpoint}?${p}`, { signal: abortRef.current.signal });
      const payload = res.data?.data ?? res.data ?? {};
      setData(payload[cat.dataKey] || []);
      setTotal(payload.total || 0);
      setPages(payload.pages || 1);
    } catch (err) {
      if (err.name === "CanceledError" || err.code === "ERR_CANCELED") return;
      toast.error(err.response?.data?.message || "Failed to load data. Please try again.");
      setData([]); setTotal(0); setPages(1);
    } finally {
      setLoading(false);
    }
  }, [activeTab, page, search, sortField, sortDir, dateFrom, dateTo, filters, CATS]);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => () => { if (abortRef.current) abortRef.current.abort(); }, []);

  useEffect(() => {
    setData([]); setTotal(0); setPages(1); setPage(1);
    setSearch(""); setSearchInput(""); setSortField("createdAt"); setSortDir("desc");
    setFilters({}); setDateFrom(""); setDateTo(""); setSelectedIds(new Set());
    // Don't reset upcomingFilter when switching to org tab from elsewhere
  }, [activeTab]);

  useEffect(() => { setSelectedIds(new Set()); }, [page, search, filters, dateFrom, dateTo]);

  const handleFilterChange = useCallback((key, val) => {
    setFilters((prev) => {
      const next = { ...prev, [key]: val };
      const filterDef = category?.filters?.find((f) => f.key === key);
      if (filterDef?.cascadesTo) delete next[filterDef.cascadesTo];
      Object.keys(next).forEach((k) => { if (!next[k]) delete next[k]; });
      return next;
    });
    setPage(1);
  }, [category]);

  // ── Upcoming filter: derive displayed data ──────────────────────────────────
  // When upcomingFilter is ON and tab is organisation, we overlay the upcoming
  // data: show only records from the main `data` list whose _id appears in
  // upcomingData. We also keep normal editing/viewing working.
  const upcomingOrgIds = useMemo(
    () => new Set(upcomingData.map((u) => String(u._id))),
    [upcomingData]
  );

  const displayData  = upcomingFilter && activeTab === "organisation"
    ? data.filter((r) => upcomingOrgIds.has(String(r._id)))
    : data;

  const displayTotal = upcomingFilter && activeTab === "organisation"
    ? displayData.length
    : total;

  // ── Upcoming time helper for banner ─────────────────────────────────────────
  const getUpcomingSummary = () => {
    const now   = Date.now();
    const in2h  = now + 2 * 60 * 60 * 1000;
    const in48h = now + 48 * 60 * 60 * 1000;
    const overdue  = upcomingData.filter((u) => new Date(u.nextInteractionDate) < now).length;
    const critical = upcomingData.filter((u) => {
      const d = new Date(u.nextInteractionDate).getTime();
      return d >= now && d <= in2h;
    }).length;
    const upcoming = upcomingData.filter((u) => {
      const d = new Date(u.nextInteractionDate).getTime();
      return d > in2h && d <= in48h;
    }).length;
    return { overdue, critical, upcoming };
  };

  const allPageIds = data.map((r) => r._id);
  const handleToggleAll = () => {
    const allSel = allPageIds.every((id) => selectedIds.has(id));
    setSelectedIds((p) => {
      const n = new Set(p);
      allSel
        ? allPageIds.forEach((id) => n.delete(id))
        : allPageIds.forEach((id) => n.add(id));
      return n;
    });
  };
  const handleToggleRow = (id) =>
    setSelectedIds((p) => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const handleSort = (field) => {
    if (sortField === field) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortField(field); setSortDir("asc"); }
    setPage(1);
  };

  const handleDelete = async () => {
    if (!deleteRecord || !category) return;
    setDeleteLoading(true);
    try {
      await axios.delete(`${category.endpoint}/${deleteRecord._id}`);
      toast.success("Record deleted successfully.");
      setDeleteRecord(null); fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete record. Please try again.");
    } finally { setDeleteLoading(false); }
  };

  const handleBulkDelete = async () => {
    if (!category) return;
    setBulkDeleteLoading(true);
    const ids = [...selectedIds];
    let success = 0;
    await Promise.allSettled(
      ids.map((id) =>
        axios.delete(`${category.endpoint}/${id}`)
          .then(() => { success++; })
          .catch((err) => console.error(`Failed to delete ${id}:`, err))
      )
    );
    toast.success(`${success} record${success !== 1 ? "s" : ""} deleted.`);
    setSelectedIds(new Set()); setShowBulkDeleteConfirm(false); setBulkDeleteLoading(false);
    fetchData();
  };

  const handleHistoryAddNew = () => {
    const rec = interactionHistoryRecord;
    setInteractionHistoryRecord(null);
    setTimeout(() => setAddInteractionRecord(rec), 100);
  };

  const handleInteractionSaved = () => {
    fetchData();
    if (upcomingFilter) fetchUpcomingData();
  };

  const activeFiltersCount =
    Object.values(filters).filter(Boolean).length + (dateFrom ? 1 : 0) + (dateTo ? 1 : 0);

  const clearAll = () => {
    setFilters({}); setDateFrom(""); setDateTo("");
    setSearch(""); setSearchInput(""); setPage(1);
  };

  const disableUpcomingFilter = () => {
    setUpcomingFilter(false);
    setHighlightId("");
  };

  if (!category) {
    return (
      <div className="min-h-screen bg-[#0c0c14]">
        <Navbar />
        <div className="flex flex-col items-center justify-center h-[80vh] gap-3">
          <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" fill="none" viewBox="0 0 24 24" stroke="#334155" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"/>
          </svg>
          <p className="text-slate-500 text-sm">No modules are available for your account.</p>
          <p className="text-slate-600 text-xs">Contact your administrator to request access.</p>
        </div>
      </div>
    );
  }

  const upcomingSummary = upcomingFilter ? getUpcomingSummary() : null;

  return (
    <div className="min-h-screen bg-[#0c0c14]">
      <Navbar />

      {/* ── Modals ── */}
      <EditModal
        isOpen={!!editRecord}
        onClose={() => setEditRecord(null)}
        record={editRecord}
        category={category}
        onSaved={fetchData}
      />
      <ViewModal
        isOpen={!!viewRecord}
        onClose={() => setViewRecord(null)}
        record={viewRecord}
        category={category}
        onEdit={setEditRecord}
        onDelete={setDeleteRecord}
      />
      <ImportModal
        isOpen={showImport}
        onClose={() => setShowImport(false)}
        onUploaded={fetchData}
      />
      <ConfirmModal
        isOpen={!!deleteRecord}
        onCancel={() => setDeleteRecord(null)}
        onConfirm={handleDelete}
        loading={deleteLoading}
        title="Delete Record?"
        message={`Permanently delete "${deleteRecord?.name || deleteRecord?.centreName}"? This action cannot be undone.`}
      />
      <ConfirmModal
        isOpen={showBulkDeleteConfirm}
        onCancel={() => setShowBulkDeleteConfirm(false)}
        onConfirm={handleBulkDelete}
        loading={bulkDeleteLoading}
        title={`Delete ${selectedIds.size} Records?`}
        message={`${selectedIds.size} selected records will be permanently deleted. This action cannot be undone.`}
      />
      <InteractionHistoryModal
        isOpen={!!interactionHistoryRecord}
        onClose={() => setInteractionHistoryRecord(null)}
        record={interactionHistoryRecord}
        category={category}
        onAddNew={handleHistoryAddNew}
      />
      <AddInteractionModal
        isOpen={!!addInteractionRecord}
        onClose={() => setAddInteractionRecord(null)}
        record={addInteractionRecord}
        category={category}
        onSaved={handleInteractionSaved}
      />

      <div className="max-w-[1500px] mx-auto px-4 sm:px-6 pt-7 pb-16">

        {/* Header */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <div className="w-1 h-5 rounded-full" style={{ background: `linear-gradient(180deg,${category.accent},${category.accent}44)` }} />
              <span className="text-slate-600 text-xs font-semibold uppercase tracking-widest">Admin · Organisation Management</span>
            </div>
            <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          </div>
          <div className="flex items-center gap-3">
            {canAdd && (
              <button
                onClick={() => {
                  if (activeTab === "organisation") navigate("/organisation/add");
                  else setEditRecord({});
                }}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:-translate-y-0.5 shadow-lg shadow-indigo-500/20"
                style={{ background: "linear-gradient(135deg,#4f46e5,#6366f1)" }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15"/>
                </svg>
                Add New
              </button>
            )}
            {canImport && (
              <button
                onClick={() => setShowImport(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:-translate-y-0.5"
                style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)", boxShadow: "0 4px 20px rgba(99,102,241,0.22)" }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/>
                </svg>
                Import Data
              </button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-5 bg-[#13131f] border border-slate-800 rounded-2xl p-1.5 overflow-x-auto">
          {CATS.map((cat) => {
            const a = activeTab === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveTab(cat.id)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap flex-1 justify-center"
                style={{
                  background: a ? `${cat.accent}18` : "transparent",
                  color:      a ? cat.accent : "#475569",
                  border:    `1px solid ${a ? cat.accent + "30" : "transparent"}`,
                  transition: "all 0.15s ease",
                }}
              >
                <span style={{ color: a ? cat.accent : "#334155", flexShrink: 0 }}>{cat.icon}</span>
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* ── UPCOMING INTERACTIONS FILTER BANNER ───────────────────────────── */}
        {upcomingFilter && activeTab === "organisation" && (
          <div
            className="mb-4 rounded-2xl border overflow-hidden"
            style={{
              background: "linear-gradient(135deg, rgba(245,158,11,0.06) 0%, rgba(239,68,68,0.04) 100%)",
              borderColor: "rgba(245,158,11,0.25)",
            }}
          >
            {/* Banner header */}
            <div
              className="flex items-center justify-between px-5 py-3.5 border-b"
              style={{ borderColor: "rgba(245,158,11,0.15)" }}
            >
              <div className="flex items-center gap-3">
                {/* Pulsing dot */}
                <div className="relative flex items-center justify-center">
                  <div
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ background: "#f59e0b", boxShadow: "0 0 8px rgba(245,158,11,0.7)" }}
                  />
                  <div
                    className="absolute w-5 h-5 rounded-full"
                    style={{
                      background: "rgba(245,158,11,0.2)",
                      animation: "ping 1.5s cubic-bezier(0,0,0.2,1) infinite",
                    }}
                  />
                </div>

                <div>
                  <span className="text-amber-400 text-sm font-bold tracking-tight">
                    Upcoming Interactions Filter Active
                  </span>
                  <p className="text-slate-500 text-xs mt-0.5">
                    Showing only centres with interactions scheduled in the next 48 hours
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {/* Summary pills */}
                {upcomingSummary && (
                  <div className="flex items-center gap-2">
                    {upcomingSummary.overdue > 0 && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold"
                        style={{ background: "rgba(239,68,68,0.15)", color: "#f87171", border: "1px solid rgba(239,68,68,0.25)" }}>
                        <span className="w-1.5 h-1.5 rounded-full bg-red-400 inline-block" />
                        {upcomingSummary.overdue} overdue
                      </span>
                    )}
                    {upcomingSummary.critical > 0 && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold"
                        style={{ background: "rgba(249,115,22,0.14)", color: "#fb923c", border: "1px solid rgba(249,115,22,0.25)" }}>
                        <span className="w-1.5 h-1.5 rounded-full bg-orange-400 inline-block" />
                        {upcomingSummary.critical} &lt; 2h
                      </span>
                    )}
                    {upcomingSummary.upcoming > 0 && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold"
                        style={{ background: "rgba(16,185,129,0.1)", color: "#10b981", border: "1px solid rgba(16,185,129,0.2)" }}>
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                        {upcomingSummary.upcoming} upcoming
                      </span>
                    )}
                  </div>
                )}

                <button
                  onClick={disableUpcomingFilter}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    color: "#64748b",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = "#94a3b8"; e.currentTarget.style.background = "rgba(255,255,255,0.07)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = "#64748b"; e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
                  </svg>
                  Clear filter
                </button>
              </div>
            </div>

            {/* Upcoming interactions list inside banner */}
            {upcomingLoading ? (
              <div className="px-5 py-3 flex items-center gap-2 text-slate-600 text-xs">
                <svg className="animate-spin" width="12" height="12" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
                Loading upcoming interactions…
              </div>
            ) : upcomingData.length > 0 ? (
              <div className="px-5 py-3 flex flex-wrap gap-2">
                {upcomingData.slice(0, 8).map((u, i) => {
                  const now   = Date.now();
                  const d     = new Date(u.nextInteractionDate).getTime();
                  const diff  = d - now;
                  const hours = Math.floor(Math.abs(diff) / (1000 * 60 * 60));
                  const mins  = Math.floor((Math.abs(diff) % (1000 * 60 * 60)) / (1000 * 60));
                  const over  = diff < 0;
                  const crit  = !over && diff < 2 * 60 * 60 * 1000;
                  const color = over ? "#f87171" : crit ? "#fb923c" : "#f59e0b";
                  const timeLabel = over
                    ? `${hours > 0 ? `${hours}h ` : ""}${mins}m overdue`
                    : hours === 0 ? `${mins}m left`
                    : `${hours}h left`;

                  return (
                    <div
                      key={`${u._id}_${i}`}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs cursor-pointer transition-all"
                      style={{
                        background: "rgba(255,255,255,0.03)",
                        border: `1px solid ${color}25`,
                        maxWidth: 260,
                      }}
                      onClick={() => {
                        // Find matching org in data and open view modal
                        const org = data.find((r) => String(r._id) === String(u._id));
                        if (org) setViewRecord(org);
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.03)"; }}
                    >
                      <span style={{ color, fontWeight: 700, fontFamily: "monospace", whiteSpace: "nowrap" }}>
                        {timeLabel}
                      </span>
                      <span className="text-slate-400 truncate max-w-[140px]">{u.centreName}</span>
                      <span className="text-slate-700 text-[10px] shrink-0">
                        {u.interactionMode === "Email" ? "✉️" : u.interactionMode === "Phone" ? "📞" : u.interactionMode === "WhatsApp" ? "💬" : "🏢"}
                      </span>
                    </div>
                  );
                })}
                {upcomingData.length > 8 && (
                  <span className="flex items-center px-3 py-1.5 text-xs text-slate-600 font-semibold">
                    +{upcomingData.length - 8} more
                  </span>
                )}
              </div>
            ) : (
              <div className="px-5 py-3 text-slate-600 text-xs">
                No upcoming interactions found in the next 48 hours.
              </div>
            )}
          </div>
        )}

        {/* Filter bar */}
        <div className="bg-[#13131f] border border-slate-800 rounded-2xl p-3.5 mb-4">
          <div className="flex flex-wrap gap-2.5 items-center">

            <div className="relative min-w-[200px] max-w-xs flex-1">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
              </svg>
              <input
                type="text"
                placeholder={`Search ${category.label.toLowerCase()}…`}
                value={searchInput}
                onChange={(e) => handleSearchInput(e.target.value)}
                className="w-full bg-slate-800/60 border border-slate-700/50 rounded-lg pl-8 pr-7 py-1.5 text-white text-xs placeholder-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500/50 transition-all"
              />
              {searchInput && (
                <button
                  onClick={() => { setSearchInput(""); setSearch(""); setPage(1); }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-300"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
                  </svg>
                </button>
              )}
            </div>

            {(category.filters ?? []).map((f) => (
              <FilterDropdown
                key={`${activeTab}-${f.key}`}
                filter={f}
                value={filters[f.key] || ""}
                accent={category.accent}
                dependentValue={f.dependsOn ? (filters[f.dependsOn] || "") : undefined}
                onChange={(v) => handleFilterChange(f.key, v)}
              />
            ))}

            {/* ── Upcoming Interactions filter chip (org tab only) ── */}
            {activeTab === "organisation" && (
              <button
                onClick={() => {
                  const next = !upcomingFilter;
                  setUpcomingFilter(next);
                  if (next) {
                    setActiveTab("organisation");
                    fetchUpcomingData();
                  } else {
                    setHighlightId("");
                  }
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border select-none"
                style={
                  upcomingFilter
                    ? { background: "rgba(245,158,11,0.12)", color: "#f59e0b", borderColor: "rgba(245,158,11,0.35)" }
                    : { background: "rgba(30,41,59,0.6)", color: "#64748b", borderColor: "rgba(51,65,85,0.5)", cursor: "pointer" }
                }
              >
                <span style={{ fontSize: 12 }}>🔔</span>
                Upcoming · 48h
                {upcomingFilter && upcomingData.length > 0 && (
                  <span
                    className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold"
                    style={{ background: "rgba(245,158,11,0.2)", color: "#f59e0b" }}
                  >
                    {upcomingData.length}
                  </span>
                )}
              </button>
            )}

            <div className="flex items-center gap-1.5">
              <span className="text-slate-700 text-xs font-semibold">From</span>
              <input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
                className="bg-slate-800/60 border border-slate-700/50 rounded-lg px-2 py-1.5 text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/30 [color-scheme:dark]"/>
              <span className="text-slate-700 text-xs font-semibold">To</span>
              <input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
                className="bg-slate-800/60 border border-slate-700/50 rounded-lg px-2 py-1.5 text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/30 [color-scheme:dark]"/>
            </div>

            {(activeFiltersCount > 0 || search) && (
              <button onClick={clearAll}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-red-400 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 transition-all">
                <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
                </svg>
                Clear {activeFiltersCount + (search ? 1 : 0)}
              </button>
            )}

            <div className="ml-auto text-slate-700 text-xs font-semibold">
              {loading
                ? <span className="animate-pulse text-slate-600">Loading…</span>
                : `${(upcomingFilter && activeTab === "organisation" ? displayData.length : total).toLocaleString("en-IN")} record${total !== 1 ? "s" : ""}`
              }
            </div>
          </div>

          {searchInput && searchInput !== search && (
            <div className="flex items-center gap-2 mt-2">
              <div className="w-2 h-2 rounded-full bg-yellow-400/70 animate-pulse" />
              <span className="text-xs text-slate-600">Searching…</span>
            </div>
          )}
          {search && search === searchInput && (
            <div className="flex items-center gap-2 mt-2">
              <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: category.accent }} />
              <span className="text-xs" style={{ color: category.accent }}>
                "<strong>{search}</strong>" — {total.toLocaleString("en-IN")} result(s) found
              </span>
            </div>
          )}

          {activeFiltersCount > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2.5 pt-2.5 border-t border-slate-800/60">
              {Object.entries(filters).map(([k, v]) => {
                if (!v) return null;
                const fDef = (category.filters ?? []).find((f) => f.key === k);
                return (
                  <span key={k} className="inline-flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full font-medium"
                    style={{ background: `${category.accent}15`, color: category.accent, border: `1px solid ${category.accent}25` }}>
                    <span className="opacity-60">{fDef?.label ?? k}:</span>{v}
                    <button onClick={() => handleFilterChange(k, "")} className="opacity-60 hover:opacity-100 transition-opacity">
                      <svg xmlns="http://www.w3.org/2000/svg" width="9" height="9" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
                      </svg>
                    </button>
                  </span>
                );
              })}
              {dateFrom && (
                <span className="inline-flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full font-medium"
                  style={{ background: `${category.accent}15`, color: category.accent, border: `1px solid ${category.accent}25` }}>
                  <span className="opacity-60">From:</span>{dateFrom}
                  <button onClick={() => setDateFrom("")} className="opacity-60 hover:opacity-100">
                    <svg xmlns="http://www.w3.org/2000/svg" width="9" height="9" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
                  </button>
                </span>
              )}
              {dateTo && (
                <span className="inline-flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full font-medium"
                  style={{ background: `${category.accent}15`, color: category.accent, border: `1px solid ${category.accent}25` }}>
                  <span className="opacity-60">To:</span>{dateTo}
                  <button onClick={() => setDateTo("")} className="opacity-60 hover:opacity-100">
                    <svg xmlns="http://www.w3.org/2000/svg" width="9" height="9" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
                  </button>
                </span>
              )}
            </div>
          )}
        </div>

        {/* Bulk action bar */}
        {selectedIds.size > 0 && canDelete && (
          <div className="flex items-center justify-between px-4 py-2.5 mb-3 rounded-xl border"
            style={{ background: `${category.accent}0c`, border: `1px solid ${category.accent}25` }}>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: category.accent }} />
              <span className="text-sm font-semibold" style={{ color: category.accent }}>
                {selectedIds.size} record{selectedIds.size !== 1 ? "s" : ""} selected
              </span>
              <button onClick={() => setSelectedIds(new Set())} className="text-xs text-slate-500 hover:text-slate-300 underline underline-offset-2">
                Clear
              </button>
            </div>
            <button
              onClick={() => setShowBulkDeleteConfirm(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-red-400 bg-red-500/10 border border-red-500/25 hover:bg-red-500/20 transition-all"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
              </svg>
              Delete {selectedIds.size} selected
            </button>
          </div>
        )}

        {/* Data table — use displayData when upcoming filter is on */}
        <DataTable
          category={{ ...category, columns: getVisibleColumns(category) }}
          data={upcomingFilter && activeTab === "organisation" ? displayData : data}
          loading={loading || (upcomingFilter && upcomingLoading)}
          search={search}
          page={page} pages={pages}
          total={upcomingFilter && activeTab === "organisation" ? displayData.length : total}
          sortField={sortField} sortDir={sortDir} onSort={handleSort}
          selectedIds={selectedIds} onToggleAll={handleToggleAll} onToggleRow={handleToggleRow}
          onView={(row) => {
            setViewRecord(row);
            // If a specific highlight row was set, clear it once viewed
            if (highlightId && String(row._id) === highlightId) setHighlightId("");
          }}
          onEdit={canEdit   ? setEditRecord   : null}
          onDelete={canDelete ? setDeleteRecord : null}
          onPageChange={setPage}
          onViewInteractions={setInteractionHistoryRecord}
          onAddInteraction={setAddInteractionRecord}
          highlightId={highlightId}
        />

      </div>
    </div>
  );
}
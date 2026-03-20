// ─── pages/AdminPage.jsx ─────────────────────────────────────────────────────
import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useLocation } from "react-router-dom";
import axios from "../utils/axios.js";
import toast from "react-hot-toast";

import Navbar       from "../components/Navbar";
import ConfirmModal from "../components/ConfirmModal";

// Admin sub-components
import { CATEGORIES }     from "../admin/constants.js";
import { CATEGORY_ICONS } from "../admin/icons.jsx";
import { useDebounce }    from "../admin/helpers.js";
import FilterDropdown     from "../admin/components/FilterDropdown.jsx";
import EditModal          from "../admin/components/EditModal.jsx";
import ViewModal          from "../admin/components/ViewModal.jsx";
import ImportModal        from "../admin/components/ImportModal.jsx";
import DataTable          from "../admin/components/DataTable.jsx";

// Attach JSX icons to categories at runtime
const CATS = CATEGORIES.map((c) => ({ ...c, icon: CATEGORY_ICONS[c.id] }));

export default function AdminPage() {
  // ── State ──────────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab]   = useState("school");
  const [data, setData]             = useState([]);
  const [total, setTotal]           = useState(0);
  const [pages, setPages]           = useState(1);
  const [loading, setLoading]       = useState(false);
  const [page, setPage]             = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch]         = useState("");
  const [sortField, setSortField]   = useState("createdAt");
  const [sortDir, setSortDir]       = useState("desc");
  const [filters, setFilters]       = useState({});
  const [dateFrom, setDateFrom]     = useState("");
  const [dateTo, setDateTo]         = useState("");

  const [editRecord, setEditRecord]   = useState(null);
  const [viewRecord, setViewRecord]   = useState(null);
  const [deleteRecord, setDeleteRecord] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showImport, setShowImport]   = useState(false);

  const [selectedIds, setSelectedIds]                     = useState(new Set());
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const [bulkDeleteLoading, setBulkDeleteLoading]         = useState(false);

  const abortRef = useRef(null);

  // Read navigation state from DashboardPage card clicks
  const location = useLocation();
  useEffect(() => {
    if (location.state?.tab)        setActiveTab(location.state.tab);
    if (location.state?.showImport) setShowImport(true);
  }, []);  // eslint-disable-line react-hooks/exhaustive-deps

  const category = useMemo(() => CATS.find((c) => c.id === activeTab), [activeTab]);

  // ── Debounced search ───────────────────────────────────────────────────────
  const debouncedSetSearch = useDebounce((val) => { setSearch(val); setPage(1); }, 600);
  const handleSearchInput = (val) => { setSearchInput(val); debouncedSetSearch(val); };

  // ── Fetch ──────────────────────────────────────────────────────────────────
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
    } finally { setLoading(false); }
  }, [activeTab, page, search, sortField, sortDir, dateFrom, dateTo, filters]);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => () => { if (abortRef.current) abortRef.current.abort(); }, []);

  // Reset on tab switch
  useEffect(() => {
    setData([]); setTotal(0); setPages(1); setPage(1);
    setSearch(""); setSearchInput(""); setSortField("createdAt"); setSortDir("desc");
    setFilters({}); setDateFrom(""); setDateTo(""); setSelectedIds(new Set());
  }, [activeTab]);

  useEffect(() => { setSelectedIds(new Set()); }, [page, search, filters, dateFrom, dateTo]);

  // ── Selection ──────────────────────────────────────────────────────────────
  const allPageIds = data.map((r) => r._id);
  const handleToggleAll = () => {
    const allSel = allPageIds.every((id) => selectedIds.has(id));
    if (allSel) setSelectedIds((p) => { const n = new Set(p); allPageIds.forEach((id) => n.delete(id)); return n; });
    else        setSelectedIds((p) => { const n = new Set(p); allPageIds.forEach((id) => n.add(id)); return n; });
  };
  const handleToggleRow = (id) =>
    setSelectedIds((p) => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });

  // ── Sort ───────────────────────────────────────────────────────────────────
  const handleSort = (field) => {
    if (sortField === field) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortField(field); setSortDir("asc"); }
    setPage(1);
  };

  // ── Single delete ──────────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!deleteRecord) return;
    setDeleteLoading(true);
    try {
      await axios.delete(`${category.endpoint}/${deleteRecord._id}`);
      toast.success("Record deleted successfully.");
      setDeleteRecord(null); fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete record. Please try again.");
    } finally { setDeleteLoading(false); }
  };

  // ── Bulk delete ────────────────────────────────────────────────────────────
  const handleBulkDelete = async () => {
    setBulkDeleteLoading(true);
    const ids = [...selectedIds];
    let success = 0;
    for (const id of ids) {
      try { await axios.delete(`${category.endpoint}/${id}`); success++; } catch {}
    }
    toast.success(`${success} record${success !== 1 ? "s" : ""} deleted successfully.`);
    setSelectedIds(new Set()); setShowBulkDeleteConfirm(false); setBulkDeleteLoading(false);
    fetchData();
  };

  const activeFiltersCount =
    Object.values(filters).filter(Boolean).length + (dateFrom ? 1 : 0) + (dateTo ? 1 : 0);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#0c0c14]">
      <Navbar />

      <EditModal   isOpen={!!editRecord}   onClose={() => setEditRecord(null)}   record={editRecord}   category={category} onSaved={fetchData} />
      <ViewModal   isOpen={!!viewRecord}   onClose={() => setViewRecord(null)}   record={viewRecord}   category={category} onEdit={setEditRecord} onDelete={setDeleteRecord} />
      <ImportModal isOpen={showImport}     onClose={() => setShowImport(false)}  onUploaded={fetchData} />

      <ConfirmModal isOpen={!!deleteRecord}        onCancel={() => setDeleteRecord(null)}        onConfirm={handleDelete}    loading={deleteLoading}    title="Delete Record?"                       message={`Permanently delete "${deleteRecord?.name}"? This action cannot be undone.`} />
      <ConfirmModal isOpen={showBulkDeleteConfirm} onCancel={() => setShowBulkDeleteConfirm(false)} onConfirm={handleBulkDelete} loading={bulkDeleteLoading} title={`Delete ${selectedIds.size} Records?`} message={`${selectedIds.size} selected records will be permanently deleted. This action cannot be undone.`} />

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
          <button onClick={() => setShowImport(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:-translate-y-0.5"
            style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)", boxShadow: "0 4px 20px rgba(99,102,241,0.22)" }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/></svg>
            Import Data
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-5 bg-[#13131f] border border-slate-800 rounded-2xl p-1.5 overflow-x-auto">
          {CATS.map((cat) => {
            const a = activeTab === cat.id;
            return (
              <button key={cat.id} onClick={() => setActiveTab(cat.id)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap flex-1 justify-center"
                style={{ background: a ? `${cat.accent}18` : "transparent", color: a ? cat.accent : "#475569", border: `1px solid ${a ? cat.accent + "30" : "transparent"}`, transition: "all 0.15s ease" }}>
                <span style={{ color: a ? cat.accent : "#334155", flexShrink: 0 }}>{cat.icon}</span>
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Filters */}
        <div className="bg-[#13131f] border border-slate-800 rounded-2xl p-3.5 mb-4">
          <div className="flex flex-wrap gap-2.5 items-center">
            <div className="relative min-w-[200px] max-w-xs flex-1">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
              <input type="text" placeholder={`Search ${category.label.toLowerCase()}…`} value={searchInput} onChange={(e) => handleSearchInput(e.target.value)}
                className="w-full bg-slate-800/60 border border-slate-700/50 rounded-lg pl-8 pr-7 py-1.5 text-white text-xs placeholder-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500/50 transition-all" />
              {searchInput && (
                <button onClick={() => { setSearchInput(""); setSearch(""); setPage(1); }} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-300">
                  <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
                </button>
              )}
            </div>
            {category.filters.map((f) => (
              <FilterDropdown key={f.key} filter={f} value={filters[f.key] || ""} accent={category.accent}
                onChange={(v) => { setFilters((p) => ({ ...p, [f.key]: v })); setPage(1); }} />
            ))}
            <div className="flex items-center gap-1.5">
              <span className="text-slate-700 text-xs font-semibold">From</span>
              <input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(1); }} className="bg-slate-800/60 border border-slate-700/50 rounded-lg px-2 py-1.5 text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/30 [color-scheme:dark]" />
              <span className="text-slate-700 text-xs font-semibold">To</span>
              <input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(1); }} className="bg-slate-800/60 border border-slate-700/50 rounded-lg px-2 py-1.5 text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/30 [color-scheme:dark]" />
            </div>
            {(activeFiltersCount > 0 || search) && (
              <button onClick={() => { setFilters({}); setDateFrom(""); setDateTo(""); setSearch(""); setSearchInput(""); setPage(1); }}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-red-400 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 transition-all">
                <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
                Clear {activeFiltersCount + (search ? 1 : 0)}
              </button>
            )}
            <div className="ml-auto text-slate-700 text-xs font-semibold">
              {loading ? <span className="animate-pulse text-slate-600">Loading…</span> : `${total.toLocaleString()} record${total !== 1 ? "s" : ""}`}
            </div>
          </div>
          {searchInput && searchInput !== search && (
            <div className="flex items-center gap-2 mt-2"><div className="w-2 h-2 rounded-full bg-yellow-400/70 animate-pulse" /><span className="text-xs text-slate-600">Searching…</span></div>
          )}
          {search && search === searchInput && (
            <div className="flex items-center gap-2 mt-2">
              <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: category.accent }} />
              <span className="text-xs" style={{ color: category.accent }}>"<strong>{search}</strong>" — {total} result(s) found</span>
            </div>
          )}
        </div>

        {/* Bulk action bar */}
        {selectedIds.size > 0 && (
          <div className="flex items-center justify-between px-4 py-2.5 mb-3 rounded-xl border" style={{ background: `${category.accent}0c`, border: `1px solid ${category.accent}25` }}>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: category.accent }} />
              <span className="text-sm font-semibold" style={{ color: category.accent }}>{selectedIds.size} record{selectedIds.size !== 1 ? "s" : ""} selected</span>
              <button onClick={() => setSelectedIds(new Set())} className="text-xs text-slate-500 hover:text-slate-300 underline underline-offset-2">Clear</button>
            </div>
            <button onClick={() => setShowBulkDeleteConfirm(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-red-400 bg-red-500/10 border border-red-500/25 hover:bg-red-500/20 transition-all">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
              Delete {selectedIds.size} selected
            </button>
          </div>
        )}

        {/* Data table */}
        <DataTable
          category={category} data={data} loading={loading} search={search}
          page={page} pages={pages} total={total}
          sortField={sortField} sortDir={sortDir} onSort={handleSort}
          selectedIds={selectedIds} onToggleAll={handleToggleAll} onToggleRow={handleToggleRow}
          onView={setViewRecord} onEdit={setEditRecord} onDelete={setDeleteRecord}
          onPageChange={setPage}
        />

      </div>
    </div>
  );
}
// ─── admin/components/DataTable.jsx ──────────────────────────────────────────
import { useState, useEffect, useRef } from "react";
import { fmtDate, shortId } from "../helpers.js";
import { DataStatusBadge, StatusBadge, TypeBadge, HighlightText } from "./ui.jsx";

const DEFAULT_VISIBLE = {
  organisation: new Set(["_id", "centreName", "phone", "email", "state", "status"]),
  volunteer:    new Set(["_id", "name", "phone", "email", "state", "area_of_interest", "status"]),
};

export default function DataTable({
  category, data, loading, search,
  page, pages, total,
  sortField, sortDir, onSort,
  selectedIds, onToggleAll, onToggleRow,
  onView, onEdit, onDelete,
  onPageChange,
  onViewInteractions,
  onAddInteraction,
  highlightId,
}) {
  const [hoveredRow,  setHoveredRow]  = useState(null);
  const [dropOpen,    setDropOpen]    = useState(false);
  const [visibleCols, setVisibleCols] = useState(() => {
    return DEFAULT_VISIBLE[category?.id] ?? new Set(category?.columns?.map((c) => c.key) ?? []);
  });
  const highlightRef = useRef(null);
  const dropRef      = useRef(null);

  useEffect(() => {
    setVisibleCols(
      DEFAULT_VISIBLE[category?.id] ??
      new Set(category?.columns?.map((c) => c.key) ?? [])
    );
  }, [category?.id]);

  useEffect(() => {
    if (highlightId && highlightRef.current) {
      setTimeout(() => {
        highlightRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 300);
    }
  }, [highlightId, data]);

  useEffect(() => {
    const fn = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target)) setDropOpen(false);
    };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  if (!category) return null;

  const allPageIds   = data.map((r) => r._id);
  const allSelected  = allPageIds.length > 0 && allPageIds.every((id) => selectedIds.has(id));
  const someSelected = allPageIds.some((id) => selectedIds.has(id)) && !allSelected;

  const showInteractionCol = category.id === "organisation";

  const toggleableCols    = (category.columns ?? []).filter(
    (c) => c.key !== "centreName" && c.key !== "name" && c.key !== "_id"
  );
  const alwaysVisibleKeys = new Set(["_id", "centreName", "name"]);

  const toggleCol = (key) => {
    setVisibleCols((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  const hiddenCount = toggleableCols.filter((c) => !visibleCols.has(c.key)).length;

  const activeCols = (category.columns ?? []).filter(
    (c) => alwaysVisibleKeys.has(c.key) || visibleCols.has(c.key)
  );

  const getCellDisplay = (row, col) => {
    const v = row[col.key];
    if (col.key === "_id")  return <span className="font-mono text-xs text-slate-400 select-all cursor-text">{shortId(v)}</span>;
    if (col.isDataStatus)   return <DataStatusBadge value={v} />;
    if (col.isStatus)       return <StatusBadge value={v} />;
    if (col.badge)          return <TypeBadge value={v} accent={category.accent} />;
    if (col.isDate)         return <span className="text-slate-500 text-xs whitespace-nowrap">{fmtDate(v)}</span>;
    if (!v && v !== 0)      return <span className="text-slate-300">—</span>;
    if (col.bold)           return <span className="text-slate-900 font-semibold text-sm"><HighlightText text={String(v)} query={search} /></span>;
    return <span className="text-slate-600 text-sm"><HighlightText text={String(v)} query={search} /></span>;
  };

  const SortIcon = ({ field }) => {
    if (sortField !== field)
      return (
        <svg className="opacity-30" xmlns="http://www.w3.org/2000/svg" width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4"/>
        </svg>
      );
    return sortDir === "asc"
      ? <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" fill="none" viewBox="0 0 24 24" stroke={category.accent} strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7"/></svg>
      : <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" fill="none" viewBox="0 0 24 24" stroke={category.accent} strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/></svg>;
  };

  // ── Interaction cell ────────────────────────────────────────────────────────
  const InteractionCell = ({ row }) => {
    const hasHistory  = Array.isArray(row.interactions) && row.interactions.length > 0;
    const count       = row.interactions?.length ?? 0;
    const hasUpcoming = Array.isArray(row.interactions) && row.interactions.some((i) => {
      if (!i.nextInteractionDate) return false;
      const now = Date.now();
      const d   = new Date(i.nextInteractionDate).getTime();
      return d >= now && d <= now + 48 * 60 * 60 * 1000;
    });

    return (
      <div className="flex items-center gap-1.5">
        <button
          onClick={(e) => { e.stopPropagation(); onViewInteractions?.(row); }}
          title="View interaction history"
          className="relative flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-all border"
          style={{
            background:  hasHistory ? `${category.accent}10` : "#f8fafc",
            color:       hasHistory ? category.accent        : "#94a3b8",
            borderColor: hasHistory ? `${category.accent}30` : "#e2e8f0",
          }}
        >
          {hasUpcoming && (
            <span
              className="absolute -top-1 -right-1 w-2 h-2 rounded-full border border-white"
              style={{ background: "#f59e0b" }}
            />
          )}
          <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          {count > 0 ? count : "—"}
        </button>

        <button
          onClick={(e) => { e.stopPropagation(); onAddInteraction?.(row); }}
          title="Add new interaction"
          className="flex items-center justify-center w-6 h-6 rounded-lg border border-slate-200 bg-white text-slate-400 hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50 transition-all"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15"/>
          </svg>
        </button>
      </div>
    );
  };

  // ── Column Toggle Dropdown ──────────────────────────────────────────────────
  const ColumnToggleDropdown = () => (
    <div className="relative" ref={dropRef}>
      <button
        onClick={() => setDropOpen((o) => !o)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all select-none"
        style={{
          background:  dropOpen ? `${category.accent}10` : "#fff",
          color:       dropOpen ? category.accent        : "#64748b",
          borderColor: dropOpen ? `${category.accent}40` : "#e2e8f0",
        }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h10M4 18h7"/>
        </svg>
        Columns
        {hiddenCount > 0 && (
          <span
            className="px-1.5 py-0.5 rounded-full text-[10px] font-bold"
            style={{ background: `${category.accent}15`, color: category.accent }}
          >
            +{hiddenCount}
          </span>
        )}
        <svg
          xmlns="http://www.w3.org/2000/svg" width="8" height="8" fill="none"
          viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
          className={`transition-transform duration-150 ${dropOpen ? "rotate-180" : ""}`}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/>
        </svg>
      </button>

      {dropOpen && (
        <div className="absolute top-full right-0 mt-1.5 w-52 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden">
          <div className="px-3 pt-3 pb-1">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
              Toggle Columns
            </p>
          </div>
          <div className="px-2 pb-2 space-y-0.5 max-h-64 overflow-y-auto">
            {toggleableCols.map((col) => {
              const on = visibleCols.has(col.key);
              return (
                <button
                  key={col.key}
                  onClick={() => toggleCol(col.key)}
                  className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs transition-all text-left hover:bg-slate-50"
                  style={on ? { background: `${category.accent}08`, color: category.accent } : { color: "#64748b" }}
                >
                  <div
                    className="w-3.5 h-3.5 rounded flex items-center justify-center shrink-0 border"
                    style={{
                      background:  on ? category.accent : "#fff",
                      borderColor: on ? category.accent : "#cbd5e1",
                    }}
                  >
                    {on && (
                      <svg xmlns="http://www.w3.org/2000/svg" width="9" height="9" fill="none" viewBox="0 0 24 24" stroke="#fff" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
                      </svg>
                    )}
                  </div>
                  <span className="font-medium">{col.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">

      {/* Header row */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-100 bg-slate-50">
        <span className="text-slate-500 text-xs font-semibold uppercase tracking-wider">
          {total?.toLocaleString?.() ?? 0} Records
        </span>
        <ColumnToggleDropdown />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-max">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50">
              {/* Checkbox */}
              <th className="pl-4 pr-2 py-3 w-10">
                <button
                  onClick={onToggleAll}
                  className="w-4 h-4 rounded flex items-center justify-center transition-all border"
                  style={{
                    background:  allSelected ? category.accent : someSelected ? `${category.accent}30` : "#fff",
                    borderColor: allSelected || someSelected ? category.accent : "#cbd5e1",
                  }}
                >
                  {allSelected    && <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="#fff" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>}
                  {someSelected && !allSelected && <div className="w-2 h-0.5 rounded" style={{ background: category.accent }} />}
                </button>
              </th>

              {/* Always-visible columns */}
              {activeCols
                .filter((c) => c.key === "_id" || c.key === "centreName" || c.key === "name")
                .map((col) => (
                  <th
                    key={col.key}
                    className={`px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap ${col.sortable ? "cursor-pointer hover:text-slate-700 select-none" : ""} transition-colors`}
                    style={{ minWidth: col.w }}
                    onClick={() => col.sortable && onSort(col.key)}
                  >
                    <div className="flex items-center gap-1.5">
                      {col.label}
                      {col.sortable && <SortIcon field={col.key} />}
                    </div>
                  </th>
                ))}

              {/* Interaction column */}
              {showInteractionCol && (
                <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider w-28">
                  <div className="flex items-center gap-1.5">
                    <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                    Interactions
                  </div>
                </th>
              )}

              {/* Rest of columns */}
              {activeCols
                .filter((c) => c.key !== "_id" && c.key !== "centreName" && c.key !== "name")
                .map((col) => (
                  <th
                    key={col.key}
                    className={`px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap ${col.sortable ? "cursor-pointer hover:text-slate-700 select-none" : ""} transition-colors`}
                    style={{ minWidth: col.w }}
                    onClick={() => col.sortable && onSort(col.key)}
                  >
                    <div className="flex items-center gap-1.5">
                      {col.key === "status" ? "Data" : col.label}
                      {col.sortable && <SortIcon field={col.key} />}
                    </div>
                  </th>
                ))}

              <th className="px-4 py-3 text-right text-xs font-bold text-slate-500 uppercase tracking-wider w-24">
                Actions
              </th>
            </tr>
          </thead>

          <tbody>
            {/* Loading skeleton */}
            {loading && Array.from({ length: 8 }).map((_, i) => (
              <tr key={i} className="border-b border-slate-100">
                <td className="pl-4 pr-2 py-3.5 w-10">
                  <div className="w-4 h-4 bg-slate-100 rounded animate-pulse" />
                </td>
                {activeCols.map((col) => (
                  <td key={col.key} className="px-4 py-3.5">
                    <div className="h-3 bg-slate-100 rounded-full animate-pulse" style={{ width: `${40 + Math.random() * 45}%` }} />
                  </td>
                ))}
                {showInteractionCol && (
                  <td className="px-4 py-3.5">
                    <div className="h-5 w-16 bg-slate-100 rounded-lg animate-pulse" />
                  </td>
                )}
                <td className="px-4 py-3.5">
                  <div className="h-3 w-14 bg-slate-100 rounded-full animate-pulse ml-auto" />
                </td>
              </tr>
            ))}

            {/* Empty state */}
            {!loading && data.length === 0 && (
              <tr>
                <td
                  colSpan={activeCols.length + (showInteractionCol ? 3 : 2)}
                  className="text-center py-20"
                >
                  <div className="flex flex-col items-center gap-3">
                    <div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center"
                      style={{ background: `${category.accent}10`, border: `1px solid ${category.accent}20` }}
                    >
                      <span style={{ color: category.accent }}>{category.icon}</span>
                    </div>
                    <p className="text-slate-500 text-sm font-medium">No {category.label.toLowerCase()} found</p>
                    {search && <p className="text-slate-400 text-xs">Try adjusting your search or filters</p>}
                  </div>
                </td>
              </tr>
            )}

            {/* Data rows */}
            {!loading && data.map((row) => {
              const isHighlighted = highlightId && String(row._id) === String(highlightId);
              const isSelected    = selectedIds.has(row._id);
              const isHovered     = hoveredRow === row._id;

              return (
                <tr
                  key={row._id}
                  ref={isHighlighted ? highlightRef : null}
                  className="border-b border-slate-100 cursor-pointer group transition-colors"
                  style={{
                    background: isHighlighted
                      ? "#fffbeb"
                      : isSelected
                        ? `${category.accent}08`
                        : isHovered ? "#f8fafc" : "#fff",
                    boxShadow: isHighlighted ? "inset 3px 0 0 #f59e0b" : isSelected ? `inset 3px 0 0 ${category.accent}` : "none",
                  }}
                  onMouseEnter={() => setHoveredRow(row._id)}
                  onMouseLeave={() => setHoveredRow(null)}
                  onClick={() => onView(row)}
                >
                  {/* Row checkbox */}
                  <td className="pl-4 pr-2 py-3 w-10" onClick={(e) => { e.stopPropagation(); onToggleRow(row._id); }}>
                    <div
                      className="w-4 h-4 rounded flex items-center justify-center transition-all border"
                      style={{
                        background: isSelected ? category.accent : "#fff",
                        borderColor: isSelected ? category.accent : "#cbd5e1",
                      }}
                    >
                      {isSelected && (
                        <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="#fff" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
                        </svg>
                      )}
                    </div>
                  </td>

                  {/* Always-visible columns */}
                  {activeCols
                    .filter((c) => c.key === "_id" || c.key === "centreName" || c.key === "name")
                    .map((col) => (
                      <td key={col.key} className="px-4 py-3 max-w-[220px]">
                        <div className="truncate">{getCellDisplay(row, col)}</div>
                      </td>
                    ))}

                  {/* Interaction column */}
                  {showInteractionCol && (
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <InteractionCell row={row} />
                    </td>
                  )}

                  {/* Rest of columns */}
                  {activeCols
                    .filter((c) => c.key !== "_id" && c.key !== "centreName" && c.key !== "name")
                    .map((col) => (
                      <td key={col.key} className="px-4 py-3 max-w-[220px]">
                        <div className="truncate">
                          {col.isStatus || col.key === "status"
                            ? <DataStatusBadge value={row[col.key]} />
                            : getCellDisplay(row, col)
                          }
                        </div>
                      </td>
                    ))}

                  {/* Actions */}
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <div
                      className={`flex items-center justify-end gap-1 transition-opacity duration-100 ${
                        isHovered || isHighlighted ? "opacity-100" : "opacity-0"
                      }`}
                    >
                      <button
                        onClick={() => onView(row)}
                        title="View"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                        </svg>
                      </button>
                      {onEdit && (
                        <button
                          onClick={() => onEdit(row)}
                          title="Edit"
                          className="p-1.5 rounded-lg transition-all hover:bg-blue-50"
                          style={{ color: category.accent }}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                          </svg>
                        </button>
                      )}
                      {onDelete && (
                        <button
                          onClick={() => onDelete(row)}
                          title="Delete"
                          className="p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-all"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                          </svg>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {!loading && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 bg-slate-50 flex-wrap gap-3">
          <span className="text-slate-500 text-xs">
            {data.length > 0
              ? `Showing ${(page - 1) * 12 + 1}–${Math.min(page * 12, total)} of ${total.toLocaleString()}`
              : "0 records"}
          </span>
          {pages > 1 && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => onPageChange(1)}
                disabled={page === 1}
                className="px-2 py-1.5 rounded-lg text-xs text-slate-500 bg-white border border-slate-200 hover:text-slate-900 hover:border-slate-300 disabled:opacity-30 transition-all"
              >«</button>
              <button
                onClick={() => onPageChange(page - 1)}
                disabled={page === 1}
                className="px-3 py-1.5 rounded-lg text-xs text-slate-500 bg-white border border-slate-200 hover:text-slate-900 hover:border-slate-300 disabled:opacity-30 transition-all"
              >‹</button>

              {Array.from({ length: Math.min(5, pages) }, (_, i) => {
                let p;
                if (pages <= 5)             p = i + 1;
                else if (page <= 3)         p = i + 1;
                else if (page >= pages - 2) p = pages - 4 + i;
                else                        p = page - 2 + i;
                return (
                  <button
                    key={p}
                    onClick={() => onPageChange(p)}
                    className="w-7 h-7 rounded-lg text-xs font-semibold transition-all border"
                    style={
                      p === page
                        ? { background: category.accent, color: "#fff", borderColor: category.accent }
                        : { background: "#fff", color: "#64748b", borderColor: "#e2e8f0" }
                    }
                  >
                    {p}
                  </button>
                );
              })}

              <button
                onClick={() => onPageChange(page + 1)}
                disabled={page === pages}
                className="px-3 py-1.5 rounded-lg text-xs text-slate-500 bg-white border border-slate-200 hover:text-slate-900 hover:border-slate-300 disabled:opacity-30 transition-all"
              >›</button>
              <button
                onClick={() => onPageChange(pages)}
                disabled={page === pages}
                className="px-2 py-1.5 rounded-lg text-xs text-slate-500 bg-white border border-slate-200 hover:text-slate-900 hover:border-slate-300 disabled:opacity-30 transition-all"
              >»</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
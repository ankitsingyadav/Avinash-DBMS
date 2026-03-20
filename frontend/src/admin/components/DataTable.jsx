// ─── admin/components/DataTable.jsx ──────────────────────────────────────────
import { useState } from "react";
import { fmtDate, shortId } from "../helpers.js";
import { StatusBadge, TypeBadge, HighlightText } from "./ui.jsx";

export default function DataTable({
  category, data, loading, search,
  page, pages, total,
  sortField, sortDir, onSort,
  selectedIds, onToggleAll, onToggleRow,
  onView, onEdit, onDelete,
  onPageChange,
}) {
  const [hoveredRow, setHoveredRow] = useState(null);

  const allPageIds  = data.map((r) => r._id);
  const allSelected = allPageIds.length > 0 && allPageIds.every((id) => selectedIds.has(id));
  const someSelected = allPageIds.some((id) => selectedIds.has(id)) && !allSelected;

  const getCellDisplay = (row, col) => {
    const v = row[col.key];
    if (col.key === "_id")  return <span className="font-mono text-xs text-slate-700 select-all cursor-text">{shortId(v)}</span>;
    if (col.isStatus)       return <StatusBadge value={v} />;
    if (col.badge)          return <TypeBadge value={v} accent={category.accent} />;
    if (col.isDate)         return <span className="text-slate-500 text-xs whitespace-nowrap">{fmtDate(v)}</span>;
    if (!v && v !== 0)      return <span className="text-slate-800">—</span>;
    if (col.bold)           return <span className="text-white font-medium text-sm"><HighlightText text={String(v)} query={search} /></span>;
    return <span className="text-slate-400 text-sm"><HighlightText text={String(v)} query={search} /></span>;
  };

  const SortIcon = ({ field }) => {
    if (sortField !== field)
      return (
        <svg className="opacity-20" xmlns="http://www.w3.org/2000/svg" width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4"/>
        </svg>
      );
    return sortDir === "asc"
      ? <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" fill="none" viewBox="0 0 24 24" stroke={category.accent} strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7"/></svg>
      : <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" fill="none" viewBox="0 0 24 24" stroke={category.accent} strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/></svg>;
  };

  return (
    <div className="bg-[#13131f] border border-slate-800 rounded-2xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-max">
          <thead>
            <tr className="border-b border-slate-800">
              {/* Select-all checkbox */}
              <th className="pl-4 pr-2 py-3 w-10">
                <button
                  onClick={onToggleAll}
                  className="w-4 h-4 rounded flex items-center justify-center transition-all border"
                  style={{
                    background: allSelected ? category.accent : someSelected ? `${category.accent}40` : "transparent",
                    border: `1.5px solid ${allSelected || someSelected ? category.accent : "#334155"}`,
                  }}>
                  {allSelected   && <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="#fff" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>}
                  {someSelected && !allSelected && <div className="w-2 h-0.5 bg-white rounded" />}
                </button>
              </th>

              {category.columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider whitespace-nowrap ${col.sortable ? "cursor-pointer hover:text-slate-400 select-none" : ""} transition-colors`}
                  style={{ minWidth: col.w }}
                  onClick={() => col.sortable && onSort(col.key)}>
                  <div className="flex items-center gap-1.5">
                    {col.label}
                    {col.sortable && <SortIcon field={col.key} />}
                  </div>
                </th>
              ))}

              <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider w-24">
                Actions
              </th>
            </tr>
          </thead>

          <tbody>
            {/* Loading skeleton */}
            {loading && Array.from({ length: 8 }).map((_, i) => (
              <tr key={i} className="border-b border-slate-800/40">
                <td className="pl-4 pr-2 py-3.5 w-10">
                  <div className="w-4 h-4 bg-slate-800/80 rounded animate-pulse" />
                </td>
                {category.columns.map((col) => (
                  <td key={col.key} className="px-4 py-3.5">
                    <div className="h-3 bg-slate-800/80 rounded-full animate-pulse" style={{ width: `${40 + Math.random() * 45}%` }} />
                  </td>
                ))}
                <td className="px-4 py-3.5">
                  <div className="h-3 w-14 bg-slate-800/80 rounded-full animate-pulse ml-auto" />
                </td>
              </tr>
            ))}

            {/* Empty state */}
            {!loading && data.length === 0 && (
              <tr>
                <td colSpan={category.columns.length + 2} className="text-center py-20">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
                      style={{ background: `${category.accent}10`, border: `1px solid ${category.accent}20` }}>
                      <span style={{ color: category.accent }}>{category.icon}</span>
                    </div>
                    <p className="text-slate-600 text-sm">No {category.label.toLowerCase()} found</p>
                    {search && <p className="text-slate-700 text-xs">Try adjusting your search or filters</p>}
                  </div>
                </td>
              </tr>
            )}

            {/* Data rows */}
            {!loading && data.map((row) => (
              <tr
                key={row._id}
                className="border-b border-slate-800/30 cursor-pointer group transition-colors"
                style={{
                  background: selectedIds.has(row._id)
                    ? `${category.accent}10`
                    : hoveredRow === row._id ? `${category.accent}07` : "transparent",
                }}
                onMouseEnter={() => setHoveredRow(row._id)}
                onMouseLeave={() => setHoveredRow(null)}
                onClick={() => onView(row)}>

                {/* Row checkbox */}
                <td className="pl-4 pr-2 py-3 w-10" onClick={(e) => { e.stopPropagation(); onToggleRow(row._id); }}>
                  <div
                    className="w-4 h-4 rounded flex items-center justify-center transition-all"
                    style={{
                      background: selectedIds.has(row._id) ? category.accent : "transparent",
                      border: `1.5px solid ${selectedIds.has(row._id) ? category.accent : "#1e293b"}`,
                    }}>
                    {selectedIds.has(row._id) && (
                      <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="#fff" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
                      </svg>
                    )}
                  </div>
                </td>

                {category.columns.map((col) => (
                  <td key={col.key} className="px-4 py-3 max-w-[220px]">
                    <div className="truncate">{getCellDisplay(row, col)}</div>
                  </td>
                ))}

                {/* Action buttons */}
                <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                  <div className={`flex items-center justify-end gap-1 transition-opacity duration-100 ${hoveredRow === row._id ? "opacity-100" : "opacity-0"}`}>
                    <button onClick={() => onView(row)} title="View"
                      className="p-1.5 rounded-lg text-slate-600 hover:text-white hover:bg-slate-700/50 transition-all">
                      <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                      </svg>
                    </button>
                    <button onClick={() => onEdit(row)} title="Edit"
                      className="p-1.5 rounded-lg hover:bg-indigo-500/15 transition-all" style={{ color: category.accent }}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                      </svg>
                    </button>
                    <button onClick={() => onDelete(row)} title="Delete"
                      className="p-1.5 rounded-lg text-red-600 hover:text-red-400 hover:bg-red-500/15 transition-all">
                      <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                      </svg>
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
            {data.length > 0
              ? `Showing ${(page - 1) * 12 + 1}–${Math.min(page * 12, total)} of ${total.toLocaleString()}`
              : "0 records"}
          </span>
          {pages > 1 && (
            <div className="flex items-center gap-1">
              <button onClick={() => onPageChange(1)} disabled={page === 1}
                className="px-2 py-1.5 rounded-lg text-xs text-slate-600 bg-slate-800/60 border border-slate-800 hover:text-white disabled:opacity-25 transition-all">«</button>
              <button onClick={() => onPageChange(page - 1)} disabled={page === 1}
                className="px-3 py-1.5 rounded-lg text-xs text-slate-500 bg-slate-800/60 border border-slate-800 hover:text-white disabled:opacity-25 transition-all">‹</button>

              {Array.from({ length: Math.min(5, pages) }, (_, i) => {
                let p;
                if (pages <= 5)           p = i + 1;
                else if (page <= 3)       p = i + 1;
                else if (page >= pages - 2) p = pages - 4 + i;
                else                      p = page - 2 + i;
                return (
                  <button key={p} onClick={() => onPageChange(p)}
                    className="w-7 h-7 rounded-lg text-xs font-semibold transition-all"
                    style={p === page
                      ? { background: `linear-gradient(135deg,${category.accent},${category.accent}cc)`, color: "#fff" }
                      : { background: "#1a1a2e", color: "#4b5563", border: "1px solid #1e293b" }}>
                    {p}
                  </button>
                );
              })}

              <button onClick={() => onPageChange(page + 1)} disabled={page === pages}
                className="px-3 py-1.5 rounded-lg text-xs text-slate-500 bg-slate-800/60 border border-slate-800 hover:text-white disabled:opacity-25 transition-all">›</button>
              <button onClick={() => onPageChange(pages)} disabled={page === pages}
                className="px-2 py-1.5 rounded-lg text-xs text-slate-600 bg-slate-800/60 border border-slate-800 hover:text-white disabled:opacity-25 transition-all">»</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
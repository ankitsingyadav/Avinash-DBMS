// ─── admin/components/ImportModal.jsx ────────────────────────────────────────
import { useState, useEffect, useRef } from "react";
import * as XLSX from "xlsx";
import toast from "react-hot-toast";
import axios from "../../utils/axios.js";
import { CATEGORIES, IMPORT_BATCH_SIZE } from "../constants.js";
import { parseWorkbook, validatePlan, buildPayload } from "../helpers.js";

export default function ImportModal({ isOpen, onClose, onUploaded }) {
  const [step, setStep]         = useState("choose");
  const [plan, setPlan]         = useState([]);
  const [upState, setUpState]   = useState({ done: 0, total: 0, catLabel: "", record: "", pct: 0 });
  const [results, setResults]   = useState([]);
  const [valErrors, setValErrors] = useState([]);
  const fileRef = useRef();

  useEffect(() => {
    if (!isOpen) { setStep("choose"); setPlan([]); setResults([]); setValErrors([]); }
  }, [isOpen]);

  if (!isOpen) return null;

  // ── File parse ──────────────────────────────────────────────────────────────
  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    e.target.value = "";
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const wb       = XLSX.read(ev.target.result, { type: "array" });
        const detected = parseWorkbook(wb);
        if (!detected.length) {
          toast.error("No recognisable data found. Ensure sheet names contain: Schools, Colleges, NGOs, or Volunteers.");
          return;
        }
        setPlan(detected);
        setStep("preview");
      } catch (err) {
        console.error("File parse error:", err);
        toast.error("Failed to parse file. Please check the format and try again.");
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const totalSel = plan.filter((p) => p.checked).reduce((s, p) => s + p.rows.length, 0);

  // ── Upload ──────────────────────────────────────────────────────────────────
  const handleUpload = async () => {
    const active = plan.filter((p) => p.checked);

    // Validate required fields first
    const errors = validatePlan(active);
    if (errors.length > 0) {
      setValErrors(errors.slice(0, 10));
      setStep("validation-error");
      return;
    }

    const total = active.reduce((s, p) => s + p.rows.length, 0);
    setUpState({ done: 0, total, catLabel: "", record: "", pct: 0 });
    setStep("uploading");
    const finals = [];
    let done = 0;

    for (const p of active) {
      let success = 0, failed = 0;

      // Split into batches of IMPORT_BATCH_SIZE
      const batches = [];
      for (let i = 0; i < p.rows.length; i += IMPORT_BATCH_SIZE)
        batches.push(p.rows.slice(i, i + IMPORT_BATCH_SIZE));

      for (const batch of batches) {
        setUpState((prev) => ({ ...prev, catLabel: p.catLabel, record: batch[0]?.name || "…" }));

        // Try bulk endpoint first
        try {
          const payloads = batch.map((r) => buildPayload(r, p.fields));
console.table(payloads[0]); // shows you exact keys + values side by side
          await axios.post(`${p.endpoint}/bulk`, { records: payloads });
          success += batch.length;
        } catch {
          // Fallback: parallel individual requests
          // Fallback: parallel individual requests
const settled = await Promise.allSettled(
  batch.map((r) => axios.post(p.endpoint, buildPayload(r, p.fields)))
);
settled.forEach((r, i) => {
  if (r.status === "fulfilled") success++;
  else {
    failed++;
    console.warn(`[Import] Failed row:`, batch[i]);                    // ✅ row data
    console.warn(`[Import] Error:`, r.reason?.response?.data);         // ✅ backend error message
  }
});
        }

        done += batch.length;
        setUpState((prev) => ({ ...prev, done, pct: Math.round((done / total) * 100) }));
      }

      finals.push({ catLabel: p.catLabel, accent: p.accent, success, failed });
    }

    setResults(finals);
    setStep("done");
    const ts = finals.reduce((s, r) => s + r.success, 0);
    const tf = finals.reduce((s, r) => s + r.failed, 0);
    if (ts > 0) { onUploaded(); toast.success(`${ts} records imported successfully!`); }
    if (tf > 0) toast.error(`${tf} records failed to import.`);
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div
        className="absolute inset-0 bg-black/75 backdrop-blur-sm"
        onClick={step !== "uploading" ? onClose : undefined}
      />
      <div className="relative w-full max-w-xl bg-[#13131f] border border-slate-700/50 rounded-2xl shadow-2xl overflow-hidden">

        {/* Modal header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <h3 className="text-white font-bold text-sm flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="#6366f1" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/>
            </svg>
            Import Data
          </h3>
          {step !== "uploading" && (
            <button onClick={onClose} className="text-slate-600 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          )}
        </div>

        <div className="px-6 py-5">

          {/* STEP: choose */}
          {step === "choose" && (
            <div className="space-y-4">
              <p className="text-slate-400 text-sm">Upload an Excel or CSV file. All sheets are auto-detected and categorised.</p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { l: "Excel / CSV",    i: "📊", d: ".xlsx, .xls, .csv" },
                  { l: "Google Sheets",  i: "📋", d: "Export as .xlsx first" },
                ].map((opt) => (
                  <button
                    key={opt.l}
                    onClick={() => fileRef.current?.click()}
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
                  {CATEGORIES.map((c) => (
                    <span key={c.id} className="text-xs px-2 py-0.5 rounded-full font-medium"
                      style={{ background: `${c.accent}15`, color: c.accent, border: `1px solid ${c.accent}25` }}>
                      {c.label}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP: preview */}
          {step === "preview" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-white font-semibold text-sm">Review Detected Data</p>
                <span className="text-slate-500 text-xs">{totalSel} records selected</span>
              </div>
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {plan.map((p, idx) => (
                  <div key={p.catId} className="rounded-xl border overflow-hidden"
                    style={{ borderColor: p.checked ? `${p.accent}30` : "#1e293b" }}>
                    <div
                      className="flex items-center gap-3 px-4 py-3 cursor-pointer select-none"
                      style={{ background: p.checked ? `${p.accent}08` : "#0f172a" }}
                      onClick={() => setPlan((prev) => prev.map((x, i) => i === idx ? { ...x, checked: !x.checked } : x))}>
                      <div className="w-4 h-4 rounded flex items-center justify-center shrink-0"
                        style={{ background: p.checked ? p.accent : "transparent", border: `1.5px solid ${p.checked ? p.accent : "#475569"}` }}>
                        {p.checked && (
                          <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="#fff" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
                          </svg>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-white text-sm font-semibold">{p.catLabel}</span>
                          <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                            style={{ background: `${p.accent}20`, color: p.accent }}>
                            {p.rows.length} records
                          </span>
                        </div>
                        <p className="text-slate-700 text-xs truncate">from: {p.sheets.join(", ")}</p>
                      </div>
                    </div>
                    {p.checked && (
                      <div className="border-t border-slate-800/30 divide-y divide-slate-800/20">
                        {p.rows.slice(0, 3).map((r, ri) => (
                          <div key={ri} className="px-4 py-1.5 flex gap-4 text-xs">
                            <span className="text-white font-medium w-36 truncate shrink-0">{r.name}</span>
                            <span className="text-slate-600 truncate">{r.email || r.phone || "—"}</span>
                          </div>
                        ))}
                        {p.rows.length > 3 && (
                          <p className="px-4 py-1 text-xs text-slate-700">+{p.rows.length - 3} more</p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <div className="flex gap-3 pt-1">
                <button onClick={() => setStep("choose")}
                  className="flex-1 py-2.5 rounded-lg text-sm font-medium text-slate-400 bg-slate-800/60 border border-slate-700/50 hover:text-white transition-all">
                  Back
                </button>
                <button onClick={handleUpload} disabled={totalSel === 0}
                  className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-white disabled:opacity-40 transition-all hover:-translate-y-0.5"
                  style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)", boxShadow: "0 4px 15px rgba(99,102,241,0.2)" }}>
                  Import {totalSel} Records
                </button>
              </div>
            </div>
          )}

          {/* STEP: validation-error */}
          {step === "validation-error" && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#f87171" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                  </svg>
                </div>
                <div>
                  <p className="text-white font-bold text-sm">Validation Errors</p>
                  <p className="text-slate-500 text-xs">Please fix the following errors before uploading</p>
                </div>
              </div>
              <div className="bg-slate-800/40 rounded-xl border border-red-500/20 max-h-52 overflow-y-auto divide-y divide-slate-800/30">
                {valErrors.map((e, i) => (
                  <div key={i} className="px-4 py-2 text-xs text-red-400">{e}</div>
                ))}
                {valErrors.length === 10 && (
                  <div className="px-4 py-2 text-xs text-slate-600">… and more errors. Please review the full file.</div>
                )}
              </div>
              <div className="flex gap-3">
                <button onClick={() => setStep("preview")}
                  className="flex-1 py-2.5 rounded-lg text-sm font-medium text-slate-400 bg-slate-800/60 border border-slate-700/50 hover:text-white transition-all">
                  Back to Preview
                </button>
                <button onClick={() => setStep("choose")}
                  className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-white"
                  style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)" }}>
                  Upload New File
                </button>
              </div>
            </div>
          )}

          {/* STEP: uploading */}
          {step === "uploading" && (
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
                {[["Category", upState.catLabel, false], ["Record", upState.record, true], ["Progress", `${upState.done} / ${upState.total}`, false]].map(([l, v, trunc]) => (
                  <div key={l} className="flex items-center justify-between text-xs">
                    <span className="text-slate-600 font-semibold uppercase tracking-wide">{l}</span>
                    <span className={`text-white font-medium ${trunc ? "truncate max-w-[200px]" : ""}`}>{v || "—"}</span>
                  </div>
                ))}
              </div>
              <div>
                <div className="flex justify-between text-xs mb-2">
                  <span className="text-slate-600">Upload progress</span>
                  <span className="text-white font-bold">{upState.pct}%</span>
                </div>
                <div className="bg-slate-800/60 rounded-full h-3 overflow-hidden border border-slate-700/30">
                  <div
                    className="h-full rounded-full relative overflow-hidden transition-all duration-300"
                    style={{ width: `${upState.pct}%`, background: "linear-gradient(90deg,#6366f1,#8b5cf6,#06b6d4)" }}>
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-pulse" />
                  </div>
                </div>
              </div>
              <div className="space-y-1">
                {plan.filter((p) => p.checked).map((p) => {
                  const isCur = p.catLabel === upState.catLabel;
                  return (
                    <div key={p.catId}
                      className="flex items-center gap-3 px-3 py-2 rounded-lg transition-all"
                      style={{ background: isCur ? `${p.accent}10` : "transparent", border: `1px solid ${isCur ? p.accent + "20" : "transparent"}` }}>
                      <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: isCur ? p.accent : "#374151" }} />
                      <span className="text-sm font-medium" style={{ color: isCur ? p.accent : "#4b5563" }}>{p.catLabel}</span>
                      <span className="text-xs ml-auto" style={{ color: isCur ? p.accent : "#374151" }}>{p.rows.length} records</span>
                      {isCur && <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" style={{ color: p.accent }} />}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP: done */}
          {step === "done" && (
            <div className="py-1 space-y-4">
              <div className="text-center">
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-3">
                  <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" fill="none" viewBox="0 0 24 24" stroke="#10b981" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                </div>
                <p className="text-white font-bold text-lg">Import Complete!</p>
                <p className="text-slate-600 text-xs mt-1">
                  {results.reduce((s, r) => s + r.success, 0)} records added successfully
                </p>
              </div>
              <div className="space-y-2">
                {results.map((r) => (
                  <div key={r.catLabel} className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-slate-800/40 border border-slate-700/30">
                    <span className="text-white text-sm font-medium">{r.catLabel}</span>
                    <div className="flex items-center gap-3 text-xs font-semibold">
                      {r.success > 0 && <span className="text-emerald-400">✓ {r.success} added</span>}
                      {r.failed  > 0 && <span className="text-red-400">✗ {r.failed} failed</span>}
                    </div>
                  </div>
                ))}
              </div>
              <button onClick={onClose} className="w-full py-2.5 rounded-lg text-sm font-semibold text-white"
                style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)" }}>
                Done
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
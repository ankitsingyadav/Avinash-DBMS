// admin/components/ImportModal.jsx
import { useState, useEffect, useRef } from "react";
import * as XLSX from "xlsx";
import toast from "react-hot-toast";
import axios from "../../utils/axios.js";
import { CATEGORIES, IMPORT_BATCH_SIZE } from "../constants.js";
import { parseWorkbook, validatePlan, buildPayload } from "../helpers.js";
import DuplicateReviewModal from "./Duplicatereviewmodal.jsx";

// ── Upload a single batch — tries bulk endpoint, falls back to sequential ─────
async function uploadBatch(endpoint, batch, fields) {
  const payloads = batch.map((r) => buildPayload(r, fields));

  try {
    const res  = await axios.post(`${endpoint}/bulk`, { records: payloads });
    // Read actual inserted/failed counts from the response — never assume success = batch.length
    const data = res.data?.data ?? res.data ?? {};
    return {
      success: data.inserted          ?? batch.length,
      failed:  data.failed            ?? 0,
      skipped: data.skippedDuplicates ?? 0,
      errors:  [],
    };
  } catch (bulkErr) {
    // 207 Multi-Status = partial success (some inserted, some failed/skipped)
    if (bulkErr?.response?.status === 207) {
      const data = bulkErr.response.data ?? {};
      return {
        success: data.inserted          ?? 0,
        failed:  data.failed            ?? 0,
        skipped: data.skippedDuplicates ?? 0,
        errors:  (data.errors ?? []).map((e) => ({ rowIndex: e.index, message: e.message })),
      };
    }

    const bulkMsg =
      bulkErr?.response?.data?.message ||
      bulkErr?.response?.data?.error   ||
      bulkErr?.message                 ||
      "bulk endpoint failed";

    console.warn(`[Import] Bulk endpoint failed (${endpoint}/bulk):`, bulkMsg);
    console.warn("[Import] Bulk error detail:", bulkErr?.response?.data);
  }

  // Sequential fallback
  let success = 0;
  let failed  = 0;
  const errors = [];

  for (let i = 0; i < batch.length; i++) {
    try {
      await axios.post(endpoint, payloads[i]);
      success++;
    } catch (singleErr) {
      failed++;
      const errMsg =
        singleErr?.response?.data?.message ||
        singleErr?.response?.data?.error   ||
        singleErr?.message                 ||
        "unknown error";

      errors.push({
        rowIndex: i,
        row:      batch[i],
        payload:  payloads[i],
        message:  errMsg,
        status:   singleErr?.response?.status,
      });

      console.group(`[Import] ✗ Row ${i + 1} failed — ${errMsg}`);
      console.log("Row data:", batch[i]);
      console.log("Payload sent:", payloads[i]);
      console.log("Server response:", singleErr?.response?.data);
      console.groupEnd();
    }
  }

  return { success, failed, skipped: 0, errors };
}

// ── Pre-flight duplicate check ────────────────────────────────────────────────
async function preflight(p) {
  if (!p.endpoint.includes("organisation")) {
    return { clean: p.rows, duplicates: [] };
  }

  const payloads = p.rows.map((r) => buildPayload(r, p.fields));

  try {
    const res = await axios.post(`${p.endpoint}/bulk/check-duplicates`, {
      records: payloads,
    });

    const { duplicates = [], intraBatch = [] } = res.data?.data ?? {};

    // Combine DB duplicates + within-file duplicates into one exclusion set
    const allDupIndices = new Set([
      ...duplicates.map((d) => d.index),
      ...intraBatch.map((d) => d.index),
    ]);
    const clean = p.rows.filter((_, i) => !allDupIndices.has(i));

    const enriched = duplicates.map((d) => ({
      ...d,
      incoming: payloads[d.index],
      catLabel:  p.catLabel,
      endpoint:  p.endpoint,
      fields:    p.fields,
    }));

    return { clean, duplicates: enriched, intraBatchCount: intraBatch.length };
  } catch (err) {
    console.warn("[Import] Pre-flight check failed, skipping dedup:", err?.response?.data ?? err.message);
    return { clean: p.rows, duplicates: [] };
  }
}

// ─────────────────────────────────────────────────────────────────────────────

export default function ImportModal({ isOpen, onClose, onUploaded }) {
  const [step,        setStep]      = useState("choose");
  const [plan,        setPlan]      = useState([]);
  const [upState,     setUpState]   = useState({ done: 0, total: 0, catLabel: "", record: "", pct: 0 });
  const [results,     setResults]   = useState([]);
  const [valErrors,   setValErrors] = useState([]);
  const [skippedRows, setSkippedRows] = useState([]);
  const [failLog,     setFailLog]   = useState([]);

  const [dupModalOpen,  setDupModalOpen]  = useState(false);
  const [allDuplicates, setAllDuplicates] = useState([]);
  const [cleanPlan,     setCleanPlan]     = useState([]);

  const fileRef = useRef();

  useEffect(() => {
    if (!isOpen) {
      setStep("choose");
      setPlan([]);
      setResults([]);
      setValErrors([]);
      setSkippedRows([]);
      setFailLog([]);
      setDupModalOpen(false);
      setAllDuplicates([]);
      setCleanPlan([]);
    }
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
          toast.error(
            "No recognisable data found. Ensure sheet names contain: Volunteers, Centres, Schools, Colleges, or NGOs."
          );
          return;
        }

        setPlan(detected);
        setStep("preview");
      } catch (err) {
        console.error("[Import] File parse error:", err);
        toast.error("Failed to parse file. Please check the format and try again.");
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const totalSel = plan
    .filter((p) => p.checked)
    .reduce((s, p) => s + p.rows.length, 0);

  // ── Pre-flight + upload ─────────────────────────────────────────────────────
  const handleUpload = async () => {
    const active = plan.filter((p) => p.checked);
    if (!active.length) return;

    // validatePlan now returns { cleanPlan, skipped } — never an array
    const { cleanPlan: validatedPlan, skipped } = validatePlan(active);
    if (skipped.length > 0) setSkippedRows(skipped);

    const totalValid = validatedPlan.reduce((s, p) => s + p.rows.length, 0);
    if (totalValid === 0) {
      // Every single row is invalid — block upload and show errors
      setValErrors(
        skipped.flatMap((s) =>
          s.reasons.map((r) => `${s.catLabel} — Row ${s.rowNum}: ${r}`)
        ).slice(0, 20)
      );
      setStep("validation-error");
      return;
    }

    setStep("checking");

    const preflightResults = await Promise.all(validatedPlan.map((p) => preflight(p)));

    const gathered = { duplicates: [], cleanPlans: [] };

    preflightResults.forEach((result, i) => {
      gathered.duplicates.push(...result.duplicates);
      if (result.clean.length > 0) {
        gathered.cleanPlans.push({ ...validatedPlan[i], rows: result.clean });
      }
    });

    if (gathered.duplicates.length > 0) {
      setAllDuplicates(gathered.duplicates);
      setCleanPlan(gathered.cleanPlans);
      // Show dup review FIRST. Upload of clean rows happens in handleDupDone.
      setDupModalOpen(true);
      setStep("preview");
      return;
    }

    await _runUpload(validatedPlan);
  };

  // ── Core upload runner ─────────────────────────────────────────────────────
  const _runUpload = async (activePlan) => {
    const total = activePlan.reduce((s, p) => s + p.rows.length, 0);
    if (total === 0) return;

    setUpState({ done: 0, total, catLabel: "", record: "", pct: 0 });
    setStep("uploading");

    const finals   = [];
    const allFails = [];
    let done = 0;

    for (const p of activePlan) {
      let catSuccess = 0;
      let catFailed  = 0;
      let catSkipped = 0;

      const batches = [];
      for (let i = 0; i < p.rows.length; i += IMPORT_BATCH_SIZE)
        batches.push(p.rows.slice(i, i + IMPORT_BATCH_SIZE));

      console.group(`[Import] Starting "${p.catLabel}" — ${p.rows.length} rows in ${batches.length} batch(es)`);

      for (let bi = 0; bi < batches.length; bi++) {
        const batch = batches[bi];
        const firstRecord = batch[0]?.centreName || batch[0]?.name || `Batch ${bi + 1}`;

        setUpState((prev) => ({ ...prev, catLabel: p.catLabel, record: firstRecord }));

        const { success, failed, skipped = 0, errors: batchErrors } = await uploadBatch(p.endpoint, batch, p.fields);

        catSuccess += success;
        catFailed  += failed;
        catSkipped += skipped;

        if (batchErrors.length) {
          allFails.push(...batchErrors.map((e) => ({ category: p.catLabel, ...e })));
        }

        done += batch.length;
        setUpState((prev) => ({ ...prev, done, pct: Math.round((done / total) * 100) }));
      }

      console.log(`[Import] "${p.catLabel}" done — ✓ ${catSuccess} inserted, ✗ ${catFailed} failed, ⟳ ${catSkipped} skipped duplicates`);
      console.groupEnd();

      finals.push({ catLabel: p.catLabel, accent: p.accent, success: catSuccess, failed: catFailed, skipped: catSkipped });
    }

    setResults((prev) => {
      const merged = [...prev];
      for (const f of finals) {
        const existing = merged.find((r) => r.catLabel === f.catLabel);
        if (existing) {
          existing.success  += f.success;
          existing.failed   += f.failed;
          existing.skipped   = (existing.skipped ?? 0) + (f.skipped ?? 0);
        } else {
          merged.push(f);
        }
      }
      return merged;
    });

    setFailLog((prev) => [...prev, ...allFails]);
    setStep("done");

    const ts = finals.reduce((s, r) => s + r.success, 0);
    const tf = finals.reduce((s, r) => s + r.failed,  0);
    const tk = finals.reduce((s, r) => s + (r.skipped ?? 0), 0);

    if (ts > 0) { onUploaded(); toast.success(`${ts} records imported successfully!`); }
    else if (tk > 0) toast(`All ${tk} records are already in the database — nothing new to import.`, { icon: "⚠️" });
    if (tf > 0) toast.error(`${tf} records failed — see details below.`);
  };

  const handleDupDone = async (processedCount) => {
    setDupModalOpen(false);
    if (processedCount > 0) onUploaded();

    if (cleanPlan.length > 0) {
      // Upload the clean (non-duplicate) rows now that user has reviewed dups
      await _runUpload(cleanPlan);
    } else {
      // All records were duplicates — compose the done screen from dup counts
      const catGroups = {};
      for (const d of allDuplicates) {
        const key = d.catLabel || "Centres";
        if (!catGroups[key]) catGroups[key] = { catLabel: key, accent: "#8b5cf6", success: 0, failed: 0, skipped: 0 };
        catGroups[key].skipped++;
      }
      // processedCount items were inserted/merged rather than skipped
      const firstCat = Object.values(catGroups)[0];
      if (firstCat) {
        firstCat.skipped   = Math.max(0, firstCat.skipped - processedCount);
        firstCat.success   = processedCount;
      }
      setResults(Object.values(catGroups));
      setStep("done");
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
        <div
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          onClick={step !== "uploading" && step !== "checking" ? onClose : undefined}
        />
        <div className="relative w-full max-w-xl bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden">

          {/* Modal header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <h3 className="text-slate-900 font-bold text-sm flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="#6366f1" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/>
              </svg>
              Import Data
            </h3>
            {step !== "uploading" && step !== "checking" && (
              <button
                onClick={onClose}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            )}
          </div>

          <div className="px-6 py-5 bg-slate-50">

            {/* ── STEP: choose ──────────────────────────────────────────────── */}
            {step === "choose" && (
              <div className="space-y-4">
                <p className="text-slate-500 text-sm">
                  Upload an Excel or CSV file. All sheets are auto-detected and categorised.
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { l: "Excel / CSV",   i: "📊", d: ".xlsx, .xls, .csv" },
                    { l: "Google Sheets", i: "📋", d: "Export as .xlsx first" },
                  ].map((opt) => (
                    <button
                      key={opt.l}
                      onClick={() => fileRef.current?.click()}
                      className="flex flex-col items-center gap-2 p-5 rounded-xl border border-slate-200 hover:border-indigo-300 bg-white hover:bg-indigo-50/50 transition-all text-center shadow-sm"
                    >
                      <span className="text-3xl">{opt.i}</span>
                      <span className="text-slate-800 text-sm font-semibold">{opt.l}</span>
                      <span className="text-slate-400 text-xs">{opt.d}</span>
                    </button>
                  ))}
                </div>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  className="hidden"
                  onChange={handleFile}
                />
                <div className="bg-white rounded-xl p-3 border border-slate-200 shadow-sm">
                  <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
                    Auto-detects:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {CATEGORIES.map((c) => (
                      <span
                        key={c.id}
                        className="text-xs px-2 py-0.5 rounded-full font-medium"
                        style={{ background: `${c.accent}12`, color: c.accent, border: `1px solid ${c.accent}25` }}
                      >
                        {c.label}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ── STEP: preview ─────────────────────────────────────────────── */}
            {step === "preview" && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-slate-800 font-semibold text-sm">Review Detected Data</p>
                  <span className="text-slate-400 text-xs">{totalSel} records selected</span>
                </div>
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {plan.map((p, idx) => (
                    <div
                      key={p.catId}
                      className="rounded-xl border overflow-hidden shadow-sm"
                      style={{ borderColor: p.checked ? `${p.accent}30` : "#e2e8f0" }}
                    >
                      <div
                        className="flex items-center gap-3 px-4 py-3 cursor-pointer select-none"
                        style={{ background: p.checked ? `${p.accent}08` : "#fff" }}
                        onClick={() =>
                          setPlan((prev) =>
                            prev.map((x, i) => (i === idx ? { ...x, checked: !x.checked } : x))
                          )
                        }
                      >
                        <div
                          className="w-4 h-4 rounded flex items-center justify-center shrink-0"
                          style={{
                            background: p.checked ? p.accent : "transparent",
                            border: `1.5px solid ${p.checked ? p.accent : "#cbd5e1"}`,
                          }}
                        >
                          {p.checked && (
                            <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="#fff" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
                            </svg>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-slate-800 text-sm font-semibold">{p.catLabel}</span>
                            <span
                              className="text-xs px-2 py-0.5 rounded-full font-semibold"
                              style={{ background: `${p.accent}15`, color: p.accent }}
                            >
                              {p.rows.length} records
                            </span>
                          </div>
                          <p className="text-slate-400 text-xs truncate">
                            from: {p.sheets.join(", ")}
                          </p>
                        </div>
                      </div>

                      {p.checked && (
                        <div className="border-t border-slate-100 divide-y divide-slate-100">
                          {p.rows.slice(0, 3).map((r, ri) => (
                            <div key={ri} className="px-4 py-1.5 flex gap-4 text-xs bg-white">
                              <span className="text-slate-700 font-medium w-36 truncate shrink-0">
                                {r.centreName || r.name || "—"}
                              </span>
                              <span className="text-slate-400 truncate">
                                {r.email || r.phone || "—"}
                              </span>
                            </div>
                          ))}
                          {p.rows.length > 3 && (
                            <p className="px-4 py-1 text-xs text-slate-400 bg-white">
                              +{p.rows.length - 3} more
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <div className="flex gap-3 pt-1">
                  <button
                    onClick={() => setStep("choose")}
                    className="flex-1 py-2.5 rounded-lg text-sm font-medium text-slate-500 bg-white border border-slate-200 hover:bg-slate-50 hover:text-slate-700 transition-all"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleUpload}
                    disabled={totalSel === 0}
                    className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-white disabled:opacity-40 transition-all hover:-translate-y-0.5"
                    style={{
                      background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
                      boxShadow: "0 4px 15px rgba(99,102,241,0.25)",
                    }}
                  >
                    Import {totalSel} Records
                  </button>
                </div>
              </div>
            )}

            {/* ── STEP: checking ────────────────────────────────────────────── */}
            {step === "checking" && (
              <div className="py-6 flex flex-col items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center">
                  <div className="w-6 h-6 border-2 border-indigo-200 border-t-indigo-500 rounded-full animate-spin" />
                </div>
                <div className="text-center">
                  <p className="text-slate-800 font-bold text-sm">Checking for duplicates…</p>
                  <p className="text-slate-400 text-xs mt-1">Scanning database before import</p>
                </div>
              </div>
            )}

            {/* ── STEP: validation-error ────────────────────────────────────── */}
            {step === "validation-error" && (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-red-50 border border-red-200 flex items-center justify-center shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#f87171" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                    </svg>
                  </div>
                  <div>
                    <p className="text-slate-800 font-bold text-sm">Validation Errors</p>
                    <p className="text-slate-400 text-xs">
                      Please fix the following errors before uploading
                    </p>
                  </div>
                </div>
                <div className="bg-red-50 rounded-xl border border-red-200 max-h-52 overflow-y-auto divide-y divide-red-100">
                  {valErrors.map((e, i) => (
                    <div key={i} className="px-4 py-2 text-xs text-red-500">{e}</div>
                  ))}
                  {valErrors.length >= 20 && (
                    <div className="px-4 py-2 text-xs text-slate-400">
                      … and more errors. Please review the full file.
                    </div>
                  )}
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setStep("preview")}
                    className="flex-1 py-2.5 rounded-lg text-sm font-medium text-slate-500 bg-white border border-slate-200 hover:bg-slate-50 transition-all"
                  >
                    Back to Preview
                  </button>
                  <button
                    onClick={() => setStep("choose")}
                    className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-white"
                    style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)" }}
                  >
                    Upload New File
                  </button>
                </div>
              </div>
            )}

            {/* ── STEP: uploading ───────────────────────────────────────────── */}
            {step === "uploading" && (
              <div className="py-1 space-y-5">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center shrink-0">
                    <div className="w-6 h-6 border-2 border-indigo-200 border-t-indigo-500 rounded-full animate-spin" />
                  </div>
                  <div>
                    <p className="text-slate-800 font-bold text-sm">Importing data…</p>
                    <p className="text-slate-400 text-xs mt-0.5">Do not close this window</p>
                  </div>
                </div>

                <div className="bg-white rounded-xl px-4 py-3 space-y-2 border border-slate-200 shadow-sm">
                  {[
                    ["Category", upState.catLabel, false],
                    ["Record",   upState.record,   true ],
                    ["Progress", `${upState.done} / ${upState.total}`, false],
                  ].map(([l, v, trunc]) => (
                    <div key={l} className="flex items-center justify-between text-xs">
                      <span className="text-slate-400 font-semibold uppercase tracking-wide">{l}</span>
                      <span className={`text-slate-800 font-medium ${trunc ? "truncate max-w-[200px]" : ""}`}>
                        {v || "—"}
                      </span>
                    </div>
                  ))}
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-2">
                    <span className="text-slate-400">Upload progress</span>
                    <span className="text-slate-800 font-bold">{upState.pct}%</span>
                  </div>
                  <div className="bg-slate-200 rounded-full h-3 overflow-hidden">
                    <div
                      className="h-full rounded-full relative overflow-hidden transition-all duration-300"
                      style={{
                        width: `${upState.pct}%`,
                        background: "linear-gradient(90deg,#6366f1,#8b5cf6,#06b6d4)",
                      }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" />
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  {plan.filter((p) => p.checked).map((p) => {
                    const isCur = p.catLabel === upState.catLabel;
                    return (
                      <div
                        key={p.catId}
                        className="flex items-center gap-3 px-3 py-2 rounded-lg transition-all"
                        style={{
                          background: isCur ? `${p.accent}08` : "#f8fafc",
                          border:     `1px solid ${isCur ? p.accent + "25" : "#e2e8f0"}`,
                        }}
                      >
                        <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: isCur ? p.accent : "#cbd5e1" }} />
                        <span className="text-sm font-medium" style={{ color: isCur ? p.accent : "#94a3b8" }}>
                          {p.catLabel}
                        </span>
                        <span className="text-xs ml-auto" style={{ color: isCur ? p.accent : "#94a3b8" }}>
                          {p.rows.length} records
                        </span>
                        {isCur && (
                          <div
                            className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin"
                            style={{ color: p.accent }}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── STEP: done ────────────────────────────────────────────────── */}
            {step === "done" && (
              <div className="py-1 space-y-4">
                <div className="text-center">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto mb-3">
                    <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" fill="none" viewBox="0 0 24 24" stroke="#10b981" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                  </div>
                  <p className="text-slate-800 font-bold text-lg">Import Complete!</p>
                  <p className="text-slate-400 text-xs mt-1">
                    {results.reduce((s, r) => s + r.success, 0)} records added successfully
                  </p>
                </div>

                <div className="space-y-2">
                  {results.map((r) => (
                    <div
                      key={r.catLabel}
                      className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-white border border-slate-200 shadow-sm"
                    >
                      <span className="text-slate-700 text-sm font-medium">{r.catLabel}</span>
                      <div className="flex items-center gap-3 text-xs font-semibold">
                        {r.success > 0 && <span className="text-emerald-600">✓ {r.success} added</span>}
                        {(r.skipped ?? 0) > 0 && <span className="text-amber-600">⟳ {r.skipped} duplicate{r.skipped !== 1 ? "s" : ""} skipped</span>}
                        {r.failed  > 0 && <span className="text-red-500">✗ {r.failed} failed</span>}
                      </div>
                    </div>
                  ))}
                </div>

                {failLog.length > 0 && (
                  <details className="group">
                    <summary className="text-xs text-red-500 cursor-pointer select-none flex items-center gap-1.5 py-1">
                      <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
                        className="transition-transform group-open:rotate-90">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/>
                      </svg>
                      Show {failLog.length} failure detail{failLog.length > 1 ? "s" : ""}
                      <span className="text-slate-400 ml-1">(also visible in browser console)</span>
                    </summary>
                    <div className="mt-2 bg-red-50 rounded-xl border border-red-200 max-h-40 overflow-y-auto divide-y divide-red-100">
                      {failLog.map((f, i) => (
                        <div key={i} className="px-3 py-2 text-xs">
                          <span className="text-red-500 font-semibold">{f.category}</span>
                          <span className="text-slate-400 mx-1">·</span>
                          <span className="text-slate-600">{f.row?.centreName || f.row?.name || `Row ${f.rowIndex + 1}`}</span>
                          <span className="text-slate-400 mx-1">—</span>
                          <span className="text-red-400">{f.message}</span>
                          {f.status && (
                            <span className="ml-1 text-slate-400">[HTTP {f.status}]</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </details>
                )}

                <button
                  onClick={onClose}
                  className="w-full py-2.5 rounded-lg text-sm font-semibold text-white"
                  style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)" }}
                >
                  Done
                </button>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* ── Duplicate Review Modal ─────────────────────────────────────────── */}
      <DuplicateReviewModal
        isOpen={dupModalOpen}
        onClose={() => setDupModalOpen(false)}
        onDone={handleDupDone}
        duplicates={allDuplicates}
      />
    </>
  );
}
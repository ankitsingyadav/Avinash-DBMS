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
    await axios.post(`${endpoint}/bulk`, { records: payloads });
    return { success: batch.length, failed: 0, errors: [] };
  } catch (bulkErr) {
    const bulkMsg =
      bulkErr?.response?.data?.message ||
      bulkErr?.response?.data?.error   ||
      bulkErr?.message                 ||
      "bulk endpoint failed";

    console.warn(`[Import] Bulk endpoint failed (${endpoint}/bulk):`, bulkMsg);
    console.warn("[Import] Bulk error detail:", bulkErr?.response?.data);
  }

  // Fallback: sequential individual requests
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

  return { success, failed, errors };
}

// ── Run pre-flight duplicate check for ONE category plan ─────────────────────
// Returns { clean: Row[], duplicates: DuplicateEntry[] }
// Only organisation-type endpoints support /bulk/check-duplicates.
// Volunteer endpoint pe skip karo (no dedup needed — phone/email unique hain).
async function preflight(p) {
  // Sirf organisation endpoints pe check karo
  if (!p.endpoint.includes("organisation")) {
    return { clean: p.rows, duplicates: [] };
  }

  const payloads = p.rows.map((r) => buildPayload(r, p.fields));

  try {
    const res = await axios.post(`${p.endpoint}/bulk/check-duplicates`, {
      records: payloads,
    });

    const { duplicates = [], cleanCount } = res.data?.data ?? {};

    // Map duplicate indices back to original rows
    const dupSet = new Set(duplicates.map((d) => d.index));
    const clean  = p.rows.filter((_, i) => !dupSet.has(i));

    // Enrich duplicates with the category metadata needed by DuplicateReviewModal
    const enriched = duplicates.map((d) => ({
      ...d,
      incoming: payloads[d.index],  // use built payload (has all normalised fields)
      catLabel:  p.catLabel,
      endpoint:  p.endpoint,
      fields:    p.fields,
    }));

    console.log(
      `[Import] Pre-flight "${p.catLabel}": ${clean.length} clean, ${enriched.length} duplicates`
    );

    return { clean, duplicates: enriched };
  } catch (err) {
    // If check-duplicates endpoint is unavailable, proceed without check
    console.warn("[Import] Pre-flight check failed, skipping dedup:", err?.response?.data ?? err.message);
    return { clean: p.rows, duplicates: [] };
  }
}

// ─────────────────────────────────────────────────────────────────────────────

export default function ImportModal({ isOpen, onClose, onUploaded }) {
  const [step,      setStep]      = useState("choose");
  const [plan,      setPlan]      = useState([]);
  const [upState,   setUpState]   = useState({ done: 0, total: 0, catLabel: "", record: "", pct: 0 });
  const [results,   setResults]   = useState([]);
  const [valErrors, setValErrors] = useState([]);
  const [failLog,   setFailLog]   = useState([]);

  // ── Duplicate review state ────────────────────────────────────────────────
  const [dupModalOpen,  setDupModalOpen]  = useState(false);
  const [allDuplicates, setAllDuplicates] = useState([]); // enriched dup entries
  const [cleanPlan,     setCleanPlan]     = useState([]); // plan items with only non-dup rows

  const fileRef = useRef();

  useEffect(() => {
    if (!isOpen) {
      setStep("choose");
      setPlan([]);
      setResults([]);
      setValErrors([]);
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

        detected.forEach((d) => {
          console.log(
            `[Import] Detected "${d.catLabel}" — ${d.rows.length} rows from sheets: ${d.sheets.join(", ")}`
          );
          if (d.rows.length > 0) console.log("[Import] Sample row:", d.rows[0]);
        });

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

    // 1. Validate
    const errors = validatePlan(active);
    if (errors.length > 0) {
      setValErrors(errors.slice(0, 20));
      setStep("validation-error");
      return;
    }

    // 2. Pre-flight duplicate check (show checking state briefly)
    setStep("checking");

    const preflightResults = await Promise.all(active.map((p) => preflight(p)));

    const gathered = {
      duplicates: [],
      cleanPlans:  [],
    };

preflightResults.forEach((result, i) => {
      gathered.duplicates.push(...result.duplicates);
      if (result.clean.length > 0) {
        gathered.cleanPlans.push({ ...active[i], rows: result.clean });
      }
    });

    // 3. If duplicates found — show review modal, pause upload
    if (gathered.duplicates.length > 0) {
      setAllDuplicates(gathered.duplicates);
      setCleanPlan(gathered.cleanPlans);
      setStep("preview"); // go back to preview so modal overlays cleanly
      setDupModalOpen(true);

      // Actually start uploading the clean records while user reviews duplicates
      if (gathered.cleanPlans.length > 0) {
        _runUpload(gathered.cleanPlans);
      }
      return;
    }

    // 4. No duplicates — upload everything
    await _runUpload(active);
  };

  // ── Core upload runner (used both directly and after dedup review) ─────────
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

      const batches = [];
      for (let i = 0; i < p.rows.length; i += IMPORT_BATCH_SIZE)
        batches.push(p.rows.slice(i, i + IMPORT_BATCH_SIZE));

      console.group(`[Import] Starting "${p.catLabel}" — ${p.rows.length} rows in ${batches.length} batch(es)`);

      for (let bi = 0; bi < batches.length; bi++) {
        const batch = batches[bi];
        const firstRecord = batch[0]?.centreName || batch[0]?.name || `Batch ${bi + 1}`;

        setUpState((prev) => ({
          ...prev,
          catLabel: p.catLabel,
          record:   firstRecord,
        }));

        const { success, failed, errors: batchErrors } = await uploadBatch(
          p.endpoint,
          batch,
          p.fields
        );

        catSuccess += success;
        catFailed  += failed;

        if (batchErrors.length) {
          allFails.push(
            ...batchErrors.map((e) => ({ category: p.catLabel, ...e }))
          );
        }

        done += batch.length;
        setUpState((prev) => ({
          ...prev,
          done,
          pct: Math.round((done / total) * 100),
        }));
      }

      console.log(`[Import] "${p.catLabel}" done — ✓ ${catSuccess} succeeded, ✗ ${catFailed} failed`);
      console.groupEnd();

      finals.push({ catLabel: p.catLabel, accent: p.accent, success: catSuccess, failed: catFailed });
    }

    setResults((prev) => {
      // Merge with any existing results (e.g. from force-insert pass)
      const merged = [...prev];
      for (const f of finals) {
        const existing = merged.find((r) => r.catLabel === f.catLabel);
        if (existing) {
          existing.success += f.success;
          existing.failed  += f.failed;
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

    if (ts > 0) { onUploaded(); toast.success(`${ts} records imported successfully!`); }
    if (tf > 0) toast.error(`${tf} records failed — see details below.`);
  };

  // ── After user reviews duplicates ───────────────────────────────────────────
  const handleDupDone = (forceInsertedCount) => {
    setDupModalOpen(false);
    // If clean records are still uploading, step is already "uploading".
    // If upload finished already, show done screen.
    // Toast was already shown inside DuplicateReviewModal.
    if (forceInsertedCount > 0) onUploaded();
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
        <div
          className="absolute inset-0 bg-black/75 backdrop-blur-sm"
          onClick={step !== "uploading" && step !== "checking" ? onClose : undefined}
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
            {step !== "uploading" && step !== "checking" && (
              <button
                onClick={onClose}
                className="text-slate-600 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            )}
          </div>

          <div className="px-6 py-5">

            {/* ── STEP: choose ──────────────────────────────────────────────── */}
            {step === "choose" && (
              <div className="space-y-4">
                <p className="text-slate-400 text-sm">
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
                      className="flex flex-col items-center gap-2 p-5 rounded-xl border border-slate-700/50 hover:border-indigo-500/40 bg-slate-800/30 hover:bg-slate-800/60 transition-all text-center"
                    >
                      <span className="text-3xl">{opt.i}</span>
                      <span className="text-white text-sm font-semibold">{opt.l}</span>
                      <span className="text-slate-600 text-xs">{opt.d}</span>
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
                <div className="bg-slate-800/30 rounded-xl p-3 border border-slate-700/30">
                  <p className="text-slate-600 text-xs font-semibold uppercase tracking-wider mb-2">
                    Auto-detects:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {CATEGORIES.map((c) => (
                      <span
                        key={c.id}
                        className="text-xs px-2 py-0.5 rounded-full font-medium"
                        style={{ background: `${c.accent}15`, color: c.accent, border: `1px solid ${c.accent}25` }}
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
                  <p className="text-white font-semibold text-sm">Review Detected Data</p>
                  <span className="text-slate-500 text-xs">{totalSel} records selected</span>
                </div>
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {plan.map((p, idx) => (
                    <div
                      key={p.catId}
                      className="rounded-xl border overflow-hidden"
                      style={{ borderColor: p.checked ? `${p.accent}30` : "#1e293b" }}
                    >
                      <div
                        className="flex items-center gap-3 px-4 py-3 cursor-pointer select-none"
                        style={{ background: p.checked ? `${p.accent}08` : "#0f172a" }}
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
                            border: `1.5px solid ${p.checked ? p.accent : "#475569"}`,
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
                            <span className="text-white text-sm font-semibold">{p.catLabel}</span>
                            <span
                              className="text-xs px-2 py-0.5 rounded-full font-semibold"
                              style={{ background: `${p.accent}20`, color: p.accent }}
                            >
                              {p.rows.length} records
                            </span>
                          </div>
                          <p className="text-slate-700 text-xs truncate">
                            from: {p.sheets.join(", ")}
                          </p>
                        </div>
                      </div>

                      {p.checked && (
                        <div className="border-t border-slate-800/30 divide-y divide-slate-800/20">
                          {p.rows.slice(0, 3).map((r, ri) => (
                            <div key={ri} className="px-4 py-1.5 flex gap-4 text-xs">
                              <span className="text-white font-medium w-36 truncate shrink-0">
                                {r.centreName || r.name || "—"}
                              </span>
                              <span className="text-slate-600 truncate">
                                {r.email || r.phone || "—"}
                              </span>
                            </div>
                          ))}
                          {p.rows.length > 3 && (
                            <p className="px-4 py-1 text-xs text-slate-700">
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
                    className="flex-1 py-2.5 rounded-lg text-sm font-medium text-slate-400 bg-slate-800/60 border border-slate-700/50 hover:text-white transition-all"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleUpload}
                    disabled={totalSel === 0}
                    className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-white disabled:opacity-40 transition-all hover:-translate-y-0.5"
                    style={{
                      background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
                      boxShadow: "0 4px 15px rgba(99,102,241,0.2)",
                    }}
                  >
                    Import {totalSel} Records
                  </button>
                </div>
              </div>
            )}

            {/* ── STEP: checking (pre-flight) ───────────────────────────────── */}
            {step === "checking" && (
              <div className="py-6 flex flex-col items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                  <div className="w-6 h-6 border-2 border-indigo-500/30 border-t-indigo-400 rounded-full animate-spin" />
                </div>
                <div className="text-center">
                  <p className="text-white font-bold text-sm">Checking for duplicates…</p>
                  <p className="text-slate-600 text-xs mt-1">Scanning database before import</p>
                </div>
              </div>
            )}

            {/* ── STEP: validation-error ────────────────────────────────────── */}
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
                    <p className="text-slate-500 text-xs">
                      Please fix the following errors before uploading
                    </p>
                  </div>
                </div>
                <div className="bg-slate-800/40 rounded-xl border border-red-500/20 max-h-52 overflow-y-auto divide-y divide-slate-800/30">
                  {valErrors.map((e, i) => (
                    <div key={i} className="px-4 py-2 text-xs text-red-400">{e}</div>
                  ))}
                  {valErrors.length >= 20 && (
                    <div className="px-4 py-2 text-xs text-slate-600">
                      … and more errors. Please review the full file.
                    </div>
                  )}
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setStep("preview")}
                    className="flex-1 py-2.5 rounded-lg text-sm font-medium text-slate-400 bg-slate-800/60 border border-slate-700/50 hover:text-white transition-all"
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
                  <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0">
                    <div className="w-6 h-6 border-2 border-indigo-500/30 border-t-indigo-400 rounded-full animate-spin" />
                  </div>
                  <div>
                    <p className="text-white font-bold text-sm">Importing data…</p>
                    <p className="text-slate-600 text-xs mt-0.5">Do not close this window</p>
                  </div>
                </div>

                <div className="bg-slate-800/40 rounded-xl px-4 py-3 space-y-2 border border-slate-800">
                  {[
                    ["Category", upState.catLabel, false],
                    ["Record",   upState.record,   true ],
                    ["Progress", `${upState.done} / ${upState.total}`, false],
                  ].map(([l, v, trunc]) => (
                    <div key={l} className="flex items-center justify-between text-xs">
                      <span className="text-slate-600 font-semibold uppercase tracking-wide">{l}</span>
                      <span className={`text-white font-medium ${trunc ? "truncate max-w-[200px]" : ""}`}>
                        {v || "—"}
                      </span>
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
                      style={{
                        width: `${upState.pct}%`,
                        background: "linear-gradient(90deg,#6366f1,#8b5cf6,#06b6d4)",
                      }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-pulse" />
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
                          background: isCur ? `${p.accent}10` : "transparent",
                          border:     `1px solid ${isCur ? p.accent + "20" : "transparent"}`,
                        }}
                      >
                        <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: isCur ? p.accent : "#374151" }} />
                        <span className="text-sm font-medium" style={{ color: isCur ? p.accent : "#4b5563" }}>
                          {p.catLabel}
                        </span>
                        <span className="text-xs ml-auto" style={{ color: isCur ? p.accent : "#374151" }}>
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
                    <div
                      key={r.catLabel}
                      className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-slate-800/40 border border-slate-700/30"
                    >
                      <span className="text-white text-sm font-medium">{r.catLabel}</span>
                      <div className="flex items-center gap-3 text-xs font-semibold">
                        {r.success > 0 && <span className="text-emerald-400">✓ {r.success} added</span>}
                        {r.failed  > 0 && <span className="text-red-400">✗ {r.failed} failed</span>}
                      </div>
                    </div>
                  ))}
                </div>

                {failLog.length > 0 && (
                  <details className="group">
                    <summary className="text-xs text-red-400 cursor-pointer select-none flex items-center gap-1.5 py-1">
                      <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
                        className="transition-transform group-open:rotate-90">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/>
                      </svg>
                      Show {failLog.length} failure detail{failLog.length > 1 ? "s" : ""}
                      <span className="text-slate-600 ml-1">(also visible in browser console)</span>
                    </summary>
                    <div className="mt-2 bg-slate-800/40 rounded-xl border border-red-500/20 max-h-40 overflow-y-auto divide-y divide-slate-800/30">
                      {failLog.map((f, i) => (
                        <div key={i} className="px-3 py-2 text-xs">
                          <span className="text-red-400 font-semibold">{f.category}</span>
                          <span className="text-slate-500 mx-1">·</span>
                          <span className="text-slate-400">{f.row?.centreName || f.row?.name || `Row ${f.rowIndex + 1}`}</span>
                          <span className="text-slate-500 mx-1">—</span>
                          <span className="text-red-300">{f.message}</span>
                          {f.status && (
                            <span className="ml-1 text-slate-600">[HTTP {f.status}]</span>
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

      {/* ── Duplicate Review Modal (overlaid on top) ─────────────────────────── */}
      <DuplicateReviewModal
        isOpen={dupModalOpen}
        onClose={() => setDupModalOpen(false)}
        onDone={handleDupDone}
        duplicates={allDuplicates}
      />
    </>
  );
}
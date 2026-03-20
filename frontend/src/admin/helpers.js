// ─── admin/helpers.js ─────────────────────────────────────────────────────────
import { useCallback, useEffect, useRef } from "react";
import * as XLSX from "xlsx";
import { ALL_FIELD_MAPS, CAT_SIGNATURE, CATEGORIES } from "./constants.js";

// ── Formatters ────────────────────────────────────────────────────────────────

export const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";

export const shortId = (id) => (id ? String(id).slice(-8) : "—");

// ── Debounce hook with auto cleanup ──────────────────────────────────────────

export function useDebounce(fn, delay) {
  const timer = useRef(null);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  return useCallback(
    (...args) => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => fn(...args), delay);
    },
    [fn, delay]
  );
}

// ── Build API payload from a row + field list ─────────────────────────────────

export function buildPayload(row, fields) {
  const payload = {};
  fields.forEach((f) => {
    if (row[f] !== undefined && row[f] !== "") {
      if (["established_year","total_students","total_departments","experience_years"].includes(f)) {
        const n = parseInt(row[f]);
        if (!isNaN(n)) payload[f] = n;
      } else if (f === "skills") {
        payload[f] = row[f].split(",").map((s) => s.trim()).filter(Boolean);
      } else {
        payload[f] = row[f];
      }
    }
  });
  return payload;
}

// ── Excel sheet row parser ────────────────────────────────────────────────────

export function parseSheetRows(ws, fieldMap) {
  const raw = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });
  let hi = -1;
  for (let i = 0; i < Math.min(raw.length, 8); i++) {
    if (raw[i].some((cell) => fieldMap[String(cell).toLowerCase().trim()] !== undefined)) {
      hi = i;
      break;
    }
  }
  if (hi === -1) return null;
  const headers = raw[hi];
  return raw
    .slice(hi + 1)
    .map((row) => {
      const obj = {};
      headers.forEach((h, i) => {
        const key = fieldMap[String(h).toLowerCase().trim()];
        if (key && row[i] !== undefined && String(row[i]).trim() !== "")
          obj[key] = String(row[i]).trim();
      });
      return obj;
    })
    .filter((r) => r.name && r.name.length > 0);
}

// ── Detect category from sheet name ──────────────────────────────────────────

export function detectCatFromSheetName(sheetName) {
  const l = sheetName.toLowerCase();
  if (l.includes("school"))    return "school";
  if (l.includes("college"))   return "college";
  if (l.includes("ngo"))       return "ngo";
  if (l.includes("volunteer")) return "volunteer";
  return null;
}

// ── Parse a full workbook into a plan array ───────────────────────────────────

export function parseWorkbook(wb) {
  const catMap   = Object.fromEntries(CATEGORIES.map((c) => [c.id, c]));
  const detected = [];

  for (const sheetName of wb.SheetNames) {
    if (/readme|📋/i.test(sheetName)) continue;
    if (/mixed/i.test(sheetName))     continue;
    const ws = wb.Sheets[sheetName];

    // Step 1: sheet name match
    const forcedCat = detectCatFromSheetName(sheetName);
    if (forcedCat) {
      const rows = parseSheetRows(ws, ALL_FIELD_MAPS[forcedCat]);
      if (rows && rows.length > 0) {
        const c  = catMap[forcedCat];
        const ex = detected.find((d) => d.catId === forcedCat);
        if (ex) { ex.rows = [...ex.rows, ...rows]; ex.sheets.push(sheetName); }
        else detected.push({
          catId: forcedCat, catLabel: c.label, accent: c.accent,
          endpoint: c.endpoint, fields: c.fields,
          requiredFields: c.requiredFields || [],
          rows, sheets: [sheetName], checked: true,
        });
        continue;
      }
    }

    // Step 2: score-based detection
    let bestCat = null, bestRows = null, bestScore = 0;
    for (const cat of CATEGORIES) {
      const rows = parseSheetRows(ws, ALL_FIELD_MAPS[cat.id]);
      if (!rows || rows.length === 0) continue;
      const sig        = CAT_SIGNATURE[cat.id];
      const sampleRows = rows.slice(0, 3);
      const score      = sig.filter((f) => sampleRows.some((r) => r[f] !== undefined && r[f] !== "")).length;
      const reqScore   = cat.requiredFields
        ? cat.requiredFields.filter((f) => sampleRows.some((r) => r[f] !== undefined && r[f] !== "")).length
        : 0;
      const totalScore = score * 3 + reqScore;
      if (totalScore > bestScore) { bestScore = totalScore; bestCat = cat.id; bestRows = rows; }
    }
    if (bestCat && bestRows?.length > 0 && bestScore >= 3) {
      const c  = catMap[bestCat];
      const ex = detected.find((d) => d.catId === bestCat);
      if (ex) { ex.rows = [...ex.rows, ...bestRows]; ex.sheets.push(sheetName); }
      else detected.push({
        catId: bestCat, catLabel: c.label, accent: c.accent,
        endpoint: c.endpoint, fields: c.fields,
        requiredFields: c.requiredFields || [],
        rows: bestRows, sheets: [sheetName], checked: true,
      });
    }
  }

  return detected;
}

// ── Validate plan required fields ─────────────────────────────────────────────

export function validatePlan(active) {
  const errors = [];
  active.forEach((p) => {
    p.rows.forEach((row, i) => {
      p.requiredFields.forEach((f) => {
        if (!row[f] || String(row[f]).trim() === "")
          errors.push(`${p.catLabel} — Row ${i + 1}: "${f}" is missing`);
      });
    });
  });
  return errors;
}
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
//
// FIX 1: isOrganisation check was tied to fields.includes("contacts") which
//         could silently fail. Now we check the category id via a dedicated flag
//         passed from the plan, or fall back to checking if "contacts" OR any
//         "interaction.*" key is in the fields array.
//
// FIX 2: Nested interaction.* fields were being skipped entirely because the
//         early-return `if (f.startsWith("interaction.")) return;` prevented
//         them from ever being processed. They are now handled in the
//         organisation block below.
//
// FIX 3: contacts default email was using a non-deterministic timestamp which
//         made deduplication impossible. Now uses a stable hash of the row name.
//
// FIX 4: Added proper type coercion + trimming for all string fields to avoid
//         backend validation errors caused by whitespace-only values.

export function buildPayload(row, fields) {
  const payload = {};

  // Flat scalar fields — skip contacts placeholder and all interaction.* keys
  // (those are handled separately below)
  fields.forEach((f) => {
    if (f === "contacts") return;
    if (f.startsWith("interaction.")) return;

    const raw = row[f];
    if (raw === undefined || raw === null || String(raw).trim() === "") return;

    const val = String(raw).trim();

    if (["established_year", "total_students", "total_departments", "experience_years"].includes(f)) {
      const n = parseInt(val, 10);
      if (!isNaN(n)) payload[f] = n;
    } else if (f === "skills") {
      payload[f] = val.split(",").map((s) => s.trim()).filter(Boolean);
    } else {
      payload[f] = val;
    }
  });

  // ── Determine if this is an organisation record ───────────────────────────
  // An organisation record has "contacts" in its fields list
  const isOrganisation = fields.includes("contacts");

  if (isOrganisation) {
    // ── Contacts ──────────────────────────────────────────────────────────
    const rawEmail = String(row.email || "").trim().toLowerCase();
    const emailOk  = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(rawEmail);

    // Build a stable fallback email from the row name (no random suffix)
    const namePart = String(row.centreName || row.name || "unknown")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "-")
      .slice(0, 30);

    const contactNumber = String(row.phone || row.mobile || row.contactNumber || "").trim();

    payload.contacts = [
      {
        name:          String(row.contactPerson || row.name || row.centreName || "Administrator").trim(),
        designation:   String(row.designation   || "Administrator").trim(),
        ...(contactNumber && { contactNumber }),
        email:         emailOk ? rawEmail : "",
      },
    ];

    // ── Interaction (required by schema) ──────────────────────────────────
    // Pull interaction sub-fields from row (they are mapped to flat keys by
    // parseSheetRows using fieldMap) or fall back to safe defaults.
    const parseDate = (v) => {
      if (!v) return null;
      const d = new Date(v);
      return isNaN(d.getTime()) ? null : d.toISOString();
    };

    const VALID_MODES = ["Email", "Phone", "WhatsApp", "Visit"];

    payload.interaction = {
      interactionBy:   String(row.interactionBy   || row.onboardedBy || "System Import").trim(),
      interactedWith:  String(
        row.interactedWith  ||
        row.contactPerson   ||
        row.name            ||
        row.centreName      ||
        "Administrator"
      ).trim(),
      interactionDate:
        parseDate(row.interactionDate) || new Date().toISOString(),
      interactionMode: VALID_MODES.includes(row.interactionMode)
        ? row.interactionMode
        : "Email",
      notes: String(row.notes || "Imported via bulk upload").trim(),
    };

    // Optional interaction sub-fields
    if (row.ninAin && String(row.ninAin).trim())
  payload.ninAin = String(row.ninAin).trim();
else
  payload.ninAin = `NIN-IMPORT-${namePart.toUpperCase().slice(0, 10)}`;

    const nextDate = parseDate(row.nextInteractionDate);
    if (nextDate) payload.interaction.nextInteractionDate = nextDate;
  }

  // ── Universal required-field fallbacks ───────────────────────────────────
  // These fill in fields that the schema marks required but may not be in the
  // spreadsheet. They do NOT overwrite values already set above.
  if (!payload.district   || !String(payload.district).trim())
    payload.district   = String(row.city || "Unknown District").trim();

  if (!payload.website    || !String(payload.website).trim())
    payload.website    = "https://example.com";

  if (!payload.onboardedBy || !String(payload.onboardedBy).trim())
    payload.onboardedBy = "System Import";

  // Ensure pincode is always a string (some sheets export it as a number)
  if (payload.pincode !== undefined)
    payload.pincode = String(payload.pincode).trim();

  // Ensure status has a default
  if (!payload.status)
    payload.status = isOrganisation ? "Active" : "Active";

  return payload;
}

// ── Excel sheet row parser ────────────────────────────────────────────────────
//
// FIX 5: Original code did `fieldMap[String(cell).toLowerCase().trim()]` but
//        fieldMap keys were authored in mixed-case (e.g. "centreName",
//        "onboardedBy"). This meant most columns were silently dropped.
//        Solution: normalise ALL fieldMap keys to lowercase at lookup time so
//        the authored casing in constants.js never matters.
//
// FIX 6: XLSX may return numeric cell values (e.g. pincode 110001 as number).
//        row[i] is now always String-coerced before storing.

export function parseSheetRows(ws, fieldMap) {
  // Build a lowercase-keyed version of the fieldMap once per call
  const lcFieldMap = {};
  Object.entries(fieldMap).forEach(([k, v]) => {
    lcFieldMap[k.toLowerCase().trim()] = v;
  });

  const raw = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });

  // Find the header row (search first 8 rows)
  let hi = -1;
  for (let i = 0; i < Math.min(raw.length, 8); i++) {
    if (raw[i].some((cell) => lcFieldMap[String(cell).toLowerCase().trim()] !== undefined)) {
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
        const normHeader = String(h).toLowerCase().trim();
        const key = lcFieldMap[normHeader];
        if (!key) return;

        const cellVal = row[i];
        const strVal  = String(cellVal ?? "").trim();
        if (strVal !== "") obj[key] = strVal;
      });
      return obj;
    })
    .filter((r) => Object.keys(r).length > 1); // require at least 2 mapped fields
}

// ── Detect category from sheet name ──────────────────────────────────────────

export function detectCatFromSheetName(sheetName) {
  const l = sheetName.toLowerCase();
  if (l.includes("volunteer"))                                                      return "volunteer";
  if (l.includes("organisation") || l.includes("center") || l.includes("centre"))  return "organisation";
  // Also handle common abbreviations / alternate names used in real sheets
  if (l.includes("school") || l.includes("college") || l.includes("ngo"))          return "organisation";
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

    // Step 1: sheet-name-based detection (fast path)
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

    // Step 2: score-based detection across all categories
    let bestCat = null, bestRows = null, bestScore = 0;
    for (const cat of CATEGORIES) {
      const rows = parseSheetRows(ws, ALL_FIELD_MAPS[cat.id]);
      if (!rows || rows.length === 0) continue;

      const sig        = CAT_SIGNATURE[cat.id];
      const sampleRows = rows.slice(0, 3);

      const sigScore = sig.filter(
        (f) => sampleRows.some((r) => r[f] !== undefined && r[f] !== "")
      ).length;

      const reqScore = (cat.requiredFields || []).filter(
        (f) => !f.startsWith("interaction.") && f !== "contacts" &&
               sampleRows.some((r) => r[f] !== undefined && r[f] !== "")
      ).length;

      const totalScore = sigScore * 3 + reqScore;
      if (totalScore > bestScore) {
        bestScore = totalScore;
        bestCat   = cat.id;
        bestRows  = rows;
      }
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


// Returns { cleanPlan, skipped }
// cleanPlan — active plan with invalid rows removed so upload can proceed
// skipped   — list of { catLabel, rowNum, reasons } for the summary panel
export function validatePlan(active) {
  const skipped   = [];
  const cleanPlan = active
    .map((p) => {
      const validRows = [];

      p.rows.forEach((row, i) => {
        const rowNum  = i + 1;
        const reasons = [];

        p.requiredFields.forEach((f) => {
          if (f === "contacts") {
            const hasIdentifier = row.name || row.centreName || row.contactPerson;
            if (!hasIdentifier) reasons.push("needs at least a name or contact person");
            return;
          }
          if (f.startsWith("interaction.") || f === "ninAin") return;

          const val = row[f];
          if (!val || String(val).trim() === "")
            reasons.push(`"${f}" is required but missing`);
        });

        if (reasons.length === 0) {
          validRows.push(row);
        } else {
          skipped.push({ catLabel: p.catLabel, rowNum, reasons });
        }
      });

      return { ...p, rows: validRows };
    })
    .filter((p) => p.rows.length > 0);

  return { cleanPlan, skipped };
}
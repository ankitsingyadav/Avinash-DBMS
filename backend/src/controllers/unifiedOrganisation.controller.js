// controllers/unifiedOrganisation.controller.js
import Volunteer    from "../models/volunteer.model.js";
import Organisation from "../models/organisation.model.js";
import { asyncHandler, sendSuccess, sendError } from "../utils/response.utils.js";
import {
  getHiddenFields,
  stripHiddenFields,
  verifyOwnRecord,
} from "../middleware/permission.middleware.js";

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

const BULK_LIMIT   = 500;
const VALID_MODES  = ["Email", "Phone", "WhatsApp", "Visit"];

const SORT_WHITELIST = new Set([
  "centreName", "city", "district", "state",
  "status", "centreType", "createdAt", "updatedAt",
]);

const VALID_DATA_STATUSES = ["Basic", "Partial", "Complete"];
const LEGACY_STATUS_MAP   = { Active: "Complete", Inactive: "Basic" };

// ─────────────────────────────────────────────────────────────────────────────
// PURE HELPERS  (no DB calls — safe to use anywhere)
// ─────────────────────────────────────────────────────────────────────────────

const buildSort = (sortField = "createdAt", sortDir = "desc") => {
  const field = SORT_WHITELIST.has(sortField) ? sortField : "createdAt";
  return { [field]: sortDir === "asc" ? 1 : -1 };
};

/** Strip protocol-less URLs and empty values → always return a valid https URL */
const normaliseWebsite = (v) => {
  const s = String(v || "").trim();
  if (!s) return "https://example.com";
  return /^https?:\/\//i.test(s) ? s : `https://${s}`;
};

/** Remove non-digits, strip trailing ".0" from Excel floats, clamp to 6 chars */
const normalisePincode = (v) =>
  String(v || "")
    .trim()
    .replace(/\.0+$/, "")
    .replace(/\D/g, "")
    .slice(0, 6);

/** Validate email; return a deterministic placeholder on failure */
const normaliseEmail = (raw, fallbackSlug = "record") => {
  const e = String(raw || "").trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)
    ? e
    : `import-${fallbackSlug.replace(/[^a-z0-9]/g, "-").slice(0, 24)}@noreply.example.com`;
};

/** Map old Active/Inactive → new tri-state; default to "Basic" */
const normaliseDataStatus = (raw) => {
  if (!raw) return "Basic";
  if (VALID_DATA_STATUSES.includes(raw)) return raw;
  return LEGACY_STATUS_MAP[raw] ?? "Basic";
};

/** Escape special regex chars in user-supplied strings */
const escapeRegex = (str) =>
  String(str || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// ─────────────────────────────────────────────────────────────────────────────
// QUERY BUILDERS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Safely merge a dataScope $or clause with a search $or clause.
 * Using $and avoids illegal top-level $or + $or collision in MongoDB.
 */
const buildQuery = (dataScope = {}, dateScope = {}, searchOr = null, extraFilters = {}) => {
  const query    = { ...dateScope, ...extraFilters };
  const ownerOr  = dataScope?.$or ?? null;

  if (ownerOr && searchOr) {
    query.$and = [{ $or: ownerOr }, { $or: searchOr }];
  } else if (ownerOr) {
    query.$or = ownerOr;
  } else if (searchOr) {
    query.$or = searchOr;
  }

  return query;
};

/**
 * Build a single interaction sub-document from a flat request body / import row.
 * All fields are coerced to safe types; unknowns are dropped silently.
 *
 * NEW: nextNotes is now passed through — independent notes field for the
 * "next interaction planned" block (separate from `notes`, which belongs
 * to the current interaction).
 */
const buildInteractionFromBody = (interaction = {}) => ({
  interactionBy:   String(interaction.interactionBy  || "").trim(),
  interactedWith:  String(interaction.interactedWith || "").trim(),
  interactionDate: interaction.interactionDate
    ? new Date(interaction.interactionDate)
    : new Date(),
  interactionMode: VALID_MODES.includes(interaction.interactionMode)
    ? interaction.interactionMode
    : "Email",
  notes:               interaction.notes?.trim()              || undefined,
  ninAin:              interaction.ninAin?.trim()             || undefined,
  nextInteractionDate: interaction.nextInteractionDate
    ? new Date(interaction.nextInteractionDate)
    : undefined,
  nextNotes:           interaction.nextNotes?.trim()          || undefined,
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/v1/organisations
// Create a single organisation with its first interaction
// ─────────────────────────────────────────────────────────────────────────────

export const createOrganisation = asyncHandler(async (req, res) => {
  const {
    centreType, centreName, website, address,
    city, district, state, pincode,
    contacts, onboardedBy, ninAin, interaction,
  } = req.body;

  // ── Required-field gate ────────────────────────────────────────────────────
  if (
    !centreType || !centreName || !address || !city ||
    !district   || !state     || !pincode || !contacts || !onboardedBy || !interaction
  ) {
    return sendError(
      res, 422,
      "Missing required fields: centreType, centreName, address, city, district, state, pincode, contacts, onboardedBy, interaction."
    );
  }

  if (!Array.isArray(contacts) || contacts.length === 0)
    return sendError(res, 422, "Contacts must be a non-empty array.");

  // ── partial_admin centreType access gate ───────────────────────────────────
  if (req.user.role === "partial_admin") {
    const mods = req.user.permissions?.allowedModules ?? [];
    const CENTRE_TYPES = ["School", "College", "NGO", "Corporate", "Online", "Community Centre"];
    const hasCentreTypeScope = mods.some((m) => CENTRE_TYPES.includes(m));

    if (hasCentreTypeScope) {
      if (!mods.includes(centreType) && !mods.includes("organisation")) {
        return sendError(res, 403, `You do not have access to create records for '${centreType}'.`);
      }
    } else if (!mods.includes("organisation")) {
      return sendError(res, 403, "You do not have access to the 'organisation' module.");
    }
  }

  // ── Duplicate check (centreName + centreType + pincode) ────────────────────
  const normalisedPincode = normalisePincode(pincode);

  const duplicate = await Organisation.findOne({
    centreType,
    centreName: { $regex: `^${escapeRegex(centreName.trim())}$`, $options: "i" },
    pincode:    normalisedPincode,
  })
    .select("_id centreName centreType city district state pincode")
    .lean();

  if (duplicate) {
    const location = [duplicate.city, duplicate.district, duplicate.state]
      .filter(Boolean)
      .join(", ");
    return sendError(
      res, 409,
      `Duplicate entry: "${duplicate.centreName}" (${duplicate.centreType}) is already registered` +
      ` at pincode ${duplicate.pincode}${location ? ` — ${location}` : ""}.` +
      ` Please verify before re-submitting.`
    );
  }

  // ── Persist ────────────────────────────────────────────────────────────────
  const finalDistrict = district && String(district).trim()
    ? String(district).trim()
    : String(city).trim();

  try {
    const organisation = await Organisation.create({
      centreType:   centreType.trim(),
      centreName:   centreName.trim(),
      website:      normaliseWebsite(website),
      address:      address.trim(),
      city:         city.trim(),
      district:     finalDistrict,
      state:        state.trim(),
      pincode:      normalisedPincode,
      contacts: contacts.map((c, i) => {
        if (!c || typeof c !== "object") throw new Error(`Invalid contact at index ${i}`);
        return {
          name:          String(c.name          || "").trim(),
          designation:   String(c.designation   || "").trim(),
          contactNumber: String(c.contactNumber || "").trim(),
          email:         normaliseEmail(c.email, centreName),
        };
      }),
      interactions: [buildInteractionFromBody(interaction)],
      onboardedBy:  String(onboardedBy).trim(),
      ninAin:       ninAin?.trim()  || undefined,
      registeredBy: req.user._id,
      status:       normaliseDataStatus(req.body.status),
    });

    return sendSuccess(res, 201, "Organisation registered successfully.", { organisation });
  } catch (err) {
    if (err.code === 11000)
      return sendError(res, 409, "A record with this information already exists.");
    if (err.name === "ValidationError")
      return sendError(res, 422, Object.values(err.errors).map((e) => e.message).join(" | "));
    if (err.message?.includes("Invalid contact"))
      return sendError(res, 422, err.message);
    throw err;
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/v1/organisations/bulk/check-duplicates
//
// Accepts up to BULK_LIMIT incoming records and returns which ones already
// exist in the DB (matched on centreName + centreType + pincode, case-insensitive).
// This is a READ-ONLY pre-flight — nothing is written.
// ─────────────────────────────────────────────────────────────────────────────

export const bulkCheckDuplicates = asyncHandler(async (req, res) => {
  const { records } = req.body;

  if (!Array.isArray(records) || records.length === 0)
    return sendError(res, 422, "Request body must contain a non-empty records array.");

  if (records.length > BULK_LIMIT)
    return sendError(res, 422, `Batch size exceeds the maximum limit of ${BULK_LIMIT} records.`);

  // ── Build one $or query that covers every incoming record ──────────────────
  const orConditions = records
    .map((r) => {
      const name = String(r.centreName || "").trim();
      const type = String(r.centreType || "").trim();
      const pin  = normalisePincode(r.pincode);
      if (!name || !type || !pin) return null;          // incomplete — skip
      return {
        centreType: type,
        centreName: { $regex: `^${escapeRegex(name)}$`, $options: "i" },
        pincode:    pin,
      };
    })
    .filter(Boolean);

  // If every record was incomplete, short-circuit — nothing to check
  if (orConditions.length === 0) {
    return sendSuccess(res, 200, "Duplicate check completed.", {
      duplicates: [],
      cleanCount: records.length,
      total:      records.length,
    });
  }

  // Single DB round-trip for all records
  const existingDocs = await Organisation.find({ $or: orConditions })
    .select("centreName centreType pincode city district state")
    .lean();

  // O(1) lookup map: "name___type___pin" → existing doc
  const existingMap = new Map();
  existingDocs.forEach((doc) => {
    const key = [
      doc.centreName.toLowerCase().trim(),
      doc.centreType,
      doc.pincode,
    ].join("___");
    existingMap.set(key, doc);
  });

  // Match incoming records against the map
  const duplicates = [];
  records.forEach((r, index) => {
    const name = String(r.centreName || "").trim().toLowerCase();
    const type = String(r.centreType || "").trim();
    const pin  = normalisePincode(r.pincode);
    const key  = `${name}___${type}___${pin}`;

    const existDoc = existingMap.get(key);
    if (existDoc) {
      duplicates.push({
        index,           // position in original array — used by frontend to correlate
        incoming: r,     // the row that was about to be imported
        existing: existDoc, // what's already in the DB
      });
    }
  });

  return sendSuccess(res, 200, "Duplicate check completed.", {
    duplicates,
    cleanCount: records.length - duplicates.length,
    total:      records.length,
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/v1/organisations/bulk
// ─────────────────────────────────────────────────────────────────────────────

export const bulkCreateOrganisations = asyncHandler(async (req, res) => {
  const { records } = req.body;

  if (!Array.isArray(records) || records.length === 0)
    return sendError(res, 422, "Request body must contain a non-empty records array.");

  if (records.length > BULK_LIMIT)
    return sendError(res, 422, `Batch size exceeds the maximum limit of ${BULK_LIMIT} records.`);

  // ── Pre-flight: check against existing DB records to surface duplicates ────
  const orConditions = records
    .map((r) => {
      const name = String(r.centreName || "").trim();
      const type = String(r.centreType || "").trim();
      const pin  = normalisePincode(r.pincode);
      if (!name || !type || !pin) return null;
      return {
        centreType: type,
        centreName: { $regex: `^${escapeRegex(name)}$`, $options: "i" },
        pincode:    pin,
      };
    })
    .filter(Boolean);

  let skippedDuplicates = 0;
  const duplicateKeys   = new Set();

  if (orConditions.length > 0) {
    const existingDocs = await Organisation.find({ $or: orConditions })
      .select("centreName centreType pincode")
      .lean();
    existingDocs.forEach((doc) => {
      duplicateKeys.add(
        `${doc.centreName.toLowerCase().trim()}___${doc.centreType}___${doc.pincode}`
      );
    });
  }

  // Track placeholder usage for transparency
  let placeholderNinAin = 0;
  let placeholderEmail  = 0;

  const sanitised = records
    .map((r) => {
      const slug     = String(r.centreName || r.name || "record")
        .toLowerCase().replace(/[^a-z0-9]/g, "-").slice(0, 24);
      const name     = String(r.centreName || "").trim();
      const type     = String(r.centreType || "").trim();
      const pin      = normalisePincode(r.pincode);
      const key      = `${name.toLowerCase()}___${type}___${pin}`;

      // Skip rows that already exist in the DB
      if (duplicateKeys.has(key)) {
        skippedDuplicates++;
        return null;
      }

      const district = String(r.district || r.city || "Unknown District").trim();

      const rawEmail   = String(r.email || "").trim().toLowerCase();
      const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(rawEmail);
      if (!emailValid) placeholderEmail++;

      const rawNin   = String(r.ninAin || "").trim();
      const ninValue = rawNin || `NIN-IMPORT-${slug.toUpperCase().slice(0, 10)}`;
      if (!rawNin) placeholderNinAin++;

      return {
        centreType:   type,
        centreName:   name,
        website:      normaliseWebsite(r.website),
        address:      String(r.address || "").trim(),
        city:         String(r.city    || "").trim(),
        district,
        state:        String(r.state   || "").trim(),
        pincode:      pin,
        contacts: [{
          name:          String(r.contactPerson || r.name || r.centreName || "Administrator").trim(),
          designation:   String(r.designation   || "Administrator").trim(),
          contactNumber: String(r.phone || r.mobile || r.contactNumber || "9999999999").trim(),
          email:         emailValid ? rawEmail : normaliseEmail(r.email, slug),
        }],
        interactions: [{
          interactionBy:  String(r.interactionBy  || r.onboardedBy || "System Import").trim(),
          interactedWith: String(
            r.interactedWith || r.contactPerson || r.name || r.centreName || "Administrator"
          ).trim(),
          interactionDate: r.interactionDate ? new Date(r.interactionDate) : new Date(),
          interactionMode: VALID_MODES.includes(r.interactionMode) ? r.interactionMode : "Email",
          notes:           String(r.notes || "Imported via bulk upload").trim(),
          ...(r.nextInteractionDate && !isNaN(new Date(r.nextInteractionDate))
            ? { nextInteractionDate: new Date(r.nextInteractionDate) }
            : {}),
          ...(r.nextNotes && String(r.nextNotes).trim()
            ? { nextNotes: String(r.nextNotes).trim() }
            : {}),
        }],
        onboardedBy:  String(r.onboardedBy || "System Import").trim(),
        ninAin:       ninValue,
        registeredBy: req.user._id,
        status:       normaliseDataStatus(r.status),
      };
    })
    .filter(Boolean);

  if (sanitised.length === 0) {
    return sendSuccess(res, 200, "No new records to import — all are duplicates.", {
      inserted:          0,
      failed:            0,
      skippedDuplicates,
      total:             records.length,
    });
  }

  try {
    const result = await Organisation.insertMany(sanitised, {
      ordered:       false,
      runValidators: true,
    });

    return sendSuccess(res, 201, "Bulk import completed.", {
      inserted:          result.length,
      failed:            sanitised.length - result.length,
      skippedDuplicates,
      placeholderNinAin,
      placeholderEmail,
      total:             records.length,
    });

  } catch (err) {
    if (err.name === "BulkWriteError") {
      const inserted    = err.result?.nInserted ?? 0;
      const failed      = sanitised.length - inserted;
      const writeErrors = (err.writeErrors ?? []).slice(0, 20);

      writeErrors.forEach((e) =>
        console.error(`[BulkImport] Row ${e.index} failed:`, e.errmsg)
      );

      return res.status(207).json({
        success:           true,
        message:           `${inserted} imported, ${failed} failed, ${skippedDuplicates} skipped (duplicates).`,
        inserted,
        failed,
        skippedDuplicates,
        placeholderNinAin,
        placeholderEmail,
        total:             records.length,
        errors:            writeErrors.map((e) => ({ index: e.index, message: e.errmsg })),
      });
    }

    console.error("[BulkImport] Fatal:", err.message);
    return sendError(res, 500, err.message || "Bulk import failed.");
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/v1/organisations/:id/interactions
// ─────────────────────────────────────────────────────────────────────────────

export const addInteraction = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { interactionBy, interactedWith, interactionDate, interactionMode } = req.body;

  if (!interactionBy || !interactedWith || !interactionDate || !interactionMode)
    return sendError(
      res, 422,
      "Missing required fields: interactionBy, interactedWith, interactionDate, interactionMode."
    );

  if (!VALID_MODES.includes(interactionMode))
    return sendError(res, 422, `Invalid interactionMode. Must be one of: ${VALID_MODES.join(", ")}.`);

  // data_entry users may only edit their own records
  if (req.user.role === "data_entry") {
    const existing = await Organisation.findById(id).lean();
    if (!existing) return sendError(res, 404, "Organisation not found.");
    if (!verifyOwnRecord(existing, req.user._id))
      return sendError(res, 403, "You can only edit records you created.");
  }

  const newEntry = buildInteractionFromBody(req.body);

  try {
    const organisation = await Organisation.findByIdAndUpdate(
      id,
      { $push: { interactions: newEntry } },
      { new: true, runValidators: false }
    );

    if (!organisation) return sendError(res, 404, "Organisation not found.");

    const added = organisation.interactions[organisation.interactions.length - 1];
    return sendSuccess(res, 201, "Interaction added successfully.", {
      interaction:       added,
      totalInteractions: organisation.interactions.length,
    });
  } catch (err) {
    if (err.name === "ValidationError")
      return sendError(res, 422, Object.values(err.errors).map((e) => e.message).join(" | "));
    throw err;
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/v1/organisations/:id/interactions
// ─────────────────────────────────────────────────────────────────────────────

export const getInteractions = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const organisation = await Organisation.findById(id)
    .select("interactions centreName")
    .lean();

  if (!organisation) return sendError(res, 404, "Organisation not found.");

  // Return newest first (reverse of insertion order)
  const history = [...(organisation.interactions || [])].reverse();

  return sendSuccess(res, 200, "Interactions retrieved successfully.", {
    centreName:   organisation.centreName,
    interactions: history,
    total:        history.length,
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/v1/organisations/meta/districts
// ─────────────────────────────────────────────────────────────────────────────

export const getDistrictsByState = asyncHandler(async (req, res) => {
  const state = String(req.query.state || "").trim();
  if (!state) return sendError(res, 422, "Query param 'state' is required.");

  const districts = await Organisation.distinct("district", { state });
  districts.sort((a, b) => a.localeCompare(b, "en-IN"));

  return sendSuccess(res, 200, "Districts retrieved successfully.", { districts });
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/v1/organisations/volunteers/meta/districts
// ─────────────────────────────────────────────────────────────────────────────

export const getVolunteerDistrictsByState = asyncHandler(async (req, res) => {
  const state = String(req.query.state || "").trim();
  if (!state) return sendError(res, 422, "Query param 'state' is required.");

  const districts = await Volunteer.distinct("district", { state });
  districts.sort((a, b) => a.localeCompare(b, "en-IN"));

  return sendSuccess(res, 200, "Districts retrieved successfully.", { districts });
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/v1/organisations
// ─────────────────────────────────────────────────────────────────────────────

export const getAllOrganisations = asyncHandler(async (req, res) => {
  const {
    page  = 1, limit = 12,
    search, sortField, sortDir,
    status, state, district, city, centreType,
  } = req.query;

  const dataScope = req._dataScope || {};
  const dateScope = req._dateScope || {};

  const extraFilters = {};

  // partial_admin: restrict visible centreTypes to allowed modules
  if (req.user.role === "partial_admin") {
    const mods = req.user.permissions?.allowedModules ?? [];
    const CENTRE_TYPES = ["School", "College", "NGO", "Corporate", "Online", "Community Centre"];
    const allowedTypes = mods.filter((m) => CENTRE_TYPES.includes(m));

    if (allowedTypes.length > 0) {
      // If the requested centreType filter is within their scope, honour it;
      // otherwise restrict to everything they're allowed to see
      extraFilters.centreType = (centreType && allowedTypes.includes(centreType))
        ? centreType
        : { $in: allowedTypes };
    } else if (centreType) {
      extraFilters.centreType = centreType;
    }
  } else if (centreType) {
    extraFilters.centreType = centreType;
  }

  if (status)   extraFilters.status   = status;
  if (state)    extraFilters.state    = state;
  if (district) extraFilters.district = district;
  if (city)     extraFilters.city     = city;

  let searchOr = null;
  if (search?.trim()) {
    const regex     = { $regex: search.trim(), $options: "i" };
    const searchStr = search.trim();
    searchOr = [
      { centreName:               regex },
      { centreType:               regex },
      { city:                     regex },
      { district:                 regex },
      { state:                    regex },
      { onboardedBy:              regex },
      { address:                  regex },
      { "contacts.name":          regex },
      { "contacts.email":         regex },
      { "contacts.contactNumber": regex },
      { pincode: { $regex: searchStr, $options: "i" } },
    ];
  }

  const query = buildQuery(dataScope, dateScope, searchOr, extraFilters);
  const skip  = (parseInt(page) - 1) * parseInt(limit);

  const [organisations, total] = await Promise.all([
    Organisation.find(query)
      .sort(buildSort(sortField, sortDir))
      .skip(skip)
      .limit(parseInt(limit))
      .lean({ virtuals: true }),
    Organisation.countDocuments(query),
  ]);

  const hidden   = getHiddenFields(req);
  const safeOrgs = stripHiddenFields(organisations, hidden);

  return sendSuccess(res, 200, "Organisations retrieved successfully.", {
    organisations: safeOrgs,
    total,
    page:  parseInt(page),
    pages: Math.ceil(total / parseInt(limit)),
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/v1/organisations/:id
// ─────────────────────────────────────────────────────────────────────────────

export const getOrganisationById = asyncHandler(async (req, res) => {
  const organisation = await Organisation.findById(req.params.id)
    .populate("registeredBy", "fullName email");

  if (!organisation) return sendError(res, 404, "Organisation not found.");

  if (req.user.role === "data_entry" && !verifyOwnRecord(organisation, req.user._id))
    return sendError(res, 403, "You can only view records you created.");

  const hidden  = getHiddenFields(req);
  const safeOrg = stripHiddenFields(organisation.toObject(), hidden);

  return sendSuccess(res, 200, "Organisation retrieved successfully.", { organisation: safeOrg });
});

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/v1/organisations/:id
// ─────────────────────────────────────────────────────────────────────────────

export const updateOrganisation = asyncHandler(async (req, res) => {
  if (req.user.role === "data_entry") {
    const existing = await Organisation.findById(req.params.id).lean();
    if (!existing) return sendError(res, 404, "Organisation not found.");
    if (!verifyOwnRecord(existing, req.user._id))
      return sendError(res, 403, "You can only edit records you created.");
  }

  const ALLOWED_FIELDS = [
    "centreType", "centreName", "website", "address",
    "city", "district", "state", "pincode",
    "contacts", "onboardedBy", "ninAin", "status",
    "interaction",
  ];

  const updates = {};
  ALLOWED_FIELDS.forEach((f) => {
    if (req.body[f] !== undefined) updates[f] = req.body[f];
  });

  if (updates.pincode) updates.pincode = normalisePincode(updates.pincode);
  if (updates.website) updates.website = normaliseWebsite(updates.website);
  if (updates.status)  updates.status  = normaliseDataStatus(updates.status);

  const mongoUpdate = { $set: {} };

  // An "interaction" in the update body appends a new interaction entry
  if (updates.interaction) {
    mongoUpdate.$push = { interactions: buildInteractionFromBody(updates.interaction) };
    delete updates.interaction;
  }

  Object.entries(updates).forEach(([k, v]) => { mongoUpdate.$set[k] = v; });
  if (Object.keys(mongoUpdate.$set).length === 0) delete mongoUpdate.$set;

  try {
    const organisation = await Organisation.findByIdAndUpdate(
      req.params.id,
      mongoUpdate,
      { new: true, runValidators: true, context: "query" }
    );
    if (!organisation) return sendError(res, 404, "Organisation not found.");
    return sendSuccess(res, 200, "Organisation updated successfully.", { organisation });
  } catch (err) {
    if (err.name === "ValidationError")
      return sendError(res, 422, Object.values(err.errors).map((e) => e.message).join(" | "));
    throw err;
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/v1/organisations/:id
// ─────────────────────────────────────────────────────────────────────────────

export const deleteOrganisation = asyncHandler(async (req, res) => {
  if (req.user.role === "data_entry") {
    const existing = await Organisation.findById(req.params.id).lean();
    if (!existing) return sendError(res, 404, "Organisation not found.");
    if (!verifyOwnRecord(existing, req.user._id))
      return sendError(res, 403, "You can only delete records you created.");
  }

  const organisation = await Organisation.findByIdAndDelete(req.params.id);
  if (!organisation) return sendError(res, 404, "Organisation not found.");
  return sendSuccess(res, 200, "Organisation deleted successfully.");
});
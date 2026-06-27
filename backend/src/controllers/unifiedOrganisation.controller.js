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

const VALID_INTERACTION_STATUSES = ["Pending", "Progressive", "Active", "Inactive", "Initiated"];

const SORT_WHITELIST = new Set([
  "centreName", "city", "district", "state",
  "status", "centreType", "createdAt", "updatedAt",
]);

const VALID_DATA_STATUSES = ["Basic", "Partial", "Complete"];
const LEGACY_STATUS_MAP   = { Active: "Complete", Inactive: "Basic" };

// ─────────────────────────────────────────────────────────────────────────────
// PURE HELPERS
// ─────────────────────────────────────────────────────────────────────────────

const buildSort = (sortField = "createdAt", sortDir = "desc") => {
  const field = SORT_WHITELIST.has(sortField) ? sortField : "createdAt";
  return { [field]: sortDir === "asc" ? 1 : -1 };
};

const normaliseWebsite = (v) => {
  const s = String(v || "").trim();
  if (!s) return "https://example.com";
  return /^https?:\/\//i.test(s) ? s : `https://${s}`;
};

const normalisePincode = (v) =>
  String(v || "")
    .trim()
    .replace(/\.0+$/, "")
    .replace(/\D/g, "")
    .slice(0, 6);

const normaliseEmail = (raw, fallbackSlug = "record") => {
  const e = String(raw || "").trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)
    ? e
    : `import-${fallbackSlug.replace(/[^a-z0-9]/g, "-").slice(0, 24)}@noreply.example.com`;
};

const normaliseDataStatus = (raw) => {
  if (!raw) return "Basic";
  if (VALID_DATA_STATUSES.includes(raw)) return raw;
  return LEGACY_STATUS_MAP[raw] ?? "Basic";
};

const escapeRegex = (str) =>
  String(str || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// ─────────────────────────────────────────────────────────────────────────────
// QUERY BUILDERS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Safely merge dataScope $or + searchOr + extraFilters.
 * $expr is extracted separately to avoid collision with $and/$or.
 */
const buildQuery = (dataScope = {}, dateScope = {}, searchOr = null, extraFilters = {}) => {
  // $expr ko alag nikalo taaki $and/$or se conflict na ho
  const { $expr, ...restFilters } = extraFilters;

  const query   = { ...dateScope, ...restFilters };
  const ownerOr = dataScope?.$or ?? null;

  if (ownerOr && searchOr) {
    query.$and = [{ $or: ownerOr }, { $or: searchOr }];
  } else if (ownerOr) {
    query.$or = ownerOr;
  } else if (searchOr) {
    query.$or = searchOr;
  }

  // $expr safely add karo — latest interaction status filter ke liye
  if ($expr) query.$expr = $expr;

  return query;
};

/**
 * Build a single interaction sub-document from a flat request body / import row.
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
  interactionStatus: VALID_INTERACTION_STATUSES.includes(interaction.interactionStatus)
    ? interaction.interactionStatus
    : "Initiated",
  notes:               interaction.notes?.trim()     || undefined,
  ninAin:              interaction.ninAin?.trim()    || undefined,
  nextInteractionDate: interaction.nextInteractionDate
    ? new Date(interaction.nextInteractionDate)
    : undefined,
  nextNotes:           interaction.nextNotes?.trim() || undefined,
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/v1/organisations
// ─────────────────────────────────────────────────────────────────────────────

export const createOrganisation = asyncHandler(async (req, res) => {
  const {
    centreType, centreName, website, address,
    city, district, state, pincode,
    contacts, onboardedBy, ninAin, interaction,
  } = req.body;

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

  const contactEmails = contacts.map((c) => (c.email || "").toLowerCase().trim()).filter(Boolean);
  if (contactEmails.length !== new Set(contactEmails).size) {
    return sendError(res, 422, "Duplicate email addresses found in contacts. Each contact must have a unique email.");
  }

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

  const normalisedPincode = normalisePincode(pincode);

  const duplicate = await Organisation.findOne({
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
      ninAin:       ninAin?.trim() || undefined,
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
// ─────────────────────────────────────────────────────────────────────────────

export const bulkCheckDuplicates = asyncHandler(async (req, res) => {
  const { records } = req.body;

  if (!Array.isArray(records) || records.length === 0)
    return sendError(res, 422, "Request body must contain a non-empty records array.");

  if (records.length > BULK_LIMIT)
    return sendError(res, 422, `Batch size exceeds the maximum limit of ${BULK_LIMIT} records.`);

  const seenInBatch = new Map();
  const intraBatch  = [];

  records.forEach((r, index) => {
    const name = String(r.centreName || "").trim().toLowerCase();
    const pin  = normalisePincode(r.pincode);
    if (!name || !pin) return;

    const key = `${name}___${pin}`;
    if (seenInBatch.has(key)) {
      intraBatch.push({ index, incoming: r, duplicateOfIndex: seenInBatch.get(key) });
    } else {
      seenInBatch.set(key, index);
    }
  });

  const orConditions = records
    .map((r) => {
      const name = String(r.centreName || "").trim();
      const pin  = normalisePincode(r.pincode);
      if (!name || !pin) return null;
      return {
        centreName: { $regex: `^${escapeRegex(name)}$`, $options: "i" },
        pincode:    pin,
      };
    })
    .filter(Boolean);

  if (orConditions.length === 0) {
    return sendSuccess(res, 200, "Duplicate check completed.", {
      duplicates: [],
      intraBatch,
      cleanCount: records.length,
      total:      records.length,
    });
  }

  const existingDocs = await Organisation.find({ $or: orConditions })
    .select("centreName centreType pincode city district state")
    .lean();

  const existingMap = new Map();
  existingDocs.forEach((doc) => {
    const key = `${doc.centreName.toLowerCase().trim()}___${doc.pincode}`;
    existingMap.set(key, doc);
  });

  const dbDuplicates      = [];
  const intraBatchIndices = new Set(intraBatch.map((d) => d.index));

  records.forEach((r, index) => {
    if (intraBatchIndices.has(index)) return;
    const name     = String(r.centreName || "").trim().toLowerCase();
    const pin      = normalisePincode(r.pincode);
    const key      = `${name}___${pin}`;
    const existDoc = existingMap.get(key);
    if (existDoc) {
      dbDuplicates.push({ index, incoming: r, existing: existDoc });
    }
  });

  const allDuplicateIndices = new Set([
    ...intraBatch.map((d) => d.index),
    ...dbDuplicates.map((d) => d.index),
  ]);

  return sendSuccess(res, 200, "Duplicate check completed.", {
    duplicates: dbDuplicates,
    intraBatch,
    cleanCount: records.length - allDuplicateIndices.size,
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

  const seenInBatch         = new Set();
  let   skippedIntraBatch   = 0;
  const deduplicatedRecords = [];

  records.forEach((r) => {
    const name = String(r.centreName || "").trim().toLowerCase();
    const pin  = normalisePincode(r.pincode);
    const key  = `${name}___${pin}`;

    if (name && pin && seenInBatch.has(key)) {
      skippedIntraBatch++;
    } else {
      if (name && pin) seenInBatch.add(key);
      deduplicatedRecords.push(r);
    }
  });

  const orConditions = deduplicatedRecords
    .map((r) => {
      const name = String(r.centreName || "").trim();
      const pin  = normalisePincode(r.pincode);
      if (!name || !pin) return null;
      return {
        centreName: { $regex: `^${escapeRegex(name)}$`, $options: "i" },
        pincode:    pin,
      };
    })
    .filter(Boolean);

  let skippedDbDuplicates = 0;
  const duplicateKeys     = new Set();

  if (orConditions.length > 0) {
    const existingDocs = await Organisation.find({ $or: orConditions })
      .select("centreName pincode")
      .lean();
    existingDocs.forEach((doc) => {
      duplicateKeys.add(`${doc.centreName.toLowerCase().trim()}___${doc.pincode}`);
    });
  }

  let placeholderNinAin = 0;
  let placeholderEmail  = 0;

  const sanitised = deduplicatedRecords
    .map((r) => {
      const slug = String(r.centreName || r.name || "record")
        .toLowerCase().replace(/[^a-z0-9]/g, "-").slice(0, 24);
      const name = String(r.centreName || "").trim();
      const pin  = normalisePincode(r.pincode);
      const key  = `${name.toLowerCase()}___${pin}`;

      if (duplicateKeys.has(key)) {
        skippedDbDuplicates++;
        return null;
      }

      const district   = String(r.district || r.city || "Unknown District").trim();
      const rawEmail   = String(r.email || "").trim().toLowerCase();
      const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(rawEmail);
      if (!emailValid) placeholderEmail++;

      const rawNin   = String(r.ninAin || "").trim();
      const ninValue = rawNin || `NIN-IMPORT-${slug.toUpperCase().slice(0, 10)}`;
      if (!rawNin) placeholderNinAin++;

      return {
        centreType:   String(r.centreType || "").trim(),
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
          interactionDate:   r.interactionDate ? new Date(r.interactionDate) : new Date(),
          interactionMode:   VALID_MODES.includes(r.interactionMode) ? r.interactionMode : "Email",
          interactionStatus: VALID_INTERACTION_STATUSES.includes(r.interactionStatus)
            ? r.interactionStatus
            : "Initiated",
          notes: String(r.notes || "Imported via bulk upload").trim(),
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

  const skippedDuplicates = skippedIntraBatch + skippedDbDuplicates;

  if (sanitised.length === 0) {
    return sendSuccess(res, 200, "No new records to import — all are duplicates.", {
      inserted: 0, failed: 0,
      skippedDuplicates, skippedIntraBatch, skippedDbDuplicates,
      total: records.length,
    });
  }

  try {
    const result = await Organisation.insertMany(sanitised, {
      ordered:       false,
      runValidators: true,
    });

    return sendSuccess(res, 201, "Bulk import completed.", {
      inserted:           result.length,
      failed:             sanitised.length - result.length,
      skippedDuplicates, skippedIntraBatch, skippedDbDuplicates,
      placeholderNinAin, placeholderEmail,
      total:              records.length,
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
        success:  true,
        message:  `${inserted} imported, ${failed} failed, ${skippedDuplicates} skipped (duplicates).`,
        inserted, failed,
        skippedDuplicates, skippedIntraBatch, skippedDbDuplicates,
        placeholderNinAin, placeholderEmail,
        total:  records.length,
        errors: writeErrors.map((e) => ({ index: e.index, message: e.errmsg })),
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

  const org = await Organisation.findById(id);
  if (!org) return sendError(res, 404, "Organisation not found.");

  if (req.user.role === "data_entry" && !verifyOwnRecord(org, req.user._id))
    return sendError(res, 403, "You can only edit records you created.");

  const prevIdx = org.interactions.length - 1;
  if (prevIdx >= 0 && org.interactions[prevIdx].nextInteractionDate) {
    await Organisation.updateOne(
      { _id: id },
      { $unset: { [`interactions.${prevIdx}.nextInteractionDate`]: "" } }
    );
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
    interactionStatus,
    ids,
  } = req.query;

  const dataScope = req._dataScope || {};
  const dateScope = req._dateScope || {};

  const extraFilters = {};

  if (ids) {
    const idList = String(ids).split(",").map((s) => s.trim()).filter(Boolean);
    if (idList.length > 0) extraFilters._id = { $in: idList };
  }

  if (req.user.role === "partial_admin") {
    const mods = req.user.permissions?.allowedModules ?? [];
    const CENTRE_TYPES = ["School", "College", "NGO", "Corporate", "Online", "Community Centre"];
    const allowedTypes = mods.filter((m) => CENTRE_TYPES.includes(m));

    if (allowedTypes.length > 0) {
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

  // ── Latest interaction status filter — $last se sirf latest match karo ──
  if (interactionStatus && VALID_INTERACTION_STATUSES.includes(interactionStatus)) {
    extraFilters.$expr = {
      $eq: [
        { $last: "$interactions.interactionStatus" },
        interactionStatus,
      ],
    };
  }

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

  if (updates.contacts) {
    const contactEmails = updates.contacts
      .map((c) => (c.email || "").toLowerCase().trim())
      .filter(Boolean);
    if (contactEmails.length !== new Set(contactEmails).size) {
      return sendError(res, 422, "Duplicate email addresses found in contacts.");
    }
  }

  const mongoUpdate = { $set: {} };

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
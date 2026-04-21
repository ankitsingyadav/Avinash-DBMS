// controllers/unifiedOrganisation.controller.js
import Organisation from "../models/organisation.model.js";
import Volunteer from "../models/volunteer.model.js";
import { asyncHandler, sendSuccess, sendError } from "../utils/response.utils.js";
import {
  getHiddenFields,
  stripHiddenFields,
  verifyOwnRecord,
} from "../middleware/permission.middleware.js";

const BULK_LIMIT = 500;

const SORT_WHITELIST = new Set([
  "centreName", "city", "district", "state",
  "status", "centreType", "createdAt", "updatedAt",
]);

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
  String(v || "").trim().replace(/\.0+$/, "").replace(/\D/g, "").slice(0, 6);

const normaliseEmail = (raw, fallbackSlug = "record") => {
  const e = String(raw || "").trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)
    ? e
    : `import-${fallbackSlug.replace(/[^a-z0-9]/g, "-").slice(0, 24)}@noreply.example.com`;
};

const VALID_MODES = ["Email", "Phone", "WhatsApp", "Visit"];

// ─── Helper: safely merge dataScope $or with search $or ───────────────────────
const buildQuery = (dataScope, dateScope, searchOr, extraFilters = {}) => {
  const query = { ...dateScope, ...extraFilters };
  const ownerOr = dataScope?.$or ?? null;

  if (ownerOr && searchOr) {
    query.$and = [{ $or: ownerOr }, { $or: searchOr }];
  } else if (ownerOr) {
    query.$or = ownerOr;
  } else if (searchOr) {
    query.$or = searchOr;
  }
  return query;
};

// ── Helper: build interaction object from request body ────────────────────────
const buildInteractionFromBody = (interaction) => ({
  interactionBy:   String(interaction.interactionBy  || "").trim(),
  interactedWith:  String(interaction.interactedWith || "").trim(),
  interactionDate: interaction.interactionDate ? new Date(interaction.interactionDate) : new Date(),
  interactionMode: VALID_MODES.includes(interaction.interactionMode)
    ? interaction.interactionMode
    : "Email",
  notes:               interaction.notes?.trim()              || undefined,
  ninAin:              interaction.ninAin?.trim()             || undefined,
  nextInteractionDate: interaction.nextInteractionDate
    ? new Date(interaction.nextInteractionDate)
    : undefined,
});

// ── POST /api/v1/organisations ────────────────────────────────────────────────
export const createOrganisation = asyncHandler(async (req, res) => {
  const {
    centreType, centreName, website, address,
    city, district, state, pincode,
    contacts, onboardedBy, ninAin, interaction,
  } = req.body;

  if (!centreType || !centreName || !address || !city || !state || !pincode || !contacts || !onboardedBy || !interaction)
    return sendError(res, 422, "Missing required fields: centreType, centreName, address, city, state, pincode, contacts, onboardedBy, interaction.");

  if (!Array.isArray(contacts) || contacts.length === 0)
    return sendError(res, 422, "Contacts must be a non-empty array.");

  // partial_admin: check specific module/centreType access
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

  const finalDistrict = district && String(district).trim()
    ? String(district).trim()
    : String(city).trim();

  try {
    const organisation = await Organisation.create({
      centreType:  centreType.trim(),
      centreName:  centreName.trim(),
      website:     normaliseWebsite(website),
      address:     address.trim(),
      city:        city.trim(),
      district:    finalDistrict,
      state:       state.trim(),
      pincode:     normalisePincode(pincode),
      contacts: contacts.map((c, i) => {
        if (!c || typeof c !== "object") throw new Error(`Invalid contact at index ${i}`);
        return {
          name:          String(c.name          || "").trim(),
          designation:   String(c.designation   || "").trim(),
          contactNumber: String(c.contactNumber || "").trim(),
          email:         normaliseEmail(c.email, centreName),
        };
      }),
      // Store as array — first entry in history
      interactions: [buildInteractionFromBody(interaction)],
      onboardedBy:  String(onboardedBy).trim(),
      ninAin:       ninAin?.trim() || undefined,
      registeredBy: req.user._id,
      status:       ["Active", "Inactive"].includes(req.body.status) ? req.body.status : "Active",
    });

    return sendSuccess(res, 201, "Organisation registered successfully.", { organisation });
  } catch (err) {
    if (err.code === 11000)             return sendError(res, 409, "A record with this information already exists.");
    if (err.name === "ValidationError") return sendError(res, 422, Object.values(err.errors).map((e) => e.message).join(" | "));
    if (err.message?.includes("Invalid contact")) return sendError(res, 422, err.message);
    throw err;
  }
});

// ── POST /api/v1/organisations/:id/interactions ───────────────────────────────
// Add a new interaction entry to an existing organisation's history
export const addInteraction = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { interactionBy, interactedWith, interactionDate, interactionMode } = req.body;

  if (!interactionBy || !interactedWith || !interactionDate || !interactionMode)
    return sendError(res, 422, "Missing required fields: interactionBy, interactedWith, interactionDate, interactionMode.");

  if (!VALID_MODES.includes(interactionMode))
    return sendError(res, 422, `Invalid interactionMode. Must be one of: ${VALID_MODES.join(", ")}.`);

  // data_entry: verify ownership
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

    // Return the newly added interaction (last in array)
    const added = organisation.interactions[organisation.interactions.length - 1];
    return sendSuccess(res, 201, "Interaction added successfully.", {
      interaction: added,
      totalInteractions: organisation.interactions.length,
    });
  } catch (err) {
    if (err.name === "ValidationError")
      return sendError(res, 422, Object.values(err.errors).map((e) => e.message).join(" | "));
    throw err;
  }
});

// ── GET /api/v1/organisations/:id/interactions ────────────────────────────────
// Get full interaction history for an organisation (newest first)
export const getInteractions = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const organisation = await Organisation.findById(id)
    .select("interactions centreName")
    .lean();

  if (!organisation) return sendError(res, 404, "Organisation not found.");

  // Return newest first
  const history = [...(organisation.interactions || [])].reverse();

  return sendSuccess(res, 200, "Interactions retrieved successfully.", {
    centreName:   organisation.centreName,
    interactions: history,
    total:        history.length,
  });
});

// ── POST /api/v1/organisations/bulk ──────────────────────────────────────────
export const bulkCreateOrganisations = asyncHandler(async (req, res) => {
  const { records } = req.body;

  if (!Array.isArray(records) || records.length === 0)
    return sendError(res, 422, "Request body must contain a non-empty records array.");
  if (records.length > BULK_LIMIT)
    return sendError(res, 422, `Batch size exceeds the maximum limit of ${BULK_LIMIT} records.`);

  const sanitised = records.map((r) => {
    const slug     = String(r.centreName || r.name || "record").toLowerCase().replace(/[^a-z0-9]/g, "-").slice(0, 24);
    const district = String(r.district || r.city || "Unknown District").trim();

    const interactionEntry = {
      interactionBy:  String(r.interactionBy  || r.onboardedBy || "System Import").trim(),
      interactedWith: String(r.interactedWith || r.contactPerson || r.name || r.centreName || "Administrator").trim(),
      interactionDate: r.interactionDate ? new Date(r.interactionDate) : new Date(),
      interactionMode: VALID_MODES.includes(r.interactionMode) ? r.interactionMode : "Email",
      notes:           String(r.notes || "Imported via bulk upload").trim(),
      ninAin:          String(r.ninAin || r.interactionNinAin || "").trim() || `IMPORT-${slug.toUpperCase().slice(0, 10)}`,
      ...(r.nextInteractionDate && !isNaN(new Date(r.nextInteractionDate))
        ? { nextInteractionDate: new Date(r.nextInteractionDate) }
        : {}),
    };

    return {
      centreType:  String(r.centreType || "").trim(),
      centreName:  String(r.centreName || "").trim(),
      website:     normaliseWebsite(r.website),
      address:     String(r.address   || "").trim(),
      city:        String(r.city      || "").trim(),
      district,
      state:       String(r.state     || "").trim(),
      pincode:     normalisePincode(r.pincode),
      contacts: [{
        name:          String(r.contactPerson || r.name || r.centreName || "Administrator").trim(),
        designation:   String(r.designation   || "Administrator").trim(),
        contactNumber: String(r.phone || r.mobile || r.contactNumber || "9999999999").trim(),
        email:         normaliseEmail(r.email, slug),
      }],
      interactions: [interactionEntry],
      onboardedBy:  String(r.onboardedBy || "System Import").trim(),
      ninAin:       String(r.ninAin || "").trim() || `NIN-IMPORT-${slug.toUpperCase().slice(0, 10)}`,
      registeredBy: req.user._id,
      status:       ["Active", "Inactive"].includes(r.status) ? r.status : "Active",
    };
  });

  try {
    const result = await Organisation.insertMany(sanitised, {
      ordered:       false,
      runValidators: true,
    });

    return sendSuccess(res, 201, "Bulk import completed.", {
      inserted: result.length,
      failed:   records.length - result.length,
      total:    records.length,
    });

  } catch (err) {
    if (err.name === "BulkWriteError") {
      const inserted    = err.result?.nInserted ?? 0;
      const failed      = records.length - inserted;
      const writeErrors = err.writeErrors ?? [];

      writeErrors.forEach((e) => {
        console.error(`[BulkImport] Row ${e.index} failed:`, e.errmsg);
      });

      return res.status(207).json({
        success:  true,
        message:  `${inserted} imported, ${failed} failed.`,
        inserted,
        failed,
        total:    records.length,
        errors:   writeErrors.slice(0, 20).map((e) => ({
          index:   e.index,
          message: e.errmsg,
        })),
      });
    }

    console.error("[BulkImport] Fatal:", err.message);
    return sendError(res, 500, err.message || "Bulk import failed.");
  }
});

// ── GET /api/v1/organisations/meta/districts ──────────────────────────────────
export const getDistrictsByState = asyncHandler(async (req, res) => {
  const state = String(req.query.state || "").trim();
  if (!state) return sendError(res, 422, "Query param 'state' is required.");

  const districts = await Organisation.distinct("district", { state });
  districts.sort((a, b) => a.localeCompare(b, "en-IN"));

  return sendSuccess(res, 200, "Districts retrieved successfully.", { districts });
});

// ── GET /api/v1/organisations/volunteers/meta/districts ───────────────────────
export const getVolunteerDistrictsByState = asyncHandler(async (req, res) => {
  const state = String(req.query.state || "").trim();
  if (!state) return sendError(res, 422, "Query param 'state' is required.");

  const districts = await Volunteer.distinct("district", { state });
  districts.sort((a, b) => a.localeCompare(b, "en-IN"));

  return sendSuccess(res, 200, "Districts retrieved successfully.", { districts });
});

// ── GET /api/v1/organisations ─────────────────────────────────────────────────
export const getAllOrganisations = asyncHandler(async (req, res) => {
  const {
    page = 1, limit = 12,
    search, sortField, sortDir,
    status, state, district, city, centreType,
  } = req.query;

  const dataScope = req._dataScope || {};
  const dateScope = req._dateScope || {};

  const extraFilters = {};

  if (req.user.role === "partial_admin") {
    const mods = req.user.permissions?.allowedModules ?? [];
    const CENTRE_TYPES = ["School", "College", "NGO", "Corporate", "Online", "Community Centre"];
    const centreTypes = mods.filter((m) => CENTRE_TYPES.includes(m));
    if (centreTypes.length > 0) {
      if (centreType && centreTypes.includes(centreType)) {
        extraFilters.centreType = centreType;
      } else {
        extraFilters.centreType = { $in: centreTypes };
      }
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
  if (search && search.trim()) {
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

  const hidden  = getHiddenFields(req);
  const safeOrgs = stripHiddenFields(organisations, hidden);

  return sendSuccess(res, 200, "Organisations retrieved successfully.", {
    organisations: safeOrgs,
    total,
    page:  parseInt(page),
    pages: Math.ceil(total / parseInt(limit)),
  });
});

// ── GET /api/v1/organisations/:id ─────────────────────────────────────────────
export const getOrganisationById = asyncHandler(async (req, res) => {
  const organisation = await Organisation.findById(req.params.id)
    .populate("registeredBy", "fullName email");
  if (!organisation) return sendError(res, 404, "Organisation not found.");

  if (req.user.role === "data_entry" && !verifyOwnRecord(organisation, req.user._id)) {
    return sendError(res, 403, "You can only view records you created.");
  }

  const hidden  = getHiddenFields(req);
  const safeOrg = stripHiddenFields(organisation.toObject(), hidden);

  return sendSuccess(res, 200, "Organisation retrieved successfully.", { organisation: safeOrg });
});

// ── PUT /api/v1/organisations/:id ─────────────────────────────────────────────
export const updateOrganisation = asyncHandler(async (req, res) => {
  if (req.user.role === "data_entry") {
    const existing = await Organisation.findById(req.params.id).lean();
    if (!existing) return sendError(res, 404, "Organisation not found.");
    if (!verifyOwnRecord(existing, req.user._id)) {
      return sendError(res, 403, "You can only edit records you created.");
    }
  }

  const allowed = [
    "centreType", "centreName", "website", "address",
    "city", "district", "state", "pincode",
    "contacts", "onboardedBy", "ninAin", "status",
    // Note: 'interaction' (singular) in EditModal body → update latest entry
    "interaction",
  ];
  const updates = {};
  allowed.forEach((f) => {
    if (req.body[f] !== undefined) updates[f] = req.body[f];
  });

  if (updates.pincode) updates.pincode = normalisePincode(updates.pincode);
  if (updates.website) updates.website = normaliseWebsite(updates.website);

  // If interaction (singular) is sent, update the last element in interactions[]
  // This preserves backward compat with EditModal which sends `interaction` key
  const mongoUpdate = { $set: {} };

  if (updates.interaction) {
    const interactionData = updates.interaction;
    delete updates.interaction;

    // We need to know current interactions length to target last index
    // Use $push to always add as latest, OR update via positional — simplest:
    // Just $push a new entry so history is preserved
    mongoUpdate.$push = {
      interactions: buildInteractionFromBody(interactionData),
    };
  }

  // All other scalar updates
  Object.keys(updates).forEach((k) => {
    mongoUpdate.$set[k] = updates[k];
  });

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

// ── DELETE /api/v1/organisations/:id ─────────────────────────────────────────
export const deleteOrganisation = asyncHandler(async (req, res) => {
  if (req.user.role === "data_entry") {
    const existing = await Organisation.findById(req.params.id).lean();
    if (!existing) return sendError(res, 404, "Organisation not found.");
    if (!verifyOwnRecord(existing, req.user._id)) {
      return sendError(res, 403, "You can only delete records you created.");
    }
  }

  const organisation = await Organisation.findByIdAndDelete(req.params.id);
  if (!organisation) return sendError(res, 404, "Organisation not found.");
  return sendSuccess(res, 200, "Organisation deleted successfully.");
});
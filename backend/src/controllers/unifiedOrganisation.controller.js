// controllers/unifiedOrganisation.controller.js
import Organisation from "../models/organisation.model.js";
import Volunteer from "../models/volunteer.model.js";
import { asyncHandler, sendSuccess, sendError } from "../utils/response.utils.js";

const BULK_LIMIT = 500;

const SORT_WHITELIST = new Set([
  "centreName", "city", "district", "state", "status", "centreType", "createdAt", "updatedAt",
]);

const buildSort = (sortField = "createdAt", sortDir = "desc") => {
  const field = SORT_WHITELIST.has(sortField) ? sortField : "createdAt";
  return { [field]: sortDir === "asc" ? 1 : -1 };
};

// ── Internal helpers ──────────────────────────────────────────────────────────

const normaliseWebsite = (v) => {
  const s = String(v || "").trim();
  if (!s) return "https://example.com";
  return /^https?:\/\//i.test(s) ? s : `https://${s}`;
};

const normalisePincode = (v) => {
  return String(v || "")
    .trim()
    .replace(/\.0+$/, "")
    .replace(/\D/g, "")
    .slice(0, 6);
};

const normaliseEmail = (raw, fallbackSlug = "record") => {
  const e = String(raw || "").trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)
    ? e
    : `import-${fallbackSlug.replace(/[^a-z0-9]/g, "-").slice(0, 24)}@noreply.example.com`;
};

const VALID_MODES = ["Email", "Phone", "WhatsApp", "Visit"];

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
      interaction: {
        interactionBy:       String(interaction.interactionBy  || "").trim(),
        interactedWith:      String(interaction.interactedWith || "").trim(),
        interactionDate:     interaction.interactionDate ? new Date(interaction.interactionDate) : new Date(),
        interactionMode:     VALID_MODES.includes(interaction.interactionMode) ? interaction.interactionMode : "Email",
        notes:               interaction.notes?.trim()              || undefined,
        ninAin:              interaction.ninAin?.trim()             || undefined,
        nextInteractionDate: interaction.nextInteractionDate ? new Date(interaction.nextInteractionDate) : undefined,
      },
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
      interaction: {
        interactionBy:  String(r.interactionBy  || r.onboardedBy || "System Import").trim(),
        interactedWith: String(
          r.interactedWith || r.contactPerson || r.name || r.centreName || "Administrator"
        ).trim(),
        interactionDate: r.interactionDate ? new Date(r.interactionDate) : new Date(),
        interactionMode: VALID_MODES.includes(r.interactionMode) ? r.interactionMode : "Email",
        notes:           String(r.notes || "Imported via bulk upload").trim(),
        ninAin:          String(r.ninAin || r.interactionNinAin || "").trim() || `IMPORT-${slug.toUpperCase().slice(0, 10)}`,
        ...(r.nextInteractionDate && !isNaN(new Date(r.nextInteractionDate))
          ? { nextInteractionDate: new Date(r.nextInteractionDate) }
          : {}),
      },
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

// ── GET /api/v1/organisations/:id ─────────────────────────────────────────────
export const getOrganisationById = asyncHandler(async (req, res) => {
  const organisation = await Organisation.findById(req.params.id)
    .populate("registeredBy", "fullName email");
  if (!organisation) return sendError(res, 404, "Organisation not found.");
  return sendSuccess(res, 200, "Organisation retrieved successfully.", { organisation });
});

// ── PUT /api/v1/organisations/:id ─────────────────────────────────────────────
export const updateOrganisation = asyncHandler(async (req, res) => {
  const allowed = [
    "centreType", "centreName", "website", "address",
    "city", "district", "state", "pincode",
    "contacts", "onboardedBy", "ninAin", "status", "interaction",
  ];
  const updates = {};
  allowed.forEach((f) => {
    if (req.body[f] !== undefined) updates[f] = req.body[f];
  });

  if (updates.pincode) updates.pincode = normalisePincode(updates.pincode);
  if (updates.website) updates.website = normaliseWebsite(updates.website);

  try {
    // $set ensures Mongoose treats this as a partial update (not a replacement)
    // context: "query" is required for runValidators to work correctly on updates
    const organisation = await Organisation.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
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
  const organisation = await Organisation.findByIdAndDelete(req.params.id);
  if (!organisation) return sendError(res, 404, "Organisation not found.");
  return sendSuccess(res, 200, "Organisation deleted successfully.");
});

// ── GET /api/v1/organisations ─────────────────────────────────────────────────
export const getAllOrganisations = asyncHandler(async (req, res) => {
  const {
    page = 1, limit = 12,
    search, sortField, sortDir,
    status, state, district, city, centreType,
  } = req.query;

  const query = {};

  if (search && search.trim()) {
    const regex     = { $regex: search.trim(), $options: "i" };
    const searchStr = search.trim();

    query.$or = [
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
      { $expr: { $regexMatch: { input: { $toString: "$pincode" }, regex: searchStr } } },
    ];
  }

  if (status)     query.status     = status;
  if (state)      query.state      = state;
  if (district)   query.district   = district;
  if (city)       query.city       = city;
  if (centreType) query.centreType = centreType;

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [organisations, total] = await Promise.all([
    Organisation.find(query)
      .sort(buildSort(sortField, sortDir))
      .skip(skip)
      .limit(parseInt(limit))
      .lean(),
    Organisation.countDocuments(query),
  ]);

  return sendSuccess(res, 200, "Organisations retrieved successfully.", {
    organisations,
    total,
    page:  parseInt(page),
    pages: Math.ceil(total / parseInt(limit)),
  });
});
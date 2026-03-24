// controllers/unifiedOrganisation.controller.js
import Organisation from "../models/organisation.model.js";
import Volunteer from "../models/volunteer.model.js";
import { asyncHandler, sendSuccess, sendError } from "../utils/response.utils.js";
import validator from "validator";

const BULK_LIMIT = 500;

const SORT_WHITELIST = new Set([
  "centreName", "city", "district", "state", "status", "centreType", "createdAt", "updatedAt",
]);

const buildSort = (sortField = "createdAt", sortDir = "desc") => {
  const field = SORT_WHITELIST.has(sortField) ? sortField : "createdAt";
  return { [field]: sortDir === "asc" ? 1 : -1 };
};

/**
 * POST /api/v1/organisations
 */
export const createOrganisation = asyncHandler(async (req, res) => {
  const {
    centreType, centreName, website, address,
    city, district, state, pincode, contacts, onboardedBy,
  } = req.body;

  if (!centreType || !centreName || !address || !city || !state || !pincode || !contacts || !onboardedBy) {
    return sendError(res, 422, "Missing required fields: centreType, centreName, address, city, state, pincode, contacts, onboardedBy.");
  }

  const finalDistrict = district && String(district).trim() !== ""
    ? String(district).trim()
    : (city && String(city).trim() !== "" ? String(city).trim() : "Unknown District");

  if (!Array.isArray(contacts) || contacts.length === 0) {
    return sendError(res, 422, "Contacts must be a non-empty array.");
  }

  try {
    const organisation = await Organisation.create({
      centreType: centreType.trim(),
      centreName: centreName.trim(),
      website: (website && String(website).trim() !== "")
        ? String(website).trim()
        : "https://example.com",
      address:    address.trim(),
      city:       city.trim(),
      district:   finalDistrict,
      state:      state.trim(),
      pincode:    String(pincode).trim(),
      contacts: contacts.map((c, index) => {
        if (!c || typeof c !== "object") throw new Error(`Invalid contact object at index ${index}`);
        const rawEmail = String(c.email || "").trim().toLowerCase();
        return {
          name:          String(c.name || "N/A").trim(),
          designation:   String(c.designation || "Administrator").trim(),
          contactNumber: String(c.contactNumber || "9999999999").trim(),
          email: rawEmail.length > 5 && validator.isEmail(rawEmail)
            ? rawEmail
            : `import-${Date.now()}-${Math.floor(Math.random() * 9000) + 1000}@example.com`,
        };
      }),
      onboardedBy:  String(onboardedBy).trim(),
      registeredBy: req.user._id,
    });
    return sendSuccess(res, 201, "Organisation registered successfully.", { organisation });
  } catch (err) {
    if (err.code === 11000)             return sendError(res, 409, "A record with this information already exists.");
    if (err.name === "ValidationError") return sendError(res, 422, Object.values(err.errors).map((e) => e.message).join(" | "));
    if (err.message.includes("Invalid contact")) return sendError(res, 422, err.message);
    throw err;
  }
});

/**
 * POST /api/v1/organisations/bulk
 */
export const bulkCreateOrganisations = asyncHandler(async (req, res) => {
  const { records } = req.body;

  if (!Array.isArray(records) || records.length === 0)
    return sendError(res, 422, "Request body must contain a non-empty records array.");

  if (records.length > BULK_LIMIT)
    return sendError(res, 422, `Batch size exceeds the maximum limit of ${BULK_LIMIT} records.`);

  const sanitised = records.map((r) => {
    const rawEmail = String(r.email || "").trim().toLowerCase();
    const district = r.district && String(r.district).trim() !== ""
      ? String(r.district).trim()
      : String(r.city || "Unknown District").trim();

    return {
      centreType:  String(r.centreType || "").trim(),
      centreName:  String(r.centreName || "").trim(),
      website:     (r.website && String(r.website).trim()) || "https://example.com",
      address:     String(r.address  || "").trim(),
      city:        String(r.city     || "").trim(),
      district,
      state:       String(r.state    || "").trim(),
      pincode:     String(r.pincode  || "").trim(),
      contacts: [{
        name:          String(r.contactPerson || r.name || "Administrator").trim(),
        designation:   String(r.designation   || "Administrator").trim(),
        contactNumber: String(r.phone || r.mobile || r.contactNumber || "9999999999").trim(),
        email: rawEmail.length > 5 && validator.isEmail(rawEmail)
          ? rawEmail
          : `import-${Date.now()}-${Math.floor(Math.random() * 9000) + 1000}@example.com`,
      }],
      onboardedBy:  String(r.onboardedBy || "System Import").trim(),
      registeredBy: req.user._id,
      status:       r.status || "Active",
    };
  });

  try {
    const result = await Organisation.insertMany(sanitised, { ordered: false });
    return sendSuccess(res, 201, "Bulk import completed.", {
      inserted: result.length,
      failed:   records.length - result.length,
      total:    records.length,
    });
  } catch (err) {
    if (err.name === "BulkWriteError") {
      const inserted = err.result?.nInserted ?? 0;
      return sendSuccess(res, 201, "Bulk import completed with some failures.", {
        inserted,
        failed: records.length - inserted,
        total:  records.length,
      });
    }
    throw err;
  }
});

/**
 * GET /api/v1/organisations/meta/districts?state=Maharashtra
 */
export const getDistrictsByState = asyncHandler(async (req, res) => {
  const state = String(req.query.state || "").trim();
  if (!state) return sendError(res, 422, "Query param 'state' is required.");

  const districts = await Organisation.distinct("district", { state });
  districts.sort((a, b) => a.localeCompare(b, "en-IN"));

  return sendSuccess(res, 200, "Districts retrieved successfully.", { districts });
});

/**
 * GET /api/v1/organisations/volunteers/meta/districts?state=Maharashtra
 */
export const getVolunteerDistrictsByState = asyncHandler(async (req, res) => {
  const state = String(req.query.state || "").trim();
  if (!state) return sendError(res, 422, "Query param 'state' is required.");

  const districts = await Volunteer.distinct("district", { state });
  districts.sort((a, b) => a.localeCompare(b, "en-IN"));

  return sendSuccess(res, 200, "Districts retrieved successfully.", { districts });
});

/**
 * GET /api/v1/organisations/:id
 */
export const getOrganisationById = asyncHandler(async (req, res) => {
  const organisation = await Organisation.findById(req.params.id)
    .populate("registeredBy", "fullName email");
  if (!organisation) return sendError(res, 404, "Organisation not found.");
  return sendSuccess(res, 200, "Organisation retrieved successfully.", { organisation });
});

/**
 * PUT /api/v1/organisations/:id
 */
export const updateOrganisation = asyncHandler(async (req, res) => {
  const allowed = [
    "centreType", "centreName", "website", "address",
    "city", "district", "state", "pincode",
    "contacts", "onboardedBy", "status",
  ];
  const updates = {};
  allowed.forEach((f) => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });

  try {
    const organisation = await Organisation.findByIdAndUpdate(
      req.params.id, updates, { new: true, runValidators: true }
    );
    if (!organisation) return sendError(res, 404, "Organisation not found.");
    return sendSuccess(res, 200, "Organisation updated successfully.", { organisation });
  } catch (err) {
    if (err.name === "ValidationError")
      return sendError(res, 422, Object.values(err.errors).map((e) => e.message).join(" | "));
    throw err;
  }
});

/**
 * DELETE /api/v1/organisations/:id
 */
export const deleteOrganisation = asyncHandler(async (req, res) => {
  const organisation = await Organisation.findByIdAndDelete(req.params.id);
  if (!organisation) return sendError(res, 404, "Organisation not found.");
  return sendSuccess(res, 200, "Organisation deleted successfully.");
});

/**
 * GET /api/v1/organisations
 */
export const getAllOrganisations = asyncHandler(async (req, res) => {
  const {
    page = 1, limit = 12,
    search, sortField, sortDir,
    status, state, district, city, centreType,
  } = req.query;

  // ── Base query ────────────────────────────────────────────────────────────
  const query = {};

  // ── Multi-field regex search ──────────────────────────────────────────────
  // Koi bhi field mein match kare to result aayega
  if (search && search.trim()) {
  const regex = { $regex: search.trim(), $options: "i" };
  const searchStr = search.trim();

  query.$or = [
    { centreName:              regex },
    { centreType:              regex },
    { city:                    regex },
    { district:                regex },
    { state:                   regex },
    { onboardedBy:             regex },
    { address:                 regex },
    { "contacts.name":         regex },
    { "contacts.email":        regex },
    { "contacts.contactNumber":regex },
    // Pincode — string aur number dono handle karo
    { pincode: { $regex: searchStr, $options: "i" } },          // agar string stored hai
    { $expr: { $regexMatch: {                                    // agar number stored hai
      input: { $toString: "$pincode" },
      regex: searchStr,
    }}},
  ];
}

  // ── Exact filters (dropdown se aate hain) ────────────────────────────────
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
// controllers/organisation.controller.js
import Volunteer from "../models/volunteer.model.js";
import Organisation from "../models/organisation.model.js";
import { asyncHandler, sendSuccess, sendError } from "../utils/response.utils.js";
import {
  getHiddenFields,
  stripHiddenFields,
  verifyOwnRecord,
} from "../middleware/permission.middleware.js";

const BULK_LIMIT = 500;

const SORT_WHITELIST = new Set([
  "name", "email", "city", "district", "state",
  "status", "follow_up_date", "createdAt", "updatedAt",
]);

const buildSort = (sortField = "createdAt", sortDir = "desc") => {
  const field = SORT_WHITELIST.has(sortField) ? sortField : "createdAt";
  return { [field]: sortDir === "asc" ? 1 : -1 };
};

const buildDateFilter = (dateFrom, dateTo) => {
  if (!dateFrom && !dateTo) return {};
  const filter = { createdAt: {} };
  if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
  if (dateTo)   filter.createdAt.$lte = new Date(new Date(dateTo).setHours(23, 59, 59, 999));
  return filter;
};

const handleDuplicateKey = (err) => {
  const field  = Object.keys(err.keyPattern || {})[0];
  const labels = { email: "Email address", phone: "Phone number" };
  return `${labels[field] || field} is already registered.`;
};

const bulkInsert = async (Model, records) => {
  try {
    const result = await Model.insertMany(records, { ordered: false });
    return { inserted: result.length, failed: 0 };
  } catch (err) {
    if (err.name === "BulkWriteError") {
      const inserted = err.result?.nInserted ?? 0;
      const failed   = records.length - inserted;
      return { inserted, failed };
    }
    throw err;
  }
};

// ── POST /organisations/volunteers ────────────────────────────────────────────
export const createVolunteer = asyncHandler(async (req, res) => {
  const {
    name, phone, email, website,
    address, city, district, state, area_of_interest,
    remarks, status, follow_up_date,
  } = req.body;

  if (!name || !phone || !email || !city || !district || !state || !area_of_interest)
    return sendError(res, 422, "Missing required fields: name, phone, email, city, district, state, area_of_interest.");

  try {
    const volunteer = await Volunteer.create({
      name:             name.trim(),
      volunteer_type:   "Individual Volunteer",
      phone:            phone.trim(),
      email:            email.toLowerCase().trim(),
      website:          website?.trim() || "NA",
      address:          address?.trim() || null,
      city:             city.trim(),
      district:         district.trim(),
      state:            state.trim(),
      area_of_interest,
      remarks:          remarks?.trim() || null,
      status:           status || "Active",
      follow_up_date:   follow_up_date || null,
      registered_by:    req.user._id,
    });
    return sendSuccess(res, 201, "Volunteer registered successfully.", { volunteer });
  } catch (err) {
    if (err.code === 11000)             return sendError(res, 409, handleDuplicateKey(err));
    if (err.name === "ValidationError") return sendError(res, 422, Object.values(err.errors).map((e) => e.message).join(" | "));
    throw err;
  }
});

// ── POST /organisations/volunteers/bulk ───────────────────────────────────────
export const bulkCreateVolunteers = asyncHandler(async (req, res) => {
  const { records } = req.body;

  if (!Array.isArray(records) || records.length === 0)
    return sendError(res, 422, "Request body must contain a non-empty records array.");
  if (records.length > BULK_LIMIT)
    return sendError(res, 422, `Batch size exceeds the maximum limit of ${BULK_LIMIT} records.`);

  const sanitised = records.map((r) => ({
    name:             r.name?.trim(),
    volunteer_type:   "Individual Volunteer",
    phone:            r.phone?.trim(),
    email:            r.email?.toLowerCase().trim(),
    website:          r.website?.trim() || "NA",
    address:          r.address?.trim() || null,
    city:             r.city?.trim(),
    district:         r.district?.trim() || "",
    state:            r.state?.trim(),
    area_of_interest: r.area_of_interest,
    remarks:          r.remarks?.trim() || null,
    status:           r.status || "Active",
    follow_up_date:   r.follow_up_date || null,
    registered_by:    req.user._id,
  }));

  const { inserted, failed } = await bulkInsert(Volunteer, sanitised);
  return sendSuccess(res, 201, "Bulk import completed.", { inserted, failed, total: records.length });
});

// ── GET /organisations/volunteers ─────────────────────────────────────────────
export const getAllVolunteers = asyncHandler(async (req, res) => {
  const {
    page = 1, limit = 12,
    search, sortField, sortDir,
    dateFrom, dateTo,
    status, state, district, area_of_interest,
  } = req.query;

  const dataScope = req._dataScope || {};
  const dateScope = req._dateScope || {};

  const dateFilter = (dateFrom || dateTo)
    ? buildDateFilter(dateFrom, dateTo)
    : dateScope;

  let query = { ...dateFilter };

  if (dataScope.$or) {
    query._ownerScope = dataScope.$or;
  }

  let searchOr = null;
  if (search && search.trim()) {
    const regex = { $regex: search.trim(), $options: "i" };
    searchOr = [
      { name:             regex },
      { email:            regex },
      { phone:            regex },
      { city:             regex },
      { district:         regex },
      { state:            regex },
      { area_of_interest: regex },
      { remarks:          regex },
      { address:          regex },
    ];
  }

  if (query._ownerScope && searchOr) {
    query.$and = [
      { $or: query._ownerScope },
      { $or: searchOr },
    ];
    delete query._ownerScope;
  } else if (query._ownerScope) {
    query.$or = query._ownerScope;
    delete query._ownerScope;
  } else if (searchOr) {
    query.$or = searchOr;
  }

  if (status)           query.status           = status;
  if (state)            query.state            = state;
  if (district)         query.district         = district;
  if (area_of_interest) query.area_of_interest = area_of_interest;

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const [volunteers, total] = await Promise.all([
    Volunteer.find(query)
      .sort(buildSort(sortField, sortDir))
      .skip(skip)
      .limit(parseInt(limit))
      .lean(),
    Volunteer.countDocuments(query),
  ]);

  const hidden = getHiddenFields(req);
  const safeVolunteers = stripHiddenFields(volunteers, hidden);

  return sendSuccess(res, 200, "Volunteers retrieved successfully.", {
    volunteers: safeVolunteers,
    total,
    page:  parseInt(page),
    pages: Math.ceil(total / parseInt(limit)),
  });
});

// ── GET /organisations/volunteers/:id ─────────────────────────────────────────
export const getVolunteerById = asyncHandler(async (req, res) => {
  const volunteer = await Volunteer.findById(req.params.id)
    .populate("registered_by", "fullName email");
  if (!volunteer) return sendError(res, 404, "Volunteer not found.");

  if (req.user.role === "data_entry" && !verifyOwnRecord(volunteer, req.user._id)) {
    return sendError(res, 403, "You can only view records you created.");
  }

  const hidden = getHiddenFields(req);
  const safeVolunteer = stripHiddenFields(volunteer.toObject(), hidden);

  return sendSuccess(res, 200, "Volunteer retrieved successfully.", { volunteer: safeVolunteer });
});

// ── PUT /organisations/volunteers/:id ─────────────────────────────────────────
export const updateVolunteer = asyncHandler(async (req, res) => {
  if (req.user.role === "data_entry") {
    const existing = await Volunteer.findById(req.params.id).lean();
    if (!existing) return sendError(res, 404, "Volunteer not found.");
    if (!verifyOwnRecord(existing, req.user._id)) {
      return sendError(res, 403, "You can only edit records you created.");
    }
  }

  const allowed = [
    "name", "phone", "email", "website", "address",
    "city", "district", "state", "area_of_interest",
    "remarks", "status", "follow_up_date",
  ];
  const updates = {};
  allowed.forEach((f) => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });

  try {
    const volunteer = await Volunteer.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true, context: "query" }
    );
    if (!volunteer) return sendError(res, 404, "Volunteer not found.");
    return sendSuccess(res, 200, "Volunteer updated successfully.", { volunteer });
  } catch (err) {
    if (err.code === 11000)             return sendError(res, 409, handleDuplicateKey(err));
    if (err.name === "ValidationError") return sendError(res, 422, Object.values(err.errors).map((e) => e.message).join(" | "));
    throw err;
  }
});

// ── DELETE /organisations/volunteers/:id ──────────────────────────────────────
export const deleteVolunteer = asyncHandler(async (req, res) => {
  if (req.user.role === "data_entry") {
    const existing = await Volunteer.findById(req.params.id).lean();
    if (!existing) return sendError(res, 404, "Volunteer not found.");
    if (!verifyOwnRecord(existing, req.user._id)) {
      return sendError(res, 403, "You can only delete records you created.");
    }
  }

  const volunteer = await Volunteer.findByIdAndDelete(req.params.id);
  if (!volunteer) return sendError(res, 404, "Volunteer not found.");
  return sendSuccess(res, 200, "Volunteer deleted successfully.");
});

// ── GET /organisations/upcoming-interactions ──────────────────────────────────
// FIX: startOfToday use karo taaki date-only records (00:00 UTC) bhi include hon
export const getUpcomingInteractions = asyncHandler(async (req, res) => {
  const now = new Date();

  // Aaj ke din ka start (00:00:00.000) — date-only stored values ke liye zaroori
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);

  // Aaj se 48 ghante aage tak
  const in48h = new Date(now.getTime() + 48 * 60 * 60 * 1000);

  const query = {
    "interactions.nextInteractionDate": {
      $gte: startOfToday, // ← fix: now ki jagah startOfToday
      $lte: in48h,
    },
  };

  // data_entry: sirf apne records
  if (req.user.role === "data_entry") {
    query.registeredBy = req.user._id;
  }

  // partial_admin: allowed centreTypes ke hisaab se filter
  if (req.user.role === "partial_admin") {
    const mods = req.user.permissions?.allowedModules ?? [];
    const CENTRE_TYPES = ["School", "College", "NGO", "Corporate", "Online", "Community Centre"];
    const ctMods = mods.filter((m) => CENTRE_TYPES.includes(m));
    if (ctMods.length > 0 && !mods.includes("organisation")) {
      query.centreType = { $in: ctMods };
    }
  }

  const orgs = await Organisation.find(query)
    .select("centreName centreType interactions")
    .lean({ virtuals: false });

  // Flatten: har qualifying interaction entry ke liye ek notification
  const interactions = [];

  for (const org of orgs) {
    const entries = org.interactions || [];
    entries.forEach((entry, idx) => {
      if (!entry.nextInteractionDate) return;
      const d = new Date(entry.nextInteractionDate);

      // FIX: startOfToday se compare karo, sirf in48h tak
      if (d >= startOfToday && d <= in48h) {
        interactions.push({
          _id:                 org._id,
          centreName:          org.centreName,
          centreType:          org.centreType,
          interactionIndex:    idx,
          interactionMode:     entry.interactionMode,
          interactedWith:      entry.interactedWith,
          interactionBy:       entry.interactionBy,
          notes:               entry.notes,
          nextInteractionDate: entry.nextInteractionDate,
          interactionDate:     entry.interactionDate,
        });
      }
    });
  }

  // nextInteractionDate ascending sort (sabse urgent pehle)
  interactions.sort((a, b) => new Date(a.nextInteractionDate) - new Date(b.nextInteractionDate));

  return sendSuccess(res, 200, "Upcoming interactions retrieved successfully.", {
    interactions,
    total: interactions.length,
  });
});

// ── POST /organisations/:id/interactions/cancel ───────────────────────────────
export const cancelNextInteraction = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { interactionIndex } = req.body;

  if (interactionIndex === undefined || interactionIndex === null) {
    return sendError(res, 422, "interactionIndex is required.");
  }

  const org = await Organisation.findById(id);
  if (!org) return sendError(res, 404, "Organisation not found.");

  // data_entry: ownership verify karo
  if (req.user.role === "data_entry" && !verifyOwnRecord(org, req.user._id)) {
    return sendError(res, 403, "You can only edit records you created.");
  }

  const entry = org.interactions[interactionIndex];
  if (!entry) return sendError(res, 404, "Interaction entry not found.");

  // nextInteractionDate clear karo — interaction "cancelled"
  org.interactions[interactionIndex].nextInteractionDate = undefined;
  org.markModified("interactions");
  await org.save({ validateBeforeSave: false });

  return sendSuccess(res, 200, "Next interaction date cancelled successfully.");
});
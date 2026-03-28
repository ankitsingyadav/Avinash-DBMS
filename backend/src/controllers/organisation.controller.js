// controllers/organisation.controller.js  (volunteers)
import Volunteer from "../models/volunteer.model.js";
import { asyncHandler, sendSuccess, sendError } from "../utils/response.utils.js";

const BULK_LIMIT = 500;

const SORT_WHITELIST = new Set([
  "name", "email", "city", "district", "state", "status", "follow_up_date", "createdAt", "updatedAt",
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

  const query = { ...buildDateFilter(dateFrom, dateTo) };

  if (search && search.trim()) {
    const regex = { $regex: search.trim(), $options: "i" };
    query.$or = [
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

  return sendSuccess(res, 200, "Volunteers retrieved successfully.", {
    volunteers,
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
  return sendSuccess(res, 200, "Volunteer retrieved successfully.", { volunteer });
});

// ── PUT /organisations/volunteers/:id ─────────────────────────────────────────
export const updateVolunteer = asyncHandler(async (req, res) => {
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
  const volunteer = await Volunteer.findByIdAndDelete(req.params.id);
  if (!volunteer) return sendError(res, 404, "Volunteer not found.");
  return sendSuccess(res, 200, "Volunteer deleted successfully.");
});
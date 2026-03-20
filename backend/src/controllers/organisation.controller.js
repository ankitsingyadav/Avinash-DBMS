// controllers/organisation.controller.js
import School    from "../models/school.model.js";
import College   from "../models/college.model.js";
import NGO       from "../models/ngo.model.js";
import Volunteer from "../models/volunteer.model.js";
import { asyncHandler, sendSuccess, sendError } from "../utils/response.utils.js";

// ── Constants ──────────────────────────────────────────────────────────────────

const BULK_LIMIT = 500; // Maximum records allowed per bulk import request

const SORT_WHITELIST = {
  school:    new Set(["name","email","city","state","status","follow_up_date","createdAt","updatedAt"]),
  college:   new Set(["name","email","city","state","status","follow_up_date","createdAt","updatedAt"]),
  ngo:       new Set(["name","email","city","state","status","follow_up_date","createdAt","updatedAt"]),
  volunteer: new Set(["name","email","city","state","status","follow_up_date","createdAt","updatedAt"]),
};

// ── Helpers ────────────────────────────────────────────────────────────────────

/**
 * Returns a safe sort object. Falls back to createdAt desc if the field
 * is not in the whitelist, preventing arbitrary field injection.
 */
const buildSort = (type, sortField = "createdAt", sortDir = "desc") => {
  const allowed = SORT_WHITELIST[type];
  const field   = allowed.has(sortField) ? sortField : "createdAt";
  return { [field]: sortDir === "asc" ? 1 : -1 };
};

/**
 * Builds a createdAt date range filter from optional dateFrom / dateTo query params.
 * dateTo is set to end-of-day (23:59:59.999) so the full day is included.
 */
const buildDateFilter = (dateFrom, dateTo) => {
  if (!dateFrom && !dateTo) return {};
  const filter = { createdAt: {} };
  if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
  if (dateTo)   filter.createdAt.$lte = new Date(new Date(dateTo).setHours(23, 59, 59, 999));
  return filter;
};

/**
 * Returns a user-friendly message for MongoDB duplicate key errors (code 11000).
 * Covers email and phone — the two unique fields across all organisation models.
 */
const handleDuplicateKey = (err) => {
  const field = Object.keys(err.keyPattern || {})[0];
  const labels = { email: "Email address", phone: "Phone number" };
  return `${labels[field] || field} is already registered.`;
};

/**
 * Runs insertMany with ordered: false so that duplicate-key errors on individual
 * records do not abort the entire batch. Returns counts for inserted and failed records.
 */
const bulkInsert = async (Model, records) => {
  try {
    const result = await Model.insertMany(records, { ordered: false });
    return { inserted: result.length, failed: 0 };
  } catch (err) {
    // Partial success — some records inserted, some failed (e.g. duplicates)
    if (err.name === "BulkWriteError") {
      const inserted = err.result?.nInserted ?? 0;
      const failed   = records.length - inserted;
      return { inserted, failed };
    }
    throw err;
  }
};

// ── SCHOOLS ────────────────────────────────────────────────────────────────────

/**
 * POST /organisations/schools
 * Creates a single school record.
 */
export const createSchool = asyncHandler(async (req, res) => {
  const {
    name, school_type, phone, email, website,
    address, city, state, principal_name,
    remarks, status, follow_up_date,
  } = req.body;

  if (!name || !school_type || !phone || !email || !address || !city || !state || !principal_name)
    return sendError(res, 422, "Missing required fields: name, school_type, phone, email, address, city, state, principal_name.");

  try {
    const school = await School.create({
      name: name.trim(),
      school_type,
      phone: phone.trim(),
      email: email.toLowerCase().trim(),
      website: website?.trim() || "NA",
      address: address.trim(),
      city: city.trim(),
      state: state.trim(),
      principal_name: principal_name.trim(),
      remarks: remarks?.trim() || null,
      status: status || "Active",
      follow_up_date: follow_up_date || null,
      registered_by: req.user._id,
    });
    return sendSuccess(res, 201, "School registered successfully.", { school });
  } catch (err) {
    if (err.code === 11000)          return sendError(res, 409, handleDuplicateKey(err));
    if (err.name === "ValidationError")
      return sendError(res, 422, Object.values(err.errors).map((e) => e.message).join(" | "));
    throw err;
  }
});

/**
 * POST /organisations/schools/bulk
 * Inserts up to 500 school records in a single request.
 * Uses ordered: false so duplicate records are skipped without aborting the batch.
 */
export const bulkCreateSchools = asyncHandler(async (req, res) => {
  const { records } = req.body;

  if (!Array.isArray(records) || records.length === 0)
    return sendError(res, 422, "Request body must contain a non-empty records array.");
  if (records.length > BULK_LIMIT)
    return sendError(res, 422, `Batch size exceeds the maximum limit of ${BULK_LIMIT} records.`);

  // Sanitise each record before insert
  const sanitised = records.map((r) => ({
    name:           r.name?.trim(),
    school_type:    r.school_type,
    phone:          r.phone?.trim(),
    email:          r.email?.toLowerCase().trim(),
    website:        r.website?.trim() || "NA",
    address:        r.address?.trim(),
    city:           r.city?.trim(),
    state:          r.state?.trim(),
    principal_name: r.principal_name?.trim(),
    remarks:        r.remarks?.trim() || null,
    status:         r.status || "Active",
    follow_up_date: r.follow_up_date || null,
    registered_by:  req.user._id,
  }));

  const { inserted, failed } = await bulkInsert(School, sanitised);
  return sendSuccess(res, 201, "Bulk import completed.", { inserted, failed, total: records.length });
});

/**
 * GET /organisations/schools
 * Returns a paginated, filtered, and sorted list of schools.
 * Supports: search (full-text), status, state, school_type, dateFrom, dateTo, sortField, sortDir.
 */
export const getAllSchools = asyncHandler(async (req, res) => {
  const {
    page = 1, limit = 12,
    search, sortField, sortDir,
    dateFrom, dateTo,
    status, state, school_type,
  } = req.query;

  const query = { ...buildDateFilter(dateFrom, dateTo) };
  if (search)      query.$text       = { $search: search };
  if (status)      query.status      = status;
  if (state)       query.state       = state;
  if (school_type) query.school_type = school_type;

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const [schools, total] = await Promise.all([
    School.find(query)
      .sort(buildSort("school", sortField, sortDir))
      .skip(skip)
      .limit(parseInt(limit))
      .lean(),
    School.countDocuments(query),
  ]);

  return sendSuccess(res, 200, "Schools retrieved successfully.", {
    schools,
    total,
    page:  parseInt(page),
    pages: Math.ceil(total / parseInt(limit)),
  });
});

/**
 * GET /organisations/schools/:id
 * Returns a single school by ID, with registered_by user details populated.
 */
export const getSchoolById = asyncHandler(async (req, res) => {
  const school = await School.findById(req.params.id)
    .populate("registered_by", "fullName email");
  if (!school) return sendError(res, 404, "School not found.");
  return sendSuccess(res, 200, "School retrieved successfully.", { school });
});

/**
 * PUT /organisations/schools/:id
 * Updates allowed fields on a school record.
 */
export const updateSchool = asyncHandler(async (req, res) => {
  const allowed = [
    "name","school_type","phone","email","website",
    "address","city","state","principal_name",
    "remarks","status","follow_up_date",
  ];
  const updates = {};
  allowed.forEach((f) => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });

  try {
    const school = await School.findByIdAndUpdate(
      req.params.id, updates, { new: true, runValidators: true }
    );
    if (!school) return sendError(res, 404, "School not found.");
    return sendSuccess(res, 200, "School updated successfully.", { school });
  } catch (err) {
    if (err.code === 11000)          return sendError(res, 409, handleDuplicateKey(err));
    if (err.name === "ValidationError")
      return sendError(res, 422, Object.values(err.errors).map((e) => e.message).join(" | "));
    throw err;
  }
});

/**
 * DELETE /organisations/schools/:id
 * Permanently removes a school record.
 */
export const deleteSchool = asyncHandler(async (req, res) => {
  const school = await School.findByIdAndDelete(req.params.id);
  if (!school) return sendError(res, 404, "School not found.");
  return sendSuccess(res, 200, "School deleted successfully.");
});

// ── COLLEGES ───────────────────────────────────────────────────────────────────

/**
 * POST /organisations/colleges
 */
export const createCollege = asyncHandler(async (req, res) => {
  const {
    name, college_type, phone, email, website,
    address, city, state, placement_officer,
    remarks, status, follow_up_date,
  } = req.body;

  if (!name || !college_type || !phone || !email || !address || !city || !state || !placement_officer)
    return sendError(res, 422, "Missing required fields: name, college_type, phone, email, address, city, state, placement_officer.");

  try {
    const college = await College.create({
      name: name.trim(),
      college_type,
      phone: phone.trim(),
      email: email.toLowerCase().trim(),
      website: website?.trim() || "NA",
      address: address.trim(),
      city: city.trim(),
      state: state.trim(),
      placement_officer: placement_officer.trim(),
      remarks: remarks?.trim() || null,
      status: status || "Active",
      follow_up_date: follow_up_date || null,
      registered_by: req.user._id,
    });
    return sendSuccess(res, 201, "College registered successfully.", { college });
  } catch (err) {
    if (err.code === 11000)          return sendError(res, 409, handleDuplicateKey(err));
    if (err.name === "ValidationError")
      return sendError(res, 422, Object.values(err.errors).map((e) => e.message).join(" | "));
    throw err;
  }
});

/**
 * POST /organisations/colleges/bulk
 */
export const bulkCreateColleges = asyncHandler(async (req, res) => {
  const { records } = req.body;
  if (!Array.isArray(records) || records.length === 0)
    return sendError(res, 422, "Request body must contain a non-empty records array.");
  if (records.length > BULK_LIMIT)
    return sendError(res, 422, `Batch size exceeds the maximum limit of ${BULK_LIMIT} records.`);

  const sanitised = records.map((r) => ({
    name:              r.name?.trim(),
    college_type:      r.college_type,
    phone:             r.phone?.trim(),
    email:             r.email?.toLowerCase().trim(),
    website:           r.website?.trim() || "NA",
    address:           r.address?.trim(),
    city:              r.city?.trim(),
    state:             r.state?.trim(),
    placement_officer: r.placement_officer?.trim(),
    remarks:           r.remarks?.trim() || null,
    status:            r.status || "Active",
    follow_up_date:    r.follow_up_date || null,
    registered_by:     req.user._id,
  }));

  const { inserted, failed } = await bulkInsert(College, sanitised);
  return sendSuccess(res, 201, "Bulk import completed.", { inserted, failed, total: records.length });
});

/**
 * GET /organisations/colleges
 */
export const getAllColleges = asyncHandler(async (req, res) => {
  const {
    page = 1, limit = 12,
    search, sortField, sortDir,
    dateFrom, dateTo,
    status, state, college_type,
  } = req.query;

  const query = { ...buildDateFilter(dateFrom, dateTo) };
  if (search)       query.$text        = { $search: search };
  if (status)       query.status       = status;
  if (state)        query.state        = state;
  if (college_type) query.college_type = college_type;

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const [colleges, total] = await Promise.all([
    College.find(query)
      .sort(buildSort("college", sortField, sortDir))
      .skip(skip)
      .limit(parseInt(limit))
      .lean(),
    College.countDocuments(query),
  ]);

  return sendSuccess(res, 200, "Colleges retrieved successfully.", {
    colleges,
    total,
    page:  parseInt(page),
    pages: Math.ceil(total / parseInt(limit)),
  });
});

/**
 * GET /organisations/colleges/:id
 */
export const getCollegeById = asyncHandler(async (req, res) => {
  const college = await College.findById(req.params.id)
    .populate("registered_by", "fullName email");
  if (!college) return sendError(res, 404, "College not found.");
  return sendSuccess(res, 200, "College retrieved successfully.", { college });
});

/**
 * PUT /organisations/colleges/:id
 */
export const updateCollege = asyncHandler(async (req, res) => {
  const allowed = [
    "name","college_type","phone","email","website",
    "address","city","state","placement_officer",
    "remarks","status","follow_up_date",
  ];
  const updates = {};
  allowed.forEach((f) => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });

  try {
    const college = await College.findByIdAndUpdate(
      req.params.id, updates, { new: true, runValidators: true }
    );
    if (!college) return sendError(res, 404, "College not found.");
    return sendSuccess(res, 200, "College updated successfully.", { college });
  } catch (err) {
    if (err.code === 11000)          return sendError(res, 409, handleDuplicateKey(err));
    if (err.name === "ValidationError")
      return sendError(res, 422, Object.values(err.errors).map((e) => e.message).join(" | "));
    throw err;
  }
});

/**
 * DELETE /organisations/colleges/:id
 */
export const deleteCollege = asyncHandler(async (req, res) => {
  const college = await College.findByIdAndDelete(req.params.id);
  if (!college) return sendError(res, 404, "College not found.");
  return sendSuccess(res, 200, "College deleted successfully.");
});

// ── NGOs ───────────────────────────────────────────────────────────────────────

/**
 * POST /organisations/ngos
 */
export const createNGO = asyncHandler(async (req, res) => {
  const {
    name, ngo_type, phone, email, website,
    address, city, state, coordinator_name,
    remarks, status, follow_up_date,
  } = req.body;

  if (!name || !ngo_type || !phone || !email || !address || !city || !state || !coordinator_name)
    return sendError(res, 422, "Missing required fields: name, ngo_type, phone, email, address, city, state, coordinator_name.");

  try {
    const ngo = await NGO.create({
      name: name.trim(),
      ngo_type,
      phone: phone.trim(),
      email: email.toLowerCase().trim(),
      website: website?.trim() || "NA",
      address: address.trim(),
      city: city.trim(),
      state: state.trim(),
      coordinator_name: coordinator_name.trim(),
      remarks: remarks?.trim() || null,
      status: status || "Active",
      follow_up_date: follow_up_date || null,
      registered_by: req.user._id,
    });
    return sendSuccess(res, 201, "NGO registered successfully.", { ngo });
  } catch (err) {
    if (err.code === 11000)          return sendError(res, 409, handleDuplicateKey(err));
    if (err.name === "ValidationError")
      return sendError(res, 422, Object.values(err.errors).map((e) => e.message).join(" | "));
    throw err;
  }
});

/**
 * POST /organisations/ngos/bulk
 */
export const bulkCreateNGOs = asyncHandler(async (req, res) => {
  const { records } = req.body;
  if (!Array.isArray(records) || records.length === 0)
    return sendError(res, 422, "Request body must contain a non-empty records array.");
  if (records.length > BULK_LIMIT)
    return sendError(res, 422, `Batch size exceeds the maximum limit of ${BULK_LIMIT} records.`);

  const sanitised = records.map((r) => ({
    name:             r.name?.trim(),
    ngo_type:         r.ngo_type,
    phone:            r.phone?.trim(),
    email:            r.email?.toLowerCase().trim(),
    website:          r.website?.trim() || "NA",
    address:          r.address?.trim(),
    city:             r.city?.trim(),
    state:            r.state?.trim(),
    coordinator_name: r.coordinator_name?.trim(),
    remarks:          r.remarks?.trim() || null,
    status:           r.status || "Active",
    follow_up_date:   r.follow_up_date || null,
    registered_by:    req.user._id,
  }));

  const { inserted, failed } = await bulkInsert(NGO, sanitised);
  return sendSuccess(res, 201, "Bulk import completed.", { inserted, failed, total: records.length });
});

/**
 * GET /organisations/ngos
 */
export const getAllNGOs = asyncHandler(async (req, res) => {
  const {
    page = 1, limit = 12,
    search, sortField, sortDir,
    dateFrom, dateTo,
    status, state, ngo_type,
  } = req.query;

  const query = { ...buildDateFilter(dateFrom, dateTo) };
  if (search)   query.$text    = { $search: search };
  if (status)   query.status   = status;
  if (state)    query.state    = state;
  if (ngo_type) query.ngo_type = ngo_type;

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const [ngos, total] = await Promise.all([
    NGO.find(query)
      .sort(buildSort("ngo", sortField, sortDir))
      .skip(skip)
      .limit(parseInt(limit))
      .lean(),
    NGO.countDocuments(query),
  ]);

  return sendSuccess(res, 200, "NGOs retrieved successfully.", {
    ngos,
    total,
    page:  parseInt(page),
    pages: Math.ceil(total / parseInt(limit)),
  });
});

/**
 * GET /organisations/ngos/:id
 */
export const getNGOById = asyncHandler(async (req, res) => {
  const ngo = await NGO.findById(req.params.id)
    .populate("registered_by", "fullName email");
  if (!ngo) return sendError(res, 404, "NGO not found.");
  return sendSuccess(res, 200, "NGO retrieved successfully.", { ngo });
});

/**
 * PUT /organisations/ngos/:id
 */
export const updateNGO = asyncHandler(async (req, res) => {
  const allowed = [
    "name","ngo_type","phone","email","website",
    "address","city","state","coordinator_name",
    "remarks","status","follow_up_date",
  ];
  const updates = {};
  allowed.forEach((f) => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });

  try {
    const ngo = await NGO.findByIdAndUpdate(
      req.params.id, updates, { new: true, runValidators: true }
    );
    if (!ngo) return sendError(res, 404, "NGO not found.");
    return sendSuccess(res, 200, "NGO updated successfully.", { ngo });
  } catch (err) {
    if (err.code === 11000)          return sendError(res, 409, handleDuplicateKey(err));
    if (err.name === "ValidationError")
      return sendError(res, 422, Object.values(err.errors).map((e) => e.message).join(" | "));
    throw err;
  }
});

/**
 * DELETE /organisations/ngos/:id
 */
export const deleteNGO = asyncHandler(async (req, res) => {
  const ngo = await NGO.findByIdAndDelete(req.params.id);
  if (!ngo) return sendError(res, 404, "NGO not found.");
  return sendSuccess(res, 200, "NGO deleted successfully.");
});

// ── VOLUNTEERS ─────────────────────────────────────────────────────────────────

/**
 * POST /organisations/volunteers
 */
export const createVolunteer = asyncHandler(async (req, res) => {
  const {
    name, phone, email, website,
    address, city, state, area_of_interest,
    remarks, status, follow_up_date,
  } = req.body;

  if (!name || !phone || !email || !city || !state || !area_of_interest)
    return sendError(res, 422, "Missing required fields: name, phone, email, city, state, area_of_interest.");

  try {
    const volunteer = await Volunteer.create({
      name: name.trim(),
      volunteer_type: "Individual Volunteer",
      phone: phone.trim(),
      email: email.toLowerCase().trim(),
      website: website?.trim() || "NA",
      address: address?.trim() || null,
      city: city.trim(),
      state: state.trim(),
      area_of_interest,
      remarks: remarks?.trim() || null,
      status: status || "Active",
      follow_up_date: follow_up_date || null,
      registered_by: req.user._id,
    });
    return sendSuccess(res, 201, "Volunteer registered successfully.", { volunteer });
  } catch (err) {
    if (err.code === 11000)          return sendError(res, 409, handleDuplicateKey(err));
    if (err.name === "ValidationError")
      return sendError(res, 422, Object.values(err.errors).map((e) => e.message).join(" | "));
    throw err;
  }
});

/**
 * POST /organisations/volunteers/bulk
 */
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

/**
 * GET /organisations/volunteers
 */
export const getAllVolunteers = asyncHandler(async (req, res) => {
  const {
    page = 1, limit = 12,
    search, sortField, sortDir,
    dateFrom, dateTo,
    status, state, area_of_interest,
  } = req.query;

  const query = { ...buildDateFilter(dateFrom, dateTo) };
  if (search)           query.$text           = { $search: search };
  if (status)           query.status          = status;
  if (state)            query.state           = state;
  if (area_of_interest) query.area_of_interest = area_of_interest;

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const [volunteers, total] = await Promise.all([
    Volunteer.find(query)
      .sort(buildSort("volunteer", sortField, sortDir))
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

/**
 * GET /organisations/volunteers/:id
 */
export const getVolunteerById = asyncHandler(async (req, res) => {
  const volunteer = await Volunteer.findById(req.params.id)
    .populate("registered_by", "fullName email");
  if (!volunteer) return sendError(res, 404, "Volunteer not found.");
  return sendSuccess(res, 200, "Volunteer retrieved successfully.", { volunteer });
});

/**
 * PUT /organisations/volunteers/:id
 */
export const updateVolunteer = asyncHandler(async (req, res) => {
  const allowed = [
    "name","phone","email","website","address",
    "city","state","area_of_interest",
    "remarks","status","follow_up_date",
  ];
  const updates = {};
  allowed.forEach((f) => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });

  try {
    const volunteer = await Volunteer.findByIdAndUpdate(
      req.params.id, updates, { new: true, runValidators: true }
    );
    if (!volunteer) return sendError(res, 404, "Volunteer not found.");
    return sendSuccess(res, 200, "Volunteer updated successfully.", { volunteer });
  } catch (err) {
    if (err.code === 11000)          return sendError(res, 409, handleDuplicateKey(err));
    if (err.name === "ValidationError")
      return sendError(res, 422, Object.values(err.errors).map((e) => e.message).join(" | "));
    throw err;
  }
});

/**
 * DELETE /organisations/volunteers/:id
 */
export const deleteVolunteer = asyncHandler(async (req, res) => {
  const volunteer = await Volunteer.findByIdAndDelete(req.params.id);
  if (!volunteer) return sendError(res, 404, "Volunteer not found.");
  return sendSuccess(res, 200, "Volunteer deleted successfully.");
});
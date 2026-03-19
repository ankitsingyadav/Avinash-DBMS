// organisation.controller.js — updated with new schema fields
import School    from "../models/school.model.js";
import College   from "../models/college.model.js";
import NGO       from "../models/ngo.model.js";
import Volunteer from "../models/volunteer.model.js";
import { asyncHandler, sendSuccess, sendError } from "../utils/response.utils.js";

const SORT_WHITELIST = {
  school:    new Set(["name","email","city","state","status","follow_up_date","createdAt","updatedAt"]),
  college:   new Set(["name","email","city","state","status","follow_up_date","createdAt","updatedAt"]),
  ngo:       new Set(["name","email","city","state","status","follow_up_date","createdAt","updatedAt"]),
  volunteer: new Set(["name","email","city","state","status","follow_up_date","createdAt","updatedAt"]),
};

const buildSort = (type, sortField = "createdAt", sortDir = "desc") => {
  const allowed = SORT_WHITELIST[type];
  const field   = allowed.has(sortField) ? sortField : "createdAt";
  return { [field]: sortDir === "asc" ? 1 : -1 };
};

const buildDateFilter = (dateFrom, dateTo) => {
  const filter = {};
  if (dateFrom || dateTo) {
    filter.createdAt = {};
    if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
    if (dateTo)   filter.createdAt.$lte = new Date(new Date(dateTo).setHours(23,59,59,999));
  }
  return filter;
};

const handleDuplicateKey = (err) => {
  const field = Object.keys(err.keyPattern || {})[0];
  const map = { email: "Email", phone: "Phone number" };
  return `${map[field] || field} is already registered.`;
};

// ── SCHOOL ──────────────────────────────────────────────────────────────────

export const createSchool = asyncHandler(async (req, res) => {
  const { name, school_type, phone, email, website, address, city, state, principal_name, remarks, status, follow_up_date } = req.body;
  if (!name || !school_type || !phone || !email || !address || !city || !state || !principal_name)
    return sendError(res, 422, "Missing required fields.");
  try {
    const school = await School.create({
      name: name.trim(), school_type, phone: phone.trim(),
      email: email.toLowerCase().trim(),
      website: website?.trim() || "NA",
      address: address.trim(), city: city.trim(), state: state.trim(),
      principal_name: principal_name.trim(),
      remarks: remarks?.trim() || null,
      status: status || "Active",
      follow_up_date: follow_up_date || null,
      registered_by: req.user._id,
    });
    return sendSuccess(res, 201, "School registered successfully.", { school });
  } catch (err) {
    if (err.code === 11000) return sendError(res, 409, handleDuplicateKey(err));
    if (err.name === "ValidationError") return sendError(res, 422, Object.values(err.errors).map(e => e.message).join(" | "));
    throw err;
  }
});

export const getAllSchools = asyncHandler(async (req, res) => {
  const { page = 1, limit = 12, search, sortField, sortDir, dateFrom, dateTo, status, state, school_type } = req.query;
  const query = { ...buildDateFilter(dateFrom, dateTo) };
  if (search)      query.$text        = { $search: search };
  if (status)      query.status       = status;
  if (state)       query.state        = state;
  if (school_type) query.school_type  = school_type;
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const [schools, total] = await Promise.all([
    School.find(query).sort(buildSort("school", sortField, sortDir)).skip(skip).limit(parseInt(limit)),
    School.countDocuments(query),
  ]);
  return sendSuccess(res, 200, "Schools retrieved.", { schools, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
});

export const getSchoolById = asyncHandler(async (req, res) => {
  const school = await School.findById(req.params.id).populate("registered_by", "fullName email");
  if (!school) return sendError(res, 404, "School not found.");
  return sendSuccess(res, 200, "School retrieved.", { school });
});

export const updateSchool = asyncHandler(async (req, res) => {
  const allowed = ["name","school_type","phone","email","website","address","city","state","principal_name","remarks","status","follow_up_date"];
  const updates = {};
  allowed.forEach(f => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });
  try {
    const school = await School.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
    if (!school) return sendError(res, 404, "School not found.");
    return sendSuccess(res, 200, "School updated.", { school });
  } catch (err) {
    if (err.code === 11000) return sendError(res, 409, handleDuplicateKey(err));
    if (err.name === "ValidationError") return sendError(res, 422, Object.values(err.errors).map(e => e.message).join(" | "));
    throw err;
  }
});

export const deleteSchool = asyncHandler(async (req, res) => {
  const school = await School.findByIdAndDelete(req.params.id);
  if (!school) return sendError(res, 404, "School not found.");
  return sendSuccess(res, 200, "School deleted successfully.");
});

// ── COLLEGE ──────────────────────────────────────────────────────────────────

export const createCollege = asyncHandler(async (req, res) => {
  const { name, college_type, phone, email, website, address, city, state, placement_officer, remarks, status, follow_up_date } = req.body;
  if (!name || !college_type || !phone || !email || !address || !city || !state || !placement_officer)
    return sendError(res, 422, "Missing required fields.");
  try {
    const college = await College.create({
      name: name.trim(), college_type, phone: phone.trim(),
      email: email.toLowerCase().trim(),
      website: website?.trim() || "NA",
      address: address.trim(), city: city.trim(), state: state.trim(),
      placement_officer: placement_officer.trim(),
      remarks: remarks?.trim() || null,
      status: status || "Active",
      follow_up_date: follow_up_date || null,
      registered_by: req.user._id,
    });
    return sendSuccess(res, 201, "College registered successfully.", { college });
  } catch (err) {
    if (err.code === 11000) return sendError(res, 409, handleDuplicateKey(err));
    if (err.name === "ValidationError") return sendError(res, 422, Object.values(err.errors).map(e => e.message).join(" | "));
    throw err;
  }
});

export const getAllColleges = asyncHandler(async (req, res) => {
  const { page = 1, limit = 12, search, sortField, sortDir, dateFrom, dateTo, status, state, college_type } = req.query;
  const query = { ...buildDateFilter(dateFrom, dateTo) };
  if (search)       query.$text         = { $search: search };
  if (status)       query.status        = status;
  if (state)        query.state         = state;
  if (college_type) query.college_type  = college_type;
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const [colleges, total] = await Promise.all([
    College.find(query).sort(buildSort("college", sortField, sortDir)).skip(skip).limit(parseInt(limit)),
    College.countDocuments(query),
  ]);
  return sendSuccess(res, 200, "Colleges retrieved.", { colleges, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
});

export const getCollegeById = asyncHandler(async (req, res) => {
  const college = await College.findById(req.params.id).populate("registered_by", "fullName email");
  if (!college) return sendError(res, 404, "College not found.");
  return sendSuccess(res, 200, "College retrieved.", { college });
});

export const updateCollege = asyncHandler(async (req, res) => {
  const allowed = ["name","college_type","phone","email","website","address","city","state","placement_officer","remarks","status","follow_up_date"];
  const updates = {};
  allowed.forEach(f => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });
  try {
    const college = await College.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
    if (!college) return sendError(res, 404, "College not found.");
    return sendSuccess(res, 200, "College updated.", { college });
  } catch (err) {
    if (err.code === 11000) return sendError(res, 409, handleDuplicateKey(err));
    if (err.name === "ValidationError") return sendError(res, 422, Object.values(err.errors).map(e => e.message).join(" | "));
    throw err;
  }
});

export const deleteCollege = asyncHandler(async (req, res) => {
  const college = await College.findByIdAndDelete(req.params.id);
  if (!college) return sendError(res, 404, "College not found.");
  return sendSuccess(res, 200, "College deleted successfully.");
});

// ── NGO ──────────────────────────────────────────────────────────────────────

export const createNGO = asyncHandler(async (req, res) => {
  const { name, ngo_type, phone, email, website, address, city, state, coordinator_name, remarks, status, follow_up_date } = req.body;
  if (!name || !ngo_type || !phone || !email || !address || !city || !state || !coordinator_name)
    return sendError(res, 422, "Missing required fields.");
  try {
    const ngo = await NGO.create({
      name: name.trim(), ngo_type, phone: phone.trim(),
      email: email.toLowerCase().trim(),
      website: website?.trim() || "NA",
      address: address.trim(), city: city.trim(), state: state.trim(),
      coordinator_name: coordinator_name.trim(),
      remarks: remarks?.trim() || null,
      status: status || "Active",
      follow_up_date: follow_up_date || null,
      registered_by: req.user._id,
    });
    return sendSuccess(res, 201, "NGO registered successfully.", { ngo });
  } catch (err) {
    if (err.code === 11000) return sendError(res, 409, handleDuplicateKey(err));
    if (err.name === "ValidationError") return sendError(res, 422, Object.values(err.errors).map(e => e.message).join(" | "));
    throw err;
  }
});

export const getAllNGOs = asyncHandler(async (req, res) => {
  const { page = 1, limit = 12, search, sortField, sortDir, dateFrom, dateTo, status, state, ngo_type } = req.query;
  const query = { ...buildDateFilter(dateFrom, dateTo) };
  if (search)   query.$text    = { $search: search };
  if (status)   query.status   = status;
  if (state)    query.state    = state;
  if (ngo_type) query.ngo_type = ngo_type;
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const [ngos, total] = await Promise.all([
    NGO.find(query).sort(buildSort("ngo", sortField, sortDir)).skip(skip).limit(parseInt(limit)),
    NGO.countDocuments(query),
  ]);
  return sendSuccess(res, 200, "NGOs retrieved.", { ngos, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
});

export const getNGOById = asyncHandler(async (req, res) => {
  const ngo = await NGO.findById(req.params.id).populate("registered_by", "fullName email");
  if (!ngo) return sendError(res, 404, "NGO not found.");
  return sendSuccess(res, 200, "NGO retrieved.", { ngo });
});

export const updateNGO = asyncHandler(async (req, res) => {
  const allowed = ["name","ngo_type","phone","email","website","address","city","state","coordinator_name","remarks","status","follow_up_date"];
  const updates = {};
  allowed.forEach(f => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });
  try {
    const ngo = await NGO.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
    if (!ngo) return sendError(res, 404, "NGO not found.");
    return sendSuccess(res, 200, "NGO updated.", { ngo });
  } catch (err) {
    if (err.code === 11000) return sendError(res, 409, handleDuplicateKey(err));
    if (err.name === "ValidationError") return sendError(res, 422, Object.values(err.errors).map(e => e.message).join(" | "));
    throw err;
  }
});

export const deleteNGO = asyncHandler(async (req, res) => {
  const ngo = await NGO.findByIdAndDelete(req.params.id);
  if (!ngo) return sendError(res, 404, "NGO not found.");
  return sendSuccess(res, 200, "NGO deleted successfully.");
});

// ── VOLUNTEER ────────────────────────────────────────────────────────────────

export const createVolunteer = asyncHandler(async (req, res) => {
  const { name, phone, email, website, address, city, state, area_of_interest, remarks, status, follow_up_date } = req.body;
  if (!name || !phone || !email || !city || !state || !area_of_interest)
    return sendError(res, 422, "Missing required fields: name, phone, email, city, state, area_of_interest.");
  try {
    const volunteer = await Volunteer.create({
      name: name.trim(), volunteer_type: "Individual Volunteer",
      phone: phone.trim(), email: email.toLowerCase().trim(),
      website: website?.trim() || "NA",
      address: address?.trim() || null,
      city: city.trim(), state: state.trim(),
      area_of_interest,
      remarks: remarks?.trim() || null,
      status: status || "Active",
      follow_up_date: follow_up_date || null,
      registered_by: req.user._id,
    });
    return sendSuccess(res, 201, "Volunteer registered successfully.", { volunteer });
  } catch (err) {
    if (err.code === 11000) return sendError(res, 409, handleDuplicateKey(err));
    if (err.name === "ValidationError") return sendError(res, 422, Object.values(err.errors).map(e => e.message).join(" | "));
    throw err;
  }
});

export const getAllVolunteers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 12, search, sortField, sortDir, dateFrom, dateTo, status, state, area_of_interest } = req.query;
  const query = { ...buildDateFilter(dateFrom, dateTo) };
  if (search)           query.$text = { $search: search };
  if (status)           query.status = status;
  if (state)            query.state  = state;
  if (area_of_interest) query.area_of_interest = area_of_interest;
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const [volunteers, total] = await Promise.all([
    Volunteer.find(query).sort(buildSort("volunteer", sortField, sortDir)).skip(skip).limit(parseInt(limit)),
    Volunteer.countDocuments(query),
  ]);
  return sendSuccess(res, 200, "Volunteers retrieved.", { volunteers, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
});

export const getVolunteerById = asyncHandler(async (req, res) => {
  const volunteer = await Volunteer.findById(req.params.id).populate("registered_by", "fullName email");
  if (!volunteer) return sendError(res, 404, "Volunteer not found.");
  return sendSuccess(res, 200, "Volunteer retrieved.", { volunteer });
});

export const updateVolunteer = asyncHandler(async (req, res) => {
  const allowed = ["name","phone","email","website","address","city","state","area_of_interest","remarks","status","follow_up_date"];
  const updates = {};
  allowed.forEach(f => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });
  try {
    const volunteer = await Volunteer.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
    if (!volunteer) return sendError(res, 404, "Volunteer not found.");
    return sendSuccess(res, 200, "Volunteer updated.", { volunteer });
  } catch (err) {
    if (err.code === 11000) return sendError(res, 409, handleDuplicateKey(err));
    if (err.name === "ValidationError") return sendError(res, 422, Object.values(err.errors).map(e => e.message).join(" | "));
    throw err;
  }
});

export const deleteVolunteer = asyncHandler(async (req, res) => {
  const volunteer = await Volunteer.findByIdAndDelete(req.params.id);
  if (!volunteer) return sendError(res, 404, "Volunteer not found.");
  return sendSuccess(res, 200, "Volunteer deleted successfully.");
});
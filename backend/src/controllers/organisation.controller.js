// organisation.controller.js
// CRUD for School, College, NGO, Volunteer
// All write routes are admin-only (protect + restrictTo("admin") in router)

// Har model apni alag file se import ho raha hai
import School   from "../models/school.model.js";
import College  from "../models/college.model.js";
import NGO      from "../models/ngo.model.js";
import Volunteer from "../models/volunteer.model.js";
import { asyncHandler, sendSuccess, sendError } from "../utils/response.utils.js";

// ─── Helper: handle duplicate key errors from MongoDB ─────────────────────────
const handleDuplicateKey = (err) => {
  const field = Object.keys(err.keyPattern || {})[0];
  const map = { email: "Email", phone: "Phone number", registration_number: "Registration number" };
  const label = map[field] || field;
  return `${label} is already registered. Please use a different one.`;
};

// ════════════════════════════════════════════════════════════════════
// SCHOOL
// ════════════════════════════════════════════════════════════════════

export const createSchool = asyncHandler(async (req, res) => {
  const {
    name, email, phone, address, principal_name,
    established_year, board_affiliation, total_students, website,
  } = req.body;

  if (!name || !email || !phone || !address || !principal_name || !established_year || !board_affiliation) {
    return sendError(res, 422, "Missing required fields: name, email, phone, address, principal_name, established_year, board_affiliation.");
  }

  try {
    const school = await School.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      phone: phone.trim(),
      address: address.trim(),
      principal_name: principal_name.trim(),
      established_year: parseInt(established_year),
      board_affiliation,
      ...(total_students != null && { total_students: parseInt(total_students) }),
      ...(website && { website: website.trim() }),
      registered_by: req.user._id,
    });

    return sendSuccess(res, 201, "School registered successfully.", { school });
  } catch (err) {
    if (err.code === 11000) return sendError(res, 409, handleDuplicateKey(err));
    if (err.name === "ValidationError") {
      const msg = Object.values(err.errors).map((e) => e.message).join(" | ");
      return sendError(res, 422, msg);
    }
    throw err;
  }
});

export const getAllSchools = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, search } = req.query;
  const query = search ? { $text: { $search: search } } : {};
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [schools, total] = await Promise.all([
    School.find(query).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
    School.countDocuments(query),
  ]);

  return sendSuccess(res, 200, "Schools retrieved.", {
    schools, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)),
  });
});

export const getSchoolById = asyncHandler(async (req, res) => {
  const school = await School.findById(req.params.id).populate("registered_by", "fullName email");
  if (!school) return sendError(res, 404, "School not found.");
  return sendSuccess(res, 200, "School retrieved.", { school });
});

export const updateSchool = asyncHandler(async (req, res) => {
  const allowed = ["name", "email", "phone", "address", "principal_name", "established_year", "board_affiliation", "total_students", "website"];
  const updates = {};
  allowed.forEach((f) => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });

  try {
    const school = await School.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
    if (!school) return sendError(res, 404, "School not found.");
    return sendSuccess(res, 200, "School updated.", { school });
  } catch (err) {
    if (err.code === 11000) return sendError(res, 409, handleDuplicateKey(err));
    if (err.name === "ValidationError") return sendError(res, 422, Object.values(err.errors).map((e) => e.message).join(" | "));
    throw err;
  }
});

export const deleteSchool = asyncHandler(async (req, res) => {
  const school = await School.findByIdAndDelete(req.params.id);
  if (!school) return sendError(res, 404, "School not found.");
  return sendSuccess(res, 200, "School deleted successfully.");
});

// ════════════════════════════════════════════════════════════════════
// COLLEGE
// ════════════════════════════════════════════════════════════════════

export const createCollege = asyncHandler(async (req, res) => {
  const {
    name, email, phone, address, director_name,
    established_year, affiliation_university, college_type,
    total_departments, website,
  } = req.body;

  if (!name || !email || !phone || !address || !director_name || !established_year || !affiliation_university || !college_type) {
    return sendError(res, 422, "Missing required fields.");
  }

  try {
    const college = await College.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      phone: phone.trim(),
      address: address.trim(),
      director_name: director_name.trim(),
      established_year: parseInt(established_year),
      affiliation_university: affiliation_university.trim(),
      college_type,
      ...(total_departments != null && { total_departments: parseInt(total_departments) }),
      ...(website && { website: website.trim() }),
      registered_by: req.user._id,
    });
    return sendSuccess(res, 201, "College registered successfully.", { college });
  } catch (err) {
    if (err.code === 11000) return sendError(res, 409, handleDuplicateKey(err));
    if (err.name === "ValidationError") return sendError(res, 422, Object.values(err.errors).map((e) => e.message).join(" | "));
    throw err;
  }
});

export const getAllColleges = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, search } = req.query;
  const query = search ? { $text: { $search: search } } : {};
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const [colleges, total] = await Promise.all([
    College.find(query).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
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
  const allowed = ["name", "email", "phone", "address", "director_name", "established_year", "affiliation_university", "college_type", "total_departments", "website"];
  const updates = {};
  allowed.forEach((f) => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });
  try {
    const college = await College.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
    if (!college) return sendError(res, 404, "College not found.");
    return sendSuccess(res, 200, "College updated.", { college });
  } catch (err) {
    if (err.code === 11000) return sendError(res, 409, handleDuplicateKey(err));
    if (err.name === "ValidationError") return sendError(res, 422, Object.values(err.errors).map((e) => e.message).join(" | "));
    throw err;
  }
});

export const deleteCollege = asyncHandler(async (req, res) => {
  const college = await College.findByIdAndDelete(req.params.id);
  if (!college) return sendError(res, 404, "College not found.");
  return sendSuccess(res, 200, "College deleted successfully.");
});

// ════════════════════════════════════════════════════════════════════
// NGO
// ════════════════════════════════════════════════════════════════════

export const createNGO = asyncHandler(async (req, res) => {
  const {
    name, email, phone, address, focus_area, head_name,
    registration_number, established_year, website, description,
  } = req.body;

  if (!name || !email || !phone || !address || !focus_area || !head_name || !registration_number || !established_year) {
    return sendError(res, 422, "Missing required fields.");
  }

  try {
    const ngo = await NGO.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      phone: phone.trim(),
      address: address.trim(),
      focus_area,
      head_name: head_name.trim(),
      registration_number: registration_number.trim(),
      established_year: parseInt(established_year),
      ...(website && { website: website.trim() }),
      ...(description && { description: description.trim() }),
      registered_by: req.user._id,
    });
    return sendSuccess(res, 201, "NGO registered successfully.", { ngo });
  } catch (err) {
    if (err.code === 11000) return sendError(res, 409, handleDuplicateKey(err));
    if (err.name === "ValidationError") return sendError(res, 422, Object.values(err.errors).map((e) => e.message).join(" | "));
    throw err;
  }
});

export const getAllNGOs = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, search, focus_area } = req.query;
  const query = {};
  if (search) query.$text = { $search: search };
  if (focus_area) query.focus_area = focus_area;
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const [ngos, total] = await Promise.all([
    NGO.find(query).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
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
  const allowed = ["name", "email", "phone", "address", "focus_area", "head_name", "registration_number", "established_year", "website", "description"];
  const updates = {};
  allowed.forEach((f) => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });
  try {
    const ngo = await NGO.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
    if (!ngo) return sendError(res, 404, "NGO not found.");
    return sendSuccess(res, 200, "NGO updated.", { ngo });
  } catch (err) {
    if (err.code === 11000) return sendError(res, 409, handleDuplicateKey(err));
    if (err.name === "ValidationError") return sendError(res, 422, Object.values(err.errors).map((e) => e.message).join(" | "));
    throw err;
  }
});

export const deleteNGO = asyncHandler(async (req, res) => {
  const ngo = await NGO.findByIdAndDelete(req.params.id);
  if (!ngo) return sendError(res, 404, "NGO not found.");
  return sendSuccess(res, 200, "NGO deleted successfully.");
});

// ════════════════════════════════════════════════════════════════════
// VOLUNTEER
// ════════════════════════════════════════════════════════════════════

export const createVolunteer = asyncHandler(async (req, res) => {
  const { name, email, phone, skills, availability, experience_years, address, assigned_to } = req.body;

  if (!name || !email || !phone || !skills?.length || !availability) {
    return sendError(res, 422, "Missing required fields: name, email, phone, skills, availability.");
  }

  try {
    const volunteer = await Volunteer.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      phone: phone.trim(),
      skills: Array.isArray(skills) ? skills.map((s) => s.trim()) : [skills.trim()],
      availability,
      ...(experience_years != null && { experience_years: parseInt(experience_years) }),
      ...(address && { address: address.trim() }),
      ...(assigned_to?.type && assigned_to?.id && { assigned_to }),
      registered_by: req.user._id,
    });
    return sendSuccess(res, 201, "Volunteer registered successfully.", { volunteer });
  } catch (err) {
    if (err.code === 11000) return sendError(res, 409, handleDuplicateKey(err));
    if (err.name === "ValidationError") return sendError(res, 422, Object.values(err.errors).map((e) => e.message).join(" | "));
    throw err;
  }
});

export const getAllVolunteers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, search, assigned_to_type } = req.query;
  const query = {};
  if (search) query.$text = { $search: search };
  if (assigned_to_type) query["assigned_to.type"] = assigned_to_type;
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const [volunteers, total] = await Promise.all([
    Volunteer.find(query).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
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
  const allowed = ["name", "email", "phone", "skills", "availability", "experience_years", "address", "assigned_to"];
  const updates = {};
  allowed.forEach((f) => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });
  try {
    const volunteer = await Volunteer.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
    if (!volunteer) return sendError(res, 404, "Volunteer not found.");
    return sendSuccess(res, 200, "Volunteer updated.", { volunteer });
  } catch (err) {
    if (err.code === 11000) return sendError(res, 409, handleDuplicateKey(err));
    if (err.name === "ValidationError") return sendError(res, 422, Object.values(err.errors).map((e) => e.message).join(" | "));
    throw err;
  }
});

export const deleteVolunteer = asyncHandler(async (req, res) => {
  const volunteer = await Volunteer.findByIdAndDelete(req.params.id);
  if (!volunteer) return sendError(res, 404, "Volunteer not found.");
  return sendSuccess(res, 200, "Volunteer deleted successfully.");
});
import Organisation from "../models/organisation.model.js";
import { asyncHandler, sendSuccess, sendError } from "../utils/response.utils.js";

/**
 * POST /api/v1/organisations
 * Creates a new organisation.
 */
export const createOrganisation = asyncHandler(async (req, res) => {
  const {
    centreType, centreName, website, address,
    city, state, pincode, contacts, onboardedBy,
  } = req.body;

  if (!centreType || !centreName || !address || !city || !state || !pincode || !contacts || !onboardedBy) {
    return sendError(res, 422, "Missing required fields.");
  }

  try {
    const organisation = await Organisation.create({
      centreType,
      centreName: centreName.trim(),
      website: website?.trim() || "NA",
      address: address.trim(),
      city: city.trim(),
      state: state.trim(),
      pincode: pincode.trim(),
      contacts: contacts.map(c => ({
        ...c,
        name: c.name.trim(),
        designation: c.designation.trim(),
        contactNumber: c.contactNumber.trim(),
        email: c.email.toLowerCase().trim(),
      })),
      onboardedBy: onboardedBy.trim(),
      registeredBy: req.user._id,
    });
    return sendSuccess(res, 201, "Organisation registered successfully.", { organisation });
  } catch (err) {
    if (err.code === 11000) return sendError(res, 409, "A record with this information already exists.");
    if (err.name === "ValidationError") return sendError(res, 422, Object.values(err.errors).map(e => e.message).join(" | "));
    throw err;
  }
});

/**
 * GET /api/v1/organisations
 * Returns a list of organisations with optional filters and search.
 */
export const getAllOrganisations = asyncHandler(async (req, res) => {
  const {
    page = 1, limit = 12,
    search, status, state, city, centreType,
  } = req.query;

  const query = {};
  if (search) query.$text = { $search: search };
  if (status) query.status = status;
  if (state) query.state = state;
  if (city) query.city = city;
  if (centreType) query.centreType = centreType;

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const [organisations, total] = await Promise.all([
    Organisation.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean(),
    Organisation.countDocuments(query),
  ]);

  return sendSuccess(res, 200, "Organisations retrieved successfully.", {
    organisations,
    total,
    page: parseInt(page),
    pages: Math.ceil(total / parseInt(limit)),
  });
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
    "city", "state", "pincode", "contacts", "onboardedBy", "status",
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
    if (err.name === "ValidationError") return sendError(res, 422, Object.values(err.errors).map(e => e.message).join(" | "));
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

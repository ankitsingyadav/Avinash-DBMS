// controllers/userManagement.controller.js
// ─── Full Admin: manage users and their permissions ───────────────────────────
import User from "../models/user.model.js";
import { asyncHandler, sendSuccess, sendError } from "../utils/response.utils.js";

const ALLOWED_ROLES = ["full_admin", "partial_admin", "data_entry", "user"];
const ALLOWED_ACTIONS = ["view", "add", "edit", "delete"];
const ALLOWED_MODULES = [
  "volunteer",
  "organisation",
  "School",
  "College",
  "NGO",
  "Corporate",
  "Online",
  "Community Centre",
];

// Sanitise permissions payload from request body
const sanitisePermissions = (perms = {}) => ({
  allowedModules: Array.isArray(perms.allowedModules)
    ? perms.allowedModules.filter((m) => ALLOWED_MODULES.includes(m))
    : [],
  allowedActions: Array.isArray(perms.allowedActions)
    ? perms.allowedActions.filter((a) => ALLOWED_ACTIONS.includes(a))
    : [],
  hiddenFields: Array.isArray(perms.hiddenFields)
    ? perms.hiddenFields.filter((f) => ["phone", "email"].includes(f))
    : [],
  dateFrom: perms.dateFrom ? new Date(perms.dateFrom) : null,
  dateTo:   perms.dateTo   ? new Date(perms.dateTo)   : null,
});

// ── GET /api/v1/users ─────────────────────────────────────────────────────────
export const getAllUsers = asyncHandler(async (req, res) => {
  const users = await User.find({})
    .select("-passwordResetToken -passwordResetExpires")
    .sort({ createdAt: -1 })
    .lean();

  // Attach avatar virtual manually (lean() strips virtuals)
  const withAvatars = users.map((u) => {
    const initials = (u.fullName || "U")
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
    return {
      ...u,
      avatar: u.profileImage?.url ||
        `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=6366f1&color=fff&size=200`,
    };
  });

  return sendSuccess(res, 200, "Users retrieved successfully.", {
    users: withAvatars,
    total: withAvatars.length,
  });
});

// ── POST /api/v1/users — Create a managed user ────────────────────────────────
export const createManagedUser = asyncHandler(async (req, res) => {
  const { fullName, email, phone, password, age, role, permissions } = req.body;

  if (!fullName || !email || !phone || !password || !age) {
    return sendError(res, 422, "All fields are required: fullName, email, phone, password, age.");
  }

  const assignedRole = ALLOWED_ROLES.includes(role) ? role : "user";

  // Prevent creating another full_admin unless explicitly allowed
  if (assignedRole === "full_admin" && !req.user.isFullAdmin()) {
    return sendError(res, 403, "Only a full admin can create another full admin.");
  }

  const existing = await User.findOne({ $or: [{ email: email.toLowerCase() }, { phone }] });
  if (existing) {
    return sendError(res, 409, "A user with this email or phone already exists.");
  }

  const user = await User.create({
    fullName:    fullName.trim(),
    email:       email.toLowerCase().trim(),
    phone:       phone.trim(),
    password,
    age:         parseInt(age),
    role:        assignedRole,
    permissions: sanitisePermissions(permissions),
  });

  const userObj = user.toObject();
  delete userObj.password;
  delete userObj.refreshToken;

  return sendSuccess(res, 201, "User created successfully.", {
    user: { ...userObj, avatar: user.avatar },
  });
});

// ── PATCH /api/v1/users/:id/permissions ──────────────────────────────────────
export const updateUserPermissions = asyncHandler(async (req, res) => {
  const { role, permissions, isActive } = req.body;

  const user = await User.findById(req.params.id);
  if (!user) return sendError(res, 404, "User not found.");

  // Prevent non-full-admins from being promoted to full_admin by others
  if (role === "full_admin" && !req.user.isFullAdmin()) {
    return sendError(res, 403, "You cannot assign the full_admin role.");
  }

  if (role && ALLOWED_ROLES.includes(role))  user.role = role;
  if (typeof isActive === "boolean")          user.isActive = isActive;
  if (permissions)                            user.permissions = sanitisePermissions(permissions);

  await user.save({ validateBeforeSave: false });

  const userObj = user.toObject();
  delete userObj.password;
  delete userObj.refreshToken;

  return sendSuccess(res, 200, "User permissions updated successfully.", {
    user: { ...userObj, avatar: user.avatar },
  });
});

// ── PATCH /api/v1/users/:id/status — Toggle active/inactive ──────────────────
export const toggleUserStatus = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return sendError(res, 404, "User not found.");

  // Prevent full_admin from deactivating themselves
  if (user._id.toString() === req.user._id.toString()) {
    return sendError(res, 400, "You cannot change your own account status.");
  }

  user.isActive = !user.isActive;
  await user.save({ validateBeforeSave: false });

  return sendSuccess(
    res,
    200,
    `User ${user.isActive ? "activated" : "deactivated"} successfully.`,
    { isActive: user.isActive }
  );
});

// ── DELETE /api/v1/users/:id ──────────────────────────────────────────────────
export const deleteUser = asyncHandler(async (req, res) => {
  if (req.params.id === req.user._id.toString()) {
    return sendError(res, 400, "You cannot delete your own account.");
  }

  const user = await User.findByIdAndDelete(req.params.id);
  if (!user) return sendError(res, 404, "User not found.");

  return sendSuccess(res, 200, "User deleted successfully.");
});

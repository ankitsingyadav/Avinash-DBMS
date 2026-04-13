// middleware/permission.middleware.js
// ─── Role + permission checks for the 3-tier RBAC system ─────────────────────
import { sendError } from "../utils/response.utils.js";

// ─── Role helpers (internal) ──────────────────────────────────────────────────
const isFullAdmin    = (user) => user?.role === "full_admin" || user?.role === "admin";
const isPartialAdmin = (user) => user?.role === "partial_admin";
const isDataEntry    = (user) => user?.role === "data_entry";

// ─── requireRole(...roles) ────────────────────────────────────────────────────
export const requireRole = (...roles) => {
  const normalised = new Set(roles);
  if (normalised.has("admin"))      normalised.add("full_admin");
  if (normalised.has("full_admin")) normalised.add("admin");

  return (req, res, next) => {
    if (!req.user) return sendError(res, 401, "Authentication required.");
    if (!normalised.has(req.user.role)) {
      return sendError(res, 403, "You do not have permission to perform this action.");
    }
    next();
  };
};

// ─── checkModuleAccess(module) ────────────────────────────────────────────────
// "volunteer" and "organisation" are the two top-level modules.
// For organisations, partial_admin may also be scoped to specific centreTypes
// (School, College, NGO, etc.) which are stored in allowedModules.
// This middleware grants access if:
//   - user is full_admin (always pass)
//   - user is data_entry (always pass — scoped by data ownership at query level)
//   - user is partial_admin AND allowedModules contains the module key OR any
//     centreType sub-module (e.g. "School" implies access to "organisation")
export const checkModuleAccess = (module) => (req, res, next) => {
  if (!req.user) return sendError(res, 401, "Authentication required.");

  // Full admin — unrestricted
  if (isFullAdmin(req.user)) return next();

  // Data entry — always passes module check (ownership scoped at query level)
  if (isDataEntry(req.user)) return next();

  // Partial admin — check allowedModules
  if (isPartialAdmin(req.user)) {
    const allowed = req.user.permissions?.allowedModules ?? [];

    // Direct match (e.g. "volunteer" or "organisation")
    if (allowed.includes(module)) return next();

    // centreType sub-modules imply access to "organisation"
    // e.g. if allowedModules = ["School","NGO"], partial_admin can access /organisations
    const CENTRE_TYPE_MODULES = ["School", "College", "NGO", "Corporate", "Online", "Community Centre"];
    if (module === "organisation" && allowed.some((m) => CENTRE_TYPE_MODULES.includes(m))) {
      return next();
    }

    return sendError(res, 403, `You do not have access to the '${module}' module.`);
  }

  // role === "user" — no access to data modules
  return sendError(res, 403, "You do not have permission to access this resource.");
};

// ─── checkActionAccess(action) ───────────────────────────────────────────────
// action: "view" | "add" | "edit" | "delete"
// full_admin: always passes.
// partial_admin / data_entry: must have the action in allowedActions.
export const checkActionAccess = (action) => (req, res, next) => {
  if (!req.user) return sendError(res, 401, "Authentication required.");

  // Full admin — unrestricted
  if (isFullAdmin(req.user)) return next();

  const allowed = req.user.permissions?.allowedActions ?? [];
  if (!allowed.includes(action)) {
    return sendError(res, 403, `You do not have permission to '${action}' records.`);
  }
  next();
};

// ─── applyDataScope ───────────────────────────────────────────────────────────
// For data_entry: restrict queries to their own records only.
// For others: empty scope (no restriction).
export const applyDataScope = (req, res, next) => {
  if (isDataEntry(req.user)) {
    // volunteer model uses "registered_by", organisation uses "registeredBy"
    // We attach both keys so each controller can pick what it needs
    req._dataScope = {
      $or: [
        { registered_by: req.user._id },
        { registeredBy:  req.user._id },
      ],
    };
  } else {
    req._dataScope = {};
  }
  next();
};

// ─── applyDateRangeScope ─────────────────────────────────────────────────────
// For partial_admin with a date restriction window in their permissions.
export const applyDateRangeScope = (req, res, next) => {
  if (isPartialAdmin(req.user)) {
    const { dateFrom, dateTo } = req.user.permissions ?? {};
    if (dateFrom || dateTo) {
      req._dateScope = { createdAt: {} };
      if (dateFrom) req._dateScope.createdAt.$gte = new Date(dateFrom);
      if (dateTo)   req._dateScope.createdAt.$lte = new Date(
        new Date(dateTo).setHours(23, 59, 59, 999)
      );
    } else {
      req._dateScope = {};
    }
  } else {
    req._dateScope = {};
  }
  next();
};

// ─── stripHiddenFields ───────────────────────────────────────────────────────
// Remove fields from records that the user is not allowed to see.
export const stripHiddenFields = (data, hiddenFields = []) => {
  if (!hiddenFields || hiddenFields.length === 0) return data;

  const strip = (obj) => {
    if (!obj || typeof obj !== "object") return obj;
    const result = { ...obj };
    hiddenFields.forEach((field) => delete result[field]);

    // Strip from nested contacts array
    if (Array.isArray(result.contacts)) {
      result.contacts = result.contacts.map((c) => {
        const contact = { ...c };
        hiddenFields.forEach((field) => delete contact[field]);
        // contactNumber is the phone alias in contacts
        if (hiddenFields.includes("phone")) delete contact.contactNumber;
        return contact;
      });
    }
    return result;
  };

  return Array.isArray(data) ? data.map(strip) : strip(data);
};

// ─── getHiddenFields ─────────────────────────────────────────────────────────
export const getHiddenFields = (req) => {
  if (isFullAdmin(req.user)) return [];
  return req.user.permissions?.hiddenFields ?? [];
};

// ─── verifyOwnRecord ─────────────────────────────────────────────────────────
export const verifyOwnRecord = (record, userId) => {
  const owner =
    record?.registeredBy?.toString() ||
    record?.registered_by?.toString();
  return owner === userId.toString();
};
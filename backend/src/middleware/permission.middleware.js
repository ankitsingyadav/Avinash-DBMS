// middleware/permission.middleware.js
// ─── Role + permission checks for the 3-tier RBAC system ─────────────────────
import { sendError } from "../utils/response.utils.js";

// ─── Role aliases ─────────────────────────────────────────────────────────────
// "admin" is the legacy role — treated exactly as "full_admin" everywhere.
const isFullAdmin = (user) => user?.role === "full_admin" || user?.role === "admin";
const isPartialAdmin = (user) => user?.role === "partial_admin";
const isDataEntry = (user) => user?.role === "data_entry";

// ─── requireRole(...roles) ────────────────────────────────────────────────────
// Drop-in replacement for the old restrictTo().
// Accepts role strings; "admin" and "full_admin" are always synonymous.
export const requireRole = (...roles) => {
  // Normalise: if caller lists "admin", also accept "full_admin" and vice versa
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
// Verifies the user can access a specific data module.
// full_admin: always passes. partial_admin: checks allowedModules. data_entry: always passes.
export const checkModuleAccess = (module) => (req, res, next) => {
  if (!req.user) return sendError(res, 401, "Authentication required.");
  if (isFullAdmin(req.user)) return next();

  if (isPartialAdmin(req.user)) {
    const allowed = req.user.permissions?.allowedModules ?? [];
    if (!allowed.includes(module)) {
      return sendError(res, 403, `You do not have access to the '${module}' module.`);
    }
  }
  // data_entry: module access not restricted at route level (scoped by data ownership)
  next();
};

// ─── checkActionAccess(action) ───────────────────────────────────────────────
// action: "view" | "add" | "edit" | "delete"
export const checkActionAccess = (action) => (req, res, next) => {
  if (!req.user) return sendError(res, 401, "Authentication required.");
  if (isFullAdmin(req.user)) return next();

  const allowed = req.user.permissions?.allowedActions ?? [];
  if (!allowed.includes(action)) {
    return sendError(res, 403, `You do not have permission to '${action}' records.`);
  }
  next();
};

// ─── applyDataScope ───────────────────────────────────────────────────────────
// For data_entry users: restrict all queries to records they created.
// Attaches req._dataScope = { registeredBy: userId } for controllers to use.
// For partial_admin / full_admin: attaches an empty scope.
export const applyDataScope = (req, res, next) => {
  if (isDataEntry(req.user)) {
    req._dataScope = { registeredBy: req.user._id };
  } else {
    req._dataScope = {};
  }
  next();
};

// ─── applyDateRangeScope ─────────────────────────────────────────────────────
// For partial_admin with date restrictions: merges the permission date window
// into req._dateScope so controllers can add it to their queries.
export const applyDateRangeScope = (req, res, next) => {
  if (isPartialAdmin(req.user)) {
    const { dateFrom, dateTo } = req.user.permissions ?? {};
    if (dateFrom || dateTo) {
      req._dateScope = { createdAt: {} };
      if (dateFrom) req._dateScope.createdAt.$gte = new Date(dateFrom);
      if (dateTo)   req._dateScope.createdAt.$lte = new Date(new Date(dateTo).setHours(23, 59, 59, 999));
    } else {
      req._dateScope = {};
    }
  } else {
    req._dateScope = {};
  }
  next();
};

// ─── stripHiddenFields(data, hiddenFields) ───────────────────────────────────
// Pure function — removes fields listed in user.permissions.hiddenFields from
// a single record object or an array of records. Works recursively on contacts[].
export const stripHiddenFields = (data, hiddenFields = []) => {
  if (!hiddenFields || hiddenFields.length === 0) return data;

  const strip = (obj) => {
    if (!obj || typeof obj !== "object") return obj;
    const result = { ...obj };
    hiddenFields.forEach((field) => {
      delete result[field];
    });
    // Strip from nested contacts array (organisation model)
    if (Array.isArray(result.contacts)) {
      result.contacts = result.contacts.map((c) => {
        const contact = { ...c };
        hiddenFields.forEach((field) => delete contact[field]);
        // Map contactNumber → phone alias
        if (hiddenFields.includes("phone")) delete contact.contactNumber;
        return contact;
      });
    }
    return result;
  };

  return Array.isArray(data) ? data.map(strip) : strip(data);
};

// ─── getHiddenFields(req) ────────────────────────────────────────────────────
// Helper for controllers: returns the hidden fields array for the current user.
export const getHiddenFields = (req) => {
  if (isFullAdmin(req.user)) return [];
  return req.user.permissions?.hiddenFields ?? [];
};

// ─── verifyOwnRecord ─────────────────────────────────────────────────────────
// For data_entry: reject update/delete if the record does not belong to them.
// Call with the fetched document (must have .registeredBy or .registered_by).
export const verifyOwnRecord = (record, userId) => {
  const owner =
    record?.registeredBy?.toString() ||
    record?.registered_by?.toString();
  return owner === userId.toString();
};
